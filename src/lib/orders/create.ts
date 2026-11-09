import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { CreateOrderInput } from "./schemas";

const ORDER_MINUTES = 10;

export type CreateOrderResult =
  | { ok: true; orderId: string; providerRef: string; amount: number; expiresAt: Date }
  | { ok: false; error: string };

function fail(error: string): CreateOrderResult {
  return { ok: false, error };
}

type Row = {
  ticketTypeId: string;
  seatId: string | null;
  price: number;
  holderName: string | null;
};

export async function createOrderForUser(
  userId: string,
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ORDER_MINUTES * 60 * 1000);

  const typeIds = [...new Set(input.items.map((item) => item.ticketTypeId))].sort();
  if (typeIds.length !== input.items.length) {
    return fail("Each ticket type may appear only once in an order.");
  }

  return db.$transaction(async (tx) => {
    // Lock each ticket type row, always in the same order. Other buyers of the
    // same ticket type wait here, then count stock after we have committed.
    for (const id of typeIds) {
      await tx.$queryRaw`SELECT id FROM ticket_types WHERE id = ${id} FOR UPDATE`;
    }

    const ticketTypes = await tx.ticketType.findMany({
      where: { id: { in: typeIds }, eventId: input.eventId },
    });
    const byId = new Map(ticketTypes.map((type) => [type.id, type]));

    const rows: Row[] = [];
    const seatIds: string[] = [];
    let amount = 0;

    for (const item of input.items) {
      const type = byId.get(item.ticketTypeId);
      if (!type) return fail("That ticket type does not belong to this event.");

      if (type.saleStartsAt && type.saleStartsAt > now) {
        return fail(`Tickets of type "${type.name}" are not on sale yet.`);
      }
      if (type.saleEndsAt && type.saleEndsAt < now) {
        return fail(`Tickets of type "${type.name}" are no longer on sale.`);
      }

      const wanted = item.seatIds ? item.seatIds.length : (item.quantity ?? 0);
      if (item.seatIds && !type.seated) {
        return fail(`Tickets of type "${type.name}" have no assigned seats.`);
      }
      if (!item.seatIds && type.seated) {
        return fail(`Choose seats for tickets of type "${type.name}".`);
      }
      if (item.seatIds && new Set(item.seatIds).size !== item.seatIds.length) {
        return fail("A seat was listed twice.");
      }
      // When names are given there must be exactly one per ticket.
      if (item.holderNames && item.holderNames.length !== wanted) {
        return fail("Enter one name for every ticket.");
      }

      // Stock in use: paid orders, plus unpaid orders that have not expired.
      const activeOrder = {
        OR: [{ status: "PAID" as const }, { status: "PENDING" as const, expiresAt: { gt: now } }],
      };
      const taken = await tx.orderItem.count({
        where: { ticketTypeId: type.id, order: activeOrder },
      });
      if (taken + wanted > type.quantity) {
        return fail(`Not enough tickets left of type "${type.name}".`);
      }

      if (type.maxPerCustomer !== null) {
        const mine = await tx.orderItem.count({
          where: { ticketTypeId: type.id, order: { userId, ...activeOrder } },
        });
        if (mine + wanted > type.maxPerCustomer) {
          return fail(`You can buy at most ${type.maxPerCustomer} tickets of type "${type.name}".`);
        }
      }

      if (item.seatIds) {
        for (const [index, seatId] of item.seatIds.entries()) {
          rows.push({
            ticketTypeId: type.id,
            seatId,
            price: type.price,
            holderName: item.holderNames?.[index] ?? null,
          });
          seatIds.push(seatId);
        }
      } else {
        for (let index = 0; index < wanted; index++) {
          rows.push({
            ticketTypeId: type.id,
            seatId: null,
            price: type.price,
            holderName: item.holderNames?.[index] ?? null,
          });
        }
      }
      amount += type.price * wanted;
    }

    if (seatIds.length > 0) {
      // Lock this user's hold rows, so two checkouts started at the same moment
      // cannot both take the same seat.
      await tx.$queryRaw`
        SELECT id FROM seat_reservations
        WHERE event_id = ${input.eventId}
          AND user_id = ${userId}
          AND seat_id IN (${Prisma.join(seatIds)})
        ORDER BY id
        FOR UPDATE`;

      // A seat that is already in another order must not be charged again.
      const alreadyOrdered = await tx.orderItem.count({
        where: {
          seatId: { in: seatIds },
          order: {
            eventId: input.eventId,
            OR: [{ status: "PAID" }, { status: "PENDING", expiresAt: { gt: now } }],
          },
        },
      });
      if (alreadyOrdered > 0) {
        return fail(
          "One of these seats is already in another order. Pay or cancel that order first.",
        );
      }

      // Every seat must be held by this user, and the hold must still be alive.
      const holds = await tx.seatReservation.findMany({
        where: {
          eventId: input.eventId,
          userId,
          status: "HELD",
          seatId: { in: seatIds },
          expiresAt: { gt: now },
        },
        select: { id: true },
      });
      if (holds.length !== seatIds.length) {
        return fail("Your hold on one of these seats has expired, or the seat is not yours.");
      }

      // Keep the seats held for as long as the order is waiting for payment.
      await tx.seatReservation.updateMany({
        where: { id: { in: holds.map((hold) => hold.id) } },
        data: { expiresAt },
      });
    }

    const order = await tx.order.create({
      data: {
        userId,
        eventId: input.eventId,
        expiresAt,
        items: { create: rows },
        payment: {
          create: { providerRef: `momo_${randomUUID()}`, phone: input.phone, amount },
        },
      },
      include: { payment: true },
    });
    if (!order.payment) throw new Error("Order was created without a payment.");

    return {
      ok: true,
      orderId: order.id,
      providerRef: order.payment.providerRef,
      amount,
      expiresAt,
    } satisfies CreateOrderResult;
  });
}

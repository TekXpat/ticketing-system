import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export type PaymentOutcome = "success" | "failed" | "timeout";

export type SettleResult =
  | { ok: true; duplicate: boolean; paymentStatus: string; ticketsIssued: number }
  | { ok: false; error: string };

export async function settlePayment(
  providerRef: string,
  outcome: PaymentOutcome,
): Promise<SettleResult> {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { providerRef },
      include: { order: { include: { items: true } } },
    });
    if (!payment) return { ok: false, error: "Unknown payment." } satisfies SettleResult;

    const target =
      outcome === "success" ? "CONFIRMED" : outcome === "failed" ? "FAILED" : "TIMED_OUT";

    // Only one copy of a callback can move the payment out of PENDING.
    // The others wait for the row, then find it already settled and change nothing.
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: target, completedAt: new Date() },
    });
    if (claimed.count === 0) {
      const current = await tx.payment.findUnique({
        where: { id: payment.id },
        select: { status: true },
      });
      return {
        ok: true,
        duplicate: true,
        paymentStatus: current?.status ?? payment.status,
        ticketsIssued: 0,
      } satisfies SettleResult;
    }

    const { order } = payment;
    const done = (ticketsIssued: number) =>
      ({ ok: true, duplicate: false, paymentStatus: target, ticketsIssued }) satisfies SettleResult;

    // The order was already closed another way: nothing more to do.
    if (order.status !== "PENDING") return done(0);

    const seatIds = order.items.flatMap((item) => (item.seatId ? [item.seatId] : []));
    const releaseSeats = () =>
      tx.seatReservation.deleteMany({
        where: {
          eventId: order.eventId,
          userId: order.userId,
          status: "HELD",
          seatId: { in: seatIds },
        },
      });

    if (outcome !== "success") {
      await tx.order.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: { status: outcome === "failed" ? "FAILED" : "EXPIRED" },
      });
      if (seatIds.length > 0) await releaseSeats();
      return done(0);
    }

    if (seatIds.length > 0) {
      // Lock the seat rows. If another request is deleting an expired hold at
      // this instant, one of us gets the row first and the other sees the result.
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM seat_reservations
        WHERE event_id = ${order.eventId}
          AND user_id = ${order.userId}
          AND status = 'HELD'
          AND seat_id IN (${Prisma.join(seatIds)})
        FOR UPDATE`;

      if (locked.length !== seatIds.length) {
        // A seat was lost before the payment settled. Money was taken, so this
        // needs a refund, which is out of scope. No tickets are issued.
        await tx.order.updateMany({
          where: { id: order.id, status: "PENDING" },
          data: { status: "FAILED" },
        });
        await releaseSeats();
        return done(0);
      }

      await tx.seatReservation.updateMany({
        where: { id: { in: locked.map((row) => row.id) } },
        data: { status: "SOLD" },
      });
    }

    await tx.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "PAID" },
    });

    // The unique orderItemId means one ticket per purchase, even if this ran twice.
    const issued = await tx.ticket.createMany({
      data: order.items.map((item) => ({
        orderItemId: item.id,
        eventId: order.eventId,
        ticketTypeId: item.ticketTypeId,
        seatId: item.seatId,
      })),
      skipDuplicates: true,
    });
    return done(issued.count);
  });
}
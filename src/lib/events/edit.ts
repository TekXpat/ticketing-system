import { db } from "@/lib/db";
import type { UpdateEventInput } from "./update-schema";

export type EditResult = { ok: true } | { ok: false; error: string };

// Tickets in use: paid orders, plus unpaid orders that have not expired.
const activeOrder = (now: Date) => ({
  OR: [{ status: "PAID" as const }, { status: "PENDING" as const, expiresAt: { gt: now } }],
});

// Changes an event the organiser owns. Rules:
// - a price change affects new orders only (old items keep their copied price)
// - a standing quantity cannot go below what is already sold or reserved
// - a seated quantity is the number of seats and cannot change
export async function updateEventForOrganiser(
  organiserId: string,
  eventId: string,
  input: UpdateEventInput,
): Promise<EditResult> {
  const now = new Date();

  return db.$transaction(async (tx): Promise<EditResult> => {
    const event = await tx.event.findFirst({
      where: { id: eventId, organiserId },
      include: { ticketTypes: true },
    });
    if (!event) return { ok: false, error: "Event not found." };

    // Lock the ticket types so the sold count cannot change while we compare.
    for (const id of event.ticketTypes.map((type) => type.id).sort()) {
      await tx.$queryRaw`SELECT id FROM ticket_types WHERE id = ${id} FOR UPDATE`;
    }

    if (input.ticketTypes.length !== event.ticketTypes.length) {
      return { ok: false, error: "Send every ticket type of the event." };
    }

    const names = new Set<string>();
    for (const change of input.ticketTypes) {
      const key = change.name.toLowerCase();
      if (names.has(key)) {
        return { ok: false, error: `Two ticket types are called "${change.name}".` };
      }
      names.add(key);
    }

    for (const change of input.ticketTypes) {
      const current = event.ticketTypes.find((type) => type.id === change.id);
      if (!current) return { ok: false, error: "That ticket type does not belong to this event." };

      if (current.seated) {
        if (change.quantity !== current.quantity) {
          return {
            ok: false,
            error: `The number of seats for "${current.name}" cannot be changed after the event is created.`,
          };
        }
        continue;
      }

      const sold = await tx.orderItem.count({
        where: { ticketTypeId: current.id, order: activeOrder(now) },
      });
      if (change.quantity < sold) {
        return {
          ok: false,
          error: `You already sold or reserved ${sold} tickets of type "${current.name}", so the quantity cannot go below ${sold}.`,
        };
      }
    }

    await tx.event.update({
      where: { id: eventId },
      data: { title: input.title, location: input.location ?? null, startsAt: input.startsAt },
    });
    for (const change of input.ticketTypes) {
      await tx.ticketType.update({
        where: { id: change.id },
        data: {
          name: change.name,
          price: change.price,
          quantity: change.quantity,
          maxPerCustomer: change.maxPerCustomer ?? null,
        },
      });
    }
    return { ok: true };
  });
}

// Deletes an event the organiser owns, but only when nobody has paid or reserved
// tickets. Cancelling a sold event would need refunds, which are out of scope.
export async function deleteEventForOrganiser(
  organiserId: string,
  eventId: string,
): Promise<EditResult> {
  const event = await db.event.findFirst({
    where: { id: eventId, organiserId },
    select: { id: true },
  });
  if (!event) return { ok: false, error: "Event not found." };

  const busy = await db.order.count({ where: { eventId, ...activeOrder(new Date()) } });
  if (busy > 0) {
    return { ok: false, error: "This event has sold or reserved tickets, so it cannot be deleted." };
  }

  // Old failed or expired orders point at the ticket types, so they go first.
  await db.$transaction([
    db.order.deleteMany({ where: { eventId } }),
    db.event.delete({ where: { id: eventId } }),
  ]);
  return { ok: true };
}
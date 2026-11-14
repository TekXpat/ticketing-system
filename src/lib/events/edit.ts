import { db } from "@/lib/db";

export type EditResult = { ok: true } | { ok: false; error: string };

// Update an event's metadata and ticket type prices/quantities.
// Rules:
//   - Only the event's organiser may edit it.
//   - Standing quantity cannot go below what is already sold.
//   - Seated events: seat count is fixed (the grid does not change).
//   - Price changes apply to new orders only (existing order items keep their price).
export async function updateEvent(
  eventId: string,
  organiserId: string,
  data: {
    title: string;
    kind: string;
    location?: string;
    startsAt: Date;
    ticketTypes: { id?: string; name: string; price: number; quantity: number }[];
  },
): Promise<EditResult> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { ticketTypes: true },
  });

  if (!event) return { ok: false, error: "Event not found." };
  if (event.organiserId !== organiserId) return { ok: false, error: "Not your event." };

  // Check quantity floors for existing types.
  for (const incoming of data.ticketTypes) {
    if (!incoming.id) continue;
    const existing = event.ticketTypes.find((t) => t.id === incoming.id);
    if (!existing) continue;

    if (existing.seated) {
      // Seated: quantity is locked to the layout size.
      if (incoming.quantity !== existing.quantity) {
        return { ok: false, error: `Seat count for "${existing.name}" cannot change.` };
      }
    } else {
      // Standing: cannot go below sold.
      const sold = await db.orderItem.count({
        where: { ticketTypeId: existing.id, order: { status: "PAID" } },
      });
      if (incoming.quantity < sold) {
        return {
          ok: false,
          error: `"${existing.name}" has ${sold} sold — quantity cannot go below that.`,
        };
      }
    }
  }

  await db.$transaction(async (tx) => {
    // Update event metadata.
    await tx.event.update({
      where: { id: eventId },
      data: {
        title: data.title,
        kind: data.kind,
        location: data.location ?? null,
        startsAt: data.startsAt,
      },
    });

    // Upsert each ticket type.
    for (const type of data.ticketTypes) {
      if (type.id) {
        await tx.ticketType.update({
          where: { id: type.id },
          data: { name: type.name, price: type.price, quantity: type.quantity },
        });
      } else {
        await tx.ticketType.create({
          data: {
            eventId,
            name: type.name,
            price: type.price,
            quantity: type.quantity,
            seated: false,
          },
        });
      }
    }
  });

  return { ok: true };
}

// Delete an event.
// Rules:
//   - Only the organiser may delete.
//   - If any PAID order exists, refuse (preserve ticket records).
export async function deleteEvent(eventId: string, organiserId: string): Promise<EditResult> {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { orders: { where: { status: "PAID" }, take: 1 } },
  });

  if (!event) return { ok: false, error: "Event not found." };
  if (event.organiserId !== organiserId) return { ok: false, error: "Not your event." };
  if (event.orders.length > 0) {
    return {
      ok: false,
      error: "This event has paid orders. Cancel all orders before deleting.",
    };
  }

  await db.event.delete({ where: { id: eventId } });
  return { ok: true };
}

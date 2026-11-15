import { db } from "@/lib/db";

export type EditResult = { ok: true } | { ok: false; error: string };

type UpdateInput = {
  title: string;
  startsAt: Date;
  ticketTypes: {
    id?: string;
    name: string;
    price: number;
    quantity: number;
    maxPerCustomer?: number | null;
  }[];
  kind?: string;
  location?: string;
};

// Update an event's metadata and ticket type prices/quantities.
// Rules:
//   - Only the event's organiser may edit it.
//   - Standing quantity cannot go below what is already sold or reserved.
//   - Seated events: seat count is fixed (the grid does not change).
//   - Price changes apply to new orders only (existing order items keep their price).
export async function updateEventForOrganiser(
  organiserId: string,
  eventId: string,
  data: UpdateInput,
): Promise<EditResult> {
  const event = await db.event.findUnique({
    where: { id: eventId, organiserId },
    include: { ticketTypes: true },
  });

  if (!event) return { ok: false, error: "Event not found." };

  // Check quantity floors for existing types.
  for (const incoming of data.ticketTypes) {
    if (!incoming.id) continue;
    const existing = event.ticketTypes.find((t) => t.id === incoming.id);
    if (!existing) continue;

    if (existing.seated) {
      if (incoming.quantity !== existing.quantity) {
        return { ok: false, error: `Seat count for "${existing.name}" cannot change.` };
      }
    } else {
      const soldOrReserved = await db.orderItem.count({
        where: {
          ticketTypeId: existing.id,
          order: { status: { in: ["PAID", "PENDING"] } },
        },
      });
      if (incoming.quantity < soldOrReserved) {
        return {
          ok: false,
          error: `"${existing.name}" already sold or reserved ${soldOrReserved} — quantity cannot go below that.`,
        };
      }
    }
  }

  await db.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: eventId },
      data: {
        title: data.title,
        kind: data.kind ?? event.kind,
        location: data.location ?? event.location,
        startsAt: data.startsAt,
      },
    });

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
//   - If any PAID or PENDING order exists, refuse.
export async function deleteEventForOrganiser(
  organiserId: string,
  eventId: string,
): Promise<EditResult> {
  const event = await db.event.findUnique({
    where: { id: eventId, organiserId },
    include: {
      orders: {
        where: { status: { in: ["PAID", "PENDING"] } },
        take: 1,
      },
    },
  });

  if (!event) return { ok: false, error: "Event not found." };
  if (event.orders.length > 0) {
    return {
      ok: false,
      error: "This event has active orders. Cancel all orders before deleting.",
    };
  }

  await db.event.delete({ where: { id: eventId } });
  return { ok: true };
}

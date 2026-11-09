"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { seatsReadyToCheckOut } from "@/lib/seats/mine";
import { createOrderForUser } from "./create";

export type CheckoutState = { error?: string };

// Turns the signed-in user's held seats that are not yet in an order into an
// order. Each seat needs a name, sent as name-<seatId>. Seats are grouped by the
// ticket type that sells their section, so business and economy are priced apart.
export async function checkoutHeldSeats(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const user = await requireUser();
  const eventId = String(formData.get("eventId") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { ticketTypes: { where: { seated: true } } },
  });
  if (!event || event.ticketTypes.length === 0) {
    return { error: "This event has no seated tickets." };
  }
  const byKey = new Map(event.ticketTypes.map((type) => [type.section ?? "main", type]));

  const holds = await seatsReadyToCheckOut(user.id, eventId);
  if (holds.length === 0) return { error: "You have no held seats ready to pay for." };

  const groups = new Map<
    string,
    { ticketTypeId: string; seatIds: string[]; holderNames: string[] }
  >();
  for (const hold of holds) {
    const type = byKey.get(hold.seat.section);
    if (!type) return { error: `Seat ${hold.seat.label} is not for sale.` };

    const name = String(formData.get(`name-${hold.seatId}`) ?? "").trim();
    if (!name || name.length > 100) {
      return { error: "Enter a name (up to 100 letters) for every ticket." };
    }

    const group = groups.get(type.id) ?? { ticketTypeId: type.id, seatIds: [], holderNames: [] };
    group.seatIds.push(hold.seatId);
    group.holderNames.push(name);
    groups.set(type.id, group);
  }

  const result = await createOrderForUser(user.id, {
    eventId,
    phone,
    items: [...groups.values()],
  });
  if (!result.ok) return { error: result.error };

  redirect(`/orders/${result.orderId}`);
}

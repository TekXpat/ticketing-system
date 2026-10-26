"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { createOrderForUser } from "./create";

export type CheckoutState = { error?: string };

// Turns the signed-in user's live seat holds for one event into an order.
export async function checkoutHeldSeats(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const user = await requireUser();
  const eventId = String(formData.get("eventId") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { ticketTypes: { where: { seated: true }, orderBy: { price: "asc" } } },
  });
  const ticketType = event?.ticketTypes[0];
  if (!event || !ticketType) return { error: "This event has no seated tickets." };

  const holds = await db.seatReservation.findMany({
    where: { eventId, userId: user.id, status: "HELD", expiresAt: { gt: new Date() } },
    select: { seatId: true },
  });
  if (holds.length === 0) return { error: "You have no held seats. Pick a seat first." };

  const result = await createOrderForUser(user.id, {
    eventId,
    phone,
    items: [{ ticketTypeId: ticketType.id, seatIds: holds.map((hold) => hold.seatId) }],
  });
  if (!result.ok) return { error: result.error };

  redirect(`/orders/${result.orderId}`);
}

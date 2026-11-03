"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { seatsReadyToCheckOut } from "@/lib/seats/mine";
import { createOrderForUser } from "./create";

export type CheckoutState = { error?: string };

// Turns the signed-in user's held seats that are not yet in an order into an
// order. Each seat needs a name, sent as name-<seatId>.
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

  const holds = await seatsReadyToCheckOut(user.id, eventId);
  if (holds.length === 0) return { error: "You have no held seats ready to pay for." };

  const holderNames = holds.map((hold) =>
    String(formData.get(`name-${hold.seatId}`) ?? "").trim(),
  );
  if (holderNames.some((name) => !name || name.length > 100)) {
    return { error: "Enter a name (up to 100 letters) for every ticket." };
  }

  const result = await createOrderForUser(user.id, {
    eventId,
    phone,
    items: [
      { ticketTypeId: ticketType.id, seatIds: holds.map((hold) => hold.seatId), holderNames },
    ],
  });
  if (!result.ok) return { error: result.error };

  redirect(`/orders/${result.orderId}`);
}
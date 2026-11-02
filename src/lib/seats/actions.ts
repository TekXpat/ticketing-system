"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import {
  holdSeatForUser,
  releaseAllHeldSeatsForUser,
  releaseSeatForUser,
  type HoldSeatResult,
  type ReleaseSeatResult,
} from "./hold";

export async function holdSeat(eventId: string, seatId: string): Promise<HoldSeatResult> {
  const user = await requireUser();
  return holdSeatForUser(user.id, eventId, seatId);
}

export async function releaseSeat(eventId: string, seatId: string): Promise<ReleaseSeatResult> {
  const user = await requireUser();
  return releaseSeatForUser(user.id, eventId, seatId);
}

export async function releaseMySeats(eventId: string): Promise<{ releasedSeatIds: string[] }> {
  const user = await requireUser();
  return { releasedSeatIds: await releaseAllHeldSeatsForUser(user.id, eventId) };
}

// For a plain <form>: give back my seats, then go back to the seat picker.
export async function cancelHolds(formData: FormData): Promise<void> {
  const user = await requireUser();
  const eventId = String(formData.get("eventId") ?? "");
  await releaseAllHeldSeatsForUser(user.id, eventId);
  redirect(`/events/${eventId}`);
}

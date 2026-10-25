"use server";

import { requireUser } from "@/lib/auth/session";
import { holdSeatForUser, type HoldSeatResult } from "./hold";

export async function holdSeat(eventId: string, seatId: string): Promise<HoldSeatResult> {
  const user = await requireUser();
  return holdSeatForUser(user.id, eventId, seatId);
}

"use server";

import { requireOrganiser } from "@/lib/auth/session";
import { verifyAndUseTicket, type VerifyResult } from "./verify";

export type GateState = { result?: VerifyResult };

// Only organisers run the gate. A scan marks the ticket as used.
export async function verifyTicket(_prev: GateState, formData: FormData): Promise<GateState> {
  await requireOrganiser();
  const code = String(formData.get("code") ?? "");
  return { result: await verifyAndUseTicket(code) };
}

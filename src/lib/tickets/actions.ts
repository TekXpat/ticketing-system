"use server";

import { requireGateAccess } from "@/lib/auth/session";
import { findGate } from "./gates";
import { verifyAndUseTicket, type VerifyResult } from "./verify";

export type GateState = { result?: VerifyResult; error?: string };

// Organisers and gate staff run the gate. A valid scan marks the ticket as used.
export async function verifyTicket(_prev: GateState, formData: FormData): Promise<GateState> {
  await requireGateAccess();

  const gate = findGate(String(formData.get("gate") ?? ""));
  if (!gate) return { error: "Unknown gate." };

  const code = String(formData.get("code") ?? "");
  return { result: await verifyAndUseTicket(code, gate) };
}

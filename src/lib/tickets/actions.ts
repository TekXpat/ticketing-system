"use server";

import { requireGateAccess } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { findGate, gateForKind } from "./gates";
import { verifyAndUseTicket, type VerifyResult } from "./verify";

export type GateState = { result?: VerifyResult; error?: string };

// Organisers and gate staff run the gate. A valid scan marks the ticket as used.
export async function verifyTicket(_prev: GateState, formData: FormData): Promise<GateState> {
  await requireGateAccess();

  const gate = findGate(String(formData.get("gate") ?? ""));
  if (!gate) return { error: "Unknown gate." };

  // The event being admitted must exist and belong to this gate's category.
  const eventId = String(formData.get("eventId") ?? "");
  const event = await db.event.findUnique({ where: { id: eventId }, select: { kind: true } });
  if (!event || gateForKind(event.kind)?.slug !== gate.slug) {
    return { error: "Choose an event for this gate first." };
  }

  const code = String(formData.get("code") ?? "");
  return { result: await verifyAndUseTicket(code, gate, eventId) };
}
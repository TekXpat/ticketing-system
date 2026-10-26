"use server";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { PaymentOutcome } from "./settle";

export type SimulateResult = { ok: true; message: string } | { ok: false; error: string };

// Plays the part of the mobile money provider. It sends a real HTTP request to
// the callback route, with the shared secret, so the whole endpoint is exercised.
async function sendCallback(providerRef: string, outcome: PaymentOutcome) {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  // Inside the container the app listens on port 3000, whatever APP_URL says.
  const url = `${new URL(base).protocol}//127.0.0.1:3000/api/payments/callback`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-callback-secret": process.env.PAYMENT_CALLBACK_SECRET ?? "",
    },
    body: JSON.stringify({ providerRef, outcome }),
    cache: "no-store",
  });
  return (await response.json()) as {
    duplicate?: boolean;
    paymentStatus?: string;
    ticketsIssued?: number;
    error?: string;
  };
}

export async function simulatePayment(
  orderId: string,
  outcome: PaymentOutcome,
  times: number,
): Promise<SimulateResult> {
  const user = await requireUser();
  const payment = await db.payment.findFirst({
    where: { orderId, order: { userId: user.id } },
    select: { providerRef: true },
  });
  if (!payment) return { ok: false, error: "Order not found." };

  const count = Math.min(Math.max(times, 1), 5);
  const replies = await Promise.all(
    Array.from({ length: count }, () => sendCallback(payment.providerRef, outcome)),
  );

  const failed = replies.find((reply) => reply.error);
  if (failed?.error) return { ok: false, error: failed.error };

  const winners = replies.filter((reply) => reply.duplicate === false);
  const issued = winners.reduce((sum, reply) => sum + (reply.ticketsIssued ?? 0), 0);
  return {
    ok: true,
    message: `Sent ${count} callback(s): ${winners.length} applied, ${count - winners.length} ignored as duplicates. Tickets issued: ${issued}.`,
  };
}

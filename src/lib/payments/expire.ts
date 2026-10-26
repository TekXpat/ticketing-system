import { db } from "@/lib/db";
import { settlePayment } from "./settle";

// For payments whose callback never arrived: settle them as a timeout, which
// closes the order and frees its seats. Returns how many were settled.
export async function expireOverdueOrders(): Promise<number> {
  const overdue = await db.payment.findMany({
    where: { status: "PENDING", order: { status: "PENDING", expiresAt: { lt: new Date() } } },
    select: { providerRef: true },
  });
  for (const payment of overdue) {
    await settlePayment(payment.providerRef, "timeout");
  }
  return overdue.length;
}

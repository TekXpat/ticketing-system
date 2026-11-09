"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { settlePayment } from "@/lib/payments/settle";

// Cancels an UNPAID order: the payment is closed as failed, the order becomes
// FAILED and its seats are released. Paid orders cannot be cancelled here
// (refunds are out of scope), because the payment is no longer PENDING.
export async function cancelOrder(formData: FormData): Promise<void> {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") ?? "");

  const payment = await db.payment.findFirst({
    where: { orderId, status: "PENDING", order: { userId: user.id, status: "PENDING" } },
    include: { order: { select: { eventId: true } } },
  });
  if (!payment) redirect("/events");

  await settlePayment(payment.providerRef, "failed");
  redirect(`/events/${payment.order.eventId}`);
}

import { NextResponse } from "next/server";
import { expireOverdueOrders } from "@/lib/payments/expire";
import { isValidCallbackSecret } from "@/lib/payments/secret";

// Lets a scheduler (cron, a hosting cron job) close overdue unpaid orders and
// free their seats without waiting for someone to load a page. It runs the same
// sweep the pages run. It is guarded by the same shared secret as the payment
// callback, sent in the x-callback-secret header.
export async function POST(request: Request) {
  const secret = request.headers.get("x-callback-secret");
  if (!isValidCallbackSecret(secret, process.env.PAYMENT_CALLBACK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const expired = await expireOverdueOrders();
  return NextResponse.json({ expired });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidCallbackSecret } from "@/lib/payments/secret";
import { settlePayment } from "@/lib/payments/settle";

const bodySchema = z.object({
  providerRef: z.string().trim().min(1),
  outcome: z.enum(["success", "failed", "timeout"]),
});

// The mocked provider calls this once the customer approves, refuses or ignores
// the mobile money prompt. It may be called more than once for the same payment.
export async function POST(request: Request) {
  const secret = request.headers.get("x-callback-secret");
  if (!isValidCallbackSecret(secret, process.env.PAYMENT_CALLBACK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid callback body." }, { status: 400 });
  }

  const result = await settlePayment(parsed.data.providerRef, parsed.data.outcome);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  // A duplicate is not an error: answer 200 so the provider stops retrying.
  return NextResponse.json({
    duplicate: result.duplicate,
    paymentStatus: result.paymentStatus,
    ticketsIssued: result.ticketsIssued,
  });
}

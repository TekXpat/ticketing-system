"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createOrderForUser } from "./create";
import { createOrderSchema } from "./schemas";

export type QuantityCheckoutState = { error?: string };

const MAX_PER_TYPE = 20;

// Turns "I want 2 VIP and 3 Standard" into an order. The fields arrive as
// qty-<ticketTypeId> and name-<ticketTypeId>-<number>. Stock, sale windows and
// per-customer limits are all re-checked inside createOrderForUser.
export async function checkoutQuantities(
  _prev: QuantityCheckoutState,
  formData: FormData,
): Promise<QuantityCheckoutState> {
  const user = await requireUser();

  const items: { ticketTypeId: string; quantity: number; holderNames: string[] }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("qty-")) continue;
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity <= 0) continue;
    if (quantity > MAX_PER_TYPE) return { error: `At most ${MAX_PER_TYPE} tickets of one type.` };

    const ticketTypeId = key.slice(4);
    const holderNames = Array.from({ length: quantity }, (_, index) =>
      String(formData.get(`name-${ticketTypeId}-${index}`) ?? "").trim(),
    );
    items.push({ ticketTypeId, quantity, holderNames });
  }
  if (items.length === 0) return { error: "Choose at least one ticket." };

  const parsed = createOrderSchema.safeParse({
    eventId: String(formData.get("eventId") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    items,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "The order details are not valid." };
  }

  const result = await createOrderForUser(user.id, parsed.data);
  if (!result.ok) return { error: result.error };

  redirect(`/orders/${result.orderId}`);
}

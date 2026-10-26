"use server";

import { requireUser } from "@/lib/auth/session";
import { createOrderForUser, type CreateOrderResult } from "./create";
import { createOrderSchema } from "./schemas";

export async function createOrder(input: unknown): Promise<CreateOrderResult> {
  const user = await requireUser();
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "The order details are not valid." };
  return createOrderForUser(user.id, parsed.data);
}

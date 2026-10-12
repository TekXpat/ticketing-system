"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "./password";
import { signInSchema, signUpSchema } from "./schemas";
import { createSession, destroySession } from "./session";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string[]>>;
  values?: { email?: string; name?: string };
};

// Compared against when the email is unknown, so a sign-in attempt takes the
// same time whether or not the account exists.
const DUMMY_HASH = hashPassword("timing-equaliser");

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = signUpSchema.safeParse(raw);
  const values = { email: String(raw.email ?? ""), name: String(raw.name ?? "") };
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { email, password, name } = parsed.data;
  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { fieldErrors: { email: ["An account with this email already exists."] }, values };
  }

  const user = await db.user.create({
    data: { email, name: name || null, passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);
  redirect("/account");
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = Object.fromEntries(formData);
  const parsed = signInSchema.safeParse(raw);
  const values = { email: String(raw.email ?? "") };
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash ?? (await DUMMY_HASH));
  if (!user || !valid) {
    return { error: "Email or password is incorrect.", values };
  }

  await createSession(user.id);
  redirect("/account");
}

export async function signOut() {
  await destroySession();
  redirect("/");
}

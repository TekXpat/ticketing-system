import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";

const COOKIE_NAME = "session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// The cookie holds a random token; the database holds only its hash.
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function secureCookies() {
  return (process.env.APP_URL ?? "").startsWith("https://");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await db.session.deleteMany({ where: { id: hashToken(token) } });
  }
  cookieStore.delete(COOKIE_NAME);
}

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  role: "CUSTOMER" | "ORGANISER" | "STAFF";
  createdAt: Date;
};

/**
 * The signed-in user, or null. Wrapped in React `cache` so a layout, a page and
 * its components can all call it during one request with a single query.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: {
      user: { select: { id: true, email: true, name: true, role: true, createdAt: true } },
    },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return session.user;
});

/** For server components and actions: the signed-in user, or a redirect to sign in. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** Only organisers may pass. Everyone else is sent back to the events list. */
export async function requireOrganiser(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ORGANISER") redirect("/events");
  return user;
}

/** The gate is for organisers and gate staff. Customers are sent to the events list. */
export async function requireGateAccess(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ORGANISER" && user.role !== "STAFF") redirect("/events");
  return user;
}

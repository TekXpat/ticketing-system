import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

// Example API route. The pattern: authenticate, validate the input, act,
// and return JSON with an explicit status code. Errors use { error: string }.

const updateSchema = z.object({
  name: z.string().trim().max(100, { error: "Name must be 100 characters or fewer." }),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request body.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name || null },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  return NextResponse.json({ user: updated });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Used by the Docker healthcheck. Healthy means the app can reach the database.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error", database: "unreachable" }, { status: 503 });
  }
}

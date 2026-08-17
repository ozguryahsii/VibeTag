import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Liveness plus the one dependency that actually matters.
 *
 * A health check that only proves Next.js booted is a health check that stays
 * green while every page 500s, so this touches the database. It reports no
 * versions, counts or configuration — an unauthenticated endpoint should not
 * describe the system to whoever asks.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    // The response stays opaque, but the reason goes to the container log.
    // A health check that swallows its own error tells you only that
    // something is wrong, which is the least useful half of the message.
    console.error("[health] database check failed:", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

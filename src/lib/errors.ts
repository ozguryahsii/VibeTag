import "server-only";

import { prisma } from "@/lib/db";

/**
 * Error reporting, kept in-house.
 *
 * Deliberately not a third-party service. This application stores personal
 * data under KVKK, and stack traces carry request paths, ids and sometimes the
 * data itself — sending that to another company is a decision for the owner of
 * the application to make, not a default to slip in behind a DSN. Swapping
 * this file for Sentry later is a small change; unsending data is not.
 *
 * `onRequestError` in `instrumentation.ts` feeds this automatically for every
 * server-side failure. Call it by hand where a `catch` swallows something on
 * purpose — a swallowed error with nobody watching is how a deploy stays
 * broken for a week.
 */

const MAX_MESSAGE = 2_000;
const MAX_STACK = 8_000;

export type ErrorLevel = "ERROR" | "WARN";

function describe(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message.slice(0, MAX_MESSAGE),
      stack: error.stack?.slice(0, MAX_STACK),
    };
  }
  return { message: String(error).slice(0, MAX_MESSAGE) };
}

/**
 * Record a failure. Never throws.
 *
 * Whatever happens here must not become a second error on top of the first —
 * an error reporter that can fail the request it is reporting on is worse than
 * no reporter at all.
 */
export async function reportError(
  where: string,
  error: unknown,
  options: { userId?: string; level?: ErrorLevel } = {},
): Promise<void> {
  const { message, stack } = describe(error);
  // The console line goes out first: if the database is what broke, this is
  // the only record that will survive.
  console.error(`[${options.level ?? "ERROR"}] ${where}: ${message}`);

  try {
    await prisma.errorLog.create({
      data: {
        level: options.level ?? "ERROR",
        where: where.slice(0, 200),
        message,
        stack,
        userId: options.userId ?? null,
      },
    });
  } catch {
    /* reporting must never take the request down with it */
  }
}

export async function recentErrors(take = 60) {
  return prisma.errorLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function errorCountSince(since: Date): Promise<number> {
  return prisma.errorLog.count({ where: { createdAt: { gte: since } } });
}

/** Keep the log from becoming the biggest table in the database. */
export async function pruneErrors(days = 30): Promise<number> {
  const { count } = await prisma.errorLog.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - days * 86_400_000) } },
  });
  return count;
}

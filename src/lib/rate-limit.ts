import "server-only";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { LIMITS, type LimitKey } from "@/lib/limits";

export { LIMITS, type LimitKey } from "@/lib/limits";

/**
 * Fixed-window rate limiting.
 *
 * Counters live in the database rather than in memory. One container today is
 * still one restart away from handing an attacker a fresh budget, and a second
 * container would simply double every limit — neither is a property you want
 * to discover from a log.
 *
 * Every guarded action is limited twice: once by address and once by whatever
 * the attempt is *about* (the email, the username typed into the sign-in box).
 * The address alone is not enough — a botnet has thousands of them — and the
 * subject alone is not enough either, since an attacker picks the subject.
 */

export type LimitResult = {
  ok: boolean;
  /** Seconds until the window rolls over. Zero when `ok`. */
  retryAfter: number;
};

/**
 * The caller's address, as best it can be known.
 *
 * Behind Cloudflare, `cf-connecting-ip` is the real client and nginx's own
 * `$remote_addr` is a Cloudflare edge. Somebody who finds the origin address
 * can set that header themselves, which is exactly why nothing here relies on
 * the address alone — see the note above about limiting by subject too.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? forwarded ?? "unknown"
  );
}

function windowStart(windowMs: number): Date {
  return new Date(Math.floor(Date.now() / windowMs) * windowMs);
}

/**
 * Count one attempt and say whether it is allowed.
 *
 * Counts the attempt *before* deciding, so a caller that ignores the answer
 * still pays for it. Failing open on a database error is deliberate: a broken
 * counter must not become an outage of the sign-in screen.
 */
export async function hit(key: LimitKey, subject: string): Promise<LimitResult> {
  const { max, windowMs } = LIMITS[key];
  const window = windowStart(windowMs);
  const bucket = `${key}:${subject}`;

  try {
    const row = await prisma.rateLimit.upsert({
      where: { bucket_window: { bucket, window } },
      create: { bucket, window, count: 1 },
      update: { count: { increment: 1 } },
    });
    if (row.count <= max) return { ok: true, retryAfter: 0 };
    const retryAfter = Math.ceil(
      (window.getTime() + windowMs - Date.now()) / 1000,
    );
    return { ok: false, retryAfter: Math.max(retryAfter, 1) };
  } catch {
    return { ok: true, retryAfter: 0 };
  }
}

/** Both limits at once — allowed only if neither has been spent. */
export async function guard(
  key: LimitKey,
  subject: string,
): Promise<LimitResult> {
  const [byIp, bySubject] = await Promise.all([
    hit(key, `ip/${await clientIp()}`),
    hit(key, `at/${subject.toLowerCase()}`),
  ]);
  if (byIp.ok && bySubject.ok) return { ok: true, retryAfter: 0 };
  return {
    ok: false,
    retryAfter: Math.max(byIp.retryAfter, bySubject.retryAfter),
  };
}

/** Drop windows that can no longer be hit. Called by the nightly sweep. */
export async function pruneRateLimits(): Promise<number> {
  const oldest = Math.max(...Object.values(LIMITS).map((l) => l.windowMs));
  const { count } = await prisma.rateLimit.deleteMany({
    where: { window: { lt: new Date(Date.now() - oldest * 2) } },
  });
  return count;
}

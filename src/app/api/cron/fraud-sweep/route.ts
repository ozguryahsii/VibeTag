import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recomputeAllRatings } from "@/lib/fraud";
import { pruneRateLimits } from "@/lib/rate-limit";
import { pruneOtpCodes } from "@/lib/otp";
import { pruneErrors } from "@/lib/errors";
import { expirePlans } from "@/lib/admin";

/**
 * The nightly sweep.
 *
 * The live check only sees the moment a rating is written. Reciprocal rings
 * and burst patterns often only close days later, so the detector has to get
 * a second look — that is what this is for.
 *
 * Guarded by a shared secret rather than a session, because the caller is a
 * scheduler, not a person. With no secret configured the route refuses
 * outright: an open endpoint that rewrites every score is worse than no cron.
 *
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://…/api/cron/fraud-sweep
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "cron not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const result = await recomputeAllRatings();

  // Housekeeping, in the same pass. Every one of these tables only ever grows
  // otherwise: expired sessions are the worst of them, since one row is added
  // per sign-in and nothing has ever removed one.
  const [sessions, rateLimits, otpCodes, errors] = await Promise.all([
    prisma.session
      .deleteMany({ where: { expiresAt: { lt: new Date() } } })
      .then((r) => r.count),
    pruneRateLimits(),
    pruneOtpCodes(),
    pruneErrors(),
  ]);

  // Plans granted for a fixed number of days end here rather than at read
  // time — see `expirePlans` for why one nightly write beats a check in every
  // screen that asks whether somebody is on Gold.
  const expiredPlans = await expirePlans();

  return NextResponse.json({
    ...result,
    expiredPlans,
    pruned: { sessions, rateLimits, otpCodes, errors },
  });
}

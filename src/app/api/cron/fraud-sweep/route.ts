import { NextResponse } from "next/server";
import { recomputeAllRatings } from "@/lib/fraud";

/**
 * Nightly fake-rating sweep.
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
  return NextResponse.json(result);
}

import { NextResponse } from "next/server";
import { reportError } from "@/lib/errors";
import {
  googleConfigured,
  googleEntitlement,
  refFromGoogleNotification,
  syncEntitlement,
} from "@/lib/store";

/**
 * Google Play Real-Time Developer Notifications, delivered by a Pub/Sub
 * push subscription pointed at
 *   https://vibetag.net/api/store/google?key=<STORE_WEBHOOK_KEY>
 *
 * Same posture as the Apple route: the message only names a purchaseToken,
 * the Play Developer API is asked for the truth, and the URL key keeps
 * strangers from turning us into a proxy for that API. Pub/Sub retries
 * non-2xx deliveries, so acknowledged-but-unactionable messages return 200.
 */
export async function POST(request: Request) {
  const key = process.env.STORE_WEBHOOK_KEY;
  if (!key || !googleConfigured()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  if (new URL(request.url).searchParams.get("key") !== key) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const ref = refFromGoogleNotification(body);
  if (!ref) return NextResponse.json({ ok: true, ignored: true });

  try {
    const ent = await googleEntitlement(ref);
    if (ent) await syncEntitlement(ent, null);
  } catch (error) {
    await reportError("api.store.google", error);
    return NextResponse.json({ error: "sync failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { reportError } from "@/lib/errors";
import {
  appleConfigured,
  appleEntitlement,
  refFromAppleNotification,
  syncEntitlement,
} from "@/lib/store";

/**
 * App Store Server Notifications V2.
 *
 * Configure in App Store Connect as
 *   https://vibetag.net/api/store/apple?key=<STORE_WEBHOOK_KEY>
 *
 * The notification is used only to learn *which* subscription changed; its
 * signature is deliberately not verified, because nothing in it is trusted —
 * the authoritative state comes from a fresh App Store Server API call. The
 * URL key exists so strangers cannot make us hammer Apple's API.
 *
 * Always 200 once the request is well-formed: Apple retries non-2xx
 * responses for days, and a subscription we cannot act on (nobody claimed it
 * yet — the app will call /api/store/verify when it next opens) is not an
 * error worth being re-sent.
 */
export async function POST(request: Request) {
  const key = process.env.STORE_WEBHOOK_KEY;
  if (!key || !appleConfigured()) {
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

  const ref = refFromAppleNotification(body);
  if (!ref) return NextResponse.json({ ok: true, ignored: true });

  try {
    const ent = await appleEntitlement(ref);
    if (ent) await syncEntitlement(ent, null);
  } catch (error) {
    await reportError("api.store.apple", error);
    // 500 on a real failure so Apple's retry loop works for us.
    return NextResponse.json({ error: "sync failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { reportError } from "@/lib/errors";
import {
  appleEntitlement,
  googleEntitlement,
  storeConfigured,
  syncEntitlement,
} from "@/lib/store";

/**
 * Where the app claims a purchase.
 *
 * The mobile shell finishes a StoreKit / Play Billing purchase and posts the
 * receipt handle here — Apple's originalTransactionId or Google's
 * purchaseToken — as the signed-in user. The store is asked directly whether
 * that handle is real and paid; nothing the client sent is believed beyond
 * "go look at this".
 *
 * Idempotent on purpose: the shell may retry, the user may reinstall, and
 * "restore purchases" is just this same call again.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { platform?: string; token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const platform = body.platform === "APPLE" || body.platform === "GOOGLE"
    ? body.platform
    : null;
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!platform || !token || token.length > 4096) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  if (!storeConfigured(platform)) {
    return NextResponse.json(
      { error: "store billing not configured" },
      { status: 503 },
    );
  }

  try {
    const ent =
      platform === "APPLE"
        ? await appleEntitlement(token)
        : await googleEntitlement(token);
    if (!ent) {
      return NextResponse.json({ error: "purchase not found" }, { status: 404 });
    }

    const result = await syncEntitlement(ent, user.id);
    if (!result.ok) {
      // OTHER_ACCOUNT is the one worth distinguishing for the user: their
      // Apple ID already paid for a different Vibe Tag account.
      const status = result.reason === "OTHER_ACCOUNT" ? 409 : 422;
      return NextResponse.json({ error: result.reason }, { status });
    }

    return NextResponse.json({ plan: result.plan, until: result.until });
  } catch (error) {
    await reportError("api.store.verify", error, { userId: user.id });
    return NextResponse.json({ error: "store unreachable" }, { status: 502 });
  }
}

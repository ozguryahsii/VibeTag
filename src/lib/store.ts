import "server-only";
import { createSign } from "node:crypto";
import { prisma } from "@/lib/db";
import { reportError } from "@/lib/errors";
import { notify } from "@/lib/notifications";
import {
  entitlementStatus,
  planForProduct,
  planWriteFor,
  type Entitlement,
  type StorePlatform,
} from "@/lib/store-products";
import { trialWriteFor } from "@/lib/trial";

/**
 * The store side of billing: Apple App Store Server API and Google Play
 * Developer API clients, and the one function that turns their answers into
 * a plan.
 *
 * Design rule: **webhooks are pokes, not facts.** An App Store notification
 * or a Play RTDN message only tells us *which* subscription to look at; the
 * store's server API is then asked for the current state, and that answer is
 * the only thing ever written to the database. This removes the whole
 * problem of verifying webhook signatures — a forged webhook can at worst
 * make us re-check a subscription we already know about.
 *
 * Both clients are plain `fetch` + `node:crypto`, no SDKs, same reasoning as
 * `email.ts`: two signed JWTs are not worth two dependency trees.
 *
 * Nothing here can run until the store accounts exist. Every entry point
 * checks its own `*Configured()` and refuses cleanly — the same pattern as
 * `emailConfigured()` — so the endpoints can ship now and come alive the day
 * the env vars are set.
 */

// ------------------------------------------------------------------ config

/**
 * Apple — an App Store Connect API key (Ecosystem role: App Manager or the
 * dedicated In-App Purchase role):
 *   APPLE_ISSUER_ID   from App Store Connect → Users and Access → Integrations
 *   APPLE_KEY_ID      the key's id
 *   APPLE_PRIVATE_KEY the .p8 contents (newlines may be escaped as \n)
 *   APPLE_BUNDLE_ID   e.g. net.vibetag.app
 */
export function appleConfigured(): boolean {
  return !!(
    process.env.APPLE_ISSUER_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_PRIVATE_KEY &&
    process.env.APPLE_BUNDLE_ID
  );
}

/**
 * Google — a service account with the Android Publisher scope, granted
 * access in the Play Console:
 *   GOOGLE_PLAY_PACKAGE   e.g. net.vibetag.app
 *   GOOGLE_PLAY_SA_EMAIL  service account email
 *   GOOGLE_PLAY_SA_KEY    the account's private key PEM (newlines may be \n)
 */
export function googleConfigured(): boolean {
  return !!(
    process.env.GOOGLE_PLAY_PACKAGE &&
    process.env.GOOGLE_PLAY_SA_EMAIL &&
    process.env.GOOGLE_PLAY_SA_KEY
  );
}

export function storeConfigured(platform: StorePlatform): boolean {
  return platform === "APPLE" ? appleConfigured() : googleConfigured();
}

function pem(raw: string): string {
  return raw.replace(/\\n/g, "\n");
}

const b64url = (data: Buffer | string): string =>
  Buffer.from(data).toString("base64url");

function signedJwt(
  header: object,
  payload: object,
  key: string,
  algorithm: "ES256" | "RS256",
): string {
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signer = createSign("sha256");
  signer.update(signingInput);
  const signature =
    algorithm === "ES256"
      ? signer.sign({ key, dsaEncoding: "ieee-p1363" })
      : signer.sign(key);
  return `${signingInput}.${signature.toString("base64url")}`;
}

// ------------------------------------------------------------------- Apple

function appleJwt(): string {
  const now = Math.floor(Date.now() / 1000);
  return signedJwt(
    { alg: "ES256", kid: process.env.APPLE_KEY_ID, typ: "JWT" },
    {
      iss: process.env.APPLE_ISSUER_ID,
      iat: now,
      exp: now + 300,
      aud: "appstoreconnect-v1",
      bid: process.env.APPLE_BUNDLE_ID,
    },
    pem(process.env.APPLE_PRIVATE_KEY!),
    "ES256",
  );
}

/** The payload half of a JWS, decoded but NOT verified — see the file docs. */
function decodeJwsPayload(jws: string): Record<string, unknown> | null {
  const parts = jws.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

/**
 * Ask Apple for the current state of one subscription.
 *
 * Tries production first and falls back to sandbox on 404, which is Apple's
 * own recommended dance — a sandbox purchase from app review does not exist
 * in the production environment.
 */
export async function appleEntitlement(
  originalTransactionId: string,
): Promise<Entitlement | null> {
  const hosts = [
    ["https://api.storekit.itunes.apple.com", "Production"],
    ["https://api.storekit-sandbox.itunes.apple.com", "Sandbox"],
  ] as const;

  for (const [host, environment] of hosts) {
    const res = await fetch(
      `${host}/inApps/v1/subscriptions/${encodeURIComponent(originalTransactionId)}`,
      {
        headers: { Authorization: `Bearer ${appleJwt()}` },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (res.status === 404 || res.status === 401) continue;
    if (!res.ok) {
      throw new Error(`App Store API ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      data?: {
        lastTransactions?: {
          status: number;
          signedTransactionInfo?: string;
        }[];
      }[];
    };
    const last = data.data?.[0]?.lastTransactions?.[0];
    if (!last?.signedTransactionInfo) return null;

    const txn = decodeJwsPayload(last.signedTransactionInfo);
    if (!txn) return null;

    // Status 1 = active, 3 = billing grace period (still entitled). 2 and 4
    // (expired, billing retry) and 5 (revoked) are not entitled.
    return {
      platform: "APPLE",
      productId: String(txn.productId ?? ""),
      storeRef: originalTransactionId,
      active: last.status === 1 || last.status === 3,
      expiresAt: txn.expiresDate ? new Date(Number(txn.expiresDate)) : null,
      // offerType 1 is the introductory offer. Newer payloads also carry
      // offerDiscountType, which distinguishes a free trial from a discounted
      // intro price — read both, since only the free one spends a trial.
      inTrial:
        Number(txn.offerType) === 1 ||
        String(txn.offerDiscountType ?? "") === "FREE_TRIAL",
      environment,
    };
  }
  return null;
}

// ------------------------------------------------------------------ Google

async function googleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const assertion = signedJwt(
    { alg: "RS256", typ: "JWT" },
    {
      iss: process.env.GOOGLE_PLAY_SA_EMAIL,
      scope: "https://www.googleapis.com/auth/androidpublisher",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 300,
    },
    pem(process.env.GOOGLE_PLAY_SA_KEY!),
    "RS256",
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`Google token ${res.status}: ${await res.text()}`);
  }
  return ((await res.json()) as { access_token: string }).access_token;
}

/** Ask Google for the current state of one subscription (subscriptionsv2). */
export async function googleEntitlement(
  purchaseToken: string,
): Promise<Entitlement | null> {
  const token = await googleAccessToken();
  const pkg = process.env.GOOGLE_PLAY_PACKAGE!;
  const res = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Play API ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    subscriptionState?: string;
    testPurchase?: unknown;
    lineItems?: {
      productId?: string;
      expiryTime?: string;
      offerDetails?: { offerId?: string };
    }[];
  };
  const line = data.lineItems?.[0];
  if (!line?.productId) return null;

  const state = data.subscriptionState ?? "";
  return {
    platform: "GOOGLE",
    productId: line.productId,
    storeRef: purchaseToken,
    active:
      state === "SUBSCRIPTION_STATE_ACTIVE" ||
      state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
    expiresAt: line.expiryTime ? new Date(line.expiryTime) : null,
    // Play has no "isTrial" field on subscriptionsv2; a trial arrives as an
    // applied offer on the base plan. That holds only because the free trial
    // is the sole offer we create — if a discount offer is ever added, this
    // needs the offerId checked by name rather than by presence.
    inTrial: Boolean(line.offerDetails?.offerId),
    environment: data.testPurchase !== undefined ? "Sandbox" : "Production",
  };
}

// -------------------------------------------------------------------- sync

export type SyncResult =
  | { ok: true; plan: string; until: Date | null }
  | { ok: false; reason: "UNKNOWN_PRODUCT" | "OTHER_ACCOUNT" | "NOT_FOUND" };

/**
 * Write what a store said into the database.
 *
 * `userId` is who the entitlement belongs to. On a webhook we may only know
 * the storeRef — pass null and the owner is looked up from the mirror row;
 * an entitlement nobody has claimed yet is ignored (the claim happens in
 * /api/store/verify, where a signed-in user presents their own receipt).
 *
 * The storeRef unique index is what stops one receipt from paying for two
 * accounts: claiming a ref that belongs to someone else is refused.
 */
export async function syncEntitlement(
  ent: Entitlement,
  userId: string | null,
): Promise<SyncResult> {
  const plan = planForProduct(ent.productId);
  if (!plan) {
    await reportError(
      "store.sync",
      new Error(`unknown product ${ent.productId} (${ent.platform})`),
    );
    return { ok: false, reason: "UNKNOWN_PRODUCT" };
  }

  const existing = await prisma.storePurchase.findUnique({
    where: { storeRef: ent.storeRef },
    select: { userId: true },
  });
  if (existing && userId && existing.userId !== userId) {
    return { ok: false, reason: "OTHER_ACCOUNT" };
  }
  const owner = userId ?? existing?.userId;
  if (!owner) return { ok: false, reason: "NOT_FOUND" };

  const now = new Date();
  const status = entitlementStatus(ent, now);

  await prisma.storePurchase.upsert({
    where: { storeRef: ent.storeRef },
    create: {
      userId: owner,
      platform: ent.platform,
      productId: ent.productId,
      storeRef: ent.storeRef,
      plan,
      status,
      expiresAt: ent.expiresAt,
      environment: ent.environment,
    },
    update: {
      productId: ent.productId,
      plan,
      status,
      expiresAt: ent.expiresAt,
      environment: ent.environment,
    },
  });

  const current = await prisma.user.findUnique({
    where: { id: owner },
    select: {
      plan: true,
      planUntil: true,
      trialConsumedAt: true,
      trialPlan: true,
    },
  });
  if (!current) return { ok: false, reason: "NOT_FOUND" };

  const write = planWriteFor(ent, current, now);
  // The trial is spent the first time a store reports one, whatever the plan
  // write turns out to be — someone whose plan is already higher still used
  // their one free week getting there.
  const trial = trialWriteFor(ent, plan, current, now);

  if (write || trial) {
    await prisma.user.update({
      where: { id: owner },
      data: {
        ...(write ? { plan: write.plan, planUntil: write.planUntil } : {}),
        ...(trial ?? {}),
      },
    });
  }
  if (write && write.plan !== "FREE" && current.plan !== write.plan) {
    await notify(owner, "PLAN_GRANTED", { href: "/settings" });
  }

  const after = write ?? { plan: current.plan, planUntil: current.planUntil };
  return { ok: true, plan: after.plan, until: after.planUntil };
}

/** Pull the storeRef out of a webhook body, per platform. */
export function refFromAppleNotification(body: unknown): string | null {
  // App Store Server Notifications V2: { signedPayload: JWS } whose payload
  // carries data.signedTransactionInfo (another JWS) with the transaction.
  const signed = (body as { signedPayload?: string })?.signedPayload;
  if (typeof signed !== "string") return null;
  const payload = decodeJwsPayload(signed);
  const inner = (payload?.data as { signedTransactionInfo?: string })
    ?.signedTransactionInfo;
  if (typeof inner !== "string") return null;
  const txn = decodeJwsPayload(inner);
  const ref = txn?.originalTransactionId;
  return typeof ref === "string" && ref ? ref : null;
}

export function refFromGoogleNotification(body: unknown): string | null {
  // Play RTDN arrives via Pub/Sub push: { message: { data: base64(json) } }.
  const data = (body as { message?: { data?: string } })?.message?.data;
  if (typeof data !== "string") return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(data, "base64").toString("utf8"),
    ) as { subscriptionNotification?: { purchaseToken?: string } };
    const ref = parsed.subscriptionNotification?.purchaseToken;
    return typeof ref === "string" && ref ? ref : null;
  } catch {
    return null;
  }
}

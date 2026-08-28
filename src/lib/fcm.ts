import "server-only";

import { createSign } from "node:crypto";
import { decodePrivateKey } from "@/lib/device-push";

/**
 * Firebase Cloud Messaging — the Android half of `pushToDevices`.
 *
 * Inert without credentials, exactly like `apns.ts` and `push.ts`: the app
 * has to run locally and in CI without anyone creating a Firebase project
 * first, and a push layer that throws when unconfigured becomes a hard
 * dependency by accident.
 *
 * What Özgür has to supply, once, from the Firebase console
 * (Project settings → Service accounts → Generate new private key), which
 * downloads a JSON file holding all three:
 *
 *   FCM_PROJECT_ID     "project_id" from that file
 *   FCM_CLIENT_EMAIL   "client_email" — ends in .iam.gserviceaccount.com
 *   FCM_PRIVATE_KEY    "private_key" — the PEM, or base64 of it, which is
 *                      one line and survives .env parsing everywhere
 *
 * That file is a credential: it belongs in the server's .env and a password
 * manager, never in the repository. `google-services.json` is the opposite —
 * it ships inside the APK, so it lives in the repo where the build can find
 * it.
 *
 * Why raw fetch and no firebase-admin: the whole protocol is one signed JWT
 * exchanged for an access token, then one POST. The SDK would pull in a tree
 * of dependencies to hide four requests, and this file is the smaller thing
 * to audit.
 */

const projectId = process.env.FCM_PROJECT_ID?.trim();
const clientEmail = process.env.FCM_CLIENT_EMAIL?.trim();
const privateKey = decodePrivateKey(process.env.FCM_PRIVATE_KEY);

export const fcmConfigured = Boolean(projectId && clientEmail && privateKey);

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

/**
 * Google's access tokens last an hour. Cached in module scope with a margin,
 * so a burst of notifications costs one token exchange rather than one per
 * device.
 */
let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string | null> {
  const now = Date.now();
  if (cached && now < cached.expiresAt) return cached.token;

  const iat = Math.floor(now / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat,
    exp: iat + 3600,
  };
  const encode = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const signingInput = `${encode(header)}.${encode(claims)}`;

  // RS256 with the service account key — Google's own assertion format.
  const signature = createSign("RSA-SHA256")
    .update(signingInput)
    .sign(privateKey!, "base64url");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${signingInput}.${signature}`,
    }),
  });
  if (!res.ok) return null;

  const body = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!body.access_token) return null;

  cached = {
    token: body.access_token,
    // A minute of margin: a token that expires mid-flight fails the send
    // rather than refreshing itself.
    expiresAt: now + Math.max(60, (body.expires_in ?? 3600) - 60) * 1000,
  };
  return cached.token;
}

export type FcmResult = {
  ok: boolean;
  status: number;
  /** FCM's own code — UNREGISTERED, SENDER_ID_MISMATCH, INVALID_ARGUMENT… */
  errorCode?: string;
};

/**
 * Send one notification to one device.
 *
 * Resolves with Google's verdict rather than throwing, so the caller can
 * decide what a failure means — chiefly whether the token should be deleted,
 * which is `device-push.ts`'s decision and not this module's.
 */
export async function sendFcm(
  deviceToken: string,
  message: Record<string, unknown>,
): Promise<FcmResult> {
  if (!fcmConfigured) return { ok: false, status: 0, errorCode: "NotConfigured" };

  const token = await accessToken();
  if (!token) return { ok: false, status: 0, errorCode: "NoAccessToken" };

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: { ...message, token: deviceToken } }),
    },
  );

  if (res.ok) return { ok: true, status: res.status };

  // The code that matters is nested in details[]; the top-level status is a
  // coarser string. A body we cannot parse is still a status we can act on.
  let errorCode: string | undefined;
  try {
    const body = (await res.json()) as {
      error?: {
        status?: string;
        details?: Array<{ errorCode?: string }>;
      };
    };
    errorCode =
      body.error?.details?.find((d) => d.errorCode)?.errorCode ??
      body.error?.status;
  } catch {
    // Leave it undefined — the status alone decides.
  }

  return { ok: false, status: res.status, errorCode };
}

import "server-only";

import http2 from "node:http2";
import { createPrivateKey, sign as cryptoSign } from "node:crypto";
import { decodeApnsKey } from "@/lib/device-push";

/**
 * Apple Push Notification service.
 *
 * Inert without credentials, exactly like `push.ts` is without VAPID keys:
 * the app has to run locally and in CI without anyone downloading a signing
 * key first, and a push layer that throws when unconfigured is a push layer
 * that becomes a hard dependency by accident.
 *
 * What Özgür has to supply, once, from the Apple Developer portal
 * (Certificates, Identifiers & Profiles → Keys → + → Apple Push Notifications
 * service):
 *
 *   APNS_KEY_P8    the downloaded AuthKey_XXXX.p8 — the file as-is, or
 *                  base64 of it (`base64 -w0 AuthKey_XXXX.p8`), which is one
 *                  line and survives .env parsing everywhere
 *   APNS_KEY_ID    the 10-character key id shown next to it
 *   APNS_TEAM_ID   the 10-character team id from the account page
 *   APNS_BUNDLE_ID net.vibetag.app  (the topic; defaults to this)
 *   APNS_ENV       production | sandbox
 *
 * The .p8 is downloadable exactly once and cannot be re-downloaded, so it
 * belongs in the server's .env and in whatever password manager holds the
 * rest — not in the repository.
 *
 * Why raw http2 and no library: APNs speaks HTTP/2 and nothing else, Node
 * ships an HTTP/2 client, and the whole protocol is one POST with a signed
 * JWT. A dependency here would be more code to audit than the code it saves.
 */

const keyP8 = decodeApnsKey(process.env.APNS_KEY_P8);
const keyId = process.env.APNS_KEY_ID?.trim();
const teamId = process.env.APNS_TEAM_ID?.trim();
const bundleId = process.env.APNS_BUNDLE_ID?.trim() || "net.vibetag.app";

/**
 * Which Apple host to talk to.
 *
 * A token minted by a development build is meaningless to the production host
 * and vice versa — the failure is a 400 that reads like a broken key. Default
 * to production, because that is what a deployed server is, and let a TestFlight
 * or Xcode build be tested by setting APNS_ENV=sandbox.
 */
const sandbox = process.env.APNS_ENV?.trim().toLowerCase() === "sandbox";
const host = sandbox
  ? "https://api.sandbox.push.apple.com"
  : "https://api.push.apple.com";

export const apnsConfigured = Boolean(keyP8 && keyId && teamId);

/**
 * Apple rejects a provider token refreshed more often than once every 20
 * minutes, and rejects one older than 60. Cached in module scope with a
 * conservative hour-minus-margin lifetime.
 */
let cached: { token: string; mintedAt: number } | null = null;
const TOKEN_TTL_MS = 45 * 60 * 1000;

function providerToken(now: number): string {
  if (cached && now - cached.mintedAt < TOKEN_TTL_MS) return cached.token;

  const header = { alg: "ES256", kid: keyId };
  const payload = { iss: teamId, iat: Math.floor(now / 1000) };
  const encode = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const signingInput = `${encode(header)}.${encode(payload)}`;

  // `ieee-p1363` is the raw r||s encoding JWS wants; Node's default for EC
  // keys is DER, which Apple rejects with a bare 403 InvalidProviderToken.
  const signature = cryptoSign(
    "sha256",
    Buffer.from(signingInput),
    { key: createPrivateKey(keyP8!), dsaEncoding: "ieee-p1363" },
  ).toString("base64url");

  const token = `${signingInput}.${signature}`;
  cached = { token, mintedAt: now };
  return token;
}

export type ApnsResult = {
  ok: boolean;
  status: number;
  reason?: string;
  /**
   * Whether a `BadDeviceToken` from this host may be taken at face value.
   *
   * We do not record which environment a token was minted in — the app
   * cannot reliably tell us — so this is decided by which host we are
   * talking to. A production server that gets BadDeviceToken is hearing
   * about a genuinely dead token. A server pointed at sandbox is the
   * temporary, testing configuration, and the same answer there most likely
   * means somebody left APNS_ENV set wrong; deleting every real device over
   * that would be a permanent price for a temporary mistake.
   */
  environmentMatches: boolean;
};

/**
 * Send one notification to one device.
 *
 * Resolves with Apple's verdict rather than throwing, so the caller can
 * decide what a failure means — chiefly whether the token should be deleted,
 * which is `device-push.ts`'s decision and not this module's.
 */
export async function sendApns(
  deviceToken: string,
  payload: Record<string, unknown>,
  opts: { collapseId?: string } = {},
): Promise<ApnsResult> {
  if (!apnsConfigured) {
    return {
      ok: false,
      status: 0,
      reason: "NotConfigured",
      environmentMatches: false,
    };
  }

  const client = http2.connect(host);
  try {
    return await new Promise<ApnsResult>((resolve, reject) => {
      const body = Buffer.from(JSON.stringify(payload));
      const headers: Record<string, string | number> = {
        ":method": "POST",
        ":path": `/3/device/${deviceToken}`,
        authorization: `bearer ${providerToken(Date.now())}`,
        "apns-topic": bundleId,
        "apns-push-type": "alert",
        // 10 = deliver now. The alternative (5) lets Apple hold it to save
        // battery, which is right for background updates and wrong for
        // "somebody rated you".
        "apns-priority": 10,
        "content-type": "application/json",
        "content-length": body.length,
      };
      if (opts.collapseId) headers["apns-collapse-id"] = opts.collapseId;

      const req = client.request(headers);
      let status = 0;
      let raw = "";

      req.on("response", (h) => {
        status = Number(h[":status"] ?? 0);
      });
      req.on("data", (chunk) => {
        raw += chunk;
      });
      req.on("error", reject);
      req.on("end", () => {
        let reason: string | undefined;
        try {
          reason = (JSON.parse(raw || "{}") as { reason?: string }).reason;
        } catch {
          // A body we cannot parse is still a status we can act on.
        }
        resolve({
          ok: status === 200,
          status,
          reason,
          environmentMatches: !sandbox,
        });
      });

      req.end(body);
    });
  } finally {
    client.close();
  }
}

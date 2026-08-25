/**
 * The rules for pushing to a native app install, with no I/O in them.
 *
 * Pure for the same reason `discount.ts` and `trial.ts` are: every decision
 * here is invisible when it goes wrong. A malformed token is accepted and
 * then silently never delivered to; a dead token that is not recognised as
 * dead stays in the table forever, and every notification pays for it. None
 * of that shows up on a screen, so it has to be testable without a database
 * and without Apple.
 */

/** Which service a token is addressed to. */
export const DEVICE_PLATFORMS = ["APNS", "FCM"] as const;
export type DevicePlatform = (typeof DEVICE_PLATFORMS)[number];

export function isDevicePlatform(v: unknown): v is DevicePlatform {
  return (
    typeof v === "string" && (DEVICE_PLATFORMS as readonly string[]).includes(v)
  );
}

/**
 * Clean up a token as reported by the shell, or reject it.
 *
 * The Capacitor plugin hands back an APNs token as lowercase hex, but iOS
 * has historically formatted it as `<0123 4567 …>` and more than one library
 * still passes that through. Sending to a token with spaces in it fails with
 * a 400 that looks exactly like a configuration problem, so it is normalised
 * here instead of being discovered in production.
 *
 * FCM tokens are opaque and long, so they are only trimmed and length-checked.
 */
export function normalizeDeviceToken(
  raw: unknown,
  platform: DevicePlatform,
): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;

  if (platform === "APNS") {
    const hex = value.replace(/[\s<>-]/g, "").toLowerCase();
    // Apple's tokens are 32 bytes today and 100 bytes in the documented
    // future, so the shape is checked rather than an exact length.
    if (!/^[0-9a-f]{64,200}$/.test(hex)) return null;
    return hex;
  }

  if (value.length < 32 || value.length > 4096) return null;
  return value;
}

/** The alert body APNs expects, as an object ready to be serialised. */
export function apnsPayload(
  copy: { title: string; body: string },
  href: string | null,
): Record<string, unknown> {
  return {
    aps: {
      alert: { title: copy.title, body: copy.body },
      sound: "default",
      // Badge counts are deliberately not set. We would have to compute the
      // unread total on every push and would still drift the moment somebody
      // reads a notification on another device; a wrong number on the icon is
      // worse than no number.
    },
    // Read by the shell to decide where to land. Same key the Web Push
    // payload uses, so both paths behave the same.
    url: href ?? "/home",
  };
}

/**
 * Should this token be deleted?
 *
 * Only when Apple says the token itself is finished — the app was deleted, or
 * the token belongs to a different app. Everything else (throttling, an
 * outage, a bad certificate) is our problem to fix, and deleting the person's
 * device over it would quietly turn a temporary fault into a permanent one.
 *
 * `410 Unregistered` is the ordinary case. `400 BadDeviceToken` is the one
 * worth being careful about: it also fires when a sandbox token is sent to
 * the production host, which is a configuration mistake, not a dead device —
 * so it is only treated as fatal on the host that matches the token.
 */
export function apnsTokenIsDead(
  status: number,
  reason: string | undefined,
  opts: { environmentMatches: boolean } = { environmentMatches: true },
): boolean {
  if (status === 410) return true;
  if (status === 400 && reason === "BadDeviceToken") {
    return opts.environmentMatches;
  }
  return false;
}

/**
 * The APNs signing key, however it survived the trip into an env var.
 *
 * A .p8 is a multi-line PEM file, and every way of getting one into a
 * deployed environment mangles it differently: Docker Compose's env_file
 * parser has only handled quoted multi-line values since v2.17, shell
 * exports collapse the newlines, and a dashboard field turns them into a
 * literal backslash-n. All three produce a key that fails to parse with an
 * error that reads like a wrong key rather than a mangled one.
 *
 * So three shapes are accepted and normalised to the same PEM:
 *
 *   - the file as-is, newlines intact
 *   - the same thing with literal `\n` where the newlines were
 *   - base64 of the whole file, which is one line and survives everything
 *     (`base64 -w0 AuthKey_XXXXXXXXXX.p8`)
 *
 * Returns null for anything that is not a private key, so an unconfigured
 * deployment stays inert instead of throwing on first notification.
 */
export function decodeApnsKey(raw: string | undefined | null): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;

  const pem = value.includes("BEGIN")
    ? value.replace(/\\n/g, "\n")
    : Buffer.from(value, "base64").toString("utf8");

  return pem.includes("BEGIN") && pem.includes("PRIVATE KEY") ? pem : null;
}

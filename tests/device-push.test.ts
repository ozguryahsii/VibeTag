import { describe, expect, it } from "vitest";
import {
  DEVICE_PLATFORMS,
  decodeApnsKey,
  apnsPayload,
  apnsTokenIsDead,
  isDevicePlatform,
  normalizeDeviceToken,
} from "@/lib/device-push";

const APNS_TOKEN = "a".repeat(64);

/**
 * Device tokens fail silently in both directions, which is why the rules are
 * pure and tested rather than inlined at the call site.
 *
 * A token stored in the wrong shape is accepted by us and rejected by Apple
 * forever — the person turned notifications on, saw the switch go green, and
 * will never be notified. A live token deleted because a transient error was
 * misread is the same outcome, arrived at from the opposite direction.
 */
describe("accepting a device token", () => {
  it("takes a plain hex APNs token", () => {
    expect(normalizeDeviceToken(APNS_TOKEN, "APNS")).toBe(APNS_TOKEN);
  });

  /*
   * iOS has historically printed the token as `<0123 4567 …>` and more than
   * one wrapper still passes that straight through. Sending to it fails with
   * a 400 that reads like a bad signing key, so the shape is fixed here
   * rather than diagnosed in production.
   */
  it("strips the angle brackets and spaces iOS used to print", () => {
    const formatted = `<${"ab".repeat(16)} ${"cd".repeat(16)}>`;
    expect(normalizeDeviceToken(formatted, "APNS")).toBe(
      "ab".repeat(16) + "cd".repeat(16),
    );
  });

  it("lower-cases hex, since Apple's path is case-sensitive", () => {
    expect(normalizeDeviceToken("A".repeat(64), "APNS")).toBe(APNS_TOKEN);
  });

  it("refuses anything that is not a plausible APNs token", () => {
    expect(normalizeDeviceToken("", "APNS")).toBeNull();
    expect(normalizeDeviceToken("nope", "APNS")).toBeNull();
    expect(normalizeDeviceToken("z".repeat(64), "APNS")).toBeNull();
    expect(normalizeDeviceToken(undefined, "APNS")).toBeNull();
    expect(normalizeDeviceToken(12345, "APNS")).toBeNull();
  });

  it("treats an FCM token as opaque, only trimming and bounding it", () => {
    const fcm = `  ${"x".repeat(140)}  `;
    expect(normalizeDeviceToken(fcm, "FCM")).toBe("x".repeat(140));
    expect(normalizeDeviceToken("short", "FCM")).toBeNull();
  });

  it("knows which platforms exist", () => {
    expect(isDevicePlatform("APNS")).toBe(true);
    expect(isDevicePlatform("FCM")).toBe(true);
    expect(isDevicePlatform("WEB")).toBe(false);
    expect(isDevicePlatform(undefined)).toBe(false);
    expect(DEVICE_PLATFORMS).toHaveLength(2);
  });
});

describe("what we send to Apple", () => {
  it("carries the title, body and destination", () => {
    expect(apnsPayload({ title: "Yeni değerlendirme", body: "Bir kişi seni değerlendirdi." }, "/me")).toEqual({
      aps: {
        alert: { title: "Yeni değerlendirme", body: "Bir kişi seni değerlendirdi." },
        sound: "default",
      },
      url: "/me",
    });
  });

  it("falls back to home when the notification has no link", () => {
    const payload = apnsPayload({ title: "t", body: "b" }, null) as {
      url: string;
    };
    expect(payload.url).toBe("/home");
  });

  /*
   * No badge count is sent. Computing the unread total on every push would
   * still drift the moment somebody reads a notification on another device,
   * and a wrong number on the icon is worse than no number.
   */
  it("sets no badge count", () => {
    const payload = apnsPayload({ title: "t", body: "b" }, null) as {
      aps: Record<string, unknown>;
    };
    expect(payload.aps).not.toHaveProperty("badge");
  });
});

describe("deciding a token is dead", () => {
  it("deletes on 410 Unregistered — the app is gone", () => {
    expect(apnsTokenIsDead(410, "Unregistered")).toBe(true);
  });

  it("keeps the token through failures that are ours to fix", () => {
    // Throttling, an outage, an expired signing key: none of these say
    // anything about the device, and deleting it would turn a temporary
    // fault into a permanent one that nobody would think to look for.
    expect(apnsTokenIsDead(429, "TooManyRequests")).toBe(false);
    expect(apnsTokenIsDead(503, "ServiceUnavailable")).toBe(false);
    expect(apnsTokenIsDead(403, "ExpiredProviderToken")).toBe(false);
    expect(apnsTokenIsDead(500, undefined)).toBe(false);
    expect(apnsTokenIsDead(200, undefined)).toBe(false);
  });

  /*
   * BadDeviceToken is the ambiguous one: it is also what Apple says when a
   * sandbox token is sent to the production host. That is a configuration
   * mistake, and deleting every tester's device over it is exactly the wrong
   * response.
   */
  it("only deletes on BadDeviceToken when the environment matches", () => {
    expect(
      apnsTokenIsDead(400, "BadDeviceToken", { environmentMatches: true }),
    ).toBe(true);
    expect(
      apnsTokenIsDead(400, "BadDeviceToken", { environmentMatches: false }),
    ).toBe(false);
  });

  it("keeps the token on other 400s", () => {
    expect(apnsTokenIsDead(400, "BadTopic")).toBe(false);
    expect(apnsTokenIsDead(400, "PayloadEmpty")).toBe(false);
  });
});

/**
 * Getting the signing key into a deployed environment is where this fails in
 * practice, not in the crypto. Every transport mangles a PEM differently and
 * every failure surfaces as the same unhelpful "wrong key" — so the shapes
 * are normalised here, and the normalisation is tested.
 */
describe("reading the APNs signing key", () => {
  const PEM =
    "-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49\nAgEGCCqGSM49AwEHBHkw\n-----END PRIVATE KEY-----\n";

  it("takes the .p8 exactly as downloaded", () => {
    expect(decodeApnsKey(PEM)).toContain("BEGIN PRIVATE KEY");
  });

  it("repairs newlines that were flattened to a literal backslash-n", () => {
    const flattened = PEM.replace(/\n/g, "\\n");
    expect(decodeApnsKey(flattened)).toBe(PEM);
  });

  it("takes base64 of the whole file, which is what survives a .env", () => {
    const b64 = Buffer.from(PEM).toString("base64");
    expect(decodeApnsKey(b64)).toBe(PEM);
  });

  /*
   * An unconfigured deployment must stay inert rather than throw on the first
   * notification somebody triggers — the same contract web push has without
   * VAPID keys.
   */
  it("returns null for anything that is not a key", () => {
    expect(decodeApnsKey(undefined)).toBeNull();
    expect(decodeApnsKey("")).toBeNull();
    expect(decodeApnsKey("   ")).toBeNull();
    expect(decodeApnsKey("not-a-key")).toBeNull();
    expect(decodeApnsKey(Buffer.from("hello").toString("base64"))).toBeNull();
  });
});

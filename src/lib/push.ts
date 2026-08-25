import "server-only";

import webpush from "web-push";
import { prisma } from "@/lib/db";
import { dictionaryFor } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { renderNotification } from "@/lib/notifications";
import { apnsConfigured, sendApns } from "@/lib/apns";
import {
  apnsPayload,
  apnsTokenIsDead,
  type DevicePlatform,
} from "@/lib/device-push";

/**
 * Web Push.
 *
 * Entirely optional: with no VAPID keys configured this module is inert and
 * every call returns without doing anything. That is deliberate — the app has
 * to run locally and in CI without anyone generating keys first, and a push
 * layer that throws when unconfigured would make it a hard dependency.
 *
 *   npx web-push generate-vapid-keys
 *
 * Note the language question. A notification is stored as a type plus its
 * variables, so the sentence is written at delivery time — which means we need
 * to know the reader's language *without* a request to read a cookie from. The
 * subscription is the wrong place to hang it (a person may switch languages
 * between devices), so the language recorded when they subscribed is used, and
 * English is the fallback.
 */

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:destek@vibetag.app";

export const pushConfigured = Boolean(publicKey && privateKey);

if (pushConfigured) {
  webpush.setVapidDetails(subject, publicKey!, privateKey!);
}

export type PushKeys = { endpoint: string; p256dh: string; auth: string };

export async function saveSubscription(
  userId: string,
  keys: PushKeys,
): Promise<void> {
  await prisma.pushSubscription.upsert({
    where: { endpoint: keys.endpoint },
    // The endpoint may have belonged to a different account on a shared
    // device, so ownership is re-pointed rather than assumed.
    update: { userId, p256dh: keys.p256dh, auth: keys.auth },
    create: { userId, ...keys },
  });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

/**
 * Register a native app install.
 *
 * The token is unique across accounts rather than per account, so a phone
 * that changes hands is re-pointed at whoever signed in last instead of
 * delivering one person's notifications to another.
 */
export async function saveDeviceToken(
  userId: string,
  platform: DevicePlatform,
  token: string,
): Promise<void> {
  await prisma.deviceToken.upsert({
    where: { token },
    update: { userId, platform, lastSeenAt: new Date() },
    create: { userId, platform, token },
  });
}

export async function removeDeviceToken(token: string): Promise<void> {
  await prisma.deviceToken.deleteMany({ where: { token } });
}

/**
 * Deliver one stored notification to every device this person has registered.
 *
 * Failures are swallowed on purpose: a push that does not arrive must never
 * take down the action that caused it. A rejected endpoint is deleted, since
 * the push service is telling us the subscription is dead.
 */
export async function pushNotification(
  userId: string,
  n: { type: string; vars: string; href: string | null },
  locale: string = DEFAULT_LOCALE,
): Promise<void> {
  // Two independent transports, and neither one's absence may silence the
  // other: somebody using only the iPhone app has no Web Push subscription,
  // and a deployment with no VAPID keys still has to reach them.
  if (!pushConfigured && !apnsConfigured) return;

  const d = dictionaryFor(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const copy = renderNotification(n, d);

  await Promise.all([
    pushToBrowsers(userId, copy, n.href),
    pushToDevices(userId, copy, n.href),
  ]);
}

/** Web Push — browsers, and PWAs installed from one. */
async function pushToBrowsers(
  userId: string,
  copy: { title: string; body: string },
  href: string | null,
): Promise<void> {
  if (!pushConfigured) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const payload = JSON.stringify({
    title: copy.title,
    body: copy.body,
    url: href ?? "/home",
  });

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: s.endpoint,
            keys: { p256dh: s.p256dh, auth: s.auth },
          },
          payload,
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await removeSubscription(s.endpoint);
        }
      }
    }),
  );
}

/**
 * APNs — the iOS app shell.
 *
 * Android tokens are stored but not sent to: FCM needs a Firebase project and
 * a `google-services.json` in the shell, neither of which exists yet. They
 * are kept rather than dropped so that turning FCM on later is a sending
 * change, not a "ask every Android user to re-enable notifications" change.
 */
async function pushToDevices(
  userId: string,
  copy: { title: string; body: string },
  href: string | null,
): Promise<void> {
  if (!apnsConfigured) return;

  const devices = await prisma.deviceToken.findMany({
    where: { userId, platform: "APNS" },
  });
  if (devices.length === 0) return;

  const payload = apnsPayload(copy, href);

  await Promise.all(
    devices.map(async (device) => {
      try {
        const result = await sendApns(device.token, payload);
        if (
          apnsTokenIsDead(result.status, result.reason, {
            environmentMatches: result.environmentMatches,
          })
        ) {
          await removeDeviceToken(device.token);
        }
      } catch {
        // An unreachable Apple is not the caller's problem, and it is
        // certainly not a reason to delete somebody's phone.
      }
    }),
  );
}

import "server-only";

import webpush from "web-push";
import { prisma } from "@/lib/db";
import { dictionaryFor } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { renderNotification } from "@/lib/notifications";

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
  if (!pushConfigured) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const d = dictionaryFor(isLocale(locale) ? locale : DEFAULT_LOCALE);
  const copy = renderNotification(n, d);
  const payload = JSON.stringify({
    title: copy.title,
    body: copy.body,
    url: n.href ?? "/home",
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

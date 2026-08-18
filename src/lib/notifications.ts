import "server-only";

import { prisma } from "@/lib/db";
import { fill, type Dictionary } from "@/lib/i18n";
import { badgeLabel, tierLabel } from "@/lib/labels";
import type { BadgeTier } from "@/lib/badges";

/**
 * In-app notifications. Deliberately vague by design: "you got a new rating"
 * never says who, because knowing who rated you right now would defeat the
 * anonymity the whole product rests on.
 *
 * Only the type and its variables are stored; the sentence is rendered in the
 * reader's language by `renderNotification`. A notification written by a
 * Turkish user must not arrive in Turkish for an English reader.
 */

export type NotificationType =
  | "NEW_RATING"
  | "RATING_UPDATED"
  | "INVITE_JOINED"
  | "INVITE_JOINED_EXISTING"
  | "BADGE_EARNED"
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "NEW_MESSAGE"
  | "REPORT_ACTIONED"
  | "REPORT_DISMISSED"
  | "RATING_HIDDEN"
  | "PLAN_GRANTED";

export type NotificationVars = Record<string, string | number>;

export async function notify(
  userId: string,
  type: NotificationType,
  opts: { vars?: NotificationVars; href?: string } = {},
): Promise<void> {
  const row = await prisma.notification.create({
    data: {
      userId,
      type,
      vars: JSON.stringify(opts.vars ?? {}),
      href: opts.href ?? null,
    },
  });

  // Push is best-effort and never blocks the thing that caused it: a rating
  // must still be saved when someone's phone is unreachable. Imported lazily
  // so the web-push dependency is only loaded when a notification actually
  // fires.
  try {
    const { pushNotification } = await import("@/lib/push");
    await pushNotification(userId, row, await readerLocale(userId));
  } catch {
    // Delivery is not the caller's problem.
  }
}

/**
 * Which language to write a push in.
 *
 * There is no request here to read the language cookie from, so we use the
 * locale stored on the person's own subscription-time preference. Falling back
 * to the default is fine; being silent because we could not decide is not.
 */
async function readerLocale(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { locale: true },
  });
  return user?.locale ?? "en";
}

/** Copy for one notification, in the reader's language. */
export function renderNotification(
  n: { type: string; vars: string },
  d: Dictionary,
): { title: string; body: string } {
  let vars: NotificationVars = {};
  try {
    vars = JSON.parse(n.vars) as NotificationVars;
  } catch {
    // A malformed row should render a plain notification, not crash the page.
  }

  // A badge travels as its key so the congratulation is written in the
  // reader's language, not the language the award happened to fire in. The
  // tier travels with it: "Kind Heart" and "Kind Heart · Gold" are different
  // pieces of news, and only one of them is worth interrupting someone for.
  if (typeof vars.badgeKey === "string") {
    vars = {
      ...vars,
      badge: badgeLabel(vars.badgeKey, d),
      tierName:
        typeof vars.tier === "string" ? tierLabel(vars.tier as BadgeTier, d) : "",
    };
  }

  const t = d.notifications;
  const map: Record<string, { title: string; body: string }> = {
    NEW_RATING: { title: t.newRating, body: t.newRatingBody },
    RATING_UPDATED: { title: t.ratingUpdated, body: t.ratingUpdatedBody },
    INVITE_JOINED: { title: t.inviteJoined, body: t.inviteJoinedNew },
    INVITE_JOINED_EXISTING: {
      title: t.inviteJoined,
      body: t.inviteJoinedExisting,
    },
    BADGE_EARNED: { title: t.badgeEarned, body: t.badgeEarnedBody },
    FRIEND_REQUEST: { title: t.friendRequest, body: t.friendRequestBody },
    FRIEND_ACCEPTED: { title: t.friendAccepted, body: t.friendAcceptedBody },
    NEW_MESSAGE: { title: t.newMessage, body: t.newMessageBody },
    REPORT_ACTIONED: { title: t.reportActioned, body: t.reportActionedBody },
    REPORT_DISMISSED: { title: t.reportDismissed, body: t.reportDismissedBody },
    RATING_HIDDEN: { title: t.ratingHidden, body: t.ratingHiddenBody },
    PLAN_GRANTED: { title: t.planGranted, body: t.planGrantedBody },
  };

  const copy = map[n.type] ?? { title: t.generic, body: "" };
  return {
    title: fill(copy.title, vars),
    body: fill(copy.body, vars),
  };
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function listNotifications(userId: string, take = 40) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

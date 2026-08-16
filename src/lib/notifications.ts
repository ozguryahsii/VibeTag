import "server-only";

import { prisma } from "@/lib/db";
import { fill, type Dictionary } from "@/lib/i18n";

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
  | "NEW_MESSAGE";

export type NotificationVars = Record<string, string | number>;

export async function notify(
  userId: string,
  type: NotificationType,
  opts: { vars?: NotificationVars; href?: string } = {},
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId,
      type,
      vars: JSON.stringify(opts.vars ?? {}),
      href: opts.href ?? null,
    },
  });
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

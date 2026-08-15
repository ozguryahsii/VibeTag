import "server-only";

import { prisma } from "@/lib/db";

/**
 * In-app notifications. Deliberately vague by design: "you got a new rating"
 * never says who, because knowing who rated you right now would defeat the
 * anonymity the whole product rests on.
 */

export type NotificationType =
  | "NEW_RATING"
  | "RATING_UPDATED"
  | "INVITE_JOINED"
  | "BADGE_EARNED";

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  href?: string,
): Promise<void> {
  await prisma.notification.create({
    data: { userId, type, title, body: body ?? null, href: href ?? null },
  });
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

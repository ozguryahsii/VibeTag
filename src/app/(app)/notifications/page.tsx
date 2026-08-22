import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  listNotifications,
  markAllRead,
  renderNotification,
} from "@/lib/notifications";
import { respondFriendAction } from "@/lib/actions/social";
import { getDict, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import { BackButton } from "@/components/BackButton";
import { ICONS } from "@/lib/icons";
import { IconGlyph } from "@/components/Icon";
import { Card, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

const ICON_FOR: Record<string, keyof typeof ICONS> = {
  NEW_RATING: "sparkle",
  RATING_UPDATED: "message",
  INVITE_JOINED: "users",
  INVITE_JOINED_EXISTING: "users",
  BADGE_EARNED: "crown",
  FRIEND_REQUEST: "users",
  FRIEND_ACCEPTED: "users",
  NEW_MESSAGE: "envelope",
  REPORT_ACTIONED: "shieldCheck",
  REPORT_DISMISSED: "shieldCheck",
  RATING_HIDDEN: "shieldCheck",
  FRIENDS_NOW: "users",
  PLAN_GRANTED: "crown",
};

function ago(date: Date, d: Dictionary, locale: Locale): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return d.notifications.justNow;
  if (mins < 60) return fill(d.notifications.minutesAgo, { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return fill(d.notifications.hoursAgo, { n: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return d.notifications.dayAgo;
  if (days < 30) return fill(d.notifications.daysAgo, { n: days });
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "long",
  }).format(date);
}

/** The typed vars a notification may carry. Old rows simply lack keys. */
function varsOf(raw: string): { username?: string; friendshipId?: string } {
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    return {
      username: typeof v.username === "string" ? v.username : undefined,
      friendshipId:
        typeof v.friendshipId === "string" ? v.friendshipId : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * A sheet, not a tab: slides in from the right and backs out top-left, so
 * notifications feel like a drawer over whatever screen summoned them.
 *
 * The list acts, not just points. A friend request is answered right here,
 * and a name opens its profile — going to People first is a detour nobody
 * chose. Older notifications, written before identity travelled in vars,
 * fall back to being plain links.
 */
export default async function NotificationsPage() {
  const user = await requireUser();
  const d = await getDict();
  const locale = await getLocale();
  const items = await listNotifications(user.id);
  await markAllRead(user.id);

  // Which friend requests are still live? A request answered from People
  // must not keep offering buttons here.
  const pending = await prisma.friendship.findMany({
    where: { addresseeId: user.id, status: "PENDING" },
    select: { id: true },
  });
  const pendingIds = new Set(pending.map((f) => f.id));

  return (
    <main className="vt-sheet px-5 pt-10">
      <div className="flex items-center justify-between gap-3">
        <BackButton />
        <LangToggle className="shrink-0" />
      </div>
      <p className="mt-6 text-[10px] font-extrabold tracking-[0.25em] text-coral">
        {d.notifications.kicker}
      </p>
      <h1 className="vt-page-title mt-2 text-[31px] tracking-[-0.02em]">
        {d.notifications.title}
      </h1>
      <p className="text-[13px] text-muted mt-1">{d.notifications.subtitle}</p>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            emoji="✦"
            title={d.notifications.emptyTitle}
            body={d.notifications.emptyBody}
          />
        </div>
      ) : (
        [
          { header: d.notifications.fresh, rows: items.filter((n) => !n.readAt) },
          { header: d.notifications.earlier, rows: items.filter((n) => !!n.readAt) },
        ]
          .filter((g) => g.rows.length > 0)
          .map((group) => (
            <div key={group.header} className="mt-6">
              <p className="mb-2.5 px-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">
                {group.header}
              </p>
              <div className="grid gap-2.5">
                {group.rows.map((n) => {
            const copy = renderNotification(n, d);
            const vars = varsOf(n.vars);
            const requestOpen =
              n.type === "FRIEND_REQUEST" &&
              !!vars.friendshipId &&
              pendingIds.has(vars.friendshipId);

            const title = vars.username ? (
              <Link
                href={`/u/${vars.username}`}
                className="block text-[13.5px] font-extrabold"
              >
                {copy.title}
              </Link>
            ) : (
              <span className="block text-[13.5px] font-extrabold">
                {copy.title}
              </span>
            );

            const unread = !n.readAt;
            const body = (
              <Card
                className={`relative flex gap-3.5 !py-4 ${
                  unread
                    ? "!border-orange/30 !bg-tagbg/60"
                    : "opacity-70 saturate-[0.85]"
                }`}
              >
                {unread && (
                  <span
                    className="absolute right-3.5 top-3.5 h-2 w-2 rounded-full grad-score"
                    aria-hidden="true"
                  />
                )}
                <span
                  className="w-9 h-9 shrink-0 grid place-items-center rounded-full"
                  style={{ background: unread ? "#FFE7D8" : "#F4EDE4" }}
                >
                  <IconGlyph
                    def={ICONS[ICON_FOR[n.type] ?? "sparkle"]}
                    size={18}
                    color={unread ? "#FF8A3D" : "#B0A79B"}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  {title}
                  {copy.body && (
                    <span className="block text-[12.5px] text-muted leading-relaxed mt-0.5">
                      {copy.body}
                    </span>
                  )}
                  <span className="block text-[11px] text-muted mt-1">
                    {ago(n.createdAt, d, locale)}
                  </span>
                  {requestOpen && (
                    <span className="mt-2.5 flex gap-2">
                      <form action={respondFriendAction}>
                        <input
                          type="hidden"
                          name="friendshipId"
                          value={vars.friendshipId}
                        />
                        <input type="hidden" name="decision" value="accept" />
                        <button className="text-[12px] font-bold text-white grad-score rounded-full px-3.5 py-2">
                          {d.people.accept}
                        </button>
                      </form>
                      <form action={respondFriendAction}>
                        <input
                          type="hidden"
                          name="friendshipId"
                          value={vars.friendshipId}
                        />
                        <input type="hidden" name="decision" value="decline" />
                        <button className="text-[12px] font-bold text-muted bg-white border border-line rounded-full px-3.5 py-2">
                          {d.people.decline}
                        </button>
                      </form>
                    </span>
                  )}
                </span>
              </Card>
            );

            // A card with its own links or buttons must not also be one big
            // link — nested interactive elements fight over every tap.
            const interactive = requestOpen || !!vars.username;
            return !interactive && n.href ? (
              <Link key={n.id} href={n.href}>
                {body}
              </Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
                })}
              </div>
            </div>
          ))
      )}
    </main>
  );
}

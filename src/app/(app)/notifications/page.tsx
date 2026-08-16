import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  listNotifications,
  markAllRead,
  renderNotification,
} from "@/lib/notifications";
import { getDict, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
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

export default async function NotificationsPage() {
  const user = await requireUser();
  const d = await getDict();
  const locale = await getLocale();
  const items = await listNotifications(user.id);
  await markAllRead(user.id);

  return (
    <main className="px-5 pt-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.25em] text-coral mb-2">
            {d.notifications.kicker}
          </p>
          <h1 className="vt-page-title text-[31px] tracking-[-0.02em]">
            {d.notifications.title}
          </h1>
        </div>
        <LangToggle className="mt-1 shrink-0" />
      </div>
      <p className="text-[13px] text-muted mt-1">{d.notifications.subtitle}</p>

      <div className="mt-6 grid gap-2.5">
        {items.length === 0 ? (
          <EmptyState
            emoji="✦"
            title={d.notifications.emptyTitle}
            body={d.notifications.emptyBody}
          />
        ) : (
          items.map((n) => {
            const copy = renderNotification(n, d);
            const body = (
              <Card
                className={`flex gap-3.5 !py-4 ${n.readAt ? "opacity-75" : ""}`}
              >
                <span
                  className="w-9 h-9 shrink-0 grid place-items-center rounded-full"
                  style={{ background: "#FFF0E8" }}
                >
                  <IconGlyph
                    def={ICONS[ICON_FOR[n.type] ?? "sparkle"]}
                    size={18}
                    color="#FF8A3D"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-extrabold">
                    {copy.title}
                  </span>
                  {copy.body && (
                    <span className="block text-[12.5px] text-muted leading-relaxed mt-0.5">
                      {copy.body}
                    </span>
                  )}
                  <span className="block text-[11px] text-muted mt-1">
                    {ago(n.createdAt, d, locale)}
                  </span>
                </span>
              </Card>
            );
            return n.href ? (
              <Link key={n.id} href={n.href}>
                {body}
              </Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
          })
        )}
      </div>
    </main>
  );
}

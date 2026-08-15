import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listNotifications, markAllRead } from "@/lib/notifications";
import { ICONS } from "@/lib/icons";
import { IconGlyph } from "@/components/Icon";
import { Card, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

const ICON_FOR: Record<string, keyof typeof ICONS> = {
  NEW_RATING: "sparkle",
  RATING_UPDATED: "message",
  INVITE_JOINED: "users",
  BADGE_EARNED: "crown",
};

function ago(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gün önce`;
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" }).format(d);
}

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await listNotifications(user.id);
  await markAllRead(user.id);

  return (
    <main className="px-5 pt-12">
      <h1 className="text-[27px] font-black tracking-[-0.02em]">Bildirimler</h1>
      <p className="text-[13px] text-muted mt-1">
        Kimin değerlendirdiğini burada da göremezsin — bu bilinçli.
      </p>

      <div className="mt-6 grid gap-2.5">
        {items.length === 0 ? (
          <EmptyState
            emoji="🔔"
            title="Henüz bildirim yok"
            body="Biri seni değerlendirdiğinde ya da davetin kabul edildiğinde burada göreceksin."
          />
        ) : (
          items.map((n) => {
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
                    {n.title}
                  </span>
                  {n.body && (
                    <span className="block text-[12.5px] text-muted leading-relaxed mt-0.5">
                      {n.body}
                    </span>
                  )}
                  <span className="block text-[11px] text-muted mt-1">
                    {ago(n.createdAt)}
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

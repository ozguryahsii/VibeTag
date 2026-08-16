import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import { listConversations } from "@/lib/social";
import { Avatar } from "@/components/Avatar";
import { Card, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const me = await requireUser();
  const d = await getDict();
  const threads = await listConversations(me.id);

  return (
    <main className="px-5 pt-10">
      <p className="text-[10px] font-extrabold tracking-[0.24em] text-coral mb-2">
        DM
      </p>
      <h1 className="vt-page-title text-[28px] tracking-[-0.02em]">
        {d.messages.title}
      </h1>
      <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
        {d.messages.subtitle}
      </p>

      <div className="mt-6 grid gap-2.5">
        {threads.length === 0 ? (
          <EmptyState
            emoji="✉️"
            title={d.messages.emptyTitle}
            body={d.messages.emptyBody}
          />
        ) : (
          threads.map((t) => (
            <Link key={t.id} href={`/messages/${t.id}`}>
              <Card className="flex items-center gap-3.5 !py-4">
                {t.otherIsAnonymous ? (
                  <span className="w-11 h-11 shrink-0 grid place-items-center rounded-full bg-line text-[16px]">
                    🕶️
                  </span>
                ) : (
                  <Avatar
                    name={t.other.name}
                    url={t.other.avatarUrl}
                    color={t.other.avatarColor}
                    size={44}
                  />
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-extrabold truncate">
                    {t.otherIsAnonymous
                      ? d.messages.anonymousPartner
                      : t.other.name}
                  </p>
                  <p className="text-[12.5px] text-muted truncate mt-0.5">
                    {t.lastMessage
                      ? `${t.lastMessage.senderId === me.id ? `${d.messages.you}: ` : ""}${t.lastMessage.body}`
                      : d.messages.startedFromRating}
                  </p>
                </div>

                {t.unread > 0 && (
                  <span className="shrink-0 min-w-6 h-6 px-2 grid place-items-center rounded-full grad-score text-white text-[11px] font-black">
                    {t.unread}
                  </span>
                )}
              </Card>
            </Link>
          ))
        )}
      </div>

      {threads.some((t) => t.kind === "RATING") && (
        <p className="text-[11.5px] text-muted mt-4 px-1 leading-relaxed">
          {d.messages.anonymousNote}
        </p>
      )}
    </main>
  );
}

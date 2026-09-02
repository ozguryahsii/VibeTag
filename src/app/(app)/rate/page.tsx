import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cooldownDaysLeft } from "@/lib/rating-rules";
import { InviteShareBlock } from "@/components/InviteShareBlock";
import { getDict } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import { LangToggle } from "@/components/LangToggle";
import { Avatar, Card, EmptyState, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RatePickerPage() {
  const me = await requireUser();
  const d = await getDict();

  const [users, mine] = await Promise.all([
    prisma.user.findMany({
      // A paused profile is not a suggestion — tapping it would only
      // open a closed door.
      where: { id: { not: me.id }, ratingPolicy: { not: "NOBODY" } },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        avatarColor: true,
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    prisma.rating.findMany({
      where: { raterUserId: me.id },
      select: { ratedUserId: true, lastUpdatedAt: true, updateCount: true },
    }),
  ]);

  const mineMap = new Map(mine.map((r) => [r.ratedUserId, r]));
  const fresh = users.filter((u) => !mineMap.has(u.id));
  const rated = users.filter((u) => mineMap.has(u.id));

  return (
    <main className="px-5 pt-10">
      {/* Half of this screen is "let people rate me", so the share card leads. */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.25em] text-coral mb-2">
            {d.rate.shareKicker}
          </p>
          <h1 className="vt-page-title text-[31px] tracking-[-0.02em] leading-[1.08]">
            {d.rate.shareTitle}
          </h1>
        </div>
        <LangToggle className="mt-1 shrink-0" />
      </div>
      <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
        {d.rate.shareBody}
      </p>

      <InviteShareBlock />

      <div className="mt-4 text-center">
        <Link
          href="/invite"
          className="text-[12.5px] font-bold text-orange underline underline-offset-2"
        >
          {d.rate.manageLink}
        </Link>
      </div>

      <div className="mt-9 pt-7 border-t border-line">
        <p className="text-[10px] font-extrabold tracking-[0.25em] text-coral mb-2">
          {d.rate.listKicker}
        </p>
        <h2 className="vt-page-title text-[26px] tracking-[-0.02em] leading-[1.1]">
          {d.rate.listTitle}
        </h2>
        <p
          className="text-[13px] text-muted mt-1.5 leading-relaxed [&_b]:text-ink"
          dangerouslySetInnerHTML={{ __html: d.rate.listBody }}
        />
      </div>

      <div className="mt-6">
        <SectionTitle>{d.rate.notRatedYet}</SectionTitle>
        {fresh.length === 0 ? (
          <EmptyState
            emoji="✓"
            title={d.rate.allRatedTitle}
            body={d.rate.allRatedBody}
          />
        ) : (
          <div className="grid gap-2.5">
            {fresh.map((u) => (
              <Link key={u.id} href={`/rate/${u.username}`} className="block min-w-0">
                <Card className="min-w-0 flex items-center gap-3.5 !py-3.5">
                  <Avatar name={u.name}
                    url={u.avatarUrl} color={u.avatarColor} size={46} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-extrabold truncate">
                      {u.name}
                    </p>
                    <p className="text-[12px] text-muted truncate">
                      {u.bio ?? `@${u.username}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-[12px] font-bold text-white grad-score rounded-full px-4 py-2">
                    {d.rate.rateCta}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {rated.length > 0 && (
        <div className="mt-7">
          <SectionTitle>{d.rate.rated}</SectionTitle>
          <div className="grid gap-2.5">
            {rated.map((u) => {
              const r = mineMap.get(u.id)!;
              const days = cooldownDaysLeft(r.lastUpdatedAt);
              return (
                <Link key={u.id} href={`/rate/${u.username}`} className="block min-w-0">
                  <Card className="min-w-0 flex items-center gap-3.5 !py-3.5 opacity-90">
                    <Avatar
                      name={u.name}
                    url={u.avatarUrl}
                      color={u.avatarColor}
                      size={42}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-extrabold truncate">
                        {u.name}
                      </p>
                      <p className="text-[11.5px] text-muted">
                        {days > 0
                          ? fill(d.rate.updatableIn, { n: days })
                          : d.rate.updatableNow}
                        {r.updateCount > 0 &&
                          ` · ${fill(d.rate.updateCount, { n: r.updateCount })}`}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-[11.5px] font-bold rounded-full px-3 py-1.5"
                      style={{
                        color: days > 0 ? "#6B6B6B" : "#FF8A3D",
                        background: days > 0 ? "#F5F0EA" : "#FFF0E8",
                        border: `1px solid ${days > 0 ? "#E9E1D9" : "#FFE3D2"}`,
                      }}
                    >
                      {days > 0 ? d.rate.locked : d.rate.update}
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}

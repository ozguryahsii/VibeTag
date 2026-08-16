import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getVibeProfile } from "@/lib/profile";
import { computeBadges } from "@/lib/badges";
import { getDict, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { badgeDescription, badgeLabel } from "@/lib/labels";
import { ICONS } from "@/lib/icons";
import { IconGlyph } from "@/components/Icon";
import { LangToggle } from "@/components/LangToggle";
import { Card, Meter, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

function fmtDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function BadgesPage() {
  const user = await requireUser();
  const [d, locale, profile, held] = await Promise.all([
    getDict(),
    getLocale(),
    getVibeProfile(user.id),
    prisma.earnedBadge.findMany({
      where: { userId: user.id },
      select: { key: true, earnedAt: true },
    }),
  ]);

  const earnedAt = new Map(held.map((b) => [b.key, b.earnedAt]));
  // `computeBadges` says who qualifies right now; the award rows say who
  // actually owns one. A badge is kept once earned, so ownership wins.
  const all = computeBadges(profile).map((b) => ({
    ...b,
    earned: b.earned || earnedAt.has(b.key),
    earnedAt: earnedAt.get(b.key) ?? null,
  }));

  const earned = all.filter((b) => b.earned);
  const locked = all
    .filter((b) => !b.earned)
    .sort((a, b) => b.progress - a.progress);

  return (
    <main className="px-5 pt-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.25em] text-coral mb-2">
            {d.badgesPage.kicker}
          </p>
          <h1 className="vt-page-title text-[31px] tracking-[-0.02em]">
            {d.badgesPage.title}
          </h1>
        </div>
        <LangToggle className="mt-1 shrink-0" />
      </div>
      <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
        {d.badgesPage.subtitle}
      </p>

      <div className="mt-5 flex items-center gap-3">
        <div className="flex-1">
          <Meter value={(earned.length / all.length) * 100} />
        </div>
        <span className="shrink-0 text-[12px] font-bold text-muted tabular-nums">
          {fill(d.badgesPage.countEarned, {
            n: earned.length,
            total: all.length,
          })}
        </span>
      </div>

      {earned.length > 0 && (
        <div className="mt-7">
          <SectionTitle>{d.badgesPage.earned}</SectionTitle>
          <div className="grid grid-cols-2 gap-2.5">
            {earned.map((b) => (
              <div
                key={b.key}
                className="rounded-[24px] border border-orange/25 bg-warmwhite p-4 text-center"
                style={{ boxShadow: "0 10px 28px rgba(255,138,61,0.14)" }}
              >
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full grad-score">
                  <IconGlyph
                    def={ICONS[b.icon]}
                    size={23}
                    color="#fff"
                    strokeWidth={2}
                  />
                </span>
                <p className="mt-2.5 text-[13.5px] font-extrabold leading-tight">
                  {badgeLabel(b.key, d)}
                </p>
                <p className="mt-1 text-[11px] text-muted leading-relaxed">
                  {badgeDescription(b.key, d)}
                </p>
                {b.earnedAt && (
                  <p className="mt-2 text-[10.5px] font-bold text-orange">
                    {fill(d.badgesPage.earnedOn, {
                      date: fmtDate(b.earnedAt, locale),
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div className="mt-7 mb-2">
          <SectionTitle>{d.badgesPage.locked}</SectionTitle>

          {earned.length === 0 && (
            <Card className="!py-4 mb-2.5">
              <p className="text-[13.5px] font-bold">
                {d.badgesPage.noneEarnedTitle}
              </p>
              <p className="text-[12.5px] text-muted mt-1 leading-relaxed">
                {d.badgesPage.noneEarnedBody}
              </p>
            </Card>
          )}

          <div className="grid gap-2.5">
            {locked.map((b) => (
              <Card key={b.key} className="flex items-center gap-3.5 !py-4">
                {/* Greyed, not hidden: an unreachable-looking badge is not a goal. */}
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-cream border border-line">
                  <IconGlyph
                    def={ICONS[b.icon]}
                    size={20}
                    color="#B5A99F"
                    strokeWidth={1.8}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13.5px] font-extrabold text-muted">
                      {badgeLabel(b.key, d)}
                    </p>
                    <span className="shrink-0 text-[11px] font-bold text-muted tabular-nums">
                      {fill(d.badgesPage.progress, {
                        n: Math.round(b.progress * 100),
                      })}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-muted leading-relaxed mt-0.5 mb-2">
                    {badgeDescription(b.key, d)}
                  </p>
                  <Meter value={b.progress * 100} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {locked.length === 0 && (
        <p className="mt-6 mb-2 text-center text-[13px] font-bold text-orange">
          {d.badgesPage.allEarned}
        </p>
      )}
    </main>
  );
}

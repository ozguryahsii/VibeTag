import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getVibeProfile } from "@/lib/profile";
import {
  BADGE_COUNT,
  BADGE_TIERS,
  computeBadges,
  type BadgeTier,
} from "@/lib/badges";
import { getDict, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { badgeDescription, badgeLabel, badgeRequirement, tierLabel } from "@/lib/labels";
import { TIER_STYLE } from "@/lib/tier-style";
import { iconFor } from "@/lib/icons";
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
      select: { key: true, tier: true, earnedAt: true },
    }),
  ]);

  const earnedAt = new Map(held.map((b) => [`${b.key}:${b.tier}`, b.earnedAt]));
  // `computeBadges` says who qualifies right now; the award rows say who
  // actually owns one. A badge is kept once earned, so ownership wins.
  const all = computeBadges(profile).map((b) => {
    const at = earnedAt.get(`${b.key}:${b.tier}`) ?? null;
    return { ...b, earned: b.earned || at !== null, earnedAt: at };
  });

  const earnedTotal = all.filter((b) => b.earned).length;

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
          <Meter value={(earnedTotal / BADGE_COUNT) * 100} />
        </div>
        <span className="shrink-0 text-[12px] font-bold text-muted tabular-nums">
          {fill(d.badgesPage.countEarned, {
            n: earnedTotal,
            total: BADGE_COUNT,
          })}
        </span>
      </div>

      {earnedTotal === 0 && (
        <Card className="!py-4 mt-5">
          <p className="text-[13.5px] font-bold">
            {d.badgesPage.noneEarnedTitle}
          </p>
          <p className="text-[12.5px] text-muted mt-1 leading-relaxed">
            {d.badgesPage.noneEarnedBody}
          </p>
        </Card>
      )}

      {/* Bronze first: the page reads as a ladder you climb, not a trophy
          cabinet you have already filled. */}
      {BADGE_TIERS.map((tier) => {
        const badges = all
          .filter((b) => b.tier === tier)
          .sort((a, b) =>
            a.earned === b.earned ? b.progress - a.progress : a.earned ? -1 : 1,
          );
        const got = badges.filter((b) => b.earned).length;
        const style = TIER_STYLE[tier as BadgeTier];

        return (
          <section key={tier} className="mt-7">
            <div className="flex items-baseline justify-between gap-2">
              <SectionTitle>{tierLabel(tier, d)}</SectionTitle>
              <span
                className="shrink-0 text-[11.5px] font-extrabold tabular-nums"
                style={{ color: style.ink }}
              >
                {fill(d.badgesPage.tierCount, {
                  n: got,
                  total: badges.length,
                })}
              </span>
            </div>
            <p className="text-[11.5px] text-muted leading-relaxed -mt-1 mb-2.5">
              {d.badgesPage.tierIntro[tier]}
            </p>

            <div className="grid gap-2.5">
              {badges.map((b) => (
                <Card
                  key={`${b.key}:${b.tier}`}
                  className="flex items-center gap-3.5 !py-4"
                  style={
                    b.earned
                      ? { borderColor: style.ring, background: "#FFFDF9" }
                      : undefined
                  }
                >
                  {/* Same glyph at every tier — only the colour climbs. A
                      different icon per tier would stop reading as one badge. */}
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                      b.earned ? style.grad : "bg-cream border border-line"
                    }`}
                  >
                    <IconGlyph
                      def={iconFor(b.icon)}
                      size={21}
                      color={b.earned ? "#fff" : "#B5A99F"}
                      strokeWidth={b.earned ? 2 : 1.8}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={`text-[13.5px] font-extrabold ${
                          b.earned ? "" : "text-muted"
                        }`}
                      >
                        {badgeLabel(b.key, d)}
                      </p>
                      {b.earned ? (
                        <span
                          className="shrink-0 text-[10.5px] font-bold"
                          style={{ color: style.ink }}
                        >
                          {b.earnedAt
                            ? fill(d.badgesPage.earnedOn, {
                                date: fmtDate(b.earnedAt, locale),
                              })
                            : tierLabel(tier, d)}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[11px] font-bold text-muted tabular-nums">
                          {fill(d.badgesPage.progress, {
                            n: Math.round(b.progress * 100),
                          })}
                        </span>
                      )}
                    </div>

                    <p className="text-[11.5px] text-muted leading-relaxed mt-0.5">
                      {badgeDescription(b.key, d)}
                    </p>
                    <p
                      className="text-[11px] font-bold mt-1 mb-2"
                      style={{ color: b.earned ? style.ink : undefined }}
                    >
                      <span className={b.earned ? "" : "text-muted"}>
                        {badgeRequirement(b, d, locale)}
                      </span>
                    </p>

                    {!b.earned && <Meter value={b.progress * 100} />}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        );
      })}

      {earnedTotal === BADGE_COUNT && (
        <p className="mt-6 mb-2 text-center text-[13px] font-bold text-orange">
          {d.badgesPage.allEarned}
        </p>
      )}
      <div className="h-4" />
    </main>
  );
}

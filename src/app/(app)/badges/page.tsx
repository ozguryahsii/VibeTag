import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getVibeProfile } from "@/lib/profile";
import {
  BADGE_COUNT,
  BADGE_TIERS,
  bestPerFamily,
  computeBadges,
  type Badge,
  type BadgeTier,
} from "@/lib/badges";
import { getDict, getLocale } from "@/lib/i18n/server";
import { fill, type Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { badgeLabel, badgeRequirement, percent, tierLabel } from "@/lib/labels";
import { TIER_STYLE } from "@/lib/tier-style";
import { iconFor } from "@/lib/icons";
import { IconGlyph } from "@/components/Icon";
import { LangToggle } from "@/components/LangToggle";
import { Card, Meter, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

type Held = Badge & { earnedAt: Date | null };

function fmtDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * One badge, as a square.
 *
 * Four facts and nothing else: which badge, which tier, what it cost, and —
 * if it is yours — when. The blurb that used to sit in the middle turned a
 * shelf into an essay; a wall of tiles you can scan beats ten paragraphs you
 * will not read twice.
 */
function BadgeTile({
  badge,
  d,
  locale,
}: {
  badge: Held;
  d: Dictionary;
  locale: Locale;
}) {
  const style = TIER_STYLE[badge.tier];
  const earned = badge.earned;

  return (
    <Card
      padded={false}
      className="flex flex-col items-center p-2.5 text-center"
      style={
        earned
          ? { borderColor: style.ring, background: "#FFFDF9" }
          : { opacity: 0.62 }
      }
    >
      {/* Same glyph at every tier — only the metal climbs. */}
      <span
        className={`grid h-10 w-10 place-items-center rounded-full ${
          earned ? style.grad : "bg-cream border border-line"
        }`}
      >
        <IconGlyph
          def={iconFor(badge.icon)}
          size={19}
          color={earned ? "#fff" : "#B5A99F"}
          strokeWidth={earned ? 2 : 1.8}
        />
      </span>

      <p
        className={`mt-1.5 text-[11.5px] font-extrabold leading-[1.15] ${
          earned ? "" : "text-muted"
        }`}
      >
        {badgeLabel(badge.key, d)}
      </p>
      <p
        className="text-[9.5px] font-bold leading-tight mt-0.5"
        style={{ color: style.ink }}
      >
        {tierLabel(badge.tier, d)}
      </p>

      <p className="mt-1 text-[9.5px] text-muted leading-tight">
        {badgeRequirement(badge, d, locale)}
      </p>

      {earned ? (
        <p className="mt-1 text-[9.5px] font-bold text-muted tabular-nums">
          {badge.earnedAt ? fmtDate(badge.earnedAt, locale) : "—"}
        </p>
      ) : (
        <div className="mt-1.5 w-full">
          <Meter value={badge.progress * 100} />
          <p className="mt-1 text-[9.5px] font-bold text-muted tabular-nums">
            {percent(badge.progress * 100, locale)}
          </p>
        </div>
      )}
    </Card>
  );
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
  const all: Held[] = computeBadges(profile).map((b) => {
    const at = earnedAt.get(`${b.key}:${b.tier}`) ?? null;
    return { ...b, earned: b.earned || at !== null, earnedAt: at };
  });

  const earnedTotal = all.filter((b) => b.earned).length;

  // The top shelf is the best tier of each family you hold. Everything else —
  // not yet earned, or earned but since surpassed — waits below in its own
  // tier, so the same badge is never shown twice on one screen.
  const best = bestPerFamily(all) as Held[];
  const bestIds = new Set(best.map((b) => `${b.key}:${b.tier}`));

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

      {best.length > 0 ? (
        <section className="mt-7">
          <SectionTitle>{d.badgesPage.earned}</SectionTitle>
          <div className="grid grid-cols-3 gap-2.5">
            {best.map((b) => (
              <BadgeTile
                key={`${b.key}:${b.tier}`}
                badge={b}
                d={d}
                locale={locale}
              />
            ))}
          </div>
        </section>
      ) : (
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
          .filter((b) => b.tier === tier && !bestIds.has(`${b.key}:${b.tier}`))
          .sort((a, b) =>
            a.earned === b.earned ? b.progress - a.progress : a.earned ? -1 : 1,
          );
        if (badges.length === 0) return null;

        // Counted over the whole tier, not over what is left after the top
        // shelf borrowed some. "Silver 2/3" when there are ten silver badges
        // is a number that answers a question nobody asked.
        const ofTier = all.filter((b) => b.tier === tier);
        const got = ofTier.filter((b) => b.earned).length;
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
                  total: ofTier.length,
                })}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {badges.map((b) => (
                <BadgeTile
                  key={`${b.key}:${b.tier}`}
                  badge={b}
                  d={d}
                  locale={locale}
                />
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

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { unreadCount } from "@/lib/notifications";
import { getDict, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import { badgeDescription, badgeLabel, tagLabel, traitLabel } from "@/lib/labels";
import { LangToggle } from "@/components/LangToggle";
import { getPercentile, getVibeProfile } from "@/lib/profile";
import { computeBadges } from "@/lib/badges";
import { generateVibeSummary } from "@/lib/insights";
import { IconGlyph, TraitIcon } from "@/components/Icon";
import { ICONS } from "@/lib/icons";
import { ScoreDial } from "@/components/ScoreDial";
import { VibeMark } from "@/components/Logo";
import { Avatar, Button, Card, EmptyState, Meter, SectionTitle, TagPill } from "@/components/ui";

function greetingKey(): "greetingNight" | "greetingMorning" | "greetingDay" | "greetingEvening" {
  const h = new Date().getHours();
  if (h < 6) return "greetingNight";
  if (h < 12) return "greetingMorning";
  if (h < 18) return "greetingDay";
  return "greetingEvening";
}

export default async function HomePage() {
  const user = await requireUser();
  const profile = await getVibeProfile(user.id);
  const percentile = await getPercentile(user.id, profile.score);
  const [unread, d, locale, held] = await Promise.all([
    unreadCount(user.id),
    getDict(),
    getLocale(),
    prisma.earnedBadge.findMany({
      where: { userId: user.id },
      select: { key: true },
    }),
  ]);

  // Owned badges beat the live calculation — a badge is kept once earned, and
  // the shelf here has to agree with the Badges tab.
  const heldKeys = new Set(held.map((b) => b.key));
  const badges = computeBadges(profile).map((b) => ({
    ...b,
    earned: b.earned || heldKeys.has(b.key),
  }));
  const earned = badges.filter((b) => b.earned);
  const summary = generateVibeSummary(profile, user.name.split(" ")[0], d, locale);

  return (
    <main className="px-5 pt-12">
      {/* header */}
      <header className="flex items-center justify-between reveal">
        <div>
          <p className="text-[11px] text-muted font-semibold uppercase tracking-[0.2em]">
            {d.home[greetingKey()]}
          </p>
          <h1 className="font-display text-[27px] font-semibold tracking-[-0.035em] text-ink">
            {user.name.split(" ")[0]}
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <LangToggle />
          <Link
            href="/notifications"
            aria-label={d.nav.notifications}
            className="relative w-11 h-11 grid place-items-center rounded-full bg-warmwhite border border-line"
          >
            <IconGlyph def={ICONS.bell} size={19} color="#6B6B6B" />
            {unread > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 grid place-items-center rounded-full grad-score text-white text-[10px] font-black"
                style={{ boxShadow: "0 0 0 2.5px #FAF7F2" }}
              >
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Link href="/settings" aria-label={d.nav.profile}>
            <Avatar
              name={user.name}
              url={user.avatarUrl}
              color={user.avatarColor}
              size={46}
              ring
            />
          </Link>
        </div>
      </header>

      {/* Vibe identity card */}
      <section
        className="relative mt-6 overflow-hidden rounded-[32px] border border-line/90 bg-warmwhite px-5 pb-5 pt-7 text-center pop"
        style={{ boxShadow: "0 24px 56px rgba(83,60,40,0.14)" }}
      >
        <div
          className="pointer-events-none absolute -left-20 -top-12 h-28 w-60 rotate-[-9deg] rounded-[50%] opacity-55"
          style={{
            background:
              profile.score >= 85
                ? "linear-gradient(135deg, rgba(245,173,60,.78), rgba(239,113,70,.56), rgba(231,61,118,.26))"
                : "linear-gradient(135deg, rgba(228,215,200,.8), rgba(238,228,213,.24))",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-16 -right-16 h-32 w-64 rotate-[-12deg] rounded-[50%] opacity-45"
          style={{
            background:
              profile.score >= 85
                ? "linear-gradient(135deg, rgba(242,160,63,.28), rgba(240,82,98,.64), rgba(231,61,118,.86))"
                : "linear-gradient(135deg, rgba(238,228,213,.3), rgba(228,215,200,.8))",
          }}
          aria-hidden="true"
        />
        <div className="absolute right-5 top-5 opacity-90" aria-hidden="true">
          <VibeMark size={43} id="home-card-mark" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <Avatar
            name={user.name}
            url={user.avatarUrl}
            color={user.avatarColor}
            size={82}
            ring
          />
          <h2 className="mt-3 font-display text-[25px] font-semibold tracking-[-0.035em] text-ink">
            {user.name}
          </h2>
          <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
            <span className="h-px w-8 bg-line" />
            <span className="h-1.5 w-1.5 rounded-full bg-coral" />
            <span className="h-px w-8 bg-line" />
          </div>

          <ScoreDial
            score={profile.score}
            caption={
              percentile
                ? fill(d.home.topPercent, { n: percentile })
                : profile.ratingCount > 0
                  ? fill(d.home.ratedCount, { n: profile.ratingCount })
                  : d.home.awaitingFirst
            }
          />

          {profile.tags.length > 0 && (
            <div className="w-full">
              <p className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.22em] text-muted">
                {d.home.seeYouAs}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {profile.tags.slice(0, 4).map((t) => (
                  <TagPill key={t.key} tagKey={t.key} label={tagLabel(t.key, locale)} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex w-full items-center justify-between border-t border-line/80 pt-4 text-left">
            <p className="text-[12px] leading-tight text-muted">
              {d.common.ratedBy}
              <span className="mt-0.5 block text-[16px] font-semibold text-ink">
                {profile.ratingCount} {d.common.people}
              </span>
            </p>
            {profile.tags.length > 0 && (
              <Link
                href="/card"
                className="rounded-full border border-orange/35 bg-warmwhite/80 px-4 py-2 text-[12px] font-semibold text-coral shadow-[0_5px_14px_rgba(221,105,55,0.1)]"
              >
                {d.home.shareCard}
              </Link>
            )}
          </div>
        </div>
      </section>

      {profile.tags.length === 0 && (
        <section className="mt-7 reveal" style={{ animationDelay: "120ms" }}>
          <SectionTitle>{d.home.seeYouAs}</SectionTitle>
          <EmptyState
            emoji="🌱"
            title={d.home.emptyTitle}
            body={d.home.emptyBody}
            action={<Button href="/invite">{d.home.emptyCta}</Button>}
          />
        </section>
      )}

      {profile.tags.length > 4 && (
        <section className="mt-6 reveal" style={{ animationDelay: "150ms" }}>
          <SectionTitle>{d.home.moreVibe}</SectionTitle>
          <Card className="flex flex-wrap gap-2">
            {profile.tags.slice(4, 8).map((t) => (
              <TagPill key={t.key} tagKey={t.key} label={tagLabel(t.key, locale)} count={t.count} />
            ))}
          </Card>
        </section>
      )}

      {/* AI summary teaser */}
      {profile.ratingCount > 0 && (
        <section className="mt-6 reveal" style={{ animationDelay: "200ms" }}>
          <SectionTitle
            action={
              <Link href="/insights" className="text-[12px] font-bold text-coral">
                {d.home.seeAll}
              </Link>
            }
          >
            {d.home.aiSummary}
          </SectionTitle>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-extrabold tracking-[0.16em] text-coral">
                {d.home.aiBadge}
              </span>
            </div>
            <p className="text-[17px] font-extrabold leading-snug tracking-[-0.01em]">
              {summary.headline}
            </p>
            <p className="text-[13px] text-muted leading-relaxed mt-2">
              {summary.paragraph}
            </p>
          </Card>
        </section>
      )}

      {/* strongest traits */}
      {profile.traits.length > 0 && (
        <section className="mt-6 reveal" style={{ animationDelay: "260ms" }}>
          <SectionTitle>{d.home.strongest}</SectionTitle>
          <Card className="grid gap-4">
            {profile.traits.slice(0, 4).map((t) => (
              <div key={t.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13.5px] font-bold inline-flex items-center gap-2">
                    <TraitIcon traitKey={t.key} color="#FF8A3D" />
                    {traitLabel(t.key, locale)}
                  </span>
                  <span className="text-[13px] font-black tabular-nums grad-text">
                    {t.score}
                  </span>
                </div>
                <Meter value={t.score} />
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* badges */}
      <section className="mt-6 reveal" style={{ animationDelay: "320ms" }}>
        <SectionTitle
          action={
            <Link href="/badges" className="text-[12px] font-bold text-coral">
              {d.home.seeAll}
            </Link>
          }
        >
          {d.home.badges}
        </SectionTitle>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {(earned.length ? earned : badges).slice(0, 6).map((b) => (
            <div
              key={b.key}
              className="card shrink-0 w-[132px] p-3.5 text-center"
              style={{ opacity: b.earned ? 1 : 0.55 }}
            >
              <div className="grid place-items-center h-7">
                <IconGlyph def={ICONS[b.icon]} size={24} color="#FF7A4D" strokeWidth={1.8} />
              </div>
              <div className="text-[12.5px] font-extrabold mt-1.5 leading-tight">
                {badgeLabel(b.key, d)}
              </div>
              <div className="text-[10.5px] text-muted mt-0.5">
                {badgeDescription(b.key, d)}
              </div>
              {!b.earned && (
                <div className="mt-2">
                  <Meter value={b.progress * 100} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {profile.ratingCount > 0 && profile.ratingCount < 10 && (
        <section className="mt-6 reveal">
          <Link href="/invite" className="block">
            <Card className="flex items-center gap-3.5">
              <span className="w-10 h-10 shrink-0 grid place-items-center rounded-full grad-score">
                <IconGlyph def={ICONS.users} size={19} color="#fff" />
              </span>
              <span className="flex-1">
                <span className="block text-[13.5px] font-extrabold">
                  {d.home.boostTitle}
                </span>
                <span className="block text-[12px] text-muted leading-relaxed">
                  {fill(d.home.boostBody, { n: 10 - profile.ratingCount })}
                </span>
              </span>
              <span className="text-orange font-bold text-[18px]">→</span>
            </Card>
          </Link>
        </section>
      )}

      {/* CTA */}
      <section className="mt-6 mb-2 reveal" style={{ animationDelay: "380ms" }}>
        <div
          className="rounded-[24px] p-5 text-white grad-premium"
          style={{ boxShadow: "0 16px 40px rgba(221,105,55,0.24)" }}
        >
          <div className="text-[11px] font-extrabold tracking-[0.2em] opacity-85">
            VIBE INSIGHTS
          </div>
          <p className="text-[17px] font-extrabold mt-1.5 leading-snug">
            {d.home.insightsTitle}
          </p>
          <p className="text-[13px] opacity-85 mt-1 leading-relaxed">
            {d.home.insightsBody}
          </p>
          <Link
            href="/insights"
            className="inline-flex mt-4 items-center gap-2 rounded-full bg-white text-coral font-bold text-[14px] px-5 py-3"
          >
            {d.home.insightsCta}
          </Link>
        </div>
      </section>
    </main>
  );
}

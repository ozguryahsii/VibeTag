import Link from "next/link";
import { requireUser, hasPlan } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getVibeProfile } from "@/lib/profile";
import { generateVibeSummary } from "@/lib/insights";
import { growthAreas, strongestTraits } from "@/lib/vibe";
import { RELATIONSHIPS } from "@/lib/taxonomy";
import { groupIconFor } from "@/lib/icons";
import { IconGlyph, TraitIcon } from "@/components/Icon";
import { ReportDialog } from "@/components/ReportDialog";
import { openRatingThreadAction } from "@/lib/actions/social";
import {
  canMessageRater,
  canSeeRaterIdentity,
  canSeeRatingContext,
} from "@/lib/rating-rules";
import { getDict, getLocale } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { groupLabel, percent, relationshipLabel, tagLabel, traitLabel } from "@/lib/labels";
import { Avatar, Card, EmptyState, Meter, SectionTitle, TagPill } from "@/components/ui";

export const dynamic = "force-dynamic";

function fmtDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function InsightsPage() {
  const me = await requireUser();
  const d = await getDict();
  const locale = await getLocale();
  const profile = await getVibeProfile(me.id);
  const summary = generateVibeSummary(profile, me.name.split(" ")[0], d, locale);

  const isSilver = hasPlan(me, "SILVER");
  const isGold = hasPlan(me, "GOLD");
  const showContext = canSeeRatingContext(me.plan);
  const mayMessage = canMessageRater(me.plan);

  // Every plan gets the list itself (decided 2026-08-26) — what varies per
  // row is how much of the person behind a rating is shown: the relationship
  // from Silver, the name from Gold (§15).
  const details = await prisma.rating.findMany({
        where: { ratedUserId: me.id, hiddenAt: null },
        select: {
          id: true,
          relationship: true,
          comment: true,
          createdAt: true,
          isProtected: true,
          hideIdentity: true,
          traits: { select: { traitKey: true, score: true } },
          vibeTags: { select: { tagKey: true } },
          raterUser: {
            select: {
              name: true,
              username: true,
              avatarUrl: true,
              avatarColor: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 25,
      });

  const strong = strongestTraits(profile, 3);
  const growth = growthAreas(profile, 2);

  return (
    <main className="px-5 pt-10">
      <header className="reveal">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold tracking-[0.24em] text-coral">
            {d.insights.kicker}
          </span>
          <span
            className="text-[10px] font-black rounded-full px-2 py-0.5 text-white"
            style={{
              background:
                me.plan === "GOLD"
                  ? "linear-gradient(135deg,#FF8A3D,#FF5C77)"
                  : me.plan === "SILVER"
                    ? "linear-gradient(135deg,#FF8A3D,#FF5C77)"
                    : "#C9BEB6",
            }}
          >
            {me.plan}
          </span>
        </div>
        <h1 className="vt-page-title text-[31px] tracking-[-0.02em] mt-1.5">
          {d.insights.title}
        </h1>
        <p className="text-[13px] text-muted mt-1">{d.insights.subtitle}</p>
      </header>

      {profile.ratingCount === 0 ? (
        <div className="mt-6">
          <EmptyState
            emoji="✦"
            title={d.insights.emptyTitle}
            body={d.insights.emptyBody}
          />
        </div>
      ) : (
        <>
          {/* AI persona — free tier sees the headline only */}
          <section className="mt-6 reveal">
            <div
              className="rounded-[28px] p-6 text-white grad-score border border-white/25"
              style={{ boxShadow: "0 18px 44px rgba(255,92,119,0.24)" }}
            >
              <p className="text-[11px] font-extrabold tracking-[0.2em] opacity-85">
                {d.insights.describedAs}
              </p>
              <p className="text-[28px] font-black tracking-[-0.02em] mt-1.5 leading-tight">
                {summary.persona}
              </p>
              <p className="text-[13.5px] opacity-90 mt-2 leading-relaxed">
                {summary.headline}
              </p>
            </div>
          </section>

          {/* ---------------------------------------------- SILVER */}
          <Gate
            open={isSilver}
            title={d.insights.circlesTitle}
            plan="SILVER"
            blurb={d.insights.circlesBlurb}
            unlockLabel={fill(d.insights.unlockWith, { plan: "Silver" })}
          >
            <SectionTitle>{d.insights.circlesTitle}</SectionTitle>
            <Card className="grid gap-3.5">
              <p className="text-[12.5px] text-muted font-semibold">
                {fill(d.insights.ratingCount, { n: profile.ratingCount })}
              </p>
              {profile.groups.map((g) => (
                <div key={g.group}>
                  <div className="flex justify-between text-[13px] font-bold mb-1.5">
                    <span className="inline-flex items-center gap-2">
                      <IconGlyph def={groupIconFor(g.group)} size={16} color="#FF8A3D" />
                      {groupLabel(g.group, d)}
                    </span>
                    <span className="tabular-nums text-muted">
                      {percent(g.share * 100, locale)}
                    </span>
                  </div>
                  <Meter value={g.share * 100} />
                </div>
              ))}

              <div className="pt-2 border-t border-line grid gap-1.5">
                {profile.relationshipCounts.slice(0, 6).map((r) => (
                  <div
                    key={r.key}
                    className="flex justify-between text-[12.5px]"
                  >
                    <span className="text-muted">
                      {relationshipLabel(r.key, d)}
                    </span>
                    <span className="font-bold tabular-nums">{r.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="mt-6">
              <SectionTitle>{d.insights.detailed}</SectionTitle>
              <Card className="grid gap-4">
                <div>
                  <p className="text-[11px] font-extrabold tracking-[0.16em] text-orange mb-2.5">
                    {d.insights.strongest}
                  </p>
                  <div className="grid gap-3">
                    {strong.map((t) => (
                      <div key={t.key}>
                        <div className="flex justify-between text-[13px] font-bold mb-1">
                          <span className="inline-flex items-center gap-2">
                            <TraitIcon traitKey={t.key} color="#FF8A3D" />
                            {traitLabel(t.key, locale)}
                          </span>
                          <span className="tabular-nums grad-text font-black">
                            {t.score}
                          </span>
                        </div>
                        <Meter value={t.score} />
                        <p className="text-[11.5px] text-muted mt-1">
                          {summary.strengths.find((s) => s.key === t.key)?.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {growth.length > 0 && (
                  <div className="pt-3 border-t border-line">
                    <p className="text-[11px] font-extrabold tracking-[0.16em] text-coral mb-2.5">
                      {d.insights.growth}
                    </p>
                    <div className="grid gap-3">
                      {growth.map((t) => (
                        <div key={t.key}>
                          <div className="flex justify-between text-[13px] font-bold mb-1">
                            <span className="inline-flex items-center gap-2">
                              <TraitIcon traitKey={t.key} color="#FF5C77" />
                              {traitLabel(t.key, locale)}
                            </span>
                            <span className="tabular-nums text-coral font-black">
                              {t.score}
                            </span>
                          </div>
                          <Meter value={t.score} />
                          <p className="text-[11.5px] text-muted mt-1">
                            {summary.growth.find((s) => s.key === t.key)?.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

          </Gate>

          {/* ------------------------------------- RATINGS, every plan */}
          <section className="mt-6 reveal">
              <SectionTitle>
                {isGold ? d.insights.ratings : d.insights.anonDetails}
              </SectionTitle>
              <div className="grid gap-2.5">
                {details.map((row) => {
                  const relName = relationshipLabel(row.relationship, d);
                  const showIdentity = canSeeRaterIdentity(me.plan, row);

                  return (
                    <Card key={row.id} className="!py-4">
                      <div className="flex items-center gap-3">
                        {showIdentity ? (
                          <>
                            <Avatar
                              name={row.raterUser.name}
                              url={row.raterUser.avatarUrl}
                              color={row.raterUser.avatarColor}
                              size={38}
                            />
                            <div className="min-w-0">
                              <Link
                                href={`/u/${row.raterUser.username}`}
                                className="text-[13.5px] font-extrabold truncate block"
                              >
                                {row.raterUser.name}
                              </Link>
                              <p className="text-[11.5px] text-muted">
                                {relName}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="w-9.5 h-9.5 grid place-items-center rounded-full bg-tagbg border border-orange/15 text-[10px] font-black tracking-wider text-orange">
                              ANON
                            </span>
                            <div>
                              <p className="text-[13.5px] font-extrabold">
                                {d.common.anonymous}
                              </p>
                              {/* The relationship is Silver knowledge; on
                                  Free the row says only that someone rated
                                  them, never from where. */}
                              {showContext && (
                                <p className="text-[11.5px] text-muted">
                                  {relName}
                                </p>
                              )}
                            </div>
                          </>
                        )}
                        <span className="ml-auto text-[11px] text-muted">
                          {fmtDate(row.createdAt, locale)}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-1.5">
                        {row.traits.map((t) => (
                          <div
                            key={t.traitKey}
                            className="flex justify-between text-[12.5px]"
                          >
                            <span className="text-muted">
                              {traitLabel(t.traitKey, locale)}
                            </span>
                            <span className="font-bold tabular-nums">
                              {t.score}/5
                            </span>
                          </div>
                        ))}
                      </div>

                      {row.vibeTags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {row.vibeTags.map((t) => (
                            <TagPill
                              key={t.tagKey}
                              tagKey={t.tagKey}
                              label={tagLabel(t.tagKey, locale)}
                              size="sm"
                            />
                          ))}
                        </div>
                      )}

                      {row.comment && (
                        <p className="mt-3 text-[13px] leading-relaxed border-l-2 border-orange/30 pl-3">
                          “{row.comment}”
                        </p>
                      )}

                      {/* Two halves that can actually shrink: min-w-0 on the
                          cell, truncate on the label. Without both, a long
                          Turkish label pushes its own pill wider than the
                          grid and spills over the card edge on a phone. */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {mayMessage ? (
                          <form action={openRatingThreadAction} className="min-w-0">
                            <input type="hidden" name="ratingId" value={row.id} />
                            <button className="h-9 w-full min-w-0 truncate rounded-full px-2.5 text-[11px] font-bold text-orange bg-tagbg border border-orange/25 active:scale-[0.97] transition-transform">
                              {d.messages.newFromRating}
                            </button>
                          </form>
                        ) : (
                          <Link
                            href="/settings"
                            className="h-9 min-w-0 truncate rounded-full px-2.5 text-[11px] font-bold text-muted bg-cream border border-line inline-flex items-center justify-center"
                          >
                            {d.insights.messageLocked}
                          </Link>
                        )}
                        <ReportDialog
                          ratingId={row.id}
                          label={d.insights.reportRating}
                          compact
                          tone="danger"
                        />
                      </div>

                      {isGold && (row.isProtected || row.hideIdentity) && (
                        <p className="mt-3 text-[11.5px] text-muted bg-cream rounded-xl px-3 py-2">
                          {d.insights.protectedNote}
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
          </section>

          {/* ------------------------------------------------ GOLD */}
          {isSilver && !isGold && (
            <section className="mt-6 mb-2 reveal">
              <div
                className="rounded-[24px] p-5 text-white"
                style={{
                  background: "linear-gradient(135deg,#FF8A3D,#FF5C77)",
                  boxShadow: "0 16px 44px rgba(255,92,119,0.25)",
                }}
              >
                <p className="text-[11px] font-extrabold tracking-[0.2em] opacity-85">
                  {d.insights.goldKicker}
                </p>
                <p className="text-[19px] font-black mt-1.5 leading-snug">
                  {d.insights.goldTitle}
                </p>
                <p className="text-[13px] opacity-90 mt-1.5 leading-relaxed">
                  {d.insights.goldBody}
                </p>
                <Link
                  href="/settings"
                  className="inline-flex mt-4 rounded-full bg-white text-coral font-bold text-[14px] px-5 py-3"
                >
                  {d.insights.goldCta}
                </Link>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

/**
 * Locked premium section.
 *
 * The teaser is a placeholder skeleton, never the real numbers behind a CSS
 * blur — a paywall that ships the paid data to the client and hides it with
 * `filter` is not a paywall.
 */
function Gate({
  open,
  children,
  title,
  blurb,
  unlockLabel,
}: {
  open: boolean;
  children: React.ReactNode;
  title: string;
  blurb: string;
  plan: string;
  unlockLabel: string;
}) {
  if (open) return <div className="mt-6">{children}</div>;

  return (
    <section className="mt-6 mb-2 relative">
      <div className="pointer-events-none select-none blur-[5px] opacity-55" aria-hidden>
        <Card className="grid gap-3.5">
          {[
            ["01", 62],
            ["02", 44],
            ["03", 26],
            ["04", 14],
          ].map(([emoji, w]) => (
            <div key={String(emoji)}>
              <div className="flex justify-between text-[13px] font-bold mb-1.5">
                <span>{emoji} ██████████</span>
                <span className="text-muted">%██</span>
              </div>
              <Meter value={Number(w)} />
            </div>
          ))}
        </Card>
        <Card className="grid gap-3 mt-4">
          {[88, 74, 61].map((w, i) => (
            <div key={i}>
              <div className="flex justify-between text-[13px] font-bold mb-1">
                <span>████████</span>
                <span className="text-muted">██</span>
              </div>
              <Meter value={w} />
            </div>
          ))}
        </Card>
      </div>

      <div className="absolute inset-0 grid place-items-center px-4">
        <div className="card p-6 text-center max-w-[19rem]">
          <div className="w-12 h-12 mx-auto rounded-full grid place-items-center bg-tagbg border border-orange/20 text-orange text-[11px] font-black tracking-wider">PLUS</div>
          <p className="vt-page-title text-[20px] mt-3 leading-snug">{title}</p>
          <p className="text-[12.5px] text-muted mt-1.5 leading-relaxed">
            {blurb}
          </p>
          <Link
            href="/settings"
            className="inline-flex mt-4 rounded-full grad-score text-white font-bold text-[14px] px-5 py-3"
          >
            {unlockLabel}
          </Link>
        </div>
      </div>
      {/* children intentionally unrendered while locked */}
      {false && children}
    </section>
  );
}

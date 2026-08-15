import Link from "next/link";
import { requireUser, hasPlan } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getVibeProfile } from "@/lib/profile";
import { generateVibeSummary } from "@/lib/insights";
import { growthAreas, strongestTraits } from "@/lib/vibe";
import { RELATIONSHIPS, TRAITS, VIBE_TAGS } from "@/lib/taxonomy";
import { TraitIcon } from "@/components/Icon";
import { Avatar, Card, EmptyState, Meter, SectionTitle, TagPill } from "@/components/ui";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export default async function InsightsPage() {
  const me = await requireUser();
  const profile = await getVibeProfile(me.id);
  const summary = generateVibeSummary(profile, me.name.split(" ")[0]);

  const isSilver = hasPlan(me, "SILVER");
  const isGold = hasPlan(me, "GOLD");

  const details = isSilver
    ? await prisma.rating.findMany({
        where: { ratedUserId: me.id },
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
      })
    : [];

  const strong = strongestTraits(profile, 3);
  const growth = growthAreas(profile, 2);

  return (
    <main className="px-5 pt-12">
      <header className="reveal">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold tracking-[0.2em] text-purple">
            ✦ PREMIUM
          </span>
          <span
            className="text-[10px] font-black rounded-full px-2 py-0.5 text-white"
            style={{
              background:
                me.plan === "GOLD"
                  ? "linear-gradient(135deg,#FF8A3D,#8B5CF6)"
                  : me.plan === "SILVER"
                    ? "linear-gradient(135deg,#FF8A3D,#FF5C77)"
                    : "#C9BEB6",
            }}
          >
            {me.plan}
          </span>
        </div>
        <h1 className="text-[27px] font-black tracking-[-0.02em] mt-1.5">
          Vibe Insights
        </h1>
        <p className="text-[13px] text-muted mt-1">
          Sosyal algının arkasındaki veri.
        </p>
      </header>

      {profile.ratingCount === 0 ? (
        <div className="mt-6">
          <EmptyState
            emoji="📊"
            title="Analiz için veri yok"
            body="En az 3 değerlendirme sonrası analiz açılır. Çevrendeki kişileri davet ederek başlayabilirsin."
          />
        </div>
      ) : (
        <>
          {/* AI persona — free tier sees the headline only */}
          <section className="mt-6 reveal">
            <div
              className="rounded-[24px] p-5 text-white grad-premium"
              style={{ boxShadow: "0 16px 44px rgba(139,92,246,0.26)" }}
            >
              <p className="text-[11px] font-extrabold tracking-[0.2em] opacity-85">
                PEOPLE DESCRIBE YOU AS
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
            title="Seni hangi çevrelerden tanıyorlar?"
            plan="SILVER"
            blurb="Değerlendirmelerinin hangi çevrelerden geldiğini gör."
          >
            <SectionTitle>Seni hangi çevrelerden tanıyorlar?</SectionTitle>
            <Card className="grid gap-3.5">
              <p className="text-[12.5px] text-muted font-semibold">
                {profile.ratingCount} değerlendirme
              </p>
              {profile.groups.map((g) => (
                <div key={g.group}>
                  <div className="flex justify-between text-[13px] font-bold mb-1.5">
                    <span>
                      {g.emoji} {g.label}
                    </span>
                    <span className="tabular-nums text-muted">
                      %{Math.round(g.share * 100)}
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
                    <span className="text-muted">{r.label}</span>
                    <span className="font-bold tabular-nums">{r.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="mt-6">
              <SectionTitle>Detaylı analiz</SectionTitle>
              <Card className="grid gap-4">
                <div>
                  <p className="text-[11px] font-extrabold tracking-[0.16em] text-orange mb-2.5">
                    STRONGEST VIBES
                  </p>
                  <div className="grid gap-3">
                    {strong.map((t) => (
                      <div key={t.key}>
                        <div className="flex justify-between text-[13px] font-bold mb-1">
                          <span className="inline-flex items-center gap-2">
                            <TraitIcon traitKey={t.key} color="#FF8A3D" />
                            {t.en}
                          </span>
                          <span className="tabular-nums grad-text font-black">
                            {t.score}
                          </span>
                        </div>
                        <Meter value={t.score} />
                        <p className="text-[11.5px] text-muted mt-1">
                          {summary.strengths.find((s) => s.label === t.label)?.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {growth.length > 0 && (
                  <div className="pt-3 border-t border-line">
                    <p className="text-[11px] font-extrabold tracking-[0.16em] text-purple mb-2.5">
                      GROWTH AREAS
                    </p>
                    <div className="grid gap-3">
                      {growth.map((t) => (
                        <div key={t.key}>
                          <div className="flex justify-between text-[13px] font-bold mb-1">
                            <span className="inline-flex items-center gap-2">
                              <TraitIcon traitKey={t.key} color="#8B5CF6" />
                              {t.en}
                            </span>
                            <span className="tabular-nums text-purple font-black">
                              {t.score}
                            </span>
                          </div>
                          <Meter value={t.score} tone="purple" />
                          <p className="text-[11.5px] text-muted mt-1">
                            {summary.growth.find((s) => s.label === t.label)?.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <div className="mt-6">
              <SectionTitle>
                {isGold ? "Değerlendirmeler" : "Anonim oy detayları"}
              </SectionTitle>
              <div className="grid gap-2.5">
                {details.map((d) => {
                  const rel = RELATIONSHIPS[
                    d.relationship as keyof typeof RELATIONSHIPS
                  ];
                  // §15 — identity is revealed only for Gold, and never for
                  // protected or explicitly anonymised ratings.
                  const showIdentity =
                    isGold && !d.isProtected && !d.hideIdentity;

                  return (
                    <Card key={d.id} className="!py-4">
                      <div className="flex items-center gap-3">
                        {showIdentity ? (
                          <>
                            <Avatar
                              name={d.raterUser.name}
                              url={d.raterUser.avatarUrl}
                              color={d.raterUser.avatarColor}
                              size={38}
                            />
                            <div className="min-w-0">
                              <Link
                                href={`/u/${d.raterUser.username}`}
                                className="text-[13.5px] font-extrabold truncate block"
                              >
                                {d.raterUser.name}
                              </Link>
                              <p className="text-[11.5px] text-muted">
                                {rel.emoji} {rel.label}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="w-9.5 h-9.5 grid place-items-center rounded-full bg-line text-[15px]">
                              🕶️
                            </span>
                            <div>
                              <p className="text-[13.5px] font-extrabold">
                                Anonim
                              </p>
                              <p className="text-[11.5px] text-muted">
                                {rel.emoji} {rel.label}
                              </p>
                            </div>
                          </>
                        )}
                        <span className="ml-auto text-[11px] text-muted">
                          {fmtDate(d.createdAt)}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-1.5">
                        {d.traits.map((t) => (
                          <div
                            key={t.traitKey}
                            className="flex justify-between text-[12.5px]"
                          >
                            <span className="text-muted">
                              {TRAITS[t.traitKey as keyof typeof TRAITS]?.en ??
                                t.traitKey}
                            </span>
                            <span className="font-bold tabular-nums">
                              {t.score}/5
                            </span>
                          </div>
                        ))}
                      </div>

                      {d.vibeTags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {d.vibeTags.map((t) => {
                            const tag =
                              VIBE_TAGS[t.tagKey as keyof typeof VIBE_TAGS];
                            return tag ? (
                              <TagPill
                                key={t.tagKey}
                                tagKey={t.tagKey}
                                label={tag.en}
                                size="sm"
                              />
                            ) : null;
                          })}
                        </div>
                      )}

                      {d.comment && (
                        <p className="mt-3 text-[13px] leading-relaxed border-l-2 border-orange/30 pl-3">
                          “{d.comment}”
                        </p>
                      )}

                      {isGold && (d.isProtected || d.hideIdentity) && (
                        <p className="mt-3 text-[11.5px] text-muted bg-cream rounded-xl px-3 py-2">
                          🔒 Bu değerlendirmenin kimliği sistem tarafından
                          korunuyor — Gold üyelikte de görünmez.
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </Gate>

          {/* ------------------------------------------------ GOLD */}
          {isSilver && !isGold && (
            <section className="mt-6 mb-2 reveal">
              <div
                className="rounded-[24px] p-5 text-white"
                style={{
                  background: "linear-gradient(135deg,#FF8A3D,#8B5CF6)",
                  boxShadow: "0 16px 44px rgba(139,92,246,0.28)",
                }}
              >
                <p className="text-[11px] font-extrabold tracking-[0.2em] opacity-85">
                  GOLD · VIBE IDENTITY
                </p>
                <p className="text-[19px] font-black mt-1.5 leading-snug">
                  Kimlerin değerlendirdiğini gör
                </p>
                <p className="text-[13px] opacity-90 mt-1.5 leading-relaxed">
                  Kim, nereden tanıyor ve hangi alanlarda değerlendirdi. Sistem
                  tarafından korunan ve gizlenen oylar her zaman anonim kalır.
                </p>
                <Link
                  href="/settings"
                  className="inline-flex mt-4 rounded-full bg-white text-purple font-bold text-[14px] px-5 py-3"
                >
                  Gold’a geç
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
  plan,
}: {
  open: boolean;
  children: React.ReactNode;
  title: string;
  blurb: string;
  plan: string;
}) {
  if (open) return <div className="mt-6">{children}</div>;

  return (
    <section className="mt-6 mb-2 relative">
      <div className="pointer-events-none select-none blur-[5px] opacity-55" aria-hidden>
        <Card className="grid gap-3.5">
          {[
            ["💼", 62],
            ["🫂", 44],
            ["🛍️", 26],
            ["🌐", 14],
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
          <div className="text-3xl">🔓</div>
          <p className="text-[16px] font-extrabold mt-2 leading-snug">{title}</p>
          <p className="text-[12.5px] text-muted mt-1.5 leading-relaxed">
            {blurb}
          </p>
          <Link
            href="/settings"
            className="inline-flex mt-4 rounded-full grad-premium text-white font-bold text-[14px] px-5 py-3"
          >
            {plan} ile aç
          </Link>
        </div>
      </div>
      {/* children intentionally unrendered while locked */}
      {false && children}
    </section>
  );
}

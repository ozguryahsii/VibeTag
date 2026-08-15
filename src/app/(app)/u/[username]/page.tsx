import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { toggleBlockAction } from "@/lib/actions/safety";
import { ReportDialog } from "@/components/ReportDialog";
import { prisma } from "@/lib/db";
import { getMyRatingOf, getPercentile, getUserByUsername, getVibeProfile } from "@/lib/profile";
import { cooldownDaysLeft } from "@/lib/rating-rules";
import { earnedBadges } from "@/lib/badges";
import { generateVibeSummary } from "@/lib/insights";
import { CONTEXT_GROUPS, RELATIONSHIPS } from "@/lib/taxonomy";
import { groupIconFor } from "@/lib/icons";
import { IconGlyph, TraitIcon } from "@/components/Icon";
import { ScoreDial } from "@/components/ScoreDial";
import { VibeMark } from "@/components/Logo";
import { Avatar, Card, EmptyState, Meter, SectionTitle, TagPill } from "@/components/ui";

export default async function PublicProfile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const me = await requireUser();
  const { username } = await params;

  const user = await getUserByUsername(username);
  if (!user) notFound();

  const isMe = user.id === me.id;
  const profile = await getVibeProfile(user.id);
  const percentile = await getPercentile(user.id, profile.score);
  const badges = earnedBadges(profile);
  const summary = generateVibeSummary(profile, user.name.split(" ")[0]);
  const existing = isMe ? null : await getMyRatingOf(me.id, user.id);
  const daysLeft = existing ? cooldownDaysLeft(existing.lastUpdatedAt) : 0;

  const blockedByMe = isMe
    ? null
    : await prisma.block.findUnique({
        where: {
          blockerId_blockedId: { blockerId: me.id, blockedId: user.id },
        },
        select: { id: true },
      });

  // Anonymous wall — comments are never attributed to a person here,
  // no matter who is looking (§9).
  const comments = await prisma.rating.findMany({
    where: { ratedUserId: user.id, comment: { not: null } },
    select: { id: true, comment: true, relationship: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <main className="px-5 pt-12">
      <section
        className="relative overflow-hidden rounded-[32px] border border-line/90 bg-warmwhite px-5 pb-5 pt-7 text-center pop"
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
          <VibeMark size={43} id="public-profile-mark" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <Avatar
            name={user.name}
            url={user.avatarUrl}
            color={user.avatarColor}
            size={84}
            ring
          />
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <h1 className="font-display text-[26px] font-semibold tracking-[-0.035em] text-ink">
              {user.name}
            </h1>
            {user.isVerified && <span>✅</span>}
          </div>
          <p className="text-[12.5px] text-muted">@{user.username}</p>
          {user.bio && (
            <p className="mt-2 max-w-[300px] text-[13px] leading-relaxed text-ink/80">
              {user.bio}
            </p>
          )}
          <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
            <span className="h-px w-8 bg-line" />
            <span className="h-1.5 w-1.5 rounded-full bg-coral" />
            <span className="h-px w-8 bg-line" />
          </div>

          <ScoreDial
            score={profile.score}
            size={220}
            caption={percentile ? `Top ${percentile}% of users` : undefined}
          />

          {profile.ratingCount > 0 && (
            <div className="w-full">
              <p className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.22em] text-muted">
                People see {isMe ? "you" : "them"} as
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {profile.tags.slice(0, 4).map((t) => (
                  <TagPill key={t.key} tagKey={t.key} label={t.en} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 w-full border-t border-line/80 pt-4 text-left">
            <p className="text-[12px] leading-tight text-muted">
              Rated by
              <span className="mt-0.5 block text-[16px] font-semibold text-ink">
                {profile.ratingCount} people
              </span>
            </p>
          </div>
        </div>
      </section>

      {!isMe && blockedByMe && (
        <div className="mt-5 card p-4 text-center">
          <p className="text-[13.5px] font-bold">Bu kişiyi engelledin</p>
          <p className="text-[12.5px] text-muted mt-1 leading-relaxed">
            Sana yeni değerlendirme yapamaz ve mevcut değerlendirmesini
            güncelleyemez.
          </p>
          <form action={toggleBlockAction} className="mt-3">
            <input type="hidden" name="username" value={user.username} />
            <button
              type="submit"
              className="h-11 px-6 rounded-full bg-white border border-line text-[13.5px] font-bold"
            >
              Engeli kaldır
            </button>
          </form>
        </div>
      )}

      {!isMe && !blockedByMe && (
        <div className="mt-5">
          {existing && daysLeft > 0 ? (
            <div className="card p-4 text-center">
              <p className="text-[13.5px] font-bold">
                Bu kişiyi zaten değerlendirdin 🔒
              </p>
              <p className="text-[12.5px] text-muted mt-1">
                {daysLeft} gün sonra güncelleyebilirsin.
              </p>
            </div>
          ) : (
            <Link
              href={`/rate/${user.username}`}
              className="h-13 w-full grid place-items-center rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)]"
            >
              {existing
                ? "Değerlendirmemi güncelle"
                : `${user.name.split(" ")[0]}’i değerlendir`}
            </Link>
          )}

          <div className="mt-3 flex items-center justify-center gap-4">
            <ReportDialog username={user.username} label="Bu profili bildir" compact />
            <form action={toggleBlockAction}>
              <input type="hidden" name="username" value={user.username} />
              <button
                type="submit"
                className="text-[11.5px] font-bold text-muted underline underline-offset-2"
              >
                Engelle
              </button>
            </form>
          </div>
        </div>
      )}

      {profile.ratingCount === 0 ? (
        <div className="mt-6">
          <EmptyState
            emoji="🌱"
            title="Henüz değerlendirme yok"
            body={
              isMe
                ? "Çevrendeki insanları davet ettiğinde Vibe profilin oluşmaya başlayacak."
                : `${user.name.split(" ")[0]} için ilk Vibe'ı sen bırakabilirsin.`
            }
          />
        </div>
      ) : (
        <>
          {profile.tags.length > 4 && (
            <section className="mt-6 reveal">
              <SectionTitle>More of {isMe ? "your" : "their"} Vibe</SectionTitle>
              <Card className="flex flex-wrap gap-2">
                {profile.tags.slice(4, 8).map((t) => (
                  <TagPill key={t.key} tagKey={t.key} label={t.en} count={t.count} />
                ))}
              </Card>
            </section>
          )}

          {badges.length > 0 && (
            <section className="mt-6 reveal">
              <SectionTitle>Rozetler</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <TagPill
                    key={b.key}
                    tagKey={b.icon}
                    label={b.label}
                    tone="warm"
                  />
                ))}
              </div>
            </section>
          )}

          <section className="mt-6 reveal">
            <SectionTitle>Güçlü yönler</SectionTitle>
            <Card className="grid gap-4">
              {profile.traits.slice(0, 5).map((t) => (
                <div key={t.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13.5px] font-bold inline-flex items-center gap-2">
                      <TraitIcon traitKey={t.key} color="#FF8A3D" />
                      {t.label}
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

          <section className="mt-6 reveal">
            <SectionTitle>Nereden tanınıyor?</SectionTitle>
            <Card className="grid gap-3">
              {profile.groups.map((g) => (
                <div key={g.group} className="flex items-center gap-3">
                  <span className="w-6 grid place-items-center">
                    <IconGlyph def={groupIconFor(g.group)} size={18} color="#FF8A3D" />
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between text-[12.5px] font-bold mb-1">
                      <span>{g.label}</span>
                      <span className="text-muted tabular-nums">
                        %{Math.round(g.share * 100)}
                      </span>
                    </div>
                    <Meter value={g.share * 100} />
                  </div>
                </div>
              ))}
            </Card>
          </section>

          <section className="mt-6 reveal">
            <SectionTitle>AI özeti</SectionTitle>
            <Card>
              <p className="text-[16px] font-extrabold leading-snug">
                {summary.headline}
              </p>
              <p className="text-[13px] text-muted leading-relaxed mt-2">
                {summary.paragraph}
              </p>
            </Card>
          </section>

          {comments.length > 0 && (
            <section className="mt-6 mb-2 reveal">
              <SectionTitle>Anonim notlar</SectionTitle>
              <div className="grid gap-2.5">
                {comments.map((c) => (
                  <Card key={c.id} className="!py-4">
                    <p className="text-[13.5px] leading-relaxed">“{c.comment}”</p>
                    <p className="text-[11.5px] text-muted mt-2 font-semibold">
                      Anonim ·{" "}
                      {
                        CONTEXT_GROUPS[
                          RELATIONSHIPS[
                            c.relationship as keyof typeof RELATIONSHIPS
                          ].group
                        ].label
                      }{" "}
                      çevresinden
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

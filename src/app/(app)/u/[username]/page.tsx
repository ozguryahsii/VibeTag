import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMyRatingOf, getPercentile, getUserByUsername, getVibeProfile } from "@/lib/profile";
import { cooldownDaysLeft } from "@/lib/rating-rules";
import { earnedBadges } from "@/lib/badges";
import { generateVibeSummary } from "@/lib/insights";
import { CONTEXT_GROUPS, RELATIONSHIPS } from "@/lib/taxonomy";
import { TraitIcon } from "@/components/Icon";
import { ScoreDial } from "@/components/ScoreDial";
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
      <header className="flex items-start gap-4 reveal">
        <Avatar name={user.name}
          url={user.avatarUrl} color={user.avatarColor} size={62} ring />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-[21px] font-black tracking-[-0.02em] truncate">
              {user.name}
            </h1>
            {user.isVerified && <span>✅</span>}
          </div>
          <p className="text-[12.5px] text-muted">@{user.username}</p>
          {user.bio && (
            <p className="text-[13px] mt-1.5 leading-relaxed">{user.bio}</p>
          )}
        </div>
      </header>

      <section className="mt-6 grid place-items-center pop">
        <ScoreDial
          score={profile.score}
          size={210}
          caption={percentile ? `Top ${percentile}% of users` : undefined}
        />
        <p className="text-[13px] text-muted font-semibold -mt-1">
          Rated by <span className="text-ink font-bold">{profile.ratingCount}</span>{" "}
          people
        </p>
      </section>

      {!isMe && (
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
          <section className="mt-6 reveal">
            <SectionTitle>People see {isMe ? "you" : "them"} as:</SectionTitle>
            <Card className="flex flex-wrap gap-2">
              {profile.tags.slice(0, 8).map((t) => (
                <TagPill key={t.key} tagKey={t.key} label={t.en} count={t.count} />
              ))}
            </Card>
          </section>

          {badges.length > 0 && (
            <section className="mt-6 reveal">
              <SectionTitle>Rozetler</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <TagPill
                    key={b.key}
                    emoji={b.emoji}
                    label={b.label}
                    tone="purple"
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
                  <span className="text-lg w-6">{CONTEXT_GROUPS[g.group].emoji}</span>
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

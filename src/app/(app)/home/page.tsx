import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getPercentile, getVibeProfile } from "@/lib/profile";
import { computeBadges } from "@/lib/badges";
import { generateVibeSummary } from "@/lib/insights";
import { ScoreDial } from "@/components/ScoreDial";
import { Avatar, Button, Card, EmptyState, Meter, SectionTitle, TagPill } from "@/components/ui";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "İyi geceler";
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

export default async function HomePage() {
  const user = await requireUser();
  const profile = await getVibeProfile(user.id);
  const percentile = await getPercentile(user.id, profile.score);
  const badges = computeBadges(profile);
  const earned = badges.filter((b) => b.earned);
  const summary = generateVibeSummary(profile, user.name.split(" ")[0]);

  return (
    <main className="px-5 pt-12">
      {/* header */}
      <header className="flex items-center justify-between reveal">
        <div>
          <p className="text-[13px] text-muted font-semibold">{greeting()}</p>
          <h1 className="text-[22px] font-black tracking-[-0.02em]">
            {user.name.split(" ")[0]} 👋
          </h1>
        </div>
        <Link href="/settings" aria-label="Profil">
          <Avatar name={user.name}
          url={user.avatarUrl} color={user.avatarColor} size={46} ring />
        </Link>
      </header>

      {/* score hero */}
      <section className="mt-6 grid place-items-center pop">
        <ScoreDial
          score={profile.score}
          caption={
            percentile
              ? `Top ${percentile}% of users`
              : profile.ratingCount > 0
                ? `${profile.ratingCount} kişi değerlendirdi`
                : "İlk değerlendirmeni bekliyor"
          }
        />
        <p className="text-[13px] text-muted font-semibold -mt-1">
          Rated by <span className="text-ink font-bold">{profile.ratingCount}</span>{" "}
          people
        </p>
      </section>

      {/* tags */}
      <section className="mt-7 reveal" style={{ animationDelay: "120ms" }}>
        <SectionTitle
          action={
            profile.tags.length > 0 ? (
              <Link href="/card" className="text-[12px] font-bold text-orange">
                Kartını paylaş →
              </Link>
            ) : null
          }
        >
          People see you as:
        </SectionTitle>

        {profile.tags.length === 0 ? (
          <EmptyState
            emoji="🌱"
            title="Vibe profilin henüz boş"
            body="Seni tanıyan birkaç kişiyi davet et. İlk değerlendirmeler geldiğinde burada sende gördükleri özellikler belirecek."
            action={<Button href="/people">Kişileri gör</Button>}
          />
        ) : (
          <Card className="flex flex-wrap gap-2">
            {profile.tags.slice(0, 8).map((t) => (
              <TagPill key={t.key} tagKey={t.key} label={t.en} count={t.count} />
            ))}
          </Card>
        )}
      </section>

      {/* AI summary teaser */}
      {profile.ratingCount > 0 && (
        <section className="mt-6 reveal" style={{ animationDelay: "200ms" }}>
          <SectionTitle
            action={
              <Link href="/insights" className="text-[12px] font-bold text-purple">
                Tümü →
              </Link>
            }
          >
            AI My Vibe Summary
          </SectionTitle>
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-extrabold tracking-[0.16em] text-purple">
                ✦ AI ANALİZ
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
          <SectionTitle>En güçlü yönlerin</SectionTitle>
          <Card className="grid gap-4">
            {profile.traits.slice(0, 4).map((t) => (
              <div key={t.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13.5px] font-bold">
                    {t.emoji} {t.label}
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
        <SectionTitle>Rozetlerin</SectionTitle>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {(earned.length ? earned : badges).slice(0, 6).map((b) => (
            <div
              key={b.key}
              className="card shrink-0 w-[132px] p-3.5 text-center"
              style={{ opacity: b.earned ? 1 : 0.55 }}
            >
              <div className="text-2xl">{b.emoji}</div>
              <div className="text-[12.5px] font-extrabold mt-1.5 leading-tight">
                {b.label}
              </div>
              <div className="text-[10.5px] text-muted mt-0.5">{b.tr}</div>
              {!b.earned && (
                <div className="mt-2">
                  <Meter value={b.progress * 100} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-6 mb-2 reveal" style={{ animationDelay: "380ms" }}>
        <div
          className="rounded-[24px] p-5 text-white grad-premium"
          style={{ boxShadow: "0 16px 40px rgba(139,92,246,0.28)" }}
        >
          <div className="text-[11px] font-extrabold tracking-[0.2em] opacity-85">
            VIBE INSIGHTS
          </div>
          <p className="text-[17px] font-extrabold mt-1.5 leading-snug">
            Seni hangi çevrelerden tanıyorlar?
          </p>
          <p className="text-[13px] opacity-85 mt-1 leading-relaxed">
            Çevre dağılımı, güçlü yönler ve anonim değerlendirme detayları.
          </p>
          <Link
            href="/insights"
            className="inline-flex mt-4 items-center gap-2 rounded-full bg-white text-purple font-bold text-[14px] px-5 py-3"
          >
            Analizi aç
          </Link>
        </div>
      </section>
    </main>
  );
}

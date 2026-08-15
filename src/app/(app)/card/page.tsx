import { requireUser } from "@/lib/auth";
import { getPercentile, getVibeProfile } from "@/lib/profile";
import { VibeCardStudio } from "@/components/VibeCardStudio";
import { EmptyState, Button } from "@/components/ui";

export default async function CardPage() {
  const user = await requireUser();
  const profile = await getVibeProfile(user.id);
  const percentile = await getPercentile(user.id, profile.score);

  if (profile.ratingCount === 0) {
    return (
      <main className="px-5 pt-12">
        <h1 className="text-[27px] font-black tracking-[-0.02em]">Vibe Card</h1>
        <p className="text-[13px] text-muted mt-1">
          Paylaşılabilir sosyal kimlik kartın.
        </p>
        <div className="mt-6">
          <EmptyState
            emoji="🪪"
            title="Kartın için biraz veri lazım"
            body="En az bir değerlendirme aldığında Vibe Card'ını oluşturup Story'de paylaşabilirsin."
            action={<Button href="/people">Kişileri gör</Button>}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="px-5 pt-12">
      <h1 className="text-[27px] font-black tracking-[-0.02em]">Vibe Card</h1>
      <p className="text-[13px] text-muted mt-1">
        Story, kare veya geniş format — indir ve paylaş.
      </p>

      <VibeCardStudio
        data={{
          name: user.name,
          username: user.username,
          score: profile.score,
          ratingCount: profile.ratingCount,
          percentile,
          avatarUrl: user.avatarUrl,
          avatarColor: user.avatarColor,
          tags: profile.tags
            .slice(0, 4)
            .map((t) => ({ key: t.key, label: t.en })),
        }}
      />
    </main>
  );
}

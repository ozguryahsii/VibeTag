import { requireUser } from "@/lib/auth";
import { getPercentile, getVibeProfile } from "@/lib/profile";
import { VibeCardStudio } from "@/components/VibeCardStudio";
import { EmptyState, Button } from "@/components/ui";
import { getDict, getLocale } from "@/lib/i18n/server";
import { tagLabel } from "@/lib/labels";
import { topTags } from "@/lib/card-tags";
import { LangToggle } from "@/components/LangToggle";
import { isNativeShell } from "@/lib/native-shell";

export default async function CardPage() {
  const user = await requireUser();
  const d = await getDict();
  const locale = await getLocale();
  const profile = await getVibeProfile(user.id);
  const percentile = await getPercentile(user.id, profile.score);
  // A WebView has nowhere to download to, so the save path differs there.
  const inShell = await isNativeShell();

  if (profile.ratingCount === 0) {
    return (
      <main className="px-5 pt-12">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-coral">
              {d.card.kicker}
            </p>
            <h1 className="mt-1 font-display text-[34px] font-semibold tracking-[-0.04em] text-ink">
              {d.card.title}
            </h1>
          </div>
          <LangToggle className="mt-1 shrink-0" />
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          {d.card.subtitle}
        </p>
        <div className="mt-6">
          <EmptyState
            emoji="🪪"
            title={d.card.emptyTitle}
            body={d.card.emptyBody}
            action={<Button href="/people">{d.card.emptyCta}</Button>}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="px-5 pt-12">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-coral">
            {d.card.kicker}
          </p>
          <h1 className="mt-1 font-display text-[34px] font-semibold tracking-[-0.04em] text-ink">
            {d.card.title}
          </h1>
        </div>
        <LangToggle className="mt-1 shrink-0" />
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">
        {d.card.subtitle}
      </p>

      <VibeCardStudio
        inShell={inShell}
        data={{
          name: user.name,
          username: user.username,
          score: profile.score,
          ratingCount: profile.ratingCount,
          percentile,
          avatarUrl: user.avatarUrl,
          avatarColor: user.avatarColor,
          tags: topTags(profile.tags).map((t) => ({
            key: t.key,
            label: tagLabel(t.key, locale),
          })),
        }}
      />
    </main>
  );
}

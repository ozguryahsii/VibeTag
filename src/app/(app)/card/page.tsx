import { requireUser } from "@/lib/auth";
import { getPercentile, getVibeProfile } from "@/lib/profile";
import { VibeCardStudio } from "@/components/VibeCardStudio";
import { EmptyState, Button } from "@/components/ui";
import { getDict, getLocale } from "@/lib/i18n/server";
import { badgeLabel, tagLabel } from "@/lib/labels";
import { bestPerFamily, computeBadges, hardestBadges } from "@/lib/badges";
import { prisma } from "@/lib/db";
import { LangToggle } from "@/components/LangToggle";

export default async function CardPage() {
  const user = await requireUser();
  const d = await getDict();
  const locale = await getLocale();
  const profile = await getVibeProfile(user.id);
  const percentile = await getPercentile(user.id, profile.score);

  // Owned badges beat the live calculation, exactly as on the Badges tab —
  // a card must never show fewer badges than the app just congratulated
  // someone for.
  const held = await prisma.earnedBadge.findMany({
    where: { userId: user.id },
    select: { key: true, tier: true },
  });
  const heldIds = new Set(held.map((b) => `${b.key}:${b.tier}`));
  // One per family, then the four hardest of those — the card should show
  // what took the most doing, not whatever happens to sort first.
  const badges = hardestBadges(
    bestPerFamily(
      computeBadges(profile).map((b) => ({
        ...b,
        earned: b.earned || heldIds.has(`${b.key}:${b.tier}`),
      })),
    ),
    4,
  );

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
        data={{
          name: user.name,
          username: user.username,
          score: profile.score,
          ratingCount: profile.ratingCount,
          percentile,
          avatarUrl: user.avatarUrl,
          avatarColor: user.avatarColor,
          tags: profile.tags
            .slice(0, 5)
            .map((t) => ({ key: t.key, label: tagLabel(t.key, locale) })),
          badges: [
            ...badges.map((b) => ({
              key: b.key,
              label: badgeLabel(b.key, d),
              icon: b.icon,
              tier: b.tier as "BRONZE" | "SILVER" | "GOLD" | "VERIFIED",
            })),
            // The verification chip is not a badge and never competes with
            // one for a slot: it rides along whenever the email is confirmed.
            ...(user.emailVerifiedAt
              ? [
                  {
                    key: "verifiedEmail",
                    label: d.verifications.email.label,
                    icon: "shieldCheck",
                    tier: "VERIFIED" as const,
                  },
                ]
              : []),
          ],
        }}
      />
    </main>
  );
}

import type { VibeProfile } from "@/lib/vibe";

export type Badge = {
  key: string;
  /** Key into the shared line-icon set. */
  icon: string;
  earned: boolean;
  /** 0..1 — how close the user is to earning it. */
  progress: number;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function traitScore(profile: VibeProfile, key: string): number {
  return profile.traits.find((t) => t.key === key)?.score ?? 0;
}

function tagCount(profile: VibeProfile, key: string): number {
  return profile.tags.find((t) => t.key === key)?.count ?? 0;
}

export function computeBadges(profile: VibeProfile): Badge[] {
  const n = profile.ratingCount;

  const defs: Omit<Badge, "earned" | "progress">[] = [
    {
      key: "trustedPerson",
      icon: "shieldCheck",
    },
    {
      key: "goodEnergy",
      icon: "bolt",
    },
    {
      key: "teamPlayer",
      icon: "users",
    },
    {
      key: "communityFavorite",
      icon: "crown",
    },
    {
      key: "kindHeart",
      icon: "heart",
    },
    {
      key: "manyWorlds",
      icon: "leaf",
    },
  ];

  const workRatings =
    profile.groups.find((g) => g.group === "PROFESSIONAL")?.count ?? 0;
  const distinctGroups = profile.groups.filter((g) => g.count > 0).length;

  const state: Record<string, { earned: boolean; progress: number }> = {
    trustedPerson: {
      earned: traitScore(profile, "reliability") >= 90 && n >= 8,
      progress: clamp01(
        (traitScore(profile, "reliability") / 90) * 0.5 + (n / 8) * 0.5,
      ),
    },
    goodEnergy: {
      earned:
        traitScore(profile, "positivity") >= 90 ||
        tagCount(profile, "positiveEnergy") >= 10,
      progress: clamp01(
        Math.max(
          traitScore(profile, "positivity") / 90,
          tagCount(profile, "positiveEnergy") / 10,
        ),
      ),
    },
    teamPlayer: {
      earned: traitScore(profile, "teamwork") >= 88 && workRatings >= 5,
      progress: clamp01(
        (traitScore(profile, "teamwork") / 88) * 0.5 + (workRatings / 5) * 0.5,
      ),
    },
    communityFavorite: {
      earned: n >= 25 && profile.score >= 88,
      progress: clamp01((n / 25) * 0.6 + (profile.score / 88) * 0.4),
    },
    kindHeart: {
      earned: traitScore(profile, "kindness") >= 92,
      progress: clamp01(traitScore(profile, "kindness") / 92),
    },
    manyWorlds: {
      earned: distinctGroups >= 3,
      progress: clamp01(distinctGroups / 3),
    },
  };

  return defs.map((d) => ({
    ...d,
    earned: state[d.key].earned,
    progress: state[d.key].earned ? 1 : state[d.key].progress,
  }));
}

export function earnedBadges(profile: VibeProfile): Badge[] {
  return computeBadges(profile).filter((b) => b.earned);
}

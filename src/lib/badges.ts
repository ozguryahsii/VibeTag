import type { VibeProfile } from "@/lib/vibe";

/**
 * Badges (§ Vibe Tag rewards).
 *
 * Ten families, three tiers each. A tier is its own badge — bronze, silver and
 * gold are earned and kept separately, so someone who reaches gold owns all
 * three and the shelf shows a history rather than a single current state.
 *
 * The icon never changes between tiers; only the colour does. A silver Kind
 * Heart has to read as the same badge as the bronze one, otherwise the ladder
 * stops looking like a ladder.
 */

export const BADGE_TIERS = ["BRONZE", "SILVER", "GOLD"] as const;
export type BadgeTier = (typeof BADGE_TIERS)[number];

/** A metric a badge can be measured on. */
type Metric = {
  /** Trait metrics borrow the trait's own translated name. */
  kind: "trait" | "count";
  key: string;
  of: (p: VibeProfile) => number;
};

type FamilyDef = {
  key: string;
  icon: string;
  /**
   * One threshold per metric, per tier.
   *
   * All of them have to be met — unless `any`, where one is enough. Two ways
   * to earn the same badge is right for Good Energy: a warm score and a lot of
   * people naming the energy tag are the same observation seen twice.
   */
  any?: boolean;
  metrics: Metric[];
  tiers: Record<BadgeTier, number[]>;
};

export type Badge = {
  /** Family key — the thing being recognised. */
  key: string;
  /** Key into the shared line-icon set. Same for all three tiers. */
  icon: string;
  tier: BadgeTier;
  earned: boolean;
  /** 0..1 — how close the user is to earning this tier. */
  progress: number;
  /** What this tier asks for, ready to render. */
  requirements: { metric: Metric; need: number }[];
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function trait(key: string): Metric {
  return {
    kind: "trait",
    key,
    of: (p) => p.traits.find((t) => t.key === key)?.score ?? 0,
  };
}

function tagUses(key: string, metricKey: string): Metric {
  return {
    kind: "count",
    key: metricKey,
    of: (p) => p.tags.find((t) => t.key === key)?.count ?? 0,
  };
}

const RATINGS: Metric = {
  kind: "count",
  key: "ratings",
  of: (p) => p.ratingCount,
};

const WORK_RATINGS: Metric = {
  kind: "count",
  key: "workRatings",
  of: (p) => p.groups.find((g) => g.group === "PROFESSIONAL")?.count ?? 0,
};

const CIRCLES: Metric = {
  kind: "count",
  key: "circles",
  of: (p) => p.groups.filter((g) => g.count > 0).length,
};

const SCORE: Metric = { kind: "count", key: "score", of: (p) => p.score };

/**
 * The ten families.
 *
 * Bronze is deliberately reachable — a handful of ratings from people who mean
 * it. Gold is not: it needs both a high score and enough people to make that
 * score mean something, which is also what stops a badge from being farmable
 * by three friends.
 */
export const BADGE_FAMILIES: FamilyDef[] = [
  {
    key: "trustedPerson",
    icon: "shieldCheck",
    metrics: [trait("reliability"), RATINGS],
    tiers: { BRONZE: [75, 3], SILVER: [85, 8], GOLD: [92, 15] },
  },
  {
    key: "goodEnergy",
    icon: "bolt",
    any: true,
    metrics: [trait("positivity"), tagUses("positiveEnergy", "energyTag")],
    tiers: { BRONZE: [75, 3], SILVER: [85, 8], GOLD: [92, 15] },
  },
  {
    key: "teamPlayer",
    icon: "users",
    metrics: [trait("teamwork"), WORK_RATINGS],
    tiers: { BRONZE: [72, 2], SILVER: [84, 5], GOLD: [91, 10] },
  },
  {
    key: "communityFavorite",
    icon: "crown",
    metrics: [RATINGS, SCORE],
    tiers: { BRONZE: [10, 80], SILVER: [25, 86], GOLD: [50, 91] },
  },
  {
    key: "kindHeart",
    icon: "heart",
    metrics: [trait("kindness")],
    tiers: { BRONZE: [78], SILVER: [87], GOLD: [94] },
  },
  {
    key: "manyWorlds",
    icon: "leaf",
    metrics: [CIRCLES],
    tiers: { BRONZE: [2], SILVER: [3], GOLD: [4] },
  },
  {
    key: "straightTalker",
    // Scales, not a shield: "trusted" already owns the shield, and two near
    // identical glyphs on one shelf make both of them meaningless.
    icon: "scales",
    metrics: [trait("honesty")],
    tiers: { BRONZE: [78], SILVER: [87], GOLD: [94] },
  },
  {
    key: "problemSolver",
    icon: "bulb",
    metrics: [trait("problemSolving")],
    tiers: { BRONZE: [75], SILVER: [85], GOLD: [92] },
  },
  {
    key: "greatListener",
    icon: "heartHands",
    metrics: [trait("empathy")],
    tiers: { BRONZE: [78], SILVER: [87], GOLD: [94] },
  },
  {
    key: "wellKnown",
    icon: "globe",
    metrics: [RATINGS],
    tiers: { BRONZE: [5], SILVER: [20], GOLD: [50] },
  },
  {
    key: "originalMind",
    icon: "sparkle",
    metrics: [trait("creativity")],
    tiers: { BRONZE: [78], SILVER: [87], GOLD: [94] },
  },
];

export const BADGE_COUNT = BADGE_FAMILIES.length * BADGE_TIERS.length;

function evaluate(family: FamilyDef, tier: BadgeTier, profile: VibeProfile) {
  const needs = family.tiers[tier];
  const ratios = family.metrics.map((m, i) => clamp01(m.of(profile) / needs[i]));
  const met = family.metrics.map((m, i) => m.of(profile) >= needs[i]);

  // The binding condition wins. Averaging lets a badge sit at "100%" while it
  // is still locked — twenty work ratings but no teamwork score yet — which
  // reads as a bug rather than as a goal.
  const progress = family.any ? Math.max(...ratios) : Math.min(...ratios);
  const earned = family.any ? met.some(Boolean) : met.every(Boolean);

  return {
    earned,
    // Never round an unearned badge up to a full bar: "100%" next to "locked"
    // reads as something broken rather than something close.
    progress: earned ? 1 : Math.min(progress, 0.99),
    requirements: family.metrics.map((metric, i) => ({
      metric,
      need: needs[i],
    })),
  };
}

/** Every badge — ten families times three tiers — with live progress. */
export function computeBadges(profile: VibeProfile): Badge[] {
  return BADGE_FAMILIES.flatMap((family) =>
    BADGE_TIERS.map((tier) => ({
      key: family.key,
      icon: family.icon,
      tier,
      ...evaluate(family, tier, profile),
    })),
  );
}

export function earnedBadges(profile: VibeProfile): Badge[] {
  return computeBadges(profile).filter((b) => b.earned);
}

const TIER_RANK: Record<BadgeTier, number> = {
  BRONZE: 0,
  SILVER: 1,
  GOLD: 2,
};

export function tierRank(tier: BadgeTier): number {
  return TIER_RANK[tier];
}

/**
 * One badge per family — the best tier held.
 *
 * For the profile shelf and the Vibe Card, where showing bronze, silver and
 * gold Kind Heart side by side would say the same thing three times.
 */
export function bestPerFamily<T extends Badge>(badges: T[]): T[] {
  const best = new Map<string, T>();
  for (const b of badges) {
    if (!b.earned) continue;
    const current = best.get(b.key);
    if (!current || TIER_RANK[b.tier] > TIER_RANK[current.tier]) {
      best.set(b.key, b);
    }
  }
  return [...best.values()].sort(
    (a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier],
  );
}

/**
 * How hard a badge is to earn, on one comparable scale.
 *
 * Thresholds live in different units — a trait score of 90 and a count of 25
 * are not the same number — so each requirement is scored against the
 * hardest ask for that same metric anywhere in the table, and the badge's
 * difficulty is the sum. Tier leads, because a Gold is always harder than
 * the Silver of the same family, and a badge with two conditions outranks a
 * badge with one at the same tier by construction.
 */
const HARDEST_NEED = (() => {
  const max = new Map<string, number>();
  for (const family of BADGE_FAMILIES) {
    for (const tier of BADGE_TIERS) {
      family.metrics.forEach((m, i) => {
        const key = `${m.kind}:${m.key}`;
        max.set(key, Math.max(max.get(key) ?? 0, family.tiers[tier][i]));
      });
    }
  }
  return max;
})();

export function badgeDifficulty(badge: Badge): number {
  const asks = badge.requirements.reduce((sum, r) => {
    const hardest = HARDEST_NEED.get(`${r.metric.kind}:${r.metric.key}`) ?? r.need;
    return sum + (hardest > 0 ? r.need / hardest : 0);
  }, 0);
  // `any` families need only one of their conditions, so the sum overstates
  // them — halve it rather than pretend both were required.
  const family = BADGE_FAMILIES.find((f) => f.key === badge.key);
  return TIER_RANK[badge.tier] * 10 + (family?.any ? asks / 2 : asks);
}

/** The n hardest badges somebody holds, hardest first. */
export function hardestBadges<T extends Badge>(badges: T[], n: number): T[] {
  return [...badges]
    .filter((b) => b.earned)
    .sort((a, b) => badgeDifficulty(b) - badgeDifficulty(a))
    .slice(0, n);
}

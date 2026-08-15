import {
  CONTEXT_GROUPS,
  RELATIONSHIPS,
  TRAITS,
  VIBE_TAGS,
  type ContextGroup,
  type RelationshipKey,
  type TraitKey,
  type VibeTagKey,
} from "@/lib/taxonomy";

/**
 * Scoring engine.
 *
 * Design rules that come straight from the product brief:
 *  - the number is never a verdict on a person, so it is deliberately
 *    generous and shrinks toward a neutral prior when evidence is thin;
 *  - suspicious ratings are down-weighted rather than deleted;
 *  - every displayed number must be explainable from the raw data.
 */

/** Neutral starting point for a profile with no evidence yet. */
const PRIOR_SCORE = 78;
/** How many "virtual" ratings the prior is worth. */
const PRIOR_STRENGTH = 4;

export type RatingInput = {
  id: string;
  relationship: RelationshipKey;
  weight: number;
  createdAt: Date;
  traits: { traitKey: TraitKey; score: number }[];
  vibeTags: { tagKey: VibeTagKey }[];
};

export type TraitStat = {
  key: TraitKey;
  label: string;
  en: string;
  emoji: string;
  score: number; // 0..100
  count: number;
};

export type TagStat = {
  key: VibeTagKey;
  en: string;
  tr: string;
  emoji: string;
  count: number;
  share: number; // 0..1 of raters who gave this tag
};

export type GroupStat = {
  group: ContextGroup;
  label: string;
  emoji: string;
  count: number;
  share: number; // 0..1
  score: number; // 0..100 within this context
};

export type VibeProfile = {
  score: number; // 0..100
  ratingCount: number;
  effectiveCount: number; // sum of weights
  traits: TraitStat[]; // sorted desc by score
  tags: TagStat[]; // sorted desc by count
  groups: GroupStat[];
  relationshipCounts: { key: RelationshipKey; label: string; count: number }[];
  hasEnoughData: boolean;
};

/** 1..5 average → 0..100 */
function toHundred(avg: number): number {
  return ((avg - 1) / 4) * 100;
}

export function buildVibeProfile(ratings: RatingInput[]): VibeProfile {
  const traitSum = new Map<TraitKey, { w: number; ws: number; n: number }>();
  const tagCount = new Map<VibeTagKey, number>();
  const groupAgg = new Map<ContextGroup, { w: number; ws: number; n: number }>();
  const relCount = new Map<RelationshipKey, number>();

  let totalWeight = 0;
  let weightedTraitSum = 0;
  let weightedTraitWeight = 0;

  for (const r of ratings) {
    const w = Math.max(0, Math.min(1, r.weight));
    totalWeight += w;
    relCount.set(r.relationship, (relCount.get(r.relationship) ?? 0) + 1);

    const group = RELATIONSHIPS[r.relationship].group;

    for (const t of r.traits) {
      const cur = traitSum.get(t.traitKey) ?? { w: 0, ws: 0, n: 0 };
      cur.w += w;
      cur.ws += w * t.score;
      cur.n += 1;
      traitSum.set(t.traitKey, cur);

      const g = groupAgg.get(group) ?? { w: 0, ws: 0, n: 0 };
      g.w += w;
      g.ws += w * t.score;
      groupAgg.set(group, g);

      weightedTraitSum += w * t.score;
      weightedTraitWeight += w;
    }

    // Count ratings (not traits) per group for the "who knows you" split.
    const g = groupAgg.get(group) ?? { w: 0, ws: 0, n: 0 };
    g.n += 1;
    groupAgg.set(group, g);

    for (const tag of r.vibeTags) {
      tagCount.set(tag.tagKey, (tagCount.get(tag.tagKey) ?? 0) + 1);
    }
  }

  const rawAvg = weightedTraitWeight > 0 ? weightedTraitSum / weightedTraitWeight : 0;
  const rawScore = weightedTraitWeight > 0 ? toHundred(rawAvg) : PRIOR_SCORE;

  // Bayesian shrinkage on the number of *raters*, not traits.
  const score =
    (rawScore * totalWeight + PRIOR_SCORE * PRIOR_STRENGTH) /
    (totalWeight + PRIOR_STRENGTH);

  const traits: TraitStat[] = [...traitSum.entries()]
    .map(([key, v]) => ({
      key,
      label: TRAITS[key].label,
      en: TRAITS[key].en,
      emoji: TRAITS[key].emoji,
      score: Math.round(toHundred(v.ws / v.w)),
      count: v.n,
    }))
    .sort((a, b) => b.score - a.score || b.count - a.count);

  const raters = ratings.length || 1;
  const tags: TagStat[] = [...tagCount.entries()]
    .map(([key, count]) => ({
      key,
      en: VIBE_TAGS[key].en,
      tr: VIBE_TAGS[key].tr,
      emoji: VIBE_TAGS[key].emoji,
      count,
      share: count / raters,
    }))
    .sort((a, b) => b.count - a.count || a.en.localeCompare(b.en));

  const groups: GroupStat[] = [...groupAgg.entries()]
    .map(([group, v]) => ({
      group,
      label: CONTEXT_GROUPS[group].label,
      emoji: CONTEXT_GROUPS[group].emoji,
      count: v.n,
      share: ratings.length ? v.n / ratings.length : 0,
      score: v.w > 0 ? Math.round(toHundred(v.ws / v.w)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const relationshipCounts = [...relCount.entries()]
    .map(([key, count]) => ({ key, label: RELATIONSHIPS[key].label, count }))
    .sort((a, b) => b.count - a.count);

  return {
    score: Math.round(score),
    ratingCount: ratings.length,
    effectiveCount: Math.round(totalWeight * 10) / 10,
    traits,
    tags,
    groups,
    relationshipCounts,
    hasEnoughData: ratings.length >= 3,
  };
}

/** Traits that lag behind the profile average — framed as growth, not failure. */
export function growthAreas(profile: VibeProfile, limit = 3): TraitStat[] {
  if (profile.traits.length < 3) return [];
  return [...profile.traits]
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .filter((t) => t.score < profile.score);
}

export function strongestTraits(profile: VibeProfile, limit = 3): TraitStat[] {
  return profile.traits.slice(0, limit);
}

export const EMPTY_PROFILE: VibeProfile = buildVibeProfile([]);

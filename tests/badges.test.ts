import { describe, expect, it } from "vitest";
import {
  BADGE_COUNT,
  BADGE_FAMILIES,
  BADGE_TIERS,
  bestPerFamily,
  computeBadges,
  earnedBadges,
  tierRank,
} from "@/lib/badges";
import { buildVibeProfile, type RatingInput } from "@/lib/vibe";
import type { RelationshipKey, TraitKey, VibeTagKey } from "@/lib/taxonomy";

function rating(
  relationship: RelationshipKey,
  traits: Record<string, number>,
  tags: string[] = [],
): RatingInput {
  return {
    id: Math.random().toString(36).slice(2),
    relationship,
    weight: 1,
    createdAt: new Date(),
    traits: Object.entries(traits).map(([traitKey, score]) => ({
      traitKey: traitKey as TraitKey,
      score,
    })),
    vibeTags: tags.map((t) => ({ tagKey: t as VibeTagKey })),
  };
}

describe("badges", () => {
  it("gives an empty profile nothing", () => {
    expect(earnedBadges(buildVibeProfile([]))).toEqual([]);
  });

  it("offers eleven families at three tiers each", () => {
    expect(BADGE_FAMILIES).toHaveLength(11);
    expect(BADGE_TIERS).toHaveLength(3);
    expect(computeBadges(buildVibeProfile([]))).toHaveLength(BADGE_COUNT);
  });

  it("uses one icon per family, at every tier", () => {
    // Bronze, silver and gold Kind Heart have to read as the same badge. A
    // different glyph per tier turns a ladder into three unrelated awards.
    const byFamily = new Map<string, Set<string>>();
    for (const b of computeBadges(buildVibeProfile([]))) {
      byFamily.set(b.key, (byFamily.get(b.key) ?? new Set()).add(b.icon));
    }
    for (const [key, icons] of byFamily) expect(icons.size, key).toBe(1);
  });

  it("never shows a locked badge as complete", () => {
    // The bar and the lock have to agree. A badge sitting at "100%" while
    // still locked reads as a bug, not as something almost within reach.
    const profile = buildVibeProfile(
      Array.from({ length: 12 }, () => rating("sameProject", { teamwork: 5 })),
    );
    for (const badge of computeBadges(profile)) {
      if (!badge.earned) expect(badge.progress, badge.key).toBeLessThan(1);
    }
  });

  it("keeps progress inside 0..1", () => {
    const profile = buildVibeProfile(
      Array.from({ length: 40 }, () => rating("sameProject", { reliability: 5 })),
    );
    for (const badge of computeBadges(profile)) {
      expect(badge.progress).toBeGreaterThanOrEqual(0);
      expect(badge.progress).toBeLessThanOrEqual(1);
    }
  });

  it("earns tiers as a ladder, never skipping a rung", () => {
    // Gold without silver would leave a hole in the shelf and make the
    // "3 of 30" counter lie about how far someone has come.
    const profile = buildVibeProfile([
      ...Array.from({ length: 30 }, () => rating("friend", { kindness: 5 })),
      ...Array.from({ length: 25 }, () =>
        rating("sameProject", { teamwork: 5, reliability: 5 }),
      ),
      rating("receivedService", { fairness: 4 }),
      rating("community", { respect: 4 }),
    ]);

    const earned = earnedBadges(profile);
    for (const badge of earned) {
      const lower = BADGE_TIERS.filter(
        (t) => tierRank(t) < tierRank(badge.tier),
      );
      for (const tier of lower) {
        const rung = earned.find((b) => b.key === badge.key && b.tier === tier);
        expect(rung, `${badge.key} ${badge.tier} without ${tier}`).toBeTruthy();
      }
    }
  });

  it("thresholds only ever climb between tiers", () => {
    for (const family of BADGE_FAMILIES) {
      family.metrics.forEach((_, i) => {
        const [bronze, silver, gold] = BADGE_TIERS.map(
          (t) => family.tiers[t][i],
        );
        expect(silver, `${family.key} silver`).toBeGreaterThanOrEqual(bronze);
        expect(gold, `${family.key} gold`).toBeGreaterThanOrEqual(silver);
      });
    }
  });

  it("shows one badge per family on a shelf, at the best tier held", () => {
    const profile = buildVibeProfile(
      Array.from({ length: 30 }, () => rating("friend", { kindness: 5 })),
    );
    const shelf = bestPerFamily(earnedBadges(profile));
    const kind = shelf.filter((b) => b.key === "kindHeart");
    expect(kind).toHaveLength(1);
    expect(kind[0].tier).toBe("GOLD");
  });

  it("awards Many Worlds one tier per extra circle", () => {
    const circles = (n: number) =>
      buildVibeProfile(
        [
          rating("sameProject", { reliability: 5 }),
          rating("friend", { kindness: 5 }),
          rating("receivedService", { fairness: 5 }),
          rating("other", { respect: 5 }),
        ].slice(0, n),
      );

    const tiersFor = (n: number) =>
      earnedBadges(circles(n))
        .filter((b) => b.key === "manyWorlds")
        .map((b) => b.tier);

    expect(tiersFor(1)).toEqual([]);
    expect(tiersFor(2)).toEqual(["BRONZE"]);
    expect(tiersFor(3)).toEqual(["BRONZE", "SILVER"]);
    expect(tiersFor(4)).toEqual(["BRONZE", "SILVER", "GOLD"]);
  });

  it("requires both halves of a two-condition badge", () => {
    // Teamwork is perfect but there is only one work rating, not two.
    const profile = buildVibeProfile([rating("sameProject", { teamwork: 5 })]);
    expect(earnedBadges(profile).map((b) => b.key)).not.toContain("teamPlayer");
  });

  it("keeps the context lock: a shop rating cannot earn a work badge", () => {
    // Someone known only across a counter is never rated on teamwork, so no
    // tier of Team Player can be reached however many people rate them. The
    // lock lives upstream in the taxonomy; this is the badge shelf agreeing
    // with it, which is where a regression would actually be visible.
    const profile = buildVibeProfile(
      Array.from({ length: 40 }, () =>
        rating("knowAsSeller", { fairness: 5, respect: 5 }),
      ),
    );
    const keys = earnedBadges(profile).map((b) => b.key);
    expect(keys).not.toContain("teamPlayer");
    expect(keys).toContain("wellKnown");
  });
});

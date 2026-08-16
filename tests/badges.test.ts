import { describe, expect, it } from "vitest";
import { computeBadges, earnedBadges } from "@/lib/badges";
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

  it("awards Many Worlds only from three distinct circles", () => {
    const two = buildVibeProfile([
      rating("sameProject", { reliability: 5 }),
      rating("friend", { kindness: 5 }),
    ]);
    const three = buildVibeProfile([
      rating("sameProject", { reliability: 5 }),
      rating("friend", { kindness: 5 }),
      rating("receivedService", { fairness: 5 }),
    ]);

    expect(earnedBadges(two).map((b) => b.key)).not.toContain("manyWorlds");
    expect(earnedBadges(three).map((b) => b.key)).toContain("manyWorlds");
  });

  it("requires both halves of a two-condition badge", () => {
    // Teamwork is perfect but there are only two work ratings, not five.
    const profile = buildVibeProfile([
      rating("sameProject", { teamwork: 5 }),
      rating("sameProject", { teamwork: 5 }),
    ]);
    expect(earnedBadges(profile).map((b) => b.key)).not.toContain("teamPlayer");
  });
});

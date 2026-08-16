import { describe, expect, it } from "vitest";
import { buildVibeProfile, growthAreas, strongestTraits, type RatingInput } from "@/lib/vibe";
import type { RelationshipKey, TraitKey, VibeTagKey } from "@/lib/taxonomy";

function rating(
  relationship: RelationshipKey,
  traits: Record<string, number>,
  opts: { weight?: number; tags?: string[] } = {},
): RatingInput {
  return {
    id: Math.random().toString(36).slice(2),
    relationship,
    weight: opts.weight ?? 1,
    createdAt: new Date(),
    traits: Object.entries(traits).map(([traitKey, score]) => ({
      traitKey: traitKey as TraitKey,
      score,
    })),
    vibeTags: (opts.tags ?? []).map((t) => ({ tagKey: t as VibeTagKey })),
  };
}

/**
 * The score is deliberately generous and deliberately cautious: it shrinks
 * towards a neutral prior when there is little evidence, so a single ecstatic
 * rating cannot mint a perfect profile. These tests pin that behaviour, since
 * "the number moved" is not something anyone can eyeball as right or wrong.
 */
describe("vibe score", () => {
  it("returns the neutral prior with no ratings at all", () => {
    const profile = buildVibeProfile([]);
    expect(profile.score).toBe(78);
    expect(profile.ratingCount).toBe(0);
    expect(profile.hasEnoughData).toBe(false);
  });

  it("does not hand out 100 for one perfect rating", () => {
    const profile = buildVibeProfile([
      rating("sameProject", { reliability: 5, teamwork: 5, communication: 5 }),
    ]);
    expect(profile.score).toBeLessThan(95);
    expect(profile.score).toBeGreaterThan(78);
  });

  it("converges upward as perfect ratings accumulate", () => {
    const one = buildVibeProfile([rating("sameProject", { reliability: 5 })]);
    const many = buildVibeProfile(
      Array.from({ length: 20 }, () => rating("sameProject", { reliability: 5 })),
    );
    expect(many.score).toBeGreaterThan(one.score);
    expect(many.score).toBeLessThanOrEqual(100);
  });

  it("counts a down-weighted rating less than a full one", () => {
    const full = buildVibeProfile([
      rating("sameProject", { reliability: 1 }),
      rating("sameProject", { reliability: 1 }),
    ]);
    const damped = buildVibeProfile([
      rating("sameProject", { reliability: 1 }, { weight: 0.2 }),
      rating("sameProject", { reliability: 1 }, { weight: 0.2 }),
    ]);
    // Both are terrible ratings; the suspicious pair should drag the score
    // down less, because it carries less evidence.
    expect(damped.score).toBeGreaterThan(full.score);
  });

  it("flags enough data only from the third rating", () => {
    const two = buildVibeProfile([
      rating("sameProject", { reliability: 4 }),
      rating("friend", { kindness: 4 }),
    ]);
    const three = buildVibeProfile([
      rating("sameProject", { reliability: 4 }),
      rating("friend", { kindness: 4 }),
      rating("online", { communication: 4 }),
    ]);
    expect(two.hasEnoughData).toBe(false);
    expect(three.hasEnoughData).toBe(true);
  });

  it("splits ratings across the circles they came from", () => {
    const profile = buildVibeProfile([
      rating("sameProject", { reliability: 5 }),
      rating("sameProject", { reliability: 5 }),
      rating("friend", { kindness: 5 }),
      rating("receivedService", { fairness: 5 }),
    ]);
    const professional = profile.groups.find((g) => g.group === "PROFESSIONAL");
    expect(professional?.count).toBe(2);
    expect(professional?.share).toBeCloseTo(0.5, 5);
    expect(profile.groups.reduce((sum, g) => sum + g.share, 0)).toBeCloseTo(1, 5);
  });

  it("counts tags per rater, not per mention", () => {
    const profile = buildVibeProfile([
      rating("friend", { kindness: 5 }, { tags: ["kind"] }),
      rating("friend", { kindness: 5 }, { tags: ["kind"] }),
    ]);
    const kind = profile.tags.find((t) => t.key === "kind");
    expect(kind?.count).toBe(2);
    expect(kind?.share).toBeCloseTo(1, 5);
  });

  it("orders strengths above growth areas", () => {
    const profile = buildVibeProfile([
      rating("sameProject", { reliability: 5, teamwork: 5, punctuality: 1 }),
      rating("sameProject", { reliability: 5, teamwork: 5, punctuality: 1 }),
      rating("sameProject", { reliability: 5, teamwork: 5, punctuality: 1 }),
    ]);
    const top = strongestTraits(profile, 1)[0];
    const grow = growthAreas(profile, 1)[0];
    expect(top.score).toBeGreaterThan(grow.score);
    expect(grow.key).toBe("punctuality");
  });
});

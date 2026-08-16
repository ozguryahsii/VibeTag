import { describe, expect, it } from "vitest";
import {
  RELATIONSHIPS,
  allowedTraits,
  allowedVibeTags,
  assertAllowed,
  isRelationshipKey,
  MAX_VIBE_TAGS_PER_RATING,
} from "@/lib/taxonomy";

/**
 * The context lock is the product.
 *
 * "How do you know this person?" decides what may be said about them: a market
 * cashier can be rated on kindness and fairness, never on leadership or
 * friendship. Everything else here — the score, the tags, the summary — is
 * only trustworthy because this holds. If it ever silently loosens, Vibe Tag
 * stops being different from every other rating app, and nothing else in the
 * test suite would notice.
 */
describe("context lock", () => {
  it("refuses a trait the relationship cannot observe", () => {
    // Someone who only knows you as a seller has no way to judge leadership.
    const verdict = assertAllowed("knowAsSeller", ["leadership"], []);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) {
      expect(verdict.kind).toBe("trait");
      expect(verdict.key).toBe("leadership");
    }
  });

  it("refuses a Vibe Tag the relationship cannot observe", () => {
    const tags = allowedVibeTags("knowAsSeller").map((t) => t.key as string);
    expect(tags).not.toContain("leader");

    const verdict = assertAllowed("knowAsSeller", [], ["leader"]);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.kind).toBe("tag");
  });

  it("accepts exactly what the relationship opens up", () => {
    const traits = allowedTraits("knowAsSeller").map((t) => t.key as string);
    const tags = allowedVibeTags("knowAsSeller")
      .slice(0, MAX_VIBE_TAGS_PER_RATING)
      .map((t) => t.key as string);

    expect(assertAllowed("knowAsSeller", traits, tags)).toEqual({ ok: true });
  });

  it("opens leadership only where a leader could actually be seen", () => {
    const canJudgeLeadership = Object.keys(RELATIONSHIPS).filter((key) =>
      (RELATIONSHIPS[key as keyof typeof RELATIONSHIPS].traits as readonly string[]).includes(
        "leadership",
      ),
    );

    // Not an exhaustive list on purpose — the point is that commerce and
    // loose acquaintance never qualify, however the taxonomy grows.
    expect(canJudgeLeadership).not.toContain("knowAsSeller");
    expect(canJudgeLeadership).not.toContain("knowAsCustomer");
    expect(canJudgeLeadership).not.toContain("receivedService");
    expect(canJudgeLeadership).not.toContain("online");
    expect(canJudgeLeadership.length).toBeGreaterThan(0);
  });

  it("never opens a trait or tag that is not in the relationship's own list", () => {
    // Every relationship must be internally consistent: what `allowedTraits`
    // hands the UI has to be exactly what `assertAllowed` will accept back.
    for (const key of Object.keys(RELATIONSHIPS)) {
      if (!isRelationshipKey(key)) throw new Error(`bad key ${key}`);

      const traits = allowedTraits(key).map((t) => t.key as string);
      const tags = allowedVibeTags(key).map((t) => t.key as string);
      expect(assertAllowed(key, traits, tags), key).toEqual({ ok: true });
    }
  });

  it("rejects a relationship key that does not exist", () => {
    expect(isRelationshipKey("wasMyLandlord")).toBe(false);
  });
});

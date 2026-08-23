import { describe, expect, it } from "vitest";
import {
  RELATIONSHIPS,
  allowedTraits,
  allowedVibeTags,
  assertAllowed,
  isRelationshipKey,
  traitQuestion,
  TRAITS,
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

  /*
   * The lock covers the newer criteria too.
   *
   * Several of them are only meaningful in one kind of relationship: whether
   * somebody follows company rules is a thing a colleague saw, and how
   * genuine their posts are is a thing a follower saw. Asked in the wrong
   * place they are not merely odd, they are the lock quietly loosening.
   */
  it("keeps workplace-only criteria out of everywhere else", () => {
    const asks = (trait: string) =>
      Object.keys(RELATIONSHIPS).filter((key) =>
        (
          RELATIONSHIPS[key as keyof typeof RELATIONSHIPS]
            .traits as readonly string[]
        ).includes(trait),
      );

    for (const trait of ["compliance", "justice", "equality"]) {
      const where = asks(trait);
      expect(where.length, trait).toBeGreaterThan(0);
      for (const key of where) {
        expect(
          RELATIONSHIPS[key as keyof typeof RELATIONSHIPS].group,
          `${trait} in ${key}`,
        ).toBe("PROFESSIONAL");
      }
    }
  });

  it("asks about social-media content only where there is any", () => {
    const asks = (trait: string) =>
      Object.keys(RELATIONSHIPS).filter((key) =>
        (
          RELATIONSHIPS[key as keyof typeof RELATIONSHIPS]
            .traits as readonly string[]
        ).includes(trait),
      );
    expect(asks("authenticity")).toEqual(["community"]);
    expect(asks("loyalty")).toEqual(["closeFriend"]);
  });

  /*
   * A question override belongs to a relationship that actually asks the
   * trait. An override on a trait the relationship dropped is dead text that
   * nobody sees and nobody notices has stopped matching.
   */
  it("only overrides questions for traits the relationship asks", () => {
    for (const key of Object.keys(RELATIONSHIPS)) {
      if (!isRelationshipKey(key)) throw new Error(`bad key ${key}`);
      const rel = RELATIONSHIPS[key];
      for (const trait of Object.keys(rel.hintOverrides ?? {})) {
        expect(rel.traits as readonly string[], `${key}.${trait}`).toContain(
          trait,
        );
      }
    }
  });

  it("gives every criterion a question in both languages", () => {
    for (const trait of Object.values(TRAITS)) {
      expect(trait.hint.length, trait.key).toBeGreaterThan(3);
      expect(trait.en.length, trait.key).toBeGreaterThan(1);
    }
    // And an override, where one exists, is filled in for both.
    expect(traitQuestion("community", "funToBeAround", "tr")).toBe(
      "İçerikleri eğlenceli mi?",
    );
    expect(traitQuestion("community", "funToBeAround", "en")).toBeTruthy();
    expect(traitQuestion("friend", "funToBeAround", "tr")).toBeNull();
  });
});

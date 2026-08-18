import { describe, expect, it } from "vitest";
import { generateVibeSummary } from "@/lib/insights";
import { buildVibeProfile, type RatingInput } from "@/lib/vibe";
import { en } from "@/lib/i18n/en";
import { tr } from "@/lib/i18n/tr";
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

const profile = buildVibeProfile([
  ...Array.from({ length: 6 }, () =>
    rating("sameProject", { reliability: 5, teamwork: 4 }, ["reliable"]),
  ),
  ...Array.from({ length: 3 }, () => rating("friend", { kindness: 5 }, ["kind"])),
  rating("receivedService", { fairness: 4 }),
]);

const empty = buildVibeProfile([]);

/**
 * The bug this guards: the summary was written in the second person and shown
 * unchanged on other people's profiles, so Elif's page told you that Elif's
 * ratings were yours. It reads perfectly well — it is just about the wrong
 * person, which is exactly the kind of thing no crash ever reports.
 */
describe("summary voice", () => {
  it("speaks to the owner on their own page", () => {
    const self = generateVibeSummary(profile, "Elif", en, "en", "self");
    expect(self.headline.toLowerCase()).toContain("you");
  });

  it("never says 'you' on somebody else's page", () => {
    const other = generateVibeSummary(profile, "Elif", en, "en", "other");
    for (const line of [other.headline, other.paragraph]) {
      expect(line, line).not.toMatch(/\b(you|your|yours)\b/i);
    }
  });

  it("never uses Turkish second-person suffixes on somebody else's page", () => {
    // Turkish carries person in the suffix, so a pronoun check would miss it:
    // "değerlendirmelerinin" and "çevrenden" are second person with no "sen"
    // anywhere in the sentence.
    const other = generateVibeSummary(profile, "Elif", tr, "tr", "other");
    for (const line of [other.headline, other.paragraph]) {
      expect(line, line).not.toMatch(/\b(seni|sende|senin|çevrenden|yönün)\b/i);
      expect(line, line).not.toMatch(/değerlendirmelerinin/i);
    }
  });

  it("names the person it is about, in both languages", () => {
    for (const [d, locale] of [
      [en, "en"],
      [tr, "tr"],
    ] as const) {
      const other = generateVibeSummary(profile, "Elif", d, locale, "other");
      expect(other.headline + other.paragraph).toContain("Elif");
    }
  });

  it("keeps the empty state in the right voice too", () => {
    const other = generateVibeSummary(empty, "Elif", en, "en", "other");
    expect(other.paragraph).not.toMatch(/\byour\b/i);
    const self = generateVibeSummary(empty, "Elif", en, "en", "self");
    expect(self.paragraph).toMatch(/\byour\b/i);
  });

  it("defaults to the owner's voice when nobody says otherwise", () => {
    const implicit = generateVibeSummary(profile, "Elif", en, "en");
    const explicit = generateVibeSummary(profile, "Elif", en, "en", "self");
    expect(implicit).toEqual(explicit);
  });
});

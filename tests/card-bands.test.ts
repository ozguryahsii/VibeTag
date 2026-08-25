import { describe, expect, it } from "vitest";
import { peopleWord } from "@/lib/card-tags";
import { CARD_BANDS, bandFor } from "@/lib/card-bands";
import { SCENES } from "@/components/card/scenes";

describe("card bands", () => {
  it("covers 0..100 with no gap and no overlap", () => {
    // A gap means a score with no design; an overlap means two designs racing
    // for the same score. Both are invisible until somebody's card is wrong.
    expect(CARD_BANDS[0].min).toBe(0);
    expect(CARD_BANDS[CARD_BANDS.length - 1].max).toBe(100);
    for (let i = 1; i < CARD_BANDS.length; i++) {
      expect(CARD_BANDS[i].min, CARD_BANDS[i].key).toBe(
        CARD_BANDS[i - 1].max + 1,
      );
    }
  });

  it("gives every whole score exactly one band", () => {
    for (let n = 0; n <= 100; n++) {
      const hits = CARD_BANDS.filter((b) => n >= b.min && n <= b.max);
      expect(hits, `score ${n}`).toHaveLength(1);
      expect(bandFor(n).key).toBe(hits[0].key);
    }
  });

  it("climbs: a higher score never drops to an earlier band", () => {
    let seen = -1;
    for (let n = 0; n <= 100; n++) {
      const index = CARD_BANDS.findIndex((b) => b.key === bandFor(n).key);
      expect(index, `score ${n}`).toBeGreaterThanOrEqual(seen);
      seen = index;
    }
  });

  it("clamps rather than throwing outside 0..100", () => {
    // Scores are integers 0..100 by construction, but a rounding change
    // upstream must not be able to produce a card with no design at all.
    expect(bandFor(-5).key).toBe("monochrome");
    expect(bandFor(140).key).toBe("supernova");
    expect(bandFor(49.6).key).toBe("ash");
  });

  it("has a scene for every band, and no orphan scenes", () => {
    for (const band of CARD_BANDS) {
      const scene = SCENES[band.key];
      expect(scene, band.key).toBeTruthy();
      expect(scene.key).toBe(band.key);
      expect(scene.name).toBe(band.name);
    }
    expect(Object.keys(SCENES)).toHaveLength(CARD_BANDS.length);
  });

  it("gets quieter going down the ladder", () => {
    // The bottom of the ladder must never sprout a halo, and the top must
    // never lose one. This is the product promise in one assertion: a modest
    // score gets a calm card, never a sarcastic one.
    const rays = CARD_BANDS.map((b) => SCENES[b.key].palette.rays !== null);
    expect(rays.slice(0, 6).some(Boolean)).toBe(false);
    expect(rays.slice(6).every(Boolean)).toBe(true);
  });
});

/**
 * "Rated by 1 people".
 *
 * That is what the card said at one rater — which is the state every new
 * account is in, and the state anybody screenshotting the app for a store
 * listing is most likely to catch. The card is drawn onto a canvas, so
 * nothing about it can be asserted after the fact; the wording is only
 * checkable if it lives outside the drawing.
 */
describe("counting raters on the card", () => {
  const en = { people: "people", person: "person" };
  const tr = { people: "kişi", person: "kişi" };

  it("uses the singular at exactly one", () => {
    expect(peopleWord(1, en)).toBe("person");
  });

  it("uses the plural everywhere else, zero included", () => {
    expect(peopleWord(0, en)).toBe("people");
    expect(peopleWord(2, en)).toBe("people");
    expect(peopleWord(47, en)).toBe("people");
  });

  /*
   * Turkish does not pluralise a noun after a number — "1 kişi", "7 kişi" —
   * so both words are the same and the rule quietly does nothing there.
   * Asserted so that a future "fix" does not introduce "kişiler".
   */
  it("says the same thing either way in Turkish", () => {
    expect(peopleWord(1, tr)).toBe("kişi");
    expect(peopleWord(7, tr)).toBe("kişi");
  });
});

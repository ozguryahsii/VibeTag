/**
 * Vibe Card score bands.
 *
 * The card's whole atmosphere follows the score: a low score gets a quiet,
 * near-monochrome card and a perfect one gets fireworks. Twelve bands, each
 * with its own scene — see `src/components/card/scenes/`.
 *
 * The bands live here, away from any canvas code, so the ladder can be tested
 * for gaps and overlaps without a browser. A score that falls into no band, or
 * into two, would silently pick the wrong design for somebody's card.
 */

export const CARD_BANDS = [
  { key: "monochrome", name: "Monochrome", min: 0, max: 49 },
  { key: "ash", name: "Ash", min: 50, max: 60 },
  { key: "clay", name: "Clay", min: 61, max: 70 },
  { key: "sand", name: "Sand", min: 71, max: 75 },
  { key: "amber", name: "Amber", min: 76, max: 80 },
  { key: "coral", name: "Coral", min: 81, max: 85 },
  { key: "sunset", name: "Sunset", min: 86, max: 90 },
  { key: "bloom", name: "Bloom", min: 91, max: 92 },
  { key: "radiant", name: "Radiant", min: 93, max: 95 },
  { key: "aurora", name: "Aurora", min: 96, max: 98 },
  { key: "fireworks", name: "Fireworks", min: 99, max: 99 },
  { key: "supernova", name: "Supernova", min: 100, max: 100 },
] as const;

export type CardBand = (typeof CARD_BANDS)[number];
export type CardBandKey = CardBand["key"];

/**
 * Which band a score falls in.
 *
 * Scores are integers 0..100 by construction, but a rounding change upstream
 * should not be able to produce a card with no design at all — so anything
 * outside the ladder clamps to its nearest end rather than throwing.
 */
export function bandFor(score: number): CardBand {
  const n = Math.round(score);
  if (n <= CARD_BANDS[0].max) return CARD_BANDS[0];
  const hit = CARD_BANDS.find((b) => n >= b.min && n <= b.max);
  return hit ?? CARD_BANDS[CARD_BANDS.length - 1];
}

import type { CardBandKey } from "@/lib/card-bands";

/**
 * A Vibe Card scene: everything about a band that is *look* rather than
 * *layout*.
 *
 * The composition — avatar, name, score, mood line, trait pills, badge medals,
 * rater footer — is written once in `draw.ts` and never varies. What varies is
 * the atmosphere around it: the page behind the card, the surface inside it,
 * anything thrown over the top, and the colours the composition paints with.
 *
 * That split is deliberate. Twelve copies of the layout would drift apart the
 * first time a padding changed, and a redesign of one band would risk the
 * other eleven. To restyle a band, edit only its file in `scenes/`.
 */

/** Where the card sits on the canvas. All scene drawing is relative to this. */
export type SceneGeom = {
  ctx: CanvasRenderingContext2D;
  /** Full canvas. */
  w: number;
  h: number;
  /** The rounded card. */
  cardX: number;
  cardY: number;
  cardW: number;
  cardH: number;
  radius: number;
  /** Horizontal centre of the card. */
  cx: number;
  /** Design unit — every size in the composition is a multiple of this. */
  u: number;
};

/** Colours the shared composition paints with. */
export type Palette = {
  /** Page behind the card. */
  page: string;
  /** Base fill of the card surface, under whatever the scene paints. */
  card: string;
  /** Drop shadow under the card. */
  shadow: string;
  /** Hairline around the card. */
  border: string;

  /** Name, score fallback, rater count. */
  ink: string;
  /** Captions: "Rated by", the outer @handle. */
  inkSoft: string;
  /** MY VIBE, VIBE SCORE, the mood line, the divider dot. */
  accent: string;
  /** Divider hairline either side of the dot. */
  divider: string;

  /**
   * The score numeral. A list of stops makes it a gradient; a single colour
   * paints it flat, which is what the quiet bands want.
   */
  score: string[];
  /** Ring around the avatar — gradient stops, same rule as `score`. */
  avatarRing: string[];
  /**
   * Overrides the profile colour behind the initials.
   *
   * Only the two quiet bands set it: a black-and-white card with one orange
   * monogram in the middle is not a black-and-white card. Everywhere else it
   * is left out, so the person's own colour comes through.
   */
  avatarTint?: string;

  pillFill: string;
  pillBorder: string;
  pillInk: string;

  /** Footer hairline above the rater row. */
  rule: string;
  /** Stand-in rater avatars: [top, bottom] of each of three gradients. */
  raterStack: [string, string][];

  /** Outer "VIBE TAG" wordmark and @handle under the card. */
  brand: string;

  /** Watermark fingerprint: gradient stops, or null for the grey one. */
  mark: [string, string, string] | null;
  markAlpha: number;

  /**
   * Rays and embers behind the score. `null` on the quiet bands, where a halo
   * around a modest number would read as sarcasm.
   */
  rays: { stroke: string; embers: [string, string]; count: number } | null;

  /** The mood-line glyph: ✦, ★, ↗ … chosen per band, not per score. */
  moodGlyph: string;
};

export type Scene = {
  key: CardBandKey;
  /** Designer-facing name. Not user copy — it names the file, not a feeling. */
  name: string;
  palette: Palette;
  /** The page behind the card. Called before the card is drawn. */
  backdrop(g: SceneGeom): void;
  /** Inside the card. Already clipped to the rounded rectangle. */
  surface(g: SceneGeom): void;
  /** Over everything, after the card's border. Fireworks and confetti live here. */
  overlay?(g: SceneGeom): void;
};

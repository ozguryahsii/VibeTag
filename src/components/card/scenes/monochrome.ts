import type { Scene } from "@/components/card/scene";
import { crestBottom } from "@/components/card/paint";

/**
 * Monochrome — Vibe Score 0–49.
 *
 * The quiet end of the ladder. No colour, no sparkle, no halo: a card that
 * still looks composed and deliberate rather than punished. Nothing here is
 * allowed to read as a bad grade — that is the whole product thesis — so this
 * is restraint, not greyness for its own sake.
 */
export const monochrome: Scene = {
  key: "monochrome",
  name: "Monochrome",

  palette: {
    page: "#F3F2F0",
    card: "#FBFAF9",
    shadow: "rgba(40,40,40,0.10)",
    border: "rgba(190,188,184,0.9)",

    ink: "#2B2B2B",
    inkSoft: "#77746F",
    accent: "#5C5A56",
    divider: "rgba(150,147,142,0.75)",

    score: ["#3A3A3A"],
    avatarRing: ["rgba(160,157,152,0.7)"],

    avatarTint: "#8E8B87",

    pillFill: "#EFEDEA",
    pillBorder: "rgba(0,0,0,0)",
    pillInk: "#5C5A56",

    rule: "rgba(205,202,198,0.95)",
    raterStack: [
      ["#DEDCD8", "#C7C4BF"],
      ["#D6D3CE", "#BFBCB6"],
      ["#E3E1DD", "#CBC8C3"],
    ],

    brand: "rgba(31,31,31,0.42)",
    mark: null,
    markAlpha: 0.45,
    rays: null,
    moodGlyph: "↗",
  },

  backdrop({ ctx, w, h }) {
    ctx.fillStyle = "#F3F2F0";
    ctx.fillRect(0, 0, w, h);
  },

  surface({ ctx, cardX, cardY, cardW, cardH }) {
    ctx.fillStyle = "#FBFAF9";
    ctx.fillRect(cardX, cardY, cardW, cardH);
    // One soft rise at the foot, so the card has a horizon and not just an
    // edge. Two greys, a hair apart.
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#EFEDEA", alpha: 0.85, depth: 0.94, reach: 0.88 },
      { fill: "#E6E3DF", alpha: 0.75, depth: 0.985, reach: 0.93 },
    ]);
  },
};

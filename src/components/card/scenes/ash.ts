import type { Scene } from "@/components/card/scene";
import { crestBottom } from "@/components/card/paint";

/**
 * Ash — Vibe Score 50–60.
 *
 * The first step off monochrome. Still grey, but the grey has turned very
 * slightly warm, the way ash does. Nothing sparkles yet.
 */
export const ash: Scene = {
  key: "ash",
  name: "Ash",

  palette: {
    page: "#F5F3F0",
    card: "#FCFAF7",
    shadow: "rgba(60,52,46,0.11)",
    border: "rgba(196,190,182,0.9)",

    ink: "#2E2A26",
    inkSoft: "#7B756E",
    accent: "#6B6259",
    divider: "rgba(156,148,138,0.75)",

    score: ["#453E37"],
    avatarRing: ["rgba(170,162,152,0.72)"],

    avatarTint: "#8E877E",

    pillFill: "#F0ECE6",
    pillBorder: "rgba(0,0,0,0)",
    pillInk: "#6B6259",

    rule: "rgba(210,204,196,0.95)",
    raterStack: [
      ["#E1DDD6", "#C9C3BA"],
      ["#D9D4CC", "#C1BAB1"],
      ["#E6E2DB", "#CDC7BE"],
    ],

    brand: "rgba(31,31,31,0.42)",
    mark: null,
    markAlpha: 0.5,
    rays: null,
    moodGlyph: "↗",
  },

  backdrop({ ctx, w, h }) {
    ctx.fillStyle = "#F5F3F0";
    ctx.fillRect(0, 0, w, h);
  },

  surface({ ctx, cardX, cardY, cardW, cardH }) {
    ctx.fillStyle = "#FCFAF7";
    ctx.fillRect(cardX, cardY, cardW, cardH);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F1EDE6", alpha: 0.9, depth: 0.9, reach: 0.84 },
      { fill: "#E8E2D9", alpha: 0.8, depth: 0.95, reach: 0.88 },
      { fill: "#DED7CC", alpha: 0.7, depth: 0.99, reach: 0.93 },
    ]);
  },
};

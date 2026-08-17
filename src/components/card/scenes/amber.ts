import type { Scene } from "@/components/card/scene";
import { bloom, crestBottom, crestTop } from "@/components/card/paint";

/**
 * Amber — Vibe Score 76–80.
 *
 * The first properly warm card. The page picks up a glow behind the corner,
 * the crests turn gold, and the trait pills gain an outline — small things
 * that together stop reading as "beige" and start reading as "lit".
 */
export const amber: Scene = {
  key: "amber",
  name: "Amber",

  palette: {
    page: "#FBF6EC",
    card: "#FDFAF3",
    shadow: "rgba(160,110,45,0.15)",
    border: "rgba(230,200,158,0.95)",

    ink: "#2C2118",
    inkSoft: "#7C6E5D",
    accent: "#C88A34",
    divider: "rgba(200,163,101,0.8)",

    score: ["#E0A23C", "#B4711F"],
    avatarRing: ["#E9BE72", "#C98F35"],

    pillFill: "rgba(255,250,238,0.8)",
    pillBorder: "#EBCB96",
    pillInk: "#B57C2C",

    rule: "rgba(232,214,184,0.95)",
    raterStack: [
      ["#F6E2BC", "#E2C489"],
      ["#EFD8AE", "#DBBB79"],
      ["#F9ECD3", "#E7D0A3"],
    ],

    brand: "rgba(31,31,31,0.4)",
    mark: ["#F0C778", "#E0A64F", "#C98B33"],
    markAlpha: 0.9,
    rays: null,
    moodGlyph: "✦",
  },

  backdrop({ ctx, w, h }) {
    ctx.fillStyle = "#FBF6EC";
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.86, h * 0.05, w * 0.68, "rgba(230,170,70,0.13)");
  },

  surface({ ctx, cardX, cardY, cardW, cardH }) {
    ctx.fillStyle = "#FDFAF3";
    ctx.fillRect(cardX, cardY, cardW, cardH);
    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F7DFAE", alpha: 0.68, depth: 0.19, reach: 0.94 },
      { fill: "#F0CB85", alpha: 0.55, depth: 0.13, reach: 0.74 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F8E4B8", alpha: 0.9, depth: 0.87, reach: 0.81 },
      { fill: "#F1CE8B", alpha: 0.82, depth: 0.935, reach: 0.85 },
      { fill: "#E5B45E", alpha: 0.7, depth: 0.985, reach: 0.9 },
    ]);
  },
};

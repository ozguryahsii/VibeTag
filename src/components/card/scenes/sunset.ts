import type { Scene } from "@/components/card/scene";
import { bloom, crestBottom, crestTop, noise, sparkle } from "@/components/card/paint";

/**
 * Sunset — Vibe Score 86–90.
 *
 * The full house palette, and the first band to earn rays behind the score.
 * This is roughly where the card used to start for anyone the old three-tone
 * system called "celebratory" — now it is the seventh rung of twelve.
 */
export const sunset: Scene = {
  key: "sunset",
  name: "Sunset",

  palette: {
    page: "#FBF8F2",
    card: "#FCF8EF",
    shadow: "rgba(240,82,98,0.19)",
    border: "#F4AC78",

    ink: "#2D211C",
    inkSoft: "#746860",
    accent: "#F05262",
    divider: "rgba(240,82,98,0.64)",

    score: ["#F5AD3C", "#F17146", "#E73D76"],
    avatarRing: ["#F5AD3E", "#EF7648", "#EC476D"],

    pillFill: "rgba(255,249,235,0.72)",
    pillBorder: "#F0C298",
    pillInk: "#ED6A49",

    rule: "rgba(228,215,200,0.95)",
    raterStack: [
      ["#FFD3B0", "#FFB98A"],
      ["#FFC1CE", "#FFA5B8"],
      ["#E8DCC9", "#C8B79E"],
    ],

    brand: "rgba(31,31,31,0.4)",
    mark: ["#FF9B3F", "#FF705C", "#F1436D"],
    markAlpha: 1,
    rays: {
      stroke: "rgba(242,160,63,0.5)",
      embers: ["#F05262", "#F2A03F"],
      count: 12,
    },
    moodGlyph: "★",
  },

  backdrop({ ctx, w, h }) {
    ctx.fillStyle = "#FBF8F2";
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.86, h * 0.04, w * 0.7, "rgba(242,160,63,0.13)");
    bloom(ctx, w * 0.12, h * 0.96, w * 0.72, "rgba(240,82,98,0.1)");
  },

  surface({ ctx, cardX, cardY, cardW, cardH }) {
    ctx.fillStyle = "#FCF8EF";
    ctx.fillRect(cardX, cardY, cardW, cardH);
    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F7BD68", alpha: 0.55, depth: 0.22, reach: 0.94 },
      { fill: "#F58458", alpha: 0.78, depth: 0.18, reach: 0.72 },
      { fill: "#EF5962", alpha: 0.9, depth: 0.12, reach: 0.5 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F8C16F", alpha: 0.5, depth: 0.9, reach: 0.84 },
      { fill: "#F58D5D", alpha: 0.68, depth: 0.94, reach: 0.86 },
      { fill: "#EF596A", alpha: 0.86, depth: 0.975, reach: 0.9 },
      { fill: "#E93E75", alpha: 0.62, depth: 0.995, reach: 0.94 },
    ]);

    for (let i = 0; i < 4; i++) {
      sparkle(
        ctx,
        cardX + cardW * (0.07 + noise(i * 5) * 0.2),
        cardY + cardH * (0.025 + noise(i * 11) * 0.05),
        cardW * 0.008,
      );
    }
    sparkle(ctx, cardX + cardW * 0.88, cardY + cardH * 0.94, cardW * 0.008);
  },
};

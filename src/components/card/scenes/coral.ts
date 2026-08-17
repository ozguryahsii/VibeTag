import type { Scene } from "@/components/card/scene";
import { bloom, crestBottom, crestTop, noise, sparkle } from "@/components/card/paint";

/**
 * Coral — Vibe Score 81–85.
 *
 * Amber with the app's coral pushed into the crests, and the first sparkles on
 * the ladder. Three of them, high on the card — enough to catch the eye once,
 * not enough to become the subject.
 */
export const coral: Scene = {
  key: "coral",
  name: "Coral",

  palette: {
    page: "#FCF6EF",
    card: "#FDFAF3",
    shadow: "rgba(220,110,80,0.16)",
    border: "rgba(243,190,155,0.95)",

    ink: "#2D211C",
    inkSoft: "#7B6A60",
    accent: "#E08A54",
    divider: "rgba(230,150,110,0.8)",

    score: ["#F2A83E", "#E5764A", "#DC5B62"],
    avatarRing: ["#F3B45C", "#EC7F55"],

    pillFill: "rgba(255,250,238,0.78)",
    pillBorder: "#F2C39D",
    pillInk: "#DD7A4E",

    rule: "rgba(235,214,196,0.95)",
    raterStack: [
      ["#FFD9C0", "#F6B48C"],
      ["#FFC9C6", "#F2A29E"],
      ["#F7E3CC", "#E4C79F"],
    ],

    brand: "rgba(31,31,31,0.4)",
    mark: ["#F6B968", "#EF8A5C", "#E56A73"],
    markAlpha: 1,
    rays: null,
    moodGlyph: "✦",
  },

  backdrop({ ctx, w, h }) {
    ctx.fillStyle = "#FCF6EF";
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.86, h * 0.05, w * 0.7, "rgba(240,140,80,0.14)");
    bloom(ctx, w * 0.12, h * 0.96, w * 0.7, "rgba(235,110,110,0.09)");
  },

  surface({ ctx, cardX, cardY, cardW, cardH }) {
    ctx.fillStyle = "#FDFAF3";
    ctx.fillRect(cardX, cardY, cardW, cardH);
    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F9D9A9", alpha: 0.7, depth: 0.2, reach: 0.94 },
      { fill: "#F2A87C", alpha: 0.6, depth: 0.14, reach: 0.76 },
      { fill: "#EC8272", alpha: 0.45, depth: 0.09, reach: 0.54 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F9DDAE", alpha: 0.88, depth: 0.87, reach: 0.81 },
      { fill: "#F2AC7E", alpha: 0.8, depth: 0.935, reach: 0.85 },
      { fill: "#EA7E77", alpha: 0.72, depth: 0.985, reach: 0.9 },
    ]);

    for (let i = 0; i < 3; i++) {
      sparkle(
        ctx,
        cardX + cardW * (0.1 + noise(i * 3) * 0.16),
        cardY + cardH * (0.03 + noise(i * 7) * 0.05),
        cardW * 0.008,
        "rgba(255,255,255,0.9)",
      );
    }
  },
};

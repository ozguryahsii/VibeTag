import type { Scene } from "@/components/card/scene";
import {
  bloom,
  crestBottom,
  crestTop,
  noise,
  ribbon,
  sparkle,
} from "@/components/card/paint";

/**
 * Aurora — Vibe Score 96–98.
 *
 * The palette turns cooler at the top of the ladder rather than hotter: violet
 * and teal ribbons drift across the warm base. Going bluer is what stops the
 * last four bands from being four shades of the same orange.
 */
export const aurora: Scene = {
  key: "aurora",
  name: "Aurora",

  palette: {
    page: "#FBF3F6",
    card: "#FFF8F4",
    shadow: "rgba(150,80,200,0.24)",
    border: "#D9A0DC",

    ink: "#26192B",
    inkSoft: "#71627A",
    accent: "#B44BC8",
    divider: "rgba(180,75,200,0.7)",

    score: ["#FFC24A", "#F0607E", "#8B5CF6"],
    avatarRing: ["#FFC85E", "#F0607E", "#8B5CF6"],

    pillFill: "rgba(255,250,252,0.84)",
    pillBorder: "#E2B6E8",
    pillInk: "#A64FBE",

    rule: "rgba(233,209,236,0.95)",
    raterStack: [
      ["#FFD9B8", "#F5B389"],
      ["#E7C8FF", "#C79CF3"],
      ["#BEE9F0", "#8FCBDA"],
    ],

    brand: "rgba(31,31,31,0.4)",
    mark: ["#FFB84A", "#F0607E", "#8B5CF6"],
    markAlpha: 1,
    rays: {
      stroke: "rgba(190,120,240,0.6)",
      embers: ["#8B5CF6", "#FFC24A"],
      count: 20,
    },
    moodGlyph: "★",
  },

  backdrop({ ctx, w, h }) {
    ctx.fillStyle = "#FBF3F6";
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.84, h * 0.06, w * 0.72, "rgba(255,180,74,0.16)");
    bloom(ctx, w * 0.14, h * 0.94, w * 0.78, "rgba(139,92,246,0.16)");
  },

  surface({ ctx, cardX, cardY, cardW, cardH, cx, u }) {
    ctx.fillStyle = "#FFF8F4";
    ctx.fillRect(cardX, cardY, cardW, cardH);

    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#FFCF77", alpha: 0.5, depth: 0.22, reach: 0.96 },
      { fill: "#F0607E", alpha: 0.62, depth: 0.17, reach: 0.74 },
      { fill: "#8B5CF6", alpha: 0.66, depth: 0.12, reach: 0.5 },
    ]);

    // Ribbons across the middle third — the band's signature. Curved, soft
    // edged and few, so they read as light and not as bunting.
    ribbon(ctx, cardX, cardY, cardW, cardH, "#8B5CF6", "#4FC3D9", 0.36, 0.045, 0.3);
    ribbon(ctx, cardX, cardY, cardW, cardH, "#F0607E", "#8B5CF6", 0.47, 0.03, 0.26);
    ribbon(ctx, cardX, cardY, cardW, cardH, "#4FC3D9", "#FFC24A", 0.6, 0.022, 0.22);

    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#FFD68F", alpha: 0.45, depth: 0.885, reach: 0.83 },
      { fill: "#F0607E", alpha: 0.6, depth: 0.932, reach: 0.86 },
      { fill: "#8B5CF6", alpha: 0.72, depth: 0.972, reach: 0.9 },
      { fill: "#4FC3D9", alpha: 0.5, depth: 0.995, reach: 0.94 },
    ]);

    bloom(ctx, cx, cardY + u * 0.26, u * 0.55, "rgba(255,225,180,0.3)");

    for (let i = 0; i < 18; i++) {
      sparkle(
        ctx,
        cardX + cardW * (0.04 + noise(i * 9) * 0.92),
        cardY + cardH * (0.02 + noise(i * 29) * 0.95),
        cardW * (0.005 + noise(i * 31) * 0.006),
      );
    }
  },
};

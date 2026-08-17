import type { Scene } from "@/components/card/scene";
import {
  bloom,
  crestBottom,
  crestTop,
  firework,
  noise,
  sparkle,
} from "@/components/card/paint";

/**
 * Fireworks — Vibe Score 99.
 *
 * A single point on the ladder, and the first band with an overlay: bursts are
 * drawn *over* the card border, not inside it, so they read as happening in
 * front of the card rather than printed on it.
 */
export const fireworks: Scene = {
  key: "fireworks",
  name: "Fireworks",

  palette: {
    page: "#F7F1F8",
    card: "#FFF9F5",
    shadow: "rgba(120,60,200,0.28)",
    border: "#C98BEA",

    ink: "#231733",
    inkSoft: "#6C5E7E",
    accent: "#8B5CF6",
    divider: "rgba(139,92,246,0.72)",

    score: ["#FFD24A", "#F0607E", "#7C4DEF"],
    avatarRing: ["#FFD24A", "#F0607E", "#7C4DEF"],

    pillFill: "rgba(255,251,255,0.86)",
    pillBorder: "#D5B4F2",
    pillInk: "#8B5CF6",

    rule: "rgba(226,206,240,0.95)",
    raterStack: [
      ["#FFE0B0", "#FFC178"],
      ["#E3C6FF", "#BE95F6"],
      ["#B9E7F5", "#83C9E0"],
    ],

    brand: "rgba(31,31,31,0.4)",
    mark: ["#FFD24A", "#F0607E", "#7C4DEF"],
    markAlpha: 1,
    rays: {
      stroke: "rgba(200,140,255,0.66)",
      embers: ["#7C4DEF", "#FFD24A"],
      count: 22,
    },
    moodGlyph: "★",
  },

  backdrop({ ctx, w, h }) {
    ctx.fillStyle = "#F7F1F8";
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.82, h * 0.07, w * 0.75, "rgba(255,200,90,0.18)");
    bloom(ctx, w * 0.16, h * 0.93, w * 0.8, "rgba(124,77,239,0.18)");
  },

  surface({ ctx, cardX, cardY, cardW, cardH, cx, u }) {
    ctx.fillStyle = "#FFF9F5";
    ctx.fillRect(cardX, cardY, cardW, cardH);

    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#FFD888", alpha: 0.5, depth: 0.23, reach: 0.96 },
      { fill: "#F0607E", alpha: 0.64, depth: 0.18, reach: 0.75 },
      { fill: "#7C4DEF", alpha: 0.7, depth: 0.12, reach: 0.5 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#FFDC96", alpha: 0.46, depth: 0.885, reach: 0.83 },
      { fill: "#F0607E", alpha: 0.62, depth: 0.932, reach: 0.86 },
      { fill: "#7C4DEF", alpha: 0.76, depth: 0.972, reach: 0.9 },
    ]);

    bloom(ctx, cx, cardY + u * 0.26, u * 0.6, "rgba(255,230,190,0.32)");

    for (let i = 0; i < 20; i++) {
      sparkle(
        ctx,
        cardX + cardW * (0.04 + noise(i * 11) * 0.92),
        cardY + cardH * (0.02 + noise(i * 37) * 0.95),
        cardW * (0.005 + noise(i * 41) * 0.006),
      );
    }
  },

  overlay({ ctx, cardX, cardY, cardW, cardH }) {
    const palette = ["#FFD24A", "#F0607E", "#7C4DEF", "#4FC3D9"];
    // Kept away from the middle third, where the score and the name live.
    const bursts: [number, number, number][] = [
      [0.16, 0.11, 0.12],
      [0.85, 0.17, 0.09],
      [0.24, 0.86, 0.1],
      [0.8, 0.9, 0.075],
    ];
    for (let i = 0; i < bursts.length; i++) {
      const [fx, fy, fr] = bursts[i];
      firework(
        ctx,
        cardX + cardW * fx,
        cardY + cardH * fy,
        cardW * fr,
        palette,
        i * 13,
        0.85,
      );
    }
  },
};

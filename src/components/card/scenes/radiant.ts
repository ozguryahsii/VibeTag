import type { Scene } from "@/components/card/scene";
import { bloom, crestBottom, crestTop, noise, sparkle } from "@/components/card/paint";

/**
 * Radiant — Vibe Score 93–95.
 *
 * Where the light stops being a background and becomes the subject: a broad
 * sunburst is drawn across the whole card surface before anything else, so
 * every element sits inside it. Rays behind the score go long and many.
 */
export const radiant: Scene = {
  key: "radiant",
  name: "Radiant",

  palette: {
    page: "#FDF5EE",
    card: "#FFF9F0",
    shadow: "rgba(240,120,60,0.26)",
    border: "#F9B063",

    ink: "#2B1D16",
    inkSoft: "#7A6656",
    accent: "#F0632F",
    divider: "rgba(240,99,47,0.7)",

    score: ["#FFC845", "#F76A32", "#E8306F"],
    avatarRing: ["#FFCB55", "#F87A3C", "#EC3F78"],

    pillFill: "rgba(255,250,240,0.82)",
    pillBorder: "#F8C282",
    pillInk: "#EE6A38",

    rule: "rgba(240,216,192,0.95)",
    raterStack: [
      ["#FFDCAE", "#FFBE78"],
      ["#FFC5C0", "#FF9F9C"],
      ["#F4E0C8", "#DCC0A0"],
    ],

    brand: "rgba(31,31,31,0.4)",
    mark: ["#FFB43A", "#FA6D3E", "#EE3477"],
    markAlpha: 1,
    rays: {
      stroke: "rgba(255,178,70,0.62)",
      embers: ["#F0632F", "#FFC845"],
      count: 18,
    },
    moodGlyph: "★",
  },

  backdrop({ ctx, w, h }) {
    ctx.fillStyle = "#FDF5EE";
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.5, h * 0.42, w * 0.95, "rgba(255,180,90,0.2)");
    bloom(ctx, w * 0.1, h * 0.96, w * 0.7, "rgba(236,63,120,0.12)");
  },

  surface({ ctx, cardX, cardY, cardW, cardH, cx, u }) {
    ctx.fillStyle = "#FFF9F0";
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // Sunburst wedges from a point above the avatar. Drawn first so the rest
    // of the card sits inside the light rather than on top of a pattern.
    const originY = cardY + u * 0.24;
    ctx.save();
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const spread = 0.055;
      ctx.globalAlpha = 0.05 + noise(i * 3) * 0.05;
      ctx.fillStyle = i % 2 === 0 ? "#FFB347" : "#F6706B";
      ctx.beginPath();
      ctx.moveTo(cx, originY);
      ctx.lineTo(
        cx + Math.cos(a - spread) * cardH,
        originY + Math.sin(a - spread) * cardH,
      );
      ctx.lineTo(
        cx + Math.cos(a + spread) * cardH,
        originY + Math.sin(a + spread) * cardH,
      );
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#FFCE72", alpha: 0.6, depth: 0.24, reach: 0.96 },
      { fill: "#F98D52", alpha: 0.82, depth: 0.19, reach: 0.75 },
      { fill: "#EE4E72", alpha: 0.9, depth: 0.13, reach: 0.52 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#FFD184", alpha: 0.55, depth: 0.885, reach: 0.83 },
      { fill: "#F9955F", alpha: 0.72, depth: 0.932, reach: 0.86 },
      { fill: "#EF5273", alpha: 0.9, depth: 0.97, reach: 0.9 },
      { fill: "#E52F80", alpha: 0.66, depth: 0.995, reach: 0.94 },
    ]);

    for (let i = 0; i < 14; i++) {
      sparkle(
        ctx,
        cardX + cardW * (0.05 + noise(i * 7) * 0.9),
        cardY + cardH * (0.02 + noise(i * 19) * 0.95),
        cardW * (0.005 + noise(i * 23) * 0.006),
      );
    }
  },
};

import type { Scene } from "@/components/card/scene";
import {
  bloom,
  crestBottom,
  crestTop,
  noise,
  sparkle,
} from "@/components/card/paint";

/**
 * Coral — Vibe Score 81–85.
 *
 * Apricot turns into coral and the first glints appear around the perimeter.
 * It is cheerful, but still deliberately below the ray-and-firework tiers.
 */
export const coral: Scene = {
  key: "coral",
  name: "Coral",

  palette: {
    page: "#FCF6EE",
    card: "#FEFAF2",
    shadow: "rgba(220,105,67,0.19)",
    border: "rgba(243,176,131,0.96)",

    ink: "#2E211B",
    inkSoft: "#7C695D",
    accent: "#DE7049",
    divider: "rgba(228,122,79,0.68)",

    score: ["#F3AE42", "#ED7849", "#DF5963"],
    avatarRing: ["#F4B95B", "#EF8352", "#E7616B"],

    pillFill: "rgba(255,249,237,0.9)",
    pillBorder: "rgba(241,187,148,0.9)",
    pillInk: "#DA714B",

    rule: "rgba(235,211,191,0.94)",
    raterStack: [
      ["#FFD9BC", "#F5AE82"],
      ["#FFCBC3", "#EE9A91"],
      ["#F5E1C9", "#DEBE96"],
    ],

    brand: "rgba(46,33,27,0.4)",
    mark: ["#F5B65A", "#EF8051", "#E65A6B"],
    markAlpha: 1,
    rays: null,
    moodGlyph: "✦",
  },

  backdrop({ ctx, w, h }) {
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, "#FEFAF4");
    wash.addColorStop(1, "#FAEEE6");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.86, h * 0.06, w * 0.68, "rgba(242,160,63,0.14)");
    bloom(ctx, w * 0.1, h * 0.94, w * 0.66, "rgba(240,82,98,0.1)");
  },

  surface({ ctx, cardX, cardY, cardW, cardH }) {
    const paper = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    paper.addColorStop(0, "#FFFDF7");
    paper.addColorStop(0.6, "#FCF8EF");
    paper.addColorStop(1, "#FBECDD");
    ctx.fillStyle = paper;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F9DCA7", alpha: 0.7, depth: 0.22, reach: 0.95 },
      { fill: "#F3AA72", alpha: 0.66, depth: 0.16, reach: 0.74 },
      { fill: "#EB756B", alpha: 0.48, depth: 0.1, reach: 0.5 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F9DFAD", alpha: 0.92, depth: 0.875, reach: 0.81 },
      { fill: "#F2AC76", alpha: 0.84, depth: 0.932, reach: 0.86 },
      { fill: "#E97571", alpha: 0.75, depth: 0.98, reach: 0.92 },
      { fill: "#DF586E", alpha: 0.42, depth: 0.997, reach: 0.95 },
    ]);

    const glints: [number, number, number][] = [
      [0.09, 0.07, 0.008],
      [0.19, 0.115, 0.005],
      [0.88, 0.17, 0.006],
      [0.12, 0.83, 0.005],
      [0.87, 0.91, 0.008],
    ];
    for (const [x, y, r] of glints) {
      sparkle(ctx, cardX + cardW * x, cardY + cardH * y, cardW * r);
    }
    for (let i = 0; i < 7; i++) {
      ctx.save();
      ctx.globalAlpha = 0.22 + noise(i + 20) * 0.22;
      ctx.fillStyle = i % 2 === 0 ? "#F2A03F" : "#F05262";
      ctx.beginPath();
      ctx.arc(
        cardX + cardW * (0.06 + noise(i * 7) * 0.88),
        cardY + cardH * (0.04 + noise(i * 13) * 0.92),
        cardW * 0.0025,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
    }
  },
};

import type { Scene } from "@/components/card/scene";
import { bloom } from "@/components/card/paint";
import {
  diamondDust,
  fineGlint,
  flowField,
  paperGrain,
} from "@/components/card/fine-art";

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
    page: "#FCF5EC",
    card: "#FFE8D7",
    shadow: "rgba(220,105,67,0.19)",
    border: "rgba(238,158,117,0.78)",

    ink: "#2E211B",
    inkSoft: "#7C695D",
    accent: "#DE7049",
    divider: "rgba(228,122,79,0.68)",

    score: ["#F0A447", "#EE784D", "#E45B5D"],
    avatarRing: ["#F4B95B", "#EF8352", "#E7616B"],

    pillFill: "rgba(255,252,246,0.4)",
    pillBorder: "rgba(232,139,102,0.62)",
    pillInk: "#DA714B",

    rule: "rgba(235,211,191,0.94)",
    raterStack: [
      ["#FFD9BC", "#F5AE82"],
      ["#FFCBC3", "#EE9A91"],
      ["#F5E1C9", "#DEBE96"],
    ],

    brand: "rgba(46,33,27,0.49)",
    mark: ["#E9A04D", "#E06B4D", "#CB4F5E"],
    markAlpha: 0.94,
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

  surface(geom) {
    const { ctx, cardX, cardY, cardW, cardH, cx, scoreCenterY, u } = geom;
    const paper = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    paper.addColorStop(0, "#FFF7ED");
    paper.addColorStop(0.5, "#FFE8D8");
    paper.addColorStop(1, "#FFD9C8");
    ctx.fillStyle = paper;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    bloom(ctx, cx, scoreCenterY, u * 0.54, "rgba(245,139,86,0.09)");
    bloom(
      ctx,
      cardX + cardW * 0.88,
      cardY + cardH * 0.12,
      cardW * 0.48,
      "rgba(247,173,90,0.07)",
    );

    flowField(geom, {
      count: 32,
      colors: ["#F8D5B9", "#F2AD86", "#EB806E", "#FFF1E3"],
      y: [0.27, 0.43, 0.3, 0.5],
      spread: 0.158,
      alpha: 0.28,
      lineWidth: 0.0011,
      seed: 69,
    });
    flowField(geom, {
      count: 14,
      colors: ["#F7CDAA", "#EB7F69", "#FFF0E0"],
      y: [0.65, 0.49, 0.7, 0.55],
      spread: 0.09,
      alpha: 0.17,
      lineWidth: 0.00098,
      seed: 163,
      reverse: true,
    });
    paperGrain(geom, "#B56E56", 205, 0.022, 91);

    const glints: [number, number, number, string, number][] = [
      [0.1, 0.08, 0.008, "#FFFFFF", 0.68],
      [0.22, 0.13, 0.0045, "#F0A354", 0.48],
      [0.88, 0.17, 0.006, "#FFFFFF", 0.64],
      [0.09, 0.37, 0.004, "#E86D5C", 0.4],
      [0.91, 0.51, 0.005, "#F0A354", 0.48],
      [0.13, 0.76, 0.0055, "#FFFFFF", 0.56],
      [0.86, 0.87, 0.0075, "#FFFFFF", 0.66],
      [0.27, 0.91, 0.004, "#E66E59", 0.4],
    ];
    for (const [x, y, r, color, alpha] of glints) {
      fineGlint(ctx, cardX + cardW * x, cardY + cardH * y, cardW * r, color, alpha);
    }
    diamondDust(geom, 4, ["#E9A33F", "#E87458"], 188, 0.52);
  },
};

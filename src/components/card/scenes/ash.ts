import type { Scene } from "@/components/card/scene";
import { bloom, crestBottom, crestTop } from "@/components/card/paint";

/**
 * Ash — Vibe Score 50–60.
 *
 * The first trace of warmth: smoke-grey paper, a quiet mushroom-beige wash
 * and no celebratory decoration yet.
 */
export const ash: Scene = {
  key: "ash",
  name: "Ash",

  palette: {
    page: "#F3F1ED",
    card: "#FBF9F6",
    shadow: "rgba(55,48,42,0.12)",
    border: "rgba(193,186,178,0.86)",

    ink: "#2D2A27",
    inkSoft: "#7A756F",
    accent: "#6E655D",
    divider: "rgba(151,142,133,0.62)",

    score: ["#45413D"],
    avatarRing: ["#B8AFA6"],
    avatarTint: "#8B837B",

    pillFill: "rgba(238,234,228,0.94)",
    pillBorder: "rgba(0,0,0,0)",
    pillInk: "#6B625A",

    rule: "rgba(208,202,194,0.92)",
    raterStack: [
      ["#E3DED7", "#C4BDB4"],
      ["#DAD4CD", "#B9B1A8"],
      ["#E9E5DF", "#CEC7BE"],
    ],

    brand: "rgba(41,37,34,0.4)",
    mark: null,
    markAlpha: 0.46,
    rays: null,
    moodGlyph: "↗",
  },

  backdrop({ ctx, w, h }) {
    const wash = ctx.createLinearGradient(0, 0, w, h);
    wash.addColorStop(0, "#F8F6F2");
    wash.addColorStop(1, "#EEEAE5");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.82, h * 0.08, w * 0.55, "rgba(159,139,119,0.07)");
  },

  surface({ ctx, cardX, cardY, cardW, cardH }) {
    const paper = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    paper.addColorStop(0, "#FCFBF9");
    paper.addColorStop(1, "#F7F3EE");
    ctx.fillStyle = paper;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#EEEAE4", alpha: 0.52, depth: 0.15, reach: 0.88 },
      { fill: "#DED7CF", alpha: 0.26, depth: 0.095, reach: 0.59 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F0ECE6", alpha: 0.92, depth: 0.9, reach: 0.84 },
      { fill: "#E4DED6", alpha: 0.78, depth: 0.95, reach: 0.88 },
      { fill: "#D8D0C6", alpha: 0.58, depth: 0.988, reach: 0.94 },
    ]);

    // Preserve only a whisper of colour in every shared foreground element.
    ctx.filter = "grayscale(0.86) sepia(0.06)";
  },
};

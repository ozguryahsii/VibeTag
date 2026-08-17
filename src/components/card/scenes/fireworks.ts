import type { Scene } from "@/components/card/scene";
import {
  cornerWash,
  diamondDust,
  fineBurst,
  fineGlint,
  fineHalo,
  flowField,
  paperGrain,
  radialHairlines,
} from "@/components/card/fine-art";
import { bloom } from "@/components/card/paint";

/**
 * Fireworks — Vibe Score 99.
 *
 * The energetic peak: an asymmetric S-shaped river, an intentionally open
 * double orbit and six fine fireworks. It feels in motion rather than complete.
 */
export const fireworks: Scene = {
  key: "fireworks",
  name: "Fireworks",

  palette: {
    page: "#FBF2EB",
    card: "#FFF8F1",
    shadow: "rgba(184,78,67,0.27)",
    border: "rgba(228,137,105,0.84)",

    ink: "#301D19",
    inkSoft: "#74564F",
    accent: "#DF4F5B",
    divider: "rgba(224,78,91,0.62)",

    score: ["#DB9B32", "#E96C47", "#E33F61", "#D72E76"],
    avatarRing: ["#E1A539", "#EA654B", "#D82F74"],

    pillFill: "rgba(255,249,241,0.9)",
    pillBorder: "rgba(231,145,118,0.7)",
    pillInk: "#C8464E",

    rule: "rgba(229,184,159,0.86)",
    raterStack: [
      ["#F8D8A5", "#E2A154"],
      ["#F7C2B8", "#DD7F70"],
      ["#F1BFD0", "#CD708F"],
    ],

    brand: "rgba(48,29,25,0.5)",
    mark: ["#DFA136", "#E9624A", "#D82F74"],
    markAlpha: 1,
    // The custom 32-line field and open halo below replace the short shared rays.
    rays: { stroke: "rgba(218,96,71,0)", embers: ["#DCA036", "#D73370"], count: 0 },
    moodGlyph: "★",
  },

  backdrop({ ctx, w, h }) {
    const paper = ctx.createLinearGradient(0, 0, w, h);
    paper.addColorStop(0, "#FDF7F0");
    paper.addColorStop(0.5, "#FAEEE6");
    paper.addColorStop(1, "#FFF5ED");
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.82, h * 0.08, w * 0.74, "rgba(228,142,52,0.15)");
    bloom(ctx, w * 0.14, h * 0.91, w * 0.84, "rgba(205,43,107,0.13)");
  },

  surface(g) {
    const { ctx, cardX, cardY, cardW, cardH, avatarCenterY, scoreCenterY } = g;
    const ivory = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    ivory.addColorStop(0, "#FFF7EE");
    ivory.addColorStop(0.48, "#FFFBF6");
    ivory.addColorStop(1, "#FFF0EA");
    ctx.fillStyle = ivory;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    cornerWash(g, {
      edge: "topLeft",
      colors: ["#FFDEAA", "#F2955E", "#E44770"],
      reach: 0.9,
      depth: 0.27,
      alpha: 0.3,
    });
    cornerWash(g, {
      edge: "bottomRight",
      colors: ["#FFD59E", "#ED7857", "#D72D78"],
      reach: 0.93,
      depth: 0.29,
      alpha: 0.34,
    });

    // The approved 99 card is defined by one restless S-current, not a stack
    // of broad painted ribbons. Parallel hairlines preserve light and detail.
    flowField(g, {
      count: 48,
      colors: ["#E8BB58", "#EB8657", "#E44F68", "#D72D78"],
      y: [-0.055, 0.57, 0.36, 1.055],
      spread: 0.18,
      alpha: 0.29,
      lineWidth: 0.00105,
      seed: 503,
    });
    flowField(g, {
      count: 22,
      colors: ["#F0CC79", "#E98B5B", "#D93A73"],
      y: [0.02, 0.62, 0.4, 0.98],
      spread: 0.072,
      alpha: 0.12,
      lineWidth: 0.00085,
      seed: 509,
      reverse: true,
    });

    bloom(ctx, cardX + cardW * 0.5, avatarCenterY, cardW * 0.31, "rgba(229,149,58,0.09)");
    bloom(ctx, cardX + cardW * 0.5, scoreCenterY, cardW * 0.58, "rgba(226,91,66,0.1)");
    radialHairlines(
      ctx,
      cardX + cardW * 0.5,
      scoreCenterY,
      cardW * 0.48,
      cardW * 0.35,
      32,
      ["#DCA036", "#E86649", "#D73370"],
      0.2,
      521,
    );
    fineHalo(ctx, cardX + cardW * 0.5, scoreCenterY, cardW * 0.42, cardW * 0.3, {
      colors: ["#DDA037", "#E86549", "#D72F74"],
      open: Math.PI * 0.36,
      rotation: -0.5,
      alpha: 0.52,
      lines: 2,
    });

    const bursts: [number, number, number, number][] = [
      [0.075, 0.085, 0.095, 0.64],
      [0.86, 0.15, 0.074, 0.54],
      [0.035, 0.37, 0.057, 0.4],
      [0.94, 0.54, 0.082, 0.57],
      [0.155, 0.86, 0.078, 0.54],
      [0.78, 0.94, 0.06, 0.43],
    ];
    bursts.forEach(([x, y, r, alpha], index) =>
      fineBurst(ctx, cardX + cardW * x, cardY + cardH * y, cardW * r, {
        colors: ["#DFA33B", "#E96B4B", "#D83172", "#ED9A61"],
        spokes: 28 + (index % 3) * 3,
        alpha,
        seed: 523 + index * 31,
      }),
    );

    diamondDust(g, 32, ["#DFA238", "#E45B50", "#D52F75"], 547, 0.62);
    const glints: [number, number, number][] = [
      [0.16, 0.24, 0.009],
      [0.9, 0.31, 0.012],
      [0.1, 0.6, 0.007],
      [0.88, 0.76, 0.009],
      [0.31, 0.96, 0.006],
    ];
    glints.forEach(([x, y, r], index) =>
      fineGlint(
        ctx,
        cardX + cardW * x,
        cardY + cardH * y,
        cardW * r,
        index % 2 === 0 ? "#DFA238" : "#D72F74",
        0.54,
      ),
    );
    paperGrain(g, "#7D584F", 260, 0.03, 557);
  },
};

import type { Scene } from "@/components/card/scene";
import {
  diamondDust,
  fineBurst,
  fineGlint,
  fineHalo,
  flowField,
  paperGrain,
} from "@/components/card/fine-art";
import { bloom as glow } from "@/components/card/paint";

/**
 * Bloom — Vibe Score 91–92.
 *
 * Rose begins to lead. A precise double halo opens around the portrait and
 * three small edge bursts add celebration without filling the quiet paper.
 */
export const bloom: Scene = {
  key: "bloom",
  name: "Bloom",

  palette: {
    page: "#FCF5F1",
    card: "#F9B2A6",
    shadow: "rgba(192,92,78,0.2)",
    border: "rgba(225,114,116,0.8)",

    ink: "#34211E",
    inkSoft: "#79635D",
    accent: "#D95768",
    divider: "rgba(215,87,104,0.52)",

    score: ["#E2A343", "#E98050", "#DD5963", "#D44779"],
    avatarRing: ["#E7B44E", "#E87752", "#D64C76"],

    pillFill: "rgba(255,250,244,0.84)",
    pillBorder: "rgba(229,157,145,0.62)",
    pillInk: "#C95361",

    rule: "rgba(225,194,187,0.8)",
    raterStack: [
      ["#F6D7BB", "#E7A081"],
      ["#F3C7CE", "#DE8CA0"],
      ["#EEDBD5", "#CDAEA7"],
    ],

    brand: "rgba(52,33,30,0.46)",
    mark: ["#E5AE48", "#E46E59", "#D44878"],
    markAlpha: 0.94,
    rays: {
      stroke: "rgba(218,100,85,0.38)",
      embers: ["#D74E72", "#E1AA43"],
      count: 14,
    },
    moodGlyph: "✦",
  },

  backdrop({ ctx, w, h }) {
    const paper = ctx.createLinearGradient(0, 0, w, h);
    paper.addColorStop(0, "#FDF8F4");
    paper.addColorStop(0.52, "#FBF3EF");
    paper.addColorStop(1, "#FFF7F2");
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);
    glow(ctx, w * 0.82, h * 0.1, w * 0.64, "rgba(226,158,78,0.11)");
    glow(ctx, w * 0.14, h * 0.9, w * 0.7, "rgba(211,68,112,0.085)");
  },

  surface(g) {
    const { ctx, cardX, cardY, cardW, cardH, avatarCenterY, scoreCenterY } = g;
    const wash = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    wash.addColorStop(0, "#FFD9C3");
    wash.addColorStop(0.5, "#FFB9AD");
    wash.addColorStop(1, "#F38E8D");
    ctx.fillStyle = wash;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    flowField(g, {
      count: 28,
      colors: ["#FFF0D8", "#F7B47F", "#E96E70", "#FFF7EC"],
      y: [0.25, 0.4, 0.27, 0.48],
      spread: 0.12,
      alpha: 0.31,
      lineWidth: 0.00105,
      seed: 211,
    });
    flowField(g, {
      count: 22,
      colors: ["#FFE9D0", "#F3A174", "#DE5879", "#FFF4E7"],
      y: [0.92, 0.77, 0.96, 0.8],
      spread: 0.09,
      alpha: 0.25,
      lineWidth: 0.00095,
      seed: 219,
      reverse: true,
    });
    flowField(g, {
      count: 18,
      colors: ["#FFF3E6", "#F2A080", "#DB5579"],
      y: [0.4, 0.6, 0.44, 0.66],
      spread: 0.085,
      alpha: 0.22,
      lineWidth: 0.00105,
      seed: 221,
    });

    glow(ctx, cardX + cardW * 0.5, avatarCenterY, cardW * 0.4, "rgba(228,156,77,0.1)");
    fineHalo(ctx, cardX + cardW * 0.5, avatarCenterY, cardW * 0.322, cardW * 0.322, {
      colors: ["#DBA743", "#E16D56", "#D44B76"],
      alpha: 0.33,
      lines: 2,
    });
    glow(ctx, cardX + cardW * 0.5, scoreCenterY, cardW * 0.43, "rgba(217,91,90,0.05)");

    const bursts: [number, number, number, number][] = [
      [0.105, 0.115, 0.072, 0.39],
      [0.895, 0.285, 0.054, 0.32],
      [0.12, 0.755, 0.047, 0.28],
    ];
    bursts.forEach(([x, y, r, alpha], index) =>
      fineBurst(ctx, cardX + cardW * x, cardY + cardH * y, cardW * r, {
        colors: ["#DFA945", "#E57957", "#D64F73"],
        spokes: 24 + index * 2,
        alpha,
        seed: 223 + index * 19,
      }),
    );

    diamondDust(g, 11, ["#DDA847", "#E0745A", "#D44D77"], 227, 0.43);
    fineGlint(
      ctx,
      cardX + cardW * 0.9,
      cardY + cardH * 0.66,
      cardW * 0.009,
      "#D95174",
      0.38,
    );
    fineGlint(
      ctx,
      cardX + cardW * 0.12,
      cardY + cardH * 0.41,
      cardW * 0.006,
      "#DFA645",
      0.42,
    );
    paperGrain(g, "#80635D", 220, 0.026, 229);
  },
};

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
 * Aurora — Vibe Score 96–98.
 *
 * Warm champagne, coral and rose contour rivers frame the card. The palette
 * stays deliberately warm; no purple, teal or neon enters this progression.
 */
export const aurora: Scene = {
  key: "aurora",
  name: "Aurora",

  palette: {
    page: "#FCF3EC",
    card: "#FFF9F2",
    shadow: "rgba(189,91,69,0.24)",
    border: "rgba(231,149,112,0.8)",

    ink: "#32201B",
    inkSoft: "#765C54",
    accent: "#DF5859",
    divider: "rgba(224,87,89,0.58)",

    score: ["#DEA03A", "#EB754B", "#E34E62", "#D83C75"],
    avatarRing: ["#E4AD41", "#EB6E50", "#D93F74"],

    pillFill: "rgba(255,250,243,0.88)",
    pillBorder: "rgba(231,153,124,0.66)",
    pillInk: "#CA514F",

    rule: "rgba(229,192,169,0.84)",
    raterStack: [
      ["#F8D9AB", "#E5A35F"],
      ["#F6C5BB", "#DE8878"],
      ["#F1C6D1", "#D27C96"],
    ],

    brand: "rgba(50,32,27,0.49)",
    mark: ["#E2A73D", "#E96B50", "#D83E74"],
    markAlpha: 1,
    // The custom 26-line sunburst below owns the visible ray geometry.
    rays: { stroke: "rgba(220,112,72,0)", embers: ["#DFA43B", "#D94370"], count: 0 },
    moodGlyph: "★",
  },

  backdrop({ ctx, w, h }) {
    const paper = ctx.createLinearGradient(0, 0, w, h);
    paper.addColorStop(0, "#FDF7F0");
    paper.addColorStop(0.52, "#FAF0E8");
    paper.addColorStop(1, "#FFF6EF");
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.82, h * 0.08, w * 0.68, "rgba(229,152,65,0.13)");
    bloom(ctx, w * 0.14, h * 0.91, w * 0.76, "rgba(211,55,108,0.105)");
  },

  surface(g) {
    const {
      ctx,
      cardX,
      cardY,
      cardW,
      cardH,
      avatarCenterY,
      scoreCenterY,
    } = g;
    const ivory = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    ivory.addColorStop(0, "#FFF8EF");
    ivory.addColorStop(0.46, "#FFFCF8");
    ivory.addColorStop(1, "#FFF2EC");
    ctx.fillStyle = ivory;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    cornerWash(g, {
      edge: "topLeft",
      colors: ["#FFE2B7", "#F3A064", "#E85D72"],
      reach: 0.84,
      depth: 0.25,
      alpha: 0.27,
    });
    cornerWash(g, {
      edge: "bottomRight",
      colors: ["#FFD6A4", "#EF805E", "#D93D78"],
      reach: 0.9,
      depth: 0.26,
      alpha: 0.3,
    });

    flowField(g, {
      count: 38,
      colors: ["#E9C16D", "#EC9466", "#E45F6B", "#D94479"],
      y: [-0.025, 0.18, 0.045, 0.235],
      spread: 0.115,
      alpha: 0.24,
      lineWidth: 0.001,
      seed: 401,
    });
    flowField(g, {
      count: 40,
      colors: ["#E9C471", "#EC8A61", "#E2566D", "#D53F79"],
      y: [1.025, 0.82, 0.955, 0.72],
      spread: 0.12,
      alpha: 0.25,
      lineWidth: 0.00105,
      seed: 409,
      reverse: true,
    });
    flowField(g, {
      count: 14,
      colors: ["#E7BB69", "#E8785D", "#D64377"],
      y: [0.43, 0.34, 0.67, 0.58],
      spread: 0.035,
      alpha: 0.085,
      lineWidth: 0.00085,
      seed: 419,
    });

    bloom(ctx, cardX + cardW * 0.5, avatarCenterY, cardW * 0.3, "rgba(229,157,75,0.08)");
    fineHalo(ctx, cardX + cardW * 0.5, avatarCenterY, cardW * 0.2, cardW * 0.2, {
      colors: ["#E0A63C", "#E66C52", "#D83E73"],
      alpha: 0.32,
      lines: 2,
    });
    bloom(ctx, cardX + cardW * 0.5, scoreCenterY, cardW * 0.53, "rgba(228,119,66,0.075)");
    radialHairlines(
      ctx,
      cardX + cardW * 0.5,
      scoreCenterY,
      cardW * 0.45,
      cardW * 0.33,
      26,
      ["#DFA43B", "#E8704D", "#D94370"],
      0.2,
      421,
    );

    const bursts: [number, number, number, number][] = [
      [0.09, 0.095, 0.085, 0.54],
      [0.885, 0.19, 0.064, 0.43],
      [0.07, 0.46, 0.05, 0.34],
      [0.91, 0.66, 0.055, 0.38],
      [0.17, 0.9, 0.06, 0.4],
    ];
    bursts.forEach(([x, y, r, alpha], index) =>
      fineBurst(ctx, cardX + cardW * x, cardY + cardH * y, cardW * r, {
        colors: ["#E1AA42", "#E77350", "#D94370", "#EB9A67"],
        spokes: 27 + (index % 2) * 4,
        alpha,
        seed: 431 + index * 29,
      }),
    );

    diamondDust(g, 22, ["#E0A63E", "#E26A54", "#D83E73"], 449, 0.54);
    const glints: [number, number, number][] = [
      [0.12, 0.31, 0.008],
      [0.9, 0.37, 0.011],
      [0.1, 0.69, 0.006],
      [0.88, 0.83, 0.008],
    ];
    glints.forEach(([x, y, r], index) =>
      fineGlint(
        ctx,
        cardX + cardW * x,
        cardY + cardH * y,
        cardW * r,
        index % 2 === 0 ? "#E0A43D" : "#D94172",
        0.46,
      ),
    );
    paperGrain(g, "#805D56", 245, 0.028, 457);
  },
};

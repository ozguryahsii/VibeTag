import type { Scene } from "@/components/card/scene";
import { bloom, crestBottom, crestTop, noise, sparkle } from "@/components/card/paint";

/**
 * Sunset — Vibe Score 86–90.
 *
 * The first openly celebratory card: champagne, apricot and coral arrive as a
 * complete palette, while the score earns its first restrained rays. The
 * decoration stays at the edges and the portrait deliberately has no halo;
 * Bloom owns that next step on the ladder.
 */
export const sunset: Scene = {
  key: "sunset",
  name: "Sunset",

  palette: {
    page: "#FBF7F0",
    card: "#FFF9EF",
    shadow: "rgba(218,106,54,0.2)",
    border: "#F1B478",

    ink: "#38261F",
    inkSoft: "#79675D",
    accent: "#E96949",
    divider: "rgba(225,112,71,0.58)",

    score: ["#EFB447", "#F18A48", "#EA5B57", "#DD506C"],
    avatarRing: ["#EFC15F", "#EF8D4D", "#E85B61"],

    pillFill: "rgba(255,250,239,0.84)",
    pillBorder: "#EDC69D",
    pillInk: "#D96545",

    rule: "rgba(225,205,182,0.9)",
    raterStack: [
      ["#F8D7AD", "#EFA96E"],
      ["#F8C8BD", "#EC9180"],
      ["#F3E1C9", "#D6B58D"],
    ],

    brand: "rgba(56,38,31,0.48)",
    mark: ["#EFB94D", "#EF7D4D", "#DF5269"],
    markAlpha: 0.96,
    rays: {
      stroke: "rgba(224,136,54,0.42)",
      embers: ["#E85E57", "#EFB74D"],
      count: 12,
    },
    moodGlyph: "★",
  },

  backdrop({ ctx, w, h }) {
    ctx.fillStyle = "#FBF7F0";
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.86, h * 0.05, w * 0.7, "rgba(237,175,82,0.14)");
    bloom(ctx, w * 0.12, h * 0.95, w * 0.72, "rgba(229,101,75,0.1)");
  },

  surface({ ctx, cardX, cardY, cardW, cardH, u }) {
    const wash = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    wash.addColorStop(0, "#FFF9EE");
    wash.addColorStop(0.56, "#FFFCF6");
    wash.addColorStop(1, "#FFF6EA");
    ctx.fillStyle = wash;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F6D49A", alpha: 0.45, depth: 0.205, reach: 0.96 },
      { fill: "#F3AE65", alpha: 0.5, depth: 0.155, reach: 0.72 },
      { fill: "#EA735C", alpha: 0.54, depth: 0.095, reach: 0.46 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F5D7A6", alpha: 0.45, depth: 0.9, reach: 0.84 },
      { fill: "#F1A25F", alpha: 0.52, depth: 0.94, reach: 0.865 },
      { fill: "#EA6B5B", alpha: 0.57, depth: 0.974, reach: 0.9 },
      { fill: "#DD526C", alpha: 0.42, depth: 0.996, reach: 0.94 },
    ]);

    // The first celebratory sparks stay in the margins, leaving the avatar
    // and copy quiet. Their seeded placement is identical on every export.
    const edgeColors = ["#EFB84C", "#EA7657", "#DE596A"];
    for (let i = 0; i < 8; i++) {
      const onLeft = i % 2 === 0;
      const px =
        cardX +
        cardW *
          (onLeft ? 0.07 + noise(i + 8) * 0.05 : 0.88 + noise(i + 8) * 0.05);
      const py = cardY + cardH * (0.12 + noise(i * 17 + 4) * 0.72);
      sparkle(
        ctx,
        px,
        py,
        u * (0.0045 + noise(i * 23) * 0.0035),
        edgeColors[i % edgeColors.length],
      );
    }
  },
};

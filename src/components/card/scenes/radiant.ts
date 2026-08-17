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
 * Radiant — Vibe Score 93–95.
 *
 * A broad, airy sunburst now belongs to the whole card. Fine star rain and
 * three small warm bursts raise the energy without turning the light ivory
 * surface into party graphics; the content remains the visual centre.
 */
export const radiant: Scene = {
  key: "radiant",
  name: "Radiant",

  palette: {
    page: "#FDF5EC",
    card: "#FFFAF1",
    shadow: "rgba(218,93,48,0.26)",
    border: "#F1A862",

    ink: "#342018",
    inkSoft: "#796155",
    accent: "#E75B3E",
    divider: "rgba(226,87,60,0.68)",

    score: ["#EFC044", "#F08B3E", "#E85650", "#DB3E70"],
    avatarRing: ["#F2C75B", "#EF8244", "#DF456B"],

    pillFill: "rgba(255,251,242,0.9)",
    pillBorder: "#F0B987",
    pillInk: "#DA5A3D",

    rule: "rgba(233,204,178,0.94)",
    raterStack: [
      ["#F9DBA9", "#EFA865"],
      ["#F9C8BB", "#EC8D7C"],
      ["#F4DFC9", "#D9B391"],
    ],

    brand: "rgba(52,32,24,0.52)",
    mark: ["#F0BC43", "#EF7546", "#DD3F70"],
    markAlpha: 1,
    rays: {
      stroke: "rgba(232,132,49,0.58)",
      embers: ["#DF4867", "#EFBF45"],
      count: 18,
    },
    moodGlyph: "✦",
  },

  backdrop({ ctx, w, h }) {
    ctx.fillStyle = "#FDF5EC";
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.5, h * 0.39, w * 0.9, "rgba(239,177,76,0.18)");
    bloom(ctx, w * 0.1, h * 0.96, w * 0.72, "rgba(222,68,104,0.12)");
  },

  surface({ ctx, cardX, cardY, cardW, cardH, cx, u }) {
    ctx.fillStyle = "#FFFAF1";
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // Wide translucent wedges radiate through the complete card. Their low
    // opacity keeps every text area crisp while making light the main motif.
    const originY = cardY + cardH * 0.43;
    const radius = Math.hypot(cardW, cardH) * 1.05;
    ctx.save();
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2 - Math.PI / 2;
      const spread = 0.035 + noise(i * 13) * 0.025;
      ctx.globalAlpha = 0.025 + noise(i * 17) * 0.035;
      ctx.fillStyle =
        i % 3 === 0 ? "#DD4B6B" : i % 2 === 0 ? "#EFA33F" : "#F4C873";
      ctx.beginPath();
      ctx.moveTo(cx, originY);
      ctx.lineTo(
        cx + Math.cos(a - spread) * radius,
        originY + Math.sin(a - spread) * radius,
      );
      ctx.lineTo(
        cx + Math.cos(a + spread) * radius,
        originY + Math.sin(a + spread) * radius,
      );
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    bloom(ctx, cx, originY, u * 0.72, "rgba(242,181,71,0.12)");

    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F5D28D", alpha: 0.5, depth: 0.225, reach: 0.97 },
      { fill: "#EF9B5D", alpha: 0.58, depth: 0.17, reach: 0.75 },
      { fill: "#DF536D", alpha: 0.67, depth: 0.105, reach: 0.49 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F6D69B", alpha: 0.5, depth: 0.89, reach: 0.83 },
      { fill: "#EF985C", alpha: 0.6, depth: 0.934, reach: 0.86 },
      { fill: "#E45A67", alpha: 0.7, depth: 0.972, reach: 0.9 },
      { fill: "#D93D70", alpha: 0.56, depth: 0.996, reach: 0.945 },
    ]);

    // Fine star rain lives in the outer fifths, never over the score or copy.
    const starColors = ["#EEB440", "#EA7952", "#DC496C", "#F3C96F"];
    for (let i = 0; i < 20; i++) {
      const onLeft = i % 2 === 0;
      const px =
        cardX +
        cardW *
          (onLeft ? 0.05 + noise(i * 5) * 0.12 : 0.83 + noise(i * 5) * 0.12);
      const py = cardY + cardH * (0.08 + noise(i * 37 + 11) * 0.82);
      sparkle(
        ctx,
        px,
        py,
        u * (0.0035 + noise(i * 41) * 0.0045),
        starColors[i % starColors.length],
      );
    }
  },

  overlay({ ctx, cardX, cardY, cardW, cardH }) {
    const colors = ["#EFB942", "#EF8750", "#E45361", "#D94370"];
    const bursts: [number, number, number][] = [
      [0.11, 0.14, 0.06],
      [0.91, 0.38, 0.052],
      [0.12, 0.82, 0.048],
    ];
    bursts.forEach(([fx, fy, fr], i) => {
      firework(
        ctx,
        cardX + cardW * fx,
        cardY + cardH * fy,
        cardW * fr,
        colors,
        41 + i * 17,
        0.64,
      );
    });
  },
};

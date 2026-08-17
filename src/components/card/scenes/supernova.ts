import type { Scene } from "@/components/card/scene";
import {
  bloom,
  confetti,
  crestBottom,
  crestTop,
  firework,
  noise,
  ribbon,
  sparkle,
} from "@/components/card/paint";

/**
 * Supernova — Vibe Score 100.
 *
 * The top of the ladder and the only card that gets everything at once: a dark
 * surface so the light has something to burn against, ribbons, a full
 * starburst, bursts over the border and confetti across the whole page.
 *
 * It is the one band that inverts — every other card is warm paper with light
 * on it; this one is light with paper nowhere. A perfect score should not look
 * like a slightly better 99.
 */
export const supernova: Scene = {
  key: "supernova",
  name: "Supernova",

  palette: {
    page: "#140E22",
    card: "#1E1533",
    shadow: "rgba(255,190,80,0.35)",
    border: "rgba(255,205,110,0.75)",

    ink: "#FFF6E8",
    inkSoft: "rgba(255,246,232,0.66)",
    accent: "#FFD24A",
    divider: "rgba(255,210,74,0.7)",

    score: ["#FFF0A8", "#FFC24A", "#FF7A9B"],
    avatarRing: ["#FFE07A", "#FF9A5C", "#C77DFF"],

    pillFill: "rgba(255,255,255,0.1)",
    pillBorder: "rgba(255,214,120,0.55)",
    pillInk: "#FFE7B0",

    rule: "rgba(255,246,232,0.24)",
    raterStack: [
      ["#FFD9A0", "#E8A45C"],
      ["#E7B7FF", "#B078E8"],
      ["#9FE3F0", "#5FB5CC"],
    ],

    brand: "rgba(255,246,232,0.6)",
    mark: ["#FFE07A", "#FF9A5C", "#C77DFF"],
    markAlpha: 1,
    rays: {
      stroke: "rgba(255,224,140,0.75)",
      embers: ["#FFD24A", "#FF7A9B"],
      count: 26,
    },
    moodGlyph: "★",
  },

  backdrop({ ctx, w, h }) {
    ctx.fillStyle = "#140E22";
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.5, h * 0.42, w * 1.1, "rgba(255,190,80,0.22)");
    bloom(ctx, w * 0.85, h * 0.08, w * 0.6, "rgba(199,125,255,0.3)");
    bloom(ctx, w * 0.12, h * 0.94, w * 0.65, "rgba(255,122,155,0.22)");

    // A field of stars, since the page is night now.
    for (let i = 0; i < 90; i++) {
      const x = noise(i * 3) * w;
      const y = noise(i * 7 + 100) * h;
      ctx.save();
      ctx.globalAlpha = 0.25 + noise(i * 11) * 0.6;
      ctx.fillStyle = "#FFF6E8";
      ctx.beginPath();
      ctx.arc(x, y, w * (0.0008 + noise(i * 13) * 0.0018), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  surface({ ctx, cardX, cardY, cardW, cardH, cx, u }) {
    ctx.fillStyle = "#1E1533";
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // Starburst from behind the avatar, reaching the corners.
    const originY = cardY + u * 0.24;
    ctx.save();
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2;
      const spread = 0.04;
      ctx.globalAlpha = 0.06 + noise(i * 5) * 0.09;
      ctx.fillStyle = i % 3 === 0 ? "#FFD24A" : i % 3 === 1 ? "#FF7A9B" : "#C77DFF";
      ctx.beginPath();
      ctx.moveTo(cx, originY);
      ctx.lineTo(cx + Math.cos(a - spread) * cardH * 1.4, originY + Math.sin(a - spread) * cardH * 1.4);
      ctx.lineTo(cx + Math.cos(a + spread) * cardH * 1.4, originY + Math.sin(a + spread) * cardH * 1.4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#FFC24A", alpha: 0.3, depth: 0.2, reach: 0.96 },
      { fill: "#FF7A9B", alpha: 0.32, depth: 0.15, reach: 0.74 },
      { fill: "#C77DFF", alpha: 0.36, depth: 0.1, reach: 0.5 },
    ]);

    ribbon(ctx, cardX, cardY, cardW, cardH, "#C77DFF", "#4FC3D9", 0.38, 0.04, 0.28);
    ribbon(ctx, cardX, cardY, cardW, cardH, "#FFD24A", "#FF7A9B", 0.55, 0.026, 0.24);

    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#FFC24A", alpha: 0.26, depth: 0.885, reach: 0.83 },
      { fill: "#FF7A9B", alpha: 0.34, depth: 0.932, reach: 0.86 },
      { fill: "#C77DFF", alpha: 0.4, depth: 0.972, reach: 0.9 },
    ]);

    bloom(ctx, cx, originY, u * 0.7, "rgba(255,222,150,0.42)");

    for (let i = 0; i < 26; i++) {
      sparkle(
        ctx,
        cardX + cardW * (0.04 + noise(i * 17) * 0.92),
        cardY + cardH * (0.02 + noise(i * 43) * 0.95),
        cardW * (0.005 + noise(i * 47) * 0.008),
        "rgba(255,246,232,0.95)",
      );
    }
  },

  overlay({ ctx, w, h, cardX, cardY, cardW, cardH }) {
    const palette = ["#FFD24A", "#FF7A9B", "#C77DFF", "#4FC3D9", "#FFF6E8"];
    const bursts: [number, number, number][] = [
      [0.14, 0.09, 0.13],
      [0.87, 0.14, 0.1],
      [0.2, 0.88, 0.11],
      [0.83, 0.92, 0.085],
      [0.5, 0.045, 0.07],
    ];
    for (let i = 0; i < bursts.length; i++) {
      const [fx, fy, fr] = bursts[i];
      firework(
        ctx,
        cardX + cardW * fx,
        cardY + cardH * fy,
        cardW * fr,
        palette,
        i * 19,
        0.9,
      );
    }
    // Confetti falls across the page, not just the card — the only band where
    // the celebration is allowed outside the frame.
    confetti(ctx, 0, 0, w, h, palette, 70, w * 0.016, 7);
  },
};

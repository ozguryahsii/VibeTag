import type { Scene } from "@/components/card/scene";
import {
  bloom as glow,
  crestBottom,
  crestTop,
  noise,
  sparkle,
} from "@/components/card/paint";

function petalGlint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  angle: number,
  color: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(-size * 0.22, 0, size * 0.52, size * 0.2, -0.3, 0, Math.PI * 2);
  ctx.ellipse(size * 0.22, 0, size * 0.52, size * 0.2, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Bloom — Vibe Score 91–92.
 *
 * Rose moves to the front, a warm halo opens behind the avatar, and tiny
 * petal glints drift through the margins. It is visibly richer than Sunset
 * while remaining soft, light and personal rather than spectacle-led.
 */
export const bloom: Scene = {
  key: "bloom",
  name: "Bloom",

  palette: {
    page: "#FCF5F1",
    card: "#FFF8F1",
    shadow: "rgba(219,75,95,0.23)",
    border: "#F0A29B",

    ink: "#35201F",
    inkSoft: "#7B625E",
    accent: "#DD5268",
    divider: "rgba(221,82,104,0.64)",

    score: ["#F1BB4E", "#EF7A50", "#E55366", "#D83F78"],
    avatarRing: ["#F3C764", "#EF7D53", "#DE4D73"],

    pillFill: "rgba(255,249,243,0.86)",
    pillBorder: "#EFB7AE",
    pillInk: "#D95762",

    rule: "rgba(232,202,196,0.92)",
    raterStack: [
      ["#FAD7BC", "#EEA083"],
      ["#F9C6CF", "#EB8EA4"],
      ["#F1DDD5", "#D5B0A8"],
    ],

    brand: "rgba(53,32,31,0.5)",
    mark: ["#F0B552", "#E96A5F", "#D94376"],
    markAlpha: 0.98,
    rays: {
      stroke: "rgba(225,103,87,0.5)",
      embers: ["#DA466F", "#F0B94F"],
      count: 15,
    },
    moodGlyph: "✦",
  },

  backdrop({ ctx, w, h }) {
    ctx.fillStyle = "#FCF5F1";
    ctx.fillRect(0, 0, w, h);
    glow(ctx, w * 0.84, h * 0.06, w * 0.72, "rgba(239,166,92,0.16)");
    glow(ctx, w * 0.14, h * 0.94, w * 0.76, "rgba(220,72,108,0.14)");
  },

  surface({ ctx, cardX, cardY, cardW, cardH, cx, u }) {
    const wash = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    wash.addColorStop(0, "#FFF7EF");
    wash.addColorStop(0.5, "#FFFCF8");
    wash.addColorStop(1, "#FFF3EF");
    ctx.fillStyle = wash;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F5D194", alpha: 0.46, depth: 0.22, reach: 0.97 },
      { fill: "#EE9B72", alpha: 0.55, depth: 0.17, reach: 0.75 },
      { fill: "#DE5D79", alpha: 0.64, depth: 0.105, reach: 0.49 },
    ]);
    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F5D5A4", alpha: 0.46, depth: 0.895, reach: 0.83 },
      { fill: "#EE9A70", alpha: 0.56, depth: 0.936, reach: 0.86 },
      { fill: "#E25D75", alpha: 0.66, depth: 0.972, reach: 0.9 },
      { fill: "#D64078", alpha: 0.52, depth: 0.996, reach: 0.945 },
    ]);

    // Bloom's signature: layered champagne light behind the portrait.
    glow(ctx, cx, cardY + u * 0.245, u * 0.49, "rgba(244,186,91,0.2)");
    glow(ctx, cx, cardY + u * 0.245, u * 0.34, "rgba(231,92,111,0.12)");

    const petals: [number, number, number][] = [
      [0.1, 0.2, -0.55],
      [0.89, 0.25, 0.42],
      [0.075, 0.43, 0.28],
      [0.92, 0.5, -0.38],
      [0.11, 0.7, -0.2],
      [0.88, 0.76, 0.48],
      [0.18, 0.085, 0.36],
      [0.79, 0.07, -0.25],
      [0.13, 0.87, 0.55],
      [0.84, 0.9, -0.5],
    ];
    const petalColors = [
      "rgba(237,173,79,0.68)",
      "rgba(226,83,107,0.62)",
      "rgba(239,125,91,0.6)",
    ];
    petals.forEach(([px, py, angle], i) => {
      petalGlint(
        ctx,
        cardX + cardW * px,
        cardY + cardH * py,
        u * (0.014 + noise(i * 19) * 0.007),
        angle,
        petalColors[i % petalColors.length],
      );
    });

    for (let i = 0; i < 10; i++) {
      const onLeft = i % 2 === 0;
      sparkle(
        ctx,
        cardX +
          cardW *
            (onLeft
              ? 0.06 + noise(i + 30) * 0.07
              : 0.87 + noise(i + 30) * 0.07),
        cardY + cardH * (0.12 + noise(i * 29 + 8) * 0.76),
        u * (0.0035 + noise(i * 31) * 0.0035),
        i % 3 === 0 ? "#F0B950" : "#DF5871",
      );
    }
  },
};

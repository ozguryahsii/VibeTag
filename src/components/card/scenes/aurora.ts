import type { Scene } from "@/components/card/scene";
import {
  bloom,
  crestBottom,
  crestTop,
  firework,
  noise,
  ribbon,
  sparkle,
} from "@/components/card/paint";

/**
 * Aurora — Vibe Score 96–98.
 *
 * A light, warm aurora: champagne, coral and rose ribbons move through an
 * ivory card while a handful of fine edge bursts introduce celebration. The
 * middle stays quiet enough for the profile and score to remain the focus.
 */
export const aurora: Scene = {
  key: "aurora",
  name: "Aurora",

  palette: {
    page: "#FBF5EE",
    card: "#FFFBF5",
    shadow: "rgba(194,103,78,0.2)",
    border: "#F2C49F",

    ink: "#33231E",
    inkSoft: "#78645B",
    accent: "#E86460",
    divider: "rgba(232,100,96,0.62)",

    score: ["#E8A33A", "#F07857", "#E94F78"],
    avatarRing: ["#F0B94E", "#F47C61", "#E94F78"],

    pillFill: "rgba(255,252,245,0.88)",
    pillBorder: "#F2C8AE",
    pillInk: "#D96358",

    rule: "rgba(235,204,183,0.92)",
    raterStack: [
      ["#FFE1C2", "#EFB17F"],
      ["#FFD3C9", "#EB9B8C"],
      ["#F8CAD7", "#E58AA5"],
    ],

    brand: "rgba(68,46,38,0.46)",
    mark: ["#EFB84B", "#F07857", "#E94F78"],
    markAlpha: 1,
    rays: {
      stroke: "rgba(235,126,93,0.62)",
      embers: ["#E9A83F", "#EA5A72"],
      count: 20,
    },
    moodGlyph: "★",
  },

  backdrop({ ctx, w, h }) {
    ctx.save();
    ctx.fillStyle = "#FBF5EE";
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.84, h * 0.08, w * 0.72, "rgba(244,184,89,0.18)");
    bloom(ctx, w * 0.14, h * 0.92, w * 0.76, "rgba(235,91,119,0.12)");
    ctx.restore();
  },

  surface({ ctx, cardX, cardY, cardW, cardH, cx, u }) {
    ctx.save();
    ctx.fillStyle = "#FFFBF5";
    ctx.fillRect(cardX, cardY, cardW, cardH);

    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F8D58E", alpha: 0.48, depth: 0.23, reach: 0.98 },
      { fill: "#F7A779", alpha: 0.44, depth: 0.175, reach: 0.76 },
      { fill: "#EC6C75", alpha: 0.42, depth: 0.115, reach: 0.52 },
    ]);

    // Three translucent light ribbons create motion without cooling the card.
    ribbon(ctx, cardX, cardY, cardW, cardH, "#F2C45C", "#F28A69", 0.34, 0.042, 0.19);
    ribbon(ctx, cardX, cardY, cardW, cardH, "#F58E70", "#E95779", 0.47, 0.03, 0.17);
    ribbon(ctx, cardX, cardY, cardW, cardH, "#F5C86D", "#EE7180", 0.62, 0.022, 0.14);

    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F8DA96", alpha: 0.38, depth: 0.885, reach: 0.83 },
      { fill: "#F5A275", alpha: 0.44, depth: 0.932, reach: 0.86 },
      { fill: "#EA5B78", alpha: 0.5, depth: 0.972, reach: 0.9 },
    ]);

    bloom(ctx, cx, cardY + u * 0.25, u * 0.58, "rgba(255,224,176,0.3)");
    bloom(ctx, cx, cardY + u * 0.82, u * 0.5, "rgba(247,177,96,0.1)");

    for (let i = 0; i < 16; i++) {
      sparkle(
        ctx,
        cardX + cardW * (0.05 + noise(i * 9) * 0.9),
        cardY + cardH * (0.025 + noise(i * 29) * 0.94),
        cardW * (0.004 + noise(i * 31) * 0.005),
        i % 3 === 0 ? "rgba(232,91,116,0.7)" : "rgba(232,168,60,0.72)",
      );
    }
    ctx.restore();
  },

  overlay({ ctx, cardX, cardY, cardW, cardH }) {
    const colors = ["#EDB348", "#F28661", "#E95476"];
    const bursts: [number, number, number, number][] = [
      [0.09, 0.105, 0.075, 0.46],
      [0.89, 0.14, 0.06, 0.42],
      [0.025, 0.46, 0.045, 0.34],
      [0.975, 0.58, 0.05, 0.36],
      [0.16, 0.9, 0.06, 0.4],
      [0.86, 0.91, 0.07, 0.44],
    ];

    ctx.save();
    for (let i = 0; i < bursts.length; i++) {
      const [fx, fy, fr, alpha] = bursts[i];
      firework(
        ctx,
        cardX + cardW * fx,
        cardY + cardH * fy,
        cardW * fr,
        colors,
        i * 17 + 3,
        alpha,
      );
    }
    ctx.restore();
  },
};

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
 * Fireworks — Vibe Score 99.
 *
 * The most kinetic card in the ladder. A deliberately open orbit and sweeping
 * warm light keep the score in motion, while asymmetrical edge fireworks make
 * the celebration feel spontaneous rather than perfectly staged.
 */
export const fireworks: Scene = {
  key: "fireworks",
  name: "Fireworks",

  palette: {
    page: "#FBF3EC",
    card: "#FFF9F1",
    shadow: "rgba(196,86,65,0.26)",
    border: "#EDAF82",

    ink: "#321C19",
    inkSoft: "#785A50",
    accent: "#E9555D",
    divider: "rgba(233,85,93,0.7)",

    score: ["#ECAA36", "#F06A4E", "#E6386B"],
    avatarRing: ["#F0B53E", "#F06A4E", "#E6386B"],

    pillFill: "rgba(255,250,242,0.9)",
    pillBorder: "#F0BE9E",
    pillInk: "#D94F55",

    rule: "rgba(235,194,168,0.94)",
    raterStack: [
      ["#FFE1B2", "#EFB36F"],
      ["#FFD0C5", "#ED927C"],
      ["#F8BED0", "#E77798"],
    ],

    brand: "rgba(63,38,31,0.48)",
    mark: ["#EFB23E", "#F06A4E", "#E6386B"],
    markAlpha: 1,
    rays: {
      stroke: "rgba(236,108,76,0.68)",
      embers: ["#E9A63A", "#E6386B"],
      count: 24,
    },
    moodGlyph: "★",
  },

  backdrop({ ctx, w, h }) {
    ctx.save();
    ctx.fillStyle = "#FBF3EC";
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.84, h * 0.08, w * 0.74, "rgba(244,174,64,0.2)");
    bloom(ctx, w * 0.13, h * 0.91, w * 0.82, "rgba(231,62,105,0.15)");
    ctx.restore();
  },

  surface({ ctx, cardX, cardY, cardW, cardH, cx, u }) {
    ctx.save();
    ctx.fillStyle = "#FFF9F1";
    ctx.fillRect(cardX, cardY, cardW, cardH);

    crestTop(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F7CF72", alpha: 0.5, depth: 0.24, reach: 0.98 },
      { fill: "#F58A60", alpha: 0.52, depth: 0.18, reach: 0.78 },
      { fill: "#E94770", alpha: 0.52, depth: 0.115, reach: 0.52 },
    ]);

    // Broad, low-opacity sweeps provide speed without becoming confetti.
    ribbon(ctx, cardX, cardY, cardW, cardH, "#F1B63E", "#F06C4D", 0.31, 0.05, 0.17);
    ribbon(ctx, cardX, cardY, cardW, cardH, "#F37A55", "#E6386B", 0.52, 0.035, 0.2);
    ribbon(ctx, cardX, cardY, cardW, cardH, "#E94A68", "#E9A63A", 0.7, 0.022, 0.14);

    crestBottom(ctx, cardX, cardY, cardW, cardH, [
      { fill: "#F7D27D", alpha: 0.42, depth: 0.885, reach: 0.83 },
      { fill: "#F1845F", alpha: 0.5, depth: 0.932, reach: 0.86 },
      { fill: "#E63A69", alpha: 0.58, depth: 0.972, reach: 0.9 },
    ]);

    bloom(ctx, cx, cardY + u * 0.25, u * 0.62, "rgba(255,224,170,0.32)");

    // The incomplete orbit is the visual difference between 99 and 100: it
    // races around the score but intentionally leaves a bright opening.
    const orbitY = cardY + u * 0.82;
    bloom(ctx, cx, orbitY, u * 0.5, "rgba(242,130,72,0.12)");
    ctx.save();
    const orbit = ctx.createLinearGradient(cx - u * 0.38, orbitY, cx + u * 0.38, orbitY);
    orbit.addColorStop(0, "#EAA83A");
    orbit.addColorStop(0.48, "#F06A4E");
    orbit.addColorStop(1, "#E6386B");
    ctx.strokeStyle = orbit;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(238,95,77,0.3)";
    ctx.shadowBlur = u * 0.03;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = u * 0.01;
    ctx.beginPath();
    ctx.ellipse(cx, orbitY, u * 0.385, u * 0.255, -0.08, 0.48, Math.PI * 1.82);
    ctx.stroke();
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = u * 0.004;
    ctx.beginPath();
    ctx.ellipse(cx, orbitY, u * 0.42, u * 0.285, -0.08, 2.82, Math.PI * 1.68);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < 22; i++) {
      sparkle(
        ctx,
        cardX + cardW * (0.035 + noise(i * 11) * 0.93),
        cardY + cardH * (0.018 + noise(i * 37) * 0.96),
        cardW * (0.004 + noise(i * 41) * 0.006),
        i % 4 === 0 ? "rgba(230,56,107,0.82)" : "rgba(235,164,53,0.8)",
      );
    }
    ctx.restore();
  },

  overlay({ ctx, cardX, cardY, cardW, cardH }) {
    const colors = ["#ECAF38", "#F06A4E", "#E6386B", "#F59A67"];
    // Uneven placement gives 99 its electric, still-in-motion character. All
    // centres stay at the safe edge so the shared typography remains clear.
    const bursts: [number, number, number, number][] = [
      [0.075, 0.09, 0.115, 0.78],
      [0.88, 0.13, 0.082, 0.7],
      [0.015, 0.37, 0.064, 0.56],
      [0.985, 0.58, 0.092, 0.72],
      [0.15, 0.88, 0.096, 0.74],
      [0.72, 0.96, 0.07, 0.62],
      [0.93, 0.79, 0.052, 0.54],
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
        i * 19 + 5,
        alpha,
      );
    }
    ctx.restore();
  },
};

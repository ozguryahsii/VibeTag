import type { Scene } from "@/components/card/scene";
import { bloom, firework, noise, sparkle } from "@/components/card/paint";

/**
 * Supernova — Vibe Score 100.
 *
 * A complete, ceremonial finish to the ladder. Unlike 99's open, asymmetrical
 * motion, this card is centred and serene: a closed halo, balanced radiance and
 * paired fireworks on luminous ivory. Completion comes from order, not from
 * adding more visual noise.
 */
export const supernova: Scene = {
  key: "supernova",
  name: "Supernova",

  palette: {
    page: "#FAF3E9",
    card: "#FFFDF7",
    shadow: "rgba(192,116,54,0.28)",
    border: "rgba(222,158,76,0.78)",

    ink: "#2F2019",
    inkSoft: "#746056",
    accent: "#D95156",
    divider: "rgba(217,81,86,0.66)",

    score: ["#D49A2F", "#F06E4E", "#D93D6B"],
    avatarRing: ["#E3AD3F", "#F17A55", "#DB496E"],

    pillFill: "rgba(255,253,247,0.92)",
    pillBorder: "rgba(229,172,105,0.62)",
    pillInk: "#C94D50",

    rule: "rgba(230,194,158,0.72)",
    raterStack: [
      ["#FFE2AE", "#E9AD5D"],
      ["#FFD0BF", "#E98C72"],
      ["#F8BED0", "#DD718F"],
    ],

    brand: "rgba(61,42,34,0.5)",
    mark: ["#DEA43A", "#EF714F", "#D93D6B"],
    markAlpha: 1,
    rays: {
      stroke: "rgba(225,144,70,0.68)",
      embers: ["#DFA43A", "#D93D6B"],
      count: 26,
    },
    moodGlyph: "★",
  },

  backdrop({ ctx, w, h }) {
    ctx.save();
    const paper = ctx.createLinearGradient(0, 0, w, h);
    paper.addColorStop(0, "#FBF7EF");
    paper.addColorStop(0.5, "#FAF1E5");
    paper.addColorStop(1, "#FFF8EE");
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.5, h * 0.45, w * 1.05, "rgba(239,177,65,0.17)");
    bloom(ctx, w * 0.1, h * 0.1, w * 0.58, "rgba(239,102,76,0.11)");
    bloom(ctx, w * 0.9, h * 0.1, w * 0.58, "rgba(239,102,76,0.11)");
    bloom(ctx, w * 0.1, h * 0.9, w * 0.58, "rgba(216,61,105,0.09)");
    bloom(ctx, w * 0.9, h * 0.9, w * 0.58, "rgba(216,61,105,0.09)");
    ctx.restore();
  },

  surface({ ctx, cardX, cardY, cardW, cardH, cx, u }) {
    ctx.save();
    const ivory = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    ivory.addColorStop(0, "#FFF9EC");
    ivory.addColorStop(0.48, "#FFFDF8");
    ivory.addColorStop(1, "#FFF7EB");
    ctx.fillStyle = ivory;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // Mirrored corner light keeps the entire card luminous and balanced.
    bloom(ctx, cardX + cardW * 0.08, cardY + cardH * 0.08, u * 0.72, "rgba(235,161,50,0.16)");
    bloom(ctx, cardX + cardW * 0.92, cardY + cardH * 0.08, u * 0.72, "rgba(235,161,50,0.16)");
    bloom(ctx, cardX + cardW * 0.08, cardY + cardH * 0.92, u * 0.72, "rgba(219,64,106,0.11)");
    bloom(ctx, cardX + cardW * 0.92, cardY + cardH * 0.92, u * 0.72, "rgba(219,64,106,0.11)");
    bloom(ctx, cx, cardY + u * 0.245, u * 0.6, "rgba(244,190,100,0.28)");

    const haloY = cardY + u * 0.82;
    bloom(ctx, cx, haloY, u * 0.58, "rgba(236,154,66,0.16)");

    // A quiet, regular corona: every ray has a mirrored opposite and the same
    // reach. The shared composition's finer rays sit over this broad layer.
    ctx.save();
    const coronaColors = ["#DEA43A", "#EF714F", "#D93D6B"];
    const rayCount = 24;
    for (let i = 0; i < rayCount; i++) {
      const a = (i / rayCount) * Math.PI * 2;
      const spread = 0.025;
      const inner = u * 0.31;
      const outer = u * 0.47;
      ctx.globalAlpha = 0.045;
      ctx.fillStyle = coronaColors[i % coronaColors.length];
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, haloY + Math.sin(a) * inner * 0.72);
      ctx.lineTo(cx + Math.cos(a - spread) * outer, haloY + Math.sin(a - spread) * outer * 0.72);
      ctx.lineTo(cx + Math.cos(a + spread) * outer, haloY + Math.sin(a + spread) * outer * 0.72);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // A fully closed halo marks completion; 99 deliberately leaves this open.
    ctx.save();
    const ring = ctx.createLinearGradient(cx - u * 0.4, haloY, cx + u * 0.4, haloY);
    ring.addColorStop(0, "#DCA139");
    ring.addColorStop(0.5, "#EF714F");
    ring.addColorStop(1, "#D93D6B");
    ctx.strokeStyle = ring;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(224,111,71,0.25)";
    ctx.shadowBlur = u * 0.035;
    const rings: [number, number, number, number][] = [
      [0.38, 0.255, 0.01, 0.52],
      [0.42, 0.285, 0.004, 0.24],
    ];
    for (const [rx, ry, width, alpha] of rings) {
      ctx.globalAlpha = alpha;
      ctx.lineWidth = u * width;
      ctx.beginPath();
      ctx.ellipse(cx, haloY, u * rx, u * ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Sparse mirrored constellations preserve generous clean space.
    const constellation: [number, number, number][] = [
      [0.08, 0.28, 0.004],
      [0.13, 0.35, 0.006],
      [0.09, 0.43, 0.0035],
      [0.15, 0.68, 0.0045],
      [0.1, 0.76, 0.006],
    ];
    for (let i = 0; i < constellation.length; i++) {
      const [fx, fy, fr] = constellation[i];
      const color = i % 2 === 0 ? "rgba(218,154,50,0.76)" : "rgba(216,61,107,0.68)";
      sparkle(ctx, cardX + cardW * fx, cardY + cardH * fy, cardW * fr, color);
      sparkle(ctx, cardX + cardW * (1 - fx), cardY + cardH * fy, cardW * fr, color);
    }
    ctx.restore();
  },

  overlay({ ctx, cardX, cardY, cardW, cardH }) {
    const colors = ["#DFA43A", "#EF714F", "#D93D6B", "#F1B862"];
    const pairs: [number, number, number, number, number][] = [
      [0.13, 0.11, 0.085, 0.66, 11],
      [0.055, 0.5, 0.052, 0.46, 31],
      [0.16, 0.89, 0.072, 0.58, 53],
    ];

    ctx.save();
    for (const [fx, fy, fr, alpha, seed] of pairs) {
      firework(
        ctx,
        cardX + cardW * fx,
        cardY + cardH * fy,
        cardW * fr,
        colors,
        seed,
        alpha,
      );
      firework(
        ctx,
        cardX + cardW * (1 - fx),
        cardY + cardH * fy,
        cardW * fr,
        colors,
        seed,
        alpha,
      );
    }

    // Tiny paired star points complete the frame without filling the page.
    for (let i = 0; i < 8; i++) {
      const fy = 0.18 + noise(i * 23 + 7) * 0.64;
      const fx = 0.035 + noise(i * 29 + 13) * 0.08;
      const r = cardW * (0.0025 + noise(i * 31) * 0.0025);
      const color = i % 2 === 0 ? "rgba(218,154,50,0.74)" : "rgba(216,61,107,0.66)";
      sparkle(ctx, cardX + cardW * fx, cardY + cardH * fy, r, color);
      sparkle(ctx, cardX + cardW * (1 - fx), cardY + cardH * fy, r, color);
    }
    ctx.restore();
  },
};

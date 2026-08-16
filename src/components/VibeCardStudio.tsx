"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { iconFor, type IconDef } from "@/lib/icons";
import { initialsOf } from "@/components/Avatar";
import { fill, useD } from "@/components/LocaleProvider";

/**
 * Vibe Card studio (§12) — the viral core of the product.
 *
 * The card is rendered on a real <canvas> at full export resolution, so what
 * the user previews is pixel-for-pixel what they share. No html2canvas, no
 * screenshotting — the growth loop should not be flaky.
 *
 * Composition: a warm rounded card floating on a cream backdrop — centred
 * avatar → name → hairline divider → MY VIBE → editorial serif score → mood
 * line → trait pills → rater row.
 *
 * The card's *tone* follows the score, but never punitively: a modest score
 * gets a calm, restrained, still-beautiful card ("Room to grow"); a high score
 * gets rays and sparkles. Nothing here is ever allowed to look like a bad
 * grade — that is the whole product thesis.
 */

export type CardData = {
  name: string;
  username: string;
  score: number;
  ratingCount: number;
  percentile: number | null;
  tags: { key: string; label: string }[];
  avatarUrl: string | null;
  avatarColor: string;
};

const FORMATS = {
  story: { w: 1080, h: 1920, labelKey: "formatStory", hint: "Instagram · TikTok" },
  square: { w: 1080, h: 1080, labelKey: "formatSquare", hint: "Instagram · WhatsApp" },
  wide: { w: 1600, h: 900, labelKey: "formatWide", hint: "X · LinkedIn" },
} as const;

type FormatKey = keyof typeof FORMATS;

const THEMES = {
  auto: {
    label: "Auto",
    swatch: "linear-gradient(135deg,#FFF3E6,#FFD9C2,#FFB5C6)",
  },
  glow: {
    label: "Glow",
    swatch: "linear-gradient(135deg,#F5AD3E,#EF7648,#EC476D)",
  },
  calm: {
    label: "Calm",
    swatch: "linear-gradient(135deg,#FFF8F5,#F3ECE4)",
  },
  aura: {
    label: "Aura",
    swatch: "linear-gradient(135deg,#F2A03F,#F05262,#C95C76)",
  },
} as const;

type ThemeKey = keyof typeof THEMES;

/** Score → emotional register. Never a verdict, only a temperature. */
type Tone = "celebratory" | "warm" | "calm";

function toneFor(score: number): Tone {
  if (score >= 85) return "celebratory";
  if (score >= 72) return "warm";
  return "calm";
}

// ------------------------------------------------------------ canvas utils

function cssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

function sans(weight: number, size: number) {
  return `${weight} ${size}px ${cssVar("--font-dm-sans", "DM Sans")}, sans-serif`;
}
function serif(weight: number, size: number) {
  const playfair = cssVar("--font-playfair", '"Playfair Display"');
  return `${weight} ${size}px Didot, "Bodoni 72", ${playfair}, Georgia, serif`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function bloom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha: number,
) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

const FINGERPRINT_PATHS = [
  "M8.5 27C15 13 27 5.5 40 5.5S66 13.5 72 28",
  "M4.5 52V43C4.5 24 20 12.5 40 12.5S75.5 25 75.5 44V52",
  "M13.5 63V44C13.5 29 24.8 20 40 20S66.8 30 66.8 45.5V63",
  "M22.7 73.5V46C22.7 34.7 29.9 27.6 40.1 27.6 51.3 27.6 59 35.4 59 47V64.5",
  "M40.6 35.2C33.4 35.2 29.3 40.3 29.3 47.5 29.3 58.3 34.2 76.9 38.5 88.7 40 92.9 44.3 93 46 88.8 50.5 77.6 55.7 59.2 55.7 47.6 55.7 40 49.9 35.2 40.6 35.2Z",
];

function drawFingerprint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  muted = false,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(width / 80, width / 80);
  const g = ctx.createLinearGradient(5, 18, 76, 68);
  g.addColorStop(0, "#FF9B3F");
  g.addColorStop(0.48, "#FF705C");
  g.addColorStop(1, "#F1436D");
  ctx.strokeStyle = muted ? "#C6B49D" : g;
  ctx.globalAlpha = muted ? 0.5 : 1;
  ctx.lineWidth = 3.7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of FINGERPRINT_PATHS) ctx.stroke(new Path2D(d));
  ctx.restore();
}

function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color = "#FFFFFF",
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.28, y - r * 0.28);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.28, y + r * 0.28);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.28, y + r * 0.28);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.28, y - r * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGlowWaves(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const top = (fill: string, alpha: number, depth: number, reach: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w * reach, y);
    ctx.bezierCurveTo(
      x + w * (reach - 0.12),
      y + h * 0.025,
      x + w * 0.38,
      y + h * depth * 0.72,
      x,
      y + h * depth,
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  top("#F7BD68", 0.55, 0.22, 0.94);
  top("#F58458", 0.78, 0.18, 0.72);
  top("#EF5962", 0.9, 0.12, 0.5);

  const bottom = (
    fill: string,
    alpha: number,
    start: number,
    crest: number,
  ) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x, y + h * start);
    ctx.bezierCurveTo(
      x + w * 0.22,
      y + h * crest,
      x + w * 0.57,
      y + h * (start + 0.06),
      x + w,
      y + h * (crest - 0.01),
    );
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  bottom("#F8C16F", 0.5, 0.9, 0.84);
  bottom("#F58D5D", 0.68, 0.94, 0.86);
  bottom("#EF596A", 0.86, 0.975, 0.9);
  bottom("#E93E75", 0.62, 0.995, 0.94);

  drawSparkle(ctx, x + w * 0.08, y + h * 0.035, w * 0.008);
  drawSparkle(ctx, x + w * 0.14, y + h * 0.052, w * 0.006);
  drawSparkle(ctx, x + w * 0.88, y + h * 0.94, w * 0.008);
}

function drawCalmWaves(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  for (const [offset, color, alpha] of [
    [0.13, "#EEE7DC", 0.46],
    [0.17, "#E7DED1", 0.56],
  ] as const) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x, y + h * offset);
    ctx.bezierCurveTo(
      x + w * 0.15,
      y + h * (offset - 0.07),
      x + w * 0.24,
      y + h * (offset + 0.07),
      x + w * 0.42,
      y + h * (offset + 0.1),
    );
    ctx.bezierCurveTo(
      x + w * 0.62,
      y + h * (offset + 0.13),
      x + w * 0.74,
      y + h * (offset - 0.02),
      x + w,
      y + h * (offset + 0.06),
    );
    ctx.lineTo(x + w, y + h * (offset + 0.11));
    ctx.bezierCurveTo(
      x + w * 0.75,
      y + h * (offset + 0.04),
      x + w * 0.62,
      y + h * (offset + 0.2),
      x + w * 0.41,
      y + h * (offset + 0.16),
    );
    ctx.bezierCurveTo(
      x + w * 0.23,
      y + h * (offset + 0.13),
      x + w * 0.14,
      y + h * (offset + 0.01),
      x,
      y + h * (offset + 0.08),
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/** Draw a 24×24 line icon centred at (x, y) with the given box size. */
function drawIcon(
  ctx: CanvasRenderingContext2D,
  def: IconDef,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  ctx.save();
  ctx.translate(x - size / 2, y - size / 2);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.9;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of def.paths ?? []) ctx.stroke(new Path2D(d));
  for (const [cxx, cyy, r] of def.circles ?? []) {
    ctx.beginPath();
    ctx.arc(cxx, cyy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const d of def.fills ?? []) ctx.fill(new Path2D(d));
  ctx.restore();
}

/** Deterministic jitter — sparkles look scattered but never move between renders. */
function noise(i: number): number {
  const x = Math.sin(i * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/** Darken/lighten a hex colour by a percentage. */
function shade(hex: string, pct: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const amt = Math.round(2.55 * pct);
  const r = clamp((n >> 16) + amt);
  const g = clamp(((n >> 8) & 0xff) + amt);
  const b = clamp((n & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// ------------------------------------------------------------------ studio

export function VibeCardStudio({ data }: { data: CardData }) {
  const d = useD();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);
  const [photoReady, setPhotoReady] = useState(0);
  const [format, setFormat] = useState<FormatKey>("story");
  const [theme, setTheme] = useState<ThemeKey>("auto");
  const [showScore, setShowScore] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = FORMATS[format];
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tone: Tone =
      theme === "glow" || theme === "aura"
        ? "celebratory"
        : theme === "calm"
          ? "calm"
          : toneFor(data.score);
    const rose = theme === "aura";

    // ---------------------------------------------------------- backdrop
    ctx.fillStyle = "#FBF8F2";
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.86, h * 0.04, w * 0.7, "rgba(242,160,63,0.13)", 1);
    bloom(ctx, w * 0.12, h * 0.96, w * 0.72, "rgba(240,82,98,0.1)", 1);

    // ------------------------------------------------------------- card
    const isWide = format === "wide";
    const margin = isWide ? h * 0.07 : w * 0.07;
    const cardW = isWide ? w * 0.5 : w - margin * 2;
    const cardX = (w - cardW) / 2;
    const cardH = isWide
      ? h - margin * 2
      : Math.min(
          h - margin * 2.4,
          cardW * (tone === "calm" ? 1.76 : 1.65),
        );
    const cardY = (h - cardH) / 2 - (isWide ? 0 : h * 0.012);
    const radius = cardW * 0.07;
    // Portrait uses the card width as its design unit. Square and wide cards
    // are height-constrained, so the same composition scales down intact
    // instead of letting the score or footer escape the rounded surface.
    const designRatio = tone === "calm" ? 1.76 : 1.65;
    const u = Math.min(cardW, cardH / designRatio);

    ctx.save();
    ctx.shadowColor =
      tone === "celebratory" ? "rgba(240,82,98,0.2)" : "rgba(83,60,40,0.12)";
    ctx.shadowBlur = u * 0.13;
    ctx.shadowOffsetY = u * 0.035;
    ctx.fillStyle = "#FCF8EF";
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.fill();
    ctx.restore();

    // card surface, clipped to the rounded shape
    ctx.save();
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.clip();

    if (tone === "celebratory") {
      ctx.fillStyle = "#FCF8EF";
      ctx.fillRect(cardX, cardY, cardW, cardH);
      drawGlowWaves(ctx, cardX, cardY, cardW, cardH);
    } else if (tone === "warm") {
      ctx.fillStyle = "#FCF8EF";
      ctx.fillRect(cardX, cardY, cardW, cardH);
      drawGlowWaves(ctx, cardX, cardY, cardW, cardH);
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = "#FCF8EF";
      ctx.fillRect(cardX, cardY, cardW, cardH);
      ctx.restore();
    } else {
      ctx.fillStyle = "#FCF8EF";
      ctx.fillRect(cardX, cardY, cardW, cardH);
      drawCalmWaves(ctx, cardX, cardY, cardW, cardH);
    }

    // ------------------------------------------------ fingerprint watermark
    drawFingerprint(
      ctx,
      cardX + cardW - u * 0.19,
      cardY + u * 0.06,
      u * 0.13,
      tone === "calm",
    );

    // ------------------------------------------------------------ helpers
    const cx = cardX + cardW / 2;
    const center = (text: string, cy: number) => {
      ctx.textAlign = "center";
      ctx.fillText(text, cx, cy);
      ctx.textAlign = "left";
    };

    // ------------------------------------------------------------- avatar
    const ar = u * 0.154;
    let y = cardY + u * (isWide ? 0.065 : 0.09) + ar;
    ctx.save();
    ctx.shadowColor = "rgba(31,31,31,0.15)";
    ctx.shadowBlur = u * 0.05;
    ctx.shadowOffsetY = u * 0.012;
    ctx.beginPath();
    ctx.arc(cx, y, ar, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, y, ar * 0.94, 0, Math.PI * 2);
    ctx.clip();
    const img = photoRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      const s2 = Math.max((ar * 2) / img.naturalWidth, (ar * 2) / img.naturalHeight);
      const iw = img.naturalWidth * s2;
      const ih = img.naturalHeight * s2;
      ctx.drawImage(img, cx - iw / 2, y - ih / 2, iw, ih);
    } else {
      const ag = ctx.createLinearGradient(cx - ar, y - ar, cx + ar, y + ar);
      ag.addColorStop(0, `${data.avatarColor}2E`);
      ag.addColorStop(1, `${data.avatarColor}17`);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(cx - ar, y - ar, ar * 2, ar * 2);
      ctx.fillStyle = ag;
      ctx.fillRect(cx - ar, y - ar, ar * 2, ar * 2);
      ctx.fillStyle = shade(data.avatarColor, -22);
      ctx.font = serif(400, ar * 0.82);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(initialsOf(data.name), cx, y + ar * 0.04);
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, y, ar, 0, Math.PI * 2);
    if (tone === "celebratory") {
      const rg = ctx.createLinearGradient(cx - ar, y - ar, cx + ar, y + ar);
      rg.addColorStop(0, "#F5AD3E");
      rg.addColorStop(0.55, "#EF7648");
      rg.addColorStop(1, rose ? "#C95C76" : "#EC476D");
      ctx.strokeStyle = rg;
      ctx.lineWidth = u * 0.008;
    } else {
      ctx.strokeStyle = "rgba(198,180,157,0.55)";
      ctx.lineWidth = u * 0.006;
    }
    ctx.stroke();

    // --------------------------------------------------------------- name
    y += ar + u * 0.075;
    ctx.fillStyle = "#2D211C";
    ctx.font = sans(600, u * 0.068);
    center(data.name, y);

    // ------------------------------------------------------------ divider
    y += u * 0.055;
    const dw = u * 0.11;
    ctx.strokeStyle =
      tone === "calm" ? "rgba(173,156,137,0.75)" : "rgba(240,82,98,0.64)";
    ctx.lineWidth = u * 0.002;
    ctx.beginPath();
    ctx.moveTo(cx - dw, y);
    ctx.lineTo(cx - u * 0.022, y);
    ctx.moveTo(cx + u * 0.022, y);
    ctx.lineTo(cx + dw, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, y, u * 0.007, 0, Math.PI * 2);
    ctx.fillStyle = tone === "calm" ? "#AD9C89" : "#F05262";
    ctx.fill();

    // ---------------------------------------------------------- MY VIBE
    y += u * 0.075;
    ctx.fillStyle = tone === "calm" ? "#665A51" : "#F05262";
    ctx.font = sans(600, u * 0.04);
    ctx.letterSpacing = `${u * 0.0155}px`;
    center("MY VIBE", y);
    ctx.letterSpacing = "0px";

    if (showScore) {
      const scoreSize = u * 0.39;
      const scoreCy = y + u * 0.22;

      // ---------------------------------------------------------- rays
      if (tone === "celebratory") {
        ctx.save();
        ctx.strokeStyle = rose
          ? "rgba(201,92,118,0.45)"
          : "rgba(242,160,63,0.52)";
        ctx.lineCap = "round";
        for (let i = 0; i < 14; i++) {
          const a = (i / 14) * Math.PI * 2 + 0.12;
          const inner = u * (0.27 + noise(i) * 0.025);
          const outer = inner + u * (0.045 + noise(i + 40) * 0.035);
          ctx.globalAlpha = 0.28 + noise(i + 7) * 0.42;
          ctx.lineWidth = u * 0.003;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * inner, scoreCy + Math.sin(a) * inner * 0.8);
          ctx.lineTo(cx + Math.cos(a) * outer, scoreCy + Math.sin(a) * outer * 0.8);
          ctx.stroke();
        }
        for (let i = 0; i < 12; i++) {
          const a = noise(i + 90) * Math.PI * 2;
          const d = u * (0.22 + noise(i + 130) * 0.16);
          const sy = scoreCy + Math.sin(a) * d * 0.82;
          // keep the label band clear
          if (sy > scoreCy + u * 0.12) continue;
          ctx.globalAlpha = 0.18 + noise(i + 200) * 0.4;
          ctx.fillStyle = i % 3 === 0 ? "#F05262" : "#F2A03F";
          ctx.beginPath();
          ctx.arc(
            cx + Math.cos(a) * d,
            sy,
            u * (0.0025 + noise(i + 300) * 0.003),
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.restore();
      }

      // --------------------------------------------------------- score
      y += u * 0.31;
      ctx.font = serif(400, scoreSize);
      if (tone === "calm") {
        ctx.fillStyle = "#4C3D33";
      } else {
        const sg = ctx.createLinearGradient(
          cx - u * 0.2,
          y - scoreSize,
          cx + u * 0.2,
          y,
        );
        sg.addColorStop(0, "#F5AD3C");
        sg.addColorStop(0.5, "#F17146");
        sg.addColorStop(1, rose ? "#C95C76" : "#E73D76");
        ctx.fillStyle = sg;
      }
      center(String(data.score), y);

      // ---------------------------------------------------- VIBE SCORE
      y += u * 0.075;
      ctx.fillStyle = tone === "calm" ? "#665A51" : "#F05262";
      ctx.font = sans(600, u * 0.0365);
      ctx.letterSpacing = `${u * 0.0135}px`;
      center("VIBE SCORE", y);
      ctx.letterSpacing = "0px";
    } else {
      y += u * 0.03;
    }

    // ----------------------------------------------------------- mood line
    y += u * 0.085;
    const moodText = !showScore
      ? d.card.seeMeAs
      : data.percentile && data.score >= 80
        ? fill(d.card.moodTop, { n: data.percentile })
        : tone === "celebratory"
          ? d.card.moodStandout
          : tone === "warm"
            ? d.card.moodGrowing
            : d.card.moodRoom;

    ctx.font = sans(600, u * 0.0445);
    const mw = ctx.measureText(moodText).width;
    const badgeR = u * 0.026;
    const moodStart = cx - (mw + badgeR * 2 + u * 0.022) / 2;

    ctx.beginPath();
    ctx.arc(moodStart + badgeR, y - u * 0.013, badgeR, 0, Math.PI * 2);
    ctx.strokeStyle = tone === "calm" ? "#A67A3D" : "#F05262";
    ctx.lineWidth = u * 0.0025;
    ctx.stroke();
    ctx.font = sans(400, u * 0.027);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = tone === "calm" ? "#A67A3D" : "#F05262";
    ctx.fillText(
      tone === "calm" ? "↗" : data.percentile && data.score >= 80 ? "★" : "✦",
      moodStart + badgeR,
      y - u * 0.012,
    );
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    ctx.font = sans(500, u * 0.0445);
    ctx.fillStyle = tone === "calm" ? "#A67A3D" : "#F05262";
    ctx.fillText(moodText, moodStart + badgeR * 2 + u * 0.022, y);

    // --------------------------------------------------------- trait pills
    y += u * 0.07;
    const pillH = u * 0.107;
    const pillGap = u * 0.022;
    let pillFont = u * 0.041;
    const chosen = data.tags.slice(0, 4);

    const limit = cardW * 0.84;
    ctx.font = sans(600, pillFont);
    const iconBox = () => pillFont * 1.18;
    let widths = chosen.map(
      (t) => ctx.measureText(t.label).width + iconBox() + u * 0.088,
    );

    // Fixed grid: everything in one row if it fits, otherwise pairs. Capping
    // at two rows keeps the pills from ever running into the footer rule —
    // long labels shrink the type instead of adding a third row.
    const oneRow =
      widths.reduce((a, b) => a + b, 0) + pillGap * (chosen.length - 1) <= limit;
    const rows: number[][] = oneRow
      ? [chosen.map((_, i) => i)]
      : chosen.reduce<number[][]>((acc, _, i) => {
          if (i % 2 === 0) acc.push([i]);
          else acc[acc.length - 1].push(i);
          return acc;
        }, []);

    const widest = Math.max(
      ...rows.map(
        (r) => r.reduce((a, i) => a + widths[i], 0) + pillGap * (r.length - 1),
      ),
    );
    if (widest > limit) {
      const k = limit / widest;
      pillFont *= k;
      widths = widths.map((wd) => wd * k);
    }

    for (const r of rows) {
      const total =
        r.reduce((a, i) => a + widths[i], 0) + pillGap * (r.length - 1);
      let x = cx - total / 2;
      for (const i of r) {
        const t = chosen[i];
        ctx.fillStyle =
          tone === "calm" ? "#EEE4D5" : "rgba(255,249,235,0.72)";
        ctx.strokeStyle =
          tone === "calm" ? "rgba(238,228,213,0)" : "#F0C298";
        ctx.lineWidth = u * 0.0025;
        roundRect(ctx, x, y, widths[i], pillH, pillH / 2);
        ctx.fill();
        ctx.stroke();

        const ink = tone === "calm" ? "#967043" : "#ED6A49";
        drawIcon(
          ctx,
          iconFor(t.key),
          x + u * 0.03 + iconBox() / 2,
          y + pillH / 2,
          iconBox(),
          ink,
        );
        ctx.font = sans(600, pillFont);
        ctx.fillStyle = ink;
        ctx.textBaseline = "middle";
        ctx.fillText(t.label, x + u * 0.03 + iconBox() + u * 0.022, y + pillH / 2);
        ctx.textBaseline = "alphabetic";

        x += widths[i] + pillGap;
      }
      y += pillH + pillGap * 0.7;
    }

    // ------------------------------------------------------- rater footer
    const footY =
      cardY + cardH - u * (tone === "calm" ? 0.18 : 0.14);
    const footLineY =
      cardY + cardH - u * (tone === "calm" ? 0.31 : 0.25);
    ctx.strokeStyle = "rgba(228,215,200,0.95)";
    ctx.lineWidth = u * 0.003;
    ctx.beginPath();
    ctx.moveTo(cardX + u * 0.09, footLineY);
    ctx.lineTo(cardX + cardW - u * 0.09, footLineY);
    ctx.stroke();

    // Stand-in avatars: raters are anonymous by design, so these are
    // decorative silhouettes — never the actual people who rated you.
    const stackR = u * 0.041;
    const shown = Math.min(3, data.ratingCount);
    let sx = cardX + u * 0.11 + stackR;

    for (let i = 0; i < shown; i++) {
      ctx.beginPath();
      ctx.arc(sx, footY, stackR, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, footY, stackR * 0.86, 0, Math.PI * 2);
      ctx.clip();
      const pg = ctx.createLinearGradient(
        sx - stackR,
        footY - stackR,
        sx + stackR,
        footY + stackR,
      );
      pg.addColorStop(0, ["#FFD3B0", "#FFC1CE", "#E8DCC9"][i % 3]);
      pg.addColorStop(1, ["#FFB98A", "#FFA5B8", "#C8B79E"][i % 3]);
      ctx.fillStyle = pg;
      ctx.fillRect(sx - stackR, footY - stackR, stackR * 2, stackR * 2);
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(sx, footY - stackR * 0.2, stackR * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx, footY + stackR * 0.72, stackR * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      sx += stackR * 1.25;
    }

    ctx.textBaseline = "middle";
    const textX = shown > 0 ? sx + stackR * 0.7 : cardX + u * 0.11;
    ctx.font = sans(500, u * 0.034);
    ctx.fillStyle = "#746860";
    ctx.fillText(d.common.ratedBy, textX, footY - u * 0.022);
    ctx.font = sans(500, u * 0.045);
    ctx.fillStyle = "#2D211C";
    ctx.fillText(
      `${data.ratingCount} ${d.common.people}`,
      textX,
      footY + u * 0.028,
    );
    ctx.textBaseline = "alphabetic";

    ctx.restore(); // end card clip

    ctx.save();
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.strokeStyle =
      tone === "calm" ? "rgba(224,211,192,0.82)" : "#F4AC78";
    ctx.lineWidth = u * 0.003;
    ctx.stroke();
    ctx.restore();

    // ------------------------------------------------------ outer branding
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(31,31,31,0.4)";
    ctx.font = sans(800, u * 0.031);
    ctx.letterSpacing = `${u * 0.01}px`;
    ctx.fillText("VIBE TAG", cx, cardY + cardH + margin * 0.62);
    ctx.letterSpacing = "0px";
    ctx.font = sans(500, u * 0.027);
    ctx.fillStyle = "rgba(31,31,31,0.3)";
    ctx.fillText(`@${data.username}`, cx, cardY + cardH + margin * 0.95);
    ctx.textAlign = "left";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, format, theme, showScore, photoReady, d]);

  // Decode the profile photo once, then redraw. Data URLs are same-origin,
  // so the canvas stays untainted and toDataURL keeps working.
  useEffect(() => {
    if (!data.avatarUrl) {
      photoRef.current = null;
      setPhotoReady((n) => n + 1);
      return;
    }
    const img = new Image();
    img.onload = () => {
      photoRef.current = img;
      setPhotoReady((n) => n + 1);
    };
    img.src = data.avatarUrl;
  }, [data.avatarUrl]);

  useEffect(() => {
    draw();
    // Redraw once the webfonts land, so the export uses DM Sans + Playfair
    // rather than whatever fallback happened to be up on first paint.
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(draw).catch(() => {});
    }
  }, [draw]);

  async function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `vibetag-${data.username}-${format}.png`;
    a.click();
    setStatus(d.card.downloaded);
    setTimeout(() => setStatus(null), 2500);
  }

  async function share() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/png"),
    );
    if (!blob) return;

    const file = new File([blob], `vibetag-${data.username}.png`, {
      type: "image/png",
    });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "My Vibe",
          text: `${d.card.seeMeAs} ${data.tags
            .slice(0, 3)
            .map((t) => t.label)
            .join(", ")} — ${d.common.appName}`,
        });
        return;
      } catch {
        /* share sheet dismissed */
      }
    }
    await download();
  }

  const f = FORMATS[format];

  return (
    <div>
      <div className="mt-5 grid place-items-center">
        <canvas
          ref={canvasRef}
          className="w-full h-auto rounded-[26px]"
          style={{
            maxWidth:
              format === "wide" ? "100%" : format === "square" ? 330 : 288,
            aspectRatio: `${f.w} / ${f.h}`,
          }}
        />
      </div>

      <div className="mt-6">
        <p className="text-[12px] font-extrabold text-muted mb-2 ml-1">
          {d.card.format}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(FORMATS) as FormatKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setFormat(k)}
              className={`rounded-2xl px-2 py-3 text-center transition-transform active:scale-95 ${
                format === k ? "grad-ring" : "bg-warmwhite border border-line"
              }`}
            >
              <span className="block text-[13px] font-extrabold">
                {d.card[FORMATS[k].labelKey]}
              </span>
              <span className="block text-[10.5px] text-muted mt-0.5">
                {FORMATS[k].hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[12px] font-extrabold text-muted mb-2 ml-1">
          {d.card.theme}
        </p>
        <div className="flex gap-2.5">
          {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setTheme(k)}
              aria-label={THEMES[k].label}
              className="flex-1 rounded-2xl p-1.5 transition-transform active:scale-95"
              style={{
                border: theme === k ? "2px solid #F05262" : "1px solid #E4D7C8",
                background: "#FCF8EF",
              }}
            >
              <span
                className="block h-9 rounded-xl"
                style={{ background: THEMES[k].swatch }}
              />
              <span className="block text-[10.5px] font-bold mt-1">
                {THEMES[k].label}
              </span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted mt-2 ml-1 leading-relaxed">
          {d.card.themeHint}
        </p>
      </div>

      <label className="mt-5 flex items-center gap-3 card p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={showScore}
          onChange={(e) => setShowScore(e.target.checked)}
          className="w-5 h-5 accent-[#F05262]"
        />
        <span>
          <span className="block text-[13.5px] font-bold">
            {d.card.showScore}
          </span>
          <span className="block text-[12px] text-muted">
            {d.card.showScoreBody}
          </span>
        </span>
      </label>

      <div className="mt-5 grid gap-2.5">
        <button
          onClick={share}
          className="h-13 rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)] active:scale-[0.98] transition-transform"
        >
          {d.card.share}
        </button>
        <button
          onClick={download}
          className="h-13 rounded-full bg-warmwhite border border-line font-bold text-[15px] shadow-[0_5px_16px_rgba(83,60,40,0.06)] active:scale-[0.98] transition-transform"
        >
          {fill(d.card.download, { w: f.w, h: f.h })}
        </button>
      </div>

      {status && (
        <p className="mt-3 text-center text-[13px] font-bold text-orange">
          {status}
        </p>
      )}
    </div>
  );
}

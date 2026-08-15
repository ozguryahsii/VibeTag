"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ICONS, iconFor, type IconDef } from "@/lib/icons";
import { initialsOf } from "@/components/Avatar";

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
  story: { w: 1080, h: 1920, label: "Story", hint: "Instagram · TikTok" },
  square: { w: 1080, h: 1080, label: "Kare", hint: "Instagram · WhatsApp" },
  wide: { w: 1600, h: 900, label: "Geniş", hint: "X · LinkedIn" },
} as const;

type FormatKey = keyof typeof FORMATS;

const THEMES = {
  auto: {
    label: "Auto",
    swatch: "linear-gradient(135deg,#FFF3E6,#FFD9C2,#FFB5C6)",
  },
  glow: {
    label: "Glow",
    swatch: "linear-gradient(135deg,#FF9A3D,#FF5C77,#FF7AA2)",
  },
  calm: {
    label: "Calm",
    swatch: "linear-gradient(135deg,#FFF8F5,#F3ECE4)",
  },
  aura: {
    label: "Aura",
    swatch: "linear-gradient(135deg,#FF8A3D,#FF5C77,#8B5CF6)",
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
  return `${weight} ${size}px ${cssVar("--font-inter", "sans-serif")}, sans-serif`;
}
function serif(weight: number, size: number) {
  return `${weight} ${size}px ${cssVar("--font-display-serif", "Georgia")}, Georgia, serif`;
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
    const purple = theme === "aura";

    // ---------------------------------------------------------- backdrop
    ctx.fillStyle = "#FAF7F2";
    ctx.fillRect(0, 0, w, h);
    bloom(ctx, w * 0.85, h * 0.05, w * 0.8, "rgba(255,138,61,0.18)", 1);
    bloom(ctx, w * 0.1, h * 0.95, w * 0.8, "rgba(255,122,162,0.14)", 1);

    // ------------------------------------------------------------- card
    const isWide = format === "wide";
    const margin = isWide ? h * 0.07 : w * 0.07;
    const cardW = isWide ? w * 0.5 : w - margin * 2;
    const cardX = (w - cardW) / 2;
    const cardH = isWide
      ? h - margin * 2
      : Math.min(h - margin * 2.4, cardW * 1.5);
    const cardY = (h - cardH) / 2 - (isWide ? 0 : h * 0.012);
    const radius = cardW * 0.085;
    const u = cardW; // every measurement scales off the card width

    ctx.save();
    ctx.shadowColor =
      tone === "celebratory" ? "rgba(255,92,119,0.26)" : "rgba(31,31,31,0.10)";
    ctx.shadowBlur = u * 0.13;
    ctx.shadowOffsetY = u * 0.035;
    ctx.fillStyle = "#FFFDFB";
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.fill();
    ctx.restore();

    // card surface, clipped to the rounded shape
    ctx.save();
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.clip();

    if (tone === "celebratory") {
      ctx.fillStyle = "#FFF9F3";
      ctx.fillRect(cardX, cardY, cardW, cardH);
      bloom(ctx, cardX + cardW * 0.04, cardY + cardH * 0.03, cardW * 0.85, "rgba(255,168,90,0.9)", 0.72);
      bloom(ctx, cardX + cardW * 1.04, cardY + cardH * 0.14, cardW * 0.66, "rgba(255,206,152,0.85)", 0.6);
      bloom(
        ctx,
        cardX + cardW * 1.0,
        cardY + cardH * 1.0,
        cardW * 0.95,
        purple ? "rgba(163,124,246,0.75)" : "rgba(255,122,162,0.85)",
        0.72,
      );
      bloom(ctx, cardX - cardW * 0.1, cardY + cardH * 0.86, cardW * 0.66, "rgba(255,190,130,0.75)", 0.48);
    } else if (tone === "warm") {
      ctx.fillStyle = "#FFFBF7";
      ctx.fillRect(cardX, cardY, cardW, cardH);
      bloom(ctx, cardX + cardW * 0.95, cardY, cardW * 0.8, "rgba(255,190,140,0.55)", 0.6);
      bloom(ctx, cardX, cardY + cardH, cardW * 0.8, "rgba(255,172,192,0.45)", 0.5);
    } else {
      ctx.fillStyle = "#FBF8F4";
      ctx.fillRect(cardX, cardY, cardW, cardH);
      // barely-there hills, so a modest score still looks designed, not empty
      ctx.fillStyle = "rgba(31,31,31,0.028)";
      ctx.beginPath();
      ctx.ellipse(cardX + cardW * 0.2, cardY + cardH * 0.2, cardW * 0.44, cardH * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cardX + cardW * 0.86, cardY + cardH * 0.26, cardW * 0.34, cardH * 0.075, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // ------------------------------------------------ fingerprint watermark
    const fpX = cardX + cardW - u * 0.125;
    const fpY = cardY + u * 0.115;
    ctx.save();
    ctx.globalAlpha = tone === "calm" ? 0.15 : 0.26;
    drawIcon(
      ctx,
      ICONS.fingerprint,
      fpX,
      fpY,
      u * 0.115,
      tone === "calm" ? "#8A7F76" : "#FF7A4D",
    );
    ctx.restore();

    // ------------------------------------------------------------ helpers
    const cx = cardX + cardW / 2;
    const center = (text: string, cy: number) => {
      ctx.textAlign = "center";
      ctx.fillText(text, cx, cy);
      ctx.textAlign = "left";
    };

    let y = cardY + cardH * (isWide ? 0.1 : 0.085);

    // ------------------------------------------------------------- avatar
    const ar = u * 0.115;
    y += ar;
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
      rg.addColorStop(0, "#FF8A3D");
      rg.addColorStop(1, purple ? "#8B5CF6" : "#FF5C77");
      ctx.strokeStyle = rg;
      ctx.lineWidth = u * 0.011;
    } else {
      ctx.strokeStyle = "rgba(31,31,31,0.09)";
      ctx.lineWidth = u * 0.007;
    }
    ctx.stroke();

    // --------------------------------------------------------------- name
    y += ar + u * 0.082;
    ctx.fillStyle = "#241F1B";
    ctx.font = serif(600, u * 0.079);
    center(data.name, y);

    // ------------------------------------------------------------ divider
    y += u * 0.048;
    const dw = u * 0.185;
    ctx.strokeStyle =
      tone === "calm" ? "rgba(31,31,31,0.14)" : "rgba(255,138,61,0.5)";
    ctx.lineWidth = u * 0.0035;
    ctx.beginPath();
    ctx.moveTo(cx - dw, y);
    ctx.lineTo(cx - u * 0.022, y);
    ctx.moveTo(cx + u * 0.022, y);
    ctx.lineTo(cx + dw, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, y, u * 0.0075, 0, Math.PI * 2);
    ctx.fillStyle = tone === "calm" ? "#B9AEA4" : "#FF6B52";
    ctx.fill();

    // ---------------------------------------------------------- MY VIBE
    y += u * 0.072;
    ctx.fillStyle = tone === "calm" ? "#8A7F76" : "#B0705A";
    ctx.font = sans(600, u * 0.035);
    ctx.letterSpacing = `${u * 0.017}px`;
    center("MY VIBE", y);
    ctx.letterSpacing = "0px";

    if (showScore) {
      const scoreSize = u * 0.275;
      const scoreCy = y + u * 0.14;

      // ---------------------------------------------------------- rays
      if (tone === "celebratory") {
        ctx.save();
        ctx.strokeStyle = purple
          ? "rgba(139,92,246,0.5)"
          : "rgba(255,138,61,0.5)";
        ctx.lineCap = "round";
        for (let i = 0; i < 26; i++) {
          const a = (i / 26) * Math.PI * 2 + 0.12;
          const inner = u * (0.235 + noise(i) * 0.05);
          const outer = inner + u * (0.032 + noise(i + 40) * 0.05);
          ctx.globalAlpha = 0.22 + noise(i + 7) * 0.5;
          ctx.lineWidth = u * 0.0042;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * inner, scoreCy + Math.sin(a) * inner * 0.8);
          ctx.lineTo(cx + Math.cos(a) * outer, scoreCy + Math.sin(a) * outer * 0.8);
          ctx.stroke();
        }
        for (let i = 0; i < 16; i++) {
          const a = noise(i + 90) * Math.PI * 2;
          const d = u * (0.22 + noise(i + 130) * 0.16);
          const sy = scoreCy + Math.sin(a) * d * 0.82;
          // keep the label band clear
          if (sy > scoreCy + u * 0.12) continue;
          ctx.globalAlpha = 0.18 + noise(i + 200) * 0.4;
          ctx.fillStyle = i % 3 === 0 ? "#FF5C77" : "#FF9A3D";
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
      y += u * 0.238;
      ctx.font = serif(700, scoreSize);
      if (tone === "calm") {
        ctx.fillStyle = "#5C5049";
      } else {
        const sg = ctx.createLinearGradient(
          cx - u * 0.2,
          y - scoreSize,
          cx + u * 0.2,
          y,
        );
        sg.addColorStop(0, "#FF9A3D");
        sg.addColorStop(1, purple ? "#8B5CF6" : "#FF4E73");
        ctx.fillStyle = sg;
      }
      center(String(data.score), y);

      // ---------------------------------------------------- VIBE SCORE
      y += u * 0.075;
      ctx.fillStyle = tone === "calm" ? "#8A7F76" : "#E0567A";
      ctx.font = sans(700, u * 0.035);
      ctx.letterSpacing = `${u * 0.016}px`;
      center("VIBE SCORE", y);
      ctx.letterSpacing = "0px";
    } else {
      y += u * 0.03;
    }

    // ----------------------------------------------------------- mood line
    y += u * 0.072;
    const moodText = !showScore
      ? "People see me as"
      : data.percentile && data.score >= 80
        ? `Top ${data.percentile}% of users`
        : tone === "celebratory"
          ? "Standout profile"
          : tone === "warm"
            ? "Growing strong"
            : "Room to grow";

    ctx.font = sans(600, u * 0.042);
    const mw = ctx.measureText(moodText).width;
    const badgeR = u * 0.026;
    const moodStart = cx - (mw + badgeR * 2 + u * 0.022) / 2;

    ctx.beginPath();
    ctx.arc(moodStart + badgeR, y - u * 0.013, badgeR, 0, Math.PI * 2);
    ctx.fillStyle =
      tone === "calm" ? "rgba(31,31,31,0.06)" : "rgba(255,138,61,0.17)";
    ctx.fill();
    ctx.font = sans(400, u * 0.027);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = tone === "calm" ? "#9A8E84" : "#FF6B3D";
    ctx.fillText(
      tone === "calm" ? "↗" : data.percentile && data.score >= 80 ? "★" : "✦",
      moodStart + badgeR,
      y - u * 0.012,
    );
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";

    ctx.font = sans(600, u * 0.042);
    ctx.fillStyle = tone === "calm" ? "#6B6B6B" : "#C4405F";
    ctx.fillText(moodText, moodStart + badgeR * 2 + u * 0.022, y);

    // --------------------------------------------------------- trait pills
    y += u * 0.078;
    const pillH = u * 0.096;
    const pillGap = u * 0.026;
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
          tone === "calm" ? "rgba(31,31,31,0.035)" : "rgba(255,255,255,0.6)";
        ctx.strokeStyle =
          tone === "calm" ? "rgba(31,31,31,0.10)" : "rgba(255,138,61,0.4)";
        ctx.lineWidth = u * 0.0035;
        roundRect(ctx, x, y, widths[i], pillH, pillH / 2);
        ctx.fill();
        ctx.stroke();

        const ink = tone === "calm" ? "#6A5C53" : "#D2543F";
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
    const footY = cardY + cardH - u * 0.1;
    ctx.strokeStyle = "rgba(31,31,31,0.08)";
    ctx.lineWidth = u * 0.003;
    ctx.beginPath();
    ctx.moveTo(cardX + u * 0.1, footY - u * 0.07);
    ctx.lineTo(cardX + cardW - u * 0.1, footY - u * 0.07);
    ctx.stroke();

    // Stand-in avatars: raters are anonymous by design, so these are
    // decorative silhouettes — never the actual people who rated you.
    const stackR = u * 0.032;
    const shown = Math.min(3, data.ratingCount);
    ctx.font = sans(500, u * 0.039);
    const labelW = ctx.measureText(`Rated by ${data.ratingCount} people`).width;
    const stackW = shown > 0 ? stackR * 2 + (shown - 1) * stackR * 1.25 : 0;
    let sx = cx - (stackW + labelW + u * 0.035) / 2 + stackR;

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
      pg.addColorStop(0, ["#FFD3B0", "#FFC1CE", "#E4D6FF"][i % 3]);
      pg.addColorStop(1, ["#FFB98A", "#FFA5B8", "#CFC0FF"][i % 3]);
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
    const textX = shown > 0 ? sx + stackR * 0.55 : cx - labelW / 2;
    ctx.font = sans(500, u * 0.039);
    ctx.fillStyle = "#6B6B6B";
    ctx.fillText("Rated by ", textX, footY);
    const byW = ctx.measureText("Rated by ").width;
    ctx.font = sans(800, u * 0.039);
    ctx.fillStyle = "#241F1B";
    ctx.fillText(`${data.ratingCount}`, textX + byW, footY);
    const nW = ctx.measureText(`${data.ratingCount}`).width;
    ctx.font = sans(500, u * 0.039);
    ctx.fillStyle = "#6B6B6B";
    ctx.fillText(" people", textX + byW + nW, footY);
    ctx.textBaseline = "alphabetic";

    ctx.restore(); // end card clip

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
  }, [data, format, theme, showScore, photoReady]);

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
    // Redraw once the webfonts land, so the export uses Inter + Playfair
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
    setStatus("Kart indirildi 🎉");
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
          text: `People see me as ${data.tags
            .slice(0, 3)
            .map((t) => t.label)
            .join(", ")} — Vibe Tag`,
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
        <p className="text-[12px] font-extrabold text-muted mb-2 ml-1">FORMAT</p>
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
                {FORMATS[k].label}
              </span>
              <span className="block text-[10.5px] text-muted mt-0.5">
                {FORMATS[k].hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[12px] font-extrabold text-muted mb-2 ml-1">TEMA</p>
        <div className="flex gap-2.5">
          {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setTheme(k)}
              aria-label={THEMES[k].label}
              className="flex-1 rounded-2xl p-1.5 transition-transform active:scale-95"
              style={{
                border: theme === k ? "2px solid #FF5C77" : "1px solid #F0E5DD",
                background: "#FFF8F5",
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
          Auto, kartın tonunu skoruna göre seçer — yüksek skor ışıldar, sakin
          skor zarif ve dingin kalır.
        </p>
      </div>

      <label className="mt-5 flex items-center gap-3 card p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={showScore}
          onChange={(e) => setShowScore(e.target.checked)}
          className="w-5 h-5 accent-[#FF5C77]"
        />
        <span>
          <span className="block text-[13.5px] font-bold">Skoru göster</span>
          <span className="block text-[12px] text-muted">
            Kapatırsan kartta sadece etiketlerin görünür.
          </span>
        </span>
      </label>

      <div className="mt-5 grid gap-2.5">
        <button
          onClick={share}
          className="h-13 rounded-full grad-score text-white font-bold text-[15px] shadow-[0_10px_30px_rgba(255,92,119,0.35)] active:scale-[0.98] transition-transform"
        >
          Paylaş
        </button>
        <button
          onClick={download}
          className="h-13 rounded-full bg-white border border-line font-bold text-[15px] active:scale-[0.98] transition-transform"
        >
          PNG indir ({f.w}×{f.h})
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

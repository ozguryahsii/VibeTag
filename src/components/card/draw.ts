import { iconFor } from "@/lib/icons";
import { bandFor, type CardBand } from "@/lib/card-bands";
import { fill, type Dictionary } from "@/lib/i18n";
import { initialsOf } from "@/components/Avatar";
import { SCENES } from "@/components/card/scenes";
import type { Scene } from "@/components/card/scene";
import type { BadgeTier } from "@/lib/badges";
import { TIER_STYLE } from "@/lib/tier-style";
import { fingerprint, icon, noise, roundRect, shade } from "@/components/card/paint";

/**
 * The Vibe Card composition.
 *
 * Written once and identical for every score. What changes with the score is
 * the scene — the page behind the card, the surface inside it, anything thrown
 * over the top, and the colours this file paints with. See `scene.ts`.
 *
 * The card is drawn on a real canvas at full export resolution, so the preview
 * is pixel-for-pixel what gets shared. No html2canvas, no screenshotting — the
 * growth loop should not be flaky.
 */

export type CardData = {
  name: string;
  username: string;
  score: number;
  ratingCount: number;
  percentile: number | null;
  tags: { key: string; label: string }[];
  /** Best tier per family, best first — already trimmed by the page. */
  badges: { key: string; label: string; icon: string; tier: BadgeTier }[];
  avatarUrl: string | null;
  avatarColor: string;
};

export const FORMATS = {
  story: { w: 1080, h: 1920, labelKey: "formatStory", hint: "Instagram · TikTok" },
  square: { w: 1080, h: 1080, labelKey: "formatSquare", hint: "Instagram · WhatsApp" },
  wide: { w: 1600, h: 900, labelKey: "formatWide", hint: "X · LinkedIn" },
} as const;

export type FormatKey = keyof typeof FORMATS;

export type DrawOptions = {
  ctx: CanvasRenderingContext2D;
  data: CardData;
  format: FormatKey;
  showScore: boolean;
  showBadges: boolean;
  photo: HTMLImageElement | null;
  d: Dictionary;
};

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

/** One colour paints flat; several become a gradient along the given line. */
function paintOf(
  ctx: CanvasRenderingContext2D,
  stops: string[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): string | CanvasGradient {
  if (stops.length === 1) return stops[0];
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  return g;
}

/** Which design a score gets. Exported so the studio can name it on screen. */
export function sceneFor(score: number): { band: CardBand; scene: Scene } {
  const band = bandFor(score);
  return { band, scene: SCENES[band.key] };
}

export function drawCard({
  ctx,
  data,
  format,
  showScore,
  showBadges,
  photo,
  d,
}: DrawOptions): void {
  const { w, h } = FORMATS[format];
  ctx.canvas.width = w;
  ctx.canvas.height = h;

  const { scene } = sceneFor(data.score);
  const p = scene.palette;

  // ------------------------------------------------------------- geometry
  const isWide = format === "wide";
  const margin = isWide ? h * 0.07 : w * 0.07;
  const cardW = isWide ? w * 0.5 : w - margin * 2;
  const cardX = (w - cardW) / 2;

  // Badges buy their own room rather than squeezing the rest: without the
  // extra ratio the medal row lands on the footer rule and silently drops
  // itself, which looks exactly like a broken toggle.
  const medals = showBadges ? data.badges.slice(0, 3) : [];
  const designRatio = 1.65 + (medals.length > 0 ? 0.15 : 0);
  const cardH = isWide
    ? h - margin * 2
    : Math.min(h - margin * 2.4, cardW * designRatio);
  const cardY = (h - cardH) / 2 - (isWide ? 0 : h * 0.012);
  const radius = cardW * 0.07;
  // Portrait uses the card width as its design unit. Square and wide cards are
  // height-constrained, so the same composition scales down intact instead of
  // letting the score or footer escape the rounded surface.
  const u = Math.min(cardW, cardH / designRatio);
  const cx = cardX + cardW / 2;

  const geom = { ctx, w, h, cardX, cardY, cardW, cardH, radius, cx, u };

  // ------------------------------------------------------------- backdrop
  scene.backdrop(geom);

  // ---------------------------------------------------------------- card
  ctx.save();
  ctx.shadowColor = p.shadow;
  ctx.shadowBlur = u * 0.13;
  ctx.shadowOffsetY = u * 0.035;
  ctx.fillStyle = p.card;
  roundRect(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.clip();
  scene.surface(geom);

  // --------------------------------------------------- fingerprint watermark
  fingerprint(
    ctx,
    cardX + cardW - u * 0.19,
    cardY + u * 0.06,
    u * 0.13,
    p.mark,
    p.markAlpha,
  );

  const center = (text: string, cy: number) => {
    ctx.textAlign = "center";
    ctx.fillText(text, cx, cy);
    ctx.textAlign = "left";
  };

  // ---------------------------------------------------------------- avatar
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
  if (photo && photo.complete && photo.naturalWidth > 0) {
    const s = Math.max((ar * 2) / photo.naturalWidth, (ar * 2) / photo.naturalHeight);
    const iw = photo.naturalWidth * s;
    const ih = photo.naturalHeight * s;
    ctx.drawImage(photo, cx - iw / 2, y - ih / 2, iw, ih);
  } else {
    const tint = p.avatarTint ?? data.avatarColor;
    const ag = ctx.createLinearGradient(cx - ar, y - ar, cx + ar, y + ar);
    ag.addColorStop(0, `${tint}2E`);
    ag.addColorStop(1, `${tint}17`);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(cx - ar, y - ar, ar * 2, ar * 2);
    ctx.fillStyle = ag;
    ctx.fillRect(cx - ar, y - ar, ar * 2, ar * 2);
    ctx.fillStyle = shade(tint, -22);
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
  ctx.strokeStyle = paintOf(ctx, p.avatarRing, cx - ar, y - ar, cx + ar, y + ar);
  ctx.lineWidth = u * (p.avatarRing.length > 1 ? 0.008 : 0.006);
  ctx.stroke();

  // ------------------------------------------------------------------ name
  y += ar + u * 0.075;
  ctx.fillStyle = p.ink;
  ctx.font = sans(600, u * 0.068);
  center(data.name, y);

  // --------------------------------------------------------------- divider
  y += u * 0.055;
  const dw = u * 0.11;
  ctx.strokeStyle = p.divider;
  ctx.lineWidth = u * 0.002;
  ctx.beginPath();
  ctx.moveTo(cx - dw, y);
  ctx.lineTo(cx - u * 0.022, y);
  ctx.moveTo(cx + u * 0.022, y);
  ctx.lineTo(cx + dw, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, y, u * 0.007, 0, Math.PI * 2);
  ctx.fillStyle = p.accent;
  ctx.fill();

  // -------------------------------------------------------------- MY VIBE
  y += u * 0.075;
  ctx.fillStyle = p.accent;
  ctx.font = sans(600, u * 0.04);
  ctx.letterSpacing = `${u * 0.0155}px`;
  center("MY VIBE", y);
  ctx.letterSpacing = "0px";

  if (showScore) {
    const scoreSize = u * 0.39;
    const scoreCy = y + u * 0.22;

    // ------------------------------------------------------------- rays
    if (p.rays) {
      const { stroke, embers, count } = p.rays;
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.lineCap = "round";
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + 0.12;
        const inner = u * (0.27 + noise(i) * 0.025);
        const outer = inner + u * (0.045 + noise(i + 40) * 0.035);
        ctx.globalAlpha = 0.28 + noise(i + 7) * 0.42;
        ctx.lineWidth = u * 0.003;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, scoreCy + Math.sin(a) * inner * 0.8);
        ctx.lineTo(cx + Math.cos(a) * outer, scoreCy + Math.sin(a) * outer * 0.8);
        ctx.stroke();
      }
      for (let i = 0; i < count - 2; i++) {
        const a = noise(i + 90) * Math.PI * 2;
        const dist = u * (0.22 + noise(i + 130) * 0.16);
        const sy = scoreCy + Math.sin(a) * dist * 0.82;
        // keep the label band clear
        if (sy > scoreCy + u * 0.12) continue;
        ctx.globalAlpha = 0.18 + noise(i + 200) * 0.4;
        ctx.fillStyle = i % 3 === 0 ? embers[0] : embers[1];
        ctx.beginPath();
        ctx.arc(
          cx + Math.cos(a) * dist,
          sy,
          u * (0.0025 + noise(i + 300) * 0.003),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.restore();
    }

    // ------------------------------------------------------------ score
    y += u * 0.31;
    ctx.font = serif(400, scoreSize);
    ctx.fillStyle = paintOf(
      ctx,
      p.score,
      cx - u * 0.2,
      y - scoreSize,
      cx + u * 0.2,
      y,
    );
    center(String(data.score), y);

    // ------------------------------------------------------- VIBE SCORE
    // Cleared of the numeral rather than tucked under it: Didot and its
    // fallbacks draw old-style figures, so 2, 5, 7 and 9 hang below the
    // baseline and would otherwise cross the label.
    y += u * 0.1;
    ctx.fillStyle = p.accent;
    ctx.font = sans(600, u * 0.0365);
    ctx.letterSpacing = `${u * 0.0135}px`;
    center("VIBE SCORE", y);
    ctx.letterSpacing = "0px";
  } else {
    y += u * 0.03;
  }

  // -------------------------------------------------------------- mood line
  y += u * 0.085;
  const moodText = !showScore
    ? d.card.seeMeAs
    : data.percentile && data.score >= 80
      ? fill(d.card.moodTop, { n: data.percentile })
      : data.score >= 85
        ? d.card.moodStandout
        : data.score >= 72
          ? d.card.moodGrowing
          : d.card.moodRoom;

  ctx.font = sans(600, u * 0.0445);
  const mw = ctx.measureText(moodText).width;
  const glyphR = u * 0.026;
  const moodStart = cx - (mw + glyphR * 2 + u * 0.022) / 2;

  ctx.beginPath();
  ctx.arc(moodStart + glyphR, y - u * 0.013, glyphR, 0, Math.PI * 2);
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = u * 0.0025;
  ctx.stroke();
  ctx.font = sans(400, u * 0.027);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = p.accent;
  ctx.fillText(p.moodGlyph, moodStart + glyphR, y - u * 0.012);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  ctx.font = sans(500, u * 0.0445);
  ctx.fillStyle = p.accent;
  ctx.fillText(moodText, moodStart + glyphR * 2 + u * 0.022, y);

  // ------------------------------------------------------------ trait pills
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

  // Fixed grid: everything in one row if it fits, otherwise pairs. Capping at
  // two rows keeps the pills from ever running into the footer rule — long
  // labels shrink the type instead of adding a third row.
  const oneRow =
    widths.reduce((a, b) => a + b, 0) + pillGap * (chosen.length - 1) <= limit;
  const rows: number[][] = oneRow
    ? [chosen.map((_, i) => i)]
    : chosen.reduce<number[][]>((acc, _, i) => {
        if (i % 2 === 0) acc.push([i]);
        else acc[acc.length - 1].push(i);
        return acc;
      }, []);

  if (rows.length > 0) {
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
  }

  for (const r of rows) {
    const total = r.reduce((a, i) => a + widths[i], 0) + pillGap * (r.length - 1);
    let x = cx - total / 2;
    for (const i of r) {
      const t = chosen[i];
      ctx.fillStyle = p.pillFill;
      ctx.strokeStyle = p.pillBorder;
      ctx.lineWidth = u * 0.0025;
      roundRect(ctx, x, y, widths[i], pillH, pillH / 2);
      ctx.fill();
      ctx.stroke();

      icon(
        ctx,
        iconFor(t.key),
        x + u * 0.03 + iconBox() / 2,
        y + pillH / 2,
        iconBox(),
        p.pillInk,
      );
      ctx.font = sans(600, pillFont);
      ctx.fillStyle = p.pillInk;
      ctx.textBaseline = "middle";
      ctx.fillText(t.label, x + u * 0.03 + iconBox() + u * 0.022, y + pillH / 2);
      ctx.textBaseline = "alphabetic";

      x += widths[i] + pillGap;
    }
    y += pillH + pillGap * 0.7;
  }

  // ------------------------------------------------------------ footer lines
  const footY = cardY + cardH - u * 0.14;
  const footLineY = cardY + cardH - u * 0.25;

  // ----------------------------------------------------------- badge medals
  const medalR = u * 0.052;
  const medalBlock = medalR * 2 + u * 0.055;

  if (medals.length > 0) {
    const gap = u * 0.075;
    const step = medalR * 2 + gap;
    const startX = cx - (step * medals.length - gap) / 2 + medalR;
    // The card already grew to make room (see designRatio), so the row is
    // placed rather than conditionally skipped — a toggle that silently does
    // nothing is worse than a slightly tighter card. The clamp is the last
    // defence: whatever the pills did above, the medals stay off the rule.
    const top = Math.min(y, footLineY - medalBlock - u * 0.02);
    const my = top + medalR + u * 0.005;

    for (let i = 0; i < medals.length; i++) {
      const m = medals[i];
      const [from, to] = TIER_STYLE[m.tier].canvas;
      const mx = startX + i * step;

      const mg = ctx.createLinearGradient(
        mx - medalR,
        my - medalR,
        mx + medalR,
        my + medalR,
      );
      mg.addColorStop(0, from);
      mg.addColorStop(1, to);

      ctx.beginPath();
      ctx.arc(mx, my, medalR, 0, Math.PI * 2);
      ctx.fillStyle = mg;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = u * 0.005;
      ctx.stroke();

      // The glyph never changes between tiers — only the metal does.
      icon(ctx, iconFor(m.icon), mx, my, medalR * 1.05, "#FFFFFF");

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = sans(700, u * 0.026);
      ctx.fillStyle = p.ink;
      ctx.fillText(m.label, mx, my + medalR + u * 0.032, step - u * 0.012);
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
    }

    y = top + medalBlock;
  }

  // ----------------------------------------------------------- rater footer
  ctx.strokeStyle = p.rule;
  ctx.lineWidth = u * 0.003;
  ctx.beginPath();
  ctx.moveTo(cardX + u * 0.09, footLineY);
  ctx.lineTo(cardX + cardW - u * 0.09, footLineY);
  ctx.stroke();

  // Stand-in avatars: raters are anonymous by design, so these are decorative
  // silhouettes — never the actual people who rated you.
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
    const [from, to] = p.raterStack[i % p.raterStack.length];
    const pg = ctx.createLinearGradient(
      sx - stackR,
      footY - stackR,
      sx + stackR,
      footY + stackR,
    );
    pg.addColorStop(0, from);
    pg.addColorStop(1, to);
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
  ctx.fillStyle = p.inkSoft;
  ctx.fillText(d.common.ratedBy, textX, footY - u * 0.022);
  ctx.font = sans(500, u * 0.045);
  ctx.fillStyle = p.ink;
  ctx.fillText(`${data.ratingCount} ${d.common.people}`, textX, footY + u * 0.028);
  ctx.textBaseline = "alphabetic";

  ctx.restore(); // end card clip

  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.strokeStyle = p.border;
  ctx.lineWidth = u * 0.003;
  ctx.stroke();
  ctx.restore();

  // Anything that belongs in front of the card — bursts, confetti.
  scene.overlay?.(geom);

  // ----------------------------------------------------------- outer branding
  ctx.textAlign = "center";
  ctx.fillStyle = p.brand;
  ctx.font = sans(800, u * 0.031);
  ctx.letterSpacing = `${u * 0.01}px`;
  ctx.fillText("VIBE TAG", cx, cardY + cardH + margin * 0.62);
  ctx.letterSpacing = "0px";
  ctx.font = sans(500, u * 0.027);
  ctx.fillStyle = p.inkSoft;
  ctx.fillText(`@${data.username}`, cx, cardY + cardH + margin * 0.95);
  ctx.textAlign = "left";
}

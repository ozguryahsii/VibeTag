"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The editorial Vibe Score reveal. The approved card treats the score as a
 * story, not a dashboard gauge: a quiet number at the low end, subtle rays
 * and warm colour at the celebratory end.
 */
export function ScoreDial({
  score,
  label = "VIBE SCORE",
  caption,
  size = 236,
}: {
  score: number;
  label?: string;
  caption?: string;
  size?: number;
}) {
  const [shown, setShown] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(score);
      return;
    }
    const start = performance.now();
    const duration = 1400;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setShown(Math.round(eased * score));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [score]);

  const celebratory = score >= 85;
  const calm = score < 72;
  const accent = calm ? "#A67A3D" : "#F05262";

  return (
    <div
      className="relative grid place-items-center text-center"
      style={{ width: size, height: size, maxWidth: "100%" }}
      aria-label={`${label}: ${score}`}
    >
      {celebratory && (
        <svg
          viewBox="0 0 236 236"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <g
            fill="none"
            strokeLinecap="round"
            strokeWidth="2.2"
            opacity="0.54"
          >
            <path d="M34 114H8M42 84 18 71M58 59 40 37M82 43 72 20M202 114h26M194 84l24-13M178 59l18-22M154 43l10-23" stroke="#F1A33E" />
            <path d="M39 135 14 141M47 101 23 95M197 101l22-6M198 135l24 6M58 178l-18 21M178 178l18 21" stroke="#ED5B62" />
          </g>
          <g fill="#F2A03F" opacity="0.66">
            <circle cx="24" cy="163" r="2" />
            <circle cx="211" cy="162" r="2.2" />
            <circle cx="47" cy="51" r="1.7" />
            <circle cx="191" cy="51" r="1.7" />
          </g>
          <g fill="#F05262" opacity="0.62">
            <circle cx="18" cy="124" r="1.7" />
            <circle cx="219" cy="124" r="1.7" />
            <circle cx="73" cy="29" r="1.4" />
            <circle cx="165" cy="29" r="1.4" />
          </g>
        </svg>
      )}

      <div className="relative z-10 flex flex-col items-center">
        <div
          className="font-semibold text-muted"
          style={{
            fontSize: Math.max(10, size * 0.047),
            letterSpacing: "0.34em",
            lineHeight: 1,
            paddingLeft: "0.34em",
          }}
        >
          MY VIBE
        </div>
        {/* line-height 1, not 0.8: Android's WebView paints gradient text
            (background-clip: text) only inside the line box when an ancestor
            clips — the profile card is overflow-hidden — so the tight line
            box swallowed the digits' top and bottom. The extra height is
            taken back with margins, and translateZ lifts the element onto
            its own layer, clear of the ancestor's clip. */}
        <div
          className={calm ? "tabular-nums" : "grad-text tabular-nums"}
          style={{
            marginTop: size * 0.035 - size * 0.04,
            marginBottom: -size * 0.04,
            color: calm ? "#4C3D33" : undefined,
            fontFamily: "var(--font-score)",
            fontSize: size * 0.4,
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: "-0.055em",
            paddingRight: "0.045em",
            transform: "translateZ(0)",
          }}
        >
          {shown}
        </div>
        <div
          className={calm ? "font-semibold text-muted" : "font-semibold text-coral"}
          style={{
            marginTop: size * 0.055,
            fontSize: Math.max(10, size * 0.047),
            letterSpacing: "0.28em",
            lineHeight: 1,
            paddingLeft: "0.28em",
          }}
        >
          {label}
        </div>
        {caption && (
          <div
            className="mt-3 inline-flex items-center justify-center gap-2 font-medium"
            style={{ color: accent, fontSize: Math.max(12, size * 0.053) }}
          >
            <span
              className="inline-grid place-items-center rounded-full border"
              style={{ width: 24, height: 24, borderColor: accent }}
              aria-hidden="true"
            >
              {celebratory ? "★" : "↗"}
            </span>
            <span>{caption}</span>
          </div>
        )}
      </div>
    </div>
  );
}

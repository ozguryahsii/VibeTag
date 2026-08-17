import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { TagIcon } from "@/components/Icon";

export { Avatar, AnonStack, initialsOf } from "@/components/Avatar";

// -------------------------------------------------------------- pill

export function TagPill({
  emoji,
  tagKey,
  label,
  count,
  size = "md",
  tone = "warm",
}: {
  /** Fallback glyph for things that are not Vibe Tags (badges, etc). */
  emoji?: string;
  /** Vibe Tag key — renders the line icon from the shared icon set. */
  tagKey?: string;
  label: string;
  count?: number;
  size?: "sm" | "md";
  tone?: "warm" | "purple" | "solid";
}) {
  const tones = {
    warm: { bg: "#EEE4D5", fg: "#967043", bd: "#E4D7C8" },
    purple: { bg: "rgba(255,249,235,0.76)", fg: "#D65B74", bd: "#F0C298" },
    solid: { bg: "rgba(255,255,255,0.18)", fg: "#fff", bd: "rgba(255,255,255,0.35)" },
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${
        size === "sm" ? "px-2.5 py-1 text-[12px]" : "px-3.5 py-2 text-[13px]"
      }`}
      style={{
        background: tones.bg,
        color: tones.fg,
        border: `1px solid ${tones.bd}`,
        boxShadow: tone === "purple" ? "0 4px 9px rgba(221,105,55,.1)" : undefined,
      }}
    >
      {tagKey ? (
        <TagIcon tagKey={tagKey} size={size === "sm" ? 14 : 16} />
      ) : (
        <span aria-hidden>{emoji}</span>
      )}
      <span>{label}</span>
      {count !== undefined && (
        <span className="opacity-60 font-bold tabular-nums">{count}</span>
      )}
    </span>
  );
}

// -------------------------------------------------------------- card

export function Card({
  children,
  className = "",
  padded = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  /** For tints a utility class cannot carry — badge tier colours, say. */
  style?: CSSProperties;
}) {
  return (
    <div className={`card ${padded ? "p-5" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-3 px-1">
      <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-ink">
        {children}
      </h2>
      {action}
    </div>
  );
}

// ------------------------------------------------------------ button

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "premium" | "outline";
  full?: boolean;
  disabled?: boolean;
  className?: string;
};

const VARIANTS: Record<string, string> = {
  primary: "text-white grad-score shadow-[0_10px_28px_rgba(221,105,55,0.25)]",
  premium: "text-white grad-premium shadow-[0_10px_28px_rgba(216,89,121,0.24)]",
  ghost: "text-ink bg-warmwhite border border-line shadow-[0_5px_16px_rgba(83,60,40,0.06)]",
  outline: "text-orange bg-transparent border-2 border-orange/40",
};

export function Button({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  full,
  disabled,
  className = "",
}: ButtonProps) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full px-6 h-13 py-3.5 text-[15px] font-semibold transition-transform active:scale-[0.97] disabled:opacity-40 ${
    VARIANTS[variant]
  } ${full ? "w-full" : ""} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

// ------------------------------------------------------------- meter

export function Meter({
  value,
  tone = "warm",
}: {
  value: number; // 0..100
  tone?: "warm" | "purple";
}) {
  return (
    <div className="h-2 rounded-full bg-line overflow-hidden">
      <div
        className={`h-full rounded-full ${
          tone === "purple" ? "grad-premium" : "grad-score"
        }`}
        style={{ width: `${Math.max(3, Math.min(100, value))}%` }}
      />
    </div>
  );
}

// ------------------------------------------------------------- empty

export function EmptyState({
  emoji,
  title,
  body,
  action,
}: {
  emoji: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <Card className="text-center py-9">
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="font-extrabold text-[16px] mb-1.5">{title}</h3>
      <p className="text-[13px] text-muted leading-relaxed px-4 mb-4">{body}</p>
      {action}
    </Card>
  );
}

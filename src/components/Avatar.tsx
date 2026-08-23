/**
 * One avatar for the whole product.
 *
 * A real photo when the person uploaded one; otherwise a monogram on their
 * own warm gradient. Deliberately not emoji — the card has to hold up next
 * to a photo, and a monogram degrades gracefully where an emoji reads as a
 * placeholder.
 */

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase("tr-TR");
  return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase("tr-TR");
}

export function Avatar({
  name,
  url,
  color,
  size = 48,
  ring = false,
}: {
  name: string;
  url?: string | null;
  color: string;
  size?: number;
  ring?: boolean;
}) {
  const common: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: size,
    flexShrink: 0,
    boxShadow: ring
      ? `0 0 0 ${Math.max(2, size * 0.045)}px #fff, 0 0 0 ${Math.max(3.5, size * 0.075)}px rgba(239,118,72,.62), 0 7px 20px rgba(83,60,40,.13)`
      : undefined,
    outline: ring ? "none" : `1px solid ${color}26`,
    outlineOffset: 0,
  };

  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name}
        // Not draggable: the browser's own image drag hijacks the pointer
        // stream, which is what a swipeable row of photos runs on.
        draggable={false}
        style={{ ...common, objectFit: "cover" }}
        className="inline-block"
      />
    );
  }

  return (
    <span
      className="inline-grid place-items-center select-none"
      style={{
        ...common,
        background: `linear-gradient(145deg, ${color}, ${shade(color, -18)})`,
        color: "#fff",
        fontFamily: "var(--font-display)",
        fontSize: size * 0.4,
        letterSpacing: "0.01em",
      }}
    >
      {initialsOf(name)}
    </span>
  );
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

/** Anonymous stand-ins for the rater row — never real identities. */
export function AnonStack({
  count,
  size = 26,
}: {
  count: number;
  size?: number;
}) {
  const shown = Math.min(3, count);
  const tints = [
    ["#FFD3B0", "#FFB98A"],
    ["#FFC1CE", "#FFA5B8"],
    ["#E8DCC9", "#C8B79E"],
  ];
  return (
    <span className="inline-flex" style={{ paddingLeft: size * 0.25 }}>
      {Array.from({ length: shown }).map((_, i) => (
        <span
          key={i}
          className="inline-grid place-items-center"
          style={{
            width: size,
            height: size,
            borderRadius: size,
            marginLeft: -size * 0.25,
            background: `linear-gradient(145deg, ${tints[i % 3][0]}, ${tints[i % 3][1]})`,
            boxShadow: "0 0 0 2px #FFF8F5",
          }}
        >
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24">
            <circle cx="12" cy="8.4" r="4" fill="rgba(255,255,255,0.85)" />
            <path
              d="M3.6 22c0-4.6 3.8-7.6 8.4-7.6s8.4 3 8.4 7.6z"
              fill="rgba(255,255,255,0.85)"
            />
          </svg>
        </span>
      ))}
    </span>
  );
}

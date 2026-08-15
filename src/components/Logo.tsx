/**
 * "Vibe Fingerprint" — the brand mark.
 *
 * Fingerprint ridges (everyone's social trace is unique) wrapping a V
 * carved out of the middle, in the orange → coral → purple gradient.
 */
export function VibeMark({
  size = 32,
  id = "vibemark",
}: {
  size?: number;
  id?: string;
}) {
  const g = `${id}-grad`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={g} x1="8" y1="4" x2="56" y2="60">
          <stop offset="0%" stopColor="#FF8A3D" />
          <stop offset="55%" stopColor="#FF5C77" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* fingerprint ridges */}
      <g
        stroke={`url(#${g})`}
        strokeLinecap="round"
        fill="none"
        strokeWidth="3.4"
      >
        <path d="M6 34c0-14.4 11.6-26 26-26s26 11.6 26 26" opacity="0.32" />
        <path d="M13 36c0-10.5 8.5-19 19-19s19 8.5 19 19" opacity="0.5" />
        <path d="M20 38c0-6.6 5.4-12 12-12s12 5.4 12 12" opacity="0.72" />
      </g>

      {/* the V */}
      <path
        d="M20 27l12 27 12-27"
        stroke={`url(#${g})`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <VibeMark size={size + 8} />
      <span
        className="font-extrabold tracking-tight"
        style={{ fontSize: size, letterSpacing: "-0.02em" }}
      >
        Vibe<span className="grad-text">Tag</span>
      </span>
    </span>
  );
}

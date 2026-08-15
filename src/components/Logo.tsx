/** The approved Vibe Tag fingerprint, shared with the launch artwork. */
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
      viewBox="-8 0 96 96"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={g}
          x1="5"
          y1="18"
          x2="76"
          y2="68"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FF9B3F" />
          <stop offset="0.48" stopColor="#FF705C" />
          <stop offset="1" stopColor="#F1436D" />
        </linearGradient>
      </defs>
      <g
        stroke={`url(#${g})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeWidth="3.7"
      >
        <path d="M8.5 27C15 13 27 5.5 40 5.5S66 13.5 72 28" />
        <path d="M4.5 52V43C4.5 24 20 12.5 40 12.5S75.5 25 75.5 44V52" />
        <path d="M13.5 63V44C13.5 29 24.8 20 40 20S66.8 30 66.8 45.5V63" />
        <path d="M22.7 73.5V46C22.7 34.7 29.9 27.6 40.1 27.6 51.3 27.6 59 35.4 59 47V64.5" />
        <path d="M40.6 35.2C33.4 35.2 29.3 40.3 29.3 47.5 29.3 58.3 34.2 76.9 38.5 88.7 40 92.9 44.3 93 46 88.8 50.5 77.6 55.7 59.2 55.7 47.6 55.7 40 49.9 35.2 40.6 35.2Z" />
      </g>
    </svg>
  );
}

export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <VibeMark size={size + 10} />
      <span
        className="font-brand font-extrabold text-brandink"
        style={{ fontSize: size, letterSpacing: "-0.055em", lineHeight: 1 }}
      >
        Vibe Tag
      </span>
    </span>
  );
}

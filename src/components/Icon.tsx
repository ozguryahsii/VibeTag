import { iconFor, traitIconFor, type IconDef } from "@/lib/icons";

export function TagIcon({
  tagKey,
  size = 16,
  color = "currentColor",
  strokeWidth = 1.9,
}: {
  tagKey: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return <IconGlyph def={iconFor(tagKey)} size={size} color={color} strokeWidth={strokeWidth} />;
}

export function TraitIcon({
  traitKey,
  size = 16,
  color = "currentColor",
  strokeWidth = 1.9,
}: {
  traitKey: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <IconGlyph
      def={traitIconFor(traitKey)}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
    />
  );
}

export function IconGlyph({
  def,
  size = 16,
  color = "currentColor",
  strokeWidth = 1.9,
}: {
  def: IconDef;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {def.paths?.map((d, i) => (
        <path key={`p${i}`} d={d} />
      ))}
      {def.circles?.map(([cx, cy, r], i) => (
        <circle key={`c${i}`} cx={cx} cy={cy} r={r} />
      ))}
      {def.fills?.map((d, i) => (
        <path key={`f${i}`} d={d} fill={color} stroke="none" />
      ))}
    </svg>
  );
}

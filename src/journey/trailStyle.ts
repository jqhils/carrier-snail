export type TrailLineProperties = {
  casingColor: string;
  highlightColor: string;
  lineColor: string;
};

export const REMAINING_PATH_STYLE = {
  casingColor: "rgba(253, 246, 233, 0.72)",
  casingWidth: 7,
  lineColor: "rgba(111, 102, 128, 0.78)",
  lineDasharray: [2, 3],
  lineWidth: 3
};

const CASING_COLOR = { blue: 233, green: 246, red: 253 };
const HIGHLIGHT_COLOR = { blue: 233, green: 246, red: 253 };
const PALE_TRAIL_TINT = { blue: 54, green: 35, red: 42 };
const PALE_LUMINANCE_THRESHOLD = 0.75;
const PALE_TINT_MIX = 0.45;

export function buildTrailLineProperties({
  segmentOpacity,
  speciesTrailColor
}: {
  segmentOpacity: number;
  speciesTrailColor: string;
}): TrailLineProperties {
  const visibleColor = makeVisibleTrailColor(parseHexColor(speciesTrailColor));

  return {
    casingColor: rgba(CASING_COLOR, 0.88),
    highlightColor: rgba(HIGHLIGHT_COLOR, clamp(segmentOpacity * 0.31 + 0.2)),
    lineColor: rgba(visibleColor, clamp(segmentOpacity * 0.83 + 0.36))
  };
}

function makeVisibleTrailColor(color: RgbColor): RgbColor {
  if (relativeLuminance(color) <= PALE_LUMINANCE_THRESHOLD) {
    return color;
  }

  return mixColors(color, PALE_TRAIL_TINT, PALE_TINT_MIX);
}

function parseHexColor(hexColor: string): RgbColor {
  const normalized = hexColor.replace("#", "");

  return {
    blue: Number.parseInt(normalized.slice(4, 6), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    red: Number.parseInt(normalized.slice(0, 2), 16)
  };
}

function relativeLuminance({ blue, green, red }: RgbColor): number {
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
}

function mixColors(
  base: RgbColor,
  tint: RgbColor,
  tintWeight: number
): RgbColor {
  const baseWeight = 1 - tintWeight;

  return {
    blue: Math.round(base.blue * baseWeight + tint.blue * tintWeight),
    green: Math.round(base.green * baseWeight + tint.green * tintWeight),
    red: Math.round(base.red * baseWeight + tint.red * tintWeight)
  };
}

function rgba({ blue, green, red }: RgbColor, alpha: number): string {
  return `rgba(${red}, ${green}, ${blue}, ${roundAlpha(alpha)})`;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function roundAlpha(value: number): number {
  return Math.round(value * 100) / 100;
}

type RgbColor = {
  blue: number;
  green: number;
  red: number;
};

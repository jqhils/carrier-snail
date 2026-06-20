export type MapSkinId = "streets" | "outdoor" | "dark";

export type MapSkinOption = {
  description: string;
  id: MapSkinId;
  label: string;
};

export const DEFAULT_MAP_SKIN_ID: MapSkinId = "streets";
export const DEMO_MAP_STYLE_URL = "https://demotiles.maplibre.org/style.json";

export const MAP_SKIN_OPTIONS: MapSkinOption[] = [
  {
    description: "Clear streets and labels.",
    id: "streets",
    label: "Streets"
  },
  {
    description: "More terrain, parks, and water.",
    id: "outdoor",
    label: "Outdoor"
  },
  {
    description: "Dark backdrop for bright trails.",
    id: "dark",
    label: "Dark"
  }
];

const MAPTILER_STYLE_SLUGS: Record<MapSkinId, string> = {
  dark: "dataviz-dark",
  outdoor: "outdoor-v2",
  streets: "streets-v2"
};

export function buildMapStyleUrl({
  fallbackStyleUrl = DEMO_MAP_STYLE_URL,
  mapTilerKey,
  selectedSkinId
}: {
  fallbackStyleUrl?: string;
  mapTilerKey?: string;
  selectedSkinId: MapSkinId;
}): string {
  const trimmedKey = mapTilerKey?.trim();

  if (!trimmedKey) {
    return fallbackStyleUrl;
  }

  const slug = MAPTILER_STYLE_SLUGS[selectedSkinId];

  return `https://api.maptiler.com/maps/${slug}/style.json?key=${encodeURIComponent(
    trimmedKey
  )}`;
}

export function coerceMapSkinId(value: unknown): MapSkinId {
  return MAP_SKIN_OPTIONS.some((skin) => skin.id === value)
    ? (value as MapSkinId)
    : DEFAULT_MAP_SKIN_ID;
}

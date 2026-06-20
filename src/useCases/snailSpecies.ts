import type { JourneyQuirk } from "../journey/snailCrawl";
import type {
  SnailAppearanceTraits,
  SnailRarity,
  SnailSpeedBand,
  SnailTemperament,
  SnailTrailTraits
} from "./localCarrierState";

export type SnailSpeciesId =
  | "garden"
  | "barista"
  | "sydney-train"
  | "comp-sci"
  | "postal"
  | "uni-sydney"
  | "absent-father"
  | "red-bull"
  | "golden"
  | "backwards";

export type SnailSpecies = {
  appearanceTint: SnailAppearanceTraits;
  baseSpeedMetersPerHour: number;
  displayName: string;
  id: SnailSpeciesId;
  lore: string;
  quirk: JourneyQuirk;
  rarity: SnailRarity;
  reliability: number;
  speedBand: SnailSpeedBand;
  sprite: string;
  temperament: SnailTemperament;
  trail: SnailTrailTraits;
  trailColor: string;
};

export const SNAIL_SPECIES_CATALOG: SnailSpecies[] = [
  {
    appearanceTint: {
      bodyColor: "#d99f5f",
      shellColor: "#7b4b34"
    },
    baseSpeedMetersPerHour: 48,
    displayName: "Garden Snail",
    id: "garden",
    lore: "The steady starter. Unhurried, sincere, and never above the work.",
    quirk: "none",
    rarity: "common",
    reliability: 0.95,
    speedBand: "garden",
    sprite: "garden",
    temperament: "steady",
    trail: {
      color: "#f5f8ed",
      persistenceMs: 72 * 60 * 60 * 1000,
      texture: "glistening"
    },
    trailColor: "#f5f8ed"
  },
  {
    appearanceTint: {
      bodyColor: "#d2a167",
      shellColor: "#6d4a38"
    },
    baseSpeedMetersPerHour: 50,
    displayName: "Barista Snail",
    id: "barista",
    lore: "Runs on caffeine. Still slow enough to forget the order.",
    quirk: "napper",
    rarity: "common",
    reliability: 0.92,
    speedBand: "garden",
    sprite: "barista",
    temperament: "sleepy",
    trail: {
      color: "#d7b58b",
      persistenceMs: 72 * 60 * 60 * 1000,
      texture: "glistening"
    },
    trailColor: "#d7b58b"
  },
  {
    appearanceTint: {
      bodyColor: "#d3b97a",
      shellColor: "#516f8f"
    },
    baseSpeedMetersPerHour: 55,
    displayName: "Sydney Train Snail",
    id: "sydney-train",
    lore: "Always four minutes away, even when it has not left.",
    quirk: "napper",
    rarity: "uncommon",
    reliability: 0.84,
    speedBand: "steady",
    sprite: "sydney-train",
    temperament: "sleepy",
    trail: {
      color: "#88a86b",
      persistenceMs: 84 * 60 * 60 * 1000,
      texture: "glistening"
    },
    trailColor: "#88a86b"
  },
  {
    appearanceTint: {
      bodyColor: "#c7b68a",
      shellColor: "#465870"
    },
    baseSpeedMetersPerHour: 54,
    displayName: "Comp Sci Student Snail",
    id: "comp-sci",
    lore: "Code over sleep. Sleep still wins most sprints.",
    quirk: "napper",
    rarity: "uncommon",
    reliability: 0.82,
    speedBand: "steady",
    sprite: "comp-sci",
    temperament: "sleepy",
    trail: {
      color: "#7ea0a4",
      persistenceMs: 84 * 60 * 60 * 1000,
      texture: "misty"
    },
    trailColor: "#7ea0a4"
  },
  {
    appearanceTint: {
      bodyColor: "#d7b886",
      shellColor: "#5e7650"
    },
    baseSpeedMetersPerHour: 57,
    displayName: "Postal Snail",
    id: "postal",
    lore: "A born carrier with a tiny route and a solemn oath.",
    quirk: "none",
    rarity: "uncommon",
    reliability: 0.9,
    speedBand: "steady",
    sprite: "postal",
    temperament: "steady",
    trail: {
      color: "#88a86b",
      persistenceMs: 84 * 60 * 60 * 1000,
      texture: "glistening"
    },
    trailColor: "#88a86b"
  },
  {
    appearanceTint: {
      bodyColor: "#c6b98f",
      shellColor: "#365c8d"
    },
    baseSpeedMetersPerHour: 63,
    displayName: "University of Sydney Snail",
    id: "uni-sydney",
    lore: "Sandstone and deadlines. Mostly sandstone, given the pace.",
    quirk: "scenic-detour",
    rarity: "rare",
    reliability: 0.78,
    speedBand: "swift",
    sprite: "uni-sydney",
    temperament: "wanderer",
    trail: {
      color: "#4b8f8c",
      persistenceMs: 96 * 60 * 60 * 1000,
      texture: "misty"
    },
    trailColor: "#4b8f8c"
  },
  {
    appearanceTint: {
      bodyColor: "#c8b08b",
      shellColor: "#386c73"
    },
    baseSpeedMetersPerHour: 65,
    displayName: "Absent Father Snail",
    id: "absent-father",
    lore: "Went out for milk. Reports suggest an 8 km head start.",
    quirk: "scenic-detour",
    rarity: "rare",
    reliability: 0.72,
    speedBand: "swift",
    sprite: "absent-father",
    temperament: "wanderer",
    trail: {
      color: "#5f9c9a",
      persistenceMs: 96 * 60 * 60 * 1000,
      texture: "misty"
    },
    trailColor: "#5f9c9a"
  },
  {
    appearanceTint: {
      bodyColor: "#e6cf8e",
      shellColor: "#5d4e9a"
    },
    baseSpeedMetersPerHour: 78,
    displayName: "Red Bull Snail",
    id: "red-bull",
    lore: "Gives a snail wings. The wings also crawl.",
    quirk: "none",
    rarity: "mythic",
    reliability: 0.9,
    speedBand: "mythic",
    sprite: "red-bull",
    temperament: "steady",
    trail: {
      color: "#d6b94c",
      persistenceMs: 144 * 60 * 60 * 1000,
      texture: "sparkling"
    },
    trailColor: "#d6b94c"
  },
  {
    appearanceTint: {
      bodyColor: "#e7d8a1",
      shellColor: "#b98d2d"
    },
    baseSpeedMetersPerHour: 82,
    displayName: "Golden Shell Snail",
    id: "golden",
    lore: "Shimmering, prized, and contractually unable to hurry.",
    quirk: "none",
    rarity: "mythic",
    reliability: 0.93,
    speedBand: "mythic",
    sprite: "golden",
    temperament: "steady",
    trail: {
      color: "#e0c85a",
      persistenceMs: 144 * 60 * 60 * 1000,
      texture: "sparkling"
    },
    trailColor: "#e0c85a"
  },
  {
    appearanceTint: {
      bodyColor: "#d8b7a2",
      shellColor: "#4b3342"
    },
    baseSpeedMetersPerHour: 52,
    displayName: "Backwards Snail",
    id: "backwards",
    lore: "Crawls the wrong way with complete conviction.",
    quirk: "cursed-backwards",
    rarity: "cursed",
    reliability: 0.56,
    speedBand: "swift",
    sprite: "backwards",
    temperament: "cursed",
    trail: {
      color: "#b24836",
      persistenceMs: 120 * 60 * 60 * 1000,
      texture: "inky"
    },
    trailColor: "#b24836"
  }
];

const speciesById = new Map(
  SNAIL_SPECIES_CATALOG.map((species) => [species.id, species])
);

export function getSnailSpecies(speciesId: SnailSpeciesId): SnailSpecies {
  const species = speciesById.get(speciesId);

  if (!species) {
    return speciesById.get("garden")!;
  }

  return species;
}

export function listSnailSpeciesByRarity(
  rarity: SnailRarity
): SnailSpecies[] {
  return SNAIL_SPECIES_CATALOG.filter((species) => species.rarity === rarity);
}

export function selectSnailSpeciesForRarity({
  rarity,
  seed
}: {
  rarity: SnailRarity;
  seed: string;
}): SnailSpecies {
  const candidates = listSnailSpeciesByRarity(rarity);

  if (candidates.length === 0) {
    return getSnailSpecies("garden");
  }

  const index = Math.floor(seedUnit(seed, "species") * candidates.length);

  return candidates[index] ?? candidates[0];
}

export function getDefaultSnailSpeciesIdForRarity(
  rarity: SnailRarity
): SnailSpeciesId {
  const [species] = listSnailSpeciesByRarity(rarity);

  return species?.id ?? "garden";
}

export function isSnailSpeciesId(value: unknown): value is SnailSpeciesId {
  return typeof value === "string" && speciesById.has(value as SnailSpeciesId);
}

function seedUnit(seed: string, salt: string): number {
  let hash = 2166136261;
  const input = `${seed}:${salt}`;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

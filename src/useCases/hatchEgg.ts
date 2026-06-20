import type { Clock } from "./createReminderJourney";
import {
  createStarterGardenSnail,
  type CarrierRepository,
  type EggRarityPool,
  type Snail,
  type SnailRarity
} from "./localCarrierState";

export type RarityPoolOdd = {
  label: string;
  probability: number;
  rarity: SnailRarity;
};

export type HatchEggInput = {
  eggId: string;
  randomUnit?: () => number;
};

export class EggUnavailableError extends Error {
  constructor() {
    super("That egg is not available to hatch.");
    this.name = "EggUnavailableError";
  }
}

const EARNED_BASIC_ODDS: RarityPoolOdd[] = [
  { label: "Common", probability: 0.7, rarity: "common" },
  { label: "Uncommon", probability: 0.2, rarity: "uncommon" },
  { label: "Rare", probability: 0.07, rarity: "rare" },
  { label: "Mythic", probability: 0.02, rarity: "mythic" },
  { label: "Cursed", probability: 0.01, rarity: "cursed" }
];

const PAID_PREMIUM_ODDS: RarityPoolOdd[] = [
  { label: "Common", probability: 0.45, rarity: "common" },
  { label: "Uncommon", probability: 0.3, rarity: "uncommon" },
  { label: "Rare", probability: 0.16, rarity: "rare" },
  { label: "Mythic", probability: 0.06, rarity: "mythic" },
  { label: "Cursed", probability: 0.03, rarity: "cursed" }
];

export function getEggRarityPoolOdds(
  rarityPool: EggRarityPool
): RarityPoolOdd[] {
  const odds =
    rarityPool === "paid-premium" ? PAID_PREMIUM_ODDS : EARNED_BASIC_ODDS;

  return odds.map((odd) => ({ ...odd }));
}

export function selectRarityFromOdds(
  roll: number,
  odds: RarityPoolOdd[]
): SnailRarity {
  if (odds.length === 0) {
    throw new Error("Rarity odds must include at least one entry.");
  }

  const safeRoll =
    typeof roll === "number" && Number.isFinite(roll)
      ? Math.max(0, Math.min(0.999999999, roll))
      : 0;
  let cumulativeProbability = 0;

  for (const odd of odds) {
    cumulativeProbability += odd.probability;

    if (safeRoll < cumulativeProbability) {
      return odd.rarity;
    }
  }

  return odds[odds.length - 1].rarity;
}

export function hatchEgg(
  input: HatchEggInput,
  {
    clock,
    repository
  }: {
    clock: Clock;
    repository: CarrierRepository;
  }
): { snail: Snail } {
  const state = repository.snapshot();
  const egg = state.eggs.find(
    (candidate) =>
      candidate.id === input.eggId && candidate.status === "unhatched"
  );

  if (!egg) {
    throw new EggUnavailableError();
  }

  const roll = input.randomUnit?.() ?? Math.random();
  const rarity = selectRarityFromOdds(
    roll,
    getEggRarityPoolOdds(egg.rarityPool)
  );
  const snail = createSnailFromRarity({
    rarity,
    seed: `${egg.id}:${roll}`,
    sequence: state.snails.length + 1
  });
  const hatchedAtMs = clock.now();

  repository.save({
    arrivals: state.arrivals,
    eggs: state.eggs.map((candidate) =>
      candidate.id === egg.id
        ? {
            ...candidate,
            hatchedAtMs,
            hatchedSnailId: snail.id,
            status: "hatched"
          }
        : candidate
    ),
    inventory: state.inventory,
    journeys: state.journeys,
    onboarding: state.onboarding,
    purchases: state.purchases,
    reminders: state.reminders,
    snails: [...state.snails, snail],
    softCurrency: state.softCurrency,
    stableSlots: state.stableSlots,
    todos: state.todos
  });

  return { snail };
}

export function createSnailFromRarity({
  rarity,
  seed,
  sequence
}: {
  rarity: SnailRarity;
  seed: string;
  sequence: number;
}): Snail {
  const garden = createStarterGardenSnail();
  const id = `snail-${sequence}`;
  const profile = rarityProfiles[rarity];
  const shellColor =
    profile.shellColors[
      Math.floor(seedUnit(seed, "shell") * profile.shellColors.length)
    ] ?? garden.appearance.shellColor;
  const bodyColor =
    profile.bodyColors[
      Math.floor(seedUnit(seed, "body") * profile.bodyColors.length)
    ] ?? garden.appearance.bodyColor;

  return {
    appearance: {
      bodyColor,
      shellColor
    },
    baseSpeedMetersPerHour: profile.baseSpeedMetersPerHour,
    experiencePoints: 0,
    id,
    journeysCompleted: 0,
    level: 1,
    name: `${profile.namePrefix} ${sequence}`,
    quirk: profile.quirk,
    quirkSeed: `${id}-${seed}`,
    rarity,
    reliability: profile.reliability,
    speedBand: profile.speedBand,
    status: "resting",
    temperament: profile.temperament,
    trail: {
      color: profile.trailColor,
      persistenceMs: profile.trailPersistenceHours * 60 * 60 * 1000,
      texture: profile.trailTexture
    }
  };
}

const rarityProfiles: Record<
  SnailRarity,
  Pick<
    Snail,
    | "baseSpeedMetersPerHour"
    | "quirk"
    | "reliability"
    | "speedBand"
    | "temperament"
  > & {
    bodyColors: string[];
    namePrefix: string;
    shellColors: string[];
    trailColor: string;
    trailPersistenceHours: number;
    trailTexture: Snail["trail"]["texture"];
  }
> = {
  common: {
    baseSpeedMetersPerHour: 48,
    bodyColors: ["#d99f5f", "#cfa76b", "#d6b282"],
    namePrefix: "Garden Snail",
    quirk: "none",
    reliability: 0.94,
    shellColors: ["#7b4b34", "#84623e", "#6f5438"],
    speedBand: "garden",
    temperament: "steady",
    trailColor: "#f5f8ed",
    trailPersistenceHours: 72,
    trailTexture: "glistening"
  },
  cursed: {
    baseSpeedMetersPerHour: 52,
    bodyColors: ["#d8b7a2", "#cda0a6", "#cbb7c8"],
    namePrefix: "Cursed Snail",
    quirk: "cursed-backwards",
    reliability: 0.56,
    shellColors: ["#4b3342", "#3d3149", "#553042"],
    speedBand: "swift",
    temperament: "cursed",
    trailColor: "#b24836",
    trailPersistenceHours: 120,
    trailTexture: "inky"
  },
  mythic: {
    baseSpeedMetersPerHour: 78,
    bodyColors: ["#e6cf8e", "#e7d8a1", "#d6c27c"],
    namePrefix: "Mythic Snail",
    quirk: "none",
    reliability: 0.9,
    shellColors: ["#5d4e9a", "#6a5ea8", "#4f7098"],
    speedBand: "mythic",
    temperament: "steady",
    trailColor: "#d6b94c",
    trailPersistenceHours: 144,
    trailTexture: "sparkling"
  },
  rare: {
    baseSpeedMetersPerHour: 62,
    bodyColors: ["#c6b98f", "#b9c0a0", "#b4ad91"],
    namePrefix: "Wanderer Snail",
    quirk: "scenic-detour",
    reliability: 0.76,
    shellColors: ["#365c8d", "#386c73", "#4d6387"],
    speedBand: "steady",
    temperament: "wanderer",
    trailColor: "#4b8f8c",
    trailPersistenceHours: 96,
    trailTexture: "misty"
  },
  uncommon: {
    baseSpeedMetersPerHour: 54,
    bodyColors: ["#d7b886", "#ceb17d", "#d0c08d"],
    namePrefix: "Sleepy Snail",
    quirk: "napper",
    reliability: 0.86,
    shellColors: ["#5e7650", "#547066", "#6e704b"],
    speedBand: "steady",
    temperament: "sleepy",
    trailColor: "#88a86b",
    trailPersistenceHours: 84,
    trailTexture: "glistening"
  }
};

function seedUnit(seed: string, salt: string): number {
  let hash = 2166136261;
  const input = `${seed}:${salt}`;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

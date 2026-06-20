import type { Clock } from "./createReminderJourney";
import {
  type CarrierRepository,
  type EggRarityPool,
  type Snail,
  type SnailRarity
} from "./localCarrierState";
import { selectSnailSpeciesForRarity } from "./snailSpecies";

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
    seed: `${egg.id}:${egg.earnedAtMs}:${egg.rarityPool}`,
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
  const id = `snail-${sequence}`;
  const species = selectSnailSpeciesForRarity({ rarity, seed });

  return {
    appearance: { ...species.appearanceTint },
    baseSpeedMetersPerHour: species.baseSpeedMetersPerHour,
    experiencePoints: 0,
    id,
    journeysCompleted: 0,
    level: 1,
    name: species.displayName,
    quirk: species.quirk,
    quirkSeed: `${id}-${seed}`,
    rarity: species.rarity,
    reliability: species.reliability,
    speedBand: species.speedBand,
    speciesId: species.id,
    status: "resting",
    temperament: species.temperament,
    trail: { ...species.trail }
  };
}

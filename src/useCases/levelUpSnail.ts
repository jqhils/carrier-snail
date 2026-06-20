import {
  type CarrierRepository,
  type Snail,
  type SnailRarity,
  type SnailTrailTraits
} from "./localCarrierState";

export type LevelUpSnailInput = {
  snailId: string;
};

export class SnailNotLevelableError extends Error {
  constructor() {
    super("Only resting snails can be leveled.");
    this.name = "SnailNotLevelableError";
  }
}

export class InsufficientSlimeError extends Error {
  constructor() {
    super("Not enough earned slime to level this snail.");
    this.name = "InsufficientSlimeError";
  }
}

export function levelUpSnail(
  input: LevelUpSnailInput,
  {
    repository
  }: {
    repository: CarrierRepository;
  }
): { snail: Snail } {
  const state = repository.snapshot();
  const snail = state.snails.find(
    (candidate) =>
      candidate.id === input.snailId && candidate.status === "resting"
  );

  if (!snail) {
    throw new SnailNotLevelableError();
  }

  const cost = levelUpCost(snail);

  if ((state.softCurrency?.slime ?? 0) < cost) {
    throw new InsufficientSlimeError();
  }

  const leveledSnail = applyLevelGrowth(snail);

  repository.save({
    eggs: state.eggs,
    inventory: state.inventory,
    journeys: state.journeys,
    onboarding: state.onboarding,
    purchases: state.purchases,
    reminders: state.reminders,
    snails: state.snails.map((candidate) =>
      candidate.id === snail.id ? leveledSnail : candidate
    ),
    softCurrency: {
      slime: state.softCurrency.slime - cost
    },
    stableSlots: state.stableSlots,
    todos: state.todos
  });

  return { snail: leveledSnail };
}

export function levelUpCost(snail: Pick<Snail, "level">): number {
  return Math.max(1, snail.level);
}

function applyLevelGrowth(snail: Snail): Snail {
  const nextLevel = snail.level + 1;

  return {
    ...snail,
    appearance: evolveAppearance(snail, nextLevel),
    baseSpeedMetersPerHour: Math.min(
      raritySpeedCeiling[snail.rarity],
      roundToTwoDecimals(snail.baseSpeedMetersPerHour * 1.08)
    ),
    level: nextLevel,
    reliability: Math.min(0.99, roundToThreeDecimals(snail.reliability + 0.025)),
    trail: evolveTrail(snail.trail, nextLevel)
  };
}

function evolveAppearance(snail: Snail, nextLevel: number): Snail["appearance"] {
  if (nextLevel < 3) {
    return snail.appearance;
  }

  return {
    bodyColor: snail.appearance.bodyColor,
    shellColor: leveledShellColor[snail.rarity]
  };
}

function evolveTrail(
  trail: SnailTrailTraits,
  nextLevel: number
): SnailTrailTraits {
  return {
    ...trail,
    persistenceMs:
      trail.persistenceMs + (nextLevel >= 3 ? 12 * 60 * 60 * 1000 : 0),
    texture: nextLevel >= 2 ? "sparkling" : trail.texture
  };
}

const raritySpeedCeiling: Record<SnailRarity, number> = {
  common: 72,
  cursed: 76,
  mythic: 120,
  rare: 96,
  uncommon: 84
};

const leveledShellColor: Record<SnailRarity, string> = {
  common: "#8b6b44",
  cursed: "#6b3651",
  mythic: "#7766c8",
  rare: "#4474a7",
  uncommon: "#6f8659"
};

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundToThreeDecimals(value: number): number {
  return Math.round(value * 1000) / 1000;
}

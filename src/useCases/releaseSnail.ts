import type {
  CarrierRepository,
  Snail,
  SnailRarity
} from "./localCarrierState";

export const RELEASE_SLIME_BASE_REWARD = 10;
export const RELEASE_SLIME_PER_LEVEL = 2;

const RELEASE_SLIME_RARITY_BONUS: Record<SnailRarity, number> = {
  common: 0,
  cursed: 24,
  mythic: 40,
  rare: 18,
  uncommon: 8
};

export class ReleaseSnailNotFoundError extends Error {
  constructor() {
    super("That snail was not found.");
    this.name = "ReleaseSnailNotFoundError";
  }
}

export class ReleasedSnailIsBusyError extends Error {
  constructor() {
    super("That snail is on a journey. Recall it home before setting it free.");
    this.name = "ReleasedSnailIsBusyError";
  }
}

export function releaseSnail(
  input: { snailId: string },
  { repository }: { repository: CarrierRepository }
): { releasedSnail: Snail; slimeGranted: number } {
  const state = repository.snapshot();
  const snail = state.snails.find((candidate) => candidate.id === input.snailId);

  if (!snail) {
    throw new ReleaseSnailNotFoundError();
  }

  if (snail.status !== "resting") {
    throw new ReleasedSnailIsBusyError();
  }

  const slimeGranted = calculateReleaseSlimeReward(snail);

  repository.save({
    ...state,
    snails: state.snails.filter((candidate) => candidate.id !== snail.id),
    softCurrency: {
      slime: state.softCurrency.slime + slimeGranted
    }
  });

  return { releasedSnail: snail, slimeGranted };
}

export function calculateReleaseSlimeReward(snail: Snail): number {
  return (
    RELEASE_SLIME_BASE_REWARD +
    RELEASE_SLIME_RARITY_BONUS[snail.rarity] +
    Math.max(1, snail.level) * RELEASE_SLIME_PER_LEVEL
  );
}

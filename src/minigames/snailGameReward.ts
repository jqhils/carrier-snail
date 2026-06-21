// Turns a minigame run into snail-economy rewards. A run is treated like a small
// journey: it earns *slime* (the currency that levels snails) and ticks the
// snail's experience — the same two things a completed delivery grants. It NEVER
// affects a journey's delivery time, so it stays inside the Delivery Floor.
//
// Scale: a delivery grants +1 slime. A good run grants a few, capped, so games
// supplement the economy without trivializing it. TEAM: tune the constants.

const POINTS_PER_SLIME = 3; // 1 slime per 3 cleared gaps
const MAX_SLIME_PER_RUN = 8;
const XP_PER_POINT = 1;

export type SnailGameReward = {
  experiencePoints: number;
  slime: number;
};

export function scoreToSnailReward(score: number): SnailGameReward {
  const safe = Math.max(0, Math.floor(score));
  return {
    experiencePoints: safe * XP_PER_POINT,
    slime: Math.min(MAX_SLIME_PER_RUN, Math.floor(safe / POINTS_PER_SLIME))
  };
}

// 2048 scores run far higher than Flappy's, so it gets its own divisor. ~one
// slime per 600 points, same cap, so a strong run lands near the ceiling.
const POINTS_PER_SLIME_2048 = 600;

export function scoreToSnail2048Reward(score: number): SnailGameReward {
  const safe = Math.max(0, Math.floor(score));
  return {
    experiencePoints: Math.floor(safe / 20),
    slime: Math.min(MAX_SLIME_PER_RUN, Math.floor(safe / POINTS_PER_SLIME_2048))
  };
}

// Optional host helper: credit a reward onto owned snails + the slime balance.
// Generic over the snail shape so it has no hard dependency on the full
// CarrierState — purely additive, returns the pieces to merge back in.
export function creditSnailGameReward<
  S extends { experiencePoints: number; id: string }
>(
  snails: S[],
  snailId: string,
  reward: SnailGameReward,
  slime: number
): { slime: number; snails: S[] } {
  return {
    slime: slime + reward.slime,
    snails: snails.map((snail) =>
      snail.id === snailId
        ? {
            ...snail,
            experiencePoints: snail.experiencePoints + reward.experiencePoints
          }
        : snail
    )
  };
}

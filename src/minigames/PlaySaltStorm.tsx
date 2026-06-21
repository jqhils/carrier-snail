import { useMemo } from "react";

import { SNAIL_SPRITE_ASSETS } from "../components/SnailSprite";
import { SaltStormGame } from "./saltStorm/SaltStormGame";
import { scoreToSaltStormReward, type SnailGameReward } from "./snailGameReward";
import { snailToCharacter } from "./snailToCharacter";
import type { Snail } from "../useCases/localCarrierState";
import type { GameResult } from "./types";

type Props = {
  bestScore?: number;
  onClose: () => void;
  onReward?: (
    snailId: string,
    reward: SnailGameReward,
    result: GameResult
  ) => void;
  paused?: boolean;
  snail: Snail;
};

// Play Salt Storm *as* a specific owned snail — its species sprite dodges the
// salt. Reports a slime + xp reward on game over, same contract as the others.
export function PlaySaltStorm({ bestScore = 0, onClose, onReward, paused, snail }: Props) {
  const character = useMemo(() => snailToCharacter(snail), [snail]);
  const snailSprite = SNAIL_SPRITE_ASSETS[snail.speciesId];

  return (
    <SaltStormGame
      character={character}
      bestScore={bestScore}
      snailSprite={snailSprite}
      paused={paused}
      onExit={onClose}
      onResult={(result: GameResult) => {
        onReward?.(snail.id, scoreToSaltStormReward(result.score), result);
      }}
      rewardLabel={(score) => {
        const reward = scoreToSaltStormReward(score);
        return reward.slime > 0
          ? `Earned ${reward.slime} slime`
          : "Dodge more for slime";
      }}
    />
  );
}

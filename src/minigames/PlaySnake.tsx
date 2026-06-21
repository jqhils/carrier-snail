import { useMemo } from "react";

import { SNAIL_SPRITE_ASSETS } from "../components/SnailSprite";
import { SnakeGame } from "./snake/SnakeGame";
import { scoreToSnakeReward, type SnailGameReward } from "./snailGameReward";
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
  snail: Snail;
};

// Play Snake *as* a specific owned snail — its species sprite is the head. On
// game over it reports a slime + xp reward, same contract as Flappy and 2048.
export function PlaySnake({ bestScore = 0, onClose, onReward, snail }: Props) {
  const character = useMemo(() => snailToCharacter(snail), [snail]);
  const snailSprite = SNAIL_SPRITE_ASSETS[snail.speciesId];

  return (
    <SnakeGame
      character={character}
      bestScore={bestScore}
      snailSprite={snailSprite}
      onExit={onClose}
      onResult={(result: GameResult) => {
        onReward?.(snail.id, scoreToSnakeReward(result.score), result);
      }}
      rewardLabel={(score) => {
        const reward = scoreToSnakeReward(score);
        return reward.slime > 0
          ? `Earned ${reward.slime} slime`
          : "Grow longer for slime";
      }}
    />
  );
}

import { useMemo } from "react";

import { Game2048 } from "./game2048/Game2048";
import { scoreToSnail2048Reward, type SnailGameReward } from "./snailGameReward";
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

// Play 2048 *as* a specific owned snail. 2048 needs no sprite — the snail is
// just context here (it earns the slime). On game over it reports a slime + xp
// reward for the host to credit, same contract as Flappy.
export function Play2048({ bestScore = 0, onClose, onReward, snail }: Props) {
  const character = useMemo(() => snailToCharacter(snail), [snail]);

  return (
    <Game2048
      character={character}
      bestScore={bestScore}
      onExit={onClose}
      onResult={(result: GameResult) => {
        onReward?.(snail.id, scoreToSnail2048Reward(result.score), result);
      }}
      rewardLabel={(score) => {
        const reward = scoreToSnail2048Reward(score);
        return reward.slime > 0
          ? `Earned ${reward.slime} slime`
          : "Merge higher for slime";
      }}
    />
  );
}

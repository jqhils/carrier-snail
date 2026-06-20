import { useMemo } from "react";

import type { Snail } from "../useCases/localCarrierState";
import { FlappySnailGame } from "./flappySnail/FlappySnailGame";
import { scoreToSnailReward, type SnailGameReward } from "./snailGameReward";
import { snailToCharacter } from "./snailToCharacter";
import type { GameResult } from "./types";

type Props = {
  onClose: () => void;
  onReward?: (
    snailId: string,
    reward: SnailGameReward,
    result: GameResult
  ) => void;
  snail: Snail;
};

// Drop-in: play a minigame *as* a specific owned snail. Mount this full-screen
// from a snail card (e.g. a "Play" button on a resting snail). It adapts the
// snail to the game's character, runs Flappy, and on each finished run reports a
// snail-economy reward (slime + xp) for the host to credit. The reward is
// slime/xp only — it never touches journeys or delivery time.
export function PlaySnailGame({ onClose, onReward, snail }: Props) {
  const character = useMemo(() => snailToCharacter(snail), [snail]);

  return (
    <FlappySnailGame
      character={character}
      onExit={onClose}
      onResult={(result: GameResult) => {
        onReward?.(snail.id, scoreToSnailReward(result.score), result);
      }}
      rewardLabel={(score) => {
        const reward = scoreToSnailReward(score);
        return reward.slime > 0
          ? `Earned ${reward.slime} slime`
          : "Keep flying for slime";
      }}
    />
  );
}

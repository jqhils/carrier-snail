import { useMemo, useState } from "react";

import { SNAIL_SPRITE_ASSETS } from "../components/SnailSprite";
import type { Snail } from "../useCases/localCarrierState";
import { FlappySnailGame } from "./flappySnail/FlappySnailGame";
import StartScreen from "./flappySnail/StartScreen";
import { scoreToSnailReward, type SnailGameReward } from "./snailGameReward";
import { snailToCharacter } from "./snailToCharacter";
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

// Drop-in: play a minigame *as* a specific owned snail. Shows the Flappy title
// first, then drops straight into play. On each finished run it reports a
// snail-economy reward (slime + xp) for the host to credit. The reward is
// slime/xp only — it never touches journeys or delivery time.
export function PlaySnailGame({ bestScore = 0, onClose, onReward, snail }: Props) {
  const character = useMemo(() => snailToCharacter(snail), [snail]);
  const snailSprite = SNAIL_SPRITE_ASSETS[snail.speciesId];
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <StartScreen
        onStart={() => setStarted(true)}
        snailSprite={snailSprite}
        bestScore={bestScore}
      />
    );
  }

  return (
    <FlappySnailGame
      autoStart
      character={character}
      snailSprite={snailSprite}
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

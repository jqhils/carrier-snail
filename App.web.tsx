// WEB-ONLY entry (Metro picks App.web.tsx over App.tsx on web). The full app
// can't run on web (MapLibre is native-only); this previews just the games +
// the Game Corner dashboard, which use no native modules. Native ignores this
// file. NOTE: web has no native animation driver, so motion looks laggy here;
// it's smooth on a real device.
import { useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";

import { SNAIL_SPRITE_ASSETS } from "./src/components/SnailSprite";
import { createSnailFromRarity } from "./src/useCases/hatchEgg";
import { GamesListScreen } from "./src/minigames/GamesListScreen";
import { FlappySnailGame } from "./src/minigames/flappySnail/FlappySnailGame";
import { SnakeGame } from "./src/minigames/snake/SnakeGame";
import { Game2048 } from "./src/minigames/game2048/Game2048";
import {
  scoreToSnail2048Reward,
  scoreToSnailReward,
  scoreToSnakeReward
} from "./src/minigames/snailGameReward";
import { snailToCharacter } from "./src/minigames/snailToCharacter";
import type { GameId, GameResult } from "./src/minigames/types";

// A few real (mock) snails so the dashboard + leaderboard have data to show.
const SNAILS = [
  createSnailFromRarity({ id: "web-alpha", rarity: "common", seed: "alpha" }),
  createSnailFromRarity({ id: "web-bravo", rarity: "uncommon", seed: "bravo" }),
  createSnailFromRarity({ id: "web-charlie", rarity: "rare", seed: "charlie" })
];
const ACTIVE = SNAILS[0];
// Seed some high scores so "Top scores" isn't empty in the preview.
const MOCK_SCORES: Record<string, number> = {
  [`${SNAILS[1].id}:2048`]: 3120,
  [`${SNAILS[0].id}:2048`]: 2340,
  [`${SNAILS[2].id}:flappy`]: 18,
  [`${SNAILS[0].id}:flappy`]: 11
};

type Screen = "dashboard" | GameId;

export default function App() {
  const [screen, setScreen] = useState<Screen>("dashboard");

  if (screen === "2048") {
    return (
      <SafeAreaView style={styles.fill}>
        <Game2048
          character={snailToCharacter(ACTIVE)}
          bestScore={MOCK_SCORES[`${ACTIVE.id}:2048`] ?? 0}
          onExit={() => setScreen("dashboard")}
          onResult={(r) => console.log("2048", r, scoreToSnail2048Reward(r.score))}
          rewardLabel={(s) => {
            const reward = scoreToSnail2048Reward(s);
            return reward.slime > 0 ? `Earned ${reward.slime} slime` : "Merge higher for slime";
          }}
        />
      </SafeAreaView>
    );
  }

  if (screen === "flappy") {
    return (
      <SafeAreaView style={styles.fill}>
        <FlappySnailGame
          autoStart
          character={snailToCharacter(ACTIVE)}
          snailSprite={SNAIL_SPRITE_ASSETS[ACTIVE.speciesId]}
          onExit={() => setScreen("dashboard")}
          onResult={(r: GameResult) => console.log("flappy", r, scoreToSnailReward(r.score))}
          rewardLabel={(s: number) => {
            const reward = scoreToSnailReward(s);
            return reward.slime > 0 ? `Earned ${reward.slime} slime` : "Keep flying for slime";
          }}
        />
      </SafeAreaView>
    );
  }

  if (screen === "snake") {
    return (
      <SafeAreaView style={styles.fill}>
        <SnakeGame
          character={snailToCharacter(ACTIVE)}
          bestScore={MOCK_SCORES[`${ACTIVE.id}:snake`] ?? 0}
          snailSprite={SNAIL_SPRITE_ASSETS[ACTIVE.speciesId]}
          onExit={() => setScreen("dashboard")}
          onResult={(r: GameResult) => console.log("snake", r, scoreToSnakeReward(r.score))}
          rewardLabel={(s: number) => {
            const reward = scoreToSnakeReward(s);
            return reward.slime > 0 ? `Earned ${reward.slime} slime` : "Grow longer for slime";
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.fill}>
      <GamesListScreen
        snail={ACTIVE}
        snails={SNAILS}
        slimeBalance={240}
        highScores={MOCK_SCORES}
        onBack={() => console.log("back to snail detail")}
        onPlay={(gameId) => setScreen(gameId)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { backgroundColor: "#eef1e8", flex: 1 }
});

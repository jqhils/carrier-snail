// WEB-ONLY entry (Metro resolves App.web.tsx over App.tsx on web). The full app
// can't run on web because MapLibre is native-only, so this renders just the
// games — which use no native modules — so you can play/preview them in a
// browser without Xcode or a device. Native builds ignore this file entirely.
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { Game2048 } from "./src/minigames/game2048/Game2048";
import { scoreToSnail2048Reward } from "./src/minigames/snailGameReward";
import type { Character, GameId } from "./src/minigames/types";

// A stand-in snail so the games have a character to render as.
const PREVIEW_CHARACTER: Character = {
  accentColor: "#3f6d5b",
  bodyColor: "#cfe0a8",
  id: "garden",
  modifier: {},
  name: "Garden Snail",
  powerUp: "",
  shellColor: "#9c6b3f",
  tagline: "web preview"
};

export default function App() {
  const [game, setGame] = useState<GameId | null>("2048");

  return (
    <SafeAreaView style={styles.fill}>
      {game === "2048" ? (
        <Game2048
          character={PREVIEW_CHARACTER}
          bestScore={0}
          onExit={() => setGame(null)}
          onResult={(result) =>
            console.log("2048 result", result, scoreToSnail2048Reward(result.score))
          }
          rewardLabel={(score) => {
            const reward = scoreToSnail2048Reward(score);
            return reward.slime > 0
              ? `Earned ${reward.slime} slime`
              : "Merge higher for slime";
          }}
        />
      ) : (
        <View style={styles.menu}>
          <Text style={styles.title}>Games preview</Text>
          <Text style={styles.hint}>Drag with the mouse to swipe tiles.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setGame("2048")}
            style={({ pressed }) => [styles.btn, pressed ? styles.pressed : null]}
          >
            <Text style={styles.btnText}>Play 2048 Snail</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: "#3f6d5b",
    borderRadius: 12,
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 14
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  fill: { backgroundColor: "#eef1e8", flex: 1 },
  hint: { color: "#5a6b7a", fontSize: 14, marginTop: 8 },
  menu: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24 },
  pressed: { opacity: 0.85 },
  title: { color: "#2f4a3d", fontSize: 28, fontWeight: "900" }
});

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { GAMES } from "./gamesCatalog";
import { getHighScore, type HighScoreMap } from "./highScores";
import type { Snail } from "../useCases/localCarrierState";
import type { GameId } from "./types";

type Props = {
  highScores: HighScoreMap;
  onBack: () => void;
  onPlay: (gameId: GameId) => void;
  snail: Snail;
};

// The per-snail Games list. One row per game, each showing this snail's best
// score for that game, with Play (available) or a "soon" badge.
export function GamesListScreen({ highScores, onBack, onPlay, snail }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed ? styles.pressed : null
          ]}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Games</Text>
        <Text style={styles.subheading} numberOfLines={1}>
          Playing as {snail.name}
        </Text>

        {GAMES.map((game) => {
          const best = getHighScore(highScores, snail.id, game.id);
          return (
            <View key={game.id} style={styles.gameRow}>
              <View style={styles.gameInfo}>
                <Text style={styles.gameName}>{game.name}</Text>
                <Text style={styles.gameMeta}>
                  {game.available ? `High score · ${best}` : game.blurb}
                </Text>
              </View>
              {game.available ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onPlay(game.id)}
                  style={({ pressed }) => [
                    styles.playButton,
                    pressed ? styles.pressed : null
                  ]}
                >
                  <Text style={styles.playButtonText}>Play</Text>
                </Pressable>
              ) : (
                <View style={styles.soonBadge}>
                  <Text style={styles.soonText}>Soon</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingHorizontal: 4,
    paddingVertical: 6
  },
  backText: {
    color: "#3f6d5b",
    fontSize: 16,
    fontWeight: "700"
  },
  content: {
    padding: 18,
    paddingBottom: 40
  },
  gameInfo: {
    flex: 1,
    paddingRight: 12
  },
  gameMeta: {
    color: "#5a6b7a",
    fontSize: 13,
    marginTop: 2
  },
  gameName: {
    color: "#2f4a3d",
    fontSize: 16,
    fontWeight: "800"
  },
  gameRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 10,
    padding: 14
  },
  heading: {
    color: "#2f4a3d",
    fontSize: 26,
    fontWeight: "900"
  },
  playButton: {
    backgroundColor: "#3f6d5b",
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 10
  },
  playButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800"
  },
  pressed: {
    opacity: 0.85
  },
  screen: {
    backgroundColor: "#eef1e8",
    flex: 1
  },
  soonBadge: {
    backgroundColor: "#e7ebe1",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  soonText: {
    color: "#9aa79a",
    fontSize: 13,
    fontWeight: "700"
  },
  subheading: {
    color: "#5a6b7a",
    fontSize: 14,
    marginBottom: 14,
    marginTop: 2
  },
  topBar: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 8
  }
});

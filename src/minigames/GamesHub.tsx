import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CHARACTERS, DEFAULT_CHARACTER_ID, getCharacter } from "./characters";
import { FlappySnailGame } from "./flappySnail/FlappySnailGame";
import { GAMES } from "./gamesCatalog";
import { applyResult, sortedByXp, type ProgressEntry } from "./progress";
import type { GameId, GameResult } from "./types";

const PROGRESS_STORAGE_KEY = "snailGames.progress";

type Props = {
  // Bubble a finished run up to the host app (e.g. to speed up a map journey).
  // Optional so the hub runs standalone on the harness.
  onApplyReward?: (result: GameResult) => void;
};

// The entire "Games" tab. Owns character selection, the game list, and the
// XP/leaderboard. Games are launched from here and report results back up.
export function GamesHub({ onApplyReward }: Props) {
  const [selectedId, setSelectedId] = useState(DEFAULT_CHARACTER_ID);
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [entries, setEntries] = useState<ProgressEntry[]>([]);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(PROGRESS_STORAGE_KEY)
      .then((raw) => {
        if (active && raw) {
          setEntries(JSON.parse(raw) as ProgressEntry[]);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const selected = getCharacter(selectedId);
  const ranked = useMemo(() => sortedByXp(entries), [entries]);

  function handleResult(result: GameResult) {
    setEntries((current) => {
      const nextEntries = applyResult(current, result);
      void AsyncStorage.setItem(
        PROGRESS_STORAGE_KEY,
        JSON.stringify(nextEntries)
      ).catch(() => undefined);
      return nextEntries;
    });
    onApplyReward?.(result);
  }

  if (activeGame === "flappy") {
    return (
      <FlappySnailGame
        character={selected}
        onExit={() => setActiveGame(null)}
        onResult={handleResult}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Snail Games</Text>
        <Text style={styles.subheading}>Pick a snail, play, earn boosts.</Text>

        <Text style={styles.sectionLabel}>Your snail</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerRow}
        >
          {CHARACTERS.map((character) => {
            const isSelected = character.id === selectedId;
            return (
              <Pressable
                key={character.id}
                accessibilityRole="button"
                onPress={() => setSelectedId(character.id)}
                style={[styles.tile, isSelected ? styles.tileSelected : null]}
              >
                <View style={styles.snailChip}>
                  <View
                    style={[
                      styles.chipBody,
                      { backgroundColor: character.bodyColor }
                    ]}
                  />
                  <View
                    style={[
                      styles.chipShell,
                      { backgroundColor: character.shellColor }
                    ]}
                  />
                  {character.powerUp ? (
                    <Text style={styles.chipBolt}>⚡</Text>
                  ) : null}
                </View>
                <Text style={styles.tileName} numberOfLines={1}>
                  {character.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.selectedCard}>
          <Text style={styles.selectedName}>{selected.name}</Text>
          <Text style={styles.selectedTagline}>{selected.tagline}</Text>
          <Text style={styles.selectedPower}>
            {selected.powerUp
              ? `Power-up · ${selected.powerUp}`
              : "Cosmetic only"}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Games</Text>
        {GAMES.map((game) => (
          <View key={game.id} style={styles.gameRow}>
            <View style={styles.gameInfo}>
              <Text style={styles.gameName}>{game.name}</Text>
              <Text style={styles.gameBlurb}>{game.blurb}</Text>
            </View>
            {game.available ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setActiveGame(game.id)}
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
        ))}

        <Text style={styles.sectionLabel}>Leaderboard</Text>
        {ranked.length === 0 ? (
          <Text style={styles.emptyText}>
            No runs yet — play a game to earn XP.
          </Text>
        ) : (
          ranked.map((entry, index) => {
            const character = getCharacter(entry.characterId);
            return (
              <View key={entry.characterId} style={styles.boardRow}>
                <Text style={styles.boardRank}>{index + 1}</Text>
                <Text style={styles.boardName} numberOfLines={1}>
                  {character.name}
                </Text>
                <Text style={styles.boardStat}>{entry.xp} XP</Text>
                <Text style={styles.boardBest}>best {entry.bestScore}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  boardBest: {
    color: "#8a97a6",
    fontSize: 13
  },
  boardName: {
    color: "#25332e",
    flex: 1,
    fontSize: 15,
    fontWeight: "700"
  },
  boardRank: {
    color: "#10218b",
    fontSize: 16,
    fontWeight: "900",
    width: 24
  },
  boardRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    flexDirection: "row",
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  boardStat: {
    color: "#3f6d5b",
    fontSize: 14,
    fontWeight: "800",
    marginRight: 12
  },
  chipBody: {
    borderRadius: 8,
    bottom: 6,
    height: 16,
    position: "absolute",
    right: 4,
    width: 36
  },
  chipBolt: {
    fontSize: 12,
    position: "absolute",
    right: 0,
    top: -2
  },
  chipShell: {
    borderRadius: 16,
    height: 32,
    left: 6,
    position: "absolute",
    top: 6,
    width: 32
  },
  content: {
    padding: 18,
    paddingBottom: 40
  },
  emptyText: {
    color: "#8a97a6",
    fontSize: 14,
    fontStyle: "italic"
  },
  gameBlurb: {
    color: "#5a6b7a",
    fontSize: 13,
    marginTop: 2
  },
  gameInfo: {
    flex: 1,
    paddingRight: 12
  },
  gameName: {
    color: "#25332e",
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
    color: "#10218b",
    fontSize: 28,
    fontWeight: "900"
  },
  pickerRow: {
    paddingVertical: 4
  },
  playButton: {
    backgroundColor: "#e10600",
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
    backgroundColor: "#eef1f5",
    flex: 1
  },
  sectionLabel: {
    color: "#2a2118",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 20,
    textTransform: "uppercase"
  },
  selectedCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    marginTop: 14,
    padding: 14
  },
  selectedName: {
    color: "#10218b",
    fontSize: 18,
    fontWeight: "800"
  },
  selectedPower: {
    color: "#e10600",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8
  },
  selectedTagline: {
    color: "#5a6b7a",
    fontSize: 14,
    marginTop: 2
  },
  snailChip: {
    height: 44,
    position: "relative",
    width: 56
  },
  soonBadge: {
    backgroundColor: "#e8edf6",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  soonText: {
    color: "#8a97a6",
    fontSize: 13,
    fontWeight: "700"
  },
  subheading: {
    color: "#5a6b7a",
    fontSize: 14,
    marginBottom: 8,
    marginTop: 2
  },
  tile: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    padding: 6,
    width: 76
  },
  tileName: {
    color: "#2a2118",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    maxWidth: 68,
    textAlign: "center"
  },
  tileSelected: {
    backgroundColor: "rgba(225, 6, 0, 0.10)",
    borderColor: "#e10600"
  }
});

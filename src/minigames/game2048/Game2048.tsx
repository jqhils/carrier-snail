import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState
} from "react-native";

import {
  applyMove,
  createInitialState,
  type Direction
} from "./engine2048";
import type { GameComponentProps } from "../types";

const BOARD_BG = "#cbb79b";
const CELL_BG = "#dccdb4";
const GAP = 10;
const SWIPE_THRESHOLD = 18;
const SLIDE_MS = 110;

// Tile colors. 2048+ uses the app green so the win tile reads as "ours".
const TILE_COLORS: Record<number, { bg: string; fg: string }> = {
  2: { bg: "#eee4da", fg: "#5b5147" },
  4: { bg: "#ede0c8", fg: "#5b5147" },
  8: { bg: "#f2b179", fg: "#ffffff" },
  16: { bg: "#f59563", fg: "#ffffff" },
  32: { bg: "#f67c5f", fg: "#ffffff" },
  64: { bg: "#f65e3b", fg: "#ffffff" },
  128: { bg: "#edcf72", fg: "#ffffff" },
  256: { bg: "#edcc61", fg: "#ffffff" },
  512: { bg: "#edc850", fg: "#ffffff" },
  1024: { bg: "#edc53f", fg: "#ffffff" },
  2048: { bg: "#3f6d5b", fg: "#ffffff" }
};

function tileColors(value: number): { bg: string; fg: string } {
  return TILE_COLORS[value] ?? { bg: "#2f4a3d", fg: "#ffffff" };
}

function fontFor(value: number, cell: number): number {
  if (value >= 1024) {
    return cell * 0.32;
  }
  if (value >= 128) {
    return cell * 0.4;
  }
  return cell * 0.46;
}

type TileAnim = { pos: Animated.ValueXY; scale: Animated.Value };

export function Game2048({
  bestScore = 0,
  character,
  onExit,
  onResult,
  rewardLabel
}: GameComponentProps & {
  bestScore?: number;
  rewardLabel?: (score: number) => string;
}) {
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 36, 340);
  const cell = (boardSize - GAP * 5) / 4;
  const stride = cell + GAP;
  const px = (col: number) => col * stride;
  const py = (row: number) => row * stride;

  const [game, setGame] = useState(() => createInitialState());
  // Animation values per tile id, held in (mutable) state so they persist across
  // renders without a ref. We mutate the Map and drive re-renders via setGame.
  const [animMap] = useState(() => {
    const map = new Map<number, TileAnim>();
    for (const tile of game.tiles) {
      map.set(tile.id, {
        pos: new Animated.ValueXY({ x: px(tile.col), y: py(tile.row) }),
        scale: new Animated.Value(0)
      });
    }
    return map;
  });

  // Pop the opening tiles in once.
  useEffect(() => {
    animMap.forEach((anim) => {
      Animated.spring(anim.scale, {
        friction: 5,
        tension: 140,
        toValue: 1,
        useNativeDriver: true
      }).start();
    });
  }, [animMap]);

  const popIn = (anim: TileAnim) =>
    Animated.sequence([
      Animated.delay(SLIDE_MS - 20),
      Animated.spring(anim.scale, {
        friction: 5,
        tension: 150,
        toValue: 1,
        useNativeDriver: true
      })
    ]).start();

  const applyMoveDir = (direction: Direction) => {
    if (game.over) {
      return;
    }
    const result = applyMove(game, direction);
    if (!result.moved) {
      return;
    }

    // Slide every surviving tile to its new cell.
    for (const tile of result.state.tiles) {
      const anim = animMap.get(tile.id);
      if (anim) {
        Animated.timing(anim.pos, {
          duration: SLIDE_MS,
          easing: Easing.out(Easing.quad),
          toValue: { x: px(tile.col), y: py(tile.row) },
          useNativeDriver: true
        }).start();
      }
    }

    // Drop absorbed tiles.
    for (const id of result.removed) {
      animMap.delete(id);
    }

    // Pop merged survivors after they arrive.
    for (const id of result.merged) {
      const anim = animMap.get(id);
      if (anim) {
        Animated.sequence([
          Animated.delay(SLIDE_MS - 30),
          Animated.timing(anim.scale, {
            duration: 80,
            toValue: 1.18,
            useNativeDriver: true
          }),
          Animated.timing(anim.scale, {
            duration: 80,
            toValue: 1,
            useNativeDriver: true
          })
        ]).start();
      }
    }

    // Spawn the new tile (pop in after the slide).
    if (result.spawnedId !== null) {
      const spawned = result.state.tiles.find(
        (tile) => tile.id === result.spawnedId
      );
      if (spawned) {
        const anim: TileAnim = {
          pos: new Animated.ValueXY({ x: px(spawned.col), y: py(spawned.row) }),
          scale: new Animated.Value(0)
        };
        animMap.set(spawned.id, anim);
        popIn(anim);
      }
    }

    setGame(result.state);

    if (result.state.over) {
      onResult({
        characterId: character.id,
        gameId: "2048",
        rewardMultiplier: 1,
        score: result.state.score
      });
    }
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (
      _event: GestureResponderEvent,
      gesture: PanResponderGestureState
    ) => Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8,
    onPanResponderRelease: (
      _event: GestureResponderEvent,
      gesture: PanResponderGestureState
    ) => {
      const { dx, dy } = gesture;
      if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
        return;
      }
      const direction: Direction =
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? "right"
            : "left"
          : dy > 0
            ? "down"
            : "up";
      applyMoveDir(direction);
    }
  });

  function playAgain() {
    const fresh = createInitialState();
    animMap.clear();
    for (const tile of fresh.tiles) {
      const anim: TileAnim = {
        pos: new Animated.ValueXY({ x: px(tile.col), y: py(tile.row) }),
        scale: new Animated.Value(0)
      };
      animMap.set(tile.id, anim);
      Animated.spring(anim.scale, {
        friction: 5,
        tension: 140,
        toValue: 1,
        useNativeDriver: true
      }).start();
    }
    setGame(fresh);
  }

  const best = Math.max(bestScore, game.score);

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={onExit}
          style={({ pressed }) => [
            styles.backButton,
            pressed ? styles.pressed : null
          ]}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>2048 Snail</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Playing as {character.name}
          </Text>
        </View>
        <View style={styles.scoreRow}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{game.score}</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>BEST</Text>
            <Text style={styles.scoreValue}>{best}</Text>
          </View>
        </View>
      </View>

      {game.won ? (
        <Text style={styles.wonPill}>2048 reached — keep going!</Text>
      ) : (
        <Text style={styles.swipeHint}>Swipe to slide the tiles</Text>
      )}

      <View style={styles.boardWrap}>
        <View
          {...panResponder.panHandlers}
          style={[
            styles.board,
            { height: boardSize, padding: GAP, width: boardSize }
          ]}
        >
          <View style={[styles.slots, { width: boardSize - GAP * 2 }]}>
            {Array.from({ length: 16 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.slot,
                  {
                    height: cell,
                    marginBottom: i < 12 ? GAP : 0,
                    marginRight: i % 4 < 3 ? GAP : 0,
                    width: cell
                  }
                ]}
              />
            ))}
          </View>

          {game.tiles.map((tile) => {
            const anim = animMap.get(tile.id);
            if (!anim) {
              return null;
            }
            const colors = tileColors(tile.value);
            return (
              <Animated.View
                key={tile.id}
                style={[
                  styles.tile,
                  {
                    backgroundColor: colors.bg,
                    height: cell,
                    left: GAP,
                    top: GAP,
                    transform: [
                      { translateX: anim.pos.x },
                      { translateY: anim.pos.y },
                      { scale: anim.scale }
                    ],
                    width: cell
                  }
                ]}
              >
                <Text
                  style={{
                    color: colors.fg,
                    fontSize: fontFor(tile.value, cell),
                    fontWeight: "800"
                  }}
                >
                  {tile.value}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {game.over ? (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Out of moves</Text>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{game.score}</Text>
            {rewardLabel ? (
              <Text style={styles.reward}>{rewardLabel(game.score)}</Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={playAgain}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.pressed : null
              ]}
            >
              <Text style={styles.primaryButtonText}>Play again</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onExit}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed ? styles.pressed : null
              ]}
            >
              <Text style={styles.secondaryButtonText}>Back to games</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
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
  board: {
    backgroundColor: BOARD_BG,
    borderRadius: 12,
    position: "relative"
  },
  boardWrap: {
    alignItems: "center",
    marginTop: 14
  },
  card: {
    backgroundColor: "#fffaf0",
    borderColor: "rgba(63, 109, 91, 0.18)",
    borderRadius: 18,
    borderWidth: 2,
    maxWidth: 320,
    padding: 22,
    width: "82%"
  },
  cardTitle: {
    color: "#2f4a3d",
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 4
  },
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(47, 74, 61, 0.18)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  pressed: {
    opacity: 0.85
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#3f6d5b",
    borderRadius: 10,
    marginTop: 18,
    paddingVertical: 13
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800"
  },
  reward: {
    color: "#3f6d5b",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 10,
    textAlign: "center"
  },
  scoreBox: {
    alignItems: "center",
    backgroundColor: "#cbb79b",
    borderRadius: 10,
    minWidth: 64,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  scoreLabel: {
    color: "#f3ece0",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1
  },
  scoreRow: {
    flexDirection: "row",
    gap: 8
  },
  scoreValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900"
  },
  screen: {
    backgroundColor: "#eef1e8",
    flex: 1
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#e8edf6",
    borderRadius: 10,
    marginTop: 10,
    paddingVertical: 11
  },
  secondaryButtonText: {
    color: "#2f4a3d",
    fontSize: 14,
    fontWeight: "700"
  },
  slot: {
    backgroundColor: CELL_BG,
    borderRadius: 8
  },
  slots: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  statLabel: {
    color: "#2a2118",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 14,
    textAlign: "center"
  },
  statValue: {
    color: "#3f6d5b",
    fontSize: 44,
    fontWeight: "800",
    textAlign: "center"
  },
  subtitle: {
    color: "#5a6b7a",
    fontSize: 13,
    marginTop: 2
  },
  swipeHint: {
    color: "#5a6b7a",
    fontSize: 13,
    marginTop: 10,
    textAlign: "center"
  },
  tile: {
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "center",
    position: "absolute"
  },
  title: {
    color: "#2f4a3d",
    fontSize: 24,
    fontWeight: "900"
  },
  topBar: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 8
  },
  wonPill: {
    color: "#3f6d5b",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10,
    textAlign: "center"
  }
});

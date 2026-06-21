import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
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
  type Direction,
  type Game2048State
} from "./engine2048";
import type { GameComponentProps } from "../types";
import { PixelButton } from "../../components/PixelButton";
import { colors, fontFamily, pixelShadow, radii, text } from "../../theme";

// The native animation driver doesn't exist on web; fall back to the JS driver
// there so slide/pop animations still run (and to silence the warning).
const USE_NATIVE_DRIVER = Platform.OS !== "web";

const BOARD_BG = colors.backgroundSunken;
const CELL_BG = colors.surfaceAlt;
const GAP = 10;
const SWIPE_THRESHOLD = 18;
const SLIDE_MS = 110;

// Tile colors — an escalating candy ramp. Low tiles read as tinted cream; the
// ramp warms through tangerine/gold, peaks at hot pink/gold, then the 1024 and
// 2048 (win) tiles land on lime + grape so the win tile reads as "ours".
const TILE_COLORS: Record<number, { bg: string; fg: string }> = {
  2: { bg: colors.surfaceAlt, fg: colors.textPrimary },
  4: { bg: colors.accentGoldSoft, fg: colors.textPrimary },
  8: { bg: colors.accentWarm, fg: colors.textOnAccent },
  16: { bg: colors.accentWarmBevel, fg: colors.textOnAccent },
  32: { bg: colors.accentGold, fg: colors.textPrimary },
  64: { bg: colors.accentGoldBevel, fg: colors.textOnAccent },
  128: { bg: colors.accentPink, fg: colors.textOnAccent },
  256: { bg: colors.accentPinkBevel, fg: colors.textOnAccent },
  512: { bg: colors.secondary, fg: colors.textOnAccent },
  1024: { bg: colors.accentLime, fg: colors.textPrimary },
  2048: { bg: colors.primary, fg: colors.textOnAccent }
};

function tileColors(value: number): { bg: string; fg: string } {
  return TILE_COLORS[value] ?? { bg: colors.primaryBevel, fg: colors.textOnAccent };
}

// Fredoka renders wider than the old system font, so the multipliers are pulled
// in vs. the originals to keep 128 / 1024 / 2048 inside the cell.
function fontFor(value: number, cell: number): number {
  if (value >= 1024) {
    return cell * 0.28;
  }
  if (value >= 128) {
    return cell * 0.36;
  }
  return cell * 0.44;
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
  // The gesture handler can capture a stale `game` (notably on web, where
  // PanResponder handlers aren't re-bound each render), so the move logic reads
  // the latest state from this holder. Stored in a useState Map (mutated via
  // set/get, like animMap below) so it trips neither the ref nor the
  // no-mutate-state lint rules.
  const [latest] = useState(
    () => new Map<string, Game2048State>([["game", game]])
  );
  useEffect(() => {
    latest.set("game", game);
  }, [game, latest]);
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
        useNativeDriver: USE_NATIVE_DRIVER
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
        useNativeDriver: USE_NATIVE_DRIVER
      })
    ]).start();

  const applyMoveDir = (direction: Direction) => {
    const current = latest.get("game") ?? game;
    if (current.over) {
      return;
    }
    const result = applyMove(current, direction);
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
          useNativeDriver: USE_NATIVE_DRIVER
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
            useNativeDriver: USE_NATIVE_DRIVER
          }),
          Animated.timing(anim.scale, {
            duration: 80,
            toValue: 1,
            useNativeDriver: USE_NATIVE_DRIVER
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

    latest.set("game", result.state);
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
        useNativeDriver: USE_NATIVE_DRIVER
      }).start();
    }
    latest.set("game", fresh);
    setGame(fresh);
  }

  const best = Math.max(bestScore, game.score);

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <PixelButton
          accessibilityLabel="Back"
          label="‹ Back"
          onPress={onExit}
          size="compact"
          variant="neutral"
        />
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
            const tc = tileColors(tile.value);
            return (
              <Animated.View
                key={tile.id}
                style={[
                  styles.tile,
                  {
                    backgroundColor: tc.bg,
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
                    color: tc.fg,
                    fontFamily: fontFamily.bodyBold,
                    fontSize: fontFor(tile.value, cell)
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

            <PixelButton
              label="Play again"
              onPress={playAgain}
              style={styles.primaryButton}
              variant="primary"
            />
            <PixelButton
              label="Back to games"
              onPress={onExit}
              style={styles.secondaryButton}
              variant="neutral"
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: BOARD_BG,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    position: "relative"
  },
  boardWrap: {
    alignItems: "center",
    marginTop: 14
  },
  card: {
    ...pixelShadow,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 2,
    maxWidth: 320,
    padding: 22,
    width: "82%"
  },
  cardTitle: {
    ...text.pixelTitle,
    color: colors.textPrimary,
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
    backgroundColor: colors.scrim,
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  primaryButton: {
    marginTop: 18
  },
  reward: {
    ...text.bodyStrong,
    color: colors.primary,
    marginTop: 10,
    textAlign: "center"
  },
  scoreBox: {
    alignItems: "center",
    backgroundColor: colors.backgroundSunken,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    minWidth: 68,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  scoreLabel: {
    ...text.pixelMicro,
    color: colors.textMuted
  },
  scoreRow: {
    flexDirection: "row",
    gap: 8
  },
  scoreValue: {
    ...text.pixelScore,
    color: colors.textPrimary
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  secondaryButton: {
    marginTop: 10
  },
  slot: {
    backgroundColor: CELL_BG,
    borderRadius: radii.sm
  },
  slots: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  statLabel: {
    ...text.bodyStrong,
    color: colors.textPrimary,
    marginTop: 14,
    textAlign: "center"
  },
  statValue: {
    ...text.numberLg,
    color: colors.primary,
    textAlign: "center"
  },
  subtitle: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 2
  },
  swipeHint: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 10,
    textAlign: "center"
  },
  tile: {
    alignItems: "center",
    borderRadius: radii.sm,
    justifyContent: "center",
    position: "absolute"
  },
  title: {
    ...text.pixelHeading,
    color: colors.textPrimary
  },
  topBar: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 8
  },
  wonPill: {
    ...text.bodyStrongSm,
    color: colors.primary,
    marginTop: 10,
    textAlign: "center"
  }
});

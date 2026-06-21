import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  PanResponder,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType
} from "react-native";

import type { GameComponentProps } from "../types";
import {
  createInitialState,
  GRID_COLS,
  GRID_ROWS,
  restart,
  start,
  step,
  turn,
  type SnakeState
} from "./snakeEngine";
import { PixelButton } from "../../components/PixelButton";
import { colors, pixelShadow, radii, text } from "../../theme";

// Gameplay-canvas colors. The board fill + snake/food live on the Skia-free
// View canvas; they read straight from the palette tokens.
const COLORS = {
  apple: colors.accentPink,
  board: colors.backgroundSunken,
  segment: colors.accentLime,
  segmentEdge: colors.accentLimeBevel
};

// Snake, played as the picked snail — its species sprite (Joseph's
// SNAIL_SPRITE_ASSETS, passed in by PlaySnake) is the head; the body trails as
// shell-green segments. Grid + tick based, so it stays smooth without a physics
// loop. Swipe to steer.
export function SnakeGame({
  autoStart,
  bestScore = 0,
  character,
  onExit,
  onResult,
  paused,
  rewardLabel,
  snailSprite
}: GameComponentProps & {
  autoStart?: boolean;
  bestScore?: number;
  paused?: boolean;
  rewardLabel?: (score: number) => string;
  snailSprite: ImageSourcePropType;
}) {
  const { width } = useWindowDimensions();
  const cell = Math.floor(Math.min(width - 24, 420) / GRID_COLS);
  const boardW = cell * GRID_COLS;
  const boardH = cell * GRID_ROWS;

  const [game, setGame] = useState<SnakeState>(() => {
    const initial = createInitialState(Date.now() % 100000);
    return autoStart ? start(initial) : initial;
  });

  const onResultRef = useRef(onResult);
  const reportedRef = useRef(false);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Report the finished run once, when the snake dies.
  useEffect(() => {
    if (game.phase === "playing") {
      reportedRef.current = false;
    }
    if (game.phase === "dead" && !reportedRef.current) {
      reportedRef.current = true;
      onResultRef.current({
        characterId: character.id,
        gameId: "snake",
        rewardMultiplier: 1,
        score: game.score
      });
    }
  }, [game.phase, game.score, character.id]);

  // Tick loop: speeds up as the score climbs. Recreated when speed or phase
  // changes; the functional update always sees the latest state.
  const speedLevel = Math.min(12, Math.floor(game.score / 4));
  useEffect(() => {
    if (game.phase !== "playing" || paused) {
      return;
    }
    const delay = Math.max(70, 150 - speedLevel * 8);
    const id = setInterval(() => setGame((s) => step(s)), delay);
    return () => clearInterval(id);
  }, [game.phase, paused, speedLevel]);

  const turnTo = useCallback(
    (dir: Parameters<typeof turn>[1]) => setGame((s) => turn(s, dir)),
    []
  );
  const startTap = useCallback(() => setGame((s) => start(s)), []);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderRelease: (_evt, g) => {
          if (Math.abs(g.dx) < 12 && Math.abs(g.dy) < 12) {
            startTap();
            return;
          }
          if (Math.abs(g.dx) > Math.abs(g.dy)) {
            turnTo(g.dx > 0 ? "right" : "left");
          } else {
            turnTo(g.dy > 0 ? "down" : "up");
          }
        }
      }),
    [turnTo, startTap]
  );

  function playAgain() {
    setGame(restart(Date.now() % 100000));
  }

  const head = game.snake[0];
  const facingLeft = game.dir === "left";

  return (
    <View style={styles.fill}>
      <Text style={styles.score} pointerEvents="none">
        {game.score}
      </Text>

      <View style={styles.boardWrap}>
        <View
          {...pan.panHandlers}
          style={[styles.board, { width: boardW, height: boardH }]}
        >
          {/* food */}
          <View
            style={[
              styles.apple,
              {
                left: game.food.col * cell + cell * 0.18,
                top: game.food.row * cell + cell * 0.18,
                width: cell * 0.64,
                height: cell * 0.64
              }
            ]}
          />

          {/* body (skip head, drawn as sprite) */}
          {game.snake.slice(1).map((c, i) => (
            <View
              key={`${c.row}:${c.col}:${i}`}
              style={[
                styles.segment,
                {
                  left: c.col * cell + 1,
                  top: c.row * cell + 1,
                  width: cell - 2,
                  height: cell - 2
                }
              ]}
            />
          ))}

          {/* head = snail sprite */}
          <Image
            source={snailSprite}
            resizeMode="contain"
            style={{
              position: "absolute",
              left: head.col * cell,
              top: head.row * cell,
              width: cell,
              height: cell,
              transform: [{ scaleX: facingLeft ? -1 : 1 }]
            }}
          />
        </View>
      </View>

      {game.phase === "ready" ? (
        <View style={styles.hintWrap} pointerEvents="none">
          <Text style={styles.hint}>Swipe to start</Text>
          {bestScore > 0 ? (
            <Text style={styles.bestHint}>Best {bestScore}</Text>
          ) : null}
        </View>
      ) : null}

      {game.phase === "dead" ? (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Out of road</Text>
            <Text style={styles.statLabel}>Length</Text>
            <Text style={styles.statValue}>{game.score}</Text>
            <Text style={styles.boostText}>
              {rewardLabel ? rewardLabel(game.score) : ""}
            </Text>
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

const ABSOLUTE_FILL = {
  bottom: 0,
  left: 0,
  position: "absolute",
  right: 0,
  top: 0
} as const;

const styles = StyleSheet.create({
  apple: {
    backgroundColor: COLORS.apple,
    borderRadius: 999,
    position: "absolute"
  },
  board: {
    backgroundColor: COLORS.board,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    overflow: "hidden",
    position: "relative"
  },
  boardWrap: { alignItems: "center", flex: 1, justifyContent: "center" },
  bestHint: {
    ...text.bodyStrong,
    color: colors.textOnDark,
    marginTop: 10,
    opacity: 0.9
  },
  boostText: {
    ...text.bodyStrong,
    color: colors.accentLimeBevel,
    marginTop: 12,
    textAlign: "center"
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
  fill: { ...ABSOLUTE_FILL, backgroundColor: colors.background },
  hint: {
    ...text.pixelHeading,
    backgroundColor: colors.mapOverlay,
    borderRadius: radii.md,
    color: colors.textOnDark,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingVertical: 10
  },
  hintWrap: { ...ABSOLUTE_FILL, alignItems: "center", justifyContent: "center" },
  overlay: {
    ...ABSOLUTE_FILL,
    alignItems: "center",
    backgroundColor: colors.scrim,
    justifyContent: "center"
  },
  primaryButton: {
    marginTop: 18
  },
  score: {
    ...text.pixelScore,
    color: colors.textPrimary,
    left: 0,
    position: "absolute",
    right: 0,
    textAlign: "center",
    top: 40
  },
  secondaryButton: {
    marginTop: 10
  },
  segment: {
    backgroundColor: COLORS.segment,
    borderColor: COLORS.segmentEdge,
    borderRadius: 3,
    borderWidth: 1,
    position: "absolute"
  },
  statLabel: {
    ...text.bodyStrong,
    color: colors.textPrimary,
    marginTop: 14,
    textAlign: "center"
  },
  statValue: {
    ...text.numberLg,
    color: colors.accentLimeBevel,
    textAlign: "center"
  }
});

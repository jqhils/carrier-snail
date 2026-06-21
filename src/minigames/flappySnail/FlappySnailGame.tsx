import {
  Canvas,
  Group,
  Image,
  LinearGradient,
  Rect,
  RoundedRect,
  useImage,
  vec
} from "@shopify/react-native-skia";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType
} from "react-native";

import type { GameComponentProps } from "../types";
import {
  applyFlappyModifier,
  createInitialState,
  defaultConfig,
  restart,
  scoreToSpeedMultiplier,
  step,
  type FlappyConfig,
  type FlappyState
} from "./flappyEngine";
import { PixelButton } from "../../components/PixelButton";
import { colors, pixelShadow, radii, text } from "../../theme";

// Bright "Flappy" palette — kept in sync with StartScreen.tsx so the title
// screen and gameplay read as one game. Pipes + sky read from palette tokens;
// the dirt terrain keeps a bespoke sandy hex (no semantic token fits).
const COLORS = {
  capLight: colors.accentLimeSoft,
  dirt: "#ded895",
  grass: colors.accentLime,
  grassDark: colors.accentLimeBevel,
  pipe: colors.accentLime,
  pipeDark: colors.accentLimeBevel,
  pipeEdge: colors.border,
  pipeLight: colors.accentLimeSoft,
  skyBottom: colors.secondarySoft,
  skyTop: colors.secondary
};

// In-game flyer. The picked snail's species sprite (Joseph's SNAIL_SPRITE_ASSETS)
// is passed in by PlaySnailGame, so every snail flies as itself. Most species
// sprites face right (only "backwards" faces left, which suits it).
const SPRITE_W = 64;

export function FlappySnailGame({
  autoStart,
  character,
  onExit,
  onResult,
  paused,
  rewardLabel,
  snailSprite
}: GameComponentProps & {
  autoStart?: boolean;
  paused?: boolean;
  rewardLabel?: (score: number) => string;
  snailSprite: ImageSourcePropType;
}) {
  const { height, width } = useWindowDimensions();
  // The character's passive power-up merges into the base config here.
  const config = useMemo<FlappyConfig>(
    () => applyFlappyModifier(defaultConfig(width, height), character.modifier),
    [width, height, character]
  );

  // The manifest types sprites as ImageSourcePropType, but a bundled require()
  // asset is a Metro asset number, which is what Skia's useImage takes.
  const snailImage = useImage(snailSprite as number);
  const stateRef = useRef<FlappyState>(createInitialState(config));
  // When launched from the StartScreen, seed the first flap so we start playing
  // immediately (no second tap, no internal title flash).
  const flapRef = useRef(Boolean(autoStart));
  const onResultRef = useRef(onResult);
  const [game, setGame] = useState<FlappyState>(() =>
    createInitialState(config)
  );

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = Boolean(paused);
  }, [paused]);

  // Rebuild before play if the viewport or character changes.
  useEffect(() => {
    if (stateRef.current.phase === "ready") {
      stateRef.current = createInitialState(config);
      setGame(stateRef.current);
    }
  }, [config]);

  // Fixed-step loop. On death we report the run up to the hub (XP + reward).
  useEffect(() => {
    let raf = 0;
    let mounted = true;

    const loop = () => {
      if (!mounted) {
        return;
      }

      if (pausedRef.current) {
        raf = requestAnimationFrame(loop);
        return;
      }

      const flap = flapRef.current;
      flapRef.current = false;
      const previousPhase = stateRef.current.phase;
      stateRef.current = step(stateRef.current, config, { flap });

      if (previousPhase === "playing" && stateRef.current.phase === "dead") {
        const finalScore = stateRef.current.score;
        onResultRef.current({
          characterId: character.id,
          gameId: "flappy",
          rewardMultiplier: scoreToSpeedMultiplier(finalScore),
          score: finalScore
        });
      }

      setGame(stateRef.current);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
    };
  }, [config, character.id]);

  function handleTap() {
    if (stateRef.current.phase === "dead") {
      return;
    }
    flapRef.current = true;
  }

  function playAgain() {
    stateRef.current = restart(stateRef.current, config);
    flapRef.current = true;
    setGame(stateRef.current);
  }

  const score = game.score;
  const multiplier = scoreToSpeedMultiplier(score);
  const tiltRad = (game.tiltDeg * Math.PI) / 180 + game.spin;
  const groundY = config.height - config.groundHeight;
  // Size the flyer by the sprite's real aspect so different species sprites
  // aren't squished (each of Joseph's PNGs has its own dimensions).
  const spriteH = snailImage
    ? SPRITE_W * (snailImage.height() / snailImage.width())
    : SPRITE_W;

  return (
    <View style={styles.fill}>
      <Canvas style={styles.fill}>
        <Rect x={0} y={0} width={config.width} height={config.height}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, config.height)}
            colors={[COLORS.skyTop, COLORS.skyBottom]}
          />
        </Rect>

        {game.pipes.map((pipe, index) => {
          const topHeight = pipe.gapY - config.pipeGap / 2;
          const bottomY = pipe.gapY + config.pipeGap / 2;
          return (
            <Group key={index}>
              <Pipe x={pipe.x} y={0} w={config.pipeWidth} h={topHeight} capAtBottom />
              <Pipe
                x={pipe.x}
                y={bottomY}
                w={config.pipeWidth}
                h={groundY - bottomY}
                capAtBottom={false}
              />
            </Group>
          );
        })}

        <Group
          transform={[
            { translateX: config.snailX },
            { translateY: game.snailY },
            { rotate: tiltRad }
          ]}
        >
          {snailImage ? (
            <Image
              image={snailImage}
              x={-SPRITE_W / 2}
              y={-spriteH / 2}
              width={SPRITE_W}
              height={spriteH}
              fit="contain"
            />
          ) : null}
        </Group>

        <Rect
          x={0}
          y={groundY}
          width={config.width}
          height={config.groundHeight}
          color={COLORS.dirt}
        />
        <Rect x={0} y={groundY} width={config.width} height={16} color={COLORS.grass} />
        <Rect x={0} y={groundY} width={config.width} height={4} color={COLORS.grassDark} />
      </Canvas>

      <Pressable style={styles.fill} onPress={handleTap} />

      {game.phase !== "ready" ? (
        <Text style={styles.score} pointerEvents="none">
          {score}
        </Text>
      ) : null}

      {game.phase === "ready" && !autoStart ? (
        <View style={styles.readyWrap} pointerEvents="none">
          <Text style={styles.title}>{character.name.toUpperCase()}</Text>
          <Text style={styles.subtitle}>{character.tagline}</Text>
          <Text style={styles.hint}>Tap to flap</Text>
        </View>
      ) : null}

      {game.phase === "dead" ? (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Wings clipped</Text>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.boostText}>
              {rewardLabel
                ? rewardLabel(score)
                : `Earned ×${multiplier.toFixed(2)} boost`}
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

function Pipe({
  capAtBottom,
  h,
  w,
  x,
  y
}: {
  capAtBottom: boolean;
  h: number;
  w: number;
  x: number;
  y: number;
}) {
  if (h <= 0) {
    return null;
  }

  const capHeight = 18;
  const capY = capAtBottom ? y + h - capHeight : y;

  return (
    <Group>
      <Rect x={x} y={y} width={w} height={h} color={COLORS.pipe} />
      <Rect x={x + 3} y={y} width={w * 0.16} height={h} color={COLORS.pipeLight} />
      <Rect
        x={x + w * 0.66}
        y={y}
        width={w * 0.34}
        height={h}
        color={COLORS.pipeDark}
      />
      <Rect
        x={x}
        y={y}
        width={w}
        height={h}
        color={COLORS.pipeEdge}
        style="stroke"
        strokeWidth={2}
      />
      <RoundedRect
        x={x - 4}
        y={capY}
        width={w + 8}
        height={capHeight}
        r={4}
        color={COLORS.capLight}
      />
      <RoundedRect
        x={x - 4}
        y={capY}
        width={w + 8}
        height={capHeight}
        r={4}
        color={COLORS.pipeEdge}
        style="stroke"
        strokeWidth={2}
      />
    </Group>
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
  fill: {
    ...ABSOLUTE_FILL
  },
  hint: {
    ...text.pixelLabel,
    color: colors.textPrimary,
    marginTop: 18
  },
  overlay: {
    ...ABSOLUTE_FILL,
    alignItems: "center",
    backgroundColor: colors.scrim,
    justifyContent: "center"
  },
  primaryButton: {
    marginTop: 18
  },
  readyWrap: {
    ...ABSOLUTE_FILL,
    alignItems: "center",
    justifyContent: "center"
  },
  score: {
    ...text.pixelScore,
    color: colors.textPrimary,
    left: 0,
    position: "absolute",
    right: 0,
    textAlign: "center",
    textShadowColor: colors.pixelShadow,
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 0,
    top: 64
  },
  secondaryButton: {
    marginTop: 10
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
  },
  subtitle: {
    ...text.body,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: "center"
  },
  title: {
    ...text.pixelTitle,
    color: colors.textPrimary,
    textAlign: "center"
  }
});

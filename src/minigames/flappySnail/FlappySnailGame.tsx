import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Line,
  Path,
  Rect,
  RoundedRect,
  Skia,
  vec
} from "@shopify/react-native-skia";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
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

// Fixed accents (obstacles, sky, ground). The snail's shell/body come from the
// chosen character, so every snail looks different; the spiral is cream so it
// reads on any shell color.
const COLORS = {
  canBody: "#6f5b43",
  canCap: "#d8cab0",
  cream: "#fff4d3",
  gold: "#e8b03a",
  grass: "#8fae6e",
  grassTop: "#b6cd94",
  ink: "#3c2a1f",
  navy: "#2f4a3d",
  skyBottom: "#eef1e8",
  skyTop: "#d3e1cc",
  white: "#ffffff"
};

type ViewModel = {
  game: FlappyState;
  wingBeat: number;
};

export function FlappySnailGame({
  character,
  onExit,
  onResult,
  rewardLabel
}: GameComponentProps & { rewardLabel?: (score: number) => string }) {
  const { height, width } = useWindowDimensions();
  // The character's passive power-up merges into the base config here.
  const config = useMemo<FlappyConfig>(
    () => applyFlappyModifier(defaultConfig(width, height), character.modifier),
    [width, height, character]
  );

  const stateRef = useRef<FlappyState>(createInitialState(config));
  const flapRef = useRef(false);
  const frameRef = useRef(0);
  const onResultRef = useRef(onResult);
  const [view, setView] = useState<ViewModel>(() => ({
    game: createInitialState(config),
    wingBeat: 0
  }));

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Rebuild before play if the viewport or character changes.
  useEffect(() => {
    if (stateRef.current.phase === "ready") {
      stateRef.current = createInitialState(config);
      setView({ game: stateRef.current, wingBeat: 0 });
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

      frameRef.current += 1;
      const next = stateRef.current;
      const wingBeat =
        Math.sin(frameRef.current / 4) * 0.5 +
        (next.velocity < 0 ? -0.5 : 0.15);
      setView({ game: next, wingBeat });
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
    flapRef.current = false;
    setView({ game: stateRef.current, wingBeat: 0 });
  }

  const state = view.game;
  const wingBeat = view.wingBeat;
  const score = state.score;
  const multiplier = scoreToSpeedMultiplier(score);
  const tiltRad = (state.tiltDeg * Math.PI) / 180 + state.spin;

  const spiral = useMemo(() => buildSpiral(), []);
  const wing = useMemo(() => buildWing(), []);

  const groundY = config.height - config.groundHeight;

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

        {state.pipes.map((pipe, index) => {
          const topHeight = pipe.gapY - config.pipeGap / 2;
          const bottomY = pipe.gapY + config.pipeGap / 2;
          return (
            <Group key={index}>
              <EnergyCan
                x={pipe.x}
                y={0}
                w={config.pipeWidth}
                h={topHeight}
                capAtBottom
              />
              <EnergyCan
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
            { translateY: state.snailY },
            { rotate: tiltRad }
          ]}
        >
          <Group transform={[{ translateY: -2 }, { rotate: wingBeat }]}>
            <Path path={wing} color={COLORS.white} />
            <Path
              path={wing}
              color="#cadbf5"
              style="stroke"
              strokeWidth={1.2}
            />
          </Group>

          <RoundedRect
            x={-20}
            y={2}
            width={40}
            height={16}
            r={8}
            color={character.bodyColor}
          />
          <RoundedRect
            x={-20}
            y={12}
            width={40}
            height={6}
            r={3}
            color="rgba(0, 0, 0, 0.12)"
          />
          <Circle cx={15} cy={4} r={9} color={character.bodyColor} />

          <Circle cx={-3} cy={-4} r={17} color={character.shellColor} />
          <Circle
            cx={-3}
            cy={-4}
            r={16}
            color={COLORS.gold}
            style="stroke"
            strokeWidth={2.5}
          />
          <Group transform={[{ translateX: -3 }, { translateY: -4 }]}>
            <Path
              path={spiral}
              color={COLORS.cream}
              style="stroke"
              strokeWidth={3}
              strokeCap="round"
            />
          </Group>
          <Circle cx={3} cy={-10} r={4.2} color={COLORS.white} />

          <Line
            p1={vec(17, -2)}
            p2={vec(24, -15)}
            color={COLORS.ink}
            strokeWidth={2}
            strokeCap="round"
          />
          <Line
            p1={vec(12, -3)}
            p2={vec(16, -17)}
            color={COLORS.ink}
            strokeWidth={2}
            strokeCap="round"
          />
          <Circle cx={24} cy={-16} r={4} color={COLORS.white} />
          <Circle cx={24.6} cy={-15.6} r={2.4} color={COLORS.ink} />
          <Circle cx={16} cy={-18} r={4} color={COLORS.white} />
          <Circle cx={16.6} cy={-17.6} r={2.4} color={COLORS.ink} />
        </Group>

        <Rect
          x={0}
          y={groundY}
          width={config.width}
          height={config.groundHeight}
          color={COLORS.grass}
        />
        <Rect
          x={0}
          y={groundY}
          width={config.width}
          height={10}
          color={COLORS.grassTop}
        />
      </Canvas>

      <Pressable style={styles.fill} onPress={handleTap} />

      {state.phase !== "ready" ? (
        <Text style={styles.score} pointerEvents="none">
          {score}
        </Text>
      ) : null}

      {state.phase === "ready" ? (
        <View style={styles.readyWrap} pointerEvents="none">
          <Text style={styles.title}>{character.name.toUpperCase()}</Text>
          <Text style={styles.subtitle}>{character.tagline}</Text>
          {character.powerUp ? (
            <Text style={styles.powerUp}>POWER-UP · {character.powerUp}</Text>
          ) : null}
          <Text style={styles.hint}>Tap to flap</Text>
        </View>
      ) : null}

      {state.phase === "dead" ? (
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

function EnergyCan({
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
  const stripeY = capAtBottom ? y + h - 30 : y + 16;

  return (
    <Group>
      <Rect x={x} y={y} width={w} height={h} color={COLORS.canBody} />
      <Rect
        x={x + w * 0.18}
        y={y}
        width={w * 0.1}
        height={h}
        color="rgba(255, 255, 255, 0.16)"
      />
      <Rect
        x={x + 4}
        y={stripeY}
        width={w - 8}
        height={5}
        color={COLORS.gold}
      />
      <RoundedRect
        x={x - 3}
        y={capY}
        width={w + 6}
        height={capHeight}
        r={5}
        color={COLORS.canCap}
      />
    </Group>
  );
}

function buildSpiral() {
  const path = Skia.Path.Make();
  let angle = 0;
  let radius = 2.2;
  path.moveTo(0, 0);
  for (let i = 0; i < 34; i += 1) {
    angle += 0.5;
    radius += 0.34;
    path.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  return path;
}

function buildWing() {
  const path = Skia.Path.Make();
  path.moveTo(0, 0);
  path.cubicTo(-8, -16, -28, -18, -34, -4);
  path.cubicTo(-26, 0, -10, 4, 0, 0);
  path.close();
  return path;
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
    color: "#3f6d5b",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 12,
    textAlign: "center"
  },
  card: {
    backgroundColor: "#f7f6ef",
    borderColor: "rgba(47, 74, 61, 0.18)",
    borderRadius: 18,
    borderWidth: 2,
    maxWidth: 320,
    padding: 22,
    width: "82%"
  },
  cardTitle: {
    color: COLORS.navy,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center"
  },
  fill: {
    ...ABSOLUTE_FILL
  },
  hint: {
    color: "#5a6b7a",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 18
  },
  overlay: {
    ...ABSOLUTE_FILL,
    alignItems: "center",
    backgroundColor: "rgba(47, 74, 61, 0.18)",
    justifyContent: "center"
  },
  powerUp: {
    color: "#3f6d5b",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 10
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
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800"
  },
  readyWrap: {
    ...ABSOLUTE_FILL,
    alignItems: "center",
    justifyContent: "center"
  },
  score: {
    color: COLORS.white,
    fontSize: 56,
    fontWeight: "900",
    left: 0,
    position: "absolute",
    right: 0,
    textAlign: "center",
    textShadowColor: "rgba(47, 74, 61, 0.85)",
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 4,
    top: 64
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#e8edf6",
    borderRadius: 10,
    marginTop: 10,
    paddingVertical: 11
  },
  secondaryButtonText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: "700"
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
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center"
  },
  title: {
    color: COLORS.navy,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center"
  }
});

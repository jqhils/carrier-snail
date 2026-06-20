import AsyncStorage from "@react-native-async-storage/async-storage";
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

import {
  createInitialState,
  defaultConfig,
  restart,
  scoreToSpeedMultiplier,
  step,
  type FlappyConfig,
  type FlappyState
} from "./flappyEngine";

const BEST_STORAGE_KEY = "flappySnail.best";

// Red Bull energy palette, reusing the app's cream/ink tones.
const COLORS = {
  skyTop: "#bfe3ff",
  skyBottom: "#eaf7ff",
  grass: "#9bc15a",
  grassTop: "#cdeb8f",
  canBody: "#10218b",
  canCap: "#d9dee8",
  gold: "#ffc400",
  red: "#e10600",
  navy: "#10218b",
  body: "#fbe7c6",
  bodyShade: "#e7cfa1",
  cream: "#fff4d3",
  ink: "#3c2a1f",
  white: "#ffffff"
};

export type FlappyResult = {
  multiplier: number;
  score: number;
};

type Props = {
  onClose?: () => void;
  onUseBoost?: (result: FlappyResult) => void;
};

// Snapshot the loop publishes for rendering. Refs drive the simulation;
// React state drives the paint, so render never reads a ref.
type ViewModel = {
  game: FlappyState;
  wingBeat: number;
};

export function FlappySnailGame({ onClose, onUseBoost }: Props) {
  const { width, height } = useWindowDimensions();
  const config = useMemo<FlappyConfig>(
    () => defaultConfig(width, height),
    [width, height]
  );

  const stateRef = useRef<FlappyState>(createInitialState(config));
  const flapRef = useRef(false);
  const frameRef = useRef(0);
  const [view, setView] = useState<ViewModel>(() => ({
    game: createInitialState(config),
    wingBeat: 0
  }));

  // Rebuild state if the viewport changes (e.g. rotation) before play starts.
  useEffect(() => {
    if (stateRef.current.phase === "ready") {
      stateRef.current = createInitialState(config, stateRef.current.best);
      setView({ game: stateRef.current, wingBeat: 0 });
    }
  }, [config]);

  // Load persisted best once.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(BEST_STORAGE_KEY)
      .then((raw) => {
        const value = raw ? Number.parseInt(raw, 10) : 0;
        if (active && Number.isFinite(value)) {
          stateRef.current.best = Math.max(stateRef.current.best, value);
          setView((current) => ({ ...current, game: stateRef.current }));
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // Fixed-step game loop driven by the animation frame clock.
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
        void AsyncStorage.setItem(
          BEST_STORAGE_KEY,
          String(stateRef.current.best)
        ).catch(() => undefined);
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
  }, [config]);

  function handleTap() {
    if (stateRef.current.phase === "dead") {
      return; // dead screen uses explicit buttons
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
        {/* sky */}
        <Rect x={0} y={0} width={config.width} height={config.height}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, config.height)}
            colors={[COLORS.skyTop, COLORS.skyBottom]}
          />
        </Rect>

        {/* pipes as energy cans */}
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

        {/* snail */}
        <Group
          transform={[
            { translateX: config.snailX },
            { translateY: state.snailY },
            { rotate: tiltRad }
          ]}
        >
          {/* wings */}
          <Group transform={[{ translateY: -2 }, { rotate: wingBeat }]}>
            <Path path={wing} color={COLORS.white} />
            <Path
              path={wing}
              color="#cadbf5"
              style="stroke"
              strokeWidth={1.2}
            />
          </Group>

          {/* foot / body */}
          <RoundedRect
            x={-20}
            y={2}
            width={40}
            height={16}
            r={8}
            color={COLORS.body}
          />
          <RoundedRect
            x={-20}
            y={12}
            width={40}
            height={6}
            r={3}
            color={COLORS.bodyShade}
          />
          <Circle cx={15} cy={4} r={9} color={COLORS.body} />

          {/* shell */}
          <Circle cx={-3} cy={-4} r={17} color={COLORS.red} />
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
              color={COLORS.navy}
              style="stroke"
              strokeWidth={3}
              strokeCap="round"
            />
          </Group>
          <Circle cx={3} cy={-10} r={4.2} color={COLORS.cream} />

          {/* eye stalks + eyes */}
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

        {/* ground */}
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

      {/* tap layer */}
      <Pressable style={styles.fill} onPress={handleTap} />

      {/* HUD */}
      {state.phase !== "ready" ? (
        <Text style={styles.score} pointerEvents="none">
          {score}
        </Text>
      ) : null}

      {state.phase === "ready" ? (
        <View style={styles.readyWrap} pointerEvents="none">
          <Text style={styles.title}>REDBULL SNAIL</Text>
          <Text style={styles.subtitle}>Tap to flap</Text>
        </View>
      ) : null}

      {state.phase === "dead" ? (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Wings clipped</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>Score</Text>
                <Text style={[styles.statValue, { color: COLORS.red }]}>
                  {score}
                </Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={styles.statLabel}>Best</Text>
                <Text style={[styles.statValue, { color: COLORS.navy }]}>
                  {state.best}
                </Text>
              </View>
            </View>
            <Text style={styles.boostText}>
              Snail boost ×{multiplier.toFixed(2)}
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => onUseBoost?.({ multiplier, score })}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.pressed : null
              ]}
            >
              <Text style={styles.primaryButtonText}>
                Use ×{multiplier.toFixed(2)} boost
              </Text>
            </Pressable>

            <View style={styles.secondaryRow}>
              <Pressable
                accessibilityRole="button"
                onPress={playAgain}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed ? styles.pressed : null
                ]}
              >
                <Text style={styles.secondaryButtonText}>Play again</Text>
              </Pressable>
              {onClose ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed ? styles.pressed : null
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </Pressable>
              ) : null}
            </View>
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
    marginTop: 14,
    textAlign: "center"
  },
  card: {
    backgroundColor: "#f7f6ef",
    borderColor: "rgba(16, 33, 139, 0.18)",
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
  overlay: {
    ...ABSOLUTE_FILL,
    alignItems: "center",
    backgroundColor: "rgba(16, 33, 139, 0.18)",
    justifyContent: "center"
  },
  pressed: {
    opacity: 0.85
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.red,
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
    textShadowColor: "rgba(16, 33, 139, 0.85)",
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 4,
    top: 64
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#e8edf6",
    borderRadius: 10,
    flex: 1,
    paddingVertical: 11
  },
  secondaryButtonText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: "700"
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  },
  statBlock: {
    alignItems: "center",
    flex: 1
  },
  statLabel: {
    color: "#2a2118",
    fontSize: 14,
    fontWeight: "700"
  },
  statValue: {
    fontSize: 40,
    fontWeight: "800",
    marginTop: 2
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 18
  },
  subtitle: {
    color: "#5a6b7a",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8
  },
  title: {
    color: COLORS.navy,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 1
  }
});

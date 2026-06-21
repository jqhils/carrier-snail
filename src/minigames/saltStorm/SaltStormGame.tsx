import {
  Canvas,
  Circle,
  Group,
  Image,
  LinearGradient,
  Rect,
  RoundedRect,
  useImage,
  vec
} from "@shopify/react-native-skia";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType
} from "react-native";

import type { GameComponentProps } from "../types";
import { HAZARD_SPRITES } from "./hazardSprites";
import {
  createInitialState,
  defaultConfig,
  restart,
  snailYFor,
  start,
  START_LIVES,
  step,
  type Hazard,
  type HazardKind,
  type Pickup,
  type SaltConfig,
  type SaltState
} from "./saltStormEngine";
import { PixelButton } from "../../components/PixelButton";
import { colors, pixelShadow, radii, text } from "../../theme";

// Gameplay-canvas colors. Thematic roles read straight from the palette tokens;
// a few drawn-shape shading values (chrome cap, glass highlights) keep bespoke
// hex so the salt shaker still reads as a 3D object next to the pixel snails.
const COLORS = {
  capHole: "#565d66",
  capLight: "#e7ecf2",
  capMid: "#b8c0c9",
  capShadow: "#8d96a1",
  glass: "#eef3f7",
  glassShadow: "#cdd5dd",
  grass: colors.accentLimeBevel,
  grassLight: colors.accentLime,
  ground: "#6b5640",
  label: colors.danger,
  moon: colors.accentGoldSoft,
  salt: colors.textOnAccent,
  skyBottom: colors.secondarySoft,
  skyTop: colors.secondary,
  star: colors.textOnAccent
};

// Salt Storm — the picked snail (its species sprite) slides along the ground
// dodging salt shakers raining down. Drag to move. Skia + a fixed-step loop, so
// it's smooth on device. Difficulty ramps as you survive.
export function SaltStormGame({
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
  const { height, width } = useWindowDimensions();
  const config = useMemo<SaltConfig>(
    () => defaultConfig(width, height),
    [width, height]
  );
  const snailImage = useImage(snailSprite as number);
  // Optional hazard sprites — null until a PNG is added in hazardSprites.ts,
  // in which case that kind renders the sprite instead of the drawn shape.
  const saltImg = useImage((HAZARD_SPRITES.salt ?? null) as number | null);
  const bombImg = useImage((HAZARD_SPRITES.bomb ?? null) as number | null);
  const poisonImg = useImage((HAZARD_SPRITES.poison ?? null) as number | null);
  const hazardSprite: Record<HazardKind, ReturnType<typeof useImage>> = {
    bomb: bombImg,
    poison: poisonImg,
    salt: saltImg
  };

  const stateRef = useRef<SaltState>(createInitialState(config));
  const onResultRef = useRef(onResult);
  const [game, setGame] = useState<SaltState>(() =>
    createInitialState(config)
  );

  // Finger target goes through state (lint-safe: the PanResponder closes over a
  // state setter, not a ref) and is mirrored into a ref the loop can read.
  const [target, setTarget] = useState<number | null>(null);
  const targetRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const prevLevelRef = useRef(0);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  // Flash "LEVEL N" each time a new level (30s) is reached.
  useEffect(() => {
    if (game.level > prevLevelRef.current) {
      prevLevelRef.current = game.level;
      setFlash(`LEVEL ${game.level}`);
      const id = setTimeout(() => setFlash(null), 1100);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [game.level]);

  // Rebuild if the viewport changes while waiting to start.
  useEffect(() => {
    if (stateRef.current.phase === "ready") {
      stateRef.current = autoStart
        ? start(createInitialState(config))
        : createInitialState(config);
      setGame(stateRef.current);
    }
  }, [config, autoStart]);

  const onMove = useCallback((x: number) => setTarget(x), []);
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (_evt, g) => onMove(g.x0),
        onPanResponderMove: (_evt, g) => onMove(g.moveX)
      }),
    [onMove]
  );

  function handleStart() {
    stateRef.current = start(stateRef.current);
    setGame(stateRef.current);
  }
  function playAgain() {
    stateRef.current = restart(config);
    prevLevelRef.current = 0;
    setFlash(null);
    setTarget(null);
    setGame(stateRef.current);
  }

  // Freeze the game while the pause menu is open (ref so the RAF loop sees the
  // latest value without re-subscribing).
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = !!paused;
  }, [paused]);

  useEffect(() => {
    let raf = 0;
    let mounted = true;
    const loop = () => {
      if (!mounted) {
        return;
      }
      if (pausedRef.current) {
        raf = requestAnimationFrame(loop); // paused: keep the loop alive, don't advance
        return;
      }
      const aim = targetRef.current ?? stateRef.current.snailX;
      const prev = stateRef.current.phase;
      stateRef.current = step(stateRef.current, config, { targetX: aim });
      if (prev === "playing" && stateRef.current.phase === "dead") {
        onResultRef.current({
          characterId: character.id,
          gameId: "salt",
          rewardMultiplier: 1,
          score: stateRef.current.score
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

  const snailY = snailYFor(config);
  const groundY = config.height - config.groundHeight;
  const snailW = config.snailHalf * 2.1;
  const snailH = snailImage
    ? snailW * (snailImage.height() / snailImage.width())
    : snailW;
  const lean = Math.max(-0.32, Math.min(0.32, (game.snailX - (target ?? game.snailX)) * -0.01));
  // Flash the snail while it has i-frames (just got hit, not shielded).
  const snailFlashing = game.invuln > 0 && game.shield <= 0;
  const snailOpacity = snailFlashing && Math.floor(game.frame / 4) % 2 === 0 ? 0.4 : 1;

  // A little drifting salt dust for atmosphere (purely visual).
  const dust = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        speed: 0.6 + ((i * 37) % 10) / 10,
        x: ((i * 9301 + 49297) % 233280) / 233280
      })),
    []
  );

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

        {/* moon + glow */}
        <Circle cx={config.width - 56} cy={84} r={42} color="rgba(243,239,225,0.18)" />
        <Circle cx={config.width - 56} cy={84} r={26} color={COLORS.moon} />
        {[
          [40, 70],
          [90, 130],
          [150, 60],
          [220, 110],
          [60, 180]
        ].map(([sx, sy], i) => (
          <Circle key={i} cx={sx} cy={sy} r={1.6} color={COLORS.star} />
        ))}

        {/* drifting salt dust */}
        {dust.map((d, i) => {
          const y = (game.frame * d.speed + i * 60) % config.height;
          return (
            <Circle
              key={`d${i}`}
              cx={d.x * config.width}
              cy={y}
              r={1.4}
              color="rgba(255,255,255,0.5)"
            />
          );
        })}

        {/* salt shakers */}
        {game.hazards.map((h) => {
          const sprite = hazardSprite[h.kind];
          if (sprite) {
            return (
              <Group key={h.id} transform={[{ translateX: h.x }, { translateY: h.y }, { rotate: h.rot }]}>
                <Image image={sprite} x={-h.size / 2} y={-h.size / 2} width={h.size} height={h.size} fit="contain" />
              </Group>
            );
          }
          return <DrawnHazard key={h.id} h={h} />;
        })}

        {/* shell pickups (shield) */}
        {game.pickups.map((p) => (
          <Shell key={p.id} p={p} frame={game.frame} />
        ))}

        {/* ground */}
        <Rect x={0} y={groundY} width={config.width} height={config.groundHeight} color={COLORS.ground} />
        <Rect x={0} y={groundY} width={config.width} height={14} color={COLORS.grass} />
        <Rect x={0} y={groundY} width={config.width} height={4} color={COLORS.grassLight} />

        {/* snail */}
        <Group transform={[{ translateX: game.snailX }, { translateY: snailY }, { rotate: lean }]}>
          {game.shield > 0 ? (
            <Group>
              <Circle cx={0} cy={0} r={snailW * 0.78 + Math.sin(game.frame * 0.2) * 4} color="rgba(120,210,180,0.22)" />
              <Circle cx={0} cy={0} r={snailW * 0.6} color="rgba(120,210,180,0.16)" />
            </Group>
          ) : null}
          {snailImage ? (
            <Image
              image={snailImage}
              x={-snailW / 2}
              y={-snailH / 2}
              width={snailW}
              height={snailH}
              fit="contain"
              opacity={snailOpacity}
            />
          ) : null}
        </Group>
      </Canvas>

      {game.phase !== "ready" ? (
        <Text style={styles.score} pointerEvents="none">
          {game.score}
        </Text>
      ) : null}

      {game.phase !== "ready" ? (
        <View style={styles.hearts} pointerEvents="none">
          {Array.from({ length: START_LIVES }).map((_, i) => (
            <Text
              key={i}
              style={[styles.heart, i < game.lives ? styles.heartFull : styles.heartEmpty]}
            >
              ♥
            </Text>
          ))}
        </View>
      ) : null}

      {game.phase === "playing" ? (
        <Text style={styles.levelText} pointerEvents="none">
          LEVEL {game.level}
        </Text>
      ) : null}

      {game.phase === "playing" && game.shield > 0 ? (
        <Text style={styles.shieldText} pointerEvents="none">
          SHIELDED
        </Text>
      ) : null}

      {flash ? (
        <Text style={styles.flashText} pointerEvents="none">
          {flash}
        </Text>
      ) : null}

      {game.phase === "playing" ? (
        <View style={styles.fill} {...pan.panHandlers} />
      ) : null}

      {game.phase === "ready" ? (
        <Pressable style={styles.readyWrap} onPress={handleStart}>
          <Text style={styles.title}>SALT STORM</Text>
          <Text style={styles.subtitle}>Drag your snail. Dodge the salt.</Text>
          {bestScore > 0 ? <Text style={styles.best}>Best {bestScore}</Text> : null}
          <Text style={styles.hint}>Tap to start</Text>
        </Pressable>
      ) : null}

      {game.phase === "dead" ? (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Salted!</Text>
            <Text style={styles.statLabel}>Dodged</Text>
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

// A blocky salt shaker: glass body with salt, chrome cap with holes, a colored
// label band, and a few grains spilling. Drawn so it reads next to the pixel
// snails. Centered at the hazard's (x, y), rotated by its spin.
function SaltShaker({ h }: { h: Hazard }) {
  const s = h.size;
  const bodyW = s * 0.62;
  const capW = s * 0.74;
  const capH = s * 0.2;
  const bodyTop = -s * 0.12;
  const bodyH = s * 0.62;

  return (
    <Group transform={[{ translateX: h.x }, { translateY: h.y }, { rotate: h.rot }]}>
      {/* glass body */}
      <RoundedRect x={-bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} r={s * 0.12} color={COLORS.glass} />
      {/* salt fill (lower half) */}
      <RoundedRect x={-bodyW / 2} y={bodyTop + bodyH * 0.42} width={bodyW} height={bodyH * 0.58} r={s * 0.1} color={COLORS.salt} />
      {/* shadow side */}
      <Rect x={bodyW / 2 - s * 0.12} y={bodyTop} width={s * 0.12} height={bodyH} color={COLORS.glassShadow} />
      {/* label band */}
      <Rect x={-bodyW / 2} y={bodyTop + bodyH * 0.18} width={bodyW} height={s * 0.12} color={COLORS.label} />
      {/* cap */}
      <RoundedRect x={-capW / 2} y={bodyTop - capH} width={capW} height={capH} r={s * 0.06} color={COLORS.capMid} />
      <Rect x={-capW / 2} y={bodyTop - capH} width={capW} height={s * 0.05} color={COLORS.capLight} />
      <Rect x={-capW / 2} y={bodyTop - s * 0.04} width={capW} height={s * 0.04} color={COLORS.capShadow} />
      {/* holes */}
      {[-0.2, 0, 0.2].map((o, i) => (
        <Circle key={i} cx={o * capW} cy={bodyTop - capH + s * 0.05} r={s * 0.035} color={COLORS.capHole} />
      ))}
      {/* spilling grains (varies by id) */}
      {[0, 1, 2].map((g) => {
        const seed = (h.id * 7 + g * 13) % 10;
        return (
          <Rect
            key={`g${g}`}
            x={(seed - 5) * s * 0.04}
            y={bodyTop + bodyH + g * s * 0.16}
            width={s * 0.07}
            height={s * 0.07}
            color={COLORS.salt}
          />
        );
      })}
    </Group>
  );
}

// Bomb — appears from level 3. Larger, so a bigger hitbox; dodge like the rest.
function Bomb({ h }: { h: Hazard }) {
  const s = h.size;
  return (
    <Group transform={[{ translateX: h.x }, { translateY: h.y }, { rotate: h.rot }]}>
      {/* fuse */}
      <Rect x={-s * 0.03} y={-s * 0.52} width={s * 0.06} height={s * 0.18} color="#8a5a2a" />
      {/* spark */}
      <Circle cx={0} cy={-s * 0.54} r={s * 0.08} color="#ffb02e" />
      <Circle cx={0} cy={-s * 0.54} r={s * 0.04} color="#fff3c4" />
      {/* body */}
      <Circle cx={0} cy={s * 0.06} r={s * 0.4} color="#1c1c22" />
      {/* highlight */}
      <Circle cx={-s * 0.14} cy={-s * 0.06} r={s * 0.1} color="#3c3c48" />
    </Group>
  );
}

// Poison bottle — appears from level 5. Small + fast.
function Poison({ h }: { h: Hazard }) {
  const s = h.size;
  const bx = -s * 0.26;
  const by = -s * 0.06;
  const bw = s * 0.52;
  const bh = s * 0.48;
  return (
    <Group transform={[{ translateX: h.x }, { translateY: h.y }, { rotate: h.rot }]}>
      {/* glass body */}
      <RoundedRect x={bx} y={by} width={bw} height={bh} r={s * 0.12} color="#d2ecca" />
      {/* toxic liquid */}
      <RoundedRect x={bx} y={by + bh * 0.4} width={bw} height={bh * 0.6} r={s * 0.1} color="#62c93f" />
      {/* neck */}
      <Rect x={-s * 0.09} y={-s * 0.2} width={s * 0.18} height={s * 0.16} color="#d2ecca" />
      {/* cork */}
      <RoundedRect x={-s * 0.11} y={-s * 0.3} width={s * 0.22} height={s * 0.11} r={s * 0.03} color="#9a6b3a" />
      {/* bubbles */}
      <Circle cx={-s * 0.06} cy={by + bh * 0.7} r={s * 0.05} color="rgba(255,255,255,0.7)" />
      <Circle cx={s * 0.08} cy={by + bh * 0.55} r={s * 0.035} color="rgba(255,255,255,0.6)" />
    </Group>
  );
}

// Pick the drawn shape for a hazard's kind (used when no sprite is supplied).
function DrawnHazard({ h }: { h: Hazard }) {
  if (h.kind === "bomb") {
    return <Bomb h={h} />;
  }
  if (h.kind === "poison") {
    return <Poison h={h} />;
  }
  return <SaltShaker h={h} />;
}

// A glowing shell pickup — catch it for a few seconds of shield.
function Shell({ frame, p }: { frame: number; p: Pickup }) {
  const s = p.size;
  const pulse = 1 + Math.sin(frame * 0.18) * 0.08;
  return (
    <Group transform={[{ translateX: p.x }, { translateY: p.y }]}>
      <Circle cx={0} cy={0} r={s * 0.62 * pulse} color="rgba(120,210,180,0.3)" />
      <Circle cx={0} cy={0} r={s * 0.42} color="#7fd0b4" />
      <Circle cx={0} cy={0} r={s * 0.42} color={colors.accentLimeBevel} style="stroke" strokeWidth={2} />
      <Circle cx={-s * 0.12} cy={-s * 0.12} r={s * 0.1} color="#eafff7" />
    </Group>
  );
}

const ABSOLUTE_FILL = { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 } as const;

const styles = StyleSheet.create({
  best: { ...text.pixelLabel, color: colors.textPrimary, marginTop: 12 },
  boostText: { ...text.bodyStrong, color: colors.primary, marginTop: 12, textAlign: "center" },
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
  cardTitle: { ...text.pixelTitle, color: colors.textPrimary, textAlign: "center" },
  fill: { ...ABSOLUTE_FILL },
  flashText: {
    ...text.pixelHero,
    color: colors.accentGold,
    left: 0,
    position: "absolute",
    right: 0,
    textAlign: "center",
    textShadowColor: colors.pixelShadow,
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 0,
    top: "40%"
  },
  heart: { fontSize: 22, marginRight: 2 },
  heartEmpty: { color: colors.borderHairline },
  heartFull: { color: colors.danger },
  hearts: { flexDirection: "row", left: 16, position: "absolute", top: 52 },
  hint: { ...text.pixelLabel, color: colors.textPrimary, marginTop: 22 },
  levelText: {
    ...text.pixelLabel,
    color: colors.textPrimary,
    left: 0,
    position: "absolute",
    right: 0,
    textAlign: "center",
    top: 116
  },
  overlay: { ...ABSOLUTE_FILL, alignItems: "center", backgroundColor: colors.scrim, justifyContent: "center" },
  primaryButton: { marginTop: 18 },
  readyWrap: { ...ABSOLUTE_FILL, alignItems: "center", justifyContent: "center" },
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
  secondaryButton: { marginTop: 10 },
  statLabel: { ...text.bodyStrong, color: colors.textPrimary, marginTop: 14, textAlign: "center" },
  statValue: { ...text.numberLg, color: colors.primary, textAlign: "center" },
  shieldText: {
    ...text.pixelLabel,
    color: colors.accentLimeBevel,
    left: 0,
    position: "absolute",
    right: 0,
    textAlign: "center",
    top: 128
  },
  subtitle: { ...text.body, color: colors.textMuted, marginTop: 8, textAlign: "center" },
  title: { ...text.pixelTitle, color: colors.textPrimary, textAlign: "center" }
});

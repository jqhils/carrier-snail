/**
 * StartScreen.tsx — Flappy Snail title screen
 * -------------------------------------------------------------
 * A plain React Native title screen. It does NOT depend on any game engine —
 * it just calls `onStart` when tapped. Mount your game (the Skia FlappySnailGame)
 * when `onStart` fires.
 *
 * New deps (run once):
 *   npx expo install expo-linear-gradient react-native-svg
 *   npx expo install @expo-google-fonts/fredoka @expo-google-fonts/press-start-2p expo-font
 *   (safe-area-context is already in the project)
 *
 * Load fonts once at the app root (optional — without them it uses system fonts):
 *   import { useFonts } from "expo-font";
 *   import { Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
 *   import { PressStart2P_400Regular } from "@expo-google-fonts/press-start-2p";
 *   const [ready] = useFonts({ Fredoka_600SemiBold, Fredoka_700Bold, PressStart2P_400Regular });
 *
 * All layout numbers live in the LAYOUT block — nudge to taste.
 */

import { useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import type {
  ImageSourcePropType,
  StyleProp,
  TextStyle,
  ViewStyle
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, Path, Pattern, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Interpolation = ReturnType<Animated.Value["interpolate"]>;

const { width: W, height: H } = Dimensions.get("window");

/* ----------------------------- palette ----------------------------- */
const C = {
  skyTop: "#4ec3d4",
  skyMid: "#6ad2cd",
  skyLow: "#a9e7d8",
  sun: "#fff6c8",
  pipeLight: "#bdee63",
  pipe: "#73c63a",
  pipeDark: "#4f8b27",
  pipeEdge: "#33611a",
  capLight: "#cdf274",
  grass: "#84cf4e",
  grassDk: "#5aa233",
  dirt: "#ded895",
  dirtDk: "#cdc57c",
  accent: "#ffd02e",
  white: "#ffffff",
  ink: "#3a2a1c",
  cream: "#fff3cf",
  tealText: "#11616a"
} as const;

/* ------------------------------ fonts ------------------------------ */
const F_DISPLAY_SEMI = "Fredoka_600SemiBold";
const F_DISPLAY_BOLD = "Fredoka_700Bold";
const F_PIXEL = "PressStart2P_400Regular";

/* ------------------------------ layout ----------------------------- */
const SNAIL_RATIO = 217 / 256; // businessman sprite h/w
const HERO_W = Math.min(170, W * 0.42);
const HERO_H = HERO_W * SNAIL_RATIO;
const HERO_CX = W * 0.39;
const HERO_CY = H * 0.56;

const GAP_TOP = H * 0.4;
const GAP_BOTTOM = H * 0.66;
const GROUND_H = Math.max(88, H * 0.108);
const GROUND_TOP = H - GROUND_H;

const MAIN_LEFT = W * 0.626;
const MAIN_W = W * 0.169;
const BACK_LEFT = W * 0.905;
const BACK_W = W * 0.149;
const BACK_TOP = H * 0.55;

const TRAIL_W = W * 0.55;
const TRAIL_H = W * 0.37;

/* --------------------------- text outline -------------------------- */
// RN has no text-stroke, so we stack offset copies behind the fill copy.
const OFFSETS: [number, number][] = [
  [-2, 0],
  [2, 0],
  [0, -2],
  [0, 2],
  [-2, -2],
  [2, -2],
  [-2, 2],
  [2, 2]
];

function Outline({
  children,
  color,
  outline = C.ink,
  style
}: {
  children: React.ReactNode;
  color: string;
  outline?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <View style={styles.outlineWrap}>
      {OFFSETS.map(([dx, dy], i) => (
        <Text
          key={i}
          style={[style, styles.outlineCopy, { left: dx, top: dy, color: outline }]}
        >
          {children}
        </Text>
      ))}
      <Text style={[style, { color }]}>{children}</Text>
    </View>
  );
}

/* ------------------------------ pipe ------------------------------- */
function Pipe({
  left,
  top,
  width,
  height,
  capAt
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  capAt: "top" | "bottom";
}) {
  const CAP_H = 26;
  const OVER = 7;
  const capPosition: ViewStyle = capAt === "top" ? { top: -2 } : { bottom: -2 };
  return (
    <View style={{ position: "absolute", left, top, width, height, zIndex: 2 }}>
      <LinearGradient
        colors={[C.pipeLight, C.pipe, C.pipe, C.pipeDark]}
        locations={[0, 0.22, 0.66, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderWidth: 2, borderColor: C.pipeEdge }]}
      />
      <LinearGradient
        colors={[C.capLight, C.pipe, C.pipe, C.pipeDark]}
        locations={[0, 0.22, 0.66, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          {
            position: "absolute",
            left: -OVER,
            width: width + OVER * 2,
            height: CAP_H,
            borderWidth: 2,
            borderColor: C.pipeEdge,
            borderRadius: 3
          },
          capPosition
        ]}
      />
    </View>
  );
}

/* ------------------------------ cloud ------------------------------ */
function Cloud({
  w,
  drift,
  style
}: {
  w: number;
  drift: Interpolation;
  style?: StyleProp<ViewStyle>;
}) {
  const puff = (d: number): ViewStyle => ({
    width: d,
    height: d,
    borderRadius: d,
    backgroundColor: C.white
  });
  return (
    <Animated.View
      style={[
        styles.cloud,
        style,
        { transform: [{ translateX: drift }] }
      ]}
    >
      <View style={puff(w * 0.5)} />
      <View style={[puff(w * 0.72), { marginHorizontal: -w * 0.22 }]} />
      <View style={puff(w * 0.46)} />
    </Animated.View>
  );
}

/* ------------------------------ ground ----------------------------- */
function Ground() {
  const grassH = 18;
  let d = `M0 ${grassH} L0 6 `;
  for (let x = 0; x < W; x += 12) {
    d += `Q ${x + 6} 0 ${x + 12} 6 `;
  }
  d += `L${W} ${grassH} Z`;
  return (
    <View style={styles.ground}>
      <Svg width={W} height={GROUND_H}>
        <Defs>
          <Pattern
            id="stripes"
            width={22}
            height={22}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <Rect width={22} height={22} fill={C.dirt} />
            <Rect width={11} height={22} fill={C.dirtDk} />
          </Pattern>
        </Defs>
        <Rect x={0} y={grassH} width={W} height={GROUND_H - grassH} fill="url(#stripes)" />
        <Path d={d} fill={C.grass} />
        <Rect x={0} y={grassH - 3} width={W} height={3} fill={C.grassDk} />
      </Svg>
    </View>
  );
}

/* ------------------------------- sun ------------------------------- */
function Sun({ top, left, size }: { top: number; left: number; size: number }) {
  const s = size;
  return (
    <View
      style={{
        position: "absolute",
        top,
        left,
        width: s,
        height: s,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1
      }}
    >
      <View
        style={{
          position: "absolute",
          width: s * 1.7,
          height: s * 1.7,
          borderRadius: s,
          backgroundColor: "rgba(255,246,200,0.12)"
        }}
      />
      <View
        style={{
          position: "absolute",
          width: s * 1.35,
          height: s * 1.35,
          borderRadius: s,
          backgroundColor: "rgba(255,246,200,0.18)"
        }}
      />
      <View style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: C.sun }} />
      <View
        style={{
          position: "absolute",
          top: s * 0.18,
          left: s * 0.18,
          width: s * 0.5,
          height: s * 0.5,
          borderRadius: s,
          backgroundColor: "#fffbe2"
        }}
      />
    </View>
  );
}

/* ============================ StartScreen ========================== */
export default function StartScreen({
  onStart,
  snailSprite,
  bestScore = 0
}: {
  onStart: () => void;
  snailSprite: ImageSourcePropType;
  bestScore?: number;
}) {
  const insets = useSafeAreaInsets();
  const [bob] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));
  const [drift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = (val: Animated.Value, up: number, down: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration: up,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: down,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          })
        ])
      );
    const a = loop(bob, 1300, 1300);
    const b = loop(pulse, 620, 620);
    const c = Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );
    a.start();
    b.start();
    c.start();
    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, [bob, pulse, drift]);

  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -HERO_H * 0.14] });
  const bobRot = bob.interpolate({ inputRange: [0, 1], outputRange: ["-5deg", "4deg"] });
  const pulseO = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const pulseY = pulse.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const driftX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, 16] });

  return (
    <Pressable style={styles.fill} onPress={onStart}>
      <LinearGradient
        colors={[C.skyTop, C.skyMid, C.skyLow]}
        locations={[0, 0.52, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Sun top={insets.top + 14} left={W * 0.08} size={W * 0.16} />

      <Cloud w={84} drift={driftX} style={{ top: insets.top + 50, right: 26 }} />
      <Cloud w={62} drift={driftX} style={{ top: H * 0.255, left: 16, opacity: 0.92 }} />
      <Cloud w={48} drift={driftX} style={{ top: H * 0.355, right: 60, opacity: 0.8 }} />

      <Pipe
        left={BACK_LEFT}
        top={BACK_TOP}
        width={BACK_W}
        height={GROUND_TOP - BACK_TOP + 6}
        capAt="top"
      />
      <Pipe left={MAIN_LEFT} top={0} width={MAIN_W} height={GAP_TOP} capAt="bottom" />
      <Pipe
        left={MAIN_LEFT}
        top={GAP_BOTTOM}
        width={MAIN_W}
        height={GROUND_TOP - GAP_BOTTOM + 6}
        capAt="top"
      />

      <Svg
        width={TRAIL_W}
        height={TRAIL_H}
        viewBox="0 0 210 140"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: HERO_CX - TRAIL_W * 0.72,
          top: HERO_CY - TRAIL_H * 0.02,
          zIndex: 3
        }}
      >
        <Path
          d="M5 132 C 36 138, 64 110, 90 86 S 150 36, 204 16"
          fill="none"
          stroke={C.cream}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={[2, 12]}
          opacity={0.85}
        />
      </Svg>

      <Animated.View
        style={{
          position: "absolute",
          left: HERO_CX - HERO_W / 2,
          top: HERO_CY - HERO_H / 2,
          width: HERO_W,
          height: HERO_H,
          zIndex: 4,
          transform: [{ translateY: bobY }, { rotate: bobRot }]
        }}
      >
        <Image
          source={snailSprite}
          style={{ width: HERO_W, height: HERO_H }}
          resizeMode="contain"
        />
      </Animated.View>

      <Ground />

      <View
        style={{
          position: "absolute",
          top: insets.top + 8,
          right: W * 0.05,
          alignItems: "flex-end",
          zIndex: 5
        }}
      >
        <Outline color={C.accent} style={styles.bestLabel}>
          BEST
        </Outline>
        <Outline color={C.white} style={styles.bestNum}>
          {String(bestScore)}
        </Outline>
      </View>

      <View
        style={{
          position: "absolute",
          top: insets.top + 56,
          left: 0,
          right: 0,
          alignItems: "center",
          zIndex: 5
        }}
      >
        <Outline color={C.white} style={styles.l1}>
          FLAPPY
        </Outline>
        <Outline color={C.accent} style={styles.l2}>
          SNAIL
        </Outline>
        <Text style={styles.tagline}>THE SLOWEST WAY TO FLY</Text>
      </View>

      <Animated.View
        style={{
          position: "absolute",
          bottom: insets.bottom + H * 0.12,
          left: 0,
          right: 0,
          alignItems: "center",
          zIndex: 5,
          opacity: pulseO,
          transform: [{ translateY: pulseY }]
        }}
      >
        <Outline color={C.white} style={styles.cta}>
          TAP TO START
        </Outline>
        <Text style={styles.ctaSub}>▲ TAP TO FLAP ▲</Text>
      </Animated.View>
    </Pressable>
  );
}

/* ------------------------------ styles ----------------------------- */
const styles = StyleSheet.create({
  bestLabel: { fontFamily: F_PIXEL, fontSize: 9, letterSpacing: 1 },
  bestNum: { fontFamily: F_PIXEL, fontSize: 12, marginTop: 5 },
  cloud: { position: "absolute", flexDirection: "row", alignItems: "flex-end" },
  cta: { fontFamily: F_PIXEL, fontSize: 14, letterSpacing: 1, textAlign: "center" },
  ctaSub: {
    fontFamily: F_PIXEL,
    fontSize: 8,
    letterSpacing: 1,
    color: C.accent,
    marginTop: 10
  },
  fill: { flex: 1, backgroundColor: C.skyTop },
  ground: { position: "absolute", left: 0, bottom: 0, width: W, height: GROUND_H, zIndex: 3 },
  l1: { fontFamily: F_DISPLAY_SEMI, fontSize: 40, letterSpacing: 5, color: C.white },
  l2: {
    fontFamily: F_DISPLAY_BOLD,
    fontSize: 64,
    letterSpacing: 2,
    color: C.accent,
    marginTop: 2
  },
  outlineCopy: { position: "absolute" },
  outlineWrap: { position: "relative" },
  tagline: {
    fontFamily: F_PIXEL,
    fontSize: 8,
    letterSpacing: 1,
    color: C.tealText,
    marginTop: 12
  }
});

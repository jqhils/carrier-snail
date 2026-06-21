import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop
} from "react-native-svg";

import { SnailSprite } from "../components/SnailSprite";
import {
  FIRST_RUN_ONBOARDING_STEPS,
  LOCATION_PRIVACY_PLAIN_LANGUAGE
} from "../useCases/onboarding";

type OnboardingScreenProps = {
  onStart: () => void;
};

/** First-run screen, shown above the tabs until the first snail is sent. */
export function OnboardingScreen({ onStart }: OnboardingScreenProps) {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingHero />

        <View style={styles.header}>
          <Text style={styles.eyebrow}>First delivery</Text>
          <Text style={styles.title}>Garden Snail is ready</Text>
          <Text style={styles.subtitle}>
            A calm to-do app, where any thought can be carried to you by a snail,
            at real snail speed.
          </Text>
        </View>

        <View style={styles.steps}>
          {FIRST_RUN_ONBOARDING_STEPS.map((step, index) => (
            <View key={step} style={styles.step}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.privacy}>{LOCATION_PRIVACY_PLAIN_LANGUAGE}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityLabel="Start with Garden Snail"
          accessibilityRole="button"
          onPress={onStart}
          style={({ pressed }) => [
            styles.button,
            pressed ? styles.buttonPressed : null
          ]}
        >
          <Text style={styles.buttonText}>Start with Garden Snail</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function OnboardingHero() {
  return (
    <View
      accessibilityLabel="Garden Snail crossing a quiet map with a slime trail"
      accessibilityRole="image"
      style={styles.hero}
    >
      <Svg
        pointerEvents="none"
        preserveAspectRatio="none"
        style={styles.heroMap}
        viewBox="0 0 360 236"
      >
        <Defs>
          <LinearGradient id="heroGround" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor="#eee8d7" />
            <Stop offset="1" stopColor="#e0dbc8" />
          </LinearGradient>
          <LinearGradient id="slime" x1="0" x2="1" y1="1" y2="0">
            <Stop offset="0" stopColor="#fbfff4" stopOpacity="0.35" />
            <Stop offset="0.48" stopColor="#f8ffe7" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#e5efd6" stopOpacity="0.45" />
          </LinearGradient>
        </Defs>

        <Rect fill="url(#heroGround)" height="236" rx="8" width="360" />
        <Path
          d="M-18 170 C42 126 94 138 140 96 C190 50 260 54 382 24 L382 236 L-18 236 Z"
          fill="#d5dfc5"
        />
        <Path
          d="M-16 32 C42 54 76 48 126 30 C174 12 218 24 258 52 C296 80 330 82 382 68 L382 -18 L-16 -18 Z"
          fill="#c4d2b8"
          opacity="0.78"
        />
        <Path
          d="M22 208 C74 176 118 176 174 202 C228 226 286 210 342 180"
          fill="none"
          opacity="0.35"
          stroke="#91a181"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <Path
          d="M24 88 C70 92 100 74 132 52 M182 148 C222 126 258 126 330 134"
          fill="none"
          opacity="0.38"
          stroke="#9aaa8d"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        <Path
          d="M78 166 L290 72"
          fill="none"
          stroke="#a8b99b"
          strokeLinecap="round"
          strokeWidth="6"
        />
        <Path
          d="M78 166 L290 72"
          fill="none"
          stroke="url(#slime)"
          strokeLinecap="round"
          strokeWidth="3.6"
        />
        <Circle cx="112" cy="151" fill="#fbfff4" opacity="0.75" r="2.4" />
        <Circle cx="158" cy="131" fill="#fbfff4" opacity="0.6" r="1.8" />
        <Circle cx="206" cy="109" fill="#fbfff4" opacity="0.7" r="2.1" />
        <Circle cx="290" cy="72" fill="#f5f8ed" opacity="0.92" r="12" />
        <Circle cx="290" cy="72" fill="#2f604e" r="5.5" />
      </Svg>

      <View pointerEvents="none" style={styles.heroSnail}>
        <SnailSprite
          accessibilityLabel="Garden Snail carrying the first delivery"
          size={154}
          speciesId="garden"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#2f604e",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 18
  },
  buttonPressed: {
    backgroundColor: "#264f40"
  },
  buttonText: {
    color: "#f6faf6",
    fontSize: 16,
    fontWeight: "800"
  },
  content: {
    alignSelf: "center",
    flexGrow: 1,
    gap: 24,
    maxWidth: 430,
    paddingHorizontal: 24,
    paddingTop: 24,
    width: "100%"
  },
  eyebrow: {
    color: "#557363",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  footer: {
    alignItems: "center",
    paddingBottom: 18,
    paddingHorizontal: 24,
    paddingTop: 12
  },
  header: {
    gap: 8
  },
  hero: {
    alignItems: "center",
    alignSelf: "center",
    aspectRatio: 1.52,
    borderColor: "#ded6c0",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    maxWidth: 382,
    overflow: "hidden",
    width: "100%"
  },
  heroMap: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  heroSnail: {
    alignItems: "center",
    bottom: 14,
    left: 0,
    position: "absolute",
    right: 0
  },
  privacy: {
    color: "#6c766f",
    fontSize: 13,
    lineHeight: 19
  },
  screen: {
    backgroundColor: "#f4f0e3",
    flex: 1
  },
  step: {
    flexDirection: "row",
    gap: 14
  },
  stepNumber: {
    color: "#2f604e",
    fontSize: 17,
    fontWeight: "900",
    width: 20
  },
  stepText: {
    color: "#3a463f",
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    minWidth: 0
  },
  steps: {
    gap: 18
  },
  subtitle: {
    color: "#5f6e66",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 23
  },
  title: {
    color: "#26352f",
    fontSize: 30,
    fontWeight: "900",
    lineHeight: 35
  }
});

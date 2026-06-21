import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PixelButton } from "../components/PixelButton";
import { SnailSprite } from "../components/SnailSprite";
import { colors, radii, space, text } from "../theme";
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
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.privacy}>{LOCATION_PRIVACY_PLAIN_LANGUAGE}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <PixelButton
          accessibilityLabel="Start with Garden Snail"
          label="Get started"
          onPress={onStart}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}

function OnboardingHero() {
  return (
    <View
      accessibilityLabel="Three snails facing the Garden Snail"
      accessibilityRole="image"
      style={styles.hero}
    >
      <View pointerEvents="none" style={[styles.snailPlacement, styles.snailBack]}>
        <SnailSprite size={92} speciesId="backwards" />
      </View>
      <View pointerEvents="none" style={[styles.snailPlacement, styles.snailMiddle]}>
        <SnailSprite size={110} speciesId="postal" />
      </View>
      <View pointerEvents="none" style={[styles.snailPlacement, styles.snailFront]}>
        <SnailSprite size={86} speciesId="barista" />
      </View>
      <View pointerEvents="none" style={[styles.snailPlacement, styles.snailGarden]}>
        <SnailSprite
          accessibilityLabel="Garden Snail facing the group"
          size={126}
          speciesId="garden"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    ...text.pixelLabel,
    color: colors.accentWarm,
    textTransform: "uppercase"
  },
  footer: {
    paddingBottom: 18,
    paddingHorizontal: 24,
    paddingTop: 12
  },
  header: {
    gap: space.sm
  },
  hero: {
    alignItems: "center",
    alignSelf: "center",
    height: 154,
    justifyContent: "center",
    maxWidth: 340,
    width: "100%"
  },
  privacy: {
    ...text.bodySm,
    color: colors.textMuted
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  snailBack: {
    left: 10,
    top: 14,
    transform: [{ rotate: "-7deg" }]
  },
  snailFront: {
    left: 80,
    top: 66,
    transform: [{ rotate: "5deg" }]
  },
  snailGarden: {
    right: 0,
    top: 38,
    transform: [{ scaleX: -1 }, { rotate: "-2deg" }]
  },
  snailMiddle: {
    left: 44,
    top: 38,
    transform: [{ rotate: "-1deg" }]
  },
  snailPlacement: {
    position: "absolute",
    zIndex: 1
  },
  step: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  stepBadge: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    height: 28,
    justifyContent: "center",
    width: 28
  },
  stepNumber: {
    ...text.pixelLabel,
    color: colors.primary
  },
  stepText: {
    ...text.body,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0
  },
  steps: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 2,
    gap: 16,
    padding: 16
  },
  subtitle: {
    ...text.bodyLg,
    color: colors.textMuted
  },
  title: {
    ...text.pixelTitle,
    color: colors.primary
  }
});

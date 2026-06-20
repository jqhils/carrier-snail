import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    flexGrow: 1,
    gap: 24,
    paddingHorizontal: 24,
    paddingTop: 28
  },
  eyebrow: {
    color: "#557363",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  footer: {
    paddingBottom: 18,
    paddingHorizontal: 24,
    paddingTop: 12
  },
  header: {
    gap: 8
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

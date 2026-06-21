import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FadeInView } from "../components/FadeInView";
import { colors, radii, text } from "../theme";

type EmptyTabScreenProps = {
  body: string;
  eyebrow: string;
  title: string;
  tone: "sage" | "cream" | "blue";
};

// Each tone keeps its name but resolves to a token-based palette: a tinted page
// background with a brighter panel sitting on it. The chunky 2px ink border is
// shared (see styles.panel), so tones differ only by their fills.
const toneStyles = {
  blue: {
    background: colors.secondarySoft,
    panel: colors.surface
  },
  cream: {
    background: colors.background,
    panel: colors.surface
  },
  sage: {
    background: colors.primarySoft,
    panel: colors.surface
  }
} as const;

export function EmptyTabScreen({
  body,
  eyebrow,
  title,
  tone
}: EmptyTabScreenProps) {
  const palette = toneStyles[tone];

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <FadeInView>
      <View style={styles.content}>
        <View style={[styles.panel, { backgroundColor: palette.panel }]}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>
      </View>
      </FadeInView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: {
    ...text.body,
    color: colors.textMuted,
    marginTop: 9
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 34
  },
  eyebrow: {
    ...text.pixelLabel,
    color: colors.accentWarm,
    textTransform: "uppercase"
  },
  panel: {
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 22
  },
  screen: {
    flex: 1
  },
  title: {
    ...text.pixelHeading,
    color: colors.textPrimary,
    marginTop: 8
  }
});

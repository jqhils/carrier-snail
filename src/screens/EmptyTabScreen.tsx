import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FadeInView } from "../components/FadeInView";

type EmptyTabScreenProps = {
  body: string;
  eyebrow: string;
  title: string;
  tone: "sage" | "cream" | "blue";
};

const toneStyles = {
  blue: {
    accent: "#365c8d",
    background: "#eef2f6",
    panel: "#f8f6ed"
  },
  cream: {
    accent: "#8a6f4f",
    background: "#f4f0e3",
    panel: "#fbf8ed"
  },
  sage: {
    accent: "#3f6d5b",
    background: "#edf1e8",
    panel: "#f8f6ed"
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
        <View
          style={[
            styles.panel,
            {
              backgroundColor: palette.panel,
              borderColor: `${palette.accent}33`
            }
          ]}
        >
          <Text style={[styles.eyebrow, { color: palette.accent }]}>
            {eyebrow}
          </Text>
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
    color: "#5c6861",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 9
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 34
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 22
  },
  screen: {
    flex: 1
  },
  title: {
    color: "#25332e",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    marginTop: 8
  }
});

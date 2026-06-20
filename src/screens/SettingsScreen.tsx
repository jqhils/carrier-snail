import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FadeInView } from "../components/FadeInView";
import {
  BACKGROUND_LOCATION_PERMISSION_COPY,
  type BackgroundLocationMode
} from "../useCases/configureOptionalBackgroundLocation";

type SettingsScreenProps = {
  backgroundLocationBusy: boolean;
  backgroundLocationMode: BackgroundLocationMode;
  onCycleWarp: () => void;
  onToggleBackgroundLocation: (enabled: boolean) => void;
  timeWarpFactor: number;
};

export function SettingsScreen({
  backgroundLocationBusy,
  backgroundLocationMode,
  onCycleWarp,
  onToggleBackgroundLocation,
  timeWarpFactor
}: SettingsScreenProps) {
  const backgroundOn = backgroundLocationMode === "background-enabled";
  const statusLabel = backgroundLocationBusy
    ? "Updating…"
    : backgroundLocationMode === "background-enabled"
      ? "On · re-aims while the app is closed"
      : backgroundLocationMode === "location-denied"
        ? "Off · location permission was denied"
        : "Off · foreground only";

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <FadeInView>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Carrier Snail</Text>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>
              A couple of quiet controls. Nothing here rushes a snail.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Background location</Text>
              <Switch
                accessibilityLabel="Background location"
                disabled={backgroundLocationBusy}
                onValueChange={onToggleBackgroundLocation}
                thumbColor="#f8f6ed"
                trackColor={{ false: "#c4cdc3", true: "#3f6d5b" }}
                value={backgroundOn}
              />
            </View>
            <Text style={styles.cardBody}>
              {BACKGROUND_LOCATION_PERMISSION_COPY}
            </Text>
            <Text style={styles.cardStatus}>{statusLabel}</Text>
          </View>

          {__DEV__ ? (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Developer · time warp</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cycle debug time warp"
                  onPress={onCycleWarp}
                  style={({ pressed }) => [
                    styles.warpButton,
                    pressed ? styles.warpButtonPressed : null
                  ]}
                >
                  <Text style={styles.warpValue}>
                    {timeWarpFactor.toLocaleString()}x
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.cardBody}>
                Compresses crawl time for testing. Real builds are locked to 1x.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </FadeInView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f8f6ed",
    borderColor: "rgba(63, 109, 91, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 15
  },
  cardBody: {
    color: "#5f6e66",
    fontSize: 14,
    lineHeight: 20
  },
  cardHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  cardStatus: {
    color: "#557363",
    fontSize: 13,
    fontWeight: "700"
  },
  cardTitle: {
    color: "#26352f",
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    minWidth: 0
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 22
  },
  eyebrow: {
    color: "#557363",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  header: {
    gap: 6
  },
  screen: {
    backgroundColor: "#edf1e8",
    flex: 1
  },
  subtitle: {
    color: "#5f6e66",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
    maxWidth: 420
  },
  title: {
    color: "#26352f",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 33
  },
  warpButton: {
    backgroundColor: "#dfeee4",
    borderColor: "rgba(47, 96, 78, 0.18)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  warpButtonPressed: {
    backgroundColor: "#cfe6d8"
  },
  warpValue: {
    color: "#2f604e",
    fontSize: 15,
    fontWeight: "800"
  }
});

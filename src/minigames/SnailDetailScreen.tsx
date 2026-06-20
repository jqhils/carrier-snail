import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { Snail } from "../useCases/localCarrierState";

type Props = {
  onBack: () => void;
  // Optional stub targets owned by a teammate. When undefined, the buttons show
  // as "coming soon"; pass handlers to route into the cosmetics / shop flows.
  onCosmetics?: () => void;
  onPlayGames: () => void;
  onShop?: () => void;
  slimeBalance?: number;
  snail: Snail;
};

// A single snail's detail screen. Read-only stats + actions. Leveling is NOT
// here — it stays on the My Snails selected-snail panel (Option 2), so this
// screen never touches the economy beyond launching games.
export function SnailDetailScreen({
  onBack,
  onCosmetics,
  onPlayGames,
  onShop,
  slimeBalance,
  snail
}: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed ? styles.pressed : null
          ]}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        {typeof slimeBalance === "number" ? (
          <Text style={styles.slime}>{slimeBalance} slime</Text>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.emblem}>
            <View
              style={[
                styles.emblemBody,
                { backgroundColor: snail.appearance.bodyColor }
              ]}
            />
            <View
              style={[
                styles.emblemShell,
                { backgroundColor: snail.appearance.shellColor }
              ]}
            />
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {snail.name}
          </Text>
          <Text style={styles.subtitle}>
            Lv {snail.level} · {snail.rarity}
          </Text>
        </View>

        <View style={styles.statsCard}>
          <Stat label="Speed" value={`${Math.round(snail.baseSpeedMetersPerHour)} m/h`} />
          <Stat label="Reliability" value={`${Math.round(snail.reliability)}%`} />
          <Stat label="Journeys" value={`${snail.journeysCompleted}`} />
          <Stat label="Status" value={snail.status === "resting" ? "Resting" : "On journey"} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onPlayGames}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null
          ]}
        >
          <Text style={styles.primaryButtonText}>Play Games</Text>
        </Pressable>

        <StubButton label="Cosmetics" onPress={onCosmetics} />
        <StubButton label="Shop" onPress={onShop} />
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

// A button for a flow a teammate owns. Active if a handler is supplied,
// otherwise rendered as a disabled "coming soon" placeholder.
function StubButton({
  label,
  onPress
}: {
  label: string;
  onPress?: () => void;
}) {
  if (!onPress) {
    return (
      <View style={[styles.secondaryButton, styles.secondaryDisabled]}>
        <Text style={styles.secondaryDisabledText}>{label}</Text>
        <Text style={styles.soonText}>soon</Text>
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryButton,
        pressed ? styles.pressed : null
      ]}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingHorizontal: 4,
    paddingVertical: 6
  },
  backText: {
    color: "#3f6d5b",
    fontSize: 16,
    fontWeight: "700"
  },
  content: {
    padding: 18,
    paddingBottom: 40
  },
  emblem: {
    height: 64,
    marginBottom: 10,
    position: "relative",
    width: 80
  },
  emblemBody: {
    borderRadius: 12,
    bottom: 8,
    height: 24,
    position: "absolute",
    right: 4,
    width: 52
  },
  emblemShell: {
    borderRadius: 24,
    height: 48,
    left: 6,
    position: "absolute",
    top: 4,
    width: 48
  },
  hero: {
    alignItems: "center",
    paddingBottom: 18,
    paddingTop: 6
  },
  name: {
    color: "#2f4a3d",
    fontSize: 24,
    fontWeight: "900"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#3f6d5b",
    borderRadius: 12,
    marginTop: 18,
    paddingVertical: 14
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800"
  },
  pressed: {
    opacity: 0.85
  },
  screen: {
    backgroundColor: "#eef1e8",
    flex: 1
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    paddingVertical: 13
  },
  secondaryButtonText: {
    color: "#2f4a3d",
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryDisabled: {
    backgroundColor: "#e7ebe1"
  },
  secondaryDisabledText: {
    color: "#9aa79a",
    fontSize: 15,
    fontWeight: "700"
  },
  slime: {
    color: "#3f6d5b",
    fontSize: 14,
    fontWeight: "800"
  },
  soonText: {
    color: "#b3bdab",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8
  },
  statLabel: {
    color: "#5a6b7a",
    fontSize: 15
  },
  statRow: {
    alignItems: "center",
    borderTopColor: "#eef1e8",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 11
  },
  statValue: {
    color: "#2f4a3d",
    fontSize: 15,
    fontWeight: "800"
  },
  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4
  },
  subtitle: {
    color: "#5a6b7a",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 8
  }
});

import { ScrollView, StyleSheet, Text, View } from "react-native";

import { PixelButton } from "../components/PixelButton";
import { RarityBadge, SlimeChip } from "../components/PixelUI";
import { SnailSprite } from "../components/SnailSprite";
import { colors, radii, space, text } from "../theme";
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
        <PixelButton
          accessibilityLabel="Back"
          label="‹ Back"
          onPress={onBack}
          size="compact"
          variant="neutral"
        />
        {typeof slimeBalance === "number" ? (
          <SlimeChip count={slimeBalance} />
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.portraitTile}>
            <SnailSprite
              speciesId={snail.speciesId}
              size={140}
              accessibilityLabel={`${snail.name} portrait`}
            />
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {snail.name}
          </Text>
          <View style={styles.heroMeta}>
            <Text style={styles.subtitle}>Lv {snail.level}</Text>
            <RarityBadge rarity={snail.rarity} />
          </View>
        </View>

        <View style={styles.statsCard}>
          <Stat label="Speed" value={`${Math.round(snail.baseSpeedMetersPerHour)} m/h`} />
          <Stat label="Reliability" value={`${Math.round(snail.reliability)}%`} />
          <Stat label="Journeys" value={`${snail.journeysCompleted}`} />
          <Stat label="Status" value={snail.status === "resting" ? "Resting" : "On journey"} />
        </View>

        <PixelButton
          label="Play Games"
          onPress={onPlayGames}
          style={styles.primaryButton}
          variant="primary"
        />

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
      <PixelButton
        accessibilityLabel={`${label} (coming soon)`}
        disabled
        label={`${label} · soon`}
        style={styles.stubButton}
        variant="secondary"
      />
    );
  }
  return (
    <PixelButton
      label={label}
      onPress={onPress}
      style={styles.stubButton}
      variant="secondary"
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    paddingBottom: 40
  },
  hero: {
    alignItems: "center",
    paddingBottom: space.lg,
    paddingTop: space.xs
  },
  heroMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm,
    marginTop: space.sm
  },
  name: {
    ...text.pixelTitle,
    color: colors.textPrimary,
    marginTop: space.xs
  },
  portraitTile: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 2,
    justifyContent: "center",
    marginBottom: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    width: "100%"
  },
  primaryButton: {
    marginTop: space.lg
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  statLabel: {
    ...text.body,
    color: colors.textMuted
  },
  statRow: {
    alignItems: "center",
    borderTopColor: colors.borderHairline,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: space.md
  },
  statValue: {
    ...text.bodyStrong,
    color: colors.textPrimary
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 2,
    paddingHorizontal: space.lg,
    paddingVertical: space.xs
  },
  stubButton: {
    marginTop: space.sm
  },
  subtitle: {
    ...text.bodyStrong,
    color: colors.textMuted
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: space.md,
    paddingTop: space.sm
  }
});

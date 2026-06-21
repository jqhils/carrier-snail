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
import { colors, radii, text } from "../theme";
import {
  BACKGROUND_LOCATION_PERMISSION_COPY,
  type BackgroundLocationMode
} from "../useCases/configureOptionalBackgroundLocation";
import type { MapSkinId, MapSkinOption } from "../useCases/mapSkins";

type SettingsScreenProps = {
  backgroundLocationBusy: boolean;
  backgroundLocationMode: BackgroundLocationMode;
  mapSkinOptions: MapSkinOption[];
  mapTilerKeyAvailable: boolean;
  onCycleWarp: () => void;
  onSelectMapSkin: (skinId: MapSkinId) => void;
  onToggleBackgroundLocation: (enabled: boolean) => void;
  selectedMapSkinId: MapSkinId;
  timeWarpFactor: number;
};

export function SettingsScreen({
  backgroundLocationBusy,
  backgroundLocationMode,
  mapSkinOptions,
  mapTilerKeyAvailable,
  onCycleWarp,
  onSelectMapSkin,
  onToggleBackgroundLocation,
  selectedMapSkinId,
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
  const selectedMapSkinLabel =
    mapSkinOptions.find((skin) => skin.id === selectedMapSkinId)?.label ??
    "Streets";

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
                ios_backgroundColor={colors.disabledFill}
                onValueChange={onToggleBackgroundLocation}
                thumbColor={colors.surface}
                trackColor={{ false: colors.disabledFill, true: colors.primary }}
                value={backgroundOn}
              />
            </View>
            <Text style={styles.cardBody}>
              {BACKGROUND_LOCATION_PERMISSION_COPY}
            </Text>
            <Text style={styles.cardStatus}>{statusLabel}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Map skin</Text>
            </View>
            <Text style={styles.cardBody}>
              Pick the basemap used behind the trail.
            </Text>
            <View style={styles.skinSelector}>
              {mapSkinOptions.map((skin) => {
                const selected = skin.id === selectedMapSkinId;

                return (
                  <Pressable
                    accessibilityLabel={`Use ${skin.label} map skin`}
                    accessibilityRole="button"
                    key={skin.id}
                    onPress={() => onSelectMapSkin(skin.id)}
                    style={({ pressed }) => [
                      styles.skinButton,
                      selected ? styles.skinButtonSelected : null,
                      pressed ? styles.skinButtonPressed : null
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.skinButtonText,
                        selected ? styles.skinButtonTextSelected : null
                      ]}
                    >
                      {skin.label}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.skinButtonDetail,
                        selected ? styles.skinButtonDetailSelected : null
                      ]}
                    >
                      {skin.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.cardStatus}>
              {mapTilerKeyAvailable
                ? `${selectedMapSkinLabel} selected`
                : "Demo basemap active until this build has a MapTiler key."}
            </Text>
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 2,
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 15
  },
  cardBody: {
    ...text.body,
    color: colors.textMuted
  },
  cardHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  cardStatus: {
    ...text.bodyStrongSm,
    color: colors.primary
  },
  cardTitle: {
    ...text.pixelHeading,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 22
  },
  eyebrow: {
    ...text.pixelLabel,
    color: colors.accentWarm,
    textTransform: "uppercase"
  },
  header: {
    gap: 8
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  skinButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    minHeight: 60,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  skinButtonDetail: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 3
  },
  skinButtonDetailSelected: {
    color: colors.textPrimary
  },
  skinButtonPressed: {
    backgroundColor: colors.surfaceSelected
  },
  skinButtonSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  skinButtonText: {
    ...text.bodyStrong,
    color: colors.textPrimary
  },
  skinButtonTextSelected: {
    ...text.pixelLabel,
    color: colors.primary
  },
  skinSelector: {
    gap: 8,
    marginTop: 2
  },
  subtitle: {
    ...text.bodyLg,
    color: colors.textMuted,
    maxWidth: 420
  },
  title: {
    ...text.pixelTitle,
    color: colors.textPrimary
  },
  warpButton: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: radii.md,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  warpButtonPressed: {
    backgroundColor: colors.surfaceSelected
  },
  warpValue: {
    ...text.bodyStrong,
    color: colors.primary
  }
});

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
  skinButton: {
    backgroundColor: "#fdfcf5",
    borderColor: "rgba(37, 51, 46, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 60,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  skinButtonDetail: {
    color: "#5f6e66",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 3
  },
  skinButtonDetailSelected: {
    color: "#3f6d5b"
  },
  skinButtonPressed: {
    backgroundColor: "#edf4ea"
  },
  skinButtonSelected: {
    backgroundColor: "#dfeee4",
    borderColor: "#3f6d5b",
    borderWidth: 2
  },
  skinButtonText: {
    color: "#26352f",
    fontSize: 14,
    fontWeight: "900"
  },
  skinButtonTextSelected: {
    color: "#2f604e"
  },
  skinSelector: {
    gap: 8,
    marginTop: 2
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

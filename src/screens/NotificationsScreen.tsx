import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FadeInView } from "../components/FadeInView";
import { SnailSprite } from "../components/SnailSprite";
import { colors, radii, text } from "../theme";
import type { ArrivalInboxItem } from "../useCases/arrivalInboxUseCases";

type NotificationsScreenProps = {
  arrivals: ArrivalInboxItem[];
  nowMs: number;
  onViewed: () => void;
};

export function NotificationsScreen({
  arrivals,
  nowMs,
  onViewed
}: NotificationsScreenProps) {
  useEffect(() => {
    onViewed();
  }, [onViewed]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <FadeInView>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Notifications</Text>
          <Text style={styles.title}>Arrivals</Text>
          <Text style={styles.subtitle}>
            A quiet ledger of the thoughts that made the whole crawl.
          </Text>
        </View>

        {arrivals.length > 0 ? (
          <View style={styles.arrivalList}>
            {arrivals.map((arrival) => (
              <View key={arrival.id} style={styles.arrivalItem}>
                <View style={styles.arrivalHeader}>
                  <View style={styles.arrivalSnailIdentity}>
                    {arrival.snailSpeciesId ? (
                      <SnailSprite
                        speciesId={arrival.snailSpeciesId}
                        size={36}
                      />
                    ) : null}
                    <Text numberOfLines={1} style={styles.snailName}>
                      {arrival.snailName}
                    </Text>
                  </View>
                  {!arrival.seen ? (
                    <Text style={styles.unseenPill}>New</Text>
                  ) : null}
                </View>
                <Text numberOfLines={3} style={styles.arrivalText}>
                  {arrival.text}
                </Text>
                <Text style={styles.arrivalTime}>
                  Landed {formatArrivalTime(arrival.arrivedAtMs, nowMs)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No shells on the mat</Text>
            <Text style={styles.emptyBody}>
              When a snail finally reaches you, its delivery settles here.
            </Text>
          </View>
        )}
      </ScrollView>
      </FadeInView>
    </SafeAreaView>
  );
}

function formatArrivalTime(arrivedAtMs: number, nowMs: number): string {
  const elapsedMs = Math.max(0, nowMs - arrivedAtMs);
  const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));

  if (elapsedMinutes < 1) {
    return "just now";
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  if (elapsedHours < 48) {
    return `${elapsedHours}h ago`;
  }

  return `${Math.floor(elapsedHours / 24)}d ago`;
}

const styles = StyleSheet.create({
  arrivalHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  arrivalItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 13
  },
  arrivalList: {
    gap: 12
  },
  arrivalSnailIdentity: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 8,
    minWidth: 0
  },
  arrivalText: {
    ...text.bodyStrongLg,
    color: colors.textPrimary
  },
  arrivalTime: {
    ...text.bodySm,
    color: colors.textMuted
  },
  content: {
    gap: 22,
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 22
  },
  emptyBody: {
    ...text.body,
    color: colors.textMuted,
    marginTop: 7,
    maxWidth: 310,
    textAlign: "center"
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    paddingHorizontal: 24,
    paddingVertical: 34
  },
  emptyTitle: {
    ...text.pixelHeading,
    color: colors.textPrimary
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
  snailName: {
    ...text.bodyStrong,
    color: colors.textPrimary,
    flex: 1
  },
  subtitle: {
    ...text.body,
    color: colors.textMuted,
    maxWidth: 420
  },
  title: {
    ...text.pixelTitle,
    color: colors.textPrimary
  },
  unseenPill: {
    ...text.pixelMicro,
    backgroundColor: colors.accentPink,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    color: colors.textPrimary,
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 3
  }
});

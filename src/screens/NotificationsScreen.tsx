import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FadeInView } from "../components/FadeInView";
import { SnailSprite } from "../components/SnailSprite";
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
    backgroundColor: "#f8f5eb",
    borderColor: "rgba(75, 91, 82, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 15
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
    color: "#2c3933",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
    marginTop: 10
  },
  arrivalTime: {
    color: "#6c766f",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 9
  },
  content: {
    gap: 22,
    paddingBottom: 28,
    paddingHorizontal: 20,
    paddingTop: 22
  },
  emptyBody: {
    color: "#6c766f",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginTop: 7,
    maxWidth: 310,
    textAlign: "center"
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#f8f5eb",
    borderColor: "rgba(75, 91, 82, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 34
  },
  emptyTitle: {
    color: "#31443a",
    fontSize: 20,
    fontWeight: "900"
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
  snailName: {
    color: "#557363",
    flex: 1,
    fontSize: 13,
    fontWeight: "900"
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
    fontSize: 33,
    fontWeight: "900",
    lineHeight: 38
  },
  unseenPill: {
    backgroundColor: "#dfeee4",
    borderColor: "rgba(47, 96, 78, 0.16)",
    borderRadius: 999,
    borderWidth: 1,
    color: "#2f604e",
    fontSize: 12,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4
  }
});

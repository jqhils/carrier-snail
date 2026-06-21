import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FadeInView } from "../components/FadeInView";
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

  const unseenCount = arrivals.filter((arrival) => !arrival.seen).length;

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <FadeInView>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Notifications</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Arrivals</Text>
            {unseenCount > 0 ? (
              <View style={styles.unreadChip}>
                <Text style={styles.unreadChipText}>{unseenCount} new</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.subtitle}>
            A quiet ledger of the thoughts that made the whole crawl.
          </Text>
        </View>

        {arrivals.length > 0 ? (
          <View style={styles.arrivalList}>
            {arrivals.map((arrival) => (
              <View
                key={arrival.id}
                style={[
                  styles.arrivalItem,
                  !arrival.seen ? styles.arrivalItemUnseen : null
                ]}
              >
                <View style={styles.arrivalRow}>
                  <View
                    style={[
                      styles.avatar,
                      !arrival.seen ? styles.avatarUnseen : null
                    ]}
                  >
                    <Text style={styles.avatarGlyph}>🐌</Text>
                  </View>
                  <View style={styles.arrivalBody}>
                    <View style={styles.arrivalHeader}>
                      <Text numberOfLines={1} style={styles.snailName}>
                        {arrival.snailName}
                      </Text>
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
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyGlyph}>🐚</Text>
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
  arrivalBody: {
    flex: 1,
    minWidth: 0
  },
  arrivalHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  arrivalItem: {
    backgroundColor: "#fbfaf3",
    borderColor: "rgba(75, 91, 82, 0.14)",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: "#2f3a30",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 10
  },
  arrivalItemUnseen: {
    backgroundColor: "#f4faf0",
    borderColor: "rgba(47, 96, 78, 0.22)",
    borderLeftColor: "#3f8a63",
    borderLeftWidth: 4
  },
  arrivalList: {
    gap: 12
  },
  arrivalRow: {
    flexDirection: "row",
    gap: 13
  },
  arrivalText: {
    color: "#2c3933",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 23,
    marginTop: 8
  },
  arrivalTime: {
    color: "#6c766f",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 9
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#eef2e8",
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  avatarGlyph: {
    fontSize: 20
  },
  avatarUnseen: {
    backgroundColor: "#dcefe0"
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
  emptyGlyph: {
    fontSize: 36,
    marginBottom: 10
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#fbfaf3",
    borderColor: "rgba(75, 91, 82, 0.14)",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    paddingHorizontal: 24,
    paddingVertical: 36,
    shadowColor: "#2f3a30",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 10
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
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  unreadChip: {
    backgroundColor: "#dcefe0",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 4
  },
  unreadChipText: {
    color: "#2f604e",
    fontSize: 12,
    fontWeight: "900"
  },
  unseenPill: {
    backgroundColor: "#cfe9d6",
    borderColor: "rgba(47, 96, 78, 0.2)",
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

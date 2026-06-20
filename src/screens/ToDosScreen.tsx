import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type {
  InFlightReminderListItem,
  StableSnailListItem
} from "../useCases/localCarrierState";

type ToDosScreenProps = {
  formError: string;
  inFlightReminders: InFlightReminderListItem[];
  onChangeReminderText: (text: string) => void;
  onRecallReminder: (reminderId: string) => void;
  onSendReminder: () => void;
  reminderText: string;
  selectedStableSnail?: StableSnailListItem;
};

export function ToDosScreen({
  formError,
  inFlightReminders,
  onChangeReminderText,
  onRecallReminder,
  onSendReminder,
  reminderText,
  selectedStableSnail
}: ToDosScreenProps) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>To Dos</Text>
          <Text style={styles.title}>To Dos</Text>
          <Text style={styles.subtitle}>
            A clean leaf for thoughts that can afford the long way back.
          </Text>
        </View>

        <View style={styles.composerPanel}>
          <View style={styles.selectedSnailRow}>
            <Text style={styles.selectedSnailLabel}>Carrier</Text>
            <Text numberOfLines={1} style={styles.selectedSnailValue}>
              {selectedStableSnail
                ? selectedStableSnail.name
                : "No resting snail"}
            </Text>
          </View>
          <View style={styles.composerRow}>
            <TextInput
              accessibilityLabel="Reminder text"
              onChangeText={onChangeReminderText}
              onSubmitEditing={onSendReminder}
              placeholder="buy milk"
              placeholderTextColor="#7d7a70"
              returnKeyType="send"
              style={styles.reminderInput}
              value={reminderText}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send reminder"
              disabled={!selectedStableSnail}
              onPress={onSendReminder}
              style={({ pressed }) => [
                styles.sendButton,
                !selectedStableSnail ? styles.sendButtonDisabled : null,
                pressed ? styles.sendButtonPressed : null
              ]}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </Pressable>
          </View>
          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        </View>

        {inFlightReminders.length > 0 ? (
          <View style={styles.inFlightList}>
            {inFlightReminders.map((reminder) => (
              <View key={reminder.reminderId} style={styles.inFlightItem}>
                <View style={styles.inFlightCopy}>
                  <Text numberOfLines={1} style={styles.inFlightText}>
                    {reminder.text}
                  </Text>
                  <Text numberOfLines={1} style={styles.inFlightSnail}>
                    {reminder.snailName}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Recall ${reminder.text}`}
                  onPress={() => onRecallReminder(reminder.reminderId)}
                  style={({ pressed }) => [
                    styles.recallButton,
                    pressed ? styles.recallButtonPressed : null
                  ]}
                >
                  <Text style={styles.recallButtonText}>Recall</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyList}>
            <Text style={styles.emptyTitle}>Nothing on the trail</Text>
            <Text style={styles.emptyBody}>
              The page is quiet until a snail accepts a thought.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  composerPanel: {
    backgroundColor: "#fbf8ed",
    borderColor: "rgba(138, 111, 79, 0.2)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 18,
    padding: 12
  },
  composerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  },
  content: {
    paddingBottom: 22,
    paddingHorizontal: 18,
    paddingTop: 20
  },
  emptyBody: {
    color: "#56645e",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5
  },
  emptyList: {
    backgroundColor: "#f8f6ed",
    borderColor: "rgba(43, 58, 52, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 14,
    padding: 14
  },
  emptyTitle: {
    color: "#25332e",
    fontSize: 14,
    fontWeight: "800"
  },
  errorText: {
    color: "#a13d2d",
    fontSize: 13,
    marginTop: 8
  },
  eyebrow: {
    color: "#8a6f4f",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  header: {
    maxWidth: 360
  },
  inFlightCopy: {
    flex: 1,
    minWidth: 0
  },
  inFlightItem: {
    alignItems: "center",
    backgroundColor: "#f8f6ed",
    borderColor: "rgba(43, 58, 52, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  inFlightList: {
    gap: 9,
    marginTop: 14
  },
  inFlightSnail: {
    color: "#5d6d77",
    fontSize: 12,
    marginTop: 2
  },
  inFlightText: {
    color: "#25332e",
    fontSize: 14,
    fontWeight: "700"
  },
  recallButton: {
    alignItems: "center",
    backgroundColor: "#fff6ef",
    borderColor: "rgba(161, 61, 45, 0.28)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 68,
    paddingHorizontal: 10
  },
  recallButtonPressed: {
    backgroundColor: "#f8e5dc"
  },
  recallButtonText: {
    color: "#a13d2d",
    fontSize: 13,
    fontWeight: "700"
  },
  reminderInput: {
    backgroundColor: "#fdfcf5",
    borderColor: "rgba(38, 51, 46, 0.18)",
    borderRadius: 8,
    borderWidth: 1,
    color: "#25332e",
    flex: 1,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12
  },
  screen: {
    backgroundColor: "#f4f0e3",
    flex: 1
  },
  selectedSnailLabel: {
    color: "#6d5a46",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  selectedSnailRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  selectedSnailValue: {
    color: "#25332e",
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    minWidth: 0,
    textAlign: "right"
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#365c8d",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 72,
    paddingHorizontal: 14
  },
  sendButtonDisabled: {
    backgroundColor: "#7c8580"
  },
  sendButtonPressed: {
    backgroundColor: "#294870"
  },
  sendButtonText: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "700"
  },
  subtitle: {
    color: "#5c6861",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7
  },
  title: {
    color: "#25332e",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    marginTop: 3
  }
});

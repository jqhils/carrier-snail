import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FadeInView } from "../components/FadeInView";
import { SnailSprite } from "../components/SnailSprite";
import type { StableSnailListItem } from "../useCases/localCarrierState";
import type { ToDoListItem } from "../useCases/todoUseCases";

// Status accent + pill colors (ported from the #71 UI pass). Statuses without an
// entry fall back to the "open" green theme.
const STATUS_THEME: Record<
  string,
  { accent: string; pillBackground: string; pillText: string }
> = {
  arrived: { accent: "#c79233", pillBackground: "#f6ecd6", pillText: "#946612" },
  done: { accent: "#9aa49b", pillBackground: "#e8ece9", pillText: "#5f6e66" },
  "in-transit": {
    accent: "#365c8d",
    pillBackground: "#e2eaf4",
    pillText: "#2c4d77"
  },
  open: { accent: "#5f8a5e", pillBackground: "#e7efe0", pillText: "#3f6d5b" }
};

function statusThemeFor(status: string) {
  return STATUS_THEME[status] ?? STATUS_THEME.open;
}

type ToDosScreenProps = {
  canAssignSnail: boolean;
  editingText: string;
  editingTodoId?: string;
  formError: string;
  onAssignSnail: (todoId: string, snailId: string) => void;
  onCancelEdit: () => void;
  onChangeEditingText: (text: string) => void;
  onChangeToDoText: (text: string) => void;
  onCompleteToDo: (todoId: string) => void;
  onCreateToDo: () => void;
  onDeleteToDo: (todoId: string) => void;
  onRecallToDo: (todoId: string) => void;
  onSaveEdit: () => void;
  onStartEdit: (todo: ToDoListItem) => void;
  restingSnails: StableSnailListItem[];
  selectedStableSnail?: StableSnailListItem;
  toDoItems: ToDoListItem[];
  toDoText: string;
};

export function ToDosScreen({
  canAssignSnail,
  editingText,
  editingTodoId,
  formError,
  onAssignSnail,
  onCancelEdit,
  onChangeEditingText,
  onChangeToDoText,
  onCompleteToDo,
  onCreateToDo,
  onDeleteToDo,
  onRecallToDo,
  onSaveEdit,
  onStartEdit,
  restingSnails,
  selectedStableSnail,
  toDoItems,
  toDoText
}: ToDosScreenProps) {
  const [pickerTodo, setPickerTodo] = useState<ToDoListItem | null>(null);

  function closePicker() {
    setPickerTodo(null);
  }

  function chooseSnail(snailId: string) {
    if (!pickerTodo) {
      return;
    }

    onAssignSnail(pickerTodo.id, snailId);
    closePicker();
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <FadeInView>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Your list</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>To Dos</Text>
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>
                {toDoItems.filter((todo) => todo.status !== "done").length} active
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Limitless thoughts. Snails only leave when you send one.
          </Text>
        </View>

        <View style={styles.composerPanel}>
          <View style={styles.selectedSnailRow}>
            <Text style={styles.selectedSnailLabel}>Resting carrier</Text>
            <View style={styles.selectedSnailIdentity}>
              {selectedStableSnail ? (
                <SnailSprite
                  speciesId={selectedStableSnail.speciesId}
                  size={28}
                />
              ) : null}
              <Text numberOfLines={1} style={styles.selectedSnailValue}>
                {selectedStableSnail
                  ? selectedStableSnail.name
                  : "No resting snail"}
              </Text>
            </View>
          </View>
          <View style={styles.composerRow}>
            <TextInput
              accessibilityLabel="To-do text"
              onChangeText={onChangeToDoText}
              onSubmitEditing={onCreateToDo}
              placeholder="buy milk"
              placeholderTextColor="#7d7a70"
              returnKeyType="done"
              style={styles.reminderInput}
              value={toDoText}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add to-do"
              onPress={onCreateToDo}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.primaryButtonPressed : null
              ]}
            >
              <Text style={styles.primaryButtonText}>Add</Text>
            </Pressable>
          </View>
          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        </View>

        {toDoItems.length > 0 ? (
          <View style={styles.todoList}>
            {toDoItems.map((todo) => {
              const editing = editingTodoId === todo.id;
              const canSend =
                (todo.status === "open" || todo.status === "arrived") &&
                canAssignSnail;
              const showNoSnailPrompt =
                (todo.status === "open" || todo.status === "arrived") &&
                !canAssignSnail;
              const theme = statusThemeFor(todo.status);

              return (
                <View
                  key={todo.id}
                  style={[
                    styles.todoItem,
                    { borderLeftColor: theme.accent, borderLeftWidth: 4 }
                  ]}
                >
                  {editing ? (
                    <View style={styles.editBlock}>
                      <TextInput
                        accessibilityLabel={`Edit ${todo.text}`}
                        onChangeText={onChangeEditingText}
                        onSubmitEditing={onSaveEdit}
                        returnKeyType="done"
                        style={styles.editInput}
                        value={editingText}
                      />
                      <View style={styles.actionRow}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Save to-do"
                          onPress={onSaveEdit}
                          style={({ pressed }) => [
                            styles.smallButton,
                            pressed ? styles.smallButtonPressed : null
                          ]}
                        >
                          <Text style={styles.smallButtonText}>Save</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Cancel edit"
                          onPress={onCancelEdit}
                          style={({ pressed }) => [
                            styles.ghostButton,
                            pressed ? styles.ghostButtonPressed : null
                          ]}
                        >
                          <Text style={styles.ghostButtonText}>Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={styles.todoHeaderRow}>
                        <Text numberOfLines={2} style={styles.todoText}>
                          {todo.text}
                        </Text>
                        <Text
                          style={[
                            styles.statusPill,
                            {
                              backgroundColor: theme.pillBackground,
                              color: theme.pillText
                            }
                          ]}
                        >
                          {todo.statusLabel}
                        </Text>
                      </View>
                      {todo.snailName || todo.etaCopy ? (
                        <View style={styles.todoMetaRow}>
                          {todo.snailSpeciesId ? (
                            <SnailSprite
                              speciesId={todo.snailSpeciesId}
                              size={34}
                              walking={todo.status === "in-transit"}
                            />
                          ) : null}
                          <Text numberOfLines={2} style={styles.todoMeta}>
                            {todo.snailName ? todo.snailName : "No carrier"}
                            {todo.etaCopy ? `, ${todo.etaCopy}` : ""}
                          </Text>
                        </View>
                      ) : null}
                      {showNoSnailPrompt ? (
                        <Text style={styles.noSnailPrompt}>
                          No resting snail. Recall one, hatch one, or make room in
                          the stable.
                        </Text>
                      ) : null}
                      <View style={styles.actionRow}>
                        {todo.status === "in-transit" ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Recall ${todo.text}`}
                            onPress={() => onRecallToDo(todo.id)}
                            style={({ pressed }) => [
                              styles.recallButton,
                              pressed ? styles.recallButtonPressed : null
                            ]}
                          >
                            <Text style={styles.recallButtonText}>Recall</Text>
                          </Pressable>
                        ) : todo.status !== "done" ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Send a snail for ${todo.text}`}
                            disabled={!canSend}
                            onPress={() => setPickerTodo(todo)}
                            style={({ pressed }) => [
                              styles.smallButton,
                              !canSend ? styles.smallButtonDisabled : null,
                              pressed ? styles.smallButtonPressed : null
                            ]}
                          >
                            <Text style={styles.smallButtonText}>Send snail</Text>
                          </Pressable>
                        ) : null}
                        {todo.status !== "done" ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Complete ${todo.text}`}
                            onPress={() => onCompleteToDo(todo.id)}
                            style={({ pressed }) => [
                              styles.ghostButton,
                              pressed ? styles.ghostButtonPressed : null
                            ]}
                          >
                            <Text style={styles.ghostButtonText}>Done</Text>
                          </Pressable>
                        ) : null}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${todo.text}`}
                          onPress={() => onStartEdit(todo)}
                          style={({ pressed }) => [
                            styles.ghostButton,
                            pressed ? styles.ghostButtonPressed : null
                          ]}
                        >
                          <Text style={styles.ghostButtonText}>Edit</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${todo.text}`}
                          onPress={() => onDeleteToDo(todo.id)}
                          style={({ pressed }) => [
                            styles.deleteButton,
                            pressed ? styles.deleteButtonPressed : null
                          ]}
                        >
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyList}>
            <Text style={styles.emptyTitle}>Nothing on the leaf</Text>
            <Text style={styles.emptyBody}>
              Add as many thoughts as you need. The stable decides only what can
              travel.
            </Text>
          </View>
        )}
      </ScrollView>
      <Modal
        animationType="slide"
        onRequestClose={closePicker}
        transparent
        visible={pickerTodo !== null}
      >
        <View style={styles.pickerBackdrop}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <View style={styles.pickerTitleBlock}>
                <Text style={styles.pickerEyebrow}>Carrier</Text>
                <Text numberOfLines={1} style={styles.pickerTitle}>
                  Choose a snail
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Cancel snail selection"
                accessibilityRole="button"
                onPress={closePicker}
                style={({ pressed }) => [
                  styles.pickerCancelButton,
                  pressed ? styles.pickerCancelButtonPressed : null
                ]}
              >
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </Pressable>
            </View>
            <View style={styles.pickerList}>
              {restingSnails.map((snail) => (
                <Pressable
                  accessibilityLabel={`Send ${snail.name} for ${
                    pickerTodo?.text ?? "to-do"
                  }`}
                  accessibilityRole="button"
                  key={snail.id}
                  onPress={() => chooseSnail(snail.id)}
                  style={({ pressed }) => [
                    styles.pickerSnailRow,
                    selectedStableSnail?.id === snail.id
                      ? styles.pickerSnailRowSelected
                      : null,
                    pressed ? styles.pickerSnailRowPressed : null
                  ]}
                >
                  <SnailSprite speciesId={snail.speciesId} size={52} />
                  <View style={styles.pickerSnailCopy}>
                    <Text numberOfLines={1} style={styles.pickerSnailName}>
                      {snail.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.pickerSnailMeta}>
                      {snail.speciesName} · Lv {snail.level} ·{" "}
                      {Math.round(snail.baseSpeedMetersPerHour)} m/h
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      </FadeInView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
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
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#fff6ef",
    borderColor: "rgba(161, 61, 45, 0.28)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 10
  },
  deleteButtonPressed: {
    backgroundColor: "#f8e5dc"
  },
  deleteButtonText: {
    color: "#a13d2d",
    fontSize: 13,
    fontWeight: "700"
  },
  editBlock: {
    gap: 2
  },
  editInput: {
    backgroundColor: "#fdfcf5",
    borderColor: "rgba(38, 51, 46, 0.18)",
    borderRadius: 8,
    borderWidth: 1,
    color: "#25332e",
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12
  },
  emptyBody: {
    color: "#56645e",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
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
    fontSize: 18,
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
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  ghostButton: {
    alignItems: "center",
    backgroundColor: "#f4f0e3",
    borderColor: "rgba(37, 51, 46, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 10
  },
  ghostButtonPressed: {
    backgroundColor: "#e6e0d1"
  },
  ghostButtonText: {
    color: "#25332e",
    fontSize: 13,
    fontWeight: "700"
  },
  header: {
    maxWidth: 360
  },
  noSnailPrompt: {
    color: "#8a6f4f",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 7
  },
  pickerBackdrop: {
    backgroundColor: "rgba(20, 28, 24, 0.38)",
    flex: 1,
    justifyContent: "flex-end"
  },
  pickerCancelButton: {
    alignItems: "center",
    backgroundColor: "#f4f0e3",
    borderColor: "rgba(37, 51, 46, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 10
  },
  pickerCancelButtonPressed: {
    backgroundColor: "#e6e0d1"
  },
  pickerCancelText: {
    color: "#25332e",
    fontSize: 13,
    fontWeight: "800"
  },
  pickerEyebrow: {
    color: "#8a6f4f",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  pickerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  pickerList: {
    gap: 9,
    marginTop: 14
  },
  pickerSheet: {
    backgroundColor: "#f8f6ed",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 16
  },
  pickerSnailCopy: {
    flex: 1,
    minWidth: 0
  },
  pickerSnailMeta: {
    color: "#56645e",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3
  },
  pickerSnailName: {
    color: "#25332e",
    fontSize: 15,
    fontWeight: "900"
  },
  pickerSnailRow: {
    alignItems: "center",
    backgroundColor: "#fffdf6",
    borderColor: "rgba(63, 109, 91, 0.22)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 68,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  pickerSnailRowPressed: {
    backgroundColor: "#eef7f1"
  },
  pickerSnailRowSelected: {
    borderColor: "#3f6d5b",
    borderWidth: 2
  },
  pickerTitle: {
    color: "#25332e",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 24
  },
  pickerTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#365c8d",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 68,
    paddingHorizontal: 14
  },
  primaryButtonPressed: {
    backgroundColor: "#294870"
  },
  primaryButtonText: {
    color: "#f8fafc",
    fontSize: 15,
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
  selectedSnailIdentity: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "flex-end",
    minWidth: 0
  },
  selectedSnailValue: {
    color: "#25332e",
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "800",
    minWidth: 0,
    textAlign: "right"
  },
  smallButton: {
    alignItems: "center",
    backgroundColor: "#365c8d",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 10
  },
  smallButtonDisabled: {
    backgroundColor: "#7c8580"
  },
  smallButtonPressed: {
    backgroundColor: "#294870"
  },
  smallButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700"
  },
  statusPill: {
    backgroundColor: "#e8ede2",
    borderRadius: 8,
    color: "#3f6d5b",
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  subtitle: {
    color: "#5c6861",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7
  },
  countChip: {
    backgroundColor: "#e7efe0",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3
  },
  countChipText: {
    color: "#3f6d5b",
    fontSize: 12,
    fontWeight: "800"
  },
  title: {
    color: "#25332e",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 3
  },
  todoHeaderRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  todoItem: {
    backgroundColor: "#f8f6ed",
    borderColor: "rgba(43, 58, 52, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  todoList: {
    gap: 9,
    marginTop: 14
  },
  todoMeta: {
    color: "#5d6d77",
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    minWidth: 0
  },
  todoMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 5
  },
  todoText: {
    color: "#25332e",
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
    minWidth: 0
  }
});

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FadeInView } from "../components/FadeInView";
import type { StableSnailListItem } from "../useCases/localCarrierState";
import type { ToDoListItem } from "../useCases/todoUseCases";

type ToDosScreenProps = {
  canAssignSnail: boolean;
  editingText: string;
  editingTodoId?: string;
  formError: string;
  onAssignSnail: (todoId: string) => void;
  onCancelEdit: () => void;
  onChangeEditingText: (text: string) => void;
  onChangeToDoText: (text: string) => void;
  onCompleteToDo: (todoId: string) => void;
  onCreateToDo: () => void;
  onDeleteToDo: (todoId: string) => void;
  onRecallToDo: (todoId: string) => void;
  onSaveEdit: () => void;
  onStartEdit: (todo: ToDoListItem) => void;
  selectedStableSnail?: StableSnailListItem;
  toDoItems: ToDoListItem[];
  toDoText: string;
};

const STATUS_THEME: Record<
  ToDoListItem["status"],
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

function statusThemeFor(status: ToDoListItem["status"]) {
  return STATUS_THEME[status] ?? STATUS_THEME.open;
}

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
  selectedStableSnail,
  toDoItems,
  toDoText
}: ToDosScreenProps) {
  const openCount = toDoItems.filter((todo) => todo.status !== "done").length;

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
            {toDoItems.length > 0 ? (
              <View style={styles.countChip}>
                <Text style={styles.countChipText}>{openCount} active</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.subtitle}>
            Limitless thoughts. Snails only leave when you send one.
          </Text>
        </View>

        <View style={styles.composerPanel}>
          <View style={styles.selectedSnailRow}>
            <Text style={styles.selectedSnailLabel}>🐌 Resting carrier</Text>
            <Text numberOfLines={1} style={styles.selectedSnailValue}>
              {selectedStableSnail
                ? selectedStableSnail.name
                : "No resting snail"}
            </Text>
          </View>
          <View style={styles.composerRow}>
            <TextInput
              accessibilityLabel="To-do text"
              onChangeText={onChangeToDoText}
              onSubmitEditing={onCreateToDo}
              placeholder="buy milk"
              placeholderTextColor="#9a9588"
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
              const theme = statusThemeFor(todo.status);
              const canSend =
                (todo.status === "open" || todo.status === "arrived") &&
                canAssignSnail;
              const showNoSnailPrompt =
                (todo.status === "open" || todo.status === "arrived") &&
                !canAssignSnail;

              return (
                <View
                  key={todo.id}
                  style={[styles.todoItem, { borderLeftColor: theme.accent }]}
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
                        <Text numberOfLines={2} style={styles.todoMeta}>
                          {todo.snailName ? todo.snailName : "No carrier"}
                          {todo.etaCopy ? `, ${todo.etaCopy}` : ""}
                        </Text>
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
                            onPress={() => onAssignSnail(todo.id)}
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
            <Text style={styles.emptyGlyph}>🐌</Text>
            <Text style={styles.emptyTitle}>Nothing on the leaf</Text>
            <Text style={styles.emptyBody}>
              Add as many thoughts as you need. The stable decides only what can
              travel.
            </Text>
          </View>
        )}
      </ScrollView>
      </FadeInView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  composerPanel: {
    backgroundColor: "#fffdf6",
    borderColor: "rgba(138, 111, 79, 0.18)",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    marginTop: 20,
    padding: 16,
    shadowColor: "#3a3327",
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 14
  },
  composerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 12
  },
  content: {
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 20
  },
  countChip: {
    backgroundColor: "#e7efe0",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 4
  },
  countChipText: {
    color: "#3f6d5b",
    fontSize: 12,
    fontWeight: "800"
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#fff6ef",
    borderColor: "rgba(161, 61, 45, 0.28)",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 12
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
    borderRadius: 10,
    borderWidth: 1,
    color: "#25332e",
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: 14
  },
  emptyBody: {
    color: "#56645e",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center"
  },
  emptyGlyph: {
    fontSize: 34,
    marginBottom: 10
  },
  emptyList: {
    alignItems: "center",
    backgroundColor: "#fffdf6",
    borderColor: "rgba(43, 58, 52, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 30,
    shadowColor: "#3a3327",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 10
  },
  emptyTitle: {
    color: "#25332e",
    fontSize: 18,
    fontWeight: "800"
  },
  errorText: {
    color: "#a13d2d",
    fontSize: 13,
    marginTop: 10
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
    backgroundColor: "#f1ede0",
    borderColor: "rgba(37, 51, 46, 0.14)",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 12
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
    marginTop: 8
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#365c8d",
    borderRadius: 12,
    elevation: 2,
    justifyContent: "center",
    minHeight: 46,
    minWidth: 70,
    paddingHorizontal: 16,
    shadowColor: "#365c8d",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 8
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
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 12
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
    borderRadius: 10,
    borderWidth: 1,
    color: "#25332e",
    flex: 1,
    fontSize: 16,
    minHeight: 46,
    paddingHorizontal: 14
  },
  screen: {
    backgroundColor: "#f4f0e3",
    flex: 1
  },
  selectedSnailLabel: {
    color: "#6d5a46",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
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
  smallButton: {
    alignItems: "center",
    backgroundColor: "#365c8d",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 12
  },
  smallButtonDisabled: {
    backgroundColor: "#a7ada8"
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
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  subtitle: {
    color: "#5c6861",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  },
  title: {
    color: "#25332e",
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    marginTop: 4
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  todoHeaderRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  todoItem: {
    backgroundColor: "#fffdf6",
    borderColor: "rgba(43, 58, 52, 0.1)",
    borderLeftWidth: 4,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
    paddingHorizontal: 15,
    paddingVertical: 14,
    shadowColor: "#3a3327",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 10
  },
  todoList: {
    gap: 11,
    marginTop: 18
  },
  todoMeta: {
    color: "#5d6d77",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6
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

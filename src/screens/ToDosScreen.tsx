import { useState } from "react";
import {
  Keyboard,
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
import { PixelButton } from "../components/PixelButton";
import { SnailSprite } from "../components/SnailSprite";
import { colors, radii, space, text } from "../theme";
import type { StableSnailListItem } from "../useCases/localCarrierState";
import type { ToDoListItem } from "../useCases/todoUseCases";

// Status accent + pill colors, remapped onto the semantic design tokens.
// Statuses without an entry fall back to the "open" theme. `accent` drives the
// card's full border tint; pill background/text recolor the status label.
const STATUS_THEME: Record<
  string,
  { accent: string; pillBackground: string; pillText: string }
> = {
  arrived: {
    accent: colors.accentGold,
    pillBackground: colors.accentGoldSoft,
    pillText: colors.accentGoldBevel
  },
  done: {
    accent: colors.success,
    pillBackground: colors.accentLimeSoft,
    pillText: colors.success
  },
  "in-transit": {
    accent: colors.secondary,
    pillBackground: colors.secondarySoft,
    pillText: colors.secondaryPressed
  },
  open: {
    accent: colors.border,
    pillBackground: colors.surfaceAlt,
    pillText: colors.textMuted
  }
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
          <View style={styles.composerRow}>
            <TextInput
              accessibilityLabel="To-do text"
              onChangeText={onChangeToDoText}
              onSubmitEditing={() => {
                onCreateToDo();
                Keyboard.dismiss();
              }}
              placeholder="buy milk"
              placeholderTextColor={colors.textDisabled}
              returnKeyType="done"
              style={styles.reminderInput}
              value={toDoText}
            />
            <PixelButton
              accessibilityLabel="Add to-do"
              label="Add"
              onPress={() => {
                onCreateToDo();
                Keyboard.dismiss();
              }}
              variant="secondary"
            />
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
                  style={[styles.todoItem, { borderColor: theme.accent }]}
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
                        <PixelButton
                          accessibilityLabel="Save to-do"
                          label="Save"
                          onPress={onSaveEdit}
                          size="compact"
                          variant="primary"
                        />
                        <PixelButton
                          accessibilityLabel="Cancel edit"
                          label="Cancel"
                          onPress={onCancelEdit}
                          size="compact"
                          variant="neutral"
                        />
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
                          <PixelButton
                            accessibilityLabel={`Recall ${todo.text}`}
                            label="Recall"
                            onPress={() => onRecallToDo(todo.id)}
                            size="compact"
                            variant="danger"
                          />
                        ) : todo.status !== "done" ? (
                          <PixelButton
                            accessibilityLabel={`Send a snail for ${todo.text}`}
                            disabled={!canSend}
                            label="Send snail"
                            onPress={() => setPickerTodo(todo)}
                            size="compact"
                            variant="secondary"
                          />
                        ) : null}
                        {todo.status !== "done" ? (
                          <PixelButton
                            accessibilityLabel={`Complete ${todo.text}`}
                            label="Done"
                            onPress={() => onCompleteToDo(todo.id)}
                            size="compact"
                            variant="neutral"
                          />
                        ) : null}
                        <PixelButton
                          accessibilityLabel={`Edit ${todo.text}`}
                          label="Edit"
                          onPress={() => onStartEdit(todo)}
                          size="compact"
                          variant="neutral"
                        />
                        <PixelButton
                          accessibilityLabel={`Delete ${todo.text}`}
                          label="Delete"
                          onPress={() => onDeleteToDo(todo.id)}
                          size="compact"
                          variant="danger"
                        />
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
              <PixelButton
                accessibilityLabel="Cancel snail selection"
                label="Cancel"
                onPress={closePicker}
                size="compact"
                variant="neutral"
              />
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
    gap: space.sm,
    marginTop: 10
  },
  composerPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
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
  countChip: {
    backgroundColor: colors.accentLimeSoft,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 2,
    paddingHorizontal: 9,
    paddingVertical: 3
  },
  countChipText: {
    ...text.pixelMicro,
    color: colors.textPrimary
  },
  editBlock: {
    gap: 2
  },
  editInput: {
    ...text.body,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    color: colors.textPrimary,
    minHeight: 44,
    paddingHorizontal: 12
  },
  emptyBody: {
    ...text.body,
    color: colors.textMuted,
    marginTop: 6
  },
  emptyList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    marginTop: 14,
    padding: 14
  },
  emptyTitle: {
    ...text.pixelHeading,
    color: colors.textPrimary
  },
  errorText: {
    ...text.bodySm,
    color: colors.danger,
    marginTop: 8
  },
  eyebrow: {
    ...text.pixelLabel,
    color: colors.accentWarm,
    textTransform: "uppercase"
  },
  header: {
    maxWidth: 360
  },
  noSnailPrompt: {
    ...text.bodySm,
    color: colors.accentWarm,
    marginTop: 7
  },
  pickerBackdrop: {
    backgroundColor: colors.scrim,
    flex: 1,
    justifyContent: "flex-end"
  },
  pickerEyebrow: {
    ...text.pixelLabel,
    color: colors.accentWarm,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 2,
    paddingBottom: 28,
    paddingHorizontal: 18,
    paddingTop: 16
  },
  pickerSnailCopy: {
    flex: 1,
    minWidth: 0
  },
  pickerSnailMeta: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 3
  },
  pickerSnailName: {
    ...text.bodyStrong,
    color: colors.textPrimary
  },
  pickerSnailRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    flexDirection: "row",
    gap: 10,
    minHeight: 68,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  pickerSnailRowPressed: {
    backgroundColor: colors.surfaceAlt
  },
  pickerSnailRowSelected: {
    backgroundColor: colors.surfaceSelected,
    borderColor: colors.primary
  },
  pickerTitle: {
    ...text.pixelTitle,
    color: colors.textPrimary
  },
  pickerTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  reminderInput: {
    ...text.body,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    color: colors.textPrimary,
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  statusPill: {
    ...text.pixelMicro,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 4,
    textTransform: "uppercase"
  },
  subtitle: {
    ...text.body,
    color: colors.textMuted,
    marginTop: 7
  },
  title: {
    ...text.pixelTitle,
    color: colors.textPrimary
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  todoList: {
    gap: 9,
    marginTop: 14
  },
  todoMeta: {
    ...text.bodySm,
    color: colors.textMuted,
    flex: 1,
    minWidth: 0
  },
  todoMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 5
  },
  todoText: {
    ...text.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0
  }
});

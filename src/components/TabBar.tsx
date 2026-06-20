import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type BottomTabId = "snails" | "map" | "todos" | "notifications";

type TabIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type BottomTab = {
  icon: TabIconName;
  id: BottomTabId;
  label: string;
};

const TABS: BottomTab[] = [
  { icon: "snail", id: "snails", label: "My Snails" },
  { icon: "map-marker", id: "map", label: "Map" },
  { icon: "format-list-checks", id: "todos", label: "To Dos" },
  { icon: "bell", id: "notifications", label: "Notifications" }
];

type TabBarProps = {
  activeTab: BottomTabId;
  hasUnseenNotifications?: boolean;
  onChangeTab: (tab: BottomTabId) => void;
};

export function TabBar({
  activeTab,
  hasUnseenNotifications = false,
  onChangeTab
}: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.shell,
        { paddingBottom: Math.max(insets.bottom, 10) }
      ]}
    >
      <View style={styles.tabs}>
        {TABS.map((tab) => {
          const selected = tab.id === activeTab;
          const showDot = tab.id === "notifications" && hasUnseenNotifications;

          return (
            <Pressable
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={tab.id}
              onPress={() => onChangeTab(tab.id)}
              style={({ pressed }) => [
                styles.tab,
                selected ? styles.tabSelected : null,
                pressed ? styles.tabPressed : null
              ]}
            >
              <View style={styles.iconSlot}>
                <MaterialCommunityIcons
                  color={selected ? "#2f604e" : "#64736c"}
                  name={tab.icon}
                  size={23}
                />
                {showDot ? <View style={styles.notificationDot} /> : null}
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  selected ? styles.tabLabelSelected : null
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iconSlot: {
    alignItems: "center",
    height: 26,
    justifyContent: "center",
    width: 34
  },
  notificationDot: {
    backgroundColor: "#6d8c79",
    borderColor: "#f5f2e8",
    borderRadius: 5,
    borderWidth: 2,
    height: 10,
    position: "absolute",
    right: 1,
    top: 1,
    width: 10
  },
  shell: {
    backgroundColor: "#f5f2e8",
    borderTopColor: "rgba(42, 56, 50, 0.14)",
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingTop: 8
  },
  tab: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    gap: 2,
    justifyContent: "center",
    minHeight: 54,
    minWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 5
  },
  tabLabel: {
    color: "#64736c",
    fontSize: 11,
    fontWeight: "700"
  },
  tabLabelSelected: {
    color: "#2f604e",
    fontWeight: "800"
  },
  tabPressed: {
    backgroundColor: "#e8ede2"
  },
  tabSelected: {
    backgroundColor: "#dfeee4"
  },
  tabs: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  }
});

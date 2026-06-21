import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type ComponentProps, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radii, space, text } from "../theme";

export type BottomTabId =
  | "snails"
  | "map"
  | "todos"
  | "notifications"
  | "settings";

type TabIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type BottomTab = {
  icon: TabIconName;
  id: BottomTabId;
  label: string;
  short: string;
};

// `label` stays the full word (accessibility / screen readers); `short` is the
// punchy pixel-font display label, since Press Start 2P at tab size can't fit
// "Notifications".
const TABS: BottomTab[] = [
  { icon: "snail", id: "snails", label: "My Snails", short: "SNAILS" },
  { icon: "map-marker", id: "map", label: "Map", short: "MAP" },
  { icon: "format-list-checks", id: "todos", label: "To Dos", short: "TO DOS" },
  { icon: "bell", id: "notifications", label: "Notifications", short: "INBOX" },
  { icon: "cog", id: "settings", label: "Settings", short: "SETTINGS" }
];

type TabBarProps = {
  activeTab: BottomTabId;
  hasUnseenNotifications?: boolean;
  onChangeTab: (tab: BottomTabId) => void;
};

function TabBarItem({
  onPress,
  selected,
  showDot,
  tab
}: {
  onPress: () => void;
  selected: boolean;
  showDot: boolean;
  tab: BottomTab;
}) {
  const [scale] = useState(() => new Animated.Value(1));

  const pressTo = (toValue: number) => {
    Animated.timing(scale, {
      duration: 120,
      easing: Easing.out(Easing.quad),
      toValue,
      useNativeDriver: true
    }).start();
  };

  return (
    <Pressable
      accessibilityLabel={tab.label}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      onPressIn={() => pressTo(0.94)}
      onPressOut={() => pressTo(1)}
      style={[styles.tab, selected ? styles.tabSelected : null]}
    >
      <Animated.View
        style={[styles.tabContent, { transform: [{ scale }] }]}
      >
        <View style={styles.iconSlot}>
          <MaterialCommunityIcons
            color={selected ? colors.primary : colors.textMuted}
            name={tab.icon}
            size={23}
          />
          {showDot ? <View style={styles.notificationDot} /> : null}
        </View>
        <Text
          numberOfLines={1}
          style={[styles.tabLabel, selected ? styles.tabLabelSelected : null]}
        >
          {tab.short}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function TabBar({
  activeTab,
  hasUnseenNotifications = false,
  onChangeTab
}: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TabBarItem
            key={tab.id}
            onPress={() => onChangeTab(tab.id)}
            selected={tab.id === activeTab}
            showDot={tab.id === "notifications" && hasUnseenNotifications}
            tab={tab}
          />
        ))}
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
    backgroundColor: colors.accentPink,
    borderColor: colors.surface,
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    position: "absolute",
    right: 0,
    top: 0,
    width: 12
  },
  shell: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 3,
    paddingHorizontal: space.sm,
    paddingTop: space.sm
  },
  tab: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: radii.sm,
    borderWidth: 2,
    flex: 1,
    justifyContent: "center",
    minHeight: 54,
    minWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 5
  },
  tabContent: {
    alignItems: "center",
    gap: 3
  },
  tabLabel: {
    ...text.pixelTab,
    color: colors.textMuted
  },
  tabLabelSelected: {
    color: colors.primary
  },
  tabSelected: {
    backgroundColor: colors.surfaceSelected,
    borderColor: colors.primary
  },
  tabs: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  }
});

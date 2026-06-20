import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  TabBar,
  type BottomTabId
} from "./src/components/TabBar";
import { MapScreen } from "./src/screens/MapScreen";

const DEFAULT_TAB: BottomTabId = "map";

export default function App() {
  const [activeTab, setActiveTab] = useState<BottomTabId>(DEFAULT_TAB);
  const [hasUnseenNotifications, setHasUnseenNotifications] = useState(false);

  return (
    <SafeAreaProvider>
      <View style={styles.app}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          <MapScreen
            activeTab={activeTab}
            onUnseenNotificationsChange={setHasUnseenNotifications}
          />
        </View>
        <TabBar
          activeTab={activeTab}
          hasUnseenNotifications={hasUnseenNotifications}
          onChangeTab={setActiveTab}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: "#edf1e8",
    flex: 1
  },
  content: {
    flex: 1
  }
});

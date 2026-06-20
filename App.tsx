import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  TabBar,
  type BottomTabId
} from "./src/components/TabBar";
import { MapScreen } from "./src/screens/MapScreen";
import { MySnailsScreen } from "./src/screens/MySnailsScreen";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { ToDosScreen } from "./src/screens/ToDosScreen";

const DEFAULT_TAB: BottomTabId = "map";

export default function App() {
  const [activeTab, setActiveTab] = useState<BottomTabId>(DEFAULT_TAB);

  return (
    <SafeAreaProvider>
      <View style={styles.app}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          <View
            style={[
              styles.screenSlot,
              activeTab !== "map" ? styles.hiddenScreen : null
            ]}
          >
            <MapScreen />
          </View>
          {activeTab === "snails" ? <MySnailsScreen /> : null}
          {activeTab === "todos" ? <ToDosScreen /> : null}
          {activeTab === "notifications" ? <NotificationsScreen /> : null}
        </View>
        <TabBar activeTab={activeTab} onChangeTab={setActiveTab} />
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
  },
  hiddenScreen: {
    display: "none"
  },
  screenSlot: {
    flex: 1
  }
});

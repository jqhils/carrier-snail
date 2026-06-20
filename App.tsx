import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  TabBar,
  type BottomTabId
} from "./src/components/TabBar";
import { MapScreen } from "./src/screens/MapScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";

const DEFAULT_TAB: BottomTabId = "map";

export default function App() {
  const [activeTab, setActiveTab] = useState<BottomTabId>(DEFAULT_TAB);
  const [hasUnseenNotifications, setHasUnseenNotifications] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [completeOnboardingSignal, setCompleteOnboardingSignal] = useState(0);

  return (
    <SafeAreaProvider>
      <View style={styles.app}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          <MapScreen
            activeTab={activeTab}
            completeOnboardingSignal={completeOnboardingSignal}
            onOnboardingVisibleChange={setOnboardingVisible}
            onUnseenNotificationsChange={setHasUnseenNotifications}
          />
        </View>
        <TabBar
          activeTab={activeTab}
          hasUnseenNotifications={hasUnseenNotifications}
          onChangeTab={setActiveTab}
        />
        {onboardingVisible ? (
          <View style={styles.onboardingOverlay}>
            <OnboardingScreen
              onStart={() =>
                setCompleteOnboardingSignal((signal) => signal + 1)
              }
            />
          </View>
        ) : null}
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
  onboardingOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  }
});

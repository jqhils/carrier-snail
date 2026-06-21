import { Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import { PressStart2P_400Regular } from "@expo-google-fonts/press-start-2p";
import { useFonts } from "expo-font";
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
import { colors } from "./src/theme";

const DEFAULT_TAB: BottomTabId = "map";

export default function App() {
  const [fontsLoaded] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    PressStart2P_400Regular
  });
  const [activeTab, setActiveTab] = useState<BottomTabId>(DEFAULT_TAB);
  const [hasUnseenNotifications, setHasUnseenNotifications] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [completeOnboardingSignal, setCompleteOnboardingSignal] = useState(0);
  const [gameActive, setGameActive] = useState(false);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.app}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          <MapScreen
            activeTab={activeTab}
            completeOnboardingSignal={completeOnboardingSignal}
            onGameActiveChange={setGameActive}
            onOnboardingVisibleChange={setOnboardingVisible}
            onUnseenNotificationsChange={setHasUnseenNotifications}
          />
        </View>
        {gameActive ? null : (
          <TabBar
            activeTab={activeTab}
            hasUnseenNotifications={hasUnseenNotifications}
            onChangeTab={setActiveTab}
          />
        )}
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
    backgroundColor: colors.background,
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

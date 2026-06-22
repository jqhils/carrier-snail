import { Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import { PressStart2P_400Regular } from "@expo-google-fonts/press-start-2p";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  TabBar,
  type BottomTabId
} from "./src/components/TabBar";
import { MapScreen } from "./src/screens/MapScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import {
  parseReadmeScreenshotUrl,
  README_SCREENSHOT_DEFAULT_ID,
  README_SCREENSHOT_MODE,
  README_SCREENSHOT_SEQUENCE_IDS,
  README_SCREENSHOT_SEQUENCE_INTERVAL_MS,
  README_SCREENSHOT_SEQUENCE_MODE,
  ReadmeFlappyScreenshot,
  tabForReadmeScreenshot
} from "./src/readmeScreenshots";
import { colors } from "./src/theme";

const DEFAULT_TAB: BottomTabId = "map";
const INITIAL_README_SCREENSHOT_ID =
  README_SCREENSHOT_MODE && README_SCREENSHOT_SEQUENCE_MODE
    ? README_SCREENSHOT_SEQUENCE_IDS[0]
    : README_SCREENSHOT_DEFAULT_ID;

export default function App() {
  const [fontsLoaded] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    PressStart2P_400Regular
  });
  const [readmeScreenshotId, setReadmeScreenshotId] = useState(
    INITIAL_README_SCREENSHOT_ID
  );
  const [activeTab, setActiveTab] = useState<BottomTabId>(DEFAULT_TAB);
  const [hasUnseenNotifications, setHasUnseenNotifications] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [completeOnboardingSignal, setCompleteOnboardingSignal] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const flappyScreenshotVisible =
    README_SCREENSHOT_MODE && readmeScreenshotId === "flappy";
  const displayedActiveTab = README_SCREENSHOT_MODE
    ? tabForReadmeScreenshot(readmeScreenshotId)
    : activeTab;

  useEffect(() => {
    if (!README_SCREENSHOT_MODE) {
      return undefined;
    }

    function applyUrl(url: string | null) {
      if (!url) {
        return;
      }

      const screenshotId = parseReadmeScreenshotUrl(url);
      if (screenshotId) {
        setReadmeScreenshotId(screenshotId);
      }
    }

    Linking.getInitialURL().then(applyUrl).catch(() => undefined);
    const subscription = Linking.addEventListener("url", ({ url }) =>
      applyUrl(url)
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!README_SCREENSHOT_MODE || !README_SCREENSHOT_SEQUENCE_MODE) {
      return undefined;
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex =
        (currentIndex + 1) % README_SCREENSHOT_SEQUENCE_IDS.length;
      setReadmeScreenshotId(README_SCREENSHOT_SEQUENCE_IDS[currentIndex]);
    }, README_SCREENSHOT_SEQUENCE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.app}>
        <StatusBar style="dark" />
        <View style={styles.content}>
          {flappyScreenshotVisible ? (
            <ReadmeFlappyScreenshot />
          ) : (
            <MapScreen
              activeTab={displayedActiveTab}
              completeOnboardingSignal={completeOnboardingSignal}
              key={README_SCREENSHOT_MODE ? readmeScreenshotId : "default"}
              onGameActiveChange={setGameActive}
              onOnboardingVisibleChange={setOnboardingVisible}
              onUnseenNotificationsChange={setHasUnseenNotifications}
              readmeScreenshotId={
                README_SCREENSHOT_MODE ? readmeScreenshotId : undefined
              }
            />
          )}
        </View>
        {gameActive || flappyScreenshotVisible ? null : (
          <TabBar
            activeTab={displayedActiveTab}
            hasUnseenNotifications={hasUnseenNotifications}
            onChangeTab={setActiveTab}
          />
        )}
        {!flappyScreenshotVisible && onboardingVisible ? (
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

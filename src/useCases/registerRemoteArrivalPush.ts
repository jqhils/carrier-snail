import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Registers this device for server-sent arrival pushes and returns its Expo push
 * token, or null if remote push isn't available yet. Degrades gracefully: with no
 * EAS projectId (run `eas init`), no FCM credentials, denied permission, or while
 * offline, it returns null and the app stays on on-device local notifications.
 *
 * The token is what `runScheduledArrivalWorker` needs to deliver an arrival push
 * when the app is fully closed; the caller persists it via `savePushToken`.
 */
export async function registerRemoteArrivalPushToken(): Promise<string | null> {
  // Android only displays pushes through a channel; create it before requesting.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("arrivals", {
      importance: Notifications.AndroidImportance.DEFAULT,
      name: "Snail arrivals"
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const granted =
    existing.granted ||
    (await Notifications.requestPermissionsAsync()).granted;

  if (!granted) {
    return null;
  }

  try {
    // No explicit projectId: expo-notifications resolves it from the EAS config
    // in app.json (written by `eas init`). Throws if it can't, hence the catch.
    const token = await Notifications.getExpoPushTokenAsync();

    return token.data;
  } catch {
    return null;
  }
}

import * as Notifications from "expo-notifications";

import type { ArrivalPush, PushSender } from "./pushSender";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function requestArrivalNotificationPermission(): Promise<void> {
  await Notifications.requestPermissionsAsync();
}

export class ExpoLocalPushSender implements PushSender {
  cancelArrival(): void {
    // Local arrivals are immediate notifications today; scheduled backend pushes
    // are cancelled by the backend adapter that implements this port.
  }

  sendArrival(push: ArrivalPush): void {
    void Notifications.scheduleNotificationAsync({
      content: {
        body: push.text,
        data: { reminderId: push.reminderId },
        title: push.title
      },
      trigger: null
    }).catch(() => undefined);
  }
}

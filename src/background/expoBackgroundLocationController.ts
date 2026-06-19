import * as Location from "expo-location";

import {
  BACKGROUND_LOCATION_TASK_NAME,
  defineCarrierSnailBackgroundLocationTask
} from "./backgroundLocationTask";
import type {
  BackgroundLocationController,
  LowPowerBackgroundLocationPolicy,
  PermissionDecision
} from "../useCases/configureOptionalBackgroundLocation";

defineCarrierSnailBackgroundLocationTask();

export class ExpoBackgroundLocationController
  implements BackgroundLocationController
{
  async requestForegroundPermission(): Promise<PermissionDecision> {
    const permission = await Location.requestForegroundPermissionsAsync();

    return { granted: permission.granted };
  }

  async requestBackgroundPermission(): Promise<PermissionDecision> {
    const permission = await Location.requestBackgroundPermissionsAsync();

    return { granted: permission.granted };
  }

  async startLowPowerUpdates(
    policy: LowPowerBackgroundLocationPolicy
  ): Promise<void> {
    defineCarrierSnailBackgroundLocationTask();

    if (
      await Location.hasStartedLocationUpdatesAsync(
        BACKGROUND_LOCATION_TASK_NAME
      )
    ) {
      return;
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      activityType: Location.ActivityType.Other,
      deferredUpdatesDistance: policy.deferredUpdatesDistanceMeters,
      deferredUpdatesInterval: policy.deferredUpdatesIntervalMs,
      distanceInterval: policy.distanceIntervalMeters,
      foregroundService: {
        killServiceOnDestroy: false,
        notificationBody:
          "Carrier Snail is using optional coarse background location.",
        notificationTitle: "Carrier Snail background re-aiming"
      },
      pausesUpdatesAutomatically: policy.pausesUpdatesAutomatically,
      showsBackgroundLocationIndicator: false,
      timeInterval: policy.minimumIntervalMs
    });
  }
}

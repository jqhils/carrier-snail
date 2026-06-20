import { LOCATION_PRIVACY_PLAIN_LANGUAGE } from "./onboarding";

export const BACKGROUND_LOCATION_PERMISSION_COPY =
  LOCATION_PRIVACY_PLAIN_LANGUAGE;

export const LOW_POWER_BACKGROUND_LOCATION_POLICY = {
  accuracy: "balanced",
  deferredUpdatesDistanceMeters: 500,
  deferredUpdatesIntervalMs: 30 * 60 * 1000,
  distanceIntervalMeters: 500,
  minimumIntervalMs: 30 * 60 * 1000,
  pausesUpdatesAutomatically: true
} as const;

export type LowPowerBackgroundLocationPolicy =
  typeof LOW_POWER_BACKGROUND_LOCATION_POLICY;

export type BackgroundLocationMode =
  | "background-enabled"
  | "foreground-only"
  | "location-denied";

export type PermissionDecision = {
  granted: boolean;
};

export interface BackgroundLocationController {
  requestBackgroundPermission(): Promise<PermissionDecision>;
  requestForegroundPermission(): Promise<PermissionDecision>;
  startLowPowerUpdates(
    policy: LowPowerBackgroundLocationPolicy
  ): Promise<void>;
  stopLowPowerUpdates(): Promise<void>;
}

export type ConfigureOptionalBackgroundLocationResult = {
  foregroundAvailable: boolean;
  mode: BackgroundLocationMode;
};

export async function configureOptionalBackgroundLocation({
  controller
}: {
  controller: BackgroundLocationController;
}): Promise<ConfigureOptionalBackgroundLocationResult> {
  const foreground = await controller.requestForegroundPermission();

  if (!foreground.granted) {
    return {
      foregroundAvailable: false,
      mode: "location-denied"
    };
  }

  const background = await controller.requestBackgroundPermission();

  if (!background.granted) {
    return {
      foregroundAvailable: true,
      mode: "foreground-only"
    };
  }

  await controller.startLowPowerUpdates(LOW_POWER_BACKGROUND_LOCATION_POLICY);

  return {
    foregroundAvailable: true,
    mode: "background-enabled"
  };
}

export async function disableOptionalBackgroundLocation({
  controller
}: {
  controller: BackgroundLocationController;
}): Promise<ConfigureOptionalBackgroundLocationResult> {
  await controller.stopLowPowerUpdates();

  return {
    foregroundAvailable: true,
    mode: "foreground-only"
  };
}

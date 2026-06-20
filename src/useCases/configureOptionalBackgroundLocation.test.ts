import {
  BACKGROUND_LOCATION_PERMISSION_COPY,
  type BackgroundLocationController,
  configureOptionalBackgroundLocation,
  disableOptionalBackgroundLocation,
  LOW_POWER_BACKGROUND_LOCATION_POLICY
} from "./configureOptionalBackgroundLocation";

class FakeBackgroundLocationController implements BackgroundLocationController {
  readonly startedPolicies: typeof LOW_POWER_BACKGROUND_LOCATION_POLICY[] = [];

  constructor(
    private readonly foregroundGranted: boolean,
    private readonly backgroundGranted: boolean
  ) {}

  async requestForegroundPermission(): Promise<{ granted: boolean }> {
    return { granted: this.foregroundGranted };
  }

  async requestBackgroundPermission(): Promise<{ granted: boolean }> {
    return { granted: this.backgroundGranted };
  }

  async startLowPowerUpdates(
    policy: typeof LOW_POWER_BACKGROUND_LOCATION_POLICY
  ): Promise<void> {
    this.startedPolicies.push(policy);
  }

  stopCallCount = 0;

  async stopLowPowerUpdates(): Promise<void> {
    this.stopCallCount += 1;
  }
}

describe("configureOptionalBackgroundLocation", () => {
  it("starts low-power background updates when permission is granted", async () => {
    const controller = new FakeBackgroundLocationController(true, true);

    const result = await configureOptionalBackgroundLocation({ controller });

    expect(result.mode).toBe("background-enabled");
    expect(controller.startedPolicies).toEqual([
      LOW_POWER_BACKGROUND_LOCATION_POLICY
    ]);
    expect(LOW_POWER_BACKGROUND_LOCATION_POLICY.accuracy).toBe("balanced");
    expect(LOW_POWER_BACKGROUND_LOCATION_POLICY.distanceIntervalMeters).toBeGreaterThanOrEqual(
      500
    );
    expect(
      LOW_POWER_BACKGROUND_LOCATION_POLICY.deferredUpdatesDistanceMeters
    ).toBeGreaterThanOrEqual(500);
    expect(LOW_POWER_BACKGROUND_LOCATION_POLICY.minimumIntervalMs).toBeGreaterThanOrEqual(
      15 * 60 * 1000
    );
    expect(BACKGROUND_LOCATION_PERMISSION_COPY.toLowerCase()).toContain(
      "optional"
    );
    expect(BACKGROUND_LOCATION_PERMISSION_COPY.toLowerCase()).toContain(
      "coarse"
    );
  });

  it("keeps foreground-only mode when background permission is denied", async () => {
    const controller = new FakeBackgroundLocationController(true, false);

    const result = await configureOptionalBackgroundLocation({ controller });

    expect(result.mode).toBe("foreground-only");
    expect(result.foregroundAvailable).toBe(true);
    expect(controller.startedPolicies).toEqual([]);
  });

  it("stops background updates and returns to foreground-only when disabled", async () => {
    const controller = new FakeBackgroundLocationController(true, true);

    const result = await disableOptionalBackgroundLocation({ controller });

    expect(result.mode).toBe("foreground-only");
    expect(controller.stopCallCount).toBe(1);
  });
});

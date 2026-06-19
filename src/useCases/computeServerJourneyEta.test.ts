import {
  createPhaseZeroJourney,
  destinationCoordinate
} from "../journey/snailCrawl";
import {
  DELIVERY_FLOOR_MINIMUM_MS,
  HONEST_DISTANCE_FLOOR_RATIO,
  type DeliverySpeedModifiers
} from "../journey/deliveryFloor";
import {
  computeServerJourneyEta,
  type ComputeServerJourneyEtaInput
} from "./computeServerJourneyEta";

const target = {
  latitude: -33.8688,
  longitude: 151.2093
};

describe("computeServerJourneyEta", () => {
  it("uses server Clock time and ignores client clock input", () => {
    const journey = {
      ...createPhaseZeroJourney({ createdAtMs: 1000, target }),
      id: "journey-1",
      reminderId: "reminder-1",
      snailId: "snail-1",
      status: "in-flight" as const
    };
    const serverNowMs = 60 * 60 * 1000;

    const earlyClient = computeServerJourneyEta({
      clientNowMs: 999999999999,
      clock: { now: () => serverNowMs },
      journey,
      speedModifiers: { levelMultiplier: 1000 }
    });
    const lateClient = computeServerJourneyEta({
      clientNowMs: -999999999999,
      clock: { now: () => serverNowMs },
      journey,
      speedModifiers: { levelMultiplier: 1000 }
    });

    expect(earlyClient).toEqual(lateClient);
    expect(earlyClient.serverNowMs).toBe(serverNowMs);
    expect(earlyClient.remainingMs).toBe(
      earlyClient.earliestArrivalAtMs - serverNowMs
    );
  });

  it("ignores a malicious time-warp field on server ETA input", () => {
    const journey = {
      ...createPhaseZeroJourney({ createdAtMs: 0, target }),
      id: "journey-1",
      reminderId: "reminder-1",
      snailId: "snail-1",
      status: "in-flight" as const
    };
    const input: ComputeServerJourneyEtaInput = {
      clock: { now: () => 0 },
      journey,
      speedModifiers: { spendMultiplier: 1000 }
    };

    const normal = computeServerJourneyEta(input);
    const withWarp = computeServerJourneyEta({
      ...input,
      timeWarpFactor: 100000
    } as unknown as ComputeServerJourneyEtaInput);

    expect(withWarp).toEqual(normal);
  });

  it("keeps paid, rarity, level, and mythic speed modifiers above the Floor", () => {
    const createdAtMs = 123456;
    const distancesMeters = [1, 100, 8000, 50000, 250000];
    const baseSpeedsMetersPerHour = [48, 78, 120, 240];
    const modifierSets: DeliverySpeedModifiers[] = [
      { spendMultiplier: 100 },
      { levelMultiplier: 10 },
      { rarityMultiplier: 12 },
      { levelMultiplier: 20, rarityMultiplier: 12, spendMultiplier: 1000 }
    ];

    for (const distanceMeters of distancesMeters) {
      const distantTarget = destinationCoordinate({
        bearingDegrees: 38,
        distanceMeters,
        from: target
      });

      for (const baseSpeedMetersPerHour of baseSpeedsMetersPerHour) {
        for (const speedModifiers of modifierSets) {
          const journey = {
            ...createPhaseZeroJourney({
              createdAtMs,
              speedMetersPerHour: baseSpeedMetersPerHour,
              target: distantTarget
            }),
            id: "journey-guardrail",
            reminderId: "reminder-guardrail",
            snailId: "snail-guardrail",
            status: "in-flight" as const
          };
          const eta = computeServerJourneyEta({
            clock: { now: () => createdAtMs },
            journey,
            speedModifiers
          });
          const durationMs = eta.earliestArrivalAtMs - createdAtMs;
          const honestFloorMs =
            eta.honestDistanceTimeMs * HONEST_DISTANCE_FLOOR_RATIO;

          expect(durationMs).toBeGreaterThanOrEqual(DELIVERY_FLOOR_MINIMUM_MS);
          expect(durationMs).toBeGreaterThanOrEqual(Math.floor(honestFloorMs));
        }
      }
    }
  });
});

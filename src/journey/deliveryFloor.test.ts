import { destinationCoordinate } from "./snailCrawl";
import {
  calculateClampedArrivalAtMs,
  calculateDeliveryFloorDurationMs,
  DELIVERY_FLOOR_MINIMUM_MS,
  HONEST_DISTANCE_FLOOR_RATIO,
  type DeliverySpeedModifiers
} from "./deliveryFloor";

const HOUR_MS = 60 * 60 * 1000;
const origin = {
  latitude: 41.8781,
  longitude: -87.6298
};

describe("delivery floor", () => {
  it("clamps a fast computed arrival to the larger Floor duration", () => {
    const target = destinationCoordinate({
      bearingDegrees: 90,
      distanceMeters: 8000,
      from: origin
    });
    const floorDurationMs = calculateDeliveryFloorDurationMs({
      baseSpeedMetersPerHour: 48,
      start: origin,
      target
    });

    const etaAtMs = calculateClampedArrivalAtMs({
      baseSpeedMetersPerHour: 48,
      createdAtMs: 0,
      speedModifiers: {
        levelMultiplier: 100,
        rarityMultiplier: 100,
        spendMultiplier: 100
      },
      start: origin,
      target
    });

    expect(floorDurationMs).toBeGreaterThan(DELIVERY_FLOOR_MINIMUM_MS);
    expect(etaAtMs).toBeCloseTo(floorDurationMs, 0);
  });

  it("never computes an arrival before 24h or 40% of honest distance-time", () => {
    const distancesMeters = [1, 10, 100, 1000, 8000, 50000, 250000];
    const baseSpeedsMetersPerHour = [1, 12, 48, 96, 240];
    const modifiers: DeliverySpeedModifiers[] = [
      {},
      { rarityMultiplier: 2 },
      { levelMultiplier: 5 },
      { spendMultiplier: 20 },
      { levelMultiplier: 8, rarityMultiplier: 6, spendMultiplier: 100 }
    ];
    const createdAtMs = 987654321;

    for (const distanceMeters of distancesMeters) {
      const target = destinationCoordinate({
        bearingDegrees: 17,
        distanceMeters,
        from: origin
      });

      for (const baseSpeedMetersPerHour of baseSpeedsMetersPerHour) {
        for (const speedModifiers of modifiers) {
          const etaAtMs = calculateClampedArrivalAtMs({
            baseSpeedMetersPerHour,
            createdAtMs,
            speedModifiers,
            start: origin,
            target
          });
          const honestDistanceTimeMs =
            (distanceMeters / baseSpeedMetersPerHour) * HOUR_MS;
          const honestFloorMs =
            honestDistanceTimeMs * HONEST_DISTANCE_FLOOR_RATIO;

          expect(etaAtMs - createdAtMs).toBeGreaterThanOrEqual(
            DELIVERY_FLOOR_MINIMUM_MS
          );
          expect(etaAtMs - createdAtMs).toBeGreaterThanOrEqual(
            Math.floor(honestFloorMs)
          );
        }
      }
    }
  });

  it("keeps mythic speed bands and rarity multipliers above the Floor", () => {
    const target = destinationCoordinate({
      bearingDegrees: 90,
      distanceMeters: 8000,
      from: origin
    });
    const createdAtMs = 123456;
    const etaAtMs = calculateClampedArrivalAtMs({
      baseSpeedMetersPerHour: 120,
      createdAtMs,
      speedModifiers: {
        levelMultiplier: 10,
        rarityMultiplier: 12,
        spendMultiplier: 50
      },
      start: origin,
      target
    });
    const floorDurationMs = calculateDeliveryFloorDurationMs({
      baseSpeedMetersPerHour: 120,
      start: origin,
      target
    });

    expect(etaAtMs - createdAtMs).toBeGreaterThanOrEqual(floorDurationMs);
    expect(etaAtMs - createdAtMs).toBeGreaterThanOrEqual(
      DELIVERY_FLOOR_MINIMUM_MS
    );
  });
});

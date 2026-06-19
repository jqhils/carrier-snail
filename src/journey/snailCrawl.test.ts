import {
  BASE_SNAIL_SPEED_METERS_PER_HOUR,
  createPhaseZeroJourney,
  distanceMeters,
  getAllowedTimeWarpFactors,
  getCrawlFrame,
  PHASE_ZERO_SPAWN_DISTANCE_METERS
} from "./snailCrawl";

const target = {
  latitude: -33.8688,
  longitude: 151.2093
};

describe("phase zero snail crawl", () => {
  it("spawns the demo snail about 8 km from the target", () => {
    const journey = createPhaseZeroJourney({
      target,
      createdAtMs: 0
    });

    expect(distanceMeters(journey.start, journey.target)).toBeGreaterThan(
      PHASE_ZERO_SPAWN_DISTANCE_METERS - 25
    );
    expect(distanceMeters(journey.start, journey.target)).toBeLessThan(
      PHASE_ZERO_SPAWN_DISTANCE_METERS + 25
    );
  });

  it("moves the snail at base speed along the hardcoded geodesic", () => {
    const journey = createPhaseZeroJourney({
      target,
      createdAtMs: 0
    });

    const afterOneHour = getCrawlFrame({
      journey,
      nowMs: 60 * 60 * 1000,
      timeWarpFactor: 1
    });

    expect(afterOneHour.travelledMeters).toBeCloseTo(
      BASE_SNAIL_SPEED_METERS_PER_HOUR,
      3
    );
    expect(distanceMeters(journey.start, afterOneHour.coordinate)).toBeCloseTo(
      BASE_SNAIL_SPEED_METERS_PER_HOUR,
      0
    );
    expect(afterOneHour.progress).toBeGreaterThan(0);
    expect(afterOneHour.progress).toBeLessThan(0.01);
    expect(afterOneHour.arrived).toBe(false);
  });

  it("keeps demo time-warp unavailable in production", () => {
    expect(getAllowedTimeWarpFactors("production")).toEqual([1]);
    expect(getAllowedTimeWarpFactors("development")).toEqual([
      1, 1000, 100000
    ]);
  });
});

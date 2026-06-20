import { buildJourneyPolyline } from "./journeyPolyline";
import { distanceMeters, type Coordinate } from "./snailCrawl";

const start: Coordinate = { latitude: 37.79, longitude: -122.41 };
const target: Coordinate = { latitude: 37.76, longitude: -122.45 };

describe("buildJourneyPolyline", () => {
  it("places the snail at the start with no traveled trail at progress 0", () => {
    const result = buildJourneyPolyline({ progress: 0, start, target });

    expect(distanceMeters(result.snail, start)).toBeLessThan(1);
    expect(result.traveled).toHaveLength(0);
    expect(result.remaining).not.toBeNull();
    expect(result.remaining?.[1]).toEqual(target);
  });

  it("places the snail at the target and clears the remaining path at progress 1", () => {
    const result = buildJourneyPolyline({
      progress: 1,
      segmentCount: 10,
      start,
      target
    });

    expect(distanceMeters(result.snail, target)).toBeLessThan(1);
    expect(result.remaining).toBeNull();
    expect(result.traveled).toHaveLength(10);
    expect(distanceMeters(result.traveled[9].to, target)).toBeLessThan(1);
  });

  it("keeps the snail on the geodesic, halfway by distance at progress 0.5", () => {
    const result = buildJourneyPolyline({ progress: 0.5, start, target });
    const total = distanceMeters(start, target);
    const viaSnail =
      distanceMeters(start, result.snail) +
      distanceMeters(result.snail, target);

    expect(Math.abs(viaSnail - total)).toBeLessThan(1);
    expect(Math.abs(distanceMeters(start, result.snail) - total / 2)).toBeLessThan(1);
  });

  it("builds a contiguous trail that fades from oldest to newest", () => {
    const result = buildJourneyPolyline({
      progress: 0.8,
      segmentCount: 6,
      start,
      target
    });

    for (let index = 0; index < result.traveled.length - 1; index += 1) {
      expect(result.traveled[index].to).toEqual(result.traveled[index + 1].from);
      expect(result.traveled[index].opacity).toBeLessThan(
        result.traveled[index + 1].opacity
      );
    }

    const newest = result.traveled[result.traveled.length - 1];
    expect(distanceMeters(newest.to, result.snail)).toBeLessThan(1);
  });

  it("collapses to the start when start equals target", () => {
    const result = buildJourneyPolyline({
      progress: 0.5,
      start,
      target: start
    });

    expect(result.snail).toEqual(start);
    expect(result.traveled).toHaveLength(0);
    expect(result.remaining).toBeNull();
  });
});

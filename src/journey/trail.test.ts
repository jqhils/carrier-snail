import { buildFadingTrailSegments } from "./trail";

describe("buildFadingTrailSegments", () => {
  it("creates fading segments only behind the snail", () => {
    const segments = buildFadingTrailSegments({
      progress: 0.75,
      segmentCount: 4
    });

    expect(segments).toHaveLength(4);
    expect(segments[0].fromProgress).toBeGreaterThanOrEqual(0);
    expect(segments[3].toProgress).toBeLessThanOrEqual(0.75);
    expect(segments[0].opacity).toBeLessThan(segments[3].opacity);
  });

  it("returns no trail before the snail has moved", () => {
    expect(
      buildFadingTrailSegments({ progress: 0, segmentCount: 4 })
    ).toEqual([]);
  });
});

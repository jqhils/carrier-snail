import {
  destinationCoordinate,
  distanceMeters,
  initialBearingDegrees,
  type Coordinate
} from "./snailCrawl";

/**
 * A single drawable segment of the snail's traveled slime trail, in real
 * geographic coordinates. `opacity` fades older segments (near the start)
 * fainter than newer ones (near the snail).
 */
export type GeoTrailSegment = {
  from: Coordinate;
  opacity: number;
  to: Coordinate;
};

export type JourneyPolyline = {
  /** Geodesic midpoint of start↔target, for framing the map camera. */
  midpoint: Coordinate;
  /** Snail→target, or null once arrived. */
  remaining: [Coordinate, Coordinate] | null;
  /** The snail's current position along the geodesic. */
  snail: Coordinate;
  /** Start→snail, split into fading segments for the slime trail. */
  traveled: GeoTrailSegment[];
};

const MIN_TRAIL_OPACITY = 0.12;
const TRAIL_OPACITY_GAIN = 0.58;
const DEFAULT_SEGMENT_COUNT = 14;

/**
 * Projects a journey into real-world geometry the map can render directly:
 * the snail's coordinate, a fading traveled trail, and the remaining path —
 * all on the same geodesic the journey engine uses. Pure; no map dependency.
 */
export function buildJourneyPolyline({
  progress,
  segmentCount = DEFAULT_SEGMENT_COUNT,
  start,
  target
}: {
  progress: number;
  segmentCount?: number;
  start: Coordinate;
  target: Coordinate;
}): JourneyPolyline {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const totalDistanceMeters = distanceMeters(start, target);

  if (totalDistanceMeters === 0) {
    return { midpoint: start, remaining: null, snail: start, traveled: [] };
  }

  const bearingDegrees = initialBearingDegrees(start, target);
  const travelledMeters = totalDistanceMeters * clampedProgress;
  const pointAt = (meters: number): Coordinate =>
    destinationCoordinate({
      bearingDegrees,
      distanceMeters: meters,
      from: start
    });
  const snail = pointAt(travelledMeters);

  const effectiveSegments = Math.max(0, Math.floor(segmentCount));
  const traveled: GeoTrailSegment[] = [];
  if (effectiveSegments > 0 && travelledMeters > 0) {
    for (let index = 0; index < effectiveSegments; index += 1) {
      const ageRatio = (index + 1) / effectiveSegments;
      traveled.push({
        from: pointAt((travelledMeters * index) / effectiveSegments),
        opacity: MIN_TRAIL_OPACITY + ageRatio * TRAIL_OPACITY_GAIN,
        to: pointAt((travelledMeters * (index + 1)) / effectiveSegments)
      });
    }
  }

  return {
    midpoint: pointAt(totalDistanceMeters / 2),
    remaining: clampedProgress >= 1 ? null : [snail, target],
    snail,
    traveled
  };
}

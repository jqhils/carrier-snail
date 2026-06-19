export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type RuntimeMode = "development" | "production" | "test";

export type PhaseZeroJourney = {
  createdAtMs: number;
  start: Coordinate;
  target: Coordinate;
  speedMetersPerHour: number;
};

export type CrawlFrame = {
  arrived: boolean;
  coordinate: Coordinate;
  progress: number;
  remainingMeters: number;
  travelledMeters: number;
};

export const BASE_SNAIL_SPEED_METERS_PER_HOUR = 48;
export const PHASE_ZERO_SPAWN_DISTANCE_METERS = 8000;
export const PHASE_ZERO_SPAWN_BEARING_DEGREES = 235;

const EARTH_RADIUS_METERS = 6371008.8;
const DEBUG_TIME_WARP_FACTORS = [1, 1000, 100000] as const;

export function getAllowedTimeWarpFactors(mode: RuntimeMode): number[] {
  if (mode === "production") {
    return [1];
  }

  return [...DEBUG_TIME_WARP_FACTORS];
}

export function coerceTimeWarpFactor(
  requestedFactor: number,
  mode: RuntimeMode
): number {
  const allowedFactors = getAllowedTimeWarpFactors(mode);

  if (allowedFactors.includes(requestedFactor)) {
    return requestedFactor;
  }

  return 1;
}

export function createPhaseZeroJourney({
  createdAtMs,
  target
}: {
  createdAtMs: number;
  target: Coordinate;
}): PhaseZeroJourney {
  const start = destinationCoordinate({
    from: target,
    bearingDegrees: PHASE_ZERO_SPAWN_BEARING_DEGREES,
    distanceMeters: PHASE_ZERO_SPAWN_DISTANCE_METERS
  });

  return {
    createdAtMs,
    start,
    target,
    speedMetersPerHour: BASE_SNAIL_SPEED_METERS_PER_HOUR
  };
}

export function getCrawlFrame({
  journey,
  nowMs,
  timeWarpFactor
}: {
  journey: PhaseZeroJourney;
  nowMs: number;
  timeWarpFactor: number;
}): CrawlFrame {
  const journeyDistanceMeters = distanceMeters(journey.start, journey.target);
  const elapsedMs = Math.max(0, nowMs - journey.createdAtMs);
  const rawTravelledMeters =
    (elapsedMs / (60 * 60 * 1000)) *
    journey.speedMetersPerHour *
    timeWarpFactor;
  const travelledMeters = Math.min(rawTravelledMeters, journeyDistanceMeters);
  const progress =
    journeyDistanceMeters === 0 ? 1 : travelledMeters / journeyDistanceMeters;
  const bearingDegrees = initialBearingDegrees(journey.start, journey.target);

  return {
    arrived: progress >= 1,
    coordinate: destinationCoordinate({
      from: journey.start,
      bearingDegrees,
      distanceMeters: travelledMeters
    }),
    progress,
    remainingMeters: Math.max(0, journeyDistanceMeters - travelledMeters),
    travelledMeters
  };
}

export function distanceMeters(a: Coordinate, b: Coordinate): number {
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_METERS * centralAngle;
}

export function initialBearingDegrees(a: Coordinate, b: Coordinate): number {
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  return normalizeDegrees(toDegrees(Math.atan2(y, x)));
}

export function destinationCoordinate({
  bearingDegrees,
  distanceMeters,
  from
}: {
  bearingDegrees: number;
  distanceMeters: number;
  from: Coordinate;
}): Coordinate {
  const angularDistance = distanceMeters / EARTH_RADIUS_METERS;
  const bearing = toRadians(bearingDegrees);
  const lat1 = toRadians(from.latitude);
  const lon1 = toRadians(from.longitude);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    latitude: toDegrees(lat2),
    longitude: normalizeLongitude(toDegrees(lon2))
  };
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function normalizeDegrees(degrees: number): number {
  return (degrees + 360) % 360;
}

function normalizeLongitude(longitude: number): number {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

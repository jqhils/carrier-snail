export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type JourneyQuirk =
  | "none"
  | "cursed-backwards"
  | "napper"
  | "scenic-detour";

export type RuntimeMode = "development" | "production" | "test";

export type PhaseZeroJourney = {
  createdAtMs: number;
  quirk?: JourneyQuirk;
  quirkSeed?: string;
  start: Coordinate;
  target: Coordinate;
  speedMetersPerHour: number;
};

export type CrawlFrame = {
  arrived: boolean;
  coordinate: Coordinate;
  progress: number;
  quirkEffect: JourneyQuirkEffect;
  remainingMeters: number;
  travelledMeters: number;
};

export type JourneyQuirkEffect =
  | {
      kind: "none";
    }
  | {
      backwardsMeters: number;
      kind: "cursed-backwards";
      reverseSpeedRatio: number;
    }
  | {
      kind: "napper";
      napping: boolean;
      napDurationMs: number;
      nappedMs: number;
    }
  | {
      detourMultiplier: number;
      kind: "scenic-detour";
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
  quirk = "none",
  quirkSeed = "phase-zero",
  speedMetersPerHour = BASE_SNAIL_SPEED_METERS_PER_HOUR,
  target
}: {
  createdAtMs: number;
  quirk?: JourneyQuirk;
  quirkSeed?: string;
  speedMetersPerHour?: number;
  target: Coordinate;
}): PhaseZeroJourney {
  const start = destinationCoordinate({
    from: target,
    bearingDegrees: PHASE_ZERO_SPAWN_BEARING_DEGREES,
    distanceMeters: PHASE_ZERO_SPAWN_DISTANCE_METERS
  });

  return {
    createdAtMs,
    quirk,
    quirkSeed,
    start,
    target,
    speedMetersPerHour
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
  const quirkAdjustedTravel = applyJourneyQuirk({
    elapsedMs: elapsedMs * timeWarpFactor,
    journey
  });
  const rawTravelledMeters =
    (quirkAdjustedTravel.effectiveTravelMs / (60 * 60 * 1000)) *
    journey.speedMetersPerHour;
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
    quirkEffect: quirkAdjustedTravel.effect,
    remainingMeters: Math.max(0, journeyDistanceMeters - travelledMeters),
    travelledMeters
  };
}

function applyJourneyQuirk({
  elapsedMs,
  journey
}: {
  elapsedMs: number;
  journey: PhaseZeroJourney;
}): { effect: JourneyQuirkEffect; effectiveTravelMs: number } {
  const quirk = journey.quirk ?? "none";
  const seed = journey.quirkSeed ?? "phase-zero";

  if (quirk === "cursed-backwards") {
    const cycleMs = 6 * 60 * 60 * 1000;
    const reverseDurationMs = (35 + seedUnit(seed, "duration") * 35) * 60 * 1000;
    const reverseStartRatio = 0.2 + seedUnit(seed, "start") * 0.45;
    const reverseSpeedRatio = 0.25 + seedUnit(seed, "speed") * 0.35;
    const reversedMs = elapsedInRepeatingWindow({
      cycleMs,
      elapsedMs,
      startMs: cycleMs * reverseStartRatio,
      windowMs: reverseDurationMs
    });
    const backwardsMs = reversedMs * reverseSpeedRatio;

    return {
      effect: {
        backwardsMeters:
          (backwardsMs / (60 * 60 * 1000)) * journey.speedMetersPerHour,
        kind: "cursed-backwards",
        reverseSpeedRatio
      },
      effectiveTravelMs: Math.max(0, elapsedMs - reversedMs - backwardsMs)
    };
  }

  if (quirk === "napper") {
    const cycleMs = 8 * 60 * 60 * 1000;
    const napDurationMs = (70 + seedUnit(seed, "duration") * 80) * 60 * 1000;
    const napStartMs = cycleMs * (0.15 + seedUnit(seed, "start") * 0.5);
    const nappedMs = elapsedInRepeatingWindow({
      cycleMs,
      elapsedMs,
      startMs: napStartMs,
      windowMs: napDurationMs
    });

    return {
      effect: {
        kind: "napper",
        nappedMs,
        napping: isWithinRepeatingWindow({
          cycleMs,
          elapsedMs,
          startMs: napStartMs,
          windowMs: napDurationMs
        }),
        napDurationMs
      },
      effectiveTravelMs: Math.max(0, elapsedMs - nappedMs)
    };
  }

  if (quirk === "scenic-detour") {
    const detourMultiplier = 1.15 + seedUnit(seed, "detour") * 0.35;

    return {
      effect: {
        detourMultiplier,
        kind: "scenic-detour"
      },
      effectiveTravelMs: elapsedMs / detourMultiplier
    };
  }

  return {
    effect: { kind: "none" },
    effectiveTravelMs: elapsedMs
  };
}

function elapsedInRepeatingWindow({
  cycleMs,
  elapsedMs,
  startMs,
  windowMs
}: {
  cycleMs: number;
  elapsedMs: number;
  startMs: number;
  windowMs: number;
}): number {
  if (elapsedMs <= 0) {
    return 0;
  }

  const completeCycles = Math.floor(elapsedMs / cycleMs);
  const cycleRemainderMs = elapsedMs % cycleMs;

  return (
    completeCycles * windowMs +
    Math.min(windowMs, Math.max(0, cycleRemainderMs - startMs))
  );
}

function isWithinRepeatingWindow({
  cycleMs,
  elapsedMs,
  startMs,
  windowMs
}: {
  cycleMs: number;
  elapsedMs: number;
  startMs: number;
  windowMs: number;
}): boolean {
  const cycleRemainderMs = elapsedMs % cycleMs;

  return (
    cycleRemainderMs >= startMs && cycleRemainderMs < startMs + windowMs
  );
}

function seedUnit(seed: string, salt: string): number {
  let hash = 2166136261;
  const input = `${seed}:${salt}`;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
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

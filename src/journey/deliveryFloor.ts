import { distanceMeters, type Coordinate } from "./snailCrawl";

export const DELIVERY_FLOOR_MINIMUM_MS = 24 * 60 * 60 * 1000;
export const HONEST_DISTANCE_FLOOR_RATIO = 0.4;

const HOUR_MS = 60 * 60 * 1000;

export type DeliverySpeedModifiers = {
  levelMultiplier?: number;
  rarityMultiplier?: number;
  spendMultiplier?: number;
};

export type DeliveryEtaInput = {
  baseSpeedMetersPerHour: number;
  createdAtMs: number;
  speedModifiers?: DeliverySpeedModifiers;
  start: Coordinate;
  target: Coordinate;
};

export function calculateClampedArrivalAtMs(input: DeliveryEtaInput): number {
  return (
    input.createdAtMs +
    Math.ceil(
      Math.max(
        calculateUnclampedTravelDurationMs(input),
        calculateDeliveryFloorDurationMs(input)
      )
    )
  );
}

export function calculateDeliveryFloorDurationMs({
  baseSpeedMetersPerHour,
  start,
  target
}: {
  baseSpeedMetersPerHour: number;
  start: Coordinate;
  target: Coordinate;
}): number {
  const honestDistanceTimeMs = calculateHonestDistanceTimeMs({
    baseSpeedMetersPerHour,
    start,
    target
  });

  return Math.ceil(
    Math.max(
      DELIVERY_FLOOR_MINIMUM_MS,
      honestDistanceTimeMs * HONEST_DISTANCE_FLOOR_RATIO
    )
  );
}

export function calculateHonestDistanceTimeMs({
  baseSpeedMetersPerHour,
  start,
  target
}: {
  baseSpeedMetersPerHour: number;
  start: Coordinate;
  target: Coordinate;
}): number {
  assertPositiveSpeed(baseSpeedMetersPerHour);

  return (distanceMeters(start, target) / baseSpeedMetersPerHour) * HOUR_MS;
}

export function calculateEffectiveSpeedMetersPerHour({
  baseSpeedMetersPerHour,
  speedModifiers = {}
}: {
  baseSpeedMetersPerHour: number;
  speedModifiers?: DeliverySpeedModifiers;
}): number {
  assertPositiveSpeed(baseSpeedMetersPerHour);

  return (
    baseSpeedMetersPerHour *
    sanitizeMultiplier(speedModifiers.rarityMultiplier) *
    sanitizeMultiplier(speedModifiers.levelMultiplier) *
    sanitizeMultiplier(speedModifiers.spendMultiplier)
  );
}

function calculateUnclampedTravelDurationMs({
  baseSpeedMetersPerHour,
  speedModifiers,
  start,
  target
}: DeliveryEtaInput): number {
  const effectiveSpeedMetersPerHour = calculateEffectiveSpeedMetersPerHour({
    baseSpeedMetersPerHour,
    speedModifiers
  });

  return (distanceMeters(start, target) / effectiveSpeedMetersPerHour) * HOUR_MS;
}

function sanitizeMultiplier(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : 1;
}

function assertPositiveSpeed(speedMetersPerHour: number): void {
  if (!Number.isFinite(speedMetersPerHour) || speedMetersPerHour <= 0) {
    throw new Error("Base snail speed must be greater than zero.");
  }
}

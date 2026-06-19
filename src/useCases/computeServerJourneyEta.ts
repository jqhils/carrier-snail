import {
  calculateClampedArrivalAtMs,
  calculateDeliveryFloorDurationMs,
  calculateHonestDistanceTimeMs,
  type DeliverySpeedModifiers
} from "../journey/deliveryFloor";
import type { Clock } from "./createReminderJourney";
import type { JourneyRecord } from "./localCarrierState";

export type ComputeServerJourneyEtaInput = {
  clientNowMs?: number;
  clock: Clock;
  journey: JourneyRecord;
  speedModifiers?: DeliverySpeedModifiers;
};

export type ServerJourneyEta = {
  earliestArrivalAtMs: number;
  floorDurationMs: number;
  honestDistanceTimeMs: number;
  remainingMs: number;
  serverNowMs: number;
};

export function computeServerJourneyEta({
  clock,
  journey,
  speedModifiers
}: ComputeServerJourneyEtaInput): ServerJourneyEta {
  const serverNowMs = clock.now();
  const earliestArrivalAtMs = calculateClampedArrivalAtMs({
    baseSpeedMetersPerHour: journey.speedMetersPerHour,
    createdAtMs: journey.createdAtMs,
    speedModifiers,
    start: journey.start,
    target: journey.target
  });

  return {
    earliestArrivalAtMs,
    floorDurationMs: calculateDeliveryFloorDurationMs({
      baseSpeedMetersPerHour: journey.speedMetersPerHour,
      start: journey.start,
      target: journey.target
    }),
    honestDistanceTimeMs: calculateHonestDistanceTimeMs({
      baseSpeedMetersPerHour: journey.speedMetersPerHour,
      start: journey.start,
      target: journey.target
    }),
    remainingMs: Math.max(0, earliestArrivalAtMs - serverNowMs),
    serverNowMs
  };
}

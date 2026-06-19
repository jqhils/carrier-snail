import { coarsenCoordinate } from "../location/coarseLocation";
import { distanceMeters, getCrawlFrame } from "../journey/snailCrawl";
import type { Clock, LocationSource } from "./createReminderJourney";
import { computeServerJourneyEta, type ServerJourneyEta } from "./computeServerJourneyEta";
import {
  cloneCarrierState,
  type CarrierState,
  type JourneyRecord,
  type TrailHistoryPoint
} from "./localCarrierState";
import type { BackendCarrierRepository } from "./resolveAnonymousCarrierUser";

export const MAX_TRAIL_HISTORY_POINTS = 12;

export type ForegroundTargetUpdateResult = {
  carrierState: CarrierState;
  serverEta?: ServerJourneyEta;
  updatedCount: number;
};

export async function updateForegroundTarget({
  clock,
  locationSource,
  repository,
  userId
}: {
  clock: Clock;
  locationSource: LocationSource;
  repository: BackendCarrierRepository;
  userId: string;
}): Promise<ForegroundTargetUpdateResult> {
  const nowMs = clock.now();
  const nextTarget = coarsenCoordinate(locationSource.currentTarget());
  const state = cloneCarrierState(await repository.loadCarrierState(userId));
  let serverEta: ServerJourneyEta | undefined;
  let updatedCount = 0;

  for (const journey of state.journeys) {
    if (journey.status !== "in-flight") {
      continue;
    }

    if (distanceMeters(journey.target, nextTarget) < 1) {
      continue;
    }

    const frame = getCrawlFrame({
      journey,
      nowMs,
      timeWarpFactor: 1
    });

    journey.createdAtMs = nowMs;
    journey.start = frame.coordinate;
    journey.target = nextTarget;
    journey.trailHistory = appendTrailPoint(journey, {
      coordinate: frame.coordinate,
      recordedAtMs: nowMs
    });

    serverEta = computeServerJourneyEta({
      clock: { now: () => nowMs },
      journey
    });
    updatedCount += 1;
  }

  if (updatedCount > 0) {
    await repository.saveCarrierState(userId, state);
  }

  return { carrierState: state, serverEta, updatedCount };
}

function appendTrailPoint(
  journey: JourneyRecord,
  point: TrailHistoryPoint
): TrailHistoryPoint[] {
  return [...(journey.trailHistory ?? []), point].slice(
    -MAX_TRAIL_HISTORY_POINTS
  );
}

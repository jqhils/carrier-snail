import {
  destinationCoordinate,
  distanceMeters,
  getCrawlFrame,
  initialBearingDegrees,
  type Coordinate,
  type CrawlFrame
} from "../journey/snailCrawl";
import type { Clock } from "./createReminderJourney";
import {
  computeServerJourneyEta,
  type ServerJourneyEta
} from "./computeServerJourneyEta";
import {
  type CarrierRepository,
  type CarrierState,
  type JourneyRecord,
  type Snail,
  type SnailTrailTraits,
  type TrailHistoryPoint
} from "./localCarrierState";
import type { PushSender } from "./pushSender";
import type { SnailSpeciesId } from "./snailSpecies";

const ETA_RANGE_MIN_PADDING_MS = 6 * 60 * 60 * 1000;
const ETA_RANGE_PADDING_RATIO = 0.2;

export type WatchJourneyPreview = {
  coordinate: Coordinate;
  isLive: boolean;
  progress: number;
  remainingMeters: number;
  travelledMeters: number;
};

export type WatchEtaRange = Pick<
  ServerJourneyEta,
  "floorDurationMs" | "honestDistanceTimeMs" | "serverNowMs"
> & {
  copy: string;
  noSoonerThanAtMs: number;
  rangeEndAtMs: number;
  remainingMs: number;
  rangeEndRemainingMs: number;
};

export type WatchJourneySnapshot = {
  etaRange: WatchEtaRange;
  journeyId: string;
  liveFrame: CrawlFrame;
  path: Coordinate[];
  preview: WatchJourneyPreview;
  reminderId: string;
  reminderText: string;
  snailId: string;
  snailName: string;
  snailSpeciesId?: SnailSpeciesId;
  start: Coordinate;
  target: Coordinate;
  trail: SnailTrailTraits;
  trailHistory: TrailHistoryPoint[];
};

export type JourneyWatchState = {
  journeys: WatchJourneySnapshot[];
  selectedJourney?: WatchJourneySnapshot;
};

export type JourneyWatchControlInput =
  | {
      journeyId: string;
      kind: "live";
    }
  | {
      journeyId: string;
      kind: "scrub";
      progress: number;
    };

export function loadJourneyWatchState({
  clock,
  repository,
  scrubProgressByJourneyId,
  selectedJourneyId,
  timeWarpFactor = 1
}: {
  clock: Clock;
  repository: CarrierRepository;
  scrubProgressByJourneyId?: Record<string, number | undefined>;
  selectedJourneyId?: string;
  timeWarpFactor?: number;
}): JourneyWatchState {
  return buildJourneyWatchState({
    clock,
    scrubProgressByJourneyId,
    selectedJourneyId,
    state: repository.snapshot(),
    timeWarpFactor
  });
}

export function buildJourneyWatchState({
  clock,
  scrubProgressByJourneyId = {},
  selectedJourneyId,
  state,
  timeWarpFactor = 1
}: {
  clock: Clock;
  scrubProgressByJourneyId?: Record<string, number | undefined>;
  selectedJourneyId?: string;
  state: CarrierState;
  timeWarpFactor?: number;
}): JourneyWatchState {
  const journeys = state.journeys
    .filter((journey) => journey.status === "in-flight")
    .flatMap((journey) => {
      const todo = journey.todoId
        ? state.todos.find(
            (candidate) =>
              candidate.id === journey.todoId && candidate.status === "open"
          )
        : undefined;
      const reminder = journey.reminderId
        ? state.reminders.find(
            (candidate) =>
              candidate.id === journey.reminderId &&
              candidate.status === "in-flight"
          )
        : undefined;
      const reminderText = todo?.text ?? reminder?.text;

      if (!reminderText) {
        return [];
      }

      const snail = state.snails.find(({ id }) => id === journey.snailId);

      return [
        createWatchJourneySnapshot({
          clock,
          journey,
          reminderText,
          scrubProgress: scrubProgressByJourneyId[journey.id],
          snail,
          timeWarpFactor
        })
      ];
    });
  const selectedJourney =
    journeys.find(({ journeyId }) => journeyId === selectedJourneyId) ??
    journeys[0];

  return { journeys, selectedJourney };
}

export function applyJourneyWatchControl(
  input: JourneyWatchControlInput,
  {
    clock,
    pushSender,
    repository,
    timeWarpFactor = 1
  }: {
    clock: Clock;
    pushSender: PushSender;
    repository: CarrierRepository;
    timeWarpFactor?: number;
  }
): JourneyWatchState {
  void pushSender;

  return loadJourneyWatchState({
    clock,
    repository,
    scrubProgressByJourneyId:
      input.kind === "scrub"
        ? { [input.journeyId]: input.progress }
        : undefined,
    selectedJourneyId: input.journeyId,
    timeWarpFactor
  });
}

function createWatchJourneySnapshot({
  clock,
  journey,
  reminderText,
  scrubProgress,
  snail,
  timeWarpFactor
}: {
  clock: Clock;
  journey: JourneyRecord;
  reminderText: string;
  scrubProgress?: number;
  snail?: Snail;
  timeWarpFactor: number;
}): WatchJourneySnapshot {
  const liveFrame = getCrawlFrame({
    journey,
    nowMs: clock.now(),
    timeWarpFactor
  });
  const preview = createPreview({
    journey,
    liveFrame,
    scrubProgress
  });

  return {
    etaRange: createWatchEtaRange({
      eta: computeServerJourneyEta({ clock, journey })
    }),
    journeyId: journey.id,
    liveFrame,
    path: [
      journey.start,
      ...(journey.trailHistory ?? []).map(({ coordinate }) => coordinate),
      preview.coordinate,
      journey.target
    ],
    preview,
    reminderId: journey.reminderId ?? journey.todoId ?? journey.id,
    reminderText,
    snailId: journey.snailId,
    snailName: snail?.name ?? "Unknown snail",
    ...(snail ? { snailSpeciesId: snail.speciesId } : {}),
    start: journey.start,
    target: journey.target,
    trail:
      snail?.trail ??
      ({
        color: "#f5f8ed",
        persistenceMs: 72 * 60 * 60 * 1000,
        texture: "glistening"
      } satisfies SnailTrailTraits),
    trailHistory: journey.trailHistory ?? []
  };
}

function createPreview({
  journey,
  liveFrame,
  scrubProgress
}: {
  journey: JourneyRecord;
  liveFrame: CrawlFrame;
  scrubProgress?: number;
}): WatchJourneyPreview {
  if (scrubProgress === undefined) {
    return {
      coordinate: liveFrame.coordinate,
      isLive: true,
      progress: liveFrame.progress,
      remainingMeters: liveFrame.remainingMeters,
      travelledMeters: liveFrame.travelledMeters
    };
  }

  const progress = Math.max(0, Math.min(1, scrubProgress));
  const journeyDistanceMeters = distanceMeters(journey.start, journey.target);
  const travelledMeters = journeyDistanceMeters * progress;

  return {
    coordinate: destinationCoordinate({
      bearingDegrees: initialBearingDegrees(journey.start, journey.target),
      distanceMeters: travelledMeters,
      from: journey.start
    }),
    isLive: false,
    progress,
    remainingMeters: Math.max(0, journeyDistanceMeters - travelledMeters),
    travelledMeters
  };
}

function createWatchEtaRange({
  eta
}: {
  eta: ServerJourneyEta;
}): WatchEtaRange {
  const rangePaddingMs = Math.max(
    ETA_RANGE_MIN_PADDING_MS,
    Math.round(eta.remainingMs * ETA_RANGE_PADDING_RATIO)
  );
  const rangeEndRemainingMs = eta.remainingMs + rangePaddingMs;

  return {
    copy: `No sooner than ${formatDuration(
      eta.remainingMs
    )}; honest window ${formatDuration(eta.remainingMs)} to ${formatDuration(
      rangeEndRemainingMs
    )} if the target rests.`,
    floorDurationMs: eta.floorDurationMs,
    honestDistanceTimeMs: eta.honestDistanceTimeMs,
    noSoonerThanAtMs: eta.earliestArrivalAtMs,
    rangeEndAtMs: eta.earliestArrivalAtMs + rangePaddingMs,
    rangeEndRemainingMs,
    remainingMs: eta.remainingMs,
    serverNowMs: eta.serverNowMs
  };
}

function formatDuration(durationMs: number): string {
  if (durationMs <= 0) {
    return "now";
  }

  const totalMinutes = Math.max(1, Math.ceil(durationMs / (60 * 1000)));
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (totalHours > 0) {
    return minutes > 0 ? `${totalHours}h ${minutes}m` : `${totalHours}h`;
  }

  return `${minutes}m`;
}

import {
  BASE_SNAIL_SPEED_METERS_PER_HOUR,
  createPhaseZeroJourney
} from "../journey/snailCrawl";
import { DELIVERY_FLOOR_MINIMUM_MS } from "../journey/deliveryFloor";
import type { PushSender } from "./pushSender";
import {
  applyJourneyWatchControl,
  loadJourneyWatchState
} from "./watchJourneyState";
import {
  createStarterGardenSnail,
  InMemoryCarrierRepository,
  type CarrierState,
  type JourneyRecord,
  type Snail,
  type TrailHistoryPoint
} from "./localCarrierState";

const target = {
  latitude: -33.8688,
  longitude: 151.2093
};

const oneHourMs = 60 * 60 * 1000;

describe("watchJourneyState", () => {
  it("summarizes every in-flight journey with path history, target, and honest ETA range copy", () => {
    const historyPoint: TrailHistoryPoint = {
      coordinate: {
        latitude: -33.9,
        longitude: 151.15
      },
      recordedAtMs: 30 * 60 * 1000
    };
    const repository = new InMemoryCarrierRepository(
      createWatchState({
        journeys: [
          createJourneyRecord({
            id: "journey-1",
            reminderId: "reminder-1",
            snailId: "snail-1"
          }),
          createJourneyRecord({
            id: "journey-2",
            reminderId: "reminder-2",
            snailId: "snail-2",
            trailHistory: [historyPoint]
          })
        ],
        snails: [
          createWatchSnail({
            id: "snail-1",
            name: "Backend Garden",
            trailColor: "#f5f8ed"
          }),
          createWatchSnail({
            id: "snail-2",
            name: "Quiet Fern",
            trailColor: "#86b47e"
          })
        ]
      })
    );

    const watchState = loadJourneyWatchState({
      clock: { now: () => oneHourMs },
      repository
    });

    expect(watchState.journeys.map((journey) => journey.reminderText)).toEqual([
      "check passport",
      "water fern"
    ]);
    expect(watchState.journeys.map((journey) => journey.snailName)).toEqual([
      "Backend Garden",
      "Quiet Fern"
    ]);
    expect(watchState.journeys.map((journey) => journey.snailSpeciesId)).toEqual([
      "garden",
      "garden"
    ]);
    expect(watchState.journeys[0].liveFrame.travelledMeters).toBeCloseTo(
      BASE_SNAIL_SPEED_METERS_PER_HOUR,
      3
    );
    expect(watchState.journeys[1].path).toHaveLength(4);
    expect(watchState.journeys[1].path[1]).toEqual(historyPoint.coordinate);
    expect(watchState.journeys[0].etaRange.noSoonerThanAtMs).toBeGreaterThanOrEqual(
      DELIVERY_FLOOR_MINIMUM_MS
    );
    expect(watchState.journeys[0].etaRange.copy).toMatch(/^No sooner than /);
    expect(watchState.journeys[0].etaRange.copy).not.toMatch(
      /\b(deadline|by|exactly)\b/i
    );
  });

  it("previews scrub controls without mutating delivery state or scheduling pushes", () => {
    const repository = new InMemoryCarrierRepository(
      createWatchState({
        journeys: [
          createJourneyRecord({
            id: "journey-1",
            reminderId: "reminder-1",
            snailId: "snail-1"
          })
        ],
        snails: [
          createWatchSnail({
            id: "snail-1",
            name: "Backend Garden",
            trailColor: "#f5f8ed"
          })
        ]
      })
    );
    const before = repository.snapshot();
    const sentPushes: unknown[] = [];
    const cancelledPushes: string[] = [];
    const pushSender: PushSender = {
      cancelArrival: (reminderId) => {
        cancelledPushes.push(reminderId);
      },
      sendArrival: (push) => {
        sentPushes.push(push);
      }
    };

    const watchState = applyJourneyWatchControl(
      {
        journeyId: "journey-1",
        kind: "scrub",
        progress: 0.5
      },
      {
        clock: { now: () => oneHourMs },
        pushSender,
        repository
      }
    );

    expect(watchState.selectedJourney?.preview.isLive).toBe(false);
    expect(watchState.selectedJourney?.preview.progress).toBe(0.5);
    expect(repository.snapshot()).toEqual(before);
    expect(sentPushes).toEqual([]);
    expect(cancelledPushes).toEqual([]);
  });
});

function createWatchState({
  journeys,
  snails
}: {
  journeys: JourneyRecord[];
  snails: Snail[];
}): CarrierState {
  return {
    arrivals: [],
    eggs: [],
    inventory: { cosmetics: [] },
    journeys,
    onboarding: {},
    purchases: [],
    reminders: [
      {
        createdAtMs: 0,
        id: "reminder-1",
        snailId: "snail-1",
        status: "in-flight",
        text: "check passport"
      },
      {
        createdAtMs: 0,
        id: "reminder-2",
        snailId: "snail-2",
        status: "in-flight",
        text: "water fern"
      }
    ],
    snails,
    softCurrency: { slime: 0 },
    stableSlots: { purchased: 0 },
    todos: []
  };
}

function createJourneyRecord({
  id,
  reminderId,
  snailId,
  trailHistory = []
}: {
  id: string;
  reminderId: string;
  snailId: string;
  trailHistory?: TrailHistoryPoint[];
}): JourneyRecord {
  return {
    ...createPhaseZeroJourney({
      createdAtMs: 0,
      target
    }),
    id,
    reminderId,
    snailId,
    status: "in-flight",
    trailHistory
  };
}

function createWatchSnail({
  id,
  name,
  trailColor
}: {
  id: string;
  name: string;
  trailColor: string;
}): Snail {
  const garden = createStarterGardenSnail();

  return {
    ...garden,
    id,
    name,
    status: "on-journey",
    trail: {
      ...garden.trail,
      color: trailColor
    }
  };
}

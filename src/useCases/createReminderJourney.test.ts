import {
  createInitialCarrierState,
  InMemoryCarrierRepository,
  listInFlightReminders,
  listStableSnails
} from "./localCarrierState";
import {
  createReminderJourney,
  NoRestingSnailError,
  RecurringReminderRejectedError
} from "./createReminderJourney";
import {
  BASE_SNAIL_SPEED_METERS_PER_HOUR,
  distanceMeters,
  getCrawlFrame,
  PHASE_ZERO_SPAWN_DISTANCE_METERS
} from "../journey/snailCrawl";

const target = {
  latitude: -33.8688,
  longitude: 151.2093
};

describe("createReminderJourney", () => {
  it("creates an in-flight reminder and assigns the starter snail", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());

    const result = createReminderJourney(
      { text: "buy milk" },
      {
        clock: { now: () => 1000 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );

    const state = repository.snapshot();

    expect(result.reminder.text).toBe("buy milk");
    expect(result.reminder.status).toBe("in-flight");
    expect(result.reminder.snailId).toBe("garden-1");
    expect(result.journey.reminderId).toBe(result.reminder.id);
    expect(state.snails[0]).toMatchObject({
      id: "garden-1",
      status: "on-journey"
    });
    expect(listInFlightReminders(state)).toEqual([
      {
        reminderId: result.reminder.id,
        snailName: "Garden Snail",
        text: "buy milk"
      }
    ]);
    expect(listStableSnails(state)).toEqual({
      capacity: {
        busyCount: 1,
        freeCount: 0,
        totalCount: 1
      },
      snails: [
        {
          carryingText: "buy milk",
          id: "garden-1",
          name: "Garden Snail",
          status: "on-journey",
          statusLabel: "On journey"
        }
      ]
    });
  });

  it("starts the local journey about 8 km away on a straight geodesic", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());

    const { journey } = createReminderJourney(
      { text: "check passport" },
      {
        clock: { now: () => 0 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );

    expect(distanceMeters(journey.start, journey.target)).toBeGreaterThan(
      PHASE_ZERO_SPAWN_DISTANCE_METERS - 25
    );
    expect(distanceMeters(journey.start, journey.target)).toBeLessThan(
      PHASE_ZERO_SPAWN_DISTANCE_METERS + 25
    );

    const afterOneHour = getCrawlFrame({
      journey,
      nowMs: 60 * 60 * 1000,
      timeWarpFactor: 1
    });

    expect(afterOneHour.travelledMeters).toBeCloseTo(
      BASE_SNAIL_SPEED_METERS_PER_HOUR,
      3
    );
  });

  it("rejects recurring reminders by design", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());

    expect(() =>
      createReminderJourney(
        { recurrence: "daily", text: "water plants" },
        {
          clock: { now: () => 0 },
          locationSource: { currentTarget: () => target },
          repository
        }
      )
    ).toThrow(RecurringReminderRejectedError);
  });

  it("rejects a reminder assigned to a snail that is not resting", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());

    expect(() =>
      createReminderJourney(
        { snailId: "missing-snail", text: "buy milk" },
        {
          clock: { now: () => 0 },
          locationSource: { currentTarget: () => target },
          repository
        }
      )
    ).toThrow(NoRestingSnailError);
  });

  it("rejects a second concurrent reminder when the stable has no free snail", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());

    createReminderJourney(
      { text: "buy milk" },
      {
        clock: { now: () => 0 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );

    expect(() =>
      createReminderJourney(
        { text: "check passport" },
        {
          clock: { now: () => 1000 },
          locationSource: { currentTarget: () => target },
          repository
        }
      )
    ).toThrow(NoRestingSnailError);
  });
});

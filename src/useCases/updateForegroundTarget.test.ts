import {
  distanceMeters,
  initialBearingDegrees,
  type Coordinate
} from "../journey/snailCrawl";
import { computeServerJourneyEta } from "./computeServerJourneyEta";
import { createReminderJourney } from "./createReminderJourney";
import {
  cloneCarrierState,
  createInitialCarrierState,
  InMemoryCarrierRepository,
  type CarrierState
} from "./localCarrierState";
import type {
  BackendCarrierRepository,
  CarrierUser,
  AuthenticatedUser
} from "./resolveAnonymousCarrierUser";
import {
  MAX_TRAIL_HISTORY_POINTS,
  updateForegroundTarget
} from "./updateForegroundTarget";

const originalTarget = {
  latitude: -33.8688,
  longitude: 151.2093
};
const movedTarget = {
  latitude: -33.9188123,
  longitude: 151.1093456
};

class FakeBackendCarrierRepository implements BackendCarrierRepository {
  constructor(private state: CarrierState) {}

  async ensureUser(
    authUser: AuthenticatedUser,
    nowMs: number
  ): Promise<CarrierUser> {
    return {
      authUserId: authUser.authUserId,
      createdAtMs: nowMs,
      id: "carrier-user-1"
    };
  }

  async loadCarrierState(): Promise<CarrierState> {
    return cloneCarrierState(this.state);
  }

  async saveCarrierState(_userId: string, state: CarrierState): Promise<void> {
    this.state = cloneCarrierState(state);
  }

  snapshot(): CarrierState {
    return cloneCarrierState(this.state);
  }
}

describe("updateForegroundTarget", () => {
  it("coarsens foreground location before re-aiming and rescheduling ETA", async () => {
    const nowMs = 2 * 60 * 60 * 1000;
    const state = createBackendJourneyState("buy milk");
    const oldJourney = state.journeys[0];
    const oldBearing = initialBearingDegrees(oldJourney.start, oldJourney.target);
    const oldEta = computeServerJourneyEta({
      clock: { now: () => nowMs },
      journey: oldJourney
    });
    const repository = new FakeBackendCarrierRepository(state);

    const result = await updateForegroundTarget({
      clock: { now: () => nowMs },
      locationSource: { currentTarget: () => movedTarget },
      repository,
      userId: "carrier-user-1"
    });
    const updatedJourney = repository.snapshot().journeys[0];
    const newBearing = initialBearingDegrees(
      updatedJourney.start,
      updatedJourney.target
    );

    expect(result.updatedCount).toBe(1);
    expect(updatedJourney.target).not.toEqual(movedTarget);
    expect(distanceMeters(updatedJourney.target, movedTarget)).toBeLessThan(60);
    expect(newBearing).not.toBeCloseTo(oldBearing, 1);
    expect(result.serverEta?.earliestArrivalAtMs).not.toBe(
      oldEta.earliestArrivalAtMs
    );
    expect(updatedJourney.trailHistory).toHaveLength(1);
    expect(updatedJourney.trailHistory?.[0].coordinate).not.toEqual(
      movedTarget
    );
  });

  it("keeps only the latest target plus a short trail history", async () => {
    const state = createBackendJourneyState("check passport");
    state.journeys[0].trailHistory = Array.from(
      { length: MAX_TRAIL_HISTORY_POINTS },
      (_, index) => ({
        coordinate: offsetCoordinate(originalTarget, index + 1),
        recordedAtMs: index
      })
    );
    const repository = new FakeBackendCarrierRepository(state);

    await updateForegroundTarget({
      clock: { now: () => 5 * 60 * 60 * 1000 },
      locationSource: { currentTarget: () => movedTarget },
      repository,
      userId: "carrier-user-1"
    });

    expect(repository.snapshot().journeys[0].trailHistory).toHaveLength(
      MAX_TRAIL_HISTORY_POINTS
    );
    expect(repository.snapshot().journeys[0].trailHistory?.[0].recordedAtMs).toBe(
      1
    );
  });

  it("does not reschedule when the coarse target is unchanged", async () => {
    const state = createBackendJourneyState("read book");
    const repository = new FakeBackendCarrierRepository(state);

    const result = await updateForegroundTarget({
      clock: { now: () => 3 * 60 * 60 * 1000 },
      locationSource: { currentTarget: () => originalTarget },
      repository,
      userId: "carrier-user-1"
    });

    expect(result.updatedCount).toBe(0);
    expect(repository.snapshot().journeys[0].createdAtMs).toBe(0);
  });

  it("does not force arrival when a moving foreground target re-aims the journey", async () => {
    const state = createBackendJourneyState("water plants");
    const journey = state.journeys[0];
    const oldPhysicalArrivalMs =
      (distanceMeters(journey.start, journey.target) /
        journey.speedMetersPerHour) *
        60 *
        60 *
        1000 +
      1000;
    const repository = new FakeBackendCarrierRepository(state);

    const result = await updateForegroundTarget({
      clock: { now: () => oldPhysicalArrivalMs },
      locationSource: { currentTarget: () => movedTarget },
      repository,
      userId: "carrier-user-1"
    });
    const updated = repository.snapshot();

    expect(updated.journeys[0].status).toBe("in-flight");
    expect(updated.reminders[0].status).toBe("in-flight");
    expect(result.serverEta?.earliestArrivalAtMs).toBeGreaterThan(
      oldPhysicalArrivalMs
    );
  });
});

function createBackendJourneyState(text: string): CarrierState {
  const repository = new InMemoryCarrierRepository(createInitialCarrierState());

  createReminderJourney(
    { text },
    {
      clock: { now: () => 0 },
      locationSource: { currentTarget: () => originalTarget },
      repository
    }
  );

  return repository.snapshot();
}

function offsetCoordinate(coordinate: Coordinate, offset: number): Coordinate {
  return {
    latitude: coordinate.latitude + offset * 0.001,
    longitude: coordinate.longitude + offset * 0.001
  };
}

import {
  BASE_SNAIL_SPEED_METERS_PER_HOUR,
  createPhaseZeroJourney
} from "../journey/snailCrawl";
import { DELIVERY_FLOOR_MINIMUM_MS } from "../journey/deliveryFloor";
import { loadBackendJourneyState } from "./loadBackendJourneyState";
import type { BackendCarrierRepository } from "./resolveAnonymousCarrierUser";
import { createStarterGardenSnail, type CarrierState } from "./localCarrierState";

const target = {
  latitude: -33.8688,
  longitude: 151.2093
};

class FakeBackendCarrierRepository implements BackendCarrierRepository {
  readonly loadedUserIds: string[] = [];

  constructor(private readonly state: CarrierState) {}

  async ensureUser(): Promise<never> {
    throw new Error("Not needed for this test.");
  }

  async loadCarrierState(userId: string): Promise<CarrierState> {
    this.loadedUserIds.push(userId);

    return this.state;
  }

  async saveCarrierState(): Promise<void> {
    throw new Error("Not needed for this test.");
  }
}

describe("loadBackendJourneyState", () => {
  it("loads active journey state from backend parameters using the injected clock", async () => {
    const baseJourney = createPhaseZeroJourney({ createdAtMs: 0, target });
    const backendState: CarrierState = {
      eggs: [],
      inventory: { cosmetics: [] },
      journeys: [
        {
          ...baseJourney,
          id: "journey-1",
          reminderId: "reminder-1",
          snailId: "snail-1",
          status: "in-flight"
        }
      ],
      reminders: [
        {
          createdAtMs: 0,
          id: "reminder-1",
          snailId: "snail-1",
          status: "in-flight",
          text: "check passport"
        }
      ],
      snails: [
        {
          ...createStarterGardenSnail(),
          id: "snail-1",
          name: "Backend Garden",
          status: "on-journey"
        }
      ],
      purchases: [],
      softCurrency: { slime: 0 },
      stableSlots: { purchased: 0 }
    };
    const repository = new FakeBackendCarrierRepository(backendState);

    const state = await loadBackendJourneyState({
      clock: { now: () => 60 * 60 * 1000 },
      repository,
      userId: "carrier-user-1"
    });

    expect(repository.loadedUserIds).toEqual(["carrier-user-1"]);
    expect(state.activeJourney?.id).toBe("journey-1");
    expect(state.activeFrame?.travelledMeters).toBeCloseTo(
      BASE_SNAIL_SPEED_METERS_PER_HOUR,
      3
    );
    expect(state.serverEta?.earliestArrivalAtMs).toBeGreaterThanOrEqual(
      DELIVERY_FLOOR_MINIMUM_MS
    );
    expect(state.inFlightReminders).toEqual([
      {
        reminderId: "reminder-1",
        snailName: "Backend Garden",
        text: "check passport"
      }
    ]);
    expect(state.watchState.journeys).toHaveLength(1);
    expect(state.watchState.journeys[0].reminderText).toBe("check passport");
    expect(state.watchState.journeys[0].etaRange.copy).toMatch(
      /^No sooner than /
    );
  });
});

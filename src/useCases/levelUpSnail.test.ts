import {
  DELIVERY_FLOOR_MINIMUM_MS
} from "../journey/deliveryFloor";
import { createInitialCarrierState, InMemoryCarrierRepository } from "./localCarrierState";
import { computeServerJourneyEta } from "./computeServerJourneyEta";
import { createReminderJourney } from "./createReminderJourney";
import { levelUpSnail } from "./levelUpSnail";

const target = {
  latitude: -33.8688,
  longitude: 151.2093
};

describe("levelUpSnail", () => {
  it("spends earned slime to improve speed, reliability, and cosmetics", () => {
    const initialState = createInitialCarrierState();
    const before = initialState.snails[0];
    const repository = new InMemoryCarrierRepository({
      ...initialState,
      softCurrency: { slime: 1 }
    });

    const result = levelUpSnail(
      { snailId: "garden-1" },
      { repository }
    );
    const state = repository.snapshot();
    const after = state.snails[0];

    expect(result.snail).toEqual(after);
    expect(state.softCurrency.slime).toBe(0);
    expect(after.level).toBe(2);
    expect(after.baseSpeedMetersPerHour).toBeGreaterThan(
      before.baseSpeedMetersPerHour
    );
    expect(after.reliability).toBeGreaterThan(before.reliability);
    expect(after.trail.texture).toBe("sparkling");
  });

  it("makes future journeys measurably faster without beating the Delivery Floor", () => {
    const initialState = createInitialCarrierState();
    const repository = new InMemoryCarrierRepository({
      ...initialState,
      softCurrency: { slime: 3 }
    });

    levelUpSnail({ snailId: "garden-1" }, { repository });
    levelUpSnail({ snailId: "garden-1" }, { repository });

    const { journey } = createReminderJourney(
      { snailId: "garden-1", text: "send the slow thought" },
      {
        clock: { now: () => 0 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );
    const eta = computeServerJourneyEta({
      clock: { now: () => 0 },
      journey
    });

    expect(journey.speedMetersPerHour).toBeGreaterThan(48);
    expect(eta.earliestArrivalAtMs).toBeGreaterThanOrEqual(
      eta.floorDurationMs
    );
    expect(eta.earliestArrivalAtMs).toBeGreaterThanOrEqual(
      DELIVERY_FLOOR_MINIMUM_MS
    );
  });
});

import {
  createInitialCarrierState,
  InMemoryCarrierRepository
} from "./localCarrierState";
import { createReminderJourney } from "./createReminderJourney";
import { completeArrivedJourneys } from "./completeArrivedJourneys";
import type { ArrivalPush, PushSender } from "./pushSender";
import { distanceMeters } from "../journey/snailCrawl";

const target = {
  latitude: -33.8688,
  longitude: 151.2093
};

class FakePushSender implements PushSender {
  readonly arrivals: ArrivalPush[] = [];

  cancelArrival(): void {
    // Not needed for completion tests.
  }

  sendArrival(push: ArrivalPush): void {
    this.arrivals.push(push);
  }
}

describe("completeArrivedJourneys", () => {
  it("does not send any notification before arrival", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());
    const pushSender = new FakePushSender();

    createReminderJourney(
      { text: "buy milk" },
      {
        clock: { now: () => 0 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );

    const result = completeArrivedJourneys({
      clock: { now: () => 60 * 60 * 1000 },
      pushSender,
      repository
    });

    expect(result.completedCount).toBe(0);
    expect(pushSender.arrivals).toEqual([]);
  });

  it("sends exactly one arrival notification with the original reminder text", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());
    const pushSender = new FakePushSender();

    const { journey, reminder } = createReminderJourney(
      { text: "check passport" },
      {
        clock: { now: () => 0 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );
    const arrivalMs =
      (journeyDistanceHours(journey) + 1) * 60 * 60 * 1000;

    const first = completeArrivedJourneys({
      clock: { now: () => arrivalMs },
      pushSender,
      repository
    });
    const second = completeArrivedJourneys({
      clock: { now: () => arrivalMs + 1000 },
      pushSender,
      repository
    });
    const state = repository.snapshot();

    expect(first.completedCount).toBe(1);
    expect(second.completedCount).toBe(0);
    expect(pushSender.arrivals).toEqual([
      {
        reminderId: reminder.id,
        text: "check passport",
        title: "Carrier Snail arrived"
      }
    ]);
    expect(state.reminders[0]).toMatchObject({
      deliveredAtMs: arrivalMs,
      status: "delivered"
    });
    expect(state.journeys[0]).toMatchObject({
      arrivedAtMs: arrivalMs,
      status: "arrived"
    });
    expect(state.snails[0]).toMatchObject({
      id: "garden-1",
      status: "resting"
    });
    expect(state.eggs).toEqual([
      {
        earnedAtMs: arrivalMs,
        id: "egg-1",
        source: "earned",
        status: "unhatched"
      }
    ]);
  });
});

function journeyDistanceHours(journey: {
  start: { latitude: number; longitude: number };
  speedMetersPerHour: number;
  target: { latitude: number; longitude: number };
}) {
  return distanceMeters(journey.start, journey.target) / journey.speedMetersPerHour;
}

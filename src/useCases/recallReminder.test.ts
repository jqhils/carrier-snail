import {
  createInitialCarrierState,
  InMemoryCarrierRepository,
  listInFlightReminders
} from "./localCarrierState";
import { createReminderJourney } from "./createReminderJourney";
import { recallReminder } from "./recallReminder";
import type { ArrivalPush, PushSender } from "./pushSender";

const target = {
  latitude: -33.8688,
  longitude: 151.2093
};

class FakePushSender implements PushSender {
  readonly arrivals: ArrivalPush[] = [];
  readonly cancellations: string[] = [];

  cancelArrival(reminderId: string): void {
    this.cancellations.push(reminderId);
  }

  sendArrival(push: ArrivalPush): void {
    this.arrivals.push(push);
  }
}

describe("recallReminder", () => {
  it("ends an in-flight reminder, cancels its arrival push, frees the snail, and grants no egg", async () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());
    const pushSender = new FakePushSender();
    const { reminder } = createReminderJourney(
      { text: "buy milk" },
      {
        clock: { now: () => 0 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );

    const result = await recallReminder(
      { reminderId: reminder.id },
      {
        clock: { now: () => 5000 },
        pushSender,
        repository
      }
    );
    const state = repository.snapshot();

    expect(result.recalledCount).toBe(1);
    expect(pushSender.cancellations).toEqual([reminder.id]);
    expect(pushSender.arrivals).toEqual([]);
    expect(state.reminders[0]).toMatchObject({
      recalledAtMs: 5000,
      status: "recalled"
    });
    expect(state.journeys[0]).toMatchObject({
      recalledAtMs: 5000,
      status: "recalled"
    });
    expect(state.snails[0]).toMatchObject({
      id: "garden-1",
      status: "resting"
    });
    expect(state.eggs).toEqual([]);
    expect(listInFlightReminders(state)).toEqual([]);
  });
});

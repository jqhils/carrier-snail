import { getCrawlFrame } from "../journey/snailCrawl";
import type { CarrierRepository, CarrierState } from "./localCarrierState";
import type { PushSender } from "./pushSender";
import type { Clock } from "./createReminderJourney";

export function completeArrivedJourneys({
  clock,
  pushSender,
  repository,
  timeWarpFactor = 1
}: {
  clock: Clock;
  pushSender: PushSender;
  repository: CarrierRepository;
  timeWarpFactor?: number;
}): { completedCount: number } {
  const nowMs = clock.now();
  const state = repository.snapshot();
  let completedCount = 0;

  const nextState: CarrierState = {
    journeys: state.journeys.map((journey) => {
      if (journey.status !== "in-flight") {
        return journey;
      }

      const frame = getCrawlFrame({
        journey,
        nowMs,
        timeWarpFactor
      });

      if (!frame.arrived) {
        return journey;
      }

      const reminder = state.reminders.find(({ id }) => id === journey.reminderId);

      if (!reminder || reminder.status !== "in-flight") {
        return journey;
      }

      completedCount += 1;
      pushSender.sendArrival({
        reminderId: reminder.id,
        text: reminder.text,
        title: "Carrier Snail arrived"
      });

      return {
        ...journey,
        arrivedAtMs: nowMs,
        status: "arrived"
      };
    }),
    reminders: state.reminders.map((reminder) =>
      state.journeys.some(
        (journey) =>
          journey.reminderId === reminder.id &&
          getCrawlFrame({ journey, nowMs, timeWarpFactor }).arrived &&
          journey.status === "in-flight" &&
          reminder.status === "in-flight"
      )
        ? {
            ...reminder,
            deliveredAtMs: nowMs,
            status: "delivered"
          }
        : reminder
    ),
    snails: state.snails.map((snail) =>
      state.journeys.some(
        (journey) =>
          journey.snailId === snail.id &&
          getCrawlFrame({ journey, nowMs, timeWarpFactor }).arrived &&
          journey.status === "in-flight"
      )
        ? { ...snail, status: "resting" }
        : snail
    )
  };

  if (completedCount > 0) {
    repository.save(nextState);
  }

  return { completedCount };
}

import { getCrawlFrame } from "../journey/snailCrawl";
import type { CarrierRepository, CarrierState, Egg } from "./localCarrierState";
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
  const completedReminderIds = new Set<string>();
  const completedSnailIds = new Set<string>();
  const earnedEggs: Egg[] = [];

  const journeys = state.journeys.map((journey) => {
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

    const todo = journey.todoId
      ? state.todos.find(({ id }) => id === journey.todoId)
      : undefined;
    const reminder = journey.reminderId
      ? state.reminders.find(({ id }) => id === journey.reminderId)
      : undefined;
    const delivery = todo
      ? todo.status === "open"
        ? { id: todo.id, text: todo.text }
        : undefined
      : reminder && reminder.status === "in-flight"
        ? { id: reminder.id, text: reminder.text }
        : undefined;

    if (!delivery) {
      return journey;
    }

    completedCount += 1;
    if (reminder) {
      completedReminderIds.add(reminder.id);
    }
    completedSnailIds.add(journey.snailId);
    earnedEggs.push(
      createEarnedEgg(state.eggs.length + earnedEggs.length + 1, nowMs)
    );
    pushSender.sendArrival({
      reminderId: delivery.id,
      text: delivery.text,
      title: "Carrier Snail arrived"
    });

    return {
      ...journey,
      arrivedAtMs: nowMs,
      status: "arrived" as const
    };
  });

  const nextState: CarrierState = {
    eggs: [...state.eggs, ...earnedEggs],
    inventory: state.inventory,
    journeys,
    onboarding: state.onboarding,
    purchases: state.purchases,
    reminders: state.reminders.map((reminder) =>
      completedReminderIds.has(reminder.id)
        ? {
            ...reminder,
            deliveredAtMs: nowMs,
            status: "delivered"
          }
        : reminder
    ),
    snails: state.snails.map((snail) =>
      completedSnailIds.has(snail.id)
        ? {
            ...snail,
            experiencePoints: snail.experiencePoints + 1,
            journeysCompleted: snail.journeysCompleted + 1,
            status: "resting"
          }
        : snail
    ),
    softCurrency: {
      slime: (state.softCurrency?.slime ?? 0) + completedCount
    },
    stableSlots: state.stableSlots,
    todos: state.todos
  };

  if (completedCount > 0) {
    repository.save(nextState);
  }

  return { completedCount };
}

function createEarnedEgg(sequence: number, earnedAtMs: number): Egg {
  return {
    earnedAtMs,
    id: `egg-${sequence}`,
    rarityPool: "earned-basic",
    source: "earned",
    status: "unhatched"
  };
}

import { computeServerJourneyEta } from "./computeServerJourneyEta";
import {
  cloneCarrierState,
  type CarrierState,
  type JourneyRecord,
  type Reminder,
  type Snail,
  type ToDo
} from "./localCarrierState";
import type { Clock } from "./createReminderJourney";
import type { PushSender } from "./pushSender";
import type { BackendCarrierRepository } from "./resolveAnonymousCarrierUser";

export interface ArrivalWorkerRepository extends BackendCarrierRepository {
  listUserIdsWithPendingJourneys(): Promise<string[]>;
}

export type ScheduledArrivalWorkerResult = {
  completedCount: number;
  evaluatedJourneyCount: number;
};

export async function runScheduledArrivalWorker({
  clock,
  pushSender,
  repository
}: {
  clock: Clock;
  pushSender: PushSender;
  repository: ArrivalWorkerRepository;
}): Promise<ScheduledArrivalWorkerResult> {
  const serverNowMs = clock.now();
  let completedCount = 0;
  let evaluatedJourneyCount = 0;

  for (const userId of await repository.listUserIdsWithPendingJourneys()) {
    const state = cloneCarrierState(await repository.loadCarrierState(userId));
    let changed = false;

    for (const journey of state.journeys) {
      if (journey.status !== "in-flight") {
        continue;
      }

      evaluatedJourneyCount += 1;

      const delivery = findDeliveryTarget(state, journey);

      if (!delivery) {
        continue;
      }

      const eta = computeServerJourneyEta({
        clock: { now: () => serverNowMs },
        journey
      });

      if (serverNowMs < eta.earliestArrivalAtMs) {
        continue;
      }

      await Promise.resolve(
        pushSender.sendArrival({
          reminderId: delivery.id,
          text: delivery.text,
          title: "Carrier Snail arrived"
        })
      );

      markJourneyDelivered({
        delivery,
        journey,
        nowMs: serverNowMs,
        snails: state.snails
      });
      state.eggs.push(createEarnedEgg(state.eggs.length + 1, serverNowMs));
      state.softCurrency.slime += 1;
      completedCount += 1;
      changed = true;
    }

    if (changed) {
      await repository.saveCarrierState(userId, state);
    }
  }

  return { completedCount, evaluatedJourneyCount };
}

type DeliveryTarget = {
  id: string;
  reminder?: Reminder;
  text: string;
  todo?: ToDo;
};

function findDeliveryTarget(
  state: CarrierState,
  journey: JourneyRecord
): DeliveryTarget | undefined {
  const todo = journey.todoId
    ? state.todos.find(
        (candidate) =>
          candidate.id === journey.todoId && candidate.status === "open"
      )
    : undefined;

  if (todo) {
    return {
      id: todo.id,
      text: todo.text,
      todo
    };
  }

  const reminder = journey.reminderId
    ? state.reminders.find(
        (candidate) =>
          candidate.id === journey.reminderId && candidate.status === "in-flight"
      )
    : undefined;

  return reminder
    ? {
        id: reminder.id,
        reminder,
        text: reminder.text
      }
    : undefined;
}

function markJourneyDelivered({
  delivery,
  journey,
  nowMs,
  snails
}: {
  delivery: DeliveryTarget;
  journey: JourneyRecord;
  nowMs: number;
  snails: Snail[];
}): void {
  journey.arrivedAtMs = nowMs;
  journey.status = "arrived";

  if (delivery.reminder) {
    delivery.reminder.deliveredAtMs = nowMs;
    delivery.reminder.status = "delivered";
  }

  const snail = snails.find(({ id }) => id === journey.snailId);

  if (snail) {
    snail.experiencePoints += 1;
    snail.journeysCompleted += 1;
    snail.status = "resting";
  }
}

function createEarnedEgg(sequence: number, earnedAtMs: number) {
  return {
    earnedAtMs,
    id: `egg-${sequence}`,
    rarityPool: "earned-basic" as const,
    source: "earned" as const,
    status: "unhatched" as const
  };
}

import { computeServerJourneyEta } from "./computeServerJourneyEta";
import {
  cloneCarrierState,
  type CarrierState,
  type JourneyRecord,
  type Reminder,
  type Snail
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

      const reminder = findInFlightReminder(state, journey);

      if (!reminder) {
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
          reminderId: reminder.id,
          text: reminder.text,
          title: "Carrier Snail arrived"
        })
      );

      markJourneyDelivered({
        journey,
        nowMs: serverNowMs,
        reminder,
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

function findInFlightReminder(
  state: CarrierState,
  journey: JourneyRecord
): Reminder | undefined {
  return state.reminders.find(
    (reminder) =>
      reminder.id === journey.reminderId && reminder.status === "in-flight"
  );
}

function markJourneyDelivered({
  journey,
  nowMs,
  reminder,
  snails
}: {
  journey: JourneyRecord;
  nowMs: number;
  reminder: Reminder;
  snails: Snail[];
}): void {
  journey.arrivedAtMs = nowMs;
  journey.status = "arrived";
  reminder.deliveredAtMs = nowMs;
  reminder.status = "delivered";

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

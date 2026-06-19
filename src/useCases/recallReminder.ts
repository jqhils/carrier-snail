import {
  cloneCarrierState,
  type CarrierRepository,
  type CarrierState
} from "./localCarrierState";
import type { Clock } from "./createReminderJourney";
import type { PushSender } from "./pushSender";

export type RecallReminderInput = {
  reminderId: string;
};

export type RecallReminderResult = {
  recalledCount: number;
};

export class ReminderNotRecallableError extends Error {
  constructor() {
    super("Only in-flight reminders can be recalled.");
    this.name = "ReminderNotRecallableError";
  }
}

export async function recallReminder(
  input: RecallReminderInput,
  {
    clock,
    pushSender,
    repository
  }: {
    clock: Clock;
    pushSender: PushSender;
    repository: CarrierRepository;
  }
): Promise<RecallReminderResult> {
  const nowMs = clock.now();
  const state = repository.snapshot();
  const reminder = state.reminders.find(
    (candidate) =>
      candidate.id === input.reminderId && candidate.status === "in-flight"
  );

  if (!reminder) {
    throw new ReminderNotRecallableError();
  }

  const journey = state.journeys.find(
    (candidate) =>
      candidate.reminderId === reminder.id && candidate.status === "in-flight"
  );

  if (!journey) {
    throw new ReminderNotRecallableError();
  }

  await Promise.resolve(pushSender.cancelArrival(reminder.id));

  repository.save(
    recallInState({
      journeyId: journey.id,
      nowMs,
      reminderId: reminder.id,
      state
    })
  );

  return { recalledCount: 1 };
}

function recallInState({
  journeyId,
  nowMs,
  reminderId,
  state
}: {
  journeyId: string;
  nowMs: number;
  reminderId: string;
  state: CarrierState;
}): CarrierState {
  const snapshot = cloneCarrierState(state);

  return {
    ...snapshot,
    journeys: snapshot.journeys.map((journey) =>
      journey.id === journeyId
        ? { ...journey, recalledAtMs: nowMs, status: "recalled" }
        : journey
    ),
    reminders: snapshot.reminders.map((reminder) =>
      reminder.id === reminderId
        ? { ...reminder, recalledAtMs: nowMs, status: "recalled" }
        : reminder
    ),
    snails: snapshot.snails.map((snail) =>
      snapshot.journeys.some(
        (journey) => journey.id === journeyId && journey.snailId === snail.id
      )
        ? { ...snail, status: "resting" }
        : snail
    )
  };
}

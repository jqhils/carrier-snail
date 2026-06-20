import type {
  ArrivalNotification,
  CarrierRepository,
  CarrierState,
  JourneyRecord
} from "./localCarrierState";
import type { Clock } from "./createReminderJourney";

export type ArrivalInboxItem = {
  arrivedAtMs: number;
  id: string;
  seen: boolean;
  snailName: string;
  text: string;
};

export function hasUnseenArrivals(state: CarrierState): boolean {
  return state.arrivals.some((arrival) => arrival.seenAtMs === undefined);
}

export function listArrivalInboxItems(
  state: CarrierState
): ArrivalInboxItem[] {
  return [...state.arrivals]
    .sort((left, right) => right.arrivedAtMs - left.arrivedAtMs)
    .map((arrival) => ({
      arrivedAtMs: arrival.arrivedAtMs,
      id: arrival.id,
      seen: arrival.seenAtMs !== undefined,
      snailName: arrival.snailName,
      text: arrival.text
    }));
}

export function markArrivalsSeen({
  clock,
  repository
}: {
  clock: Clock;
  repository: CarrierRepository;
}): { markedCount: number } {
  const state = repository.snapshot();
  const nowMs = clock.now();
  let markedCount = 0;
  const arrivals: ArrivalNotification[] = state.arrivals.map((arrival) => {
    if (arrival.seenAtMs !== undefined) {
      return arrival;
    }

    markedCount += 1;

    return {
      ...arrival,
      seenAtMs: nowMs
    };
  });

  if (markedCount > 0) {
    repository.save({
      ...state,
      arrivals
    });
  }

  return { markedCount };
}

export function createArrivalNotification({
  arrivedAtMs,
  journey,
  reminderId,
  sequence,
  snailName,
  text,
  todoId
}: {
  arrivedAtMs: number;
  journey: JourneyRecord;
  reminderId?: string;
  sequence: number;
  snailName: string;
  text: string;
  todoId?: string;
}): ArrivalNotification {
  const arrival: ArrivalNotification = {
    arrivedAtMs,
    id: `arrival-${sequence}`,
    journeyId: journey.id,
    snailId: journey.snailId,
    snailName,
    text
  };

  if (reminderId) {
    arrival.reminderId = reminderId;
  }

  if (todoId) {
    arrival.todoId = todoId;
  }

  return arrival;
}

import {
  createPhaseZeroJourney,
  type Coordinate
} from "../journey/snailCrawl";
import { coarsenCoordinate } from "../location/coarseLocation";
import type {
  CarrierRepository,
  JourneyRecord,
  Reminder
} from "./localCarrierState";

export type Clock = {
  now(): number;
};

export type LocationSource = {
  currentTarget(): Coordinate;
};

export type CreateReminderJourneyInput = {
  recurrence?: "daily" | "weekly" | "monthly";
  snailId?: string;
  text: string;
};

export class RecurringReminderRejectedError extends Error {
  constructor() {
    super("Recurring reminders are rejected by design.");
    this.name = "RecurringReminderRejectedError";
  }
}

export class EmptyReminderRejectedError extends Error {
  constructor() {
    super("Reminder text is required.");
    this.name = "EmptyReminderRejectedError";
  }
}

export class NoRestingSnailError extends Error {
  constructor() {
    super("No resting snail is available to carry this reminder.");
    this.name = "NoRestingSnailError";
  }
}

export function createReminderJourney(
  input: CreateReminderJourneyInput,
  {
    clock,
    locationSource,
    repository
  }: {
    clock: Clock;
    locationSource: LocationSource;
    repository: CarrierRepository;
  }
): { journey: JourneyRecord; reminder: Reminder } {
  if (input.recurrence) {
    throw new RecurringReminderRejectedError();
  }

  const text = input.text.trim();

  if (text.length === 0) {
    throw new EmptyReminderRejectedError();
  }

  const state = repository.snapshot();
  const snail = input.snailId
    ? state.snails.find(
        ({ id, status }) => id === input.snailId && status === "resting"
      )
    : state.snails.find(({ status }) => status === "resting");

  if (!snail) {
    throw new NoRestingSnailError();
  }

  const createdAtMs = clock.now();
  const baseJourney = createPhaseZeroJourney({
    createdAtMs,
    quirk: snail.quirk,
    quirkSeed: snail.quirkSeed,
    speedMetersPerHour: snail.baseSpeedMetersPerHour,
    target: coarsenCoordinate(locationSource.currentTarget())
  });
  const reminder: Reminder = {
    createdAtMs,
    id: `reminder-${state.reminders.length + 1}`,
    snailId: snail.id,
    status: "in-flight",
    text
  };
  const journey: JourneyRecord = {
    ...baseJourney,
    id: `journey-${state.journeys.length + 1}`,
    reminderId: reminder.id,
    snailId: snail.id,
    status: "in-flight",
    todoId: reminder.id
  };

  repository.save({
    arrivals: state.arrivals,
    eggs: state.eggs,
    inventory: state.inventory,
    journeys: [...state.journeys, journey],
    onboarding: state.onboarding,
    purchases: state.purchases,
    reminders: [...state.reminders, reminder],
    snails: state.snails.map((candidate) =>
      candidate.id === snail.id
        ? { ...candidate, status: "on-journey" }
        : candidate
    ),
    softCurrency: state.softCurrency,
    stableSlots: state.stableSlots,
    todos: state.todos
  });

  return { journey, reminder };
}

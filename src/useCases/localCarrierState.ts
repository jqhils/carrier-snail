import type { Coordinate, PhaseZeroJourney } from "../journey/snailCrawl";

export type SnailStatus = "resting" | "on-journey";
export type ReminderStatus = "in-flight" | "delivered";
export type JourneyStatus = "in-flight" | "arrived";

export type TrailHistoryPoint = {
  coordinate: Coordinate;
  recordedAtMs: number;
};

export type Snail = {
  id: string;
  name: string;
  status: SnailStatus;
};

export type Reminder = {
  createdAtMs: number;
  deliveredAtMs?: number;
  id: string;
  snailId: string;
  status: ReminderStatus;
  text: string;
};

export type JourneyRecord = PhaseZeroJourney & {
  arrivedAtMs?: number;
  id: string;
  reminderId: string;
  snailId: string;
  status: JourneyStatus;
  trailHistory?: TrailHistoryPoint[];
};

export type CarrierState = {
  journeys: JourneyRecord[];
  reminders: Reminder[];
  snails: Snail[];
};

export type InFlightReminderListItem = {
  reminderId: string;
  snailName: string;
  text: string;
};

export interface CarrierRepository {
  save(state: CarrierState): void;
  snapshot(): CarrierState;
}

export function createInitialCarrierState(): CarrierState {
  return {
    journeys: [],
    reminders: [],
    snails: [
      {
        id: "garden-1",
        name: "Garden Snail",
        status: "resting"
      }
    ]
  };
}

export class InMemoryCarrierRepository implements CarrierRepository {
  private state: CarrierState;

  constructor(initialState: CarrierState) {
    this.state = cloneCarrierState(initialState);
  }

  save(state: CarrierState): void {
    this.state = cloneCarrierState(state);
  }

  snapshot(): CarrierState {
    return cloneCarrierState(this.state);
  }
}

export function listInFlightReminders(
  state: CarrierState
): InFlightReminderListItem[] {
  return state.reminders
    .filter((reminder) => reminder.status === "in-flight")
    .map((reminder) => {
      const snail = state.snails.find(({ id }) => id === reminder.snailId);

      return {
        reminderId: reminder.id,
        snailName: snail?.name ?? "Unknown snail",
        text: reminder.text
      };
    });
}

export function getActiveJourney(state: CarrierState): JourneyRecord | undefined {
  return state.journeys.find((journey) => journey.status === "in-flight");
}

export function cloneCarrierState(state: CarrierState): CarrierState {
  return {
    journeys: state.journeys.map((journey) => ({
      ...journey,
      start: cloneCoordinate(journey.start),
      target: cloneCoordinate(journey.target),
      trailHistory: journey.trailHistory?.map((point) => ({
        coordinate: cloneCoordinate(point.coordinate),
        recordedAtMs: point.recordedAtMs
      }))
    })),
    reminders: state.reminders.map((reminder) => ({ ...reminder })),
    snails: state.snails.map((snail) => ({ ...snail }))
  };
}

function cloneCoordinate(coordinate: Coordinate): Coordinate {
  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude
  };
}

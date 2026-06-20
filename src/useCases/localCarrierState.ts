import {
  BASE_SNAIL_SPEED_METERS_PER_HOUR,
  type Coordinate,
  type JourneyQuirk,
  type PhaseZeroJourney
} from "../journey/snailCrawl";

export type SnailStatus = "resting" | "on-journey";
export type ReminderStatus = "in-flight" | "delivered" | "recalled";
export type ToDoStatus = "open" | "done";
export type JourneyStatus = "in-flight" | "arrived" | "recalled";
export type EggSource = "earned" | "purchased";
export type EggRarityPool = "earned-basic" | "paid-premium";
export type EggStatus = "unhatched" | "hatched";
export type SnailRarity = "common" | "uncommon" | "rare" | "mythic" | "cursed";
export type SnailSpeedBand = "garden" | "steady" | "swift" | "mythic";
export type SnailTemperament = "steady" | "sleepy" | "wanderer" | "cursed";
export type CosmeticId = "trail-sparkle";
export type PurchaseProductId =
  | "egg-pack-small"
  | "cosmetic-trail-sparkle"
  | "stable-slot-single";

export type TrailHistoryPoint = {
  coordinate: Coordinate;
  recordedAtMs: number;
};

export type SnailAppearanceTraits = {
  bodyColor: string;
  shellColor: string;
};

export type SnailTrailTraits = {
  color: string;
  persistenceMs: number;
  texture: "glistening" | "sparkling" | "misty" | "inky";
};

export type SoftCurrencyBalance = {
  slime: number;
};

export type CosmeticInventoryItem = {
  acquiredAtMs: number;
  id: CosmeticId;
  name: string;
  source: "purchased";
};

export type Inventory = {
  cosmetics: CosmeticInventoryItem[];
};

export type PurchaseRecord = {
  id: string;
  productId: PurchaseProductId;
  purchasedAtMs: number;
};

export type StableSlots = {
  purchased: number;
};

export type OnboardingState = {
  completedAtMs?: number;
};

export type Snail = {
  appearance: SnailAppearanceTraits;
  baseSpeedMetersPerHour: number;
  experiencePoints: number;
  id: string;
  journeysCompleted: number;
  level: number;
  name: string;
  quirk: JourneyQuirk;
  quirkSeed: string;
  rarity: SnailRarity;
  reliability: number;
  speedBand: SnailSpeedBand;
  status: SnailStatus;
  temperament: SnailTemperament;
  trail: SnailTrailTraits;
};

export type Reminder = {
  createdAtMs: number;
  deliveredAtMs?: number;
  id: string;
  recalledAtMs?: number;
  snailId: string;
  status: ReminderStatus;
  text: string;
};

export type ToDo = {
  createdAtMs: number;
  doneAtMs?: number;
  id: string;
  status: ToDoStatus;
  text: string;
};

export type JourneyRecord = PhaseZeroJourney & {
  arrivedAtMs?: number;
  id: string;
  recalledAtMs?: number;
  reminderId?: string;
  snailId: string;
  status: JourneyStatus;
  todoId?: string;
  trailHistory?: TrailHistoryPoint[];
};

export type Egg = {
  earnedAtMs: number;
  hatchedAtMs?: number;
  hatchedSnailId?: string;
  id: string;
  rarityPool: EggRarityPool;
  source: EggSource;
  status: EggStatus;
};

export type CarrierState = {
  eggs: Egg[];
  inventory: Inventory;
  journeys: JourneyRecord[];
  onboarding: OnboardingState;
  purchases: PurchaseRecord[];
  reminders: Reminder[];
  snails: Snail[];
  softCurrency: SoftCurrencyBalance;
  stableSlots: StableSlots;
  todos: ToDo[];
};

export type InFlightReminderListItem = {
  reminderId: string;
  snailName: string;
  text: string;
};

export type StableSnailListItem = {
  carryingText?: string;
  id: string;
  name: string;
  status: SnailStatus;
  statusLabel: string;
};

export type StableCapacity = {
  busyCount: number;
  emptySlotCount: number;
  freeCount: number;
  totalCount: number;
};

export type StableSnapshot = {
  capacity: StableCapacity;
  snails: StableSnailListItem[];
};

export interface CarrierRepository {
  save(state: CarrierState): void;
  snapshot(): CarrierState;
}

export function createStarterGardenSnail(): Snail {
  return {
    appearance: {
      bodyColor: "#d99f5f",
      shellColor: "#7b4b34"
    },
    baseSpeedMetersPerHour: BASE_SNAIL_SPEED_METERS_PER_HOUR,
    experiencePoints: 0,
    id: "garden-1",
    journeysCompleted: 0,
    level: 1,
    name: "Garden Snail",
    quirk: "none",
    quirkSeed: "starter-garden-1",
    rarity: "common",
    reliability: 0.95,
    speedBand: "garden",
    status: "resting",
    temperament: "steady",
    trail: {
      color: "#f5f8ed",
      persistenceMs: 72 * 60 * 60 * 1000,
      texture: "glistening"
    }
  };
}

export function createInitialCarrierState(): CarrierState {
  return {
    eggs: [],
    inventory: { cosmetics: [] },
    journeys: [],
    onboarding: {},
    purchases: [],
    reminders: [],
    snails: [createStarterGardenSnail()],
    softCurrency: { slime: 0 },
    stableSlots: { purchased: 0 },
    todos: []
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
  const fromTodos = state.journeys
    .filter((journey) => journey.status === "in-flight")
    .flatMap((journey) => {
      const todo = state.todos.find(({ id }) => id === journey.todoId);

      if (!todo || todo.status === "done") {
        return [];
      }

      const snail = state.snails.find(({ id }) => id === journey.snailId);

      return [{
        reminderId: todo.id,
        snailName: snail?.name ?? "Unknown snail",
        text: todo.text
      }];
    });

  if (fromTodos.length > 0 || state.todos.length > 0) {
    return fromTodos;
  }

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

export function listStableSnails(state: CarrierState): StableSnapshot {
  const snails = state.snails.map((snail) => ({
    ...stableCarryingDetails(state, snail.id),
    id: snail.id,
    name: snail.name,
    status: snail.status,
    statusLabel: snail.status === "resting" ? "Resting" : "On journey"
  }));

  const freeCount = snails.filter(({ status }) => status === "resting").length;
  const emptySlotCount = state.stableSlots?.purchased ?? 0;

  return {
    capacity: {
      busyCount: snails.length - freeCount,
      emptySlotCount,
      freeCount,
      totalCount: snails.length + emptySlotCount
    },
    snails
  };
}

function stableCarryingDetails(
  state: CarrierState,
  snailId: string
): Pick<StableSnailListItem, "carryingText"> {
  const journey = state.journeys.find(
    (candidate) =>
      candidate.snailId === snailId && candidate.status === "in-flight"
  );
  const todo = journey
    ? state.todos.find((candidate) => candidate.id === journey.todoId)
    : undefined;

  if (todo && todo.status === "open") {
    return { carryingText: todo.text };
  }

  const reminder = state.reminders.find(
    (candidate) =>
      candidate.snailId === snailId && candidate.status === "in-flight"
  );

  return reminder ? { carryingText: reminder.text } : {};
}

export function getActiveJourney(state: CarrierState): JourneyRecord | undefined {
  return state.journeys.find((journey) => journey.status === "in-flight");
}

export function cloneCarrierState(state: CarrierState): CarrierState {
  return {
    eggs: state.eggs?.map((egg) => ({ ...egg })) ?? [],
    inventory: {
      cosmetics:
        state.inventory?.cosmetics.map((cosmetic) => ({ ...cosmetic })) ?? []
    },
    journeys: state.journeys.map((journey) => ({
      ...journey,
      start: cloneCoordinate(journey.start),
      target: cloneCoordinate(journey.target),
      trailHistory: journey.trailHistory?.map((point) => ({
        coordinate: cloneCoordinate(point.coordinate),
        recordedAtMs: point.recordedAtMs
      }))
    })),
    onboarding: {
      completedAtMs: state.onboarding?.completedAtMs
    },
    purchases: state.purchases?.map((purchase) => ({ ...purchase })) ?? [],
    reminders: state.reminders.map((reminder) => ({ ...reminder })),
    snails: state.snails.map((snail) => ({
      ...snail,
      appearance: { ...snail.appearance },
      trail: { ...snail.trail }
    })),
    softCurrency: {
      slime: state.softCurrency?.slime ?? 0
    },
    stableSlots: {
      purchased: state.stableSlots?.purchased ?? 0
    },
    todos: state.todos?.map((todo) => ({ ...todo })) ?? []
  };
}

function cloneCoordinate(coordinate: Coordinate): Coordinate {
  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude
  };
}

import { createPhaseZeroJourney } from "../journey/snailCrawl";
import { coarsenCoordinate } from "../location/coarseLocation";
import { computeServerJourneyEta } from "./computeServerJourneyEta";
import type { Clock, LocationSource } from "./createReminderJourney";
import type {
  CarrierRepository,
  CarrierState,
  JourneyRecord,
  Snail,
  ToDo
} from "./localCarrierState";
import type { PushSender } from "./pushSender";

export type ToDoDisplayStatus = "open" | "in-transit" | "arrived" | "done";

export type ToDoListItem = {
  activeJourneyId?: string;
  etaCopy?: string;
  id: string;
  snailName?: string;
  status: ToDoDisplayStatus;
  statusLabel: string;
  text: string;
};

export class EmptyToDoRejectedError extends Error {
  constructor() {
    super("To-do text is required.");
    this.name = "EmptyToDoRejectedError";
  }
}

export class ToDoNotFoundError extends Error {
  constructor() {
    super("That to-do was not found.");
    this.name = "ToDoNotFoundError";
  }
}

export class ToDoAlreadyDoneError extends Error {
  constructor() {
    super("Done to-dos cannot be assigned to a snail.");
    this.name = "ToDoAlreadyDoneError";
  }
}

export class ToDoAlreadyInTransitError extends Error {
  constructor() {
    super("That to-do already has a snail on the trail.");
    this.name = "ToDoAlreadyInTransitError";
  }
}

export class NoRestingSnailError extends Error {
  constructor() {
    super("No resting snail is available.");
    this.name = "NoRestingSnailError";
  }
}

export class ToDoNotAssignedError extends Error {
  constructor() {
    super("That to-do does not have an active snail to recall.");
    this.name = "ToDoNotAssignedError";
  }
}

export function createToDo(
  input: { text: string },
  {
    clock,
    repository
  }: {
    clock: Clock;
    repository: CarrierRepository;
  }
): { todo: ToDo } {
  const text = input.text.trim();

  if (text.length === 0) {
    throw new EmptyToDoRejectedError();
  }

  const state = repository.snapshot();
  const todo: ToDo = {
    createdAtMs: clock.now(),
    id: `todo-${state.todos.length + 1}`,
    status: "open",
    text
  };

  repository.save({
    ...state,
    todos: [...state.todos, todo]
  });

  return { todo };
}

export function assignSnailToToDo(
  input: { snailId?: string; todoId: string },
  {
    clock,
    locationSource,
    repository
  }: {
    clock: Clock;
    locationSource: LocationSource;
    repository: CarrierRepository;
  }
): { journey: JourneyRecord; todo: ToDo } {
  const state = repository.snapshot();
  const todo = findToDo(state, input.todoId);

  if (todo.status === "done") {
    throw new ToDoAlreadyDoneError();
  }

  if (findActiveJourneyForToDo(state, todo.id)) {
    throw new ToDoAlreadyInTransitError();
  }

  const snail = findRestingSnail(state, input.snailId);

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
  const journey: JourneyRecord = {
    ...baseJourney,
    id: `journey-${state.journeys.length + 1}`,
    snailId: snail.id,
    status: "in-flight",
    todoId: todo.id
  };

  repository.save({
    ...state,
    journeys: [...state.journeys, journey],
    snails: state.snails.map((candidate) =>
      candidate.id === snail.id
        ? { ...candidate, status: "on-journey" }
        : candidate
    )
  });

  return { journey, todo };
}

export async function unassignSnail(
  input: { todoId: string },
  {
    clock,
    pushSender,
    repository
  }: {
    clock: Clock;
    pushSender: PushSender;
    repository: CarrierRepository;
  }
): Promise<{ recalledCount: number }> {
  const state = repository.snapshot();
  findToDo(state, input.todoId);
  const journey = findActiveJourneyForToDo(state, input.todoId);

  if (!journey) {
    throw new ToDoNotAssignedError();
  }

  await Promise.resolve(pushSender.cancelArrival(input.todoId));
  repository.save(recallJourneyInState(state, journey, clock.now()));

  return { recalledCount: 1 };
}

export async function completeToDo(
  input: { todoId: string },
  {
    clock,
    pushSender,
    repository
  }: {
    clock: Clock;
    pushSender: PushSender;
    repository: CarrierRepository;
  }
): Promise<{ completedCount: number }> {
  const state = repository.snapshot();
  const todo = findToDo(state, input.todoId);

  if (todo.status === "done") {
    return { completedCount: 0 };
  }

  const activeJourney = findActiveJourneyForToDo(state, todo.id);
  let nextState = state;

  if (activeJourney) {
    await Promise.resolve(pushSender.cancelArrival(todo.id));
    nextState = recallJourneyInState(state, activeJourney, clock.now());
  }

  repository.save({
    ...nextState,
    todos: nextState.todos.map((candidate) =>
      candidate.id === todo.id
        ? { ...candidate, doneAtMs: clock.now(), status: "done" }
        : candidate
    )
  });

  return { completedCount: 1 };
}

export async function deleteToDo(
  input: { todoId: string },
  {
    clock,
    pushSender,
    repository
  }: {
    clock: Clock;
    pushSender: PushSender;
    repository: CarrierRepository;
  }
): Promise<{ deletedCount: number }> {
  const state = repository.snapshot();
  findToDo(state, input.todoId);
  const activeJourney = findActiveJourneyForToDo(state, input.todoId);
  const nowMs = clock.now();
  let nextState = state;

  if (activeJourney) {
    await Promise.resolve(pushSender.cancelArrival(input.todoId));
    nextState = recallJourneyInState(state, activeJourney, nowMs);
  }

  repository.save({
    ...nextState,
    journeys: nextState.journeys.map((journey) =>
      journey.todoId === input.todoId ? { ...journey, todoId: undefined } : journey
    ),
    todos: nextState.todos.filter((todo) => todo.id !== input.todoId)
  });

  return { deletedCount: 1 };
}

export function updateToDo(
  input: { text: string; todoId: string },
  { repository }: { repository: CarrierRepository }
): { todo: ToDo } {
  const text = input.text.trim();

  if (text.length === 0) {
    throw new EmptyToDoRejectedError();
  }

  const state = repository.snapshot();
  const todo = findToDo(state, input.todoId);
  const nextTodo = { ...todo, text };

  repository.save({
    ...state,
    todos: state.todos.map((candidate) =>
      candidate.id === todo.id ? nextTodo : candidate
    )
  });

  return { todo: nextTodo };
}

export function listToDoItems({
  clock,
  state
}: {
  clock: Clock;
  state: CarrierState;
}): ToDoListItem[] {
  return state.todos.map((todo) => {
    if (todo.status === "done") {
      return {
        id: todo.id,
        status: "done",
        statusLabel: "Done",
        text: todo.text
      };
    }

    const activeJourney = findActiveJourneyForToDo(state, todo.id);

    if (activeJourney) {
      const snail = state.snails.find(({ id }) => id === activeJourney.snailId);
      const eta = computeServerJourneyEta({
        clock,
        journey: activeJourney
      });

      return {
        activeJourneyId: activeJourney.id,
        etaCopy: `No sooner than ${formatRemaining(eta.remainingMs)}`,
        id: todo.id,
        snailName: snail?.name ?? "Unknown snail",
        status: "in-transit",
        statusLabel: "Carrying",
        text: todo.text
      };
    }

    const arrivedJourney = [...state.journeys]
      .reverse()
      .find(
        (journey) => journey.todoId === todo.id && journey.status === "arrived"
      );

    if (arrivedJourney) {
      const snail = state.snails.find(({ id }) => id === arrivedJourney.snailId);

      return {
        id: todo.id,
        snailName: snail?.name ?? "Unknown snail",
        status: "arrived",
        statusLabel: "Arrived",
        text: todo.text
      };
    }

    return {
      id: todo.id,
      status: "open",
      statusLabel: "Open",
      text: todo.text
    };
  });
}

function findToDo(state: CarrierState, todoId: string): ToDo {
  const todo = state.todos.find((candidate) => candidate.id === todoId);

  if (!todo) {
    throw new ToDoNotFoundError();
  }

  return todo;
}

function findRestingSnail(
  state: CarrierState,
  snailId: string | undefined
): Snail | undefined {
  return snailId
    ? state.snails.find(
        ({ id, status }) => id === snailId && status === "resting"
      )
    : state.snails.find(({ status }) => status === "resting");
}

function findActiveJourneyForToDo(
  state: CarrierState,
  todoId: string
): JourneyRecord | undefined {
  return state.journeys.find(
    (journey) => journey.todoId === todoId && journey.status === "in-flight"
  );
}

function recallJourneyInState(
  state: CarrierState,
  journey: JourneyRecord,
  nowMs: number
): CarrierState {
  return {
    ...state,
    journeys: state.journeys.map((candidate) =>
      candidate.id === journey.id
        ? { ...candidate, recalledAtMs: nowMs, status: "recalled" }
        : candidate
    ),
    snails: state.snails.map((snail) =>
      snail.id === journey.snailId ? { ...snail, status: "resting" } : snail
    )
  };
}

function formatRemaining(remainingMs: number): string {
  const remainingHours = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));

  if (remainingHours < 48) {
    return `${remainingHours}h`;
  }

  return `${Math.ceil(remainingHours / 24)}d`;
}

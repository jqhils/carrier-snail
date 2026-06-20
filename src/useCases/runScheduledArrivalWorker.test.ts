import { computeServerJourneyEta } from "./computeServerJourneyEta";
import { createReminderJourney } from "./createReminderJourney";
import {
  cloneCarrierState,
  createInitialCarrierState,
  InMemoryCarrierRepository,
  type CarrierState
} from "./localCarrierState";
import type { ArrivalPush, PushSender } from "./pushSender";
import {
  type ArrivalWorkerRepository,
  runScheduledArrivalWorker
} from "./runScheduledArrivalWorker";
import { assignSnailToToDo, createToDo } from "./todoUseCases";

const target = {
  latitude: -33.8688,
  longitude: 151.2093
};

class FakeArrivalWorkerRepository implements ArrivalWorkerRepository {
  constructor(private readonly states: Record<string, CarrierState>) {}

  async ensureUser(): Promise<never> {
    throw new Error("Not needed for this test.");
  }

  async listUserIdsWithPendingJourneys(): Promise<string[]> {
    return Object.entries(this.states)
      .filter(([, state]) =>
        state.journeys.some((journey) => journey.status === "in-flight")
      )
      .map(([userId]) => userId);
  }

  async loadCarrierState(userId: string): Promise<CarrierState> {
    return cloneCarrierState(this.states[userId] ?? createInitialCarrierState());
  }

  async saveCarrierState(userId: string, state: CarrierState): Promise<void> {
    this.states[userId] = cloneCarrierState(state);
  }

  snapshot(userId: string): CarrierState {
    return cloneCarrierState(this.states[userId] ?? createInitialCarrierState());
  }
}

class FakePushSender implements PushSender {
  readonly arrivals: ArrivalPush[] = [];

  cancelArrival(): void {
    // Not needed for scheduled completion tests.
  }

  sendArrival(push: ArrivalPush): void {
    this.arrivals.push(push);
  }
}

describe("runScheduledArrivalWorker", () => {
  it("does not send arrival push before the clamped ETA", async () => {
    const state = createBackendJourneyState("buy milk");
    const repository = new FakeArrivalWorkerRepository({
      "carrier-user-1": state
    });
    const pushSender = new FakePushSender();

    const result = await runScheduledArrivalWorker({
      clock: { now: () => 24 * 60 * 60 * 1000 },
      pushSender,
      repository
    });

    expect(result.completedCount).toBe(0);
    expect(pushSender.arrivals).toEqual([]);
    expect(repository.snapshot("carrier-user-1").journeys[0].status).toBe(
      "in-flight"
    );
  });

  it("sends exactly one arrival push at the clamped ETA and persists completion", async () => {
    const state = createBackendJourneyState("check passport");
    const repository = new FakeArrivalWorkerRepository({
      "carrier-user-1": state
    });
    const pushSender = new FakePushSender();
    const journey = state.journeys[0];
    const eta = computeServerJourneyEta({
      clock: { now: () => 0 },
      journey
    });

    const first = await runScheduledArrivalWorker({
      clock: { now: () => eta.earliestArrivalAtMs },
      pushSender,
      repository
    });
    const second = await runScheduledArrivalWorker({
      clock: { now: () => eta.earliestArrivalAtMs + 1000 },
      pushSender,
      repository
    });
    const completed = repository.snapshot("carrier-user-1");

    expect(first.completedCount).toBe(1);
    expect(second.completedCount).toBe(0);
    expect(pushSender.arrivals).toEqual([
      {
        reminderId: "reminder-1",
        text: "check passport",
        title: "Carrier Snail arrived"
      }
    ]);
    expect(completed.journeys[0]).toMatchObject({
      arrivedAtMs: eta.earliestArrivalAtMs,
      status: "arrived"
    });
    expect(completed.reminders[0]).toMatchObject({
      deliveredAtMs: eta.earliestArrivalAtMs,
      status: "delivered"
    });
    expect(completed.snails[0]).toMatchObject({
      experiencePoints: 1,
      id: "garden-1",
      journeysCompleted: 1,
      status: "resting"
    });
    expect(completed.softCurrency).toEqual({ slime: 1 });
    expect(completed.eggs).toEqual([
      {
        earnedAtMs: eta.earliestArrivalAtMs,
        id: "egg-1",
        rarityPool: "earned-basic",
        source: "earned",
        status: "unhatched"
      }
    ]);
  });

  it("delivers a to-do journey while keeping the to-do open", async () => {
    const state = createBackendTodoJourneyState("check passport");
    const repository = new FakeArrivalWorkerRepository({
      "carrier-user-1": state
    });
    const pushSender = new FakePushSender();
    const journey = state.journeys[0];
    const eta = computeServerJourneyEta({
      clock: { now: () => 0 },
      journey
    });

    const result = await runScheduledArrivalWorker({
      clock: { now: () => eta.earliestArrivalAtMs },
      pushSender,
      repository
    });
    const completed = repository.snapshot("carrier-user-1");

    expect(result.completedCount).toBe(1);
    expect(pushSender.arrivals).toEqual([
      {
        reminderId: "todo-1",
        text: "check passport",
        title: "Carrier Snail arrived"
      }
    ]);
    expect(completed.todos[0]).toMatchObject({
      id: "todo-1",
      status: "open"
    });
    expect(completed.arrivals).toEqual([
      {
        arrivedAtMs: eta.earliestArrivalAtMs,
        id: "arrival-1",
        journeyId: "journey-1",
        snailId: "garden-1",
        snailName: "Garden Snail",
        text: "check passport",
        todoId: "todo-1"
      }
    ]);
    expect(completed.journeys[0]).toMatchObject({
      arrivedAtMs: eta.earliestArrivalAtMs,
      status: "arrived",
      todoId: "todo-1"
    });
    expect(completed.snails[0].status).toBe("resting");
  });
});

function createBackendJourneyState(text: string): CarrierState {
  const repository = new InMemoryCarrierRepository(createInitialCarrierState());

  createReminderJourney(
    { text },
    {
      clock: { now: () => 0 },
      locationSource: { currentTarget: () => target },
      repository
    }
  );

  return repository.snapshot();
}

function createBackendTodoJourneyState(text: string): CarrierState {
  const repository = new InMemoryCarrierRepository(createInitialCarrierState());
  const { todo } = createToDo(
    { text },
    {
      clock: { now: () => 0 },
      repository
    }
  );

  assignSnailToToDo(
    { snailId: "garden-1", todoId: todo.id },
    {
      clock: { now: () => 0 },
      locationSource: { currentTarget: () => target },
      repository
    }
  );

  return repository.snapshot();
}

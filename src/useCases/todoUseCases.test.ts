import { distanceMeters } from "../journey/snailCrawl";
import {
  createInitialCarrierState,
  InMemoryCarrierRepository,
  listStableSnails
} from "./localCarrierState";
import { completeArrivedJourneys } from "./completeArrivedJourneys";
import type { ArrivalPush, PushSender } from "./pushSender";
import {
  assignSnailToToDo,
  completeToDo,
  createToDo,
  deleteToDo,
  listToDoItems,
  NoRestingSnailError,
  unassignSnail,
  updateToDo
} from "./todoUseCases";

const target = {
  latitude: -33.8688,
  longitude: 151.2093
};

class FakePushSender implements PushSender {
  readonly arrivals: ArrivalPush[] = [];
  readonly cancellations: string[] = [];

  cancelArrival(reminderId: string): void {
    this.cancellations.push(reminderId);
  }

  sendArrival(push: ArrivalPush): void {
    this.arrivals.push(push);
  }
}

describe("to-do use-cases", () => {
  it("creates limitless open to-dos without assigning a snail", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());

    const first = createToDo(
      { text: "buy milk" },
      { clock: { now: () => 1000 }, repository }
    );
    const second = createToDo(
      { text: "check passport" },
      { clock: { now: () => 2000 }, repository }
    );
    const state = repository.snapshot();

    expect(first.todo).toMatchObject({
      createdAtMs: 1000,
      id: "todo-1",
      status: "open",
      text: "buy milk"
    });
    expect(second.todo.id).toBe("todo-2");
    expect(state.todos).toHaveLength(2);
    expect(state.journeys).toEqual([]);
    expect(state.snails[0]).toMatchObject({
      id: "garden-1",
      status: "resting"
    });
  });

  it("assigns an idle snail to a to-do and derives in-transit display state", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());
    const { todo } = createToDo(
      { text: "water fern" },
      { clock: { now: () => 0 }, repository }
    );

    const result = assignSnailToToDo(
      { snailId: "garden-1", todoId: todo.id },
      {
        clock: { now: () => 1000 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );
    const state = repository.snapshot();
    const items = listToDoItems({
      clock: { now: () => 1000 },
      state
    });

    expect(result.journey.todoId).toBe(todo.id);
    expect(distanceMeters(result.journey.start, result.journey.target)).toBeGreaterThan(
      7900
    );
    expect(state.todos[0]).toMatchObject({
      id: todo.id,
      status: "open"
    });
    expect(state.snails[0].status).toBe("on-journey");
    expect(items).toEqual([
      expect.objectContaining({
        id: todo.id,
        snailName: "Garden Snail",
        snailSpeciesId: "garden",
        status: "in-transit",
        text: "water fern"
      })
    ]);
  });

  it("keeps to-dos limitless while guarding assignment by idle snails", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());
    const first = createToDo(
      { text: "buy milk" },
      { clock: { now: () => 0 }, repository }
    ).todo;
    const second = createToDo(
      { text: "check passport" },
      { clock: { now: () => 1 }, repository }
    ).todo;

    assignSnailToToDo(
      { todoId: first.id },
      {
        clock: { now: () => 2 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );

    expect(() =>
      assignSnailToToDo(
        { todoId: second.id },
        {
          clock: { now: () => 3 },
          locationSource: { currentTarget: () => target },
          repository
        }
      )
    ).toThrow(NoRestingSnailError);
    expect(repository.snapshot().todos).toHaveLength(2);
  });

  it("recalls by freeing the snail while keeping the to-do open", async () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());
    const pushSender = new FakePushSender();
    const { todo } = createToDo(
      { text: "mail the tiny letter" },
      { clock: { now: () => 0 }, repository }
    );
    assignSnailToToDo(
      { todoId: todo.id },
      {
        clock: { now: () => 10 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );

    await unassignSnail(
      { todoId: todo.id },
      {
        clock: { now: () => 20 },
        pushSender,
        repository
      }
    );
    const state = repository.snapshot();

    expect(pushSender.cancellations).toEqual([todo.id]);
    expect(state.todos[0]).toMatchObject({
      id: todo.id,
      status: "open"
    });
    expect(state.journeys[0]).toMatchObject({
      recalledAtMs: 20,
      status: "recalled"
    });
    expect(listStableSnails(state).capacity.freeCount).toBe(1);
  });

  it("completes any to-do and frees an active snail without delivering", async () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());
    const pushSender = new FakePushSender();
    const { todo } = createToDo(
      { text: "buy milk" },
      { clock: { now: () => 0 }, repository }
    );
    assignSnailToToDo(
      { todoId: todo.id },
      {
        clock: { now: () => 10 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );

    await completeToDo(
      { todoId: todo.id },
      {
        clock: { now: () => 30 },
        pushSender,
        repository
      }
    );
    const state = repository.snapshot();

    expect(pushSender.arrivals).toEqual([]);
    expect(pushSender.cancellations).toEqual([todo.id]);
    expect(state.todos[0]).toMatchObject({
      doneAtMs: 30,
      status: "done"
    });
    expect(state.journeys[0].status).toBe("recalled");
    expect(state.snails[0].status).toBe("resting");
  });

  it("deletes a to-do separately from recall", async () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());
    const pushSender = new FakePushSender();
    const { todo } = createToDo(
      { text: "trim basil" },
      { clock: { now: () => 0 }, repository }
    );

    await deleteToDo(
      { todoId: todo.id },
      {
        clock: { now: () => 40 },
        pushSender,
        repository
      }
    );

    expect(repository.snapshot().todos).toEqual([]);
    expect(pushSender.cancellations).toEqual([]);
  });

  it("deletes a carried to-do by recalling the snail and clearing the journey link", async () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());
    const pushSender = new FakePushSender();
    const { todo } = createToDo(
      { text: "trim basil" },
      { clock: { now: () => 0 }, repository }
    );
    assignSnailToToDo(
      { todoId: todo.id },
      {
        clock: { now: () => 10 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );

    await deleteToDo(
      { todoId: todo.id },
      {
        clock: { now: () => 40 },
        pushSender,
        repository
      }
    );
    const state = repository.snapshot();

    expect(pushSender.cancellations).toEqual([todo.id]);
    expect(state.todos).toEqual([]);
    expect(state.journeys[0]).toMatchObject({
      recalledAtMs: 40,
      status: "recalled"
    });
    expect(state.journeys[0].todoId).toBeUndefined();
    expect(state.snails[0].status).toBe("resting");
  });

  it("edits an open to-do without changing its journey assignment", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());
    const { todo } = createToDo(
      { text: "buy milk" },
      { clock: { now: () => 0 }, repository }
    );
    assignSnailToToDo(
      { todoId: todo.id },
      {
        clock: { now: () => 10 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );

    updateToDo({ text: "buy oat milk", todoId: todo.id }, { repository });
    const state = repository.snapshot();

    expect(state.todos[0].text).toBe("buy oat milk");
    expect(state.journeys[0]).toMatchObject({
      status: "in-flight",
      todoId: todo.id
    });
  });

  it("allows re-sending an arrived open to-do", () => {
    const initialState = createInitialCarrierState();
    initialState.snails.push({
      ...initialState.snails[0],
      id: "garden-2",
      name: "Second Garden",
      status: "resting"
    });
    const repository = new InMemoryCarrierRepository(initialState);
    const { todo } = createToDo(
      { text: "return library book" },
      { clock: { now: () => 0 }, repository }
    );
    const first = assignSnailToToDo(
      { snailId: "garden-1", todoId: todo.id },
      {
        clock: { now: () => 1 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );
    const state = repository.snapshot();
    state.journeys[0] = {
      ...state.journeys[0],
      arrivedAtMs: 100,
      status: "arrived"
    };
    state.snails[0] = { ...state.snails[0], status: "resting" };
    repository.save(state);

    const second = assignSnailToToDo(
      { snailId: "garden-2", todoId: todo.id },
      {
        clock: { now: () => 200 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );

    expect(first.journey.id).toBe("journey-1");
    expect(second.journey.id).toBe("journey-2");
    expect(repository.snapshot().todos[0].status).toBe("open");
  });

  it("keeps an arrived to-do open until manual completion", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());
    const pushSender = new FakePushSender();
    const { todo } = createToDo(
      { text: "check passport" },
      { clock: { now: () => 0 }, repository }
    );
    const { journey } = assignSnailToToDo(
      { todoId: todo.id },
      {
        clock: { now: () => 0 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );
    const arrivalMs =
      (distanceMeters(journey.start, journey.target) /
        journey.speedMetersPerHour +
        1) *
      60 *
      60 *
      1000;

    completeArrivedJourneys({
      clock: { now: () => arrivalMs },
      pushSender,
      repository
    });
    const state = repository.snapshot();
    const [item] = listToDoItems({
      clock: { now: () => arrivalMs },
      state
    });

    expect(pushSender.arrivals).toEqual([
      {
        reminderId: todo.id,
        text: "check passport",
        title: "Carrier Snail arrived"
      }
    ]);
    expect(state.todos[0]).toMatchObject({
      id: todo.id,
      status: "open"
    });
    expect(item).toMatchObject({
      id: todo.id,
      status: "arrived"
    });
    expect(state.snails[0].status).toBe("resting");
  });
});

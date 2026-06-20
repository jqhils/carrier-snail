import {
  createInitialCarrierState,
  InMemoryCarrierRepository
} from "./localCarrierState";
import {
  hasUnseenArrivals,
  listArrivalInboxItems,
  markArrivalsSeen
} from "./arrivalInboxUseCases";

describe("arrival inbox use-cases", () => {
  it("lists arrivals newest first and reports unseen state", () => {
    const state = createInitialCarrierState();

    state.arrivals = [
      {
        arrivedAtMs: 1000,
        id: "arrival-1",
        journeyId: "journey-1",
        seenAtMs: 1500,
        snailId: "garden-1",
        snailName: "Garden Snail",
        text: "buy milk",
        todoId: "todo-1"
      },
      {
        arrivedAtMs: 3000,
        id: "arrival-2",
        journeyId: "journey-2",
        snailId: "garden-2",
        snailName: "Second Garden",
        text: "check passport",
        todoId: "todo-2"
      }
    ];

    expect(hasUnseenArrivals(state)).toBe(true);
    expect(listArrivalInboxItems(state)).toEqual([
      {
        arrivedAtMs: 3000,
        id: "arrival-2",
        seen: false,
        snailName: "Second Garden",
        text: "check passport"
      },
      {
        arrivedAtMs: 1000,
        id: "arrival-1",
        seen: true,
        snailName: "Garden Snail",
        text: "buy milk"
      }
    ]);
  });

  it("marks unseen arrivals as seen without changing arrival history", () => {
    const state = createInitialCarrierState();

    state.arrivals = [
      {
        arrivedAtMs: 1000,
        id: "arrival-1",
        journeyId: "journey-1",
        snailId: "garden-1",
        snailName: "Garden Snail",
        text: "buy milk",
        todoId: "todo-1"
      }
    ];
    const repository = new InMemoryCarrierRepository(state);

    const result = markArrivalsSeen({
      clock: { now: () => 2000 },
      repository
    });
    const snapshot = repository.snapshot();

    expect(result.markedCount).toBe(1);
    expect(hasUnseenArrivals(snapshot)).toBe(false);
    expect(snapshot.arrivals).toEqual([
      {
        arrivedAtMs: 1000,
        id: "arrival-1",
        journeyId: "journey-1",
        seenAtMs: 2000,
        snailId: "garden-1",
        snailName: "Garden Snail",
        text: "buy milk",
        todoId: "todo-1"
      }
    ]);
  });
});

import {
  createInitialCarrierState,
  listStableSnails
} from "./localCarrierState";

describe("stable state", () => {
  it("shows a new user's starter Garden Snail and free capacity", () => {
    const stable = listStableSnails(createInitialCarrierState());

    expect(stable.capacity).toEqual({
      busyCount: 0,
      freeCount: 1,
      totalCount: 1
    });
    expect(stable.snails).toEqual([
      {
        id: "garden-1",
        name: "Garden Snail",
        status: "resting",
        statusLabel: "Resting"
      }
    ]);
  });
});

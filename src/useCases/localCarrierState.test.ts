import {
  createInitialCarrierState,
  listStableSnails
} from "./localCarrierState";

describe("stable state", () => {
  it("grants a starter Garden Snail with baseline collection traits", () => {
    const state = createInitialCarrierState();

    expect(state.snails[0]).toMatchObject({
      appearance: {
        bodyColor: "#d99f5f",
        shellColor: "#7b4b34"
      },
      baseSpeedMetersPerHour: 48,
      level: 1,
      quirk: "none",
      quirkSeed: "starter-garden-1",
      rarity: "common",
      reliability: 0.95,
      speedBand: "garden",
      temperament: "steady",
      trail: {
        color: "#f5f8ed",
        persistenceMs: 72 * 60 * 60 * 1000,
        texture: "glistening"
      }
    });
  });

  it("shows a new user's starter Garden Snail and free capacity", () => {
    const stable = listStableSnails(createInitialCarrierState());

    expect(stable.capacity).toEqual({
      busyCount: 0,
      emptySlotCount: 0,
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

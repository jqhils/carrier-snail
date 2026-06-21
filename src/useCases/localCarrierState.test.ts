import {
  createInitialCarrierState,
  createStarterGardenSnail,
  getStableSnailDetail,
  InMemoryCarrierRepository,
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
      speciesId: "garden",
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
      emptySlotCount: 5,
      freeCount: 1,
      freeSlots: 5,
      maxSlots: 6,
      totalCount: 6
    });
    expect(stable.snails).toEqual([
      {
        baseSpeedMetersPerHour: 48,
        id: "garden-1",
        level: 1,
        name: "Garden Snail",
        speciesId: "garden",
        speciesName: "Garden Snail",
        status: "resting",
        statusLabel: "Resting"
      }
    ]);
  });

  it("counts all owned snails against base and purchased stable slots", () => {
    const starter = createStarterGardenSnail();
    const state = {
      ...createInitialCarrierState(),
      snails: Array.from({ length: 7 }, (_, index) => ({
        ...starter,
        id: `snail-${index + 1}`,
        status: index < 2 ? "on-journey" as const : "resting" as const
      })),
      stableSlots: { purchased: 2 }
    };

    expect(listStableSnails(state).capacity).toEqual({
      busyCount: 2,
      emptySlotCount: 1,
      freeCount: 5,
      freeSlots: 1,
      maxSlots: 8,
      totalCount: 8
    });
  });

  it("shows a stable detail view with species identity and lifetime progress", () => {
    const initialState = createInitialCarrierState();
    const state = {
      ...initialState,
      snails: [
        {
          ...initialState.snails[0],
          journeysCompleted: 3,
          name: "Lettuce Courier"
        }
      ]
    };

    expect(getStableSnailDetail(state, "garden-1")).toMatchObject({
      baseSpeedMetersPerHour: 48,
      id: "garden-1",
      journeysCompleted: 3,
      level: 1,
      lore: "The steady starter. Unhurried, sincere, and never above the work.",
      name: "Lettuce Courier",
      quirk: "none",
      rarity: "common",
      reliability: 0.95,
      speciesId: "garden",
      speciesName: "Garden Snail",
      status: "resting",
      statusLabel: "Resting",
      temperament: "steady"
    });
  });

  it("normalizes legacy snails without species by rarity", () => {
    const initialState = createInitialCarrierState();
    const legacyRareSnail = {
      ...initialState.snails[0],
      appearance: {
        bodyColor: "#abcdef",
        shellColor: "#123456"
      },
      id: "legacy-rare",
      name: "Old Blue",
      rarity: "rare" as const
    };

    delete (legacyRareSnail as { speciesId?: string }).speciesId;

    const repository = new InMemoryCarrierRepository({
      ...initialState,
      snails: [legacyRareSnail]
    });
    const [snail] = repository.snapshot().snails;

    expect(snail).toMatchObject({
      appearance: {
        bodyColor: "#abcdef",
        shellColor: "#123456"
      },
      name: "Old Blue",
      rarity: "rare",
      speciesId: "uni-sydney"
    });
  });
});

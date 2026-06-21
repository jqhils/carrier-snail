import { createPhaseZeroJourney } from "../journey/snailCrawl";
import {
  createInitialCarrierState,
  createStarterGardenSnail,
  InMemoryCarrierRepository,
  listStableSnails,
  type CarrierState,
  type Snail
} from "./localCarrierState";
import {
  releaseSnail,
  ReleasedSnailIsBusyError,
  ReleaseSnailNotFoundError
} from "./releaseSnail";
import { getSnailSpecies } from "./snailSpecies";

describe("releaseSnail", () => {
  it("sets a resting snail free, grants scaled slime, and frees a stable slot", () => {
    const rareSnail = createSnail("rare-1", "uni-sydney", {
      level: 4,
      name: "Sandstone"
    });
    const repository = new InMemoryCarrierRepository({
      ...createInitialCarrierState(),
      snails: [
        rareSnail,
        ...Array.from({ length: 5 }, (_, index) =>
          createSnail(`garden-${index + 1}`, "garden")
        )
      ],
      softCurrency: { slime: 3 }
    });

    const result = releaseSnail(
      { snailId: "rare-1" },
      {
        repository
      }
    );
    const state = repository.snapshot();

    expect(result).toEqual({
      releasedSnail: rareSnail,
      slimeGranted: 36
    });
    expect(state.snails.map((snail) => snail.id)).not.toContain("rare-1");
    expect(state.softCurrency.slime).toBe(39);
    expect(listStableSnails(state).capacity.freeSlots).toBe(1);
  });

  it("rejects missing snails without changing state", () => {
    const initialState = createInitialCarrierState();
    const repository = new InMemoryCarrierRepository(initialState);

    expect(() =>
      releaseSnail(
        { snailId: "missing" },
        {
          repository
        }
      )
    ).toThrow(ReleaseSnailNotFoundError);
    expect(repository.snapshot()).toEqual(initialState);
  });

  it("rejects on-journey snails without touching journeys", () => {
    const initialState: CarrierState = {
      ...createInitialCarrierState(),
      journeys: [
        {
          ...createPhaseZeroJourney({
            createdAtMs: 100,
            target: { latitude: -33.9, longitude: 151.3 }
          }),
          id: "journey-1",
          reminderId: "reminder-1",
          snailId: "garden-1",
          status: "in-flight",
          todoId: "todo-1"
        }
      ],
      snails: [
        {
          ...createStarterGardenSnail(),
          status: "on-journey"
        }
      ]
    };
    const repository = new InMemoryCarrierRepository(initialState);

    expect(() =>
      releaseSnail(
        { snailId: "garden-1" },
        {
          repository
        }
      )
    ).toThrow(ReleasedSnailIsBusyError);
    expect(repository.snapshot()).toEqual(initialState);
  });
});

function createSnail(
  id: string,
  speciesId: Snail["speciesId"],
  overrides: Partial<Snail> = {}
): Snail {
  const species = getSnailSpecies(speciesId);

  return {
    ...createStarterGardenSnail(),
    appearance: { ...species.appearanceTint },
    baseSpeedMetersPerHour: species.baseSpeedMetersPerHour,
    id,
    name: species.displayName,
    quirk: species.quirk,
    rarity: species.rarity,
    reliability: species.reliability,
    speedBand: species.speedBand,
    speciesId: species.id,
    temperament: species.temperament,
    trail: { ...species.trail },
    ...overrides
  };
}

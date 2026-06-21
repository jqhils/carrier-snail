import {
  createInitialCarrierState,
  createStarterGardenSnail,
  InMemoryCarrierRepository,
  type CarrierState
} from "./localCarrierState";
import {
  getEggRarityPoolOdds,
  hatchEgg,
  selectRarityFromOdds,
  StableFullError
} from "./hatchEgg";
import { getSnailSpecies } from "./snailSpecies";

describe("hatchEgg", () => {
  it("discloses earned egg odds and draws rarity at odds boundaries", () => {
    const odds = getEggRarityPoolOdds("earned-basic");

    expect(odds).toEqual([
      { label: "Common", probability: 0.7, rarity: "common" },
      { label: "Uncommon", probability: 0.2, rarity: "uncommon" },
      { label: "Rare", probability: 0.07, rarity: "rare" },
      { label: "Mythic", probability: 0.02, rarity: "mythic" },
      { label: "Cursed", probability: 0.01, rarity: "cursed" }
    ]);
    expect(selectRarityFromOdds(0, odds)).toBe("common");
    expect(selectRarityFromOdds(0.699999, odds)).toBe("common");
    expect(selectRarityFromOdds(0.7, odds)).toBe("uncommon");
    expect(selectRarityFromOdds(0.9, odds)).toBe("rare");
    expect(selectRarityFromOdds(0.97, odds)).toBe("mythic");
    expect(selectRarityFromOdds(0.99, odds)).toBe("cursed");
  });

  it("hatches an unhatched egg into a resting snail and records the hatch", () => {
    const repository = new InMemoryCarrierRepository(stateWithEarnedEgg());

    const result = hatchEgg(
      { eggId: "egg-1", randomUnit: () => 0.995 },
      {
        clock: { now: () => 5000 },
        repository
      }
    );
    const state = repository.snapshot();

    expect(result.snail).toMatchObject({
      rarity: "cursed",
      status: "resting"
    });
    expect(state.eggs[0]).toMatchObject({
      hatchedAtMs: 5000,
      hatchedSnailId: result.snail.id,
      status: "hatched"
    });
    expect(state.snails).toContainEqual(result.snail);
  });

  it("deterministically hatches a species from the rolled rarity", () => {
    const firstRepository = new InMemoryCarrierRepository(stateWithEarnedEgg());
    const secondRepository = new InMemoryCarrierRepository(stateWithEarnedEgg());

    const first = hatchEgg(
      { eggId: "egg-1", randomUnit: () => 0.75 },
      {
        clock: { now: () => 5000 },
        repository: firstRepository
      }
    );
    const second = hatchEgg(
      { eggId: "egg-1", randomUnit: () => 0.75 },
      {
        clock: { now: () => 5000 },
        repository: secondRepository
      }
    );
    const species = getSnailSpecies(first.snail.speciesId);

    expect(first.snail.speciesId).toBe(second.snail.speciesId);
    expect(species.rarity).toBe("uncommon");
    expect(first.snail).toMatchObject({
      baseSpeedMetersPerHour: species.baseSpeedMetersPerHour,
      name: species.displayName,
      rarity: "uncommon",
      reliability: species.reliability,
      speedBand: species.speedBand,
      temperament: species.temperament,
      trail: species.trail
    });
  });

  it("blocks hatching at the stable cap without consuming the egg", () => {
    const fullState = {
      ...stateWithEarnedEgg(),
      snails: Array.from({ length: 6 }, (_, index) => ({
        ...createStarterGardenSnail(),
        id: `snail-${index + 1}`
      }))
    };
    const repository = new InMemoryCarrierRepository(fullState);

    expect(() =>
      hatchEgg(
        { eggId: "egg-1", randomUnit: () => 0.1 },
        {
          clock: { now: () => 5000 },
          repository
        }
      )
    ).toThrow(StableFullError);
    expect(repository.snapshot().eggs).toEqual(fullState.eggs);
    expect(repository.snapshot().snails).toHaveLength(6);
  });

  it("hatches into a freed slot without reusing an owned snail id", () => {
    const repository = new InMemoryCarrierRepository({
      ...stateWithEarnedEgg(),
      snails: Array.from({ length: 5 }, (_, index) => ({
        ...createStarterGardenSnail(),
        id: `snail-${index + 2}`
      }))
    });

    const result = hatchEgg(
      { eggId: "egg-1", randomUnit: () => 0.1 },
      {
        clock: { now: () => 5000 },
        repository
      }
    );
    const snailIds = repository.snapshot().snails.map((snail) => snail.id);

    expect(snailIds).toContain(result.snail.id);
    expect(new Set(snailIds).size).toBe(snailIds.length);
  });
});

function stateWithEarnedEgg(): CarrierState {
  return {
    ...createInitialCarrierState(),
    eggs: [
      {
        earnedAtMs: 1000,
        id: "egg-1",
        rarityPool: "earned-basic",
        source: "earned",
        status: "unhatched"
      }
    ]
  };
}

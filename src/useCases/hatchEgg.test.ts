import {
  createInitialCarrierState,
  InMemoryCarrierRepository,
  type CarrierState
} from "./localCarrierState";
import {
  getEggRarityPoolOdds,
  hatchEgg,
  selectRarityFromOdds
} from "./hatchEgg";

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

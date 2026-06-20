import {
  getSnailSpecies,
  listSnailSpeciesByRarity,
  SNAIL_SPECIES_CATALOG
} from "./snailSpecies";

describe("snail species catalog", () => {
  it("defines the illustrated species and covers every rarity", () => {
    expect(SNAIL_SPECIES_CATALOG.map(({ id }) => id)).toEqual([
      "garden",
      "barista",
      "sydney-train",
      "comp-sci",
      "postal",
      "uni-sydney",
      "absent-father",
      "red-bull",
      "golden",
      "backwards"
    ]);

    for (const rarity of ["common", "uncommon", "rare", "mythic", "cursed"] as const) {
      expect(listSnailSpeciesByRarity(rarity)).not.toHaveLength(0);
    }

    for (const species of SNAIL_SPECIES_CATALOG) {
      expect(species.trailColor).toBe(species.trail.color);
    }

    expect(getSnailSpecies("garden")).toMatchObject({
      displayName: "Garden Snail",
      rarity: "common",
      sprite: "garden"
    });
  });
});

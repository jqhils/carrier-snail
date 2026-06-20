import { creditSnailGameReward, scoreToSnailReward } from "./snailGameReward";

describe("snail game reward", () => {
  it("a zero run earns nothing", () => {
    expect(scoreToSnailReward(0)).toEqual({ experiencePoints: 0, slime: 0 });
  });

  it("earns slime in proportion to score, capped per run", () => {
    expect(scoreToSnailReward(9).slime).toBe(3);
    expect(scoreToSnailReward(999).slime).toBe(8);
  });

  it("ticks experience by score", () => {
    expect(scoreToSnailReward(7).experiencePoints).toBe(7);
  });

  it("credits the played snail's xp and the global slime balance", () => {
    const snails = [
      { experiencePoints: 5, id: "a" },
      { experiencePoints: 0, id: "b" }
    ];
    const out = creditSnailGameReward(
      snails,
      "a",
      { experiencePoints: 30, slime: 3 },
      10
    );
    expect(out.slime).toBe(13);
    expect(out.snails.find((snail) => snail.id === "a")?.experiencePoints).toBe(
      35
    );
    expect(out.snails.find((snail) => snail.id === "b")?.experiencePoints).toBe(
      0
    );
  });
});

import {
  creditSnailGameReward,
  scoreToSaltStormReward,
  scoreToSnailReward
} from "./snailGameReward";

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

describe("scoreToSaltStormReward (slime is hard-won)", () => {
  it("gives no slime for a short run (under 10s)", () => {
    expect(scoreToSaltStormReward(99).slime).toBe(0);
  });
  it("gives 1 slime at ~10s survived", () => {
    expect(scoreToSaltStormReward(100).slime).toBe(1);
  });
  it("caps slime at 8", () => {
    expect(scoreToSaltStormReward(100000).slime).toBe(8);
  });
});

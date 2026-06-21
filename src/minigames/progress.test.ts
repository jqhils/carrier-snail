import { applyResult, entryFor, sortedByXp, xpForScore } from "./progress";
import type { GameResult } from "./types";

function result(characterId: string, score: number): GameResult {
  return { characterId, gameId: "flappy", rewardMultiplier: 1, score };
}

describe("progress reducer", () => {
  it("scales xp with score", () => {
    expect(xpForScore(0)).toBe(0);
    expect(xpForScore(5)).toBe(50);
  });

  it("creates an entry for a first-time character", () => {
    const entries = applyResult([], result("redbull", 4));
    expect(entries).toHaveLength(1);
    expect(entryFor(entries, "redbull")).toMatchObject({
      bestScore: 4,
      plays: 1,
      xp: 40
    });
  });

  it("accumulates plays and xp while keeping the best score", () => {
    let entries = applyResult([], result("redbull", 4));
    entries = applyResult(entries, result("redbull", 2));
    expect(entryFor(entries, "redbull")).toMatchObject({
      bestScore: 4,
      plays: 2,
      xp: 60
    });
  });

  it("ranks characters by xp descending", () => {
    let entries = applyResult([], result("a", 1));
    entries = applyResult(entries, result("b", 9));
    expect(sortedByXp(entries)[0].characterId).toBe("b");
  });
});

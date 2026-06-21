import { getHighScore, mergeHighScore } from "./highScores";

describe("high scores", () => {
  it("reads 0 for an unseen snail/game", () => {
    expect(getHighScore({}, "snail-1", "flappy")).toBe(0);
  });

  it("records a first score", () => {
    const next = mergeHighScore({}, "snail-1", "flappy", 12);
    expect(getHighScore(next, "snail-1", "flappy")).toBe(12);
  });

  it("keeps the higher score and ignores worse runs", () => {
    let scores = mergeHighScore({}, "snail-1", "flappy", 12);
    const same = mergeHighScore(scores, "snail-1", "flappy", 9);
    expect(same).toBe(scores); // unchanged ref
    scores = mergeHighScore(scores, "snail-1", "flappy", 20);
    expect(getHighScore(scores, "snail-1", "flappy")).toBe(20);
  });

  it("keeps scores separate per snail and per game", () => {
    let scores = mergeHighScore({}, "snail-1", "flappy", 12);
    scores = mergeHighScore(scores, "snail-2", "flappy", 5);
    scores = mergeHighScore(scores, "snail-1", "snake", 3);
    expect(getHighScore(scores, "snail-1", "flappy")).toBe(12);
    expect(getHighScore(scores, "snail-2", "flappy")).toBe(5);
    expect(getHighScore(scores, "snail-1", "snake")).toBe(3);
  });
});

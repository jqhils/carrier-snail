// Pure per-snail-per-game high-score logic. No I/O here, so it's trivially
// testable; the AsyncStorage read/write lives in highScoresStorage.ts.

// Keyed by `${snailId}:${gameId}` -> best score.
export type HighScoreMap = Record<string, number>;

function keyOf(snailId: string, gameId: string): string {
  return `${snailId}:${gameId}`;
}

export function getHighScore(
  scores: HighScoreMap,
  snailId: string,
  gameId: string
): number {
  return scores[keyOf(snailId, gameId)] ?? 0;
}

// Returns a new map only if this beats the stored best (else the same ref).
export function mergeHighScore(
  scores: HighScoreMap,
  snailId: string,
  gameId: string,
  score: number
): HighScoreMap {
  const key = keyOf(snailId, gameId);
  if (score <= (scores[key] ?? 0)) {
    return scores;
  }
  return { ...scores, [key]: score };
}

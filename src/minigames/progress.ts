import type { GameResult } from "./types";

// Per-character progression. Lives in the hub, derived purely from results so
// it's trivially testable and the storage layer (in-memory now, the team's
// backend later) can be swapped without touching this logic.
export type ProgressEntry = {
  bestScore: number;
  characterId: string;
  plays: number;
  xp: number;
};

export function xpForScore(score: number): number {
  return Math.max(0, Math.round(score)) * 10;
}

// Fold one result into the progress table (pure; returns a new array).
export function applyResult(
  entries: ProgressEntry[],
  result: GameResult
): ProgressEntry[] {
  const existing = entries.find(
    (entry) => entry.characterId === result.characterId
  );

  if (!existing) {
    return [
      ...entries,
      {
        bestScore: result.score,
        characterId: result.characterId,
        plays: 1,
        xp: xpForScore(result.score)
      }
    ];
  }

  return entries.map((entry) =>
    entry.characterId === result.characterId
      ? {
          ...entry,
          bestScore: Math.max(entry.bestScore, result.score),
          plays: entry.plays + 1,
          xp: entry.xp + xpForScore(result.score)
        }
      : entry
  );
}

export function sortedByXp(entries: ProgressEntry[]): ProgressEntry[] {
  return [...entries].sort((a, b) => b.xp - a.xp);
}

export function entryFor(
  entries: ProgressEntry[],
  characterId: string
): ProgressEntry | undefined {
  return entries.find((entry) => entry.characterId === characterId);
}

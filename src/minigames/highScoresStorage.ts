import AsyncStorage from "@react-native-async-storage/async-storage";

import type { HighScoreMap } from "./highScores";

// High scores persist device-locally in AsyncStorage — independent of
// CarrierState / Supabase. Swap this module for a CarrierState-backed one later
// if the team wants synced scores; the pure helpers in highScores.ts won't change.
const STORAGE_KEY = "snailGames.highScores";

export async function loadHighScores(): Promise<HighScoreMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HighScoreMap) : {};
  } catch {
    return {};
  }
}

export async function persistHighScores(scores: HighScoreMap): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // best-effort; a failed write just means the score isn't kept
  }
}

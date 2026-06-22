import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  cloneCarrierState,
  type CarrierState
} from "../useCases/localCarrierState";

// Device-local persistence for the full CarrierState. This is the offline
// fallback / cache: when Supabase is unconfigured or unreachable the app would
// otherwise keep state in memory only and reset on every restart. Mirrors the
// best-effort pattern in minigames/highScoresStorage.ts.
//
// Supabase remains the source of truth when a backend session exists; this
// store is (a) the sole persistence in local mode and (b) an offline cache in
// backend mode that lets us migrate offline progress up once a session loads.
const STORAGE_KEY = "carrierSnail.carrierState.v1";

export async function loadLocalCarrierState(): Promise<CarrierState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;

    return isCarrierStateShape(parsed) ? (parsed as CarrierState) : null;
  } catch {
    // Corrupt or unreadable payload — behave as if nothing was stored rather
    // than crashing the app on launch.
    return null;
  }
}

export async function persistLocalCarrierState(
  state: CarrierState
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cloneCarrierState(state))
    );
  } catch {
    // Best-effort; a failed write just means this update isn't cached locally.
  }
}

export async function clearLocalCarrierState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort.
  }
}

// Minimal structural guard: enough to reject obviously wrong payloads (e.g. an
// older/foreign value) without coupling to every field. The repository/use-case
// mappers tolerate missing optional fields.
function isCarrierStateShape(value: unknown): value is CarrierState {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    Array.isArray(candidate.snails) &&
    Array.isArray(candidate.eggs) &&
    Array.isArray(candidate.journeys) &&
    Array.isArray(candidate.todos)
  );
}

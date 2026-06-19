import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { SupabaseAnonymousAuthProvider } from "../backend/supabaseAnonymousAuthProvider";
import { SupabaseCarrierRepository } from "../backend/supabaseCarrierRepository";
import { createCarrierSupabaseClient } from "../backend/supabaseClient";
import type { Coordinate } from "../journey/snailCrawl";
import { resolveAnonymousCarrierUser } from "../useCases/resolveAnonymousCarrierUser";
import { updateForegroundTarget } from "../useCases/updateForegroundTarget";

export const BACKGROUND_LOCATION_TASK_NAME =
  "carrier-snail-background-location";

export function defineCarrierSnailBackgroundLocationTask(): void {
  if (TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK_NAME)) {
    return;
  }

  TaskManager.defineTask(BACKGROUND_LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      return;
    }

    const coordinate = getLatestCoordinate(data);

    if (!coordinate) {
      return;
    }

    await updateTargetFromBackgroundCoordinate(coordinate);
  });
}

async function updateTargetFromBackgroundCoordinate(
  coordinate: Coordinate
): Promise<void> {
  const supabase = createCarrierSupabaseClient();

  if (!supabase) {
    return;
  }

  const repository = new SupabaseCarrierRepository(supabase);
  const authProvider = new SupabaseAnonymousAuthProvider(supabase);
  const user = await resolveAnonymousCarrierUser({
    authProvider,
    clock: { now: () => Date.now() },
    repository
  });

  await updateForegroundTarget({
    clock: { now: () => Date.now() },
    locationSource: { currentTarget: () => coordinate },
    repository,
    userId: user.id
  });
}

function getLatestCoordinate(data: unknown): Coordinate | null {
  const locations = (data as { locations?: Location.LocationObject[] }).locations;
  const latest = locations?.[locations.length - 1];

  if (!latest) {
    return null;
  }

  return {
    latitude: latest.coords.latitude,
    longitude: latest.coords.longitude
  };
}

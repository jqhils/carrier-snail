import type { Clock } from "./createReminderJourney";
import type { CarrierRepository, CarrierState } from "./localCarrierState";

export const FIRST_RUN_ONBOARDING_STEPS = [
  "Write a short to-do, then send a snail when it deserves a carrier. Your starter Garden Snail begins at a random spot between 1 km and under 5 km away, then crawls toward your coarse resting place.",
  "There are no mid-journey notifications. Carrier Snail sends one push only when the snail finally arrives.",
  "Recall is always available. The snail comes home empty and the to-do stays open."
] as const;

export const LOCATION_PRIVACY_PLAIN_LANGUAGE =
  "Carrier Snail uses coarse location only. We keep the latest target and a short trail history, not a long-term location log. Background re-aiming is optional; foreground-only delivery still works.";

export function shouldShowOnboarding(state: CarrierState): boolean {
  return state.onboarding?.completedAtMs === undefined;
}

export function completeOnboarding({
  clock,
  repository
}: {
  clock: Clock;
  repository: CarrierRepository;
}): void {
  const state = repository.snapshot();

  if (!shouldShowOnboarding(state)) {
    return;
  }

  repository.save({
    ...state,
    onboarding: {
      completedAtMs: clock.now()
    }
  });
}

import { createReminderJourney } from "./createReminderJourney";
import {
  createInitialCarrierState,
  InMemoryCarrierRepository,
  listInFlightReminders
} from "./localCarrierState";
import {
  completeOnboarding,
  FIRST_RUN_ONBOARDING_STEPS,
  LOCATION_PRIVACY_PLAIN_LANGUAGE,
  shouldShowOnboarding
} from "./onboarding";

const target = {
  latitude: -33.8688,
  longitude: 151.2093
};

describe("onboarding", () => {
  it("explains the premise, one-push rule, recall, and privacy posture in plain language", () => {
    const onboardingCopy = FIRST_RUN_ONBOARDING_STEPS.join(" ");

    expect(onboardingCopy).toMatch(/Garden Snail|snail/i);
    expect(onboardingCopy).toMatch(/between 1 km and under 5 km/i);
    expect(onboardingCopy).toMatch(/no mid-journey notifications/i);
    expect(onboardingCopy).toMatch(/one push/i);
    expect(onboardingCopy).toMatch(/recall/i);

    expect(LOCATION_PRIVACY_PLAIN_LANGUAGE).toMatch(/coarse location/i);
    expect(LOCATION_PRIVACY_PLAIN_LANGUAGE).toMatch(/latest target/i);
    expect(LOCATION_PRIVACY_PLAIN_LANGUAGE).toMatch(/short trail history/i);
    expect(LOCATION_PRIVACY_PLAIN_LANGUAGE).toMatch(/not a long-term location log/i);
    expect(LOCATION_PRIVACY_PLAIN_LANGUAGE).toMatch(/foreground-only/i);
  });

  it("records completion without disturbing the starter Garden Snail happy path", () => {
    const repository = new InMemoryCarrierRepository(createInitialCarrierState());

    expect(shouldShowOnboarding(repository.snapshot())).toBe(true);

    completeOnboarding({
      clock: { now: () => 1234 },
      repository
    });

    expect(repository.snapshot().onboarding.completedAtMs).toBe(1234);
    expect(shouldShowOnboarding(repository.snapshot())).toBe(false);

    createReminderJourney(
      { text: "buy milk" },
      {
        clock: { now: () => 2000 },
        locationSource: { currentTarget: () => target },
        repository
      }
    );

    expect(listInFlightReminders(repository.snapshot())).toEqual([
      {
        reminderId: "reminder-1",
        snailName: "Garden Snail",
        text: "buy milk"
      }
    ]);
  });
});

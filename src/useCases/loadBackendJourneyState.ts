import { getCrawlFrame, type CrawlFrame } from "../journey/snailCrawl";
import type { Clock } from "./createReminderJourney";
import {
  getActiveJourney,
  listInFlightReminders,
  type CarrierState,
  type InFlightReminderListItem,
  type JourneyRecord
} from "./localCarrierState";
import type { BackendCarrierRepository } from "./resolveAnonymousCarrierUser";

export type BackendJourneyState = {
  activeFrame?: CrawlFrame;
  activeJourney?: JourneyRecord;
  carrierState: CarrierState;
  inFlightReminders: InFlightReminderListItem[];
};

export async function loadBackendJourneyState({
  clock,
  repository,
  timeWarpFactor = 1,
  userId
}: {
  clock: Clock;
  repository: BackendCarrierRepository;
  timeWarpFactor?: number;
  userId: string;
}): Promise<BackendJourneyState> {
  const carrierState = await repository.loadCarrierState(userId);
  const activeJourney = getActiveJourney(carrierState);

  return {
    activeFrame: activeJourney
      ? getCrawlFrame({
          journey: activeJourney,
          nowMs: clock.now(),
          timeWarpFactor
        })
      : undefined,
    activeJourney,
    carrierState,
    inFlightReminders: listInFlightReminders(carrierState)
  };
}

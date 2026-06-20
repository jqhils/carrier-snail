import { getCrawlFrame, type CrawlFrame } from "../journey/snailCrawl";
import type { Clock } from "./createReminderJourney";
import {
  getActiveJourney,
  listInFlightReminders,
  type CarrierState,
  type InFlightReminderListItem,
  type JourneyRecord
} from "./localCarrierState";
import {
  computeServerJourneyEta,
  type ServerJourneyEta
} from "./computeServerJourneyEta";
import type { BackendCarrierRepository } from "./resolveAnonymousCarrierUser";
import {
  buildJourneyWatchState,
  type JourneyWatchState
} from "./watchJourneyState";

export type BackendJourneyState = {
  activeFrame?: CrawlFrame;
  activeJourney?: JourneyRecord;
  carrierState: CarrierState;
  inFlightReminders: InFlightReminderListItem[];
  serverEta?: ServerJourneyEta;
  watchState: JourneyWatchState;
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
  const serverNowMs = clock.now();
  const serverClock = { now: () => serverNowMs };

  return {
    activeFrame: activeJourney
      ? getCrawlFrame({
          journey: activeJourney,
          nowMs: serverNowMs,
          timeWarpFactor
        })
      : undefined,
    activeJourney,
    carrierState,
    inFlightReminders: listInFlightReminders(carrierState),
    serverEta: activeJourney
      ? computeServerJourneyEta({
          clock: serverClock,
          journey: activeJourney
        })
      : undefined,
    watchState: buildJourneyWatchState({
      clock: serverClock,
      state: carrierState,
      timeWarpFactor
    })
  };
}

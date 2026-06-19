import { createPhaseZeroJourney } from "../journey/snailCrawl";
import {
  computeServerJourneyEta,
  type ComputeServerJourneyEtaInput
} from "./computeServerJourneyEta";

const target = {
  latitude: -33.8688,
  longitude: 151.2093
};

describe("computeServerJourneyEta", () => {
  it("uses server Clock time and ignores client clock input", () => {
    const journey = {
      ...createPhaseZeroJourney({ createdAtMs: 1000, target }),
      id: "journey-1",
      reminderId: "reminder-1",
      snailId: "snail-1",
      status: "in-flight" as const
    };
    const serverNowMs = 60 * 60 * 1000;

    const earlyClient = computeServerJourneyEta({
      clientNowMs: 999999999999,
      clock: { now: () => serverNowMs },
      journey,
      speedModifiers: { levelMultiplier: 1000 }
    });
    const lateClient = computeServerJourneyEta({
      clientNowMs: -999999999999,
      clock: { now: () => serverNowMs },
      journey,
      speedModifiers: { levelMultiplier: 1000 }
    });

    expect(earlyClient).toEqual(lateClient);
    expect(earlyClient.serverNowMs).toBe(serverNowMs);
    expect(earlyClient.remainingMs).toBe(
      earlyClient.earliestArrivalAtMs - serverNowMs
    );
  });

  it("ignores a malicious time-warp field on server ETA input", () => {
    const journey = {
      ...createPhaseZeroJourney({ createdAtMs: 0, target }),
      id: "journey-1",
      reminderId: "reminder-1",
      snailId: "snail-1",
      status: "in-flight" as const
    };
    const input: ComputeServerJourneyEtaInput = {
      clock: { now: () => 0 },
      journey,
      speedModifiers: { spendMultiplier: 1000 }
    };

    const normal = computeServerJourneyEta(input);
    const withWarp = computeServerJourneyEta({
      ...input,
      timeWarpFactor: 100000
    } as unknown as ComputeServerJourneyEtaInput);

    expect(withWarp).toEqual(normal);
  });
});

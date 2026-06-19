import { getCrawlFrame } from "../journey/snailCrawl";
import { createDemoPersonalityJourneys } from "./demoSnailPersonalities";

const target = {
  latitude: -33.8688,
  longitude: 151.2093
};

describe("demo snail personalities", () => {
  it("replays the same seeded personality journeys across sessions", () => {
    const first = createDemoPersonalityJourneys({
      createdAtMs: 0,
      target
    });
    const second = createDemoPersonalityJourneys({
      createdAtMs: 0,
      target
    });
    const nowMs = 18 * 60 * 60 * 1000;

    expect(first).toEqual(second);
    expect(
      first.map(({ journey }) =>
        getCrawlFrame({ journey, nowMs, timeWarpFactor: 1 })
      )
    ).toEqual(
      second.map(({ journey }) =>
        getCrawlFrame({ journey, nowMs, timeWarpFactor: 1 })
      )
    );
  });

  it("makes Garden, Wanderer, and Cursed snails diverge on the same journey", () => {
    const demoJourneys = createDemoPersonalityJourneys({
      createdAtMs: 0,
      target
    });
    const frames = demoJourneys.map(({ journey }) =>
      getCrawlFrame({
        journey,
        nowMs: 18 * 60 * 60 * 1000,
        timeWarpFactor: 1
      })
    );

    expect(demoJourneys.map(({ snail }) => snail.name)).toEqual([
      "Garden Snail",
      "Wanderer Snail",
      "Cursed Snail"
    ]);
    expect(frames.map((frame) => frame.quirkEffect.kind)).toEqual([
      "none",
      "scenic-detour",
      "cursed-backwards"
    ]);
    expect(new Set(frames.map((frame) => frame.progress)).size).toBe(3);
    expect(new Set(demoJourneys.map(({ snail }) => snail.trail.color)).size).toBe(
      3
    );
    expect(
      new Set(demoJourneys.map(({ snail }) => snail.appearance.shellColor)).size
    ).toBe(3);
  });
});

import {
  createPhaseZeroJourney,
  type Coordinate,
  type PhaseZeroJourney
} from "../journey/snailCrawl";
import { createStarterGardenSnail, type Snail } from "./localCarrierState";

export type DemoPersonalityJourney = {
  id: string;
  journey: PhaseZeroJourney;
  snail: Snail;
};

export function createDemoPersonalityJourneys({
  createdAtMs,
  target
}: {
  createdAtMs: number;
  target: Coordinate;
}): DemoPersonalityJourney[] {
  return createDemoPersonalitySnails().map((snail) => ({
    id: snail.id,
    journey: createPhaseZeroJourney({
      createdAtMs,
      quirk: snail.quirk,
      quirkSeed: snail.quirkSeed,
      speedMetersPerHour: snail.baseSpeedMetersPerHour,
      target
    }),
    snail
  }));
}

export function createDemoPersonalitySnails(): Snail[] {
  const garden = createStarterGardenSnail();

  return [
    {
      ...garden,
      id: "demo-garden",
      quirkSeed: "demo-garden-1"
    },
    {
      ...garden,
      appearance: {
        bodyColor: "#c6b98f",
        shellColor: "#365c8d"
      },
      baseSpeedMetersPerHour: 44,
      id: "demo-wanderer",
      name: "Wanderer Snail",
      quirk: "scenic-detour",
      quirkSeed: "demo-wanderer-1",
      rarity: "rare",
      reliability: 0.7,
      speedBand: "steady",
      temperament: "wanderer",
      trail: {
        color: "#4b8f8c",
        persistenceMs: 96 * 60 * 60 * 1000,
        texture: "misty"
      }
    },
    {
      ...garden,
      appearance: {
        bodyColor: "#d8b7a2",
        shellColor: "#4b3342"
      },
      baseSpeedMetersPerHour: 52,
      id: "demo-cursed",
      name: "Cursed Snail",
      quirk: "cursed-backwards",
      quirkSeed: "demo-cursed-1",
      rarity: "cursed",
      reliability: 0.55,
      speedBand: "swift",
      temperament: "cursed",
      trail: {
        color: "#b24836",
        persistenceMs: 120 * 60 * 60 * 1000,
        texture: "inky"
      }
    }
  ];
}

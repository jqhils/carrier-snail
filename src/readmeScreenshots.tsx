import { useMemo } from "react";

import { SNAIL_SPRITE_ASSETS } from "./components/SnailSprite";
import {
  destinationCoordinate,
  initialBearingDegrees,
  type Coordinate
} from "./journey/snailCrawl";
import { FlappySnailGame } from "./minigames/flappySnail/FlappySnailGame";
import { snailToCharacter } from "./minigames/snailToCharacter";
import type { BottomTabId } from "./components/TabBar";
import {
  type CarrierState,
  type JourneyRecord,
  type Snail,
  type SnailRarity,
  type SnailSpeedBand,
  type SnailTemperament,
  type TrailHistoryPoint
} from "./useCases/localCarrierState";
import { type MapSkinId } from "./useCases/mapSkins";
import {
  getSnailSpecies,
  type SnailSpeciesId
} from "./useCases/snailSpecies";

export type ReadmeScreenshotId =
  | "intro"
  | "map"
  | "snails"
  | "snail-detail"
  | "flappy"
  | "todos"
  | "notifications"
  | "settings";

export type ReadmeMapScreenshotConfig = {
  carrierState: CarrierState;
  expandMapDetails: boolean;
  fitMapToJourney: boolean;
  locationLabel: string;
  nowMs: number;
  selectedJourneyId?: string;
  selectedMapSkinId: MapSkinId;
  selectedSnailId: string;
  detailSnailId?: string;
  target: Coordinate;
};

export const README_SCREENSHOT_SEQUENCE_IDS: ReadmeScreenshotId[] = [
  "intro",
  "map",
  "snails",
  "snail-detail",
  "flappy",
  "todos",
  "notifications",
  "settings"
];

const README_SCREENSHOT_IDS = new Set<ReadmeScreenshotId>(
  README_SCREENSHOT_SEQUENCE_IDS
);

export const README_SCREENSHOT_MODE =
  process.env.EXPO_PUBLIC_README_SCREENSHOT_MODE === "1";

export const README_SCREENSHOT_SEQUENCE_MODE =
  process.env.EXPO_PUBLIC_README_SCREENSHOT_SEQUENCE === "1";

export const README_SCREENSHOT_SEQUENCE_INTERVAL_MS = 10000;

export const README_SCREENSHOT_DEFAULT_ID =
  parseReadmeScreenshotId(process.env.EXPO_PUBLIC_README_SCREENSHOT) ?? "intro";

export const README_SCREENSHOT_NOW_MS = Date.UTC(2026, 5, 22, 9, 30);

const README_SCREENSHOT_TARGET: Coordinate = {
  latitude: -33.8688,
  longitude: 151.2093
};

const README_SCREENSHOT_JOURNEY_DISTANCE_METERS = 4200;
const README_SCREENSHOT_JOURNEY_ELAPSED_MS = 30 * 60 * 60 * 1000;

export function parseReadmeScreenshotId(
  value: string | null | undefined
): ReadmeScreenshotId | undefined {
  return README_SCREENSHOT_IDS.has(value as ReadmeScreenshotId)
    ? (value as ReadmeScreenshotId)
    : undefined;
}

export function parseReadmeScreenshotUrl(
  url: string
): ReadmeScreenshotId | undefined {
  const query = url.split("?")[1] ?? "";
  const params = query.split("&");

  for (const param of params) {
    const [rawKey, rawValue = ""] = param.split("=");
    if (decodeURIComponent(rawKey) !== "screen") {
      continue;
    }

    return parseReadmeScreenshotId(decodeURIComponent(rawValue));
  }

  return undefined;
}

export function tabForReadmeScreenshot(
  screenshotId: ReadmeScreenshotId
): BottomTabId {
  switch (screenshotId) {
    case "snails":
    case "snail-detail":
    case "flappy":
      return "snails";
    case "todos":
      return "todos";
    case "notifications":
      return "notifications";
    case "settings":
      return "settings";
    case "intro":
    case "map":
    default:
      return "map";
  }
}

export function createReadmeMapScreenshotConfig(
  screenshotId: ReadmeScreenshotId
): ReadmeMapScreenshotConfig {
  const carrierState = createReadmeScreenshotCarrierState({
    showOnboarding: screenshotId === "intro"
  });

  return {
    carrierState,
    expandMapDetails: screenshotId === "map",
    fitMapToJourney: screenshotId === "map",
    locationLabel: "Sydney resting point",
    nowMs: README_SCREENSHOT_NOW_MS,
    selectedJourneyId: "journey-1",
    selectedMapSkinId: "streets",
    selectedSnailId:
      screenshotId === "snails"
        ? "postal-1"
        : screenshotId === "snail-detail"
          ? "red-bull-1"
          : "garden-1",
    detailSnailId:
      screenshotId === "snail-detail" ? "red-bull-1" : undefined,
    target: README_SCREENSHOT_TARGET
  };
}

export function ReadmeFlappyScreenshot() {
  const snail = useMemo(() => createReadmeScreenshotSnail({
    experiencePoints: 180,
    id: "red-bull-1",
    journeysCompleted: 9,
    level: 5,
    name: "Red Bull Snail",
    speciesId: "red-bull",
    status: "resting"
  }), []);

  return (
    <FlappySnailGame
      autoStart
      character={snailToCharacter(snail)}
      onExit={() => undefined}
      onResult={() => undefined}
      readmeScreenshotFrame
      snailSprite={SNAIL_SPRITE_ASSETS[snail.speciesId]}
    />
  );
}

function createReadmeScreenshotCarrierState({
  showOnboarding
}: {
  showOnboarding: boolean;
}): CarrierState {
  const journeyStart = destinationCoordinate({
    bearingDegrees: 300,
    distanceMeters: README_SCREENSHOT_JOURNEY_DISTANCE_METERS,
    from: README_SCREENSHOT_TARGET
  });
  const journeyCreatedAtMs =
    README_SCREENSHOT_NOW_MS - README_SCREENSHOT_JOURNEY_ELAPSED_MS;
  const gardenSnail = createReadmeScreenshotSnail({
    experiencePoints: 42,
    id: "garden-1",
    journeysCompleted: 2,
    level: 2,
    name: "Garden Snail",
    speciesId: "garden",
    status: "on-journey"
  });
  const activeJourney: JourneyRecord = {
    createdAtMs: journeyCreatedAtMs,
    id: "journey-1",
    quirk: gardenSnail.quirk,
    quirkSeed: gardenSnail.quirkSeed,
    snailId: gardenSnail.id,
    speedMetersPerHour: gardenSnail.baseSpeedMetersPerHour,
    start: journeyStart,
    status: "in-flight",
    target: README_SCREENSHOT_TARGET,
    todoId: "todo-1",
    trailHistory: createTrailHistory({
      createdAtMs: journeyCreatedAtMs,
      start: journeyStart,
      target: README_SCREENSHOT_TARGET
    })
  };
  const arrivedJourney: JourneyRecord = {
    createdAtMs: README_SCREENSHOT_NOW_MS - 92 * 60 * 60 * 1000,
    arrivedAtMs: README_SCREENSHOT_NOW_MS - 9 * 60 * 60 * 1000,
    id: "journey-2",
    quirk: "none",
    quirkSeed: "readme-postal-arrival",
    snailId: "postal-1",
    speedMetersPerHour: 57,
    start: destinationCoordinate({
      bearingDegrees: 112,
      distanceMeters: 3600,
      from: README_SCREENSHOT_TARGET
    }),
    status: "arrived",
    target: README_SCREENSHOT_TARGET,
    todoId: "todo-3"
  };

  return {
    arrivals: [
      {
        arrivedAtMs: README_SCREENSHOT_NOW_MS - 18 * 60 * 1000,
        id: "arrival-3",
        journeyId: "journey-4",
        seenAtMs: undefined,
        snailId: "barista-1",
        snailName: "Barista Snail",
        text: "Pick up coffee beans before the weekend roast.",
        todoId: "todo-6"
      },
      {
        arrivedAtMs: README_SCREENSHOT_NOW_MS - 2 * 60 * 60 * 1000,
        id: "arrival-2",
        journeyId: "journey-3",
        seenAtMs: README_SCREENSHOT_NOW_MS - 90 * 60 * 1000,
        snailId: "golden-1",
        snailName: "Golden Shell Snail",
        text: "Book the greenhouse table for Saturday.",
        todoId: "todo-7"
      },
      {
        arrivedAtMs: README_SCREENSHOT_NOW_MS - 9 * 60 * 60 * 1000,
        id: "arrival-1",
        journeyId: arrivedJourney.id,
        seenAtMs: README_SCREENSHOT_NOW_MS - 7 * 60 * 60 * 1000,
        snailId: "postal-1",
        snailName: "Postal Snail",
        text: "Water propagation jars on the kitchen sill.",
        todoId: "todo-3"
      }
    ],
    eggs: [
      {
        earnedAtMs: README_SCREENSHOT_NOW_MS - 3 * 24 * 60 * 60 * 1000,
        id: "egg-1",
        rarityPool: "earned-basic",
        source: "earned",
        status: "unhatched"
      }
    ],
    inventory: {
      cosmetics: [
        {
          acquiredAtMs: README_SCREENSHOT_NOW_MS - 4 * 24 * 60 * 60 * 1000,
          id: "trail-sparkle",
          name: "Sparkle Trail",
          source: "purchased"
        }
      ]
    },
    journeys: [activeJourney, arrivedJourney],
    onboarding: showOnboarding
      ? {}
      : { completedAtMs: README_SCREENSHOT_NOW_MS - 8 * 24 * 60 * 60 * 1000 },
    purchases: [
      {
        id: "purchase-1",
        productId: "stable-slot-single",
        purchasedAtMs: README_SCREENSHOT_NOW_MS - 4 * 24 * 60 * 60 * 1000
      }
    ],
    reminders: [],
    snails: [
      gardenSnail,
      createReadmeScreenshotSnail({
        experiencePoints: 88,
        id: "postal-1",
        journeysCompleted: 4,
        level: 3,
        name: "Postal Snail",
        speciesId: "postal",
        status: "resting"
      }),
      createReadmeScreenshotSnail({
        experiencePoints: 17,
        id: "barista-1",
        journeysCompleted: 1,
        level: 1,
        name: "Barista Snail",
        speciesId: "barista",
        status: "resting"
      }),
      createReadmeScreenshotSnail({
        experiencePoints: 55,
        id: "comp-sci-1",
        journeysCompleted: 3,
        level: 2,
        name: "Comp Sci Student Snail",
        speciesId: "comp-sci",
        status: "resting"
      }),
      createReadmeScreenshotSnail({
        experiencePoints: 180,
        id: "red-bull-1",
        journeysCompleted: 9,
        level: 5,
        name: "Red Bull Snail",
        speciesId: "red-bull",
        status: "resting"
      }),
      createReadmeScreenshotSnail({
        experiencePoints: 12,
        id: "backwards-1",
        journeysCompleted: 0,
        level: 1,
        name: "Backwards Snail",
        speciesId: "backwards",
        status: "resting"
      })
    ],
    softCurrency: { slime: 145 },
    stableSlots: { purchased: 2 },
    todos: [
      {
        createdAtMs: journeyCreatedAtMs - 15 * 60 * 1000,
        id: "todo-1",
        status: "open",
        text: "Return the borrowed trowel to Mira."
      },
      {
        createdAtMs: README_SCREENSHOT_NOW_MS - 5 * 60 * 60 * 1000,
        id: "todo-2",
        status: "open",
        text: "Choose a birthday fern for Sam."
      },
      {
        createdAtMs: arrivedJourney.createdAtMs - 30 * 60 * 1000,
        id: "todo-3",
        status: "open",
        text: "Water propagation jars on the kitchen sill."
      },
      {
        createdAtMs: README_SCREENSHOT_NOW_MS - 2 * 24 * 60 * 60 * 1000,
        doneAtMs: README_SCREENSHOT_NOW_MS - 6 * 60 * 60 * 1000,
        id: "todo-4",
        status: "done",
        text: "Sweep balcony soil into the planter."
      },
      {
        createdAtMs: README_SCREENSHOT_NOW_MS - 45 * 60 * 1000,
        id: "todo-5",
        status: "open",
        text: "Pack the charger before the train."
      }
    ]
  };
}

function createReadmeScreenshotSnail({
  experiencePoints,
  id,
  journeysCompleted,
  level,
  name,
  speciesId,
  status
}: {
  experiencePoints: number;
  id: string;
  journeysCompleted: number;
  level: number;
  name: string;
  speciesId: SnailSpeciesId;
  status: Snail["status"];
}): Snail {
  const species = getSnailSpecies(speciesId);

  return {
    appearance: { ...species.appearanceTint },
    baseSpeedMetersPerHour: species.baseSpeedMetersPerHour,
    experiencePoints,
    id,
    journeysCompleted,
    level,
    name,
    quirk: species.quirk,
    quirkSeed: `readme-${id}`,
    rarity: species.rarity as SnailRarity,
    reliability: species.reliability,
    speedBand: species.speedBand as SnailSpeedBand,
    speciesId,
    status,
    temperament: species.temperament as SnailTemperament,
    trail: { ...species.trail }
  };
}

function createTrailHistory({
  createdAtMs,
  start,
  target
}: {
  createdAtMs: number;
  start: Coordinate;
  target: Coordinate;
}): TrailHistoryPoint[] {
  const bearingDegrees = initialBearingDegrees(start, target);

  return [0.08, 0.18, 0.28].map((progress, index) => ({
    coordinate: destinationCoordinate({
      bearingDegrees,
      distanceMeters: README_SCREENSHOT_JOURNEY_DISTANCE_METERS * progress,
      from: start
    }),
    recordedAtMs: createdAtMs + (index + 1) * 6 * 60 * 60 * 1000
  }));
}

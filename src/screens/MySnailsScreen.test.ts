import React from "react";
import { StyleSheet } from "react-native";

import {
  createInitialCarrierState,
  createStarterGardenSnail,
  listStableSnails,
  type Egg,
  type Snail
} from "../useCases/localCarrierState";
import { StableFullError } from "../useCases/hatchEgg";
import type { PurchaseProductId } from "../useCases/purchaseInventory";
import { getSnailSpecies } from "../useCases/snailSpecies";
import { MySnailsScreen } from "./MySnailsScreen";

// MySnailsScreen pulls in the games flow (and its native-dep game components)
// just to open the per-snail games hub. This test doesn't exercise games, so
// stub the hook to keep those native modules out of the Jest import graph.
jest.mock("../minigames/SnailGameFlow", () => ({
  useSnailGameFlow: () => ({ open: () => {} })
}));

declare const require: <T = unknown>(id: string) => T;

type TestInstance = {
  props: Record<string, unknown>;
};

type ReactTestRenderer = {
  act: (callback: () => Promise<void> | void) => Promise<void> | void;
  create: (element: React.ReactElement) => {
    root: {
      findByProps: (props: Record<string, unknown>) => TestInstance;
    };
    unmount: () => void;
  };
};

const renderer = require<ReactTestRenderer>("react-test-renderer");

describe("MySnailsScreen", () => {
  it("keeps a hatched barista snail reveal sprite visible before animation settles", async () => {
    const carrierState = createInitialCarrierState();
    const egg: Egg = {
      earnedAtMs: 1,
      id: "egg-1",
      rarityPool: "earned-basic",
      source: "earned",
      status: "unhatched"
    };
    const barista = createBaristaSnail();
    let tree: ReturnType<ReactTestRenderer["create"]> | undefined;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(MySnailsScreen, {
          canPurchase: false,
          carrierState,
          formError: "",
          onBuyProduct: () => undefined,
          onHatchEgg: async () => barista,
          onLevelSelectedSnail: () => undefined,
          onRenameSnail: () => undefined,
          onReleaseSnail: () => undefined,
          onSelectSnail: () => undefined,
          purchaseCatalog: [],
          selectedCanLevel: false,
          selectedSnailId: "garden-1",
          stable: listStableSnails(carrierState),
          unhatchedEggs: [egg]
        })
      );
    });

    const hatchButton = tree?.root.findByProps({
      accessibilityLabel: "Hatch egg-1"
    });

    await renderer.act(async () => {
      (hatchButton?.props.onPress as () => void)();
      await Promise.resolve();
    });

    const revealSpriteFrame = tree?.root.findByProps({
      testID: "hatch-reveal-sprite-frame"
    });
    const revealStyle = StyleSheet.flatten(revealSpriteFrame?.props.style) as
      | { opacity?: unknown }
      | undefined;

    expect(tree?.root.findByProps({ accessibilityLabel: "Barista Snail" }))
      .toBeTruthy();
    expect(revealStyle?.opacity).toBeUndefined();

    renderer.act(() => {
      tree?.unmount();
    });
  });

  it("shows release and add-slot actions when hatching is blocked by a full stable", async () => {
    const egg: Egg = {
      earnedAtMs: 1,
      id: "egg-1",
      rarityPool: "earned-basic",
      source: "earned",
      status: "unhatched"
    };
    const carrierState = {
      ...createInitialCarrierState(),
      eggs: [egg],
      snails: Array.from({ length: 6 }, (_, index) => ({
        ...createStarterGardenSnail(),
        id: `snail-${index + 1}`
      }))
    };
    let boughtProductId: PurchaseProductId | undefined;
    let tree: ReturnType<ReactTestRenderer["create"]> | undefined;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(MySnailsScreen, {
          canPurchase: true,
          carrierState,
          formError: "",
          onBuyProduct: (productId: PurchaseProductId) => {
            boughtProductId = productId;
          },
          onHatchEgg: async () => {
            throw new StableFullError();
          },
          onLevelSelectedSnail: () => undefined,
          onRenameSnail: () => undefined,
          onReleaseSnail: () => undefined,
          onSelectSnail: () => undefined,
          purchaseCatalog: [],
          selectedCanLevel: false,
          selectedSnailId: "snail-1",
          stable: listStableSnails(carrierState),
          unhatchedEggs: [egg]
        })
      );
    });

    const hatchButton = tree?.root.findByProps({
      accessibilityLabel: "Hatch egg-1"
    });

    await renderer.act(async () => {
      (hatchButton?.props.onPress as () => void)();
      await Promise.resolve();
    });

    expect(
      tree?.root.findByProps({
        accessibilityLabel: "Choose a snail to set free"
      })
    ).toBeTruthy();

    const buySlotButton = tree?.root.findByProps({
      accessibilityLabel: "Buy a stable slot"
    });

    renderer.act(() => {
      (buySlotButton?.props.onPress as () => void)();
    });

    expect(boughtProductId).toBe("stable-slot-single");

    renderer.act(() => {
      tree?.unmount();
    });
  });
});

function createBaristaSnail(): Snail {
  const base = createStarterGardenSnail();
  const species = getSnailSpecies("barista");

  return {
    ...base,
    appearance: { ...species.appearanceTint },
    baseSpeedMetersPerHour: species.baseSpeedMetersPerHour,
    id: "snail-barista",
    name: species.displayName,
    quirk: species.quirk,
    rarity: species.rarity,
    reliability: species.reliability,
    speciesId: species.id,
    temperament: species.temperament,
    trail: { ...species.trail }
  };
}

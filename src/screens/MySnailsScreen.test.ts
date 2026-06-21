import React from "react";
import { StyleSheet } from "react-native";

import {
  createInitialCarrierState,
  createStarterGardenSnail,
  listStableSnails,
  type Egg,
  type Snail
} from "../useCases/localCarrierState";
import { getSnailSpecies } from "../useCases/snailSpecies";
import { MySnailsScreen } from "./MySnailsScreen";

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

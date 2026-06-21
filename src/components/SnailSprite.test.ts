import React from "react";

import { SNAIL_SPECIES_CATALOG } from "../useCases/snailSpecies";
import { SNAIL_SPRITE_ASSETS, SnailSprite } from "./SnailSprite";

declare const require: <T = unknown>(id: string) => T;

const fs = require<{
  readFileSync: (path: string) => unknown;
}>("fs");
const { PNG } = require<{
  PNG: {
    sync: {
      read: (input: unknown) => {
        data: Uint8Array;
        height: number;
        width: number;
      };
    };
  };
}>("pngjs");

type ReactTestRenderer = {
  act: (callback: () => void) => void;
  create: (element: React.ReactElement) => {
    root: {
      findByProps: (props: Record<string, unknown>) => unknown;
    };
    toJSON: () => unknown;
    unmount: () => void;
  };
};

const renderer = require<ReactTestRenderer>("react-test-renderer");

describe("SnailSprite", () => {
  it("has one bundled sprite asset for every catalog species", () => {
    const catalogIds = SNAIL_SPECIES_CATALOG.map((species) => species.id).sort();
    const manifestIds = Object.keys(SNAIL_SPRITE_ASSETS).sort();

    expect(manifestIds).toEqual(catalogIds);
    for (const species of SNAIL_SPECIES_CATALOG) {
      expect(SNAIL_SPRITE_ASSETS[species.id]).toBeTruthy();
    }
  });

  it("uses visible, non-transparent sprite files for every species", () => {
    for (const species of SNAIL_SPECIES_CATALOG) {
      const png = PNG.sync.read(
        fs.readFileSync(`assets/snails/${species.id}.png`)
      );
      let visiblePixels = 0;

      for (let index = 3; index < png.data.length; index += 4) {
        if (png.data[index] > 8) {
          visiblePixels += 1;
        }
      }

      const visibleRatio = visiblePixels / (png.width * png.height);

      expect(visibleRatio).toBeGreaterThan(0.01);
    }
  });

  it("renders a species image without crashing", () => {
    let tree: ReturnType<ReactTestRenderer["create"]> | undefined;

    renderer.act(() => {
      tree = renderer.create(
        React.createElement(SnailSprite, {
          size: 48,
          speciesId: "garden",
          walking: false
        })
      );
    });

    expect(
      tree?.root.findByProps({ accessibilityLabel: "Garden Snail" })
    ).toBeTruthy();

    renderer.act(() => {
      tree?.unmount();
    });
  });
});

import {
  buildMapStyleUrl,
  coerceMapSkinId,
  DEMO_MAP_STYLE_URL,
  MAP_SKIN_OPTIONS
} from "./mapSkins";

describe("map skins", () => {
  it("builds ready-made MapTiler style URLs from the selected skin", () => {
    expect(
      buildMapStyleUrl({
        mapTilerKey: "abc 123",
        selectedSkinId: "streets"
      })
    ).toBe(
      "https://api.maptiler.com/maps/streets-v2/style.json?key=abc%20123"
    );
    expect(
      buildMapStyleUrl({
        mapTilerKey: "abc",
        selectedSkinId: "outdoor"
      })
    ).toBe("https://api.maptiler.com/maps/outdoor-v2/style.json?key=abc");
    expect(
      buildMapStyleUrl({
        mapTilerKey: "abc",
        selectedSkinId: "dark"
      })
    ).toBe("https://api.maptiler.com/maps/dataviz-dark/style.json?key=abc");
  });

  it("falls back to the keyless demo style when no MapTiler key is present", () => {
    expect(
      buildMapStyleUrl({
        fallbackStyleUrl: "https://example.com/custom-style.json",
        mapTilerKey: "",
        selectedSkinId: "dark"
      })
    ).toBe("https://example.com/custom-style.json");
    expect(
      buildMapStyleUrl({
        selectedSkinId: "outdoor"
      })
    ).toBe(DEMO_MAP_STYLE_URL);
  });

  it("coerces persisted skin ids to a known option", () => {
    expect(coerceMapSkinId("dark")).toBe("dark");
    expect(coerceMapSkinId("missing")).toBe("streets");
    expect(coerceMapSkinId(undefined)).toBe("streets");
    expect(MAP_SKIN_OPTIONS.map((skin) => skin.id)).toEqual([
      "streets",
      "outdoor",
      "dark"
    ]);
  });
});

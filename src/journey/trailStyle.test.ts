import {
  buildTrailLineProperties,
  REMAINING_PATH_STYLE
} from "./trailStyle";

describe("trail map styling", () => {
  it("makes pale species slime visible while preserving its tint", () => {
    expect(
      buildTrailLineProperties({
        segmentOpacity: 0.12,
        speciesTrailColor: "#f5f8ed"
      })
    ).toEqual({
      casingColor: "rgba(248, 246, 237, 0.88)",
      highlightColor: "rgba(253, 252, 245, 0.24)",
      lineColor: "rgba(169, 201, 193, 0.46)"
    });
  });

  it("keeps saturated species slime bright and opaque", () => {
    expect(
      buildTrailLineProperties({
        segmentOpacity: 0.7,
        speciesTrailColor: "#b24836"
      })
    ).toMatchObject({
      casingColor: "rgba(248, 246, 237, 0.88)",
      highlightColor: "rgba(253, 252, 245, 0.42)",
      lineColor: "rgba(178, 72, 54, 0.94)"
    });
  });

  it("keeps the remaining path dashed but legible", () => {
    expect(REMAINING_PATH_STYLE).toEqual({
      casingColor: "rgba(248, 246, 237, 0.72)",
      casingWidth: 7,
      lineColor: "rgba(70, 86, 78, 0.78)",
      lineDasharray: [2, 3],
      lineWidth: 3
    });
  });
});

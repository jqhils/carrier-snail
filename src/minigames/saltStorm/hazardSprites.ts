import type { ImageSourcePropType } from "react-native";

import type { HazardKind } from "./saltStormEngine";

// To use real sprite art instead of the drawn shapes: drop PNGs in
// assets/hazards/ and UNCOMMENT the matching line(s) below. Any kind left out
// keeps its drawn version, so you can mix and match (e.g. a real salt sprite
// while the bomb stays drawn). Each PNG is rendered centered and rotates as it
// falls — a single static image is enough, no sprite sheet needed.
// Recommended: ~64x64 px, transparent background, the object roughly filling
// the frame. (Leaving a line commented while its PNG is missing keeps the build
// working — only uncomment a line once that file actually exists.)
export const HAZARD_SPRITES: Partial<Record<HazardKind, ImageSourcePropType>> = {
  salt: require("../../../assets/hazards/salt.png"),
  // bomb: require("../../../assets/hazards/bomb.png"),
  // poison: require("../../../assets/hazards/poison.png")
};

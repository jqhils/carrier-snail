import { colors } from "./colors";

// Two depth flavors:
//  - pixelShadow: a HARD offset with zero blur — the signature sticker/pixel
//    look. iOS renders the hard edge; Android can't do shadowRadius:0, so it
//    falls back to a small `elevation` (for true cross-platform chunky depth on
//    buttons, use the layered-bevel-View technique instead of relying on this).
//  - softShadow: kept for map overlays (FAB, markers), where a hard black edge
//    directly over the basemap tiles would look dirty.
export const pixelShadow = {
  elevation: 4,
  shadowColor: colors.pixelShadow,
  shadowOffset: { height: 3, width: 0 },
  shadowOpacity: 1,
  shadowRadius: 0
} as const;

export const softShadow = {
  elevation: 3,
  shadowColor: colors.pixelShadow,
  shadowOffset: { height: 2, width: 0 },
  shadowOpacity: 0.18,
  shadowRadius: 6
} as const;

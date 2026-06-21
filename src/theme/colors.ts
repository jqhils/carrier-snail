// Carrier Snail palette — hybrid "pixel + vibrant".
//
// A bright, candy-saturated MapleStory-like base on a LIGHT background, with
// pixel-art flair. Neutrals stay tinted (warm cream / plum ink) — never pure
// #fff / #000 — so the candy accents pop without eye strain.
//
// `palette` holds the raw "crayons" (module-private). Everything outside this
// file consumes the semantic `colors` roles below, never the raw hex.
//
// Old (calm sage) -> new token crosswalk, for the migration:
//   #f4f0e3 / #edf1e8 / #eef1e8 (app bg)        -> colors.background
//   #f8f6ed / #f7f6ef / #f5f2e8 (surface)       -> colors.surface
//   #25332e / #26352f (ink)                     -> colors.textPrimary
//   #56645e / #64736c / #6d746d (muted)         -> colors.textMuted
//   #3f6d5b / #315547 / #2f604e (primary sage)  -> colors.primary  (grape)
//   #365c8d / #294870 (button blue)             -> colors.secondary (sky)
//   #a13d2d / #b24836 (warm accent / error)     -> colors.accentWarm OR colors.danger (judge per use)
//   #7c8580 (disabled)                          -> colors.disabledFill
//   rgba(63,109,91,0.x) (hairline borders)      -> colors.borderHairline
//   #ffffff / #f8fafc (button text)             -> colors.textOnAccent

const palette = {
  // Neutrals — warm/cool tinted, never pure.
  cream: "#fdf6e9", // app background (warm paper)
  creamSunk: "#f3e7cf", // recessed wells, board backgrounds
  panel: "#fffdf7", // card / sheet fill (a hair brighter than bg)
  ink: "#2a2336", // primary text — cool plum near-black (NOT #000)
  inkMuted: "#6f6680", // secondary text
  inkFaint: "#a89fb8", // disabled text / placeholders

  // Candy accents + their deep "bevel" tones (chunky-button shadow blocks).
  grape: "#7c5cff",
  grapeDeep: "#5a3fd6",
  grapeSoft: "#ece6ff",
  sky: "#37b6e9",
  skyDeep: "#1d8fc4",
  skySoft: "#dcf2fb",
  hotPink: "#ff5da2",
  pinkDeep: "#e23e84",
  pinkSoft: "#ffe1ee",
  lime: "#8fd14f",
  limeDeep: "#5fa233",
  limeSoft: "#e8f6d6",
  gold: "#ffc83d",
  goldDeep: "#e0a313",
  goldSoft: "#fff3d4",
  tangerine: "#ff8a3d",
  tangerineDeep: "#d96a1b",

  // Status.
  successGreen: "#3fb56b",
  dangerRed: "#ef4d5a",
  dangerDeep: "#c92f3c",

  // Structure.
  borderInk: "#2a2336", // chunky pixel border = same plum-ink as text
  borderSoft: "rgba(42, 35, 54, 0.14)", // hairline dividers
  shadowInk: "#2a2336", // hard-offset "pixel shadow" color (no blur)
  disabled: "#d9d0c4",
  disabledDeep: "#bcb2a3",

  // On-dark / overlays.
  paperWhite: "#f3eee4", // text on the few dark map overlays
  scrimPlum: "rgba(34, 27, 48, 0.46)", // modal backdrops
  overlayDark: "rgba(30, 24, 42, 0.9)", // dark chips over the live map
  white: "#ffffff" // on-accent text fill only
} as const;

export const colors = {
  // Backgrounds + overlays.
  background: palette.cream,
  backgroundSunken: palette.creamSunk,
  surface: palette.panel,
  surfaceAlt: palette.creamSunk,
  surfaceSelected: palette.grapeSoft,
  scrim: palette.scrimPlum,
  mapOverlay: palette.overlayDark,

  // Text.
  textPrimary: palette.ink,
  textMuted: palette.inkMuted,
  textDisabled: palette.inkFaint,
  textOnAccent: palette.white,
  textOnDark: palette.paperWhite,

  // Primary (CTA) — grape.
  primary: palette.grape,
  primaryPressed: palette.grapeDeep,
  primaryBevel: palette.grapeDeep,
  primarySoft: palette.grapeSoft,

  // Secondary — candy sky.
  secondary: palette.sky,
  secondaryPressed: palette.skyDeep,
  secondaryBevel: palette.skyDeep,
  secondarySoft: palette.skySoft,

  // Decorative accents (badges, coins, highlights) + bevels + soft fills.
  accentPink: palette.hotPink,
  accentPinkBevel: palette.pinkDeep,
  accentPinkSoft: palette.pinkSoft,
  accentLime: palette.lime,
  accentLimeBevel: palette.limeDeep,
  accentLimeSoft: palette.limeSoft,
  accentGold: palette.gold,
  accentGoldBevel: palette.goldDeep,
  accentGoldSoft: palette.goldSoft,
  accentWarm: palette.tangerine,
  accentWarmBevel: palette.tangerineDeep,

  // Status.
  success: palette.successGreen,
  danger: palette.dangerRed,
  dangerPressed: palette.dangerDeep,
  dangerBevel: palette.dangerDeep,
  warning: palette.gold,

  // Structure.
  border: palette.borderInk,
  borderHairline: palette.borderSoft,
  pixelShadow: palette.shadowInk,
  disabledFill: palette.disabled,
  disabledBevel: palette.disabledDeep,

  // Rarity ramp (maps the existing rarity strings).
  rarityCommon: palette.inkMuted,
  rarityUncommon: palette.lime,
  rarityRare: palette.sky,
  rarityMythic: palette.gold,
  rarityCursed: palette.hotPink
} as const;

export type ColorToken = keyof typeof colors;

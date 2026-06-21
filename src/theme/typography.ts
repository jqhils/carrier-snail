import type { TextStyle } from "react-native";

// Two families, loaded at app root via useFonts (see App.tsx). The keys here
// MUST match the @expo-google-fonts export names passed to useFonts verbatim.
//
//  - pixel  (Press Start 2P): titles, buttons, labels, scores, tab labels.
//    SINGLE WEIGHT — fontWeight is ignored, so hierarchy comes from size +
//    color only. Renders ~1.6x wider than system, so pixel sizes are kept
//    deliberately small (a 24px system title becomes ~16px pixel) with
//    generous lineHeight + a little letterSpacing.
//  - body / bodyBold (Fredoka): body, list text, paragraphs, and dense
//    numerals (e.g. 2048 tiles) where Press Start 2P is far too wide.
export const fontFamily = {
  pixel: "PressStart2P_400Regular",
  body: "Fredoka_600SemiBold",
  bodyBold: "Fredoka_700Bold"
} as const;

// The type scale. Spread a token into a style and add `color`:
//   { ...text.pixelTitle, color: colors.textPrimary }
// Rule of thumb: fixed/short/decorative -> pixel; variable-length, long-form,
// or dense numerals -> body.
export const text = {
  // Pixel (Press Start 2P) — no fontWeight; size + color carry hierarchy.
  pixelHero: { fontFamily: fontFamily.pixel, fontSize: 20, letterSpacing: 0.5, lineHeight: 30 },
  pixelTitle: { fontFamily: fontFamily.pixel, fontSize: 16, letterSpacing: 0.5, lineHeight: 24 },
  pixelHeading: { fontFamily: fontFamily.pixel, fontSize: 13, letterSpacing: 0.5, lineHeight: 20 },
  pixelButton: { fontFamily: fontFamily.pixel, fontSize: 12, letterSpacing: 0.5, lineHeight: 18 },
  pixelLabel: { fontFamily: fontFamily.pixel, fontSize: 10, letterSpacing: 0.5, lineHeight: 16 },
  pixelScore: { fontFamily: fontFamily.pixel, fontSize: 18, letterSpacing: 0.5, lineHeight: 24 },
  pixelTab: { fontFamily: fontFamily.pixel, fontSize: 8, letterSpacing: 0.3, lineHeight: 12 },
  pixelMicro: { fontFamily: fontFamily.pixel, fontSize: 7, letterSpacing: 0.3, lineHeight: 11 },

  // Body (Fredoka) — keep close to current system sizes for readability.
  bodyLg: { fontFamily: fontFamily.body, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fontFamily.body, fontSize: 14, lineHeight: 20 },
  bodySm: { fontFamily: fontFamily.body, fontSize: 12, lineHeight: 16 },
  bodyXs: { fontFamily: fontFamily.body, fontSize: 11, lineHeight: 15 },
  bodyStrongLg: { fontFamily: fontFamily.bodyBold, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.bodyBold, fontSize: 14, lineHeight: 20 },
  bodyStrongSm: { fontFamily: fontFamily.bodyBold, fontSize: 12, lineHeight: 16 },
  numberLg: { fontFamily: fontFamily.bodyBold, fontSize: 44, lineHeight: 48 }
} as const satisfies Record<string, TextStyle>;

export type TextToken = keyof typeof text;

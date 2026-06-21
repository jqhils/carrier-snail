import { StyleSheet } from "react-native";

import { colors, pixelShadow, radii, softShadow, text } from "../theme";

export const styles = StyleSheet.create({
  backgroundLocationButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.border,
    borderBottomWidth: 4,
    borderRadius: radii.sm,
    borderWidth: 2,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 68,
    paddingHorizontal: 12
  },
  backgroundLocationButtonEnabled: {
    backgroundColor: colors.secondary
  },
  backgroundLocationButtonPressed: {
    backgroundColor: colors.primaryPressed
  },
  backgroundLocationButtonText: {
    ...text.pixelLabel,
    color: colors.textOnAccent
  },
  backgroundLocationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  },
  backgroundLocationText: {
    ...text.bodySm,
    color: colors.textMuted,
    flex: 1
  },
  buyButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderBottomWidth: 4,
    borderRadius: radii.sm,
    borderWidth: 2,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 60,
    paddingHorizontal: 10
  },
  buyButtonDisabled: {
    backgroundColor: colors.disabledFill
  },
  buyButtonPressed: {
    backgroundColor: colors.secondaryPressed
  },
  buyButtonText: {
    ...text.pixelLabel,
    color: colors.textOnAccent
  },
  composerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 12
  },
  controls: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    borderWidth: 2,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    ...pixelShadow
  },
  controlsContent: {
    paddingBottom: 22,
    paddingHorizontal: 18
  },
  demoLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
  demoLegendItem: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    flexDirection: "row",
    gap: 6,
    minHeight: 30,
    paddingHorizontal: 9
  },
  demoLegendSwatch: {
    borderRadius: 5,
    height: 10,
    width: 10
  },
  demoLegendText: {
    ...text.bodyStrongSm,
    color: colors.textPrimary,
    maxWidth: 124
  },
  eggCopy: {
    flex: 1,
    minWidth: 0
  },
  eggList: {
    borderTopColor: colors.borderHairline,
    borderTopWidth: 1,
    gap: 8,
    marginTop: 10,
    paddingTop: 10
  },
  eggOdds: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 2
  },
  eggRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  eggTitle: {
    ...text.bodyStrongSm,
    color: colors.textPrimary
  },
  errorText: {
    ...text.bodySm,
    color: colors.danger,
    marginTop: 8
  },
  hatchButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderBottomWidth: 4,
    borderRadius: radii.sm,
    borderWidth: 2,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 68,
    paddingHorizontal: 10
  },
  hatchButtonPressed: {
    backgroundColor: colors.secondaryPressed
  },
  hatchButtonText: {
    ...text.pixelLabel,
    color: colors.textOnAccent
  },
  hiddenSurface: {
    display: "none"
  },
  inFlightCopy: {
    flex: 1,
    minWidth: 0
  },
  inFlightItem: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  inFlightList: {
    gap: 8,
    marginTop: 10
  },
  inFlightSnail: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 2
  },
  inFlightText: {
    ...text.bodyStrong,
    color: colors.textPrimary
  },
  levelButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.border,
    borderBottomWidth: 4,
    borderRadius: radii.sm,
    borderWidth: 2,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 76,
    paddingHorizontal: 10
  },
  levelButtonDisabled: {
    backgroundColor: colors.disabledFill
  },
  levelButtonPressed: {
    backgroundColor: colors.primaryPressed
  },
  levelButtonText: {
    ...text.pixelLabel,
    color: colors.textOnAccent
  },
  levelRow: {
    alignItems: "center",
    borderTopColor: colors.borderHairline,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    paddingTop: 10
  },
  levelText: {
    ...text.bodyStrongSm,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0
  },
  mapHint: {
    backgroundColor: colors.mapOverlay,
    borderRadius: radii.sm,
    bottom: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
    right: 10
  },
  mapHintText: {
    ...text.bodySm,
    color: colors.textOnDark,
    textAlign: "center"
  },
  mapNotice: {
    alignItems: "center",
    backgroundColor: colors.scrim,
    bottom: 0,
    justifyContent: "center",
    left: 0,
    padding: 20,
    position: "absolute",
    right: 0,
    top: 0
  },
  mapNoticeBody: {
    ...text.body,
    color: colors.textOnDark,
    marginTop: 4,
    textAlign: "center"
  },
  mapNoticeTitle: {
    ...text.pixelHeading,
    color: colors.textOnDark
  },
  mapShell: {
    flex: 1
  },
  mapSurface: {
    flex: 1
  },
  mapToggle: {
    backgroundColor: colors.mapOverlay,
    borderRadius: radii.lg,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
    top: 52
  },
  mapTogglePressed: {
    backgroundColor: colors.pixelShadow
  },
  mapToggleText: {
    ...text.bodyStrongSm,
    color: colors.textOnDark
  },
  meta: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 2
  },
  onboardingButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderBottomWidth: 4,
    borderRadius: radii.sm,
    borderWidth: 2,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 38,
    paddingHorizontal: 12
  },
  onboardingButtonPressed: {
    backgroundColor: colors.secondaryPressed
  },
  onboardingButtonText: {
    ...text.pixelButton,
    color: colors.textOnAccent
  },
  onboardingHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  onboardingKicker: {
    ...text.pixelLabel,
    color: colors.accentWarm,
    textTransform: "uppercase"
  },
  onboardingPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    marginTop: 12,
    padding: 10
  },
  onboardingPrivacy: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 9
  },
  onboardingSnailBadge: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  onboardingSnailBadgeText: {
    ...text.pixelHeading,
    color: colors.primary
  },
  onboardingStep: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8
  },
  onboardingStepList: {
    gap: 7,
    marginTop: 10
  },
  onboardingStepNumber: {
    ...text.bodyStrongSm,
    color: colors.primary,
    minWidth: 14
  },
  onboardingStepText: {
    ...text.bodySm,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0
  },
  onboardingTitle: {
    ...text.pixelHeading,
    color: colors.textPrimary,
    marginTop: 2
  },
  onboardingTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  panelHandleHit: {
    alignItems: "center",
    paddingBottom: 10,
    paddingTop: 2
  },
  peekBar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 8
  },
  peekEta: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 2
  },
  peekHandle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 2,
    height: 4,
    width: 34
  },
  peekTextBlock: {
    minWidth: 0
  },
  peekTitle: {
    ...text.bodyStrongLg,
    color: colors.textPrimary
  },
  personalityButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 62,
    paddingHorizontal: 12
  },
  personalityButtonEnabled: {
    backgroundColor: colors.accentGoldSoft,
    borderColor: colors.accentWarm
  },
  personalityButtonPressed: {
    backgroundColor: colors.backgroundSunken
  },
  personalityButtonText: {
    ...text.bodyStrongSm,
    color: colors.textPrimary
  },
  recallButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderBottomWidth: 4,
    borderRadius: radii.sm,
    borderWidth: 2,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 68,
    paddingHorizontal: 10
  },
  recallButtonPressed: {
    backgroundColor: colors.accentPinkSoft
  },
  recallButtonText: {
    ...text.pixelLabel,
    color: colors.danger
  },
  recenterFab: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 2,
    height: 48,
    justifyContent: "center",
    position: "absolute",
    right: 16,
    width: 48,
    ...softShadow
  },
  recenterFabPressed: {
    backgroundColor: colors.backgroundSunken
  },
  reminderInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    color: colors.textPrimary,
    flex: 1,
    ...text.bodyLg,
    minHeight: 44,
    paddingHorizontal: 12
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderBottomWidth: 5,
    borderRadius: radii.md,
    borderWidth: 2,
    minHeight: 44,
    minWidth: 72,
    justifyContent: "center",
    paddingHorizontal: 14
  },
  sendButtonDisabled: {
    backgroundColor: colors.disabledFill
  },
  sendButtonPressed: {
    backgroundColor: colors.secondaryPressed
  },
  sendButtonText: {
    ...text.pixelButton,
    color: colors.textOnAccent
  },
  sheetGrip: {
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 18,
    paddingTop: 10
  },
  sheetScroll: {
    flex: 1
  },
  shopCopy: {
    flex: 1,
    minWidth: 0
  },
  shopDetail: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 2
  },
  shopDisclosure: {
    ...text.bodySm,
    color: colors.textMuted
  },
  shopList: {
    borderTopColor: colors.borderHairline,
    borderTopWidth: 1,
    gap: 9,
    marginTop: 10,
    paddingTop: 10
  },
  shopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  shopTitle: {
    ...text.bodyStrongSm,
    color: colors.textPrimary
  },
  snailMarker: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 2,
    height: 56,
    justifyContent: "center",
    width: 56,
    ...softShadow
  },
  snailMarkerHighlighted: {
    borderColor: colors.primary,
    borderWidth: 3
  },
  snailMarkerPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }]
  },
  stableCapacity: {
    ...text.bodyStrongSm,
    color: colors.textMuted,
    flex: 1,
    marginLeft: 8,
    textAlign: "right"
  },
  stableHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  stablePanel: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    marginTop: 12,
    padding: 10
  },
  stableSnailIdentityRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  stableSnailItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  stableSnailItemBusy: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderHairline
  },
  stableSnailItemPressed: {
    backgroundColor: colors.primarySoft
  },
  stableSnailItemSelected: {
    borderColor: colors.primary,
    borderWidth: 3
  },
  stableSnailList: {
    gap: 8,
    marginTop: 8
  },
  stableSnailMeta: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 3
  },
  stableSnailName: {
    ...text.bodyStrong,
    color: colors.textPrimary,
    flex: 1
  },
  stableSnailStats: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 3
  },
  stableSnailStatus: {
    ...text.bodyStrongSm,
    color: colors.primary
  },
  stableTitle: {
    ...text.pixelHeading,
    color: colors.textPrimary
  },
  statusActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  targetMarker: {
    backgroundColor: colors.secondary,
    borderColor: colors.surface,
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    width: 16
  },
  title: {
    ...text.pixelTitle,
    color: colors.textPrimary
  },
  titleBlock: {
    flex: 1,
    minWidth: 0
  },
  userDot: {
    backgroundColor: colors.secondary,
    borderColor: colors.surface,
    borderRadius: 8,
    borderWidth: 3,
    height: 16,
    width: 16
  },
  userDotHalo: {
    alignItems: "center",
    backgroundColor: colors.secondarySoft,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  warpButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderColor: colors.border,
    borderBottomWidth: 4,
    borderRadius: radii.sm,
    borderWidth: 2,
    minWidth: 86,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  warpLabel: {
    ...text.pixelMicro,
    color: colors.textOnAccent,
    marginTop: 1,
    textTransform: "uppercase"
  },
  warpValue: {
    ...text.pixelHeading,
    color: colors.textOnAccent
  },
  watchActionRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
    marginTop: 10
  },
  watchCarryingLabel: {
    ...text.pixelLabel,
    color: colors.accentWarm,
    marginTop: 12,
    textTransform: "uppercase"
  },
  watchEta: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 10
  },
  watchHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  watchJourneySwatch: {
    borderRadius: 5,
    height: 10,
    width: 10
  },
  watchJourneyTab: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    flexDirection: "row",
    gap: 6,
    minHeight: 30,
    maxWidth: 142,
    paddingHorizontal: 9
  },
  watchJourneyTabPressed: {
    backgroundColor: colors.primarySoft
  },
  watchJourneyTabSelected: {
    borderColor: colors.primary,
    borderWidth: 3
  },
  watchJourneyTabText: {
    ...text.bodyStrongSm,
    color: colors.textPrimary,
    flexShrink: 1
  },
  watchJourneyTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
  watchKicker: {
    ...text.pixelLabel,
    color: colors.accentWarm,
    textTransform: "uppercase"
  },
  watchMeta: {
    ...text.bodySm,
    color: colors.textMuted,
    marginTop: 6
  },
  watchPanel: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    marginTop: 12,
    padding: 12
  },
  watchProgress: {
    ...text.pixelHeading,
    color: colors.primary
  },
  watchProgressPill: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 2,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 54,
    paddingHorizontal: 10
  },
  watchScrubButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    justifyContent: "center",
    minHeight: 30,
    minWidth: 48,
    paddingHorizontal: 8
  },
  watchScrubButtonPressed: {
    backgroundColor: colors.backgroundSunken
  },
  watchScrubButtonSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  watchScrubButtonText: {
    ...text.bodyStrongSm,
    color: colors.textPrimary
  },
  watchScrubRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-start",
    marginTop: 10
  },
  watchShareButton: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderBottomWidth: 4,
    borderRadius: radii.sm,
    borderWidth: 2,
    justifyContent: "center",
    minHeight: 32,
    minWidth: 88,
    paddingHorizontal: 10
  },
  watchShareButtonPressed: {
    backgroundColor: colors.secondaryPressed
  },
  watchShareButtonText: {
    ...text.pixelLabel,
    color: colors.textOnAccent
  },
  watchTitle: {
    ...text.pixelHeading,
    color: colors.textPrimary,
    marginTop: 2
  },
  watchTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  watchTodoText: {
    ...text.bodyStrongLg,
    color: colors.textPrimary,
    marginTop: 4
  },
  watchTrait: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    flexGrow: 1,
    minWidth: 92,
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  watchTraitLabel: {
    ...text.pixelMicro,
    color: colors.textMuted,
    textTransform: "uppercase"
  },
  watchTraitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  watchTraitValue: {
    ...text.bodyStrong,
    color: colors.textPrimary,
    marginTop: 3
  }
});

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  backgroundLocationButton: {
    alignItems: "center",
    backgroundColor: "#3f6d5b",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 68,
    paddingHorizontal: 12
  },
  backgroundLocationButtonEnabled: {
    backgroundColor: "#6a7b70"
  },
  backgroundLocationButtonPressed: {
    backgroundColor: "#315547"
  },
  backgroundLocationButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700"
  },
  backgroundLocationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 10
  },
  backgroundLocationText: {
    color: "#56645e",
    flex: 1,
    fontSize: 12,
    lineHeight: 16
  },
  buyButton: {
    alignItems: "center",
    backgroundColor: "#365c8d",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 60,
    paddingHorizontal: 10
  },
  buyButtonDisabled: {
    backgroundColor: "#7c8580"
  },
  buyButtonPressed: {
    backgroundColor: "#294870"
  },
  buyButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700"
  },
  controls: {
    backgroundColor: "rgba(249, 247, 238, 0.94)",
    borderTopColor: "rgba(38, 51, 46, 0.12)",
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    maxHeight: "76%",
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 14,
    position: "absolute",
    right: 0
  },
  controlsContent: {
    paddingBottom: 2
  },
  composerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 12
  },
  demoLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
  demoLegendItem: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.58)",
    borderColor: "rgba(43, 58, 52, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
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
    color: "#25332e",
    fontSize: 12,
    fontWeight: "700",
    maxWidth: 124
  },
  errorText: {
    color: "#a13d2d",
    fontSize: 13,
    marginTop: 8
  },
  eggCopy: {
    flex: 1,
    minWidth: 0
  },
  eggList: {
    borderTopColor: "rgba(43, 58, 52, 0.12)",
    borderTopWidth: 1,
    gap: 8,
    marginTop: 10,
    paddingTop: 10
  },
  eggOdds: {
    color: "#56645e",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2
  },
  eggRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  eggTitle: {
    color: "#25332e",
    fontSize: 13,
    fontWeight: "700"
  },
  hatchButton: {
    alignItems: "center",
    backgroundColor: "#365c8d",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 68,
    paddingHorizontal: 10
  },
  hatchButtonPressed: {
    backgroundColor: "#294870"
  },
  hatchButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700"
  },
  inFlightItem: {
    alignItems: "center",
    borderColor: "rgba(43, 58, 52, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  inFlightCopy: {
    flex: 1,
    minWidth: 0
  },
  inFlightList: {
    gap: 8,
    marginTop: 10
  },
  inFlightSnail: {
    color: "#5d6d77",
    fontSize: 12,
    marginTop: 2
  },
  inFlightText: {
    color: "#25332e",
    fontSize: 14,
    fontWeight: "600"
  },
  levelButton: {
    alignItems: "center",
    backgroundColor: "#3f6d5b",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 76,
    paddingHorizontal: 10
  },
  levelButtonDisabled: {
    backgroundColor: "#7c8580"
  },
  levelButtonPressed: {
    backgroundColor: "#315547"
  },
  levelButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700"
  },
  levelRow: {
    alignItems: "center",
    borderTopColor: "rgba(43, 58, 52, 0.12)",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    paddingTop: 10
  },
  levelText: {
    color: "#25332e",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    minWidth: 0
  },
  mapHint: {
    backgroundColor: "rgba(20, 28, 24, 0.72)",
    borderRadius: 8,
    bottom: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: "absolute",
    right: 10
  },
  mapHintText: {
    color: "#eef3ec",
    fontSize: 12,
    textAlign: "center"
  },
  mapNotice: {
    alignItems: "center",
    backgroundColor: "rgba(20, 28, 24, 0.55)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    padding: 20,
    position: "absolute",
    right: 0,
    top: 0
  },
  mapNoticeBody: {
    color: "#dfe6df",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center"
  },
  mapNoticeTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700"
  },
  mapShell: {
    flex: 1
  },
  mapSurface: {
    flex: 1
  },
  mapToggle: {
    backgroundColor: "rgba(20, 28, 24, 0.72)",
    borderRadius: 18,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: "absolute",
    top: 52
  },
  mapTogglePressed: {
    backgroundColor: "rgba(20, 28, 24, 0.92)"
  },
  mapToggleText: {
    color: "#f3f7f1",
    fontSize: 13,
    fontWeight: "700"
  },
  snailGlyph: {
    fontSize: 20
  },
  snailMarker: {
    alignItems: "center",
    borderColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  snailMarkerPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.96 }]
  },
  targetMarker: {
    backgroundColor: "#1f5da2",
    borderColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    width: 16
  },
  meta: {
    color: "#56645e",
    fontSize: 13,
    marginTop: 2
  },
  onboardingButton: {
    alignItems: "center",
    backgroundColor: "#365c8d",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 38,
    paddingHorizontal: 12
  },
  onboardingButtonPressed: {
    backgroundColor: "#294870"
  },
  onboardingButtonText: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "800"
  },
  onboardingHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  onboardingKicker: {
    color: "#6d5a46",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  onboardingPanel: {
    backgroundColor: "#f7f6ef",
    borderColor: "rgba(43, 58, 52, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 10
  },
  onboardingPrivacy: {
    color: "#56645e",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 9
  },
  onboardingSnailBadge: {
    alignItems: "center",
    backgroundColor: "#dfeee4",
    borderColor: "rgba(63, 109, 91, 0.26)",
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  onboardingSnailBadgeText: {
    color: "#3f6d5b",
    fontSize: 16,
    fontWeight: "800"
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
    color: "#3f6d5b",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    minWidth: 14
  },
  onboardingStepText: {
    color: "#25332e",
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    minWidth: 0
  },
  onboardingTitle: {
    color: "#25332e",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2
  },
  onboardingTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  personalityButton: {
    alignItems: "center",
    backgroundColor: "#edf1e8",
    borderColor: "rgba(37, 51, 46, 0.18)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 62,
    paddingHorizontal: 12
  },
  personalityButtonEnabled: {
    backgroundColor: "#fff6ef",
    borderColor: "rgba(178, 72, 54, 0.34)"
  },
  personalityButtonPressed: {
    backgroundColor: "#e3ebe2"
  },
  personalityButtonText: {
    color: "#25332e",
    fontSize: 13,
    fontWeight: "800"
  },
  screen: {
    backgroundColor: "#edf1e8",
    flex: 1
  },
  hiddenSurface: {
    display: "none"
  },
  shopCopy: {
    flex: 1,
    minWidth: 0
  },
  shopDetail: {
    color: "#56645e",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2
  },
  shopDisclosure: {
    color: "#6d5a46",
    fontSize: 12,
    lineHeight: 16
  },
  shopList: {
    borderTopColor: "rgba(43, 58, 52, 0.12)",
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
    color: "#25332e",
    fontSize: 13,
    fontWeight: "700"
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#365c8d",
    borderRadius: 8,
    minHeight: 44,
    minWidth: 72,
    justifyContent: "center",
    paddingHorizontal: 14
  },
  sendButtonPressed: {
    backgroundColor: "#294870"
  },
  sendButtonDisabled: {
    backgroundColor: "#7c8580"
  },
  sendButtonText: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "700"
  },
  reminderInput: {
    backgroundColor: "#ffffff",
    borderColor: "rgba(38, 51, 46, 0.18)",
    borderRadius: 8,
    borderWidth: 1,
    color: "#25332e",
    flex: 1,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12
  },
  recallButton: {
    alignItems: "center",
    backgroundColor: "#fff6ef",
    borderColor: "rgba(161, 61, 45, 0.28)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 68,
    paddingHorizontal: 10
  },
  recallButtonPressed: {
    backgroundColor: "#f8e5dc"
  },
  recallButtonText: {
    color: "#a13d2d",
    fontSize: 13,
    fontWeight: "700"
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  statusActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  stableCapacity: {
    color: "#56645e",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 8,
    textAlign: "right"
  },
  stableHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  stablePanel: {
    borderColor: "rgba(43, 58, 52, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
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
    backgroundColor: "#ffffff",
    borderColor: "rgba(63, 109, 91, 0.28)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  stableSnailItemBusy: {
    backgroundColor: "#eef1ed",
    borderColor: "rgba(86, 100, 94, 0.2)"
  },
  stableSnailItemPressed: {
    backgroundColor: "#eef7f1"
  },
  stableSnailItemSelected: {
    borderColor: "#3f6d5b",
    borderWidth: 2
  },
  stableSnailList: {
    gap: 8,
    marginTop: 8
  },
  stableSnailMeta: {
    color: "#56645e",
    fontSize: 12,
    marginTop: 3
  },
  stableSnailName: {
    color: "#25332e",
    flex: 1,
    fontSize: 14,
    fontWeight: "700"
  },
  stableSnailStatus: {
    color: "#3f6d5b",
    fontSize: 12,
    fontWeight: "700"
  },
  stableSnailStats: {
    color: "#6d5a46",
    fontSize: 12,
    marginTop: 3
  },
  stableTitle: {
    color: "#25332e",
    fontSize: 15,
    fontWeight: "700"
  },
  title: {
    color: "#25332e",
    fontSize: 21,
    fontWeight: "700"
  },
  titleBlock: {
    flex: 1,
    minWidth: 0
  },
  warpButton: {
    alignItems: "center",
    backgroundColor: "#25332e",
    borderRadius: 8,
    minWidth: 86,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  warpLabel: {
    color: "#dce7d2",
    fontSize: 11,
    marginTop: 1,
    textTransform: "uppercase"
  },
  warpValue: {
    color: "#fff7dc",
    fontSize: 16,
    fontWeight: "700"
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
    color: "#6d5a46",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0,
    marginTop: 12,
    textTransform: "uppercase"
  },
  watchEta: {
    color: "#56645e",
    fontSize: 12,
    lineHeight: 16,
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
    backgroundColor: "#f7f6ef",
    borderColor: "rgba(43, 58, 52, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 30,
    maxWidth: 142,
    paddingHorizontal: 9
  },
  watchJourneyTabPressed: {
    backgroundColor: "#eef7f1"
  },
  watchJourneyTabSelected: {
    borderColor: "#3f6d5b",
    borderWidth: 2
  },
  watchJourneyTabText: {
    color: "#25332e",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  watchJourneyTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
  watchKicker: {
    color: "#6d5a46",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  watchMeta: {
    color: "#56645e",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6
  },
  watchPanel: {
    backgroundColor: "rgba(248, 245, 235, 0.9)",
    borderColor: "rgba(43, 58, 52, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 12
  },
  watchProgress: {
    color: "#3f6d5b",
    fontSize: 15,
    fontWeight: "900"
  },
  watchProgressPill: {
    alignItems: "center",
    backgroundColor: "#dfeee4",
    borderColor: "rgba(63, 109, 91, 0.22)",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 54,
    paddingHorizontal: 10
  },
  watchScrubButton: {
    alignItems: "center",
    backgroundColor: "#edf1e8",
    borderColor: "rgba(37, 51, 46, 0.16)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 30,
    minWidth: 48,
    paddingHorizontal: 8
  },
  watchScrubButtonPressed: {
    backgroundColor: "#dfe9df"
  },
  watchScrubButtonSelected: {
    backgroundColor: "#dfeee4",
    borderColor: "#3f6d5b"
  },
  watchScrubButtonText: {
    color: "#25332e",
    fontSize: 12,
    fontWeight: "800"
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
    backgroundColor: "#365c8d",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 32,
    minWidth: 88,
    paddingHorizontal: 10
  },
  watchShareButtonPressed: {
    backgroundColor: "#294870"
  },
  watchShareButtonText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700"
  },
  watchTitle: {
    color: "#25332e",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2
  },
  watchTitleBlock: {
    flex: 1,
    minWidth: 0
  },
  watchTodoText: {
    color: "#25332e",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
    marginTop: 4
  },
  watchTrait: {
    backgroundColor: "#f1eee4",
    borderColor: "rgba(43, 58, 52, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 92,
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  watchTraitLabel: {
    color: "#6d746d",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  watchTraitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  watchTraitValue: {
    color: "#25332e",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 3
  }
});

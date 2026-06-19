import { Camera, Map } from "@maplibre/maplibre-react-native";
import { Canvas, Circle, Line, vec } from "@shopify/react-native-skia";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  LayoutChangeEvent,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { ExpoBackgroundLocationController } from "./src/background/expoBackgroundLocationController";
import {
  coerceTimeWarpFactor,
  createPhaseZeroJourney,
  getAllowedTimeWarpFactors,
  getCrawlFrame
} from "./src/journey/snailCrawl";
import type { Coordinate } from "./src/journey/snailCrawl";
import { SupabaseAnonymousAuthProvider } from "./src/backend/supabaseAnonymousAuthProvider";
import { SupabaseCarrierRepository } from "./src/backend/supabaseCarrierRepository";
import {
  createCarrierSupabaseClient,
  installSupabaseAutoRefresh
} from "./src/backend/supabaseClient";
import { buildFadingTrailSegments } from "./src/journey/trail";
import { completeArrivedJourneys } from "./src/useCases/completeArrivedJourneys";
import {
  BACKGROUND_LOCATION_PERMISSION_COPY,
  configureOptionalBackgroundLocation,
  type BackgroundLocationMode
} from "./src/useCases/configureOptionalBackgroundLocation";
import { createReminderJourney } from "./src/useCases/createReminderJourney";
import { createDemoPersonalityJourneys } from "./src/useCases/demoSnailPersonalities";
import {
  ExpoLocalPushSender,
  requestArrivalNotificationPermission
} from "./src/useCases/expoLocalPushSender";
import {
  createInitialCarrierState,
  getActiveJourney,
  InMemoryCarrierRepository,
  listInFlightReminders,
  listStableSnails
} from "./src/useCases/localCarrierState";
import { loadBackendJourneyState } from "./src/useCases/loadBackendJourneyState";
import {
  resolveAnonymousCarrierUser,
  type BackendCarrierRepository,
  type CarrierUser
} from "./src/useCases/resolveAnonymousCarrierUser";
import { recallReminder } from "./src/useCases/recallReminder";
import { updateForegroundTarget } from "./src/useCases/updateForegroundTarget";

const MOCK_RESTING_POINT: Coordinate = {
  latitude: -33.8688,
  longitude: 151.2093
};

const MAP_STYLE_URL =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL ??
  "https://demotiles.maplibre.org/style.json";

const RUNTIME_MODE = __DEV__ ? "development" : "production";

type Viewport = {
  height: number;
  width: number;
};

type BackendSession = {
  repository: BackendCarrierRepository;
  user: CarrierUser;
};

export default function App() {
  const [target, setTarget] = useState<Coordinate>(MOCK_RESTING_POINT);
  const [locationLabel, setLocationLabel] = useState("Mock resting point");
  const [viewport, setViewport] = useState<Viewport>({ height: 0, width: 0 });
  const [journeyCreatedAtMs, setJourneyCreatedAtMs] = useState(() => Date.now());
  const [carrierState, setCarrierState] = useState(() =>
    createInitialCarrierState()
  );
  const [reminderText, setReminderText] = useState("");
  const [formError, setFormError] = useState("");
  const [requestedSelectedSnailId, setRequestedSelectedSnailId] =
    useState("garden-1");
  const [backendSession, setBackendSession] = useState<BackendSession | null>(
    null
  );
  const [backgroundLocationBusy, setBackgroundLocationBusy] = useState(false);
  const [backgroundLocationMode, setBackgroundLocationMode] =
    useState<BackgroundLocationMode>("foreground-only");
  const [personalityDemoEnabled, setPersonalityDemoEnabled] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [requestedWarp, setRequestedWarp] = useState(100000);
  const allowedWarps = getAllowedTimeWarpFactors(RUNTIME_MODE);
  const timeWarpFactor = coerceTimeWarpFactor(requestedWarp, RUNTIME_MODE);
  const inFlightReminders = listInFlightReminders(carrierState);
  const stable = useMemo(
    () => listStableSnails(carrierState),
    [carrierState]
  );
  const firstRestingSnail = stable.snails.find(
    (snail) => snail.status === "resting"
  );
  const selectedStableSnail = stable.snails.find(
    (snail) =>
      snail.id === requestedSelectedSnailId && snail.status === "resting"
  ) ?? firstRestingSnail;
  const selectedSnailId = selectedStableSnail?.id ?? "";
  const pushSender = useMemo(() => new ExpoLocalPushSender(), []);
  const backgroundLocationController = useMemo(
    () => new ExpoBackgroundLocationController(),
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function readCoarseLocation() {
      const permission = await Location.getForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest
      });

      if (cancelled) {
        return;
      }

      setTarget({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      setJourneyCreatedAtMs(Date.now());
      setLocationLabel("Coarse current location");
    }

    readCoarseLocation().catch(() => {
      setLocationLabel("Mock resting point");
    });
    requestArrivalNotificationPermission().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const supabase = createCarrierSupabaseClient();

    if (!supabase) {
      return undefined;
    }

    let cancelled = false;
    const uninstallAutoRefresh = installSupabaseAutoRefresh(supabase);
    const repository = new SupabaseCarrierRepository(supabase);
    const authProvider = new SupabaseAnonymousAuthProvider(supabase);

    async function loadBackendState() {
      const user = await resolveAnonymousCarrierUser({
        authProvider,
        clock: { now: () => Date.now() },
        repository
      });
      const loaded = await loadBackendJourneyState({
        clock: { now: () => Date.now() },
        repository,
        userId: user.id
      });
      const initialState =
        loaded.carrierState.snails.length > 0
          ? loaded.carrierState
          : createInitialCarrierState();

      if (loaded.carrierState.snails.length === 0) {
        await repository.saveCarrierState(user.id, initialState);
      }

      if (cancelled) {
        return;
      }

      setBackendSession({ repository, user });
      setCarrierState(initialState);
    }

    loadBackendState().catch((error) => {
      if (!cancelled) {
        setFormError(
          error instanceof Error
            ? error.message
            : "Supabase setup failed; using local state."
        );
      }
    });

    return () => {
      cancelled = true;
      uninstallAutoRefresh();
    };
  }, []);

  useEffect(() => {
    if (!backendSession) {
      return undefined;
    }

    let cancelled = false;

    updateForegroundTarget({
      clock: { now: () => Date.now() },
      locationSource: { currentTarget: () => target },
      repository: backendSession.repository,
      userId: backendSession.user.id
    })
      .then((result) => {
        if (!cancelled && result.updatedCount > 0) {
          setCarrierState(result.carrierState);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setFormError(
            error instanceof Error
              ? error.message
              : "Target update failed."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [backendSession, target]);

  const demoJourney = useMemo(
    () =>
      createPhaseZeroJourney({
        createdAtMs: journeyCreatedAtMs,
        target
      }),
    [journeyCreatedAtMs, target]
  );
  const activeJourney = getActiveJourney(carrierState);
  const journey = activeJourney ?? demoJourney;
  const demoPersonalityJourneys = useMemo(
    () =>
      createDemoPersonalityJourneys({
        createdAtMs: journeyCreatedAtMs,
        target
      }),
    [journeyCreatedAtMs, target]
  );
  const activeSnail = activeJourney
    ? carrierState.snails.find((snail) => snail.id === activeJourney.snailId)
    : undefined;
  const visibleCrawls = personalityDemoEnabled
    ? demoPersonalityJourneys
    : [
        {
          id: activeJourney?.id ?? "single-demo",
          journey,
          snail: activeSnail ?? demoPersonalityJourneys[0].snail
        }
      ];

  useEffect(() => {
    const interval = setInterval(() => {
      const timestamp = Date.now();

      setNowMs(timestamp);
      setCarrierState((currentState) => {
        if (backendSession || !getActiveJourney(currentState)) {
          return currentState;
        }

        const repository = new InMemoryCarrierRepository(currentState);
        const result = completeArrivedJourneys({
          clock: { now: () => timestamp },
          pushSender,
          repository,
          timeWarpFactor
        });

        return result.completedCount > 0
          ? persistCompletedState(
              repository.snapshot(),
              backendSession
            )
          : currentState;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [backendSession, pushSender, timeWarpFactor]);

  const crawlOverlays = visibleCrawls.map((crawl, index) => {
    const frame = getCrawlFrame({
      journey: crawl.journey,
      nowMs,
      timeWarpFactor
    });

    return {
      ...crawl,
      frame,
      overlay: projectCrawlToViewport(
        frame.progress,
        viewport,
        personalityDemoEnabled ? (index - 1) * 18 : 0
      )
    };
  });
  const targetOverlay = projectCrawlToViewport(0, viewport);

  function cycleWarp() {
    const currentIndex = allowedWarps.indexOf(timeWarpFactor);
    const nextWarp = allowedWarps[(currentIndex + 1) % allowedWarps.length] ?? 1;
    setRequestedWarp(nextWarp);
  }

  function onMapLayout(event: LayoutChangeEvent) {
    setViewport({
      height: event.nativeEvent.layout.height,
      width: event.nativeEvent.layout.width
    });
  }

  async function sendReminder() {
    try {
      const repository = new InMemoryCarrierRepository(carrierState);

      createReminderJourney(
        { snailId: selectedSnailId || undefined, text: reminderText },
        {
          clock: { now: () => Date.now() },
          locationSource: { currentTarget: () => target },
          repository
        }
      );
      const nextState = repository.snapshot();

      if (backendSession) {
        await backendSession.repository.saveCarrierState(
          backendSession.user.id,
          nextState
        );

        const loaded = await loadBackendJourneyState({
          clock: { now: () => Date.now() },
          repository: backendSession.repository,
          timeWarpFactor,
          userId: backendSession.user.id
        });

        setCarrierState(loaded.carrierState);
      } else {
        setCarrierState(nextState);
      }

      setReminderText("");
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Reminder failed.");
    }
  }

  async function enableBackgroundLocation() {
    setBackgroundLocationBusy(true);

    try {
      const result = await configureOptionalBackgroundLocation({
        controller: backgroundLocationController
      });

      setBackgroundLocationMode(result.mode);

      if (result.mode === "location-denied") {
        setFormError("Location permission denied. Foreground-only mode remains available.");
      } else {
        setFormError("");
      }
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Background location setup failed."
      );
    } finally {
      setBackgroundLocationBusy(false);
    }
  }

  function confirmRecallReminder(reminderId: string) {
    Alert.alert(
      "Recall reminder?",
      "This permanently ends the reminder. The snail returns empty.",
      [
        {
          style: "cancel",
          text: "Keep"
        },
        {
          onPress: () => {
            void recallInFlightReminder(reminderId);
          },
          style: "destructive",
          text: "Recall"
        }
      ]
    );
  }

  async function recallInFlightReminder(reminderId: string) {
    try {
      const repository = new InMemoryCarrierRepository(carrierState);

      await recallReminder(
        { reminderId },
        {
          clock: { now: () => Date.now() },
          pushSender,
          repository
        }
      );
      const nextState = repository.snapshot();

      if (backendSession) {
        await backendSession.repository.saveCarrierState(
          backendSession.user.id,
          nextState
        );

        const loaded = await loadBackendJourneyState({
          clock: { now: () => Date.now() },
          repository: backendSession.repository,
          timeWarpFactor,
          userId: backendSession.user.id
        });

        setCarrierState(loaded.carrierState);
      } else {
        setCarrierState(nextState);
      }

      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Recall failed.");
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.mapShell} onLayout={onMapLayout}>
        <Map
          attributionPosition={{ bottom: 10, right: 10 }}
          logo={false}
          mapStyle={MAP_STYLE_URL}
          style={StyleSheet.absoluteFill}
        >
          <Camera
            initialViewState={{
              center: [target.longitude, target.latitude],
              zoom: 12.7
            }}
          />
        </Map>
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          {crawlOverlays.flatMap(({ id, overlay, snail }) =>
            overlay.trailSegments.map((segment, index) => (
              <Line
                color={hexToRgba(snail.trail.color, segment.opacity * 0.32)}
                key={`${id}-trail-shadow-${index}`}
                p1={vec(segment.from.x, segment.from.y)}
                p2={vec(segment.to.x, segment.to.y)}
                strokeCap="round"
                strokeWidth={10}
              />
            ))
          )}
          {crawlOverlays.flatMap(({ id, overlay, snail }) =>
            overlay.trailSegments.map((segment, index) => (
              <Line
                color={hexToRgba(snail.trail.color, segment.opacity)}
                key={`${id}-trail-shine-${index}`}
                p1={vec(segment.from.x, segment.from.y)}
                p2={vec(segment.to.x, segment.to.y)}
                strokeCap="round"
                strokeWidth={3}
              />
            ))
          )}
          <Circle
            color="rgba(31, 93, 162, 0.2)"
            cx={targetOverlay.target.x}
            cy={targetOverlay.target.y}
            r={18}
          />
          <Circle
            color="#1f5da2"
            cx={targetOverlay.target.x}
            cy={targetOverlay.target.y}
            r={7}
          />
          {crawlOverlays.map(({ id, overlay, snail }) => (
            <Circle
              color={snail.appearance.shellColor}
              cx={overlay.snail.x - 9}
              cy={overlay.snail.y + 4}
              key={`${id}-shell`}
              r={17}
            />
          ))}
          {crawlOverlays.map(({ id, overlay, snail }) => (
            <Circle
              color={snail.appearance.bodyColor}
              cx={overlay.snail.x + 7}
              cy={overlay.snail.y - 2}
              key={`${id}-body`}
              r={13}
            />
          ))}
          {crawlOverlays.map(({ id, overlay }) => (
            <Circle
              color="#fff4d3"
              cx={overlay.snail.x + 12}
              cy={overlay.snail.y - 5}
              key={`${id}-highlight`}
              r={5}
            />
          ))}
          {crawlOverlays.map(({ id, overlay }) => (
            <Line
              color="#3c2a1f"
              key={`${id}-right-eye-stalk`}
              p1={vec(overlay.snail.x + 10, overlay.snail.y - 13)}
              p2={vec(overlay.snail.x + 22, overlay.snail.y - 26)}
              strokeCap="round"
              strokeWidth={2}
            />
          ))}
          {crawlOverlays.map(({ id, overlay }) => (
            <Line
              color="#3c2a1f"
              key={`${id}-left-eye-stalk`}
              p1={vec(overlay.snail.x + 2, overlay.snail.y - 13)}
              p2={vec(overlay.snail.x + 11, overlay.snail.y - 28)}
              strokeCap="round"
              strokeWidth={2}
            />
          ))}
          {crawlOverlays.map(({ id, overlay }) => (
            <Circle
              color="#3c2a1f"
              cx={overlay.snail.x + 23}
              cy={overlay.snail.y - 27}
              key={`${id}-right-eye`}
              r={2.5}
            />
          ))}
          {crawlOverlays.map(({ id, overlay }) => (
            <Circle
              color="#3c2a1f"
              cx={overlay.snail.x + 12}
              cy={overlay.snail.y - 29}
              key={`${id}-left-eye`}
              r={2.5}
            />
          ))}
        </Canvas>
      </View>

      <SafeAreaView style={styles.controls}>
        <View style={styles.statusRow}>
          <View style={styles.titleBlock}>
            <Text numberOfLines={1} style={styles.title}>
              Carrier Snail
            </Text>
            <Text numberOfLines={1} style={styles.meta}>
              {locationLabel}
            </Text>
          </View>
          <View style={styles.statusActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle personality demo trio"
              onPress={() => setPersonalityDemoEnabled((enabled) => !enabled)}
              style={({ pressed }) => [
                styles.personalityButton,
                personalityDemoEnabled ? styles.personalityButtonEnabled : null,
                pressed ? styles.personalityButtonPressed : null
              ]}
            >
              <Text style={styles.personalityButtonText}>
                {personalityDemoEnabled ? "Solo" : "Trio"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cycle debug time warp"
              onPress={cycleWarp}
              style={styles.warpButton}
            >
              <Text style={styles.warpValue}>
                {timeWarpFactor.toLocaleString()}x
              </Text>
              <Text style={styles.warpLabel}>warp</Text>
            </Pressable>
          </View>
        </View>
        {personalityDemoEnabled ? (
          <View style={styles.demoLegend}>
            {demoPersonalityJourneys.map(({ snail }) => (
              <View key={snail.id} style={styles.demoLegendItem}>
                <View
                  style={[
                    styles.demoLegendSwatch,
                    { backgroundColor: snail.trail.color }
                  ]}
                />
                <Text numberOfLines={1} style={styles.demoLegendText}>
                  {snail.name}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.stablePanel}>
          <View style={styles.stableHeaderRow}>
            <Text style={styles.stableTitle}>Stable</Text>
            <Text style={styles.stableCapacity}>
              {stable.capacity.freeCount}/{stable.capacity.totalCount} free,{" "}
              {carrierState.eggs.length} eggs
            </Text>
          </View>
          <View style={styles.stableSnailList}>
            {stable.snails.map((snail) => {
              const selected = snail.id === selectedSnailId;

              return (
                <Pressable
                  accessibilityLabel={`${snail.name}, ${snail.statusLabel}`}
                  accessibilityRole="button"
                  disabled={snail.status !== "resting"}
                  key={snail.id}
                  onPress={() => setRequestedSelectedSnailId(snail.id)}
                  style={({ pressed }) => [
                    styles.stableSnailItem,
                    snail.status === "on-journey"
                      ? styles.stableSnailItemBusy
                      : null,
                    selected ? styles.stableSnailItemSelected : null,
                    pressed ? styles.stableSnailItemPressed : null
                  ]}
                >
                  <View style={styles.stableSnailIdentityRow}>
                    <Text numberOfLines={1} style={styles.stableSnailName}>
                      {snail.name}
                    </Text>
                    <Text style={styles.stableSnailStatus}>
                      {snail.statusLabel}
                    </Text>
                  </View>
                  <Text numberOfLines={1} style={styles.stableSnailMeta}>
                    {snail.carryingText
                      ? `Carrying: ${snail.carryingText}`
                      : selected
                        ? "Selected"
                        : "Ready"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.composerRow}>
          <TextInput
            accessibilityLabel="Reminder text"
            onChangeText={setReminderText}
            onSubmitEditing={sendReminder}
            placeholder="buy milk"
            placeholderTextColor="#7d7a70"
            returnKeyType="send"
            style={styles.reminderInput}
            value={reminderText}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send reminder"
            disabled={!selectedStableSnail}
            onPress={sendReminder}
            style={({ pressed }) => [
              styles.sendButton,
              !selectedStableSnail ? styles.sendButtonDisabled : null,
              pressed ? styles.sendButtonPressed : null
            ]}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </Pressable>
        </View>
        <View style={styles.backgroundLocationRow}>
          <Text style={styles.backgroundLocationText}>
            {BACKGROUND_LOCATION_PERMISSION_COPY}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enable optional background location"
            disabled={
              backgroundLocationBusy ||
              backgroundLocationMode === "background-enabled"
            }
            onPress={enableBackgroundLocation}
            style={({ pressed }) => [
              styles.backgroundLocationButton,
              pressed ? styles.backgroundLocationButtonPressed : null,
              backgroundLocationMode === "background-enabled"
                ? styles.backgroundLocationButtonEnabled
                : null
            ]}
          >
            <Text style={styles.backgroundLocationButtonText}>
              {backgroundLocationMode === "background-enabled"
                ? "On"
                : backgroundLocationBusy
                  ? "..."
                  : "Enable"}
            </Text>
          </Pressable>
        </View>
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        {inFlightReminders.length > 0 ? (
          <View style={styles.inFlightList}>
            {inFlightReminders.map((reminder) => (
              <View key={reminder.reminderId} style={styles.inFlightItem}>
                <View style={styles.inFlightCopy}>
                  <Text numberOfLines={1} style={styles.inFlightText}>
                    {reminder.text}
                  </Text>
                  <Text numberOfLines={1} style={styles.inFlightSnail}>
                    {reminder.snailName}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Recall ${reminder.text}`}
                  onPress={() => confirmRecallReminder(reminder.reminderId)}
                  style={({ pressed }) => [
                    styles.recallButton,
                    pressed ? styles.recallButtonPressed : null
                  ]}
                >
                  <Text style={styles.recallButtonText}>Recall</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

function persistCompletedState(
  state: ReturnType<InMemoryCarrierRepository["snapshot"]>,
  backendSession: BackendSession | null
) {
  if (backendSession) {
    backendSession.repository
      .saveCarrierState(backendSession.user.id, state)
      .catch(() => undefined);
  }

  return state;
}

function projectCrawlToViewport(
  progress: number,
  viewport: Viewport,
  laneOffset = 0
) {
  const width = Math.max(viewport.width, 1);
  const height = Math.max(viewport.height, 1);
  const start = {
    x: width * 0.19,
    y: height * 0.76 + laneOffset
  };
  const target = {
    x: width * 0.74,
    y: height * 0.34 + laneOffset
  };
  const easedProgress = Math.min(1, Math.max(0, progress));

  function pointAt(pointProgress: number) {
    return {
      x: start.x + (target.x - start.x) * pointProgress,
      y: start.y + (target.y - start.y) * pointProgress
    };
  }

  return {
    snail: {
      x: start.x + (target.x - start.x) * easedProgress,
      y: start.y + (target.y - start.y) * easedProgress
    },
    start,
    target,
    trailSegments: buildFadingTrailSegments({
      progress: easedProgress,
      segmentCount: 10
    }).map((segment) => ({
      from: pointAt(segment.fromProgress),
      opacity: segment.opacity,
      to: pointAt(segment.toProgress)
    }))
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const safeAlpha = Math.max(0, Math.min(1, alpha));

  return `rgba(${red}, ${green}, ${blue}, ${safeAlpha})`;
}

const styles = StyleSheet.create({
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
  controls: {
    backgroundColor: "rgba(249, 247, 238, 0.94)",
    borderTopColor: "rgba(38, 51, 46, 0.12)",
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 14,
    position: "absolute",
    right: 0
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
  mapShell: {
    flex: 1
  },
  meta: {
    color: "#56645e",
    fontSize: 13,
    marginTop: 2
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
    fontSize: 13,
    fontWeight: "700"
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
  }
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Map,
  Marker
} from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View
} from "react-native";

import type { BottomTabId } from "../components/TabBar";
import { SnailSprite } from "../components/SnailSprite";
import { colors } from "../theme";
import { styles } from "./mapScreen.styles";
import { ExpoBackgroundLocationController } from "../background/expoBackgroundLocationController";
import {
  coerceTimeWarpFactor,
  getAllowedTimeWarpFactors
} from "../journey/snailCrawl";
import type { Coordinate } from "../journey/snailCrawl";
import {
  buildJourneyPolyline,
  type GeoTrailSegment
} from "../journey/journeyPolyline";
import {
  buildTrailLineProperties,
  REMAINING_PATH_STYLE
} from "../journey/trailStyle";
import { SupabaseAnonymousAuthProvider } from "../backend/supabaseAnonymousAuthProvider";
import { SupabaseCarrierRepository } from "../backend/supabaseCarrierRepository";
import {
  createCarrierSupabaseClient,
  installSupabaseAutoRefresh,
  readCarrierSupabaseConfig
} from "../backend/supabaseClient";
import {
  loadLocalCarrierState,
  persistLocalCarrierState
} from "../backend/localCarrierStateStorage";
import { completeArrivedJourneys } from "../useCases/completeArrivedJourneys";
import {
  hasUnseenArrivals,
  listArrivalInboxItems,
  markArrivalsSeen
} from "../useCases/arrivalInboxUseCases";
import {
  configureOptionalBackgroundLocation,
  disableOptionalBackgroundLocation,
  type BackgroundLocationMode
} from "../useCases/configureOptionalBackgroundLocation";
import {
  ExpoLocalPushSender,
  requestArrivalNotificationPermission
} from "../useCases/expoLocalPushSender";
import { hatchEgg, StableFullError } from "../useCases/hatchEgg";
import {
  buildMapStyleUrl,
  coerceMapSkinId,
  DEFAULT_MAP_SKIN_ID,
  DEMO_MAP_STYLE_URL,
  MAP_SKIN_OPTIONS,
  type MapSkinId
} from "../useCases/mapSkins";
import {
  expThresholdForLevel,
  levelUpCost,
  levelUpSnail
} from "../useCases/levelUpSnail";
import {
  completeOnboarding,
  shouldShowOnboarding
} from "../useCases/onboarding";
import {
  getPurchaseCatalog,
  purchaseInventory,
  type PurchaseProductId
} from "../useCases/purchaseInventory";
import { renameSnail } from "../useCases/renameSnail";
import { releaseSnail } from "../useCases/releaseSnail";
import {
  createInitialCarrierState,
  getActiveJourney,
  InMemoryCarrierRepository,
  listStableSnails,
  type CarrierState
} from "../useCases/localCarrierState";
import {
  createReadmeMapScreenshotConfig,
  type ReadmeScreenshotId
} from "../readmeScreenshots";
import { buildJourneyWatchState } from "../useCases/watchJourneyState";
import { loadBackendJourneyState } from "../useCases/loadBackendJourneyState";
import {
  tryResolveAnonymousCarrierUser,
  type BackendCarrierRepository,
  type CarrierUser
} from "../useCases/resolveAnonymousCarrierUser";
import {
  assignSnailToToDo,
  completeToDo,
  createToDo,
  deleteToDo,
  listToDoItems,
  unassignSnail,
  updateToDo,
  type ToDoListItem
} from "../useCases/todoUseCases";
import { updateForegroundTarget } from "../useCases/updateForegroundTarget";
import {
  creditSnailGameReward,
  type SnailGameReward
} from "../minigames/snailGameReward";
import { SnailGameFlowProvider } from "../minigames/SnailGameFlow";
import { MySnailsScreen } from "./MySnailsScreen";
import { NotificationsScreen } from "./NotificationsScreen";
import { SettingsScreen } from "./SettingsScreen";
import { ToDosScreen } from "./ToDosScreen";

const MOCK_RESTING_POINT: Coordinate = {
  latitude: -33.8688,
  longitude: 151.2093
};

const FALLBACK_MAP_STYLE_URL =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? DEMO_MAP_STYLE_URL;
const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY;
const MAP_SKIN_STORAGE_KEY = "carrier-snail.map-skin";

const RUNTIME_MODE = __DEV__ ? "development" : "production";
const WATCH_SCRUB_STOPS = [
  { label: "Start", progress: 0 },
  { label: "25%", progress: 0.25 },
  { label: "50%", progress: 0.5 },
  { label: "75%", progress: 0.75 }
] as const;

// Draggable snail-details sheet: a fixed-height sheet that translates down so only
// the grip (peek) shows, or sits at 0 (expanded). Two snap points.
const SHEET_EXPANDED_HEIGHT = 400;
const SHEET_PEEK_HEIGHT = 96;
const SHEET_COLLAPSED_OFFSET = SHEET_EXPANDED_HEIGHT - SHEET_PEEK_HEIGHT;

type BackendSession = {
  repository: BackendCarrierRepository;
  user: CarrierUser;
};

type MapScreenProps = {
  activeTab: BottomTabId;
  completeOnboardingSignal: number;
  onGameActiveChange: (active: boolean) => void;
  onOnboardingVisibleChange: (visible: boolean) => void;
  onUnseenNotificationsChange: (hasUnseen: boolean) => void;
  readmeScreenshotId?: ReadmeScreenshotId;
};

export function MapScreen({
  activeTab,
  completeOnboardingSignal,
  onGameActiveChange,
  onOnboardingVisibleChange,
  onUnseenNotificationsChange,
  readmeScreenshotId
}: MapScreenProps) {
  const readmeScreenshotConfig = useMemo(
    () =>
      readmeScreenshotId
        ? createReadmeMapScreenshotConfig(readmeScreenshotId)
        : undefined,
    [readmeScreenshotId]
  );
  const initialDetailsCollapsed =
    !readmeScreenshotConfig?.expandMapDetails;
  const [target, setTarget] = useState<Coordinate>(
    () => readmeScreenshotConfig?.target ?? MOCK_RESTING_POINT
  );
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "failed">(
    "loading"
  );
  const [selectedMapSkinId, setSelectedMapSkinId] =
    useState<MapSkinId>(
      () => readmeScreenshotConfig?.selectedMapSkinId ?? DEFAULT_MAP_SKIN_ID
    );
  const [detailsCollapsed, setDetailsCollapsed] = useState(
    initialDetailsCollapsed
  );
  const [sheetTranslateY] = useState(
    () =>
      new Animated.Value(
        initialDetailsCollapsed ? SHEET_COLLAPSED_OFFSET : 0
      )
  );
  const [sheetDrag] = useState(() => ({ start: 0 }));
  const snapSheet = useCallback(
    (collapse: boolean) => {
      setDetailsCollapsed(collapse);
      Animated.spring(sheetTranslateY, {
        bounciness: 3,
        toValue: collapse ? SHEET_COLLAPSED_OFFSET : 0,
        useNativeDriver: false
      }).start();
    },
    [sheetTranslateY]
  );
  const sheetPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dy) > 4,
        onPanResponderGrant: () => {
          sheetTranslateY.stopAnimation((value) => {
            sheetDrag.start = value;
          });
        },
        onPanResponderMove: (_event, gesture) => {
          const next = Math.max(
            0,
            Math.min(SHEET_COLLAPSED_OFFSET, sheetDrag.start + gesture.dy)
          );
          sheetTranslateY.setValue(next);
        },
        onPanResponderRelease: (_event, gesture) => {
          if (Math.abs(gesture.dy) < 6 && Math.abs(gesture.vy) < 0.2) {
            snapSheet(!detailsCollapsed);
            return;
          }
          const ended = sheetDrag.start + gesture.dy;
          const collapse =
            gesture.vy > 0.4 ||
            (gesture.vy >= -0.4 && ended > SHEET_COLLAPSED_OFFSET / 2);
          snapSheet(collapse);
        }
      }),
    [detailsCollapsed, sheetDrag, sheetTranslateY, snapSheet]
  );
  const cameraRef = useRef<CameraRef>(null);
  // Set briefly when a snail marker is tapped, so the empty-map handler can tell
  // a marker tap apart from a tap on bare map (which deselects + collapses).
  const markerTapGuardRef = useRef(false);
  const [hasLocationFix, setHasLocationFix] = useState(
    Boolean(readmeScreenshotConfig)
  );
  const mapStyleUrl = useMemo(
    () =>
      buildMapStyleUrl({
        fallbackStyleUrl: FALLBACK_MAP_STYLE_URL,
        mapTilerKey: MAPTILER_KEY,
        selectedSkinId: selectedMapSkinId
      }),
    [selectedMapSkinId]
  );
  // The default demotiles style is a keyless placeholder with only low-zoom
  // world data (no streets). Frame it out to the world so it shows something;
  // real MapTiler skins get a city-level view to see the journey.
  const usingPlaceholderBasemap = mapStyleUrl.includes("demotiles.maplibre.org");
  const mapDefaultZoom = usingPlaceholderBasemap ? 1.6 : 13;
  const mapTilerKeyAvailable = !!MAPTILER_KEY?.trim();

  // One-shot recentre. The camera otherwise stays where the user left it (it does
  // NOT auto-follow live updates), so panning isn't fought.
  function recenterOnUser() {
    cameraRef.current?.easeTo({
      center: [target.longitude, target.latitude],
      duration: 500,
      zoom: mapDefaultZoom
    });
  }
  const [carrierState, setCarrierState] = useState(() =>
    readmeScreenshotConfig?.carrierState ?? createInitialCarrierState()
  );
  const [toDoText, setToDoText] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<string | undefined>(
    undefined
  );
  const [editingTodoText, setEditingTodoText] = useState("");
  const [formError, setFormError] = useState("");
  const [requestedSelectedSnailId, setRequestedSelectedSnailId] =
    useState(readmeScreenshotConfig?.selectedSnailId ?? "garden-1");
  const [backendSession, setBackendSession] = useState<BackendSession | null>(
    null
  );
  // How player data is being persisted, surfaced so a silent fall-back to
  // device-only storage is never invisible again.
  //   "pending" — still resolving the backend on launch
  //   "cloud"   — Supabase session active; cloud is the source of truth
  //   "local"   — Supabase not configured; saving to this device only
  //   "error"   — Supabase configured but unreachable; saving to this device
  const [persistenceMode, setPersistenceMode] = useState<
    "pending" | "cloud" | "local" | "error"
  >(() => {
    if (readmeScreenshotConfig) {
      return "cloud";
    }

    // No Supabase env in this build → device-local storage is the intended
    // (and only) persistence; otherwise we're still resolving the backend.
    return readCarrierSupabaseConfig() ? "pending" : "local";
  });
  // Set once a cloud session hydrates state, so a slower local-cache read can't
  // clobber the authoritative cloud snapshot.
  const hydratedFromBackendRef = useRef(false);
  const [backgroundLocationBusy, setBackgroundLocationBusy] = useState(false);
  const [backgroundLocationMode, setBackgroundLocationMode] =
    useState<BackgroundLocationMode>("foreground-only");
  const [selectedWatchJourneyId, setSelectedWatchJourneyId] = useState<
    string | null | undefined
  >(readmeScreenshotConfig?.selectedJourneyId);
  const [watchScrubProgress, setWatchScrubProgress] = useState<
    number | undefined
  >(undefined);
  const [nowMs, setNowMs] = useState(
    () => readmeScreenshotConfig?.nowMs ?? Date.now()
  );
  const [gameActive, setGameActive] = useState(false);
  const [requestedWarp, setRequestedWarp] = useState(
    readmeScreenshotConfig ? 1 : 100000
  );
  const allowedWarps = getAllowedTimeWarpFactors(RUNTIME_MODE);
  const timeWarpFactor = coerceTimeWarpFactor(requestedWarp, RUNTIME_MODE);
  const stable = useMemo(
    () => listStableSnails(carrierState),
    [carrierState]
  );
  const toDoItems = useMemo(
    () =>
      listToDoItems({
        clock: { now: () => nowMs },
        state: carrierState
      }),
    [carrierState, nowMs]
  );
  const arrivalItems = useMemo(
    () => listArrivalInboxItems(carrierState),
    [carrierState]
  );
  const restingStableSnails = stable.snails.filter(
    (snail) => snail.status === "resting"
  );
  const firstRestingSnail = restingStableSnails[0];
  const selectedStableSnail = stable.snails.find(
    (snail) => snail.id === requestedSelectedSnailId
  ) ?? firstRestingSnail ?? stable.snails[0];
  const selectedRestingStableSnail = restingStableSnails.find(
    (snail) => snail.id === requestedSelectedSnailId
  ) ?? firstRestingSnail;
  const selectedSnailId = selectedStableSnail?.id ?? "";
  const selectedOwnedSnail = carrierState.snails.find(
    (snail) => snail.id === selectedSnailId
  );
  const selectedLevelCost = selectedOwnedSnail
    ? levelUpCost(selectedOwnedSnail)
    : 0;
  const selectedCanLevel =
    !!selectedOwnedSnail &&
    selectedOwnedSnail.status === "resting" &&
    selectedOwnedSnail.experiencePoints >=
      expThresholdForLevel(selectedOwnedSnail.level) &&
    carrierState.softCurrency.slime >= selectedLevelCost;
  const unhatchedEggs = carrierState.eggs.filter(
    (egg) => egg.status === "unhatched"
  );
  const onboardingVisible = shouldShowOnboarding(carrierState);

  useEffect(() => {
    onOnboardingVisibleChange(onboardingVisible);
  }, [onboardingVisible, onOnboardingVisibleChange]);

  useEffect(() => {
    onGameActiveChange(gameActive);
  }, [gameActive, onGameActiveChange]);
  const purchaseCatalog = useMemo(() => getPurchaseCatalog(), []);
  const pushSender = useMemo(() => new ExpoLocalPushSender(), []);
  const backgroundLocationController = useMemo(
    () => new ExpoBackgroundLocationController(),
    []
  );
  // Monotonic id for the latest mutation + a chain to serialize backend writes,
  // so an older/slower reconcile can't clobber newer optimistic state and
  // back-to-back mutations don't interleave on the server.
  const persistSeqRef = useRef(0);
  const persistChainRef = useRef<Promise<void>>(Promise.resolve());

  const persistNextCarrierState = useCallback(
    (nextState: CarrierState): Promise<void> => {
      // Optimistic: reflect the change in the UI and the device cache
      // immediately, before any network I/O. This is what makes adding a to-do
      // or sending/recalling a snail feel instant — previously the UI didn't
      // update until a full Supabase save + reload round-trip completed. The
      // cloud save reconciles in the background. In local mode this is the only
      // persistence, so it must survive restarts regardless.
      const seq = (persistSeqRef.current += 1);
      setCarrierState(nextState);
      void persistLocalCarrierState(nextState);

      if (!backendSession) {
        return Promise.resolve();
      }

      const session = backendSession;
      // Serialize cloud writes so back-to-back mutations apply in order.
      persistChainRef.current = persistChainRef.current
        .catch(() => {})
        .then(async () => {
          await session.repository.saveCarrierState(session.user.id, nextState);

          // Only the most recent mutation reconciles from the server, so a slow
          // reload can't overwrite newer optimistic state.
          if (persistSeqRef.current !== seq) {
            return;
          }

          const loaded = await loadBackendJourneyState({
            clock: { now: () => Date.now() },
            repository: session.repository,
            timeWarpFactor,
            userId: session.user.id
          });

          if (persistSeqRef.current !== seq) {
            return;
          }

          setCarrierState(loaded.carrierState);
          void persistLocalCarrierState(loaded.carrierState);
        })
        .catch((error) => {
          // Keep the optimistic state + local cache; surface rather than hide.
          console.warn(
            `Carrier Snail: cloud save failed; kept this device's copy. ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        });

      // Resolve immediately so callers' post-update logic (clearing the input,
      // updating selection) runs without waiting on the network.
      return Promise.resolve();
    },
    [backendSession, timeWarpFactor]
  );

  // Credit a finished minigame run: slime to the balance + experience to the
  // snail that played, persisted like any other state change. Stays outside the
  // Delivery Floor (snailGameReward never touches journey timing).
  const handleGameReward = useCallback(
    (snailId: string, reward: SnailGameReward) => {
      const credited = creditSnailGameReward(
        carrierState.snails,
        snailId,
        reward,
        carrierState.softCurrency.slime
      );
      void persistNextCarrierState({
        ...carrierState,
        snails: credited.snails,
        softCurrency: { slime: credited.slime }
      });
    },
    [carrierState, persistNextCarrierState]
  );
  const markNotificationsViewed = useCallback(() => {
    if (!hasUnseenArrivals(carrierState)) {
      return;
    }

    const repository = new InMemoryCarrierRepository(carrierState);
    const result = markArrivalsSeen({
      clock: { now: () => Date.now() },
      repository
    });

    if (result.markedCount > 0) {
      void persistNextCarrierState(repository.snapshot());
    }
  }, [carrierState, persistNextCarrierState]);

  useEffect(() => {
    if (readmeScreenshotConfig) {
      return undefined;
    }

    let cancelled = false;

    AsyncStorage.getItem(MAP_SKIN_STORAGE_KEY)
      .then((value) => {
        if (!cancelled) {
          setSelectedMapSkinId(coerceMapSkinId(value));
        }
      })
      .catch((error) => {
        console.warn(
          `Carrier Snail map skin preference unavailable. ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      });

    return () => {
      cancelled = true;
    };
  }, [readmeScreenshotConfig]);

  useEffect(() => {
    if (readmeScreenshotConfig) {
      return undefined;
    }

    let cancelled = false;
    let subscription: Location.LocationSubscription | undefined;
    let centeredOnFirstFix = false;

    // Continuously track coarse location while the app is foreground; each update
    // moves `target`, which the re-aim effect below picks up so the snail keeps
    // adjusting course. Coarse + a distance interval keeps it light.
    async function startTracking() {
      const existing = await Location.getForegroundPermissionsAsync();
      let granted = existing.status === Location.PermissionStatus.GRANTED;

      if (!granted) {
        const requested = await Location.requestForegroundPermissionsAsync();
        granted = requested.status === Location.PermissionStatus.GRANTED;
      }

      if (!granted || cancelled) {
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Low,
          distanceInterval: 10,
          timeInterval: 5000
        },
        (position) => {
          if (cancelled) {
            return;
          }

          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };

          setTarget(coords);
          setHasLocationFix(true);

          if (!centeredOnFirstFix) {
            centeredOnFirstFix = true;
            cameraRef.current?.easeTo({
              center: [coords.longitude, coords.latitude],
              duration: 600,
              zoom: mapDefaultZoom
            });
          }
        }
      );
    }

    startTracking().catch(() => undefined);
    requestArrivalNotificationPermission().catch(() => undefined);

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [mapDefaultZoom, readmeScreenshotConfig]);

  // Hydrate from the device-local cache immediately on launch. This is what
  // makes data survive a restart in local mode, and gives a fast offline
  // snapshot while the backend (if any) resolves. A successful cloud load wins
  // and is guarded against this slower read via hydratedFromBackendRef.
  useEffect(() => {
    if (readmeScreenshotConfig) {
      return undefined;
    }

    let cancelled = false;

    loadLocalCarrierState()
      .then((cached) => {
        if (cancelled || hydratedFromBackendRef.current || !cached) {
          return;
        }

        setCarrierState(cached);
      })
      .catch(() => {
        // loadLocalCarrierState already swallows its own errors; nothing to do.
      });

    return () => {
      cancelled = true;
    };
  }, [readmeScreenshotConfig]);

  useEffect(() => {
    if (readmeScreenshotConfig) {
      return undefined;
    }

    const supabase = createCarrierSupabaseClient();

    if (!supabase) {
      // No Supabase env configured in this build — device-local storage is the
      // intended persistence here, not a failure. persistenceMode already
      // initialized to "local" for this case.
      console.info(
        "Carrier Snail: Supabase not configured; using device-local storage."
      );
      return undefined;
    }

    let cancelled = false;
    const uninstallAutoRefresh = installSupabaseAutoRefresh(supabase);
    const repository = new SupabaseCarrierRepository(supabase);
    const authProvider = new SupabaseAnonymousAuthProvider(supabase);

    async function loadBackendState() {
      const user = await tryResolveAnonymousCarrierUser({
        authProvider,
        clock: { now: () => Date.now() },
        repository
      });

      if (!user) {
        // Backend configured but unavailable (e.g. anonymous sign-ins disabled,
        // or the device's anon session was lost). Stay on device-local storage
        // so the app keeps working — but make it visible, not silent.
        console.warn(
          "Carrier Snail: could not resolve a cloud session; using device-local storage."
        );
        if (!cancelled) {
          setPersistenceMode("error");
        }
        return;
      }

      const loaded = await loadBackendJourneyState({
        clock: { now: () => Date.now() },
        repository,
        userId: user.id
      });

      // Seed an empty cloud account with whatever this device already has
      // (offline progress) before falling back to a brand-new starter state, so
      // switching from local to cloud doesn't drop a save.
      let seedState = createInitialCarrierState();
      const cached = await loadLocalCarrierState();
      if (cached && cached.snails.length > 0) {
        seedState = cached;
      }

      const initialState =
        loaded.carrierState.snails.length > 0 ? loaded.carrierState : seedState;

      if (loaded.carrierState.snails.length === 0) {
        await repository.saveCarrierState(user.id, initialState);
      }

      if (cancelled) {
        return;
      }

      hydratedFromBackendRef.current = true;
      setBackendSession({ repository, user });
      setCarrierState(initialState);
      setPersistenceMode("cloud");
      // Refresh the offline cache with the authoritative cloud snapshot.
      void persistLocalCarrierState(initialState);
    }

    loadBackendState().catch((error) => {
      // Any other backend setup failure (e.g. row-level security); keep using
      // device-local storage but surface it instead of hiding it.
      console.warn(
        `Carrier Snail: backend unavailable; using device-local storage. ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      if (!cancelled) {
        setPersistenceMode("error");
      }
    });

    return () => {
      cancelled = true;
      uninstallAutoRefresh();
    };
  }, [readmeScreenshotConfig]);

  useEffect(() => {
    if (readmeScreenshotConfig) {
      return undefined;
    }

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
  }, [backendSession, readmeScreenshotConfig, target]);

  const watchState = useMemo(
    () =>
      buildJourneyWatchState({
        clock: { now: () => nowMs },
        scrubProgressByJourneyId:
          selectedWatchJourneyId && watchScrubProgress !== undefined
            ? { [selectedWatchJourneyId]: watchScrubProgress }
            : undefined,
        selectedJourneyId: selectedWatchJourneyId ?? undefined,
        state: carrierState,
        timeWarpFactor
      }),
    [
      carrierState,
      nowMs,
      selectedWatchJourneyId,
      timeWarpFactor,
      watchScrubProgress
    ]
  );
  // `undefined` = no explicit choice yet → auto-select a lone snail; `null` =
  // explicitly deselected (sticks); a string = explicitly selected.
  const effectiveSelectedJourneyId =
    selectedWatchJourneyId === undefined
      ? watchState.journeys.length === 1
        ? watchState.journeys[0].journeyId
        : undefined
      : selectedWatchJourneyId;
  const selectedWatchJourney = effectiveSelectedJourneyId
    ? watchState.journeys.find(
        ({ journeyId }) => journeyId === effectiveSelectedJourneyId
      )
    : undefined;
  const selectedJourneySnail = selectedWatchJourney
    ? carrierState.snails.find(({ id }) => id === selectedWatchJourney.snailId)
    : undefined;
  const selectedWatchToDo = selectedWatchJourney
    ? toDoItems.find(
        ({ activeJourneyId }) => activeJourneyId === selectedWatchJourney.journeyId
      )
    : undefined;
  const visibleCrawls = watchState.journeys.flatMap((watchJourney) => {
    const snail = carrierState.snails.find(
      (candidate) => candidate.id === watchJourney.snailId
    );

    return snail
      ? [
          {
            highlighted:
              watchJourney.journeyId === selectedWatchJourney?.journeyId,
            id: watchJourney.journeyId,
            progress: watchJourney.preview.progress,
            snail,
            start: watchJourney.start,
            target: watchJourney.target
          }
        ]
      : [];
  });

  useEffect(() => {
    // While a game is open, stop ticking the map: every tick re-renders the
    // whole MapScreen tree (and the game mounted inside it). The backend is the
    // source of truth, so journeys catch up when the game closes.
    if (gameActive || readmeScreenshotConfig) {
      return;
    }
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
  }, [
    backendSession,
    gameActive,
    pushSender,
    readmeScreenshotConfig,
    timeWarpFactor
  ]);

  useEffect(() => {
    onUnseenNotificationsChange(hasUnseenArrivals(carrierState));
  }, [carrierState, onUnseenNotificationsChange]);

  const crawlGeo = visibleCrawls.map((crawl) => ({
    ...crawl,
    polyline: buildJourneyPolyline({
      progress: crawl.progress,
      start: crawl.start,
      target: crawl.target
    })
  }));

  useEffect(() => {
    if (!readmeScreenshotConfig?.fitMapToJourney || !selectedWatchJourney) {
      return undefined;
    }

    const coordinates = [
      selectedWatchJourney.start,
      ...selectedWatchJourney.trailHistory.map(({ coordinate }) => coordinate),
      selectedWatchJourney.preview.coordinate,
      selectedWatchJourney.target
    ];
    const longitudes = coordinates.map(({ longitude }) => longitude);
    const latitudes = coordinates.map(({ latitude }) => latitude);
    const bounds: [number, number, number, number] = [
      Math.min(...longitudes),
      Math.min(...latitudes),
      Math.max(...longitudes),
      Math.max(...latitudes)
    ];
    const timer = setTimeout(() => {
      cameraRef.current?.fitBounds(bounds, {
        duration: 0,
        padding: {
          bottom: SHEET_EXPANDED_HEIGHT + 28,
          left: 42,
          right: 42,
          top: 72
        }
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [mapStatus, readmeScreenshotConfig, selectedWatchJourney]);

  function cycleWarp() {
    const currentIndex = allowedWarps.indexOf(timeWarpFactor);
    const nextWarp = allowedWarps[(currentIndex + 1) % allowedWarps.length] ?? 1;
    setRequestedWarp(nextWarp);
  }

  function selectMapSkin(skinId: MapSkinId) {
    const nextMapStyleUrl = buildMapStyleUrl({
      fallbackStyleUrl: FALLBACK_MAP_STYLE_URL,
      mapTilerKey: MAPTILER_KEY,
      selectedSkinId: skinId
    });

    setSelectedMapSkinId(skinId);

    if (nextMapStyleUrl !== mapStyleUrl) {
      setMapStatus("loading");
    }

    void AsyncStorage.setItem(MAP_SKIN_STORAGE_KEY, skinId).catch((error) => {
      console.warn(
        `Carrier Snail map skin preference could not be saved. ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    });
  }

  async function createToDoFromInput() {
    try {
      const repository = new InMemoryCarrierRepository(carrierState);

      createToDo(
        { text: toDoText },
        {
          clock: { now: () => Date.now() },
          repository
        }
      );
      await persistNextCarrierState(repository.snapshot());

      setToDoText("");
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "To-do failed.");
    }
  }

  async function assignSnailToTodo(todoId: string, snailId: string) {
    try {
      const repository = new InMemoryCarrierRepository(carrierState);

      assignSnailToToDo(
        { snailId, todoId },
        {
          clock: { now: () => Date.now() },
          locationSource: { currentTarget: () => target },
          repository
        }
      );
      await persistNextCarrierState(repository.snapshot());
      setSelectedWatchJourneyId(undefined);
      setFormError("");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Snail assignment failed."
      );
    }
  }

  async function finishOnboarding() {
    try {
      const repository = new InMemoryCarrierRepository(carrierState);

      completeOnboarding({
        clock: { now: () => Date.now() },
        repository
      });
      const nextState = repository.snapshot();

      if (backendSession) {
        await backendSession.repository.saveCarrierState(
          backendSession.user.id,
          nextState
        );
      }

      setCarrierState(nextState);
      setFormError("");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Onboarding failed."
      );
    }
  }

  // Bridge: App bumps completeOnboardingSignal on the onboarding "Start" tap;
  // this runs the async, persisting completion. A user-triggered one-shot, not a
  // render hotpath, so the hook lints below are deliberate.
  useEffect(() => {
    if (completeOnboardingSignal > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void finishOnboarding();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completeOnboardingSignal]);

  async function enableBackgroundLocation() {
    setBackgroundLocationBusy(true);

    try {
      const result = await configureOptionalBackgroundLocation({
        controller: backgroundLocationController
      });

      setBackgroundLocationMode(result.mode);
    } catch {
      setBackgroundLocationMode("foreground-only");
    } finally {
      setBackgroundLocationBusy(false);
    }
  }

  async function disableBackgroundLocation() {
    setBackgroundLocationBusy(true);

    try {
      await disableOptionalBackgroundLocation({
        controller: backgroundLocationController
      });
      setBackgroundLocationMode("foreground-only");
    } finally {
      setBackgroundLocationBusy(false);
    }
  }

  function toggleBackgroundLocation(enabled: boolean) {
    if (enabled) {
      void enableBackgroundLocation();
    } else {
      void disableBackgroundLocation();
    }
  }

  function confirmRecallToDo(todoId: string) {
    Alert.alert(
      "Recall snail?",
      "The snail comes home. The to-do stays open.",
      [
        {
          style: "cancel",
          text: "Keep"
        },
        {
          onPress: () => {
            void recallAssignedToDo(todoId);
          },
          style: "destructive",
          text: "Recall"
        }
      ]
    );
  }

  async function recallAssignedToDo(todoId: string) {
    try {
      const repository = new InMemoryCarrierRepository(carrierState);

      await unassignSnail(
        { todoId },
        {
          clock: { now: () => Date.now() },
          pushSender,
          repository
        }
      );
      await persistNextCarrierState(repository.snapshot());

      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Recall failed.");
    }
  }

  async function completeOpenToDo(todoId: string) {
    try {
      const repository = new InMemoryCarrierRepository(carrierState);

      await completeToDo(
        { todoId },
        {
          clock: { now: () => Date.now() },
          pushSender,
          repository
        }
      );
      await persistNextCarrierState(repository.snapshot());
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Complete failed.");
    }
  }

  async function deleteOpenToDo(todoId: string) {
    try {
      const repository = new InMemoryCarrierRepository(carrierState);

      await deleteToDo(
        { todoId },
        {
          clock: { now: () => Date.now() },
          pushSender,
          repository
        }
      );
      await persistNextCarrierState(repository.snapshot());
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  function startEditingToDo(todo: ToDoListItem) {
    setEditingTodoId(todo.id);
    setEditingTodoText(todo.text);
    setFormError("");
  }

  async function saveEditingToDo() {
    if (!editingTodoId) {
      return;
    }

    try {
      const repository = new InMemoryCarrierRepository(carrierState);

      updateToDo(
        { text: editingTodoText, todoId: editingTodoId },
        { repository }
      );
      await persistNextCarrierState(repository.snapshot());
      setEditingTodoId(undefined);
      setEditingTodoText("");
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Edit failed.");
    }
  }

  async function hatchCarrierEgg(eggId: string) {
    try {
      const repository = new InMemoryCarrierRepository(carrierState);
      const result = hatchEgg(
        { eggId },
        {
          clock: { now: () => Date.now() },
          repository
        }
      );
      const nextState = repository.snapshot();

      await persistNextCarrierState(nextState);

      setRequestedSelectedSnailId(result.snail.id);
      setFormError("");
      return result.snail;
    } catch (error) {
      if (error instanceof StableFullError) {
        throw error;
      }

      setFormError(error instanceof Error ? error.message : "Hatch failed.");
      return undefined;
    }
  }

  async function releaseOwnedSnail(snailId: string) {
    try {
      const repository = new InMemoryCarrierRepository(carrierState);

      releaseSnail(
        { snailId },
        {
          repository
        }
      );
      const nextState = repository.snapshot();

      await persistNextCarrierState(nextState);
      setRequestedSelectedSnailId(nextState.snails[0]?.id ?? "");
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Release failed.");
    }
  }

  async function levelSelectedSnail() {
    if (!selectedOwnedSnail) {
      return;
    }

    try {
      const repository = new InMemoryCarrierRepository(carrierState);

      levelUpSnail(
        { snailId: selectedOwnedSnail.id },
        {
          repository
        }
      );
      const nextState = repository.snapshot();

      await persistNextCarrierState(nextState);

      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Level up failed.");
    }
  }

  async function renameOwnedSnail(snailId: string, name: string) {
    try {
      const repository = new InMemoryCarrierRepository(carrierState);
      const result = renameSnail(
        { name, snailId },
        {
          repository
        }
      );

      await persistNextCarrierState(repository.snapshot());
      setRequestedSelectedSnailId(result.snail.id);
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Rename failed.");
    }
  }

  async function buyCatalogProduct(productId: PurchaseProductId) {
    try {
      const repository = new InMemoryCarrierRepository(carrierState);

      purchaseInventory(
        { productId },
        {
          clock: { now: () => Date.now() },
          repository
        }
      );
      const nextState = repository.snapshot();

      await persistNextCarrierState(nextState);

      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Purchase failed.");
    }
  }

  // Tapping a snail on the map opens its details and slides the sheet out.
  function watchSnail(journeyId: string) {
    // A marker tap can also bubble to the map's onPress on some platforms;
    // guard the deselect briefly, then auto-clear so a later map tap still works.
    markerTapGuardRef.current = true;
    setTimeout(() => {
      markerTapGuardRef.current = false;
    }, 350);
    setSelectedWatchJourneyId(journeyId);
    setWatchScrubProgress(undefined);
    snapSheet(false);
  }

  // Tapping empty map (no snail) collapses the sheet back to "Tap a snail to
  // watch".
  function handleMapPress() {
    if (markerTapGuardRef.current) {
      return;
    }

    setSelectedWatchJourneyId(null);
    setWatchScrubProgress(undefined);
    snapSheet(true);
  }

  function scrubWatchJourney(progress: number | undefined) {
    if (!selectedWatchJourney) {
      return;
    }

    setSelectedWatchJourneyId(selectedWatchJourney.journeyId);
    setWatchScrubProgress(progress);
  }

  function shareSelectedTrail() {
    if (!selectedWatchJourney) {
      return;
    }

    void Share.share({
      message: [
        "Carrier Snail trail",
        `${selectedWatchJourney.snailName} is carrying "${selectedWatchJourney.reminderText}".`,
        selectedWatchJourney.etaRange.copy,
        `Progress ${Math.round(
          selectedWatchJourney.preview.progress * 100
        )}%, target ${formatCoordinate(selectedWatchJourney.target)}.`
      ].join("\n")
    });
  }

  function recallSelectedWatchJourney() {
    if (!selectedWatchToDo) {
      return;
    }

    confirmRecallToDo(selectedWatchToDo.id);
  }

  return (
    <SnailGameFlowProvider
      onActiveChange={setGameActive}
      onReward={handleGameReward}
      slimeBalance={carrierState.softCurrency.slime}
      snails={carrierState.snails}
    >
    <View style={styles.screen}>
      {persistenceMode === "local" || persistenceMode === "error" ? (
        <View pointerEvents="none" style={styles.persistenceBanner}>
          <Text style={styles.persistenceBannerText}>
            {persistenceMode === "error"
              ? "⚠ Cloud sync unavailable — progress is saved on this device only"
              : "Saving on this device only — cloud sync not configured"}
          </Text>
        </View>
      ) : null}
      <View
        style={[
          styles.mapSurface,
          activeTab !== "map" ? styles.hiddenSurface : null
        ]}
      >
        <View style={styles.mapShell}>
          <Map
            attributionPosition={{ bottom: 10, right: 10 }}
            key={mapStyleUrl}
            logo={false}
            mapStyle={mapStyleUrl}
            onDidFailLoadingMap={() => setMapStatus("failed")}
            onDidFinishLoadingStyle={() => setMapStatus("ready")}
            onPress={handleMapPress}
            style={StyleSheet.absoluteFill}
          >
            <Camera
              initialViewState={{
                center: [target.longitude, target.latitude],
                zoom: mapDefaultZoom
              }}
              ref={cameraRef}
            />
            {hasLocationFix ? (
              <Marker
                id="user-location"
                lngLat={[target.longitude, target.latitude]}
              >
                <View style={styles.userDotHalo}>
                  <View style={styles.userDot} />
                </View>
              </Marker>
            ) : null}
            {crawlGeo.map(({ highlighted, id, polyline, snail }) => {
              const canSelectJourney = watchState.journeys.some(
                (journey) => journey.journeyId === id
              );

              return (
                <Fragment key={`journey-${id}`}>
                  {polyline.remaining ? (
                    <GeoJSONSource
                      data={lineStringCollection(
                        [polyline.remaining],
                        REMAINING_PATH_STYLE.lineColor
                      )}
                      id={`remaining-${id}`}
                    >
                      <Layer
                        id={`remaining-casing-${id}`}
                        layout={{ "line-cap": "round" }}
                        paint={{
                          "line-color": REMAINING_PATH_STYLE.casingColor,
                          "line-dasharray": REMAINING_PATH_STYLE.lineDasharray,
                          "line-width": REMAINING_PATH_STYLE.casingWidth
                        }}
                        type="line"
                      />
                      <Layer
                        id={`remaining-line-${id}`}
                        layout={{ "line-cap": "round" }}
                        paint={{
                          "line-color": ["get", "color"],
                          "line-dasharray": REMAINING_PATH_STYLE.lineDasharray,
                          "line-width": REMAINING_PATH_STYLE.lineWidth
                        }}
                        type="line"
                      />
                    </GeoJSONSource>
                  ) : null}
                  <GeoJSONSource
                    data={trailSegmentCollection(
                      polyline.traveled,
                      snail.trail.color
                    )}
                    id={`trail-${id}`}
                  >
                    <Layer
                      id={`trail-casing-${id}`}
                      layout={{ "line-cap": "round", "line-join": "round" }}
                      paint={{
                        "line-color": ["get", "casingColor"],
                        "line-width": 10
                      }}
                      type="line"
                    />
                    <Layer
                      id={`trail-line-${id}`}
                      layout={{ "line-cap": "round", "line-join": "round" }}
                      paint={{
                        "line-color": ["get", "lineColor"],
                        "line-width": 6
                      }}
                      type="line"
                    />
                    <Layer
                      id={`trail-highlight-${id}`}
                      layout={{ "line-cap": "round", "line-join": "round" }}
                      paint={{
                        "line-color": ["get", "highlightColor"],
                        "line-width": 2
                      }}
                      type="line"
                    />
                  </GeoJSONSource>
                  <Marker
                    id={`snail-${id}`}
                    lngLat={[polyline.snail.longitude, polyline.snail.latitude]}
                  >
                    <Pressable
                      accessibilityLabel={`Watch ${snail.name}`}
                      accessibilityRole="button"
                      disabled={!canSelectJourney}
                      onPress={() => watchSnail(id)}
                      style={({ pressed }) => [
                        styles.snailMarker,
                        highlighted ? styles.snailMarkerHighlighted : null,
                        pressed ? styles.snailMarkerPressed : null
                      ]}
                    >
                      <SnailSprite
                        accessibilityLabel={`${snail.name} map marker`}
                        size={48}
                        speciesId={snail.speciesId}
                        walking
                      />
                    </Pressable>
                  </Marker>
                </Fragment>
              );
            })}
          </Map>
          {mapStatus === "failed" ? (
            <View pointerEvents="none" style={styles.mapNotice}>
              <Text style={styles.mapNoticeTitle}>Map couldn’t load</Text>
              <Text style={styles.mapNoticeBody}>
                Check your connection. The snail still knows where it’s going.
              </Text>
            </View>
          ) : usingPlaceholderBasemap ? (
            <View pointerEvents="none" style={styles.mapHint}>
              <Text style={styles.mapHintText}>
                Demo basemap · set EXPO_PUBLIC_MAPTILER_KEY to unlock map skins
              </Text>
            </View>
          ) : null}
          {hasLocationFix ? (
            <Pressable
              accessibilityLabel="Recenter on your location"
              accessibilityRole="button"
              onPress={recenterOnUser}
              style={({ pressed }) => [
                styles.recenterFab,
                { bottom: SHEET_PEEK_HEIGHT + 16 },
                pressed ? styles.recenterFabPressed : null
              ]}
            >
              <MaterialCommunityIcons
                color={colors.primary}
                name="crosshairs-gps"
                size={22}
              />
            </Pressable>
          ) : null}
        </View>

        <Animated.View
          style={[
            styles.controls,
            {
              height: SHEET_EXPANDED_HEIGHT,
              transform: [{ translateY: sheetTranslateY }]
            }
          ]}
        >
          <View
            accessibilityLabel="Snail details. Drag or tap to expand."
            accessibilityRole="adjustable"
            style={styles.sheetGrip}
            {...sheetPan.panHandlers}
          >
            <View style={styles.peekHandle} />
            <View style={styles.peekTextBlock}>
              <Text numberOfLines={1} style={styles.peekTitle}>
                {selectedWatchJourney
                  ? selectedWatchJourney.snailName
                  : watchState.journeys.length > 0
                    ? "Tap a snail to watch"
                    : "No snails out right now"}
              </Text>
              {selectedWatchJourney ? (
                <Text numberOfLines={1} style={styles.peekEta}>
                  {selectedWatchJourney.etaRange.copy}
                </Text>
              ) : null}
            </View>
          </View>
          <ScrollView
            contentContainerStyle={styles.controlsContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.sheetScroll}
          >
            {selectedWatchJourney ? (
              <>
                <Text style={styles.watchCarryingLabel}>Carrying</Text>
                <Text numberOfLines={2} style={styles.watchTodoText}>
                  {selectedWatchJourney.reminderText}
                </Text>
                <View style={styles.watchTraitRow}>
                  <View style={styles.watchTrait}>
                    <Text style={styles.watchTraitLabel}>Level</Text>
                    <Text style={styles.watchTraitValue}>
                      {selectedJourneySnail?.level ?? 1}
                    </Text>
                  </View>
                  <View style={styles.watchTrait}>
                    <Text style={styles.watchTraitLabel}>Quirk</Text>
                    <Text numberOfLines={1} style={styles.watchTraitValue}>
                      {formatQuirkLabel(selectedJourneySnail?.quirk)}
                    </Text>
                  </View>
                  <View style={styles.watchTrait}>
                    <Text style={styles.watchTraitLabel}>Trail</Text>
                    <Text numberOfLines={1} style={styles.watchTraitValue}>
                      {selectedWatchJourney.trail.texture}
                    </Text>
                  </View>
                </View>
                <Text numberOfLines={2} style={styles.watchMeta}>
                  Path{" "}
                  {formatDistance(selectedWatchJourney.preview.travelledMeters)}{" "}
                  crawled,{" "}
                  {formatDistance(selectedWatchJourney.preview.remainingMeters)}{" "}
                  left
                </Text>
                <Text numberOfLines={2} style={styles.watchMeta}>
                  Target {formatCoordinate(selectedWatchJourney.target)}. Trail
                  points {selectedWatchJourney.trailHistory.length}.
                </Text>
              </>
            ) : null}

            {selectedWatchJourney ? (
              <>
                <View style={styles.watchActionRow}>
                  {selectedWatchToDo ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Recall selected snail"
                      onPress={recallSelectedWatchJourney}
                      style={({ pressed }) => [
                        styles.recallButton,
                        pressed ? styles.recallButtonPressed : null
                      ]}
                    >
                      <Text style={styles.recallButtonText}>Recall</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Share selected trail"
                    onPress={shareSelectedTrail}
                    style={({ pressed }) => [
                      styles.watchShareButton,
                      pressed ? styles.watchShareButtonPressed : null
                    ]}
                  >
                    <Text style={styles.watchShareButtonText}>Share trail</Text>
                  </Pressable>
                </View>
                <View style={styles.watchScrubRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Show live journey position"
                    onPress={() => scrubWatchJourney(undefined)}
                    style={({ pressed }) => [
                      styles.watchScrubButton,
                      watchScrubProgress === undefined
                        ? styles.watchScrubButtonSelected
                        : null,
                      pressed ? styles.watchScrubButtonPressed : null
                    ]}
                  >
                    <Text style={styles.watchScrubButtonText}>Live</Text>
                  </Pressable>
                  {WATCH_SCRUB_STOPS.map((stop) => (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Preview trail at ${stop.label}`}
                      key={stop.label}
                      onPress={() => scrubWatchJourney(stop.progress)}
                      style={({ pressed }) => [
                        styles.watchScrubButton,
                        watchScrubProgress === stop.progress
                          ? styles.watchScrubButtonSelected
                          : null,
                        pressed ? styles.watchScrubButtonPressed : null
                      ]}
                    >
                      <Text style={styles.watchScrubButtonText}>
                        {stop.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            {formError ? (
              <Text style={styles.errorText}>{formError}</Text>
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>

      {activeTab === "snails" ? (
        <MySnailsScreen
          slimeBalance={carrierState.softCurrency.slime}
          carrierState={carrierState}
          formError={formError}
          onBuyProduct={(productId) => {
            void buyCatalogProduct(productId);
          }}
          onHatchEgg={hatchCarrierEgg}
          onLevelSelectedSnail={() => {
            void levelSelectedSnail();
          }}
          onRenameSnail={(snailId, name) => {
            void renameOwnedSnail(snailId, name);
          }}
          onReleaseSnail={(snailId) => {
            void releaseOwnedSnail(snailId);
          }}
          onSelectSnail={setRequestedSelectedSnailId}
          purchaseCatalog={purchaseCatalog}
          readmeDetailSnailId={readmeScreenshotConfig?.detailSnailId}
          selectedCanLevel={selectedCanLevel}
          selectedSnailId={selectedSnailId}
          stable={stable}
          unhatchedEggs={unhatchedEggs}
        />
      ) : null}

      {activeTab === "todos" ? (
        <ToDosScreen
          canAssignSnail={stable.capacity.freeCount > 0}
          editingText={editingTodoText}
          editingTodoId={editingTodoId}
          formError={formError}
          onAssignSnail={(todoId, snailId) => {
            void assignSnailToTodo(todoId, snailId);
          }}
          onCancelEdit={() => {
            setEditingTodoId(undefined);
            setEditingTodoText("");
          }}
          onChangeEditingText={setEditingTodoText}
          onChangeToDoText={setToDoText}
          onCompleteToDo={(todoId) => {
            void completeOpenToDo(todoId);
          }}
          onCreateToDo={() => {
            void createToDoFromInput();
          }}
          onDeleteToDo={(todoId) => {
            void deleteOpenToDo(todoId);
          }}
          onRecallToDo={confirmRecallToDo}
          onSaveEdit={() => {
            void saveEditingToDo();
          }}
          onStartEdit={startEditingToDo}
          restingSnails={restingStableSnails}
          selectedStableSnail={selectedRestingStableSnail}
          toDoItems={toDoItems}
          toDoText={toDoText}
        />
      ) : null}

      {activeTab === "notifications" ? (
        <NotificationsScreen
          arrivals={arrivalItems}
          nowMs={nowMs}
          onViewed={markNotificationsViewed}
        />
      ) : null}

      {activeTab === "settings" ? (
        <SettingsScreen
          backgroundLocationBusy={backgroundLocationBusy}
          backgroundLocationMode={backgroundLocationMode}
          mapSkinOptions={MAP_SKIN_OPTIONS}
          mapTilerKeyAvailable={mapTilerKeyAvailable}
          onCycleWarp={cycleWarp}
          onSelectMapSkin={selectMapSkin}
          onToggleBackgroundLocation={toggleBackgroundLocation}
          selectedMapSkinId={selectedMapSkinId}
          timeWarpFactor={timeWarpFactor}
        />
      ) : null}
    </View>
    </SnailGameFlowProvider>
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

function formatQuirkLabel(quirk: string | undefined): string {
  switch (quirk) {
    case "backwards":
      return "Backwards";
    case "detour":
      return "Scenic";
    case "napper":
      return "Napper";
    case "none":
    case undefined:
      return "Steady";
    default:
      return quirk;
  }
}

function trailSegmentCollection(
  segments: GeoTrailSegment[],
  hexColor: string
): GeoJSON.FeatureCollection {
  return {
    features: segments.map((segment) => {
      const properties = buildTrailLineProperties({
        segmentOpacity: segment.opacity,
        speciesTrailColor: hexColor
      });

      return {
        geometry: {
          coordinates: [
            [segment.from.longitude, segment.from.latitude],
            [segment.to.longitude, segment.to.latitude]
          ],
          type: "LineString"
        },
        properties,
        type: "Feature"
      };
    }),
    type: "FeatureCollection"
  };
}

function lineStringCollection(
  lines: [Coordinate, Coordinate][],
  color: string
): GeoJSON.FeatureCollection {
  return {
    features: lines.map((line) => ({
      geometry: {
        coordinates: line.map((point) => [point.longitude, point.latitude]),
        type: "LineString"
      },
      properties: { color },
      type: "Feature"
    })),
    type: "FeatureCollection"
  };
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(distanceMeters)} m`;
}

function formatCoordinate(coordinate: Coordinate): string {
  return `${coordinate.latitude.toFixed(3)}, ${coordinate.longitude.toFixed(3)}`;
}

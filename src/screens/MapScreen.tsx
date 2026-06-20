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
import { SupabaseAnonymousAuthProvider } from "../backend/supabaseAnonymousAuthProvider";
import { SupabaseCarrierRepository } from "../backend/supabaseCarrierRepository";
import {
  createCarrierSupabaseClient,
  installSupabaseAutoRefresh
} from "../backend/supabaseClient";
import { createRevenueCatEntitlementProvider } from "../payments/revenueCatEntitlementProvider";
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
import { hatchEgg } from "../useCases/hatchEgg";
import {
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
import {
  createInitialCarrierState,
  getActiveJourney,
  InMemoryCarrierRepository,
  listStableSnails,
  type CarrierState
} from "../useCases/localCarrierState";
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
import { MySnailsScreen } from "./MySnailsScreen";
import { NotificationsScreen } from "./NotificationsScreen";
import { SettingsScreen } from "./SettingsScreen";
import { ToDosScreen } from "./ToDosScreen";

const MOCK_RESTING_POINT: Coordinate = {
  latitude: -33.8688,
  longitude: 151.2093
};

const MAP_STYLE_URL =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL ??
  "https://demotiles.maplibre.org/style.json";
// The default demotiles style is a keyless placeholder with only low-zoom world
// data (no streets). Frame it out to the world so it shows *something*; real
// providers (MapTiler/Protomaps) get a city-level view to see the journey.
const USING_PLACEHOLDER_BASEMAP = MAP_STYLE_URL.includes(
  "demotiles.maplibre.org"
);
const MAP_DEFAULT_ZOOM = USING_PLACEHOLDER_BASEMAP ? 1.6 : 13;
const REVENUECAT_IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const REVENUECAT_ANDROID_API_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
const REVENUECAT_PRODUCT_IDENTIFIERS = {
  "cosmetic-trail-sparkle":
    process.env.EXPO_PUBLIC_REVENUECAT_COSMETIC_TRAIL_SPARKLE_ID ??
    "cosmetic-trail-sparkle",
  "egg-pack-small":
    process.env.EXPO_PUBLIC_REVENUECAT_EGG_PACK_SMALL_ID ?? "egg-pack-small",
  "stable-slot-single":
    process.env.EXPO_PUBLIC_REVENUECAT_STABLE_SLOT_SINGLE_ID ??
    "stable-slot-single"
} satisfies Record<PurchaseProductId, string>;

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
  onOnboardingVisibleChange: (visible: boolean) => void;
  onUnseenNotificationsChange: (hasUnseen: boolean) => void;
};

export function MapScreen({
  activeTab,
  completeOnboardingSignal,
  onOnboardingVisibleChange,
  onUnseenNotificationsChange
}: MapScreenProps) {
  const [target, setTarget] = useState<Coordinate>(MOCK_RESTING_POINT);
  const [locationLabel, setLocationLabel] = useState("Mock resting point");
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "failed">(
    "loading"
  );
  const [detailsCollapsed, setDetailsCollapsed] = useState(true);
  const [sheetTranslateY] = useState(
    () => new Animated.Value(SHEET_COLLAPSED_OFFSET)
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
  const [hasLocationFix, setHasLocationFix] = useState(false);

  // One-shot recentre. The camera otherwise stays where the user left it (it does
  // NOT auto-follow live updates), so panning isn't fought.
  function recenterOnUser() {
    cameraRef.current?.easeTo({
      center: [target.longitude, target.latitude],
      duration: 500,
      zoom: MAP_DEFAULT_ZOOM
    });
  }
  const [carrierState, setCarrierState] = useState(() =>
    createInitialCarrierState()
  );
  const [toDoText, setToDoText] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<string | undefined>(
    undefined
  );
  const [editingTodoText, setEditingTodoText] = useState("");
  const [formError, setFormError] = useState("");
  const [requestedSelectedSnailId, setRequestedSelectedSnailId] =
    useState("garden-1");
  const [backendSession, setBackendSession] = useState<BackendSession | null>(
    null
  );
  const [backgroundLocationBusy, setBackgroundLocationBusy] = useState(false);
  const [backgroundLocationMode, setBackgroundLocationMode] =
    useState<BackgroundLocationMode>("foreground-only");
  const [selectedWatchJourneyId, setSelectedWatchJourneyId] = useState<
    string | null | undefined
  >(undefined);
  const [watchScrubProgress, setWatchScrubProgress] = useState<
    number | undefined
  >(undefined);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [requestedWarp, setRequestedWarp] = useState(100000);
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
    (snail) =>
      snail.id === requestedSelectedSnailId && snail.status === "resting"
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
    carrierState.softCurrency.slime >= selectedLevelCost;
  const unhatchedEggs = carrierState.eggs.filter(
    (egg) => egg.status === "unhatched"
  );
  const onboardingVisible = shouldShowOnboarding(carrierState);

  useEffect(() => {
    onOnboardingVisibleChange(onboardingVisible);
  }, [onboardingVisible, onOnboardingVisibleChange]);
  const purchaseCatalog = useMemo(() => getPurchaseCatalog(), []);
  const entitlementProvider = useMemo(
    () =>
      createRevenueCatEntitlementProvider({
        androidApiKey: REVENUECAT_ANDROID_API_KEY,
        appUserId: backendSession?.user.id ?? "local-carrier",
        iosApiKey: REVENUECAT_IOS_API_KEY,
        productIdentifiers: REVENUECAT_PRODUCT_IDENTIFIERS
      }),
    [backendSession?.user.id]
  );
  const pushSender = useMemo(() => new ExpoLocalPushSender(), []);
  const backgroundLocationController = useMemo(
    () => new ExpoBackgroundLocationController(),
    []
  );
  const persistNextCarrierState = useCallback(
    async (nextState: CarrierState) => {
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
    },
    [backendSession, timeWarpFactor]
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
          setLocationLabel("Live location");
          setHasLocationFix(true);

          if (!centeredOnFirstFix) {
            centeredOnFirstFix = true;
            cameraRef.current?.easeTo({
              center: [coords.longitude, coords.latitude],
              duration: 600,
              zoom: MAP_DEFAULT_ZOOM
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
      const user = await tryResolveAnonymousCarrierUser({
        authProvider,
        clock: { now: () => Date.now() },
        repository
      });

      if (!user) {
        // Backend configured but unavailable (e.g. anonymous sign-ins disabled).
        // Fall back to local mode silently; the app stays fully usable.
        return;
      }

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
      // Any other backend setup failure (e.g. row-level security), stay in
      // local mode rather than surfacing a scary error.
      console.warn(
        `Carrier Snail backend unavailable; using local mode. ${
          error instanceof Error ? error.message : String(error)
        }`
      );
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

  function cycleWarp() {
    const currentIndex = allowedWarps.indexOf(timeWarpFactor);
    const nextWarp = allowedWarps[(currentIndex + 1) % allowedWarps.length] ?? 1;
    setRequestedWarp(nextWarp);
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

      setRequestedSelectedSnailId(result.snail.id);
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Hatch failed.");
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
    if (!entitlementProvider) {
      setFormError("RevenueCat API keys are required for purchases.");
      return;
    }

    try {
      const repository = new InMemoryCarrierRepository(carrierState);

      await purchaseInventory(
        { productId },
        {
          clock: { now: () => Date.now() },
          entitlementProvider,
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
      setFormError(error instanceof Error ? error.message : "Purchase failed.");
    }
  }

  function selectWatchJourney(journeyId: string) {
    // Tapping the snail that's already showing deselects it (and sticks, even if
    // it's the only one out).
    setSelectedWatchJourneyId(
      effectiveSelectedJourneyId === journeyId ? null : journeyId
    );
    setWatchScrubProgress(undefined);
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
    <View style={styles.screen}>
      <View
        style={[
          styles.mapSurface,
          activeTab !== "map" ? styles.hiddenSurface : null
        ]}
      >
        <View style={styles.mapShell}>
          <Map
            attributionPosition={{ bottom: 10, right: 10 }}
            logo={false}
            mapStyle={MAP_STYLE_URL}
            onDidFailLoadingMap={() => setMapStatus("failed")}
            onDidFinishLoadingStyle={() => setMapStatus("ready")}
            style={StyleSheet.absoluteFill}
          >
            <Camera
              initialViewState={{
                center: [target.longitude, target.latitude],
                zoom: MAP_DEFAULT_ZOOM
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
                        "rgba(120, 132, 120, 0.45)"
                      )}
                      id={`remaining-${id}`}
                    >
                      <Layer
                        id={`remaining-line-${id}`}
                        layout={{ "line-cap": "round" }}
                        paint={{
                          "line-color": ["get", "color"],
                          "line-dasharray": [1.5, 2.5],
                          "line-width": 2
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
                      id={`trail-line-${id}`}
                      layout={{ "line-cap": "round", "line-join": "round" }}
                      paint={{
                        "line-color": ["get", "color"],
                        "line-width": 5
                      }}
                      type="line"
                    />
                  </GeoJSONSource>
                  <Marker
                    id={`snail-${id}`}
                    lngLat={[polyline.snail.longitude, polyline.snail.latitude]}
                  >
                    <Pressable
                      accessibilityLabel={`Select ${snail.name}`}
                      accessibilityRole="button"
                      disabled={!canSelectJourney}
                      onPress={() => selectWatchJourney(id)}
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
          ) : USING_PLACEHOLDER_BASEMAP ? (
            <View pointerEvents="none" style={styles.mapHint}>
              <Text style={styles.mapHintText}>
                Demo basemap · set EXPO_PUBLIC_MAP_STYLE_URL to a MapTiler style for
                streets
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
                color="#2f604e"
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
            ) : (
              <>
                <Text numberOfLines={3} style={styles.watchEta}>
                  {watchState.journeys.length > 0
                    ? "Tap a snail on the map, or choose one below to watch its crawl."
                    : "No snail is carrying a thought yet. Send one from your To Dos."}
                </Text>
                <Text numberOfLines={1} style={styles.watchMeta}>
                  Snails crawl toward {locationLabel.toLowerCase()}.
                </Text>
              </>
            )}

            {watchState.journeys.length > 0 ? (
              <View style={styles.watchJourneyTabs}>
                {watchState.journeys.map((watchJourney) => {
                  const selected =
                    selectedWatchJourney?.journeyId === watchJourney.journeyId;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Inspect ${watchJourney.reminderText}`}
                      key={watchJourney.journeyId}
                      onPress={() => selectWatchJourney(watchJourney.journeyId)}
                      style={({ pressed }) => [
                        styles.watchJourneyTab,
                        selected ? styles.watchJourneyTabSelected : null,
                        pressed ? styles.watchJourneyTabPressed : null
                      ]}
                    >
                      <View
                        style={[
                          styles.watchJourneySwatch,
                          { backgroundColor: watchJourney.trail.color }
                        ]}
                      />
                      <Text numberOfLines={1} style={styles.watchJourneyTabText}>
                        {watchJourney.snailName}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
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
          canPurchase={!!entitlementProvider}
          carrierState={carrierState}
          formError={formError}
          onBuyProduct={(productId) => {
            void buyCatalogProduct(productId);
          }}
          onHatchEgg={(eggId) => {
            void hatchCarrierEgg(eggId);
          }}
          onLevelSelectedSnail={() => {
            void levelSelectedSnail();
          }}
          onRenameSnail={(snailId, name) => {
            void renameOwnedSnail(snailId, name);
          }}
          onSelectSnail={setRequestedSelectedSnailId}
          purchaseCatalog={purchaseCatalog}
          selectedCanLevel={selectedCanLevel}
          selectedLevelCost={selectedLevelCost}
          selectedOwnedSnail={selectedOwnedSnail}
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
          selectedStableSnail={selectedStableSnail}
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
          onCycleWarp={cycleWarp}
          onToggleBackgroundLocation={toggleBackgroundLocation}
          timeWarpFactor={timeWarpFactor}
        />
      ) : null}
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
    features: segments.map((segment) => ({
      geometry: {
        coordinates: [
          [segment.from.longitude, segment.from.latitude],
          [segment.to.longitude, segment.to.latitude]
        ],
        type: "LineString"
      },
      properties: { color: hexToRgba(hexColor, segment.opacity) },
      type: "Feature"
    })),
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

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const safeAlpha = Math.max(0, Math.min(1, alpha));

  return `rgba(${red}, ${green}, ${blue}, ${safeAlpha})`;
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

import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Map,
  Marker
} from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View
} from "react-native";

import type { BottomTabId } from "../components/TabBar";
import { ExpoBackgroundLocationController } from "../background/expoBackgroundLocationController";
import {
  coerceTimeWarpFactor,
  createPhaseZeroJourney,
  getAllowedTimeWarpFactors,
  getCrawlFrame
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
  BACKGROUND_LOCATION_PERMISSION_COPY,
  configureOptionalBackgroundLocation,
  type BackgroundLocationMode
} from "../useCases/configureOptionalBackgroundLocation";
import { createDemoPersonalityJourneys } from "../useCases/demoSnailPersonalities";
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
  FIRST_RUN_ONBOARDING_STEPS,
  LOCATION_PRIVACY_PLAIN_LANGUAGE,
  shouldShowOnboarding
} from "../useCases/onboarding";
import {
  getPurchaseCatalog,
  purchaseInventory,
  type PurchaseProductId
} from "../useCases/purchaseInventory";
import {
  createInitialCarrierState,
  getActiveJourney,
  InMemoryCarrierRepository,
  listStableSnails
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

type BackendSession = {
  repository: BackendCarrierRepository;
  user: CarrierUser;
};

type MapScreenProps = {
  activeTab: BottomTabId;
};

export function MapScreen({ activeTab }: MapScreenProps) {
  const [target, setTarget] = useState<Coordinate>(MOCK_RESTING_POINT);
  const [locationLabel, setLocationLabel] = useState("Mock resting point");
  const [journeyCreatedAtMs, setJourneyCreatedAtMs] = useState(() => Date.now());
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "failed">(
    "loading"
  );
  const [mapMaximized, setMapMaximized] = useState(false);
  const cameraRef = useRef<CameraRef>(null);

  useEffect(() => {
    // Keep the camera centred on the user's location at an appropriate zoom,
    // recentring when a fresh coarse location arrives.
    cameraRef.current?.easeTo({
      center: [target.longitude, target.latitude],
      duration: 600,
      zoom: MAP_DEFAULT_ZOOM
    });
  }, [target.latitude, target.longitude]);
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
  const [personalityDemoEnabled, setPersonalityDemoEnabled] = useState(false);
  const [selectedWatchJourneyId, setSelectedWatchJourneyId] = useState<
    string | undefined
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
  const firstRestingSnail = stable.snails.find(
    (snail) => snail.status === "resting"
  );
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

  const demoJourney = useMemo(
    () =>
      createPhaseZeroJourney({
        createdAtMs: journeyCreatedAtMs,
        target
      }),
    [journeyCreatedAtMs, target]
  );
  const demoPersonalityJourneys = useMemo(
    () =>
      createDemoPersonalityJourneys({
        createdAtMs: journeyCreatedAtMs,
        target
      }),
    [journeyCreatedAtMs, target]
  );
  const watchState = useMemo(
    () =>
      buildJourneyWatchState({
        clock: { now: () => nowMs },
        scrubProgressByJourneyId:
          selectedWatchJourneyId && watchScrubProgress !== undefined
            ? { [selectedWatchJourneyId]: watchScrubProgress }
            : undefined,
        selectedJourneyId: selectedWatchJourneyId,
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
  const selectedWatchJourney = selectedWatchJourneyId
    ? watchState.journeys.find(
        ({ journeyId }) => journeyId === selectedWatchJourneyId
      )
    : undefined;
  const visibleCrawls = personalityDemoEnabled
    ? demoPersonalityJourneys.map((crawl) => ({
        highlighted: false,
        id: crawl.id,
        progress: getCrawlFrame({
          journey: crawl.journey,
          nowMs,
          timeWarpFactor
        }).progress,
        snail: crawl.snail,
        start: crawl.journey.start,
        target: crawl.journey.target
      }))
    : watchState.journeys.length > 0
      ? watchState.journeys.map((watchJourney) => ({
          highlighted:
            watchJourney.journeyId === selectedWatchJourney?.journeyId,
          id: watchJourney.journeyId,
          progress: watchJourney.preview.progress,
          snail:
            carrierState.snails.find(
              (snail) => snail.id === watchJourney.snailId
            ) ?? demoPersonalityJourneys[0].snail,
          start: watchJourney.start,
          target: watchJourney.target
        }))
      : [
          {
            highlighted: false,
            id: "single-demo",
            progress: getCrawlFrame({
              journey: demoJourney,
              nowMs,
              timeWarpFactor
            }).progress,
            snail: demoPersonalityJourneys[0].snail,
            start: demoJourney.start,
            target: demoJourney.target
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

  async function persistNextCarrierState(nextState: typeof carrierState) {
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

  async function assignSnailToTodo(todoId: string) {
    try {
      const repository = new InMemoryCarrierRepository(carrierState);

      assignSnailToToDo(
        { snailId: selectedSnailId || undefined, todoId },
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
    setSelectedWatchJourneyId(journeyId);
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
            {crawlGeo.map(({ id, polyline, snail, target: crawlTarget }) => {
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
                    id={`target-${id}`}
                    lngLat={[crawlTarget.longitude, crawlTarget.latitude]}
                  >
                    <View style={styles.targetMarker} />
                  </Marker>
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
                        { backgroundColor: snail.appearance.shellColor },
                        pressed ? styles.snailMarkerPressed : null
                      ]}
                    >
                      <Text style={styles.snailGlyph}>🐌</Text>
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
          <Pressable
            onPress={() => setMapMaximized((value) => !value)}
            style={({ pressed }) => [
              styles.mapToggle,
              pressed && styles.mapTogglePressed
            ]}
          >
            <Text style={styles.mapToggleText}>
              {mapMaximized ? "Collapse map" : "Expand map"}
            </Text>
          </Pressable>
        </View>

        {mapMaximized ? null : (
          <SafeAreaView style={styles.controls}>
            <ScrollView
              contentContainerStyle={styles.controlsContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
              {onboardingVisible ? (
                <View style={styles.onboardingPanel}>
                  <View style={styles.onboardingHeaderRow}>
                    <View style={styles.onboardingTitleBlock}>
                      <Text style={styles.onboardingKicker}>First delivery</Text>
                      <Text numberOfLines={1} style={styles.onboardingTitle}>
                        Garden Snail is ready
                      </Text>
                    </View>
                    <View style={styles.onboardingSnailBadge}>
                      <Text style={styles.onboardingSnailBadgeText}>1</Text>
                    </View>
                  </View>
                  <View style={styles.onboardingStepList}>
                    {FIRST_RUN_ONBOARDING_STEPS.map((step, index) => (
                      <View key={step} style={styles.onboardingStep}>
                        <Text style={styles.onboardingStepNumber}>{index + 1}</Text>
                        <Text style={styles.onboardingStepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.onboardingPrivacy}>
                    {LOCATION_PRIVACY_PLAIN_LANGUAGE}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Start with Garden Snail"
                    onPress={finishOnboarding}
                    style={({ pressed }) => [
                      styles.onboardingButton,
                      pressed ? styles.onboardingButtonPressed : null
                    ]}
                  >
                    <Text style={styles.onboardingButtonText}>
                      Start with Garden Snail
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.watchPanel}>
                <View style={styles.watchHeaderRow}>
                  <View style={styles.watchTitleBlock}>
                    <Text style={styles.watchKicker}>Details</Text>
                    <Text numberOfLines={1} style={styles.watchTitle}>
                      {selectedWatchJourney
                        ? selectedWatchJourney.reminderText
                        : watchState.journeys.length > 0
                          ? "No traveler selected"
                          : "The map is quiet"}
                    </Text>
                  </View>
                  {selectedWatchJourney ? (
                    <Text style={styles.watchProgress}>
                      {Math.round(selectedWatchJourney.preview.progress * 100)}%
                    </Text>
                  ) : null}
                </View>

                {selectedWatchJourney ? (
                  <>
                    <Text numberOfLines={2} style={styles.watchEta}>
                      {selectedWatchJourney.etaRange.copy}
                    </Text>
                    <Text numberOfLines={2} style={styles.watchMeta}>
                      Path {formatDistance(selectedWatchJourney.preview.travelledMeters)} crawled, {formatDistance(selectedWatchJourney.preview.remainingMeters)} left
                    </Text>
                    <Text numberOfLines={2} style={styles.watchMeta}>
                      Target {formatCoordinate(selectedWatchJourney.target)} · trail history {selectedWatchJourney.trailHistory.length}
                    </Text>
                  </>
                ) : (
                  <Text numberOfLines={2} style={styles.watchEta}>
                    {watchState.journeys.length > 0
                      ? "The trails are waiting for a closer look."
                      : "No snail is carrying a thought right now."}
                  </Text>
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
                  <View style={styles.watchActionRow}>
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
                  </View>
                ) : null}
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
            </ScrollView>
          </SafeAreaView>
        )}
      </View>

      {activeTab === "snails" ? (
        <MySnailsScreen
          canPurchase={!!entitlementProvider}
          carrierState={carrierState}
          onBuyProduct={(productId) => {
            void buyCatalogProduct(productId);
          }}
          onHatchEgg={(eggId) => {
            void hatchCarrierEgg(eggId);
          }}
          onLevelSelectedSnail={() => {
            void levelSelectedSnail();
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
          onAssignSnail={(todoId) => {
            void assignSnailToTodo(todoId);
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
          selectedStableSnail={selectedStableSnail}
          toDoItems={toDoItems}
          toDoText={toDoText}
        />
      ) : null}

      {activeTab === "notifications" ? <NotificationsScreen /> : null}
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
    justifyContent: "space-between",
    marginTop: 10
  },
  watchEta: {
    color: "#56645e",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6
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
    backgroundColor: "rgba(255, 255, 255, 0.68)",
    borderColor: "rgba(43, 58, 52, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 10
  },
  watchProgress: {
    color: "#3f6d5b",
    fontSize: 18,
    fontWeight: "800"
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
    justifyContent: "flex-end"
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
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2
  },
  watchTitleBlock: {
    flex: 1,
    minWidth: 0
  }
});

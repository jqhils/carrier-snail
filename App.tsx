import { Camera, Map } from "@maplibre/maplibre-react-native";
import { Canvas, Circle, Line, vec } from "@shopify/react-native-skia";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";

import {
  coerceTimeWarpFactor,
  createPhaseZeroJourney,
  getAllowedTimeWarpFactors,
  getCrawlFrame
} from "./src/journey/snailCrawl";
import type { Coordinate } from "./src/journey/snailCrawl";

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

export default function App() {
  const [target, setTarget] = useState<Coordinate>(MOCK_RESTING_POINT);
  const [locationLabel, setLocationLabel] = useState("Mock resting point");
  const [viewport, setViewport] = useState<Viewport>({ height: 0, width: 0 });
  const [journeyCreatedAtMs, setJourneyCreatedAtMs] = useState(() => Date.now());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [requestedWarp, setRequestedWarp] = useState(100000);
  const allowedWarps = getAllowedTimeWarpFactors(RUNTIME_MODE);
  const timeWarpFactor = coerceTimeWarpFactor(requestedWarp, RUNTIME_MODE);

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

    return () => {
      cancelled = true;
    };
  }, []);

  const journey = useMemo(
    () =>
      createPhaseZeroJourney({
        createdAtMs: journeyCreatedAtMs,
        target
      }),
    [journeyCreatedAtMs, target]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const frame = getCrawlFrame({
    journey,
    nowMs,
    timeWarpFactor
  });
  const overlay = projectCrawlToViewport(frame.progress, viewport);

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
          <Line
            color="rgba(53, 108, 91, 0.24)"
            p1={vec(overlay.start.x, overlay.start.y)}
            p2={vec(overlay.snail.x, overlay.snail.y)}
            strokeCap="round"
            strokeWidth={10}
          />
          <Line
            color="rgba(245, 248, 237, 0.84)"
            p1={vec(overlay.start.x, overlay.start.y)}
            p2={vec(overlay.snail.x, overlay.snail.y)}
            strokeCap="round"
            strokeWidth={3}
          />
          <Circle
            color="rgba(31, 93, 162, 0.2)"
            cx={overlay.target.x}
            cy={overlay.target.y}
            r={18}
          />
          <Circle
            color="#1f5da2"
            cx={overlay.target.x}
            cy={overlay.target.y}
            r={7}
          />
          <Circle color="#7b4b34" cx={overlay.snail.x - 9} cy={overlay.snail.y + 4} r={17} />
          <Circle color="#d99f5f" cx={overlay.snail.x + 7} cy={overlay.snail.y - 2} r={13} />
          <Circle color="#fff4d3" cx={overlay.snail.x + 12} cy={overlay.snail.y - 5} r={5} />
          <Line
            color="#3c2a1f"
            p1={vec(overlay.snail.x + 10, overlay.snail.y - 13)}
            p2={vec(overlay.snail.x + 22, overlay.snail.y - 26)}
            strokeCap="round"
            strokeWidth={2}
          />
          <Line
            color="#3c2a1f"
            p1={vec(overlay.snail.x + 2, overlay.snail.y - 13)}
            p2={vec(overlay.snail.x + 11, overlay.snail.y - 28)}
            strokeCap="round"
            strokeWidth={2}
          />
          <Circle color="#3c2a1f" cx={overlay.snail.x + 23} cy={overlay.snail.y - 27} r={2.5} />
          <Circle color="#3c2a1f" cx={overlay.snail.x + 12} cy={overlay.snail.y - 29} r={2.5} />
        </Canvas>
      </View>

      <SafeAreaView style={styles.controls}>
        <View>
          <Text style={styles.title}>Carrier Snail</Text>
          <Text style={styles.meta}>{locationLabel}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cycle debug time warp"
          onPress={cycleWarp}
          style={styles.warpButton}
        >
          <Text style={styles.warpValue}>{timeWarpFactor.toLocaleString()}x</Text>
          <Text style={styles.warpLabel}>warp</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function projectCrawlToViewport(progress: number, viewport: Viewport) {
  const width = Math.max(viewport.width, 1);
  const height = Math.max(viewport.height, 1);
  const start = {
    x: width * 0.19,
    y: height * 0.76
  };
  const target = {
    x: width * 0.74,
    y: height * 0.34
  };
  const easedProgress = Math.min(1, Math.max(0, progress));

  return {
    snail: {
      x: start.x + (target.x - start.x) * easedProgress,
      y: start.y + (target.y - start.y) * easedProgress
    },
    start,
    target
  };
}

const styles = StyleSheet.create({
  controls: {
    alignItems: "center",
    backgroundColor: "rgba(249, 247, 238, 0.94)",
    borderTopColor: "rgba(38, 51, 46, 0.12)",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    left: 0,
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 14,
    position: "absolute",
    right: 0
  },
  mapShell: {
    flex: 1
  },
  meta: {
    color: "#56645e",
    fontSize: 13,
    marginTop: 2
  },
  screen: {
    backgroundColor: "#edf1e8",
    flex: 1
  },
  title: {
    color: "#25332e",
    fontSize: 21,
    fontWeight: "700"
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

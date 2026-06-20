import { useState } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { portraitForSnail } from "./src/minigames/snailSprites";
import { creditSnailGameReward } from "./src/minigames/snailGameReward";
import {
  SnailGameFlowProvider,
  useSnailGameFlow
} from "./src/minigames/SnailGameFlow";
import {
  createStarterGardenSnail,
  type Snail
} from "./src/useCases/localCarrierState";

// Throwaway harness: stands in for the app so you can run the WHOLE flow
// standalone (tap a snail -> detail -> games -> play -> slime reward). In the
// real app this provider wraps MapScreen and onReward credits CarrierState.
// Snail ids here match the portrait keys so each shows its illustration.

function makeSnail(
  id: string,
  name: string,
  shellColor: string,
  bodyColor: string
): Snail {
  return {
    ...createStarterGardenSnail(),
    appearance: { bodyColor, shellColor },
    id,
    name
  };
}

const INITIAL_SNAILS: Snail[] = [
  makeSnail("compsci", "Comp Sci Snail", "#7a4a24", "#f0d6a8"),
  makeSnail("redbull", "Redbull Snail", "#26368f", "#fbe7c6"),
  makeSnail("train", "City Circle Snail", "#6b7280", "#e7d6b0"),
  makeSnail("businessman", "Business Snail", "#6f4a2a", "#efd9b0"),
  makeSnail("graduate", "Graduate Snail", "#3c2a1f", "#f0d6a8")
];

export default function App() {
  const [snails, setSnails] = useState<Snail[]>(INITIAL_SNAILS);
  const [slime, setSlime] = useState(0);

  return (
    <SafeAreaView style={styles.fill}>
      <SnailGameFlowProvider
        slimeBalance={slime}
        onReward={(snailId, reward) => {
          const credited = creditSnailGameReward(snails, snailId, reward, slime);
          setSnails(credited.snails);
          setSlime(credited.slime);
        }}
      >
        <Stable slime={slime} snails={snails} />
      </SnailGameFlowProvider>
    </SafeAreaView>
  );
}

function Stable({ slime, snails }: { slime: number; snails: Snail[] }) {
  const { open } = useSnailGameFlow();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>My Snails</Text>
      <Text style={styles.slime}>{slime} slime</Text>
      {snails.map((snail) => (
        <Pressable
          key={snail.id}
          accessibilityRole="button"
          onPress={() => open(snail)}
          style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
        >
          <View style={styles.thumbTile}>
            <Image
              source={portraitForSnail(snail.id)}
              style={styles.thumb}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.rowText}>
            {snail.name} · Lv {snail.level}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18
  },
  fill: {
    backgroundColor: "#eef1e8",
    flex: 1
  },
  pressed: {
    opacity: 0.85
  },
  row: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 10,
    padding: 12
  },
  rowText: {
    color: "#2f4a3d",
    fontSize: 16,
    fontWeight: "700"
  },
  slime: {
    color: "#3f6d5b",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 14,
    marginTop: 2
  },
  thumb: {
    height: 44,
    width: 52
  },
  thumbTile: {
    alignItems: "center",
    backgroundColor: "#20271f",
    borderRadius: 10,
    height: 52,
    justifyContent: "center",
    marginRight: 12,
    width: 60
  },
  title: {
    color: "#2f4a3d",
    fontSize: 26,
    fontWeight: "900"
  }
});

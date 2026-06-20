import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

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
// standalone (tap a snail -> detail -> games -> play -> slime reward), no
// template needed. In the real app this provider wraps MapScreen and onReward
// credits CarrierState instead of this local state. Delete when integrated.

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
  makeSnail("s1", "Garden Snail", "#7b4b34", "#d99f5f"),
  makeSnail("s2", "Redbull Snail", "#e10600", "#fbe7c6"),
  makeSnail("s3", "USYD Snail", "#b5651d", "#efd9b0")
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
          <View
            style={[
              styles.chip,
              { backgroundColor: snail.appearance.shellColor }
            ]}
          />
          <Text style={styles.rowText}>
            {snail.name} · Lv {snail.level}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 16,
    height: 32,
    marginRight: 12,
    width: 32
  },
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
    padding: 14
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
  title: {
    color: "#2f4a3d",
    fontSize: 26,
    fontWeight: "900"
  }
});

import { SafeAreaView, StyleSheet } from "react-native";

import { GamesHub } from "./src/minigames/GamesHub";

// Throwaway harness: the whole app is the Games tab, so you can run the hub on
// the Simulator/phone with no dependency on the real template. When the real
// tab navigator lands, mount <GamesHub /> into it and delete this file.
export default function App() {
  return (
    <SafeAreaView style={styles.fill}>
      <GamesHub />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: {
    backgroundColor: "#eef1f5",
    flex: 1
  }
});

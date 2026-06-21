import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GamesListScreen } from "./GamesListScreen";
import { getHighScore, mergeHighScore, type HighScoreMap } from "./highScores";
import { loadHighScores, persistHighScores } from "./highScoresStorage";
import { PlaySnailGame } from "./PlaySnailGame";
import { Play2048 } from "./Play2048";
import { PlaySnake } from "./PlaySnake";
import { SnailDetailScreen } from "./SnailDetailScreen";
import type { SnailGameReward } from "./snailGameReward";
import type { GameId, GameResult } from "./types";
import type { Snail } from "../useCases/localCarrierState";

type Step = "detail" | "games" | "playing";

type SnailGameFlow = {
  // Open the snail flow (detail -> games -> game) for a snail. Call this from a
  // snail card's onPress, the home PLAY button, the map sheet — anywhere.
  open: (snail: Snail) => void;
};

const FlowContext = createContext<SnailGameFlow | null>(null);

export function useSnailGameFlow(): SnailGameFlow {
  const ctx = useContext(FlowContext);
  if (!ctx) {
    throw new Error(
      "useSnailGameFlow must be used inside <SnailGameFlowProvider>"
    );
  }
  return ctx;
}

type ProviderProps = {
  children: ReactNode;
  // Fires when the games overlay opens/closes (active = a snail's flow is open).
  // The host uses this to hide chrome (tab bar) + pause background work for perf.
  onActiveChange?: (active: boolean) => void;
  // Optional stub routes a teammate owns (cosmetics / shop).
  onOpenCosmetics?: (snail: Snail) => void;
  onOpenShop?: (snail: Snail) => void;
  // Credit a finished run's reward (slime + xp) into app state. Optional so the
  // flow runs standalone; wire it to your CarrierState updater to keep slime.
  onReward?: (
    snailId: string,
    reward: SnailGameReward,
    result: GameResult
  ) => void;
  // Display-only current slime balance, shown on the detail + games screens.
  slimeBalance?: number;
  // All owned snails — lets the games screen show a real cross-stable
  // leaderboard. Host passes carrierState.snails.
  snails?: Snail[];
};

// Wrap the app content with this once (high enough to overlay everything and to
// be an ancestor of whatever calls useSnailGameFlow). It renders the whole
// detail -> games -> game stack as an overlay on top of `children`.
export function SnailGameFlowProvider({
  children,
  onActiveChange,
  onOpenCosmetics,
  onOpenShop,
  onReward,
  slimeBalance,
  snails
}: ProviderProps) {
  const [snail, setSnail] = useState<Snail | null>(null);
  const [step, setStep] = useState<Step>("detail");
  const [activeGame, setActiveGame] = useState<GameId>("flappy");
  const [menuOpen, setMenuOpen] = useState(false);
  // Bumping this remounts the active game — the menu's Restart.
  const [runKey, setRunKey] = useState(0);
  const [highScores, setHighScores] = useState<HighScoreMap>({});

  useEffect(() => {
    let active = true;
    void loadHighScores().then((loaded) => {
      if (active) {
        setHighScores(loaded);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Tell the host whenever the overlay opens or closes.
  useEffect(() => {
    onActiveChange?.(snail !== null);
  }, [snail, onActiveChange]);

  const value = useMemo<SnailGameFlow>(
    () => ({
      open: (next: Snail) => {
        setSnail(next);
        // The app's own My Snails detail page (#58) is the snail detail screen;
        // enter Park07's flow directly at the games hub.
        setStep("games");
      }
    }),
    []
  );

  function handleReward(
    snailId: string,
    reward: SnailGameReward,
    result: GameResult
  ) {
    setHighScores((current) => {
      const next = mergeHighScore(
        current,
        result.characterId,
        result.gameId,
        result.score
      );
      if (next !== current) {
        void persistHighScores(next);
      }
      return next;
    });
    onReward?.(snailId, reward, result);
  }

  return (
    <FlowContext.Provider value={value}>
      {children}
      {snail ? (
        <View style={styles.overlay}>
          {step === "detail" ? (
            <SnailDetailScreen
              snail={snail}
              slimeBalance={slimeBalance}
              onBack={() => setSnail(null)}
              onPlayGames={() => setStep("games")}
              onCosmetics={
                onOpenCosmetics ? () => onOpenCosmetics(snail) : undefined
              }
              onShop={onOpenShop ? () => onOpenShop(snail) : undefined}
            />
          ) : null}

          {step === "games" ? (
            <GamesListScreen
              snail={snail}
              snails={snails}
              slimeBalance={slimeBalance}
              highScores={highScores}
              onBack={() => setSnail(null)}
              onPlay={(gameId) => {
                setActiveGame(gameId);
                setMenuOpen(false);
                setStep("playing");
              }}
            />
          ) : null}

          {step === "playing" && activeGame === "flappy" ? (
            <PlaySnailGame
              key={runKey}
              snail={snail}
              bestScore={getHighScore(highScores, snail.id, "flappy")}
              onClose={() => setStep("games")}
              onReward={handleReward}
              paused={menuOpen}
            />
          ) : null}

          {step === "playing" && activeGame === "2048" ? (
            <Play2048
              key={runKey}
              snail={snail}
              bestScore={getHighScore(highScores, snail.id, "2048")}
              onClose={() => setStep("games")}
              onReward={handleReward}
            />
          ) : null}

          {step === "playing" && activeGame === "snake" ? (
            <PlaySnake
              key={runKey}
              snail={snail}
              bestScore={getHighScore(highScores, snail.id, "snake")}
              onClose={() => setStep("games")}
              onReward={handleReward}
              paused={menuOpen}
            />
          ) : null}

          {step === "playing" ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Game menu"
              onPress={() => setMenuOpen(true)}
              style={styles.menuButton}
            >
              <Text style={styles.menuButtonText}>☰</Text>
            </Pressable>
          ) : null}

          {step === "playing" && menuOpen ? (
            <View style={styles.pauseOverlay}>
              <View style={styles.pauseCard}>
                <Text style={styles.pauseTitle}>Paused</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setMenuOpen(false)}
                  style={styles.pauseButton}
                >
                  <Text style={styles.pauseButtonText}>Resume</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setRunKey((key) => key + 1);
                    setMenuOpen(false);
                  }}
                  style={styles.pauseButton}
                >
                  <Text style={styles.pauseButtonText}>Restart</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStep("games")}
                  style={[styles.pauseButton, styles.pauseButtonQuit]}
                >
                  <Text style={styles.pauseButtonText}>Quit</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </FlowContext.Provider>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    alignItems: "center",
    backgroundColor: "rgba(37,51,46,0.82)",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: 14,
    top: 48,
    width: 36,
    zIndex: 60
  },
  menuButtonText: { color: "#f8f6ed", fontSize: 18, fontWeight: "800" },
  overlay: {
    backgroundColor: "#edf1e8",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 50
  },
  pauseButton: {
    alignItems: "center",
    backgroundColor: "#3f6d5b",
    borderRadius: 10,
    paddingVertical: 12
  },
  pauseButtonQuit: { backgroundColor: "#a85a32" },
  pauseButtonText: { color: "#f8f6ed", fontSize: 15, fontWeight: "800" },
  pauseCard: {
    backgroundColor: "#f8f6ed",
    borderRadius: 18,
    gap: 10,
    padding: 22,
    width: 240
  },
  pauseOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(37,51,46,0.55)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 60
  },
  pauseTitle: {
    color: "#25332e",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
    textAlign: "center"
  }
});

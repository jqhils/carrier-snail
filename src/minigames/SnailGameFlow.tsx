import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { StyleSheet, View } from "react-native";

import { GamesListScreen } from "./GamesListScreen";
import { getHighScore, mergeHighScore, type HighScoreMap } from "./highScores";
import { loadHighScores, persistHighScores } from "./highScoresStorage";
import { PlaySnailGame } from "./PlaySnailGame";
import { Play2048 } from "./Play2048";
import { PlaySnake } from "./PlaySnake";
import { PlaySaltStorm } from "./PlaySaltStorm";
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
  onOpenCosmetics,
  onOpenShop,
  onReward,
  slimeBalance,
  snails
}: ProviderProps) {
  const [snail, setSnail] = useState<Snail | null>(null);
  const [step, setStep] = useState<Step>("detail");
  const [activeGame, setActiveGame] = useState<GameId>("flappy");
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

  const value = useMemo<SnailGameFlow>(
    () => ({
      open: (next: Snail) => {
        setSnail(next);
        setStep("detail");
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
              onBack={() => setStep("detail")}
              onPlay={(gameId) => {
                setActiveGame(gameId);
                setStep("playing");
              }}
            />
          ) : null}

          {step === "playing" && activeGame === "flappy" ? (
            <PlaySnailGame
              snail={snail}
              bestScore={getHighScore(highScores, snail.id, "flappy")}
              onClose={() => setStep("games")}
              onReward={handleReward}
            />
          ) : null}

          {step === "playing" && activeGame === "2048" ? (
            <Play2048
              snail={snail}
              bestScore={getHighScore(highScores, snail.id, "2048")}
              onClose={() => setStep("games")}
              onReward={handleReward}
            />
          ) : null}

          {step === "playing" && activeGame === "snake" ? (
            <PlaySnake
              snail={snail}
              bestScore={getHighScore(highScores, snail.id, "snake")}
              onClose={() => setStep("games")}
              onReward={handleReward}
            />
          ) : null}

          {step === "playing" && activeGame === "salt" ? (
            <PlaySaltStorm
              snail={snail}
              bestScore={getHighScore(highScores, snail.id, "salt")}
              onClose={() => setStep("games")}
              onReward={handleReward}
            />
          ) : null}
        </View>
      ) : null}
    </FlowContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "#eef1e8",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 50
  }
});

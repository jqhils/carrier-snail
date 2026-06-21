import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";

import { SnailSprite } from "../components/SnailSprite";
import { GAMES } from "./gamesCatalog";
import { getHighScore, type HighScoreMap } from "./highScores";
import type { Snail } from "../useCases/localCarrierState";
import type { SnailSpeciesId } from "../useCases/snailSpecies";
import type { GameId } from "./types";

type Props = {
  highScores: HighScoreMap;
  onBack: () => void;
  onPlay: (gameId: GameId) => void;
  // All owned snails — used to resolve names/sprites for the leaderboard. The
  // host passes carrierState.snails; defaults to just the active snail so the
  // screen still works before that's wired.
  snails?: Snail[];
  slimeBalance?: number;
  snail: Snail;
};

const GREEN = "#3f6d5b";
const INK = "#25332e";
const MUTED = "#56645e";

// "Game Corner" — the per-snail games hub: a tile grid of games (each showing
// this snail's best + Play) and a leaderboard of the stable's real top scores.
export function GamesListScreen({
  highScores,
  onBack,
  onPlay,
  snails,
  slimeBalance,
  snail
}: Props) {
  const { width } = useWindowDimensions();
  const tileW = (Math.min(width, 460) - 18 * 2 - 12) / 2;

  const roster = snails && snails.length > 0 ? snails : [snail];
  const playable = GAMES.filter((game) => game.available).length;
  const board = buildLeaderboard(highScores, roster);

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.back, pressed ? styles.pressed : null]}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        {typeof slimeBalance === "number" ? (
          <View style={styles.slimePill}>
            <View style={styles.slimeDot} />
            <Text style={styles.slimeText}>{slimeBalance} slime</Text>
          </View>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>ARCADE</Text>
        <Text style={styles.title}>Game Corner</Text>

        <View style={styles.playing}>
          <View style={styles.avatarTile}>
            <SnailSprite speciesId={snail.speciesId} size={40} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.who} numberOfLines={1}>
              Playing as {snail.name}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              Lv {snail.level} · {snail.rarity} · earns slime per run
            </Text>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Games</Text>
          <Text style={styles.sectionMeta}>
            {playable} playable
          </Text>
        </View>

        <View style={styles.grid}>
          {GAMES.map((game) => {
            const best = getHighScore(highScores, snail.id, game.id);
            return (
              <Pressable
                key={game.id}
                accessibilityRole="button"
                disabled={!game.available}
                onPress={() => onPlay(game.id)}
                style={({ pressed }) => [
                  styles.tile,
                  { width: tileW },
                  pressed && game.available ? styles.pressed : null
                ]}
              >
                <View style={styles.art}>
                  <GameArt gameId={game.id} />
                  {game.available ? null : (
                    <View style={styles.lockBadge}>
                      <Text style={styles.lockText}>SOON</Text>
                    </View>
                  )}
                </View>
                <View style={styles.tileBody}>
                  <Text style={styles.tileName} numberOfLines={1}>
                    {game.name}
                  </Text>
                  <View style={styles.tileMeta}>
                    {game.available ? (
                      <>
                        <Text style={styles.best}>
                          Best <Text style={styles.bestNum}>{best}</Text>
                        </Text>
                        <View style={styles.playPill}>
                          <Text style={styles.playText}>Play</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={styles.best} numberOfLines={1}>
                          {game.blurb}
                        </Text>
                        <View style={styles.soonPill}>
                          <Text style={styles.soonText}>Soon</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Top scores</Text>
          <Text style={styles.sectionMeta}>your stable</Text>
        </View>

        <View style={styles.leader}>
          {board.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No scores yet</Text>
              <Text style={styles.emptySub}>
                Play a game to get your snails on the board.
              </Text>
            </View>
          ) : (
            board.map((entry, i) => (
              <View
                key={`${entry.snailId}:${entry.gameId}`}
                style={[styles.lRow, i === 0 ? styles.lRowFirst : null]}
              >
                <Text style={styles.rank}>{i + 1}</Text>
                <View style={styles.lAvatar}>
                  {entry.speciesId ? (
                    <SnailSprite speciesId={entry.speciesId} size={28} />
                  ) : null}
                </View>
                <View style={styles.flex}>
                  <Text style={styles.lName} numberOfLines={1}>
                    {entry.snailName}
                  </Text>
                  <Text style={styles.lGame} numberOfLines={1}>
                    {entry.gameName}
                  </Text>
                </View>
                <Text style={styles.lScore}>{entry.score.toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

type BoardEntry = {
  gameId: string;
  gameName: string;
  score: number;
  snailId: string;
  snailName: string;
  speciesId?: SnailSpeciesId;
};

// Build the leaderboard from REAL stored scores: every snail/game best > 0,
// resolved to a name + sprite, sorted high to low. (Scores are cross-game, so
// 2048's big numbers naturally top Flappy's — fine for a single board.)
function buildLeaderboard(
  highScores: HighScoreMap,
  roster: Snail[]
): BoardEntry[] {
  const entries: BoardEntry[] = [];
  for (const [key, score] of Object.entries(highScores)) {
    if (score <= 0) {
      continue;
    }
    const sep = key.indexOf(":");
    const snailId = key.slice(0, sep);
    const gameId = key.slice(sep + 1);
    const owner = roster.find((s) => s.id === snailId);
    const game = GAMES.find((g) => g.id === gameId);
    entries.push({
      gameId,
      gameName: game ? game.name : gameId,
      score,
      snailId,
      snailName: owner ? owner.name : "Snail",
      speciesId: owner ? owner.speciesId : undefined
    });
  }
  return entries.sort((a, b) => b.score - a.score).slice(0, 5);
}

// Small game-flavoured tile art, built from plain Views (no Skia needed here).
function GameArt({ gameId }: { gameId: GameId }) {
  if (gameId === "flappy") {
    return (
      <View style={[styles.artFill, { backgroundColor: "#7ed0dd" }]}>
        <View style={styles.sun} />
        <View style={[styles.pipe, { right: 34, top: 0, height: 30 }]} />
        <View style={[styles.pipeCap, { right: 30, top: 28 }]} />
        <View style={[styles.pipe, { right: 34, bottom: 14, height: 24 }]} />
        <View style={[styles.pipeCap, { right: 30, bottom: 38 }]} />
        <View style={styles.snailDot} />
        <View style={styles.grass} />
      </View>
    );
  }
  if (gameId === "2048") {
    const cells: { v: number; bg: string; fg: string }[] = [
      { v: 2, bg: "#eee4da", fg: "#5b5147" },
      { v: 8, bg: "#f2b179", fg: "#fff" },
      { v: 4, bg: "#eee4da", fg: "#5b5147" },
      { v: 32, bg: "#f67c5f", fg: "#fff" },
      { v: 2048, bg: GREEN, fg: "#fff" },
      { v: 2, bg: "#eee4da", fg: "#5b5147" },
      { v: 4, bg: "#eee4da", fg: "#5b5147" },
      { v: 128, bg: "#edcf72", fg: "#fff" },
      { v: 8, bg: "#f2b179", fg: "#fff" }
    ];
    return (
      <View style={[styles.artFill, styles.board2048]}>
        {cells.map((c, i) => (
          <View key={i} style={[styles.cell, { backgroundColor: c.bg }]}>
            <Text
              style={{
                color: c.fg,
                fontSize: c.v >= 1000 ? 9 : 12,
                fontWeight: "800"
              }}
            >
              {c.v}
            </Text>
          </View>
        ))}
      </View>
    );
  }
  if (gameId === "snake") {
    return (
      <View style={[styles.artFill, { backgroundColor: INK }]}>
        <View style={[styles.seg, { left: 28, top: 32 }]} />
        <View style={[styles.seg, { left: 44, top: 32 }]} />
        <View style={[styles.seg, { left: 60, top: 32 }]} />
        <View style={[styles.seg, { left: 60, top: 48 }]} />
        <View style={styles.apple} />
      </View>
    );
  }
  return (
    <View style={[styles.artFill, styles.mystery]}>
      <Text style={styles.mysteryMark}>?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  apple: {
    backgroundColor: "#e24b4a",
    borderRadius: 6,
    height: 11,
    position: "absolute",
    right: 22,
    top: 22,
    width: 11
  },
  art: { height: 96, overflow: "hidden", position: "relative" },
  artFill: { height: "100%", position: "relative", width: "100%" },
  avatarTile: {
    alignItems: "center",
    backgroundColor: "#eef3e6",
    borderRadius: 12,
    height: 46,
    justifyContent: "center",
    width: 46
  },
  back: { paddingHorizontal: 6, paddingVertical: 4 },
  backText: { color: GREEN, fontSize: 26, fontWeight: "800" },
  best: { color: MUTED, fontSize: 12, fontWeight: "700" },
  bestNum: { color: GREEN, fontWeight: "800" },
  board2048: {
    backgroundColor: "#cbb79b",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    padding: 7
  },
  cell: {
    alignItems: "center",
    borderRadius: 4,
    height: 22,
    justifyContent: "center",
    width: 22
  },
  content: { paddingBottom: 36, paddingHorizontal: 18 },
  empty: { alignItems: "center", paddingHorizontal: 16, paddingVertical: 26 },
  emptySub: {
    color: MUTED,
    fontSize: 13,
    marginTop: 4,
    textAlign: "center"
  },
  emptyTitle: { color: INK, fontSize: 16, fontWeight: "800" },
  flex: { flex: 1 },
  grass: {
    backgroundColor: "#8fc46a",
    borderTopColor: "#cdebb0",
    borderTopWidth: 3,
    bottom: 0,
    height: 14,
    left: 0,
    position: "absolute",
    right: 0
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  kicker: {
    color: "#8a9684",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 6
  },
  lAvatar: {
    alignItems: "center",
    backgroundColor: "#eef3e6",
    borderRadius: 9,
    height: 34,
    justifyContent: "center",
    overflow: "hidden",
    width: 34
  },
  lGame: { color: MUTED, fontSize: 12, marginTop: 1 },
  lName: { color: INK, fontSize: 14, fontWeight: "800" },
  lRow: {
    alignItems: "center",
    borderTopColor: "#eef1e8",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 11
  },
  lRowFirst: { borderTopWidth: 0 },
  lScore: { color: INK, fontSize: 15, fontWeight: "900" },
  leader: {
    backgroundColor: "#f8f6ed",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 4
  },
  lockBadge: {
    backgroundColor: "rgba(47,74,61,0.78)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: "absolute",
    right: 8,
    top: 8
  },
  lockText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1
  },
  mystery: {
    alignItems: "center",
    backgroundColor: "#dfe6d6",
    justifyContent: "center"
  },
  mysteryMark: { color: "#b3bea6", fontSize: 40, fontWeight: "900" },
  pipe: { backgroundColor: "#73c63a", position: "absolute", width: 26 },
  pipeCap: {
    backgroundColor: "#69b834",
    borderRadius: 3,
    height: 10,
    position: "absolute",
    width: 34
  },
  playPill: {
    backgroundColor: GREEN,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6
  },
  playText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  playing: {
    alignItems: "center",
    backgroundColor: "#f8f6ed",
    borderRadius: 16,
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    padding: 10
  },
  pressed: { opacity: 0.85 },
  rank: {
    color: GREEN,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
    width: 22
  },
  screen: { backgroundColor: "#edf1e8", flex: 1 },
  sectionHead: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 18,
    paddingHorizontal: 2
  },
  sectionMeta: { color: MUTED, fontSize: 12 },
  sectionTitle: { color: INK, fontSize: 18, fontWeight: "900" },
  seg: {
    backgroundColor: "#8fd07a",
    borderRadius: 3,
    height: 13,
    position: "absolute",
    width: 13
  },
  slimeDot: {
    backgroundColor: "#6fae7e",
    borderRadius: 6,
    height: 12,
    width: 12
  },
  slimePill: {
    alignItems: "center",
    backgroundColor: "#e3ecdd",
    borderRadius: 20,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  slimeText: { color: GREEN, fontSize: 14, fontWeight: "800" },
  snailDot: {
    backgroundColor: "#e7cfa3",
    borderRadius: 8,
    height: 14,
    left: 30,
    position: "absolute",
    top: 44,
    width: 20
  },
  soonPill: {
    backgroundColor: "#e7ebe1",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  soonText: { color: "#9aa79a", fontSize: 12, fontWeight: "800" },
  sub: { color: MUTED, fontSize: 12, marginTop: 1 },
  sun: {
    backgroundColor: "#fdf3c4",
    borderRadius: 13,
    height: 26,
    left: 12,
    position: "absolute",
    top: 10,
    width: 26
  },
  tile: {
    backgroundColor: "#f8f6ed",
    borderRadius: 18,
    overflow: "hidden"
  },
  tileBody: { padding: 10 },
  tileMeta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6
  },
  tileName: { color: INK, fontSize: 15, fontWeight: "900" },
  title: { color: INK, fontSize: 30, fontWeight: "900", lineHeight: 34 },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 8
  },
  who: { color: INK, fontSize: 15, fontWeight: "800" }
});

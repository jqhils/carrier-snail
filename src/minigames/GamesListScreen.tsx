import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";

import { PixelButton } from "../components/PixelButton";
import { RarityBadge, SlimeChip } from "../components/PixelUI";
import { SnailSprite } from "../components/SnailSprite";
import { colors, pixelShadow, radii, space, text } from "../theme";
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

// Local aliases so the GameArt sprite blocks read against semantic tokens:
// GREEN is the primary CTA grape (2048's winning tile), INK the plum text/border
// ink (the snake board).
const GREEN = colors.primary;
const INK = colors.textPrimary;

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
  // This hub is shown full-screen (tab bar hidden), so clear the status bar.
  const topInset = (StatusBar.currentHeight ?? 0) + space.sm;

  const roster = snails && snails.length > 0 ? snails : [snail];
  const playable = GAMES.filter((game) => game.available).length;
  const board = buildLeaderboard(highScores, roster);

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: topInset }]}>
        <PixelButton
          accessibilityLabel={`Back to ${snail.name}`}
          label="‹ Back"
          onPress={onBack}
          size="compact"
          variant="neutral"
        />
        {typeof slimeBalance === "number" ? (
          <SlimeChip count={slimeBalance} />
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
            <View style={styles.playingMeta}>
              <Text style={styles.sub} numberOfLines={1}>
                Lv {snail.level}
              </Text>
              <RarityBadge rarity={snail.rarity} />
              <Text style={styles.sub} numberOfLines={1}>
                · earns slime per run
              </Text>
            </View>
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
  if (gameId === "salt") {
    return (
      <View style={[styles.artFill, { backgroundColor: "#454d68" }]}>
        <View style={styles.saltMoon} />
        <View style={[styles.saltDot, { left: 26, top: 16 }]} />
        <View style={[styles.saltDot, { left: 64, top: 38 }]} />
        <View style={[styles.saltDot, { left: 104, top: 22 }]} />
        <View style={[styles.saltDot, { left: 48, top: 56 }]} />
        <View style={styles.saltShaker} />
        <View style={styles.saltGround} />
        <View style={styles.saltSnail} />
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
  art: {
    borderBottomColor: colors.border,
    borderBottomWidth: 2,
    height: 96,
    overflow: "hidden",
    position: "relative"
  },
  artFill: { height: "100%", position: "relative", width: "100%" },
  avatarTile: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 2,
    height: 46,
    justifyContent: "center",
    width: 46
  },
  best: { ...text.bodySm, color: colors.textMuted },
  bestNum: { ...text.pixelLabel, color: colors.accentGoldBevel },
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
  content: { paddingBottom: 36, paddingHorizontal: space.lg },
  empty: { alignItems: "center", paddingHorizontal: space.lg, paddingVertical: space.xxl },
  emptySub: {
    ...text.body,
    color: colors.textMuted,
    marginTop: space.xs,
    textAlign: "center"
  },
  emptyTitle: { ...text.pixelHeading, color: colors.textPrimary },
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  kicker: {
    ...text.pixelLabel,
    color: colors.accentWarm,
    marginTop: space.sm,
    textTransform: "uppercase"
  },
  lAvatar: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    height: 34,
    justifyContent: "center",
    overflow: "hidden",
    width: 34
  },
  lGame: { ...text.bodySm, color: colors.textMuted, marginTop: 1 },
  lName: { ...text.bodyStrong, color: colors.textPrimary },
  lRow: {
    alignItems: "center",
    borderTopColor: colors.borderHairline,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: space.md,
    paddingVertical: space.md
  },
  lRowFirst: { borderTopWidth: 0 },
  lScore: { ...text.pixelScore, color: colors.accentGoldBevel },
  leader: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 2,
    paddingHorizontal: space.md,
    paddingVertical: space.xs
  },
  lockBadge: {
    backgroundColor: colors.mapOverlay,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: "absolute",
    right: 8,
    top: 8
  },
  lockText: {
    ...text.pixelMicro,
    color: colors.textOnDark
  },
  mystery: {
    alignItems: "center",
    backgroundColor: colors.backgroundSunken,
    justifyContent: "center"
  },
  mysteryMark: { ...text.pixelHero, color: colors.textDisabled, fontSize: 40 },
  pipe: { backgroundColor: "#73c63a", position: "absolute", width: 26 },
  pipeCap: {
    backgroundColor: "#69b834",
    borderRadius: 3,
    height: 10,
    position: "absolute",
    width: 34
  },
  playPill: {
    backgroundColor: colors.primary,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 2,
    paddingHorizontal: space.md,
    paddingVertical: space.xs
  },
  playText: { ...text.pixelMicro, color: colors.textOnAccent },
  playing: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 2,
    flexDirection: "row",
    gap: space.md,
    marginTop: space.md,
    padding: space.md
  },
  playingMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.xs,
    marginTop: space.xs
  },
  pressed: { opacity: 0.85 },
  rank: {
    ...text.pixelLabel,
    color: colors.primary,
    textAlign: "center",
    width: 22
  },
  saltDot: { backgroundColor: "rgba(255,255,255,0.85)", borderRadius: 2, height: 4, position: "absolute", width: 4 },
  saltGround: { backgroundColor: "#6b5640", borderTopColor: "#6fae54", borderTopWidth: 3, bottom: 0, height: 12, left: 0, position: "absolute", right: 0 },
  saltMoon: { backgroundColor: "#f3efe1", borderRadius: 9, height: 18, position: "absolute", right: 12, top: 10, width: 18 },
  saltShaker: { backgroundColor: "#eef3f7", borderRadius: 3, height: 22, left: 80, position: "absolute", top: 30, width: 14 },
  saltSnail: { backgroundColor: "#e7cfa3", borderRadius: 6, bottom: 12, height: 12, left: 40, position: "absolute", width: 18 },
  screen: { backgroundColor: colors.background, flex: 1 },
  sectionHead: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: space.sm,
    marginTop: space.lg,
    paddingHorizontal: 2
  },
  sectionMeta: { ...text.bodySm, color: colors.textMuted },
  sectionTitle: { ...text.pixelHeading, color: colors.textPrimary },
  seg: {
    backgroundColor: "#8fd07a",
    borderRadius: 3,
    height: 13,
    position: "absolute",
    width: 13
  },
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
    backgroundColor: colors.disabledFill,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 2,
    paddingHorizontal: space.md,
    paddingVertical: space.xs
  },
  soonText: { ...text.pixelMicro, color: colors.textMuted },
  sub: { ...text.bodySm, color: colors.textMuted },
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 2,
    overflow: "hidden",
    ...pixelShadow
  },
  tileBody: { padding: space.md },
  tileMeta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: space.sm
  },
  tileName: { ...text.pixelLabel, color: colors.textPrimary },
  title: { ...text.pixelHero, color: colors.textPrimary },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: space.md
  },
  who: { ...text.bodyStrong, color: colors.textPrimary }
});

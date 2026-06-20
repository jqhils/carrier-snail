# Snail minigame — integration guide

Verified on latest `main`: these files merge with **zero conflicts** and the full
gate stays green (typecheck + lint + **100 tests**). The whole flow runs
standalone in `GamesHarnessApp.tsx` (tap a snail → detail → Games list → play →
slime reward, high score persisting).

## The shape

A minigame is played **as a specific snail**, reached from My Snails:

    My Snails → tap snail → [their selected panel: Level | **Open**]
      → Snail detail (stats + Play Games + Cosmetics* + Shop*)
        → Games list (per-game High Score + Play)
          → the game

`*` Cosmetics / Shop are **stub buttons** — a teammate owns those flows.

Everything from "Snail detail" onward is one overlay owned by
`SnailGameFlowProvider`. You trigger it with a one-line hook call:
`useSnailGameFlow().open(snail)`. The home-view PLAY button (when it exists) calls
the exact same line — no second wiring, no conflict.

**Rewards:**
- **Slime + xp**, credited to CarrierState — same as a delivery arrival. Spend
  slime to level (their existing `levelUpSnail`). Never touches delivery time.
- **High score** persists device-locally in AsyncStorage (per snail, per game) —
  no schema change, no Supabase migration.

## Edit 1 — MapScreen.tsx (wrap once + credit the reward)

MapScreen owns `carrierState` and renders the tab screens, so the provider wraps
its return and the reward rides the same persist path as `levelSelectedSnail`.

Add imports:

    import { SnailGameFlowProvider } from "../minigames/SnailGameFlow";
    import { creditSnailGameReward, type SnailGameReward } from "../minigames/snailGameReward";
    import type { GameResult } from "../minigames/types";

Add a reward handler (next to `levelSelectedSnail`):

    async function awardSnailGameReward(
      snailId: string,
      reward: SnailGameReward,
      _result: GameResult
    ) {
      const credited = creditSnailGameReward(
        carrierState.snails,
        snailId,
        reward,
        carrierState.softCurrency.slime
      );
      const nextState = {
        ...carrierState,
        snails: credited.snails,
        softCurrency: { ...carrierState.softCurrency, slime: credited.slime }
      };
      if (backendSession) {
        await backendSession.repository.saveCarrierState(
          backendSession.user.id,
          nextState
        );
      }
      setCarrierState(nextState);
    }

Wrap the returned root (`<View style={styles.screen}>…</View>`):

    return (
      <SnailGameFlowProvider
        onReward={awardSnailGameReward}
        slimeBalance={carrierState.softCurrency.slime}
      >
        <View style={styles.screen}>
          {/* …everything that's already here… */}
        </View>
      </SnailGameFlowProvider>
    );

(Optional: pass `onOpenCosmetics` / `onOpenShop` when those flows exist — then the
detail screen's stub buttons become live.)

## Edit 2 — MySnailsScreen.tsx (an "Open" button on the selected panel)

This screen is rendered inside MapScreen, so it's already under the provider.

Add the import + hook:

    import { useSnailGameFlow } from "../minigames/SnailGameFlow";
    // inside the component:
    const { open } = useSnailGameFlow();

In the selected-snail panel (where the Level button is), add an Open button:

    {selectedOwnedSnail ? (
      <Pressable
        accessibilityRole="button"
        onPress={() => open(selectedOwnedSnail)}
        style={/* your button style */}
      >
        <Text>Open</Text>
      </Pressable>
    ) : null}

That's the whole mount. Because the panel only shows for a *selected* snail and
cards are `disabled` for non-resting snails, this is resting-only by default.

**To allow on-journey snails to play too:** relax the card's
`disabled={snail.status !== "resting"}` so any snail is selectable. Leveling stays
resting-only on its own (their `levelUpSnail` guards it); only Open/play opens up.

## Files (all under src/minigames/)

SHIPPING (the per-snail flow):
    SnailGameFlow.tsx       Provider + useSnailGameFlow() hook + the overlay stack
    SnailDetailScreen.tsx   Stats + Play Games + stubbed Cosmetics/Shop
    GamesListScreen.tsx     Per-snail games list with High Score
    PlaySnailGame.tsx       Runs a game as a snail, reports slime+xp
    snailToCharacter.ts     Snail -> game character
    snailGameReward.ts      Score -> slime + xp (+ creditSnailGameReward helper)
    highScores.ts           Pure high-score logic
    highScoresStorage.ts    AsyncStorage persistence (device-local)
    gamesCatalog.ts         Game list (Flappy live; others coming soon)
    flappySnail/            The game (palette tuned to the app's sage-green)

STANDALONE DEMO (earlier global-hub prototype — not used by the flow above;
keep for reference or delete):
    GamesHub.tsx, characters.ts, progress.ts

ROOT:
    GamesHarnessApp.tsx     Run the whole flow standalone (cp over App.tsx on a
                            scratch branch, or point index at it). Delete when integrated.

## Run it standalone (no Xcode)

On a scratch branch off main, drop these files, then:

    cp GamesHarnessApp.tsx App.tsx     # real App.tsx safe on other branches
    npx expo start                     # press s for Expo Go, scan on your phone

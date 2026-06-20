# Snail Games hub

The whole "Games" tab, built behind one mount point. Drop these onto a scratch
branch off `game/redbull-snail` (they overwrite the older flappySnail files).

## Files
    src/minigames/
      types.ts             Shared contracts (Character, GameModifier, GameResult, GameComponentProps)
      characters.ts        Roster. Only the Redbull snail has a live power-up; rest are cosmetic
      characters.test.ts
      gamesCatalog.ts      Game list (Flappy live; 2048 / Snake = coming soon)
      progress.ts          Pure XP/leaderboard reducer (the progression seam)
      progress.test.ts
      GamesHub.tsx         The Games tab: picker + game list + leaderboard. Launches games
      flappySnail/
        flappyEngine.ts        + applyFlappyModifier() merges a character's power-up into config
        flappyEngine.test.ts
        FlappySnailGame.tsx    Refactored to GameComponentProps (character / onExit / onResult)
    GamesHarnessApp.tsx    Throwaway: renders <GamesHub/> full-screen so you can run it standalone

## See it on the Simulator / phone
On a scratch branch off game/redbull-snail (real App.tsx stays safe there):

    git checkout game/redbull-snail
    git checkout -b game/games-hub
    # ...drop these files in...
    cp GamesHarnessApp.tsx App.tsx      # scratch branch only — swaps the app to the hub
    npm run ios                         # regenerates ios/, no signing hassle on Simulator

The hub does NOT pop up by itself — it's a screen you open. The harness just makes
the hub the entire app so you can run it without the rest of the template existing.

## Real integration (one line, your teammate's tab navigator)
    import { GamesHub } from "./src/minigames/GamesHub";
    // <GamesHub onApplyReward={(result) => applyToJourney(result.rewardMultiplier)} />

onApplyReward is optional and bubbles a finished run up to the host so the map
journey can speed up. The hub owns XP/leaderboard internally; games just report scores.

## Adding a game later
Write a component to GameComponentProps ({ character, onExit, onResult }), add an
entry to gamesCatalog.ts, and launch it from GamesHub. Nothing else changes.

NOTE: the old wire-flappy-into-app.patch is obsolete — do not apply it. The hub
replaces wiring Flappy directly into App.tsx.

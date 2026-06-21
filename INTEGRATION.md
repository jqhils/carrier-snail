# Games feature — three games + Game Corner dashboard

Additive, all under `src/minigames/` (+ web-only `App.web.tsx`). Stacked on
feat/snail-flappy, so it includes everything that branch has, plus Snake:

- **Flappy Snail** — flies the picked snail's species sprite.
- **2048 Snail** — animated tile slides (+ input/web fix; iOS path unchanged).
- **Snail Snake** — NEW. Grid + tick based (smooth without a physics loop). The
  snail's **species sprite is the snake head**; body trails as shell-green
  segments. **Swipe to steer.** Pure engine (`snake/snakeEngine.ts`, seeded,
  7 tests) + `snake/SnakeGame.tsx` + `PlaySnake.tsx` wrapper. Reward = slime+xp
  (`scoreToSnakeReward`), same contract as the others. Enabled in the catalog;
  dispatched in `SnailGameFlow`.
- **Game Corner dashboard** (`GamesListScreen.tsx`) — tile grid (Snake's tile is
  now "Play", not "Soon") + a leaderboard from REAL stored high scores, with a
  "No scores yet" empty state.

No new dependencies for Snake (plain RN Views + Image; no Skia).

## Push — STACKED branch off feat/snail-flappy (VERIFY YOUR BRANCH FIRST)
```bash
git checkout feat/snail-flappy
git pull
git checkout -b game/snail-snake     # stacked on feat/snail-flappy
git branch                           # confirm
unzip -o snail-minigames.zip
npm run typecheck && npm run lint && npm test
git add -A && git commit -m "feat: Snake minigame (snail-sprite head, swipe)"
git push -u origin game/snail-snake
```
**PR base = `feat/snail-flappy`** (NOT main, NOT build/v1). Because feat/snail-
flappy isn't merged yet, targeting build/v1 would show Flappy+dashboard+Snake all
at once. Set the base dropdown to feat/snail-flappy so the PR shows only the
Snake delta. When feat/snail-flappy merges to build/v1, retarget this PR's base
to build/v1.

## Reaching the games in-app (unchanged — Joseph's 2 edits cover all 3 games)
1. MapScreen.tsx — wrap content in `SnailGameFlowProvider` (`onReward`,
   `slimeBalance={carrierState.softCurrency.slime}`,
   `snails={carrierState.snails}` for the leaderboard).
2. MySnailsScreen.tsx — "Play games" button → `useSnailGameFlow().open(snail)`.

## Web preview
`npx expo start --web` → dashboard; tap Play on any tile (incl. Snake) to launch.
For Snake, drag/swipe to steer. Laggy on web, smooth on device.

## Tuning dials (built blind — adjust on device)
- Snake grid: `GRID_COLS=15`, `GRID_ROWS=17` (snakeEngine.ts).
- Snake speed: base 150ms tick, speeds up with score (SnakeGame.tsx).
- 2048 slide: `SLIDE_MS`; Flappy flyer: `SPRITE_W=64`.

## Unverified
No device run yet. Logic + layout checked in a browser. Unseen on a phone:
animation/feel and the swipe responsiveness for Snake.

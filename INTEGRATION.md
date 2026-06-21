# Games feature — both games + Game Corner dashboard (targets build/v1)

Additive, all under `src/minigames/` (+ a web-only `App.web.tsx`). This is the
full games feature in one branch:

- **Flappy Snail** — flies the picked snail's **species sprite** (Joseph's
  `SnailSprite` / `SNAIL_SPRITE_ASSETS` by `speciesId`), no businessman.
- **2048 Snail** — animated tile slides; includes an input/animation fix (reads
  latest state so the gesture can't act on stale state; JS driver on web, native
  on device — **iOS path unchanged**).
- **Game Corner dashboard** (`GamesListScreen.tsx`) — a tile grid (per-game art +
  this snail's best + Play, "Soon" for Snake) and a **leaderboard built from REAL
  stored high scores** across the stable, with a "No scores yet" empty state.

## Apply / push (VERIFY YOUR BRANCH FIRST)
You already pushed `feat/snail-flappy` with both games — this UPDATES it:
```bash
git checkout feat/snail-flappy
git branch                         # confirm
unzip -o snail-minigames.zip       # overwrites src/minigames/** + App.web.tsx

npm run typecheck && npm run lint && npm test   # green
git add -A
git commit -m "feat: Game Corner dashboard + real-data leaderboard"
git push                           # updates the open PR
```
No new deps for the dashboard. (Flappy's 5 deps were already installed when you
first pushed this branch.) PR targets **build/v1**, not main.

## Make games reachable + feed the leaderboard (edits to Joseph's files)
1. **MapScreen.tsx** — wrap rendered tab content in `SnailGameFlowProvider`:
   - `onReward={...}` credits slime,
   - `slimeBalance={carrierState.softCurrency.slime}`,
   - `snails={carrierState.snails}`  ← NEW: powers the leaderboard's names+sprites.
2. **MySnailsScreen.tsx** — in the snail detail view add a "Play games" button:
   `const { open } = useSnailGameFlow(); ... onPress={() => open(snail)}`.

Without (2) there's no way to reach the games in-app. Without `snails` in (1) the
leaderboard still renders but can't show other snails' names/sprites.

## Web preview
`npx expo start --web` opens the dashboard; tap Play to launch either game.
Motion is laggy on web (no native driver) — smooth on device. Behaviour/art only.

## Unverified
No device run yet. Logic + layout checked in a browser. Unseen on a real screen:
animation smoothness and the games flying/sliding on a phone. Have whoever has
Xcode watch those.

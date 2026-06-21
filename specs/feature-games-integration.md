# Feature — Integrate Park07's minigames

> Resolved from a `/grill-me` session. **Authoritative** for integrating the
> `src/minigames/` module into the app. Honors the constitution
> (`specs/mission.md`; Delivery Floor inviolable) and the Design quality bar in
> `specs/feature-bottom-navbar.md`.

## What Park07 built (analysis)

A well-seamed, self-contained `src/minigames/` module — merged to `build/v1` but
**never wired into the app** (no entry point) and currently colliding with the
built snail detail page (#58):
- `SnailGameFlow` — a context Provider + `useSnailGameFlow().open(snail)`, steps
  `detail → games → playing`, with hooks `onReward(snailId, reward, result)`,
  `slimeBalance`, `onOpenShop/onOpenCosmetics`.
- `GamesListScreen` (per-snail hub), `gamesCatalog` (2048 live; Flappy + Snake
  `available:false`), `Play2048` + `game2048/`.
- Their own `SnailDetailScreen` (redundant with #58).
- `snailToCharacter` — a thin **adapter** (owned Snail → in-game `Character`), not
  a competing model.
- `highScores` + `highScoresStorage` (device-local AsyncStorage).
- `snailGameReward` — **already awards both** `experiencePoints` (to the played
  snail) and `slime`, capped (`MAX_SLIME_PER_RUN = 8`), explicitly outside the
  Delivery Floor; `creditSnailGameReward` merges it onto snails + the balance.
- Flappy (`flappySnail/`, `flappyEngine`, `PlaySnailGame`) lives on the unmerged
  branch `feat/snail-flappy`; Snake on `game/snail-snake`.

So integration is **wiring + restyle + one economy fix**, not a rebuild.

## Resolved decisions

1. **Exp gates leveling, slime pays** (fixes a dead stat — exp does nothing today;
   leveling is slime-cost only).
2. **Restyle: chrome + canvas palette/type**, with the **species sprite as the
   in-game player**. No bespoke re-illustration.
3. **Ship 2048 + Flappy** (merge `feat/snail-flappy`); Snake stays a "soon" stub.

## Exp-gated leveling (issue 1)

- A snail accrues `experiencePoints` (deliveries `+1`; games via the reward).
- `expThresholdForLevel(level)` = exp needed to advance from that level (e.g.
  `level * 10`, tunable).
- `levelUpSnail` now requires **`experiencePoints >= threshold` AND
  `slime >= levelUpCost(snail)`**. On level-up: subtract the threshold from exp
  (carry the overflow), spend the slime, increment level. Add a typed
  not-enough-exp error alongside the slime one.
- Level-up UI (the #58 detail page + the My Snails selected-snail panel) shows an
  **exp progress bar** (`exp / threshold`) + the slime cost; the level-up action
  enables only when both are met. Tested at the use-case seam.

## Wiring (issue 2)

- Mount `<SnailGameFlowProvider>` around the tabbed app in `App.tsx`. Wire
  `onReward(snailId, reward, result)` → `creditSnailGameReward` → add the slime to
  `softCurrency.slime` and the exp to that snail's `experiencePoints`, then persist
  (the existing CarrierState persist path / Supabase). `slimeBalance` = current
  slime.
- **Entry points:** a **"Play" action on the #58 detail page** (opens Park07's
  games hub for that snail, entering the flow at the `games` step — the built
  detail page replaces their `detail` step), plus a small **"Play" shortcut on the
  My Snails selected-snail panel**. Any owned snail can play (resting or
  on-journey — a game never touches a journey).
- **Drop / repurpose** Park07's `SnailDetailScreen` (the app's #58 is the one
  detail page). Update `snailToCharacter` to use the **species sprite** for the
  in-game player visual.
- **Restyle** the 2048 hub + chrome + canvas to the sage/cream palette + the app's
  type/spacing.
- **Persistence:** rewards (slime + exp) go to CarrierState (backend-synced); high
  scores stay device-local (Park07's AsyncStorage) — backend-sync is a later option.

## Merge + integrate Flappy (issue 3)

- Merge `feat/snail-flappy` into `build/v1` (it branched before the recent
  map/species work → **expect conflicts**; this is the human-touch step — a person
  resolves the merge, the loop should escalate if it can't).
- Flip Flappy `available: true` in the catalog; wire its player; restyle chrome +
  canvas to the palette; species sprite as the flyer.

## Economy guard
Keep Park07's per-run cap (8 slime). The exp gate + per-level slime cost already
throttle grind. A per-day cap stays a tunable constant if needed.

## Build vs. review
Issue 1 is mostly **green-verifiable logic**. Issues 2–3 are **visual + feel**
(restyle, game canvas, the merge) — build the wiring green, then **flag the visuals
for human on-device sign-off** (`ready-for-human`); never self-certify the look on
green.

## Issues
1. **Exp-gated leveling.**
2. **Wire 2048 minigame into the app** (provider, rewards, entry points, drop their
   detail screen, species sprite, restyle).
3. **Merge + integrate Flappy** (branch merge = human-touch; restyle).

## Out of scope
- Snake (stays a "soon" stub).
- Bespoke game-art re-illustration (chose palette/type matching).
- Backend-synced high scores (local for now).
- A separate Games tab (entry is per-snail).

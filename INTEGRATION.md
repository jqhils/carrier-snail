# Snail minigames — Flappy + 2048 (targets build/v1)

Both games on one branch, cut against **build/v1** (the live trunk). Additive:
everything is under `src/minigames/`. Both games fly/show the **picked snail's
species** via Joseph's `SnailSprite` / `SNAIL_SPRITE_ASSETS` (by `speciesId`) —
my old per-id sprite set is gone.

- **Flappy Snail** — Skia game; flies the chosen snail's species sprite, sized by
  each sprite's true aspect. (9 species face right; `backwards` faces left, which
  suits it.)
- **2048 Snail** — animated tile-sliding board (Animated slide + merge/spawn
  pops), pure seeded engine. No sprites, no Skia.

## Branch + apply
```bash
git fetch origin
git checkout -b feat/snail-minigames origin/build/v1
unzip -o snail-minigames.zip            # writes src/minigames/**

# Flappy's title screen needs 5 deps build/v1 doesn't have yet (2048 needs none):
npx expo install expo-linear-gradient react-native-svg expo-font \
  @expo-google-fonts/fredoka @expo-google-fonts/press-start-2p

npm run typecheck && npm run lint && npm test   # green on build/v1 (130 tests)
git add src/minigames package.json package-lock.json
git commit -m "feat: snail minigames (Flappy + animated 2048), per-species sprites"
git push -u origin feat/snail-minigames
```

## Make it reachable (2 edits — do with a teammate on a device; NOT in this branch)
1. **MapScreen.tsx** — wrap the rendered tab content in `SnailGameFlowProvider`,
   passing `onReward` (credit slime like `levelUpSnail`) and
   `slimeBalance={carrierState.softCurrency.slime}`.
2. **MySnailsScreen.tsx** — in Joseph's snail detail view (#67) add a
   "Play games" button: `const { open } = useSnailGameFlow(); ... onPress={() => open(snail)}`.

## Sprites / fonts
- No new image assets — uses build/v1's `assets/snails/*` (Joseph's 10).
- Fonts degrade to system if not loaded; for the exact title look, load
  Fredoka + Press Start 2P at app root with `useFonts`, and wrap root in
  `SafeAreaProvider`.

## Unverified
Built without a device (no Xcode / SDK 56 too new for store Expo Go). Logic is
tested; what's unseen on a real screen: Flappy flying the new sprites, and the
2048 slide/pop timing. Dials — Flappy: `SPRITE_W` (FlappySnailGame); 2048:
`SLIDE_MS = 110` + spring tension/friction (Game2048).

## If you'd rather keep 2048 separate
`feature-2048.zip` (2048-only, Flappy disabled) still exists. But merging both a
2048-only branch and a Flappy branch will conflict on `gamesCatalog.ts` +
`SnailGameFlow.tsx` (each toggles the other game). One branch (this one) avoids
that.

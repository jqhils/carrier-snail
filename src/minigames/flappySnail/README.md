# Redbull Snail minigame

A Flappy-Bird-style minigame, snail-themed, drawn entirely in Skia to match the
app's existing snail art (no image assets). Finishing a run yields a speed
multiplier you apply to a snail's journey.

## Files in this module

- `flappyEngine.ts` — pure, RN-free, deterministic simulation (gravity, pipes,
  scoring, collision). Seeded PRNG, fully unit-tested.
- `flappyEngine.test.ts` — Jest spec (matches the repo's preset/style).
- `FlappySnailGame.tsx` — the Skia component + UI (ready / playing / dead
  screens, best score via AsyncStorage). Renders from React state only.

Verified against the repo gate on `build/v1`:
`typecheck` clean · `eslint .` clean · `jest` 20 suites / 62 tests pass.

## Component API

```ts
export type FlappyResult = { multiplier: number; score: number };

function FlappySnailGame(props: {
  onClose?: () => void;                        // user tapped Close
  onUseBoost?: (result: FlappyResult) => void; // user tapped "Use xN boost"
}): JSX.Element
```

`multiplier = scoreToSpeedMultiplier(score)` = `min(4, 1 + score * 0.08)` —
each pipe cleared adds 8% up to 4x. Tune constants in `flappyEngine.ts`
(`defaultConfig`).

## Wiring into `App.tsx`

```tsx
// 1) imports (alongside the other ./src imports)
import { FlappySnailGame, type FlappyResult }
  from "./src/minigames/flappySnail/FlappySnailGame";
import { cloneCarrierState, getActiveJourney }
  from "./src/useCases/localCarrierState";

// 2) toggle state (with the other useState calls)
const [showFlappy, setShowFlappy] = useState(false);

// 3) reward handler — scales the in-flight snail's journey speed.
//    multiplier > 1 speeds the snail up. To SLOW a chasing snail instead,
//    apply 1 / result.multiplier (or swap in a slowdown mapping).
function applyFlappyResult(result: FlappyResult) {
  setCarrierState((current) => {
    const next = cloneCarrierState(current);
    const active = getActiveJourney(next); // status === "in-flight"
    if (active) {
      active.speedMetersPerHour = active.speedMetersPerHour * result.multiplier;
    }
    return next;
  });
  setShowFlappy(false);
  // If you mirror to the backend like your other handlers, also persist the
  // next state via backendSession.repository.saveCarrierState(...).
}

// 4) launch button — drop among your existing Pressables
<Pressable onPress={() => setShowFlappy(true)}>
  <Text>Redbull Snail</Text>
</Pressable>

// 5) overlay — render LAST inside the root view; the component is absolute-fill
{showFlappy ? (
  <FlappySnailGame onClose={() => setShowFlappy(false)} onUseBoost={applyFlappyResult} />
) : null}
```

Notes:
- The boost lands on whatever journey is currently `in-flight`. With nothing in
  flight it's a no-op, so make sure a snail is on a journey first.
- This is the MVP single-multiplier path. A "slow my snail vs speed up theirs"
  choice screen is a small follow-on: two buttons on the dead screen, calling
  `applyFlappyResult` with `result.multiplier` or `1 / result.multiplier`.

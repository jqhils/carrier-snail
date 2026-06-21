# Salt Storm (multi-hazard + health) — 4th game on top of build/v1

build/v1 already has Flappy, 2048, Snake + dashboard (#82). This adds ONLY Salt
Storm -> salt-only diff. No new deps.

Salt Storm: snail dodges falling hazards (drag to move). Starts LEVEL 1, levels
up every 10s (gold flash; speed rises each level). THREE hazards unlock by level
— salt (always), bombs (L3+, bigger), poison (L5+, small/fast); all deadly.
Waves grow 1->2->2-3->3-4 by L5. THREE HEARTS with ~0.6s i-frames after each hit
(snail flashes); shell pickup = ~3s shield. Slime ~1 per 10s, cap 8.

## Sprites (optional — drawn shapes are the default)
Add PNGs to assets/hazards/ (salt.png, bomb.png, poison.png — ~64x64,
transparent) and uncomment the matching line(s) in
src/minigames/saltStorm/hazardSprites.ts. Mix freely; only uncomment a line once
its PNG exists. Each renders centered + rotates; no sheet needed.

## Reaching games in-app (Joseph's 2 edits)
1. MapScreen.tsx — wrap content in SnailGameFlowProvider (onReward,
   slimeBalance={carrierState.softCurrency.slime}, snails={carrierState.snails}).
2. MySnailsScreen.tsx — "Play games" button -> useSnailGameFlow().open(snail).

## Dials (saltStormEngine.ts)
START_LIVES=3; INVULN_FRAMES=36; FRAMES_PER_LEVEL=600 (10s); fallSpeedFor
+8%/level; waveCountFor; kindFor; SIZE_MUL/SPEED_MUL; POINTS_PER_SLIME_SALT=100.
Ramps fast — playtest L5+. No device run yet.

# Feature batch — Illustrated snail species, selection, naming, detail, hatch, map

> Resolved from a `/grill-me` session. **Authoritative** for this batch. Honors
> the **Design quality bar** in `specs/feature-bottom-navbar.md` and the
> constitution (`specs/mission.md`; Delivery Floor inviolable). Built by the
> autonomous loop (`docs/agents/autonomous-loop.md`) as 8 `ready-for-agent`
> issues into `build/v1`.

## Goal

Give snails real illustrated **characters** and the surfaces to enjoy them:
pick which snail carries a to-do, name them, a richer hatch, a snail detail page,
a more visible trail, and selectable map skins.

## The species model (foundation — everything depends on this)

- Introduce a **`SnailSpecies` catalog**: a fixed list of named characters. Each:
  `id`, `displayName`, `lore` (1–2 lines), `rarity` (common…cursed), `speedBand`,
  base `reliability`, `temperament`, `trailColor`, and a `sprite` asset key.
- A **`Snail` instance** gains `speciesId`; its illustrated look + trail color +
  base traits come from the species. `name` becomes the **user's custom name**
  (defaults to the species' `displayName`). Keep `level`, `quirk`, `quirkSeed`.
- **Hatching** rolls a rarity from the existing egg-odds pools, then picks a
  random species **of that rarity** (deterministic from the egg's seed). The
  starter Garden Snail is the `garden` species.
- **Backward-compat / migration:** existing snails (which have `appearance`/
  `rarity` but no `speciesId`) map to a species by rarity (fallback: `garden`).
  The old procedural `appearance.shellColor` is superseded by the species sprite
  but kept as a tint fallback. New use-case logic stays at the tested seam.

### Seed catalog (~10; adjustable later — it's data)

| id | name | rarity | flavor |
|---|---|---|---|
| `garden` | Garden Snail | common | the steady starter |
| `barista` | Barista Snail | common | runs on caffeine, still slow |
| `sydney-train` | Sydney Train Snail | uncommon | always 4 min away |
| `comp-sci` | Comp Sci Student Snail | uncommon | code > sleep |
| `postal` | Postal Snail | uncommon | a born carrier |
| `uni-sydney` | University of Sydney Snail | rare | sandstone and deadlines |
| `absent-father` | Absent Father Snail | rare | gone for milk, several km out |
| `red-bull` | Red Bull Snail | mythic | gives a snail wings |
| `golden` | Golden Shell Snail | mythic | shimmering, prized |
| `backwards` | Backwards Snail | cursed | crawls the wrong way (ties the backwards quirk) |

Base speed/reliability per species derive from its rarity (higher rarity → faster
band / better reliability), tuned per species. The **Delivery Floor still clamps
everything** — no species beats it.

## Per-feature decisions

1. **Select a snail for a to-do.** "Send a snail" opens a **picker** of the user's
   **idle (resting)** snails — each row shows sprite + custom name + species +
   level + speed. `assignSnailToToDo` takes an explicit `snailId` (was implicit).
   No idle snail → the existing disabled prompt.
2. **Custom names.** A `renameSnail(snailId, name)` use-case (validated, tested).
   Rename UI lives on the **snail detail page**. Species `displayName` is the
   character; `name` is the user's label.
3. **Egg-hatching reveal.** Tapping Hatch plays a reveal: egg crack/scale +
   **confetti** + the hatched species' **sprite + name + rarity** flourish, then
   it joins the stable. Core RN `Animated` only (no Reanimated/native deps).
4. **Illustrated avatars.** A `SnailSprite` component renders a species' standing
   sprite, with a **code-driven "walk"** (gentle bob / squash-stretch / glide)
   when `walking`. Wire it in: **My Snails** (list + detail), the **map marker**
   (replaces 🐌, walks while in-transit), **To Dos** (small, when a snail is
   assigned), **Notifications** (with each arrival). Sprites are **one standing
   PNG per species**, transparent background, pixel-art (MapleStory-style),
   generated via `image-2`, stored at `assets/snails/<speciesId>.png`.
5. **Trail visibility.** Thicker line + a light casing/outline + brighter,
   species-tinted color + (optional) animated flow. Remaining-path dashes stay
   but read clearly. Tune on-device.
6. **Map skins.** Settings selector among a few MapTiler styles (Streets /
   Outdoor / Dark), free under the existing key. Extract the key to
   `EXPO_PUBLIC_MAPTILER_KEY` and build style URLs per skin; persist the choice.
7. **Snail detail page.** A **sub-view inside My Snails** (select → detail, back
   button; no nav library). Shows: large sprite, editable name (rename), species
   name + lore + rarity, level (+ level-up), speed/reliability/quirk/temperament,
   journeys completed.

## Build vs. human review (shapes every issue)

The green gate **cannot see visuals.** For every issue:
- **Build + green-gate** the plumbing (model, use-cases + tests, components,
  wiring, state) — typecheck + lint + tests must pass to land.
- **Generate art via `image-2`** where needed and **flag all visual output**
  (sprites, walk feel, confetti, trail look, map skins, the detail/hatch layouts)
  for **human on-device sign-off** — comment on the PR and apply `ready-for-human`
  for the visual portion. **Never self-certify visuals on the green gate.**

## Issues (independent where possible; this order)

1. **Species catalog + model migration** *(foundation)*
2. **`SnailSprite` + sprite generation + display wiring**
3. **Select-a-snail picker for to-dos**
4. **Custom snail names (rename)**
5. **My Snails detail page**
6. **Egg-hatching reveal**
7. **Trail visibility overhaul**
8. **Selectable map skins**

Loop order: **1 → 2 → (3,4,5,6) → (7,8)**. Each = one branch + PR into `build/v1`,
merged on green.

## Out of scope
- True multi-frame walk-cycle sprites (chose one-sprite + code walk).
- A bespoke MapTiler Studio basemap (manual; only ready-made styles here).
- A navigation library (detail page is a hand-rolled sub-view).
- Recurring reminders / mid-journey pushes / sub-Floor delivery (constitution).

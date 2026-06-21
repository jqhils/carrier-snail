# Feature — Stable slot cap + release mechanic

> Resolved from a `/grill-me` session. **Authoritative** for this feature. Joins
> the illustrated-snail batch (`specs/feature-snail-batch.md`) as one more
> `ready-for-agent` issue. Honors the constitution (`specs/mission.md`) and the
> Design quality bar in `specs/feature-bottom-navbar.md`.

## Problem

The stable cap is **not enforced today.** `stableSlots.purchased` is a counter and
the UI shows "X resting, Y out, Z slots," but `emptySlotCount` just equals
`purchased`, nothing counts against a cap, and **hatching never checks capacity** —
so a player holds unlimited snails and the buyable "stable slot" does nothing.

## Goal

Introduce a real cap and a gentle, Pokémon-GO-style way to make room: **release**
a snail (returns it to the garden for some slime).

## The cap model

- `BASE_STABLE_SLOTS = 6` (tunable constant). `maxSlots = BASE_STABLE_SLOTS +
  stableSlots.purchased`.
- The cap counts **all owned snails** (resting **and** on-journey).
- Fix `listStableSnails`: `freeSlots = maxSlots − snails.length` (was
  `emptySlotCount = purchased`). Expose `maxSlots` + `freeSlots`; the My Snails
  capacity line reads from these.

## At the cap

- **Hatching is blocked** when `snails.length >= maxSlots`. `hatchEgg` gains a
  capacity guard and throws a typed "stable full" error **without consuming the
  egg** — the earned egg waits un-hatched until there's room.
- The UI catches it and shows a calm prompt: *"Your stable is full — set a snail
  free, or add a slot,"* with two CTAs: go release a snail (routes to the stable /
  detail page) and buy a slot (the existing `stable-slot-single` shop product).
- **Buying eggs still works when full** — only *hatching* is gated; eggs queue.

## Release mechanic

- `releaseSnail(snailId)` use-case (tested):
  - Guards: the snail must **exist** and be **resting** (an on-journey snail can't
    be released — recall it home first). Reject otherwise.
  - Removes the snail; **grants slime** (soft currency) scaled by the snail:
    small base + a rarity bonus + a little per level (tunable). Returns the new
    state. **Permanent.**
  - Does not touch the Delivery Floor or any journey.
- **Confirmation:** an `Alert` before release — *"Set <name> free? They'll return
  to the garden, leaving a little slime behind. This can't be undone."* Framed as
  **returning to the garden / set free**, never "delete," and distinct from
  **recall** (recall is temporary, "comes home"; release is permanent).
- **Where:** the release action lives on the **snail detail page** (batch issue
  "My Snails detail page"). The full-stable prompt routes there. If the detail
  page isn't merged yet, a minimal inline release on My Snails is acceptable.

## Build vs. review

Mostly **green-verifiable logic** (cap fix, hatch guard, `releaseSnail` use-case +
slime scaling, the full-stable guard). Light UI only (the prompt + a confirm +
the release button), so far less visual sign-off than the art issues — but still
flag the prompt/confirm copy + placement for a quick on-device look.

## Out of scope
- Auto-releasing snails on overflow (rejected — clashes with the calm thesis).
- Releasing on-journey snails (recall first).
- A keepsake/journal of released snails (chose a slime reward).

## Issue
One `ready-for-agent` issue, **"Stable slot cap + release mechanic"**, joining
`#54–#61`. Depends on **#54** (species/rarity for slime scaling); the release UI
prefers the detail-page issue but can fall back to My Snails.

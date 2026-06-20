# Carrier Snail — Mission

> The constitution. When a feature decision conflicts with this document, this
> document wins. Amend it deliberately, in writing — never by accident in code.

## One line

A calm to-do app where any to-do can be physically carried to you by a snail
crawling across a real map at real snail speed (~0.03 mph ≈ 48 m/hour). You
write "buy milk"; when it deserves a carrier, a snail sets off and arrives,
optimistically, next week. No progress notifications. One push, when it finally
arrives.

## Why it exists — the thesis

Almost nothing you "urgently" remind yourself of actually mattered. A week-long
delivery is a filter: the to-dos that still matter when the snail arrives were
the only ones that were ever real. Carrier Snail is a **sincere absurd tool** —
the absurdity is the *method*, not a gag. It is for people who want to keep
fewer, realer obligations and feel calmer for it.

If it's genuinely time-sensitive, this is the wrong app. On purpose.

## The amended creed (we are honest about our choices)

The purist line was *"there is no speeding it up, ever."* We consciously softened
it. Snails **can** get faster — through rarity, leveling, and yes, spending
money — but only within an absurd ceiling. "Faster" moves you from *next week*
toward *a few days*. It never approaches *today*.

The one inviolable law that keeps the soul alive while the economy breathes:

> ### The Delivery Floor
> No carried to-do, moved by any snail, at any level, for any amount of money, can
> **ever** arrive sooner than a hard floor:
> - **At least 24 hours**, and
> - **never under ~40% of its honest distance-time** (the time the journey would
>   take at base snail speed).
>
> Money and grind can buy a nicer, slightly-less-glacial menagerie. They can
> **never** buy urgency. Carrier Snail can never become a same-day delivery app.
> The Floor is enforced server-side; no client can cheat the clock.

*(24h and 40% are tunable defaults, not arbitrary forever-constants — but the
Floor itself is not optional.)*

## The core experience

1. Write a to-do (a short line of text). To-dos are limitless and do not need a
   snail until you send one.
2. Assign a snail from your stable when the to-do deserves a carrier. It
   **spawns ~8 km away** and sets off toward your live location.
3. It chases the places you come to **rest** — home, desk, bed. A snail moving
   at 48 m/hour only closes distance when you hold still. This is intended: the
   snail creeps toward your stillness.
4. It travels a **straight geodesic line** — "as the snail slimes" — ignoring
   roads, water, and buildings, leaving a glistening **slime trail that lingers
   and slowly fades**: the visible record of the pursuit.
5. The journey is **always watchable**. We never promise a deadline, so we
   promise total transparency instead. The snail is never a black box.
6. When it finally reaches you, **one push fires**. Nothing before it.

## Inviolable principles

1. **The Delivery Floor.** (Above.) The soul's last line of defense.
2. **No mid-journey notifications. Ever.** Exactly one ping, on arrival. No
   progress nags, no "your snail is halfway!" engagement bait.
3. **Transparency replaces an SLA.** Because delivery is never guaranteed by a
   deadline, trust comes from visibility. You can always open the app and see
   exactly where your snail is and where it's headed.
4. **Coarse location only.** The snail can use ~50 m/hour of resolution and no
   more, so we never collect fine GPS. Location is sampled coarsely, stored
   ephemerally (latest target + the short trail history), never kept as a
   long-term location log — and we say so plainly, in plain words, in the app.
5. **Recurring reminders are rejected by design.** Recurrence is manufactured
   urgency. It has no home here.
6. **The eternal chase is allowed.** A snail may wander a long time if you keep
   moving. We make that beautiful, not a failure state. **Recall** is always
   available: the snail comes home empty and the to-do stays open. Completing or
   deleting the to-do is a separate, deliberate action.

## The collection — your stable of snails

A finite stable, à la Roost's flock. The collection is not decoration; it has
mechanical teeth:

- **A snail is busy for its entire journey.** One in-flight to-do occupies one
  snail. So your stable size *is* how many journeys you can run at once, while
  the to-do list itself remains limitless.
  Collecting snails literally expands your capacity. Slowness has a cost; the
  collection is the relief valve.
- **Snails vary across four axes:**
  - **Speed band** — all glacial, but differently so. The "mythic racer" is
    merely *very* slow next to the Garden Snail's *painfully* slow.
  - **Behavior quirks** — the cursed one that occasionally crawls *backwards*,
    nappers, scenic detourers. Personality you live with for a week.
  - **Temperament / reliability** — some make a determined beeline; some wander
    and get lost (leaning into the eternal chase). "Which snail do I trust with
    this?" becomes a real choice.
  - **Trail & appearance** — distinct slime color/texture/persistence and look.
- **Rarity** runs from the common **Garden Snail** to **mythic** racers, plus a
  **cursed** line that sometimes reverses.
- **Snails level up** — getting faster (within the absurd ceiling), more reliable,
  and cosmetically evolving as they grow.
- **Eggs** hatch into randomized snails from a rarity pool. Eggs are **earned by
  completing journeys** and **can be bought**.

## Business model (stated plainly, no euphemisms)

Carrier Snail is a **monetized collection game wearing a calm coat**, and we own
that:

- **Buyable gacha eggs** + **premium cosmetics** + **stable slots**.
- Speed scales with rarity, level, and spend — **bounded absolutely by the
  Delivery Floor.** That clamp is the difference between this and the dark
  pattern it would otherwise be: monetization can sell you a faster, prettier,
  bigger menagerie, but it can **never** sell you urgency.
- *Open before launch:* gacha odds disclosure and per-store IAP compliance.

## Non-goals

- Not a productivity tool for time-sensitive tasks.
- **No** streaks, daily-login nags, FOMO drops, or any urgency mechanic.
  Progression is opt-in delight, never a leash.
- **No** recurring reminders. **No** "speed it up now" button. **No** same-day
  delivery at any price.

## What success looks like

- People keep fewer, realer to-dos — and feel calmer for it.
- A stable they're genuinely fond of. Watching a snail close the final 100 m
  feels like an event worth stopping for.
- The Delivery Floor never breaks. Not once.

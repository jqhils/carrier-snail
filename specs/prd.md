# PRD — Carrier Snail (v1)

> Operationalizes the constitution in `specs/` (mission.md, tech-stack.md,
> roadmap.md). Where this PRD and the constitution disagree, the constitution
> wins. The **Delivery Floor** is inviolable law, not a feature.
>
> **Tracker status:** no issue tracker is configured in this repo yet. This PRD
> lives as a file until `/setup-matt-pocock-skills` + a tracker are in place;
> then it should be published and labelled `ready-for-agent`.

## Problem Statement

I set "urgent" reminders constantly, and almost none of them actually mattered.
Conventional reminder apps treat every thought as equally pressing — they buzz,
badge, and nag until I either act or dismiss, and the act of dismissing teaches
me nothing. I want a way to capture a thought, let real time pass, and discover
on the other side whether it was ever real — without being interrupted in the
meantime, and without any way to rush it. And I want the waiting itself to be
something I enjoy returning to, not a void.

## Solution

Carrier Snail keeps a limitless **to-do** list. Any to-do can be assigned to a
**snail** that physically crawls across a **real map** toward my live location at
genuine snail speed (~0.03 mph ≈ 48 m/hour). When I send a snail from my
**stable**, it **spawns ~8 km away** and sets off, leaving a glistening **slime
trail** that lingers and fades. There are **no notifications until it arrives** —
then exactly **one push**. There is no speed-up button. A server-enforced
**Delivery Floor** guarantees nothing ever arrives sooner than 24 hours (and
never under ~40% of its honest travel time), so the app can never become a
same-day tool — no matter my snail's speed, level, or spending.

The to-dos that still matter after the **journey** are the ones that were real.
The snails are collectible — a finite stable I grow by completing journeys and
hatching **eggs**, each snail agonizingly slow in its own way — so the waiting
becomes something to tend and enjoy.

## User Stories

**Setting & managing to-dos**

1. As a reminder-setter, I want to write a short to-do (a line of text) without assigning a snail, so that I can capture a thought without consuming stable capacity.
2. As a reminder-setter, I want to assign a snail from my stable to carry a to-do, so that I choose who delivers it and how.
3. As a reminder-setter, I want to see how many snails are free versus busy before I send one, so that I understand my remaining journey capacity.
4. As a reminder-setter, I want the snail to set off from a point ~8 km away, so that even a to-do sent at home becomes a real journey.
5. As a reminder-setter, I want an optimistic, honest estimate ("~next week") rather than a promised deadline, so that my expectations are set without a false guarantee.
6. As a reminder-setter, I want to recall a snail at any time, freeing the snail while keeping the to-do open, so that I can change my mind without losing the thought.
7. As a reminder-setter, I want delete and completion to be separate actions from recall, so that bringing a snail home never discards a to-do by accident.
8. As a reminder-setter, I want to see all my to-dos with open, carrying, arrived, and done states, so that I know what is currently on its way and what is still mine to close.

**The journey & watching**

9. As a reminder-setter, I want to watch my snail crawl across a real map toward me, so that the passage of time becomes tangible.
10. As a reminder-setter, I want the snail to move at a genuinely slow real-world speed, so that the wait is real and nothing feels urgent.
11. As a reminder-setter, I want the snail to travel a straight geodesic line ignoring roads and water, so that it behaves like a snail, not a courier.
12. As a reminder-setter, I want the snail to leave a slime trail that lingers and slowly fades, so that I can see the record of its pursuit.
13. As a reminder-setter, I want the snail to head toward the places I come to rest, so that it converges on me through my habits rather than my every step.
14. As a reminder-setter, I want to open the app any time and see exactly where my snail is and where it is heading, so that I trust the journey despite there being no guaranteed deadline.
15. As a reminder-setter, I want to see multiple snails on the same map when I have several to-dos in flight, so that I can take in my whole correspondence at a glance.
16. As a reminder-setter, I want a snail's position to be consistent whether I check now or in three days, so that the journey feels authoritative and real.
17. As a reminder-setter, I want a snail that may wander a long time if I keep moving (the eternal chase), so that delivery is earned, never automatic.

**Arrival**

18. As a reminder-setter, I want exactly one push when the snail finally arrives, so that I am interrupted only at the moment that matters.
19. As a reminder-setter, I want no notifications of any kind before arrival, so that the app never nags me.
20. As a reminder-setter, I want the arrival to show my original to-do text, so that I receive the exact thought I sent.
21. As a reminder-setter, I want the arrival push to fire even when the app is closed, so that I actually receive carried to-dos.
22. As a snail-keeper, I want the delivering snail to return to my stable on arrival, so that it becomes available again.
23. As a snail-keeper, I want to receive an egg when a journey completes, so that sincere use grows my collection.

**The Delivery Floor**

24. As a reminder-setter, I want a guarantee that no carried to-do ever arrives sooner than the Floor (≥24 h and ≥40% of honest distance-time), so that the app can never become a same-day reminder tool.
25. As a player, I want the Floor to hold regardless of my snail's speed, level, or any purchase, so that money can never buy urgency.
26. As a reminder-setter, I want the Floor enforced server-side, so that no client trick or device-clock change can cheat it.

**The stable & collection**

27. As a snail-keeper, I want a stable showing every snail I own, so that I can admire and manage my collection.
28. As a snail-keeper, I want my stable size to set how many to-dos I can have in flight at once, so that collecting snails has real mechanical value.
29. As a snail-keeper, I want to see which snails are resting versus out on a journey, so that I know what is available.
30. As a snail-keeper, I want each snail to have a name and identity, so that I form an attachment to it.
31. As a new user, I want to be given a starter Garden Snail during onboarding, so that I can send my first carried to-do immediately.

**Snail variety & quirks**

32. As a snail-keeper, I want snails to differ in speed band (all slow, differently so), so that rarity is meaningful without breaking the slowness.
33. As a snail-keeper, I want snails with behavior quirks (a backwards-cursed one, nappers, scenic detourers), so that living with a snail for a week has personality.
34. As a snail-keeper, I want snails to differ in temperament/reliability (beeline versus wanderer), so that "which snail do I trust with this?" is a real decision.
35. As a snail-keeper, I want snails to differ in appearance and slime-trail color, texture, and persistence, so that my collection is visually distinct.
36. As a snail-keeper, I want a snail's quirks to play out deterministically, so that the cursed-backwards snail genuinely behaves the same way on every device and every journey.
37. As a snail-keeper, I want rarity tiers from common Garden Snail to mythic "racer" (merely very slow), so that there is a collection ladder to climb.

**Eggs, hatching & leveling**

38. As a snail-keeper, I want to earn eggs by completing journeys, so that sincere use is rewarded.
39. As a snail-keeper, I want to hatch eggs into randomized snails from a rarity pool, so that opening an egg is exciting.
40. As a player, I want to see the gacha odds for each egg before I hatch or buy, so that the system is honest and store-compliant.
41. As a snail-keeper, I want to level up my snails through use, so that I feel progression and attachment.
42. As a snail-keeper, I want leveling to make a snail faster (within the absurd ceiling), more reliable, and cosmetically evolved — but never actually fast — so that growth is felt without betraying the premise.

**Monetization**

43. As a player, I want to buy eggs with money, so that I can grow my collection faster if I choose.
44. As a player, I want to buy cosmetic snails and trails, so that I can personalize my collection.
45. As a player, I want to buy additional stable slots, so that I can hold more journeys in flight.
46. As a player, I want purchases to never let me beat the Delivery Floor, so that I trust the app is not selling me urgency.
47. As a player, I want my purchases and entitlements to persist across devices, so that I never lose what I paid for.

**Location & privacy**

48. As a privacy-conscious user, I want the app to work with only foreground (when-in-use) location, so that I can use it without granting background tracking.
49. As a privacy-conscious user, I want to optionally grant low-power background location to make the chase more live, so that I choose the trade-off.
50. As a privacy-conscious user, I want the app to fall back gracefully to foreground-only if I deny background, so that denial never breaks the app.
51. As a privacy-conscious user, I want only coarse location collected, stored ephemerally and never as a long-term log, so that I can trust the app with my whereabouts.
52. As a privacy-conscious user, I want location practices stated plainly in plain language, so that I am never surprised.

**Onboarding & first run**

53. As a new user, I want a first-run flow explaining the snail premise and the one-push-on-arrival rule, so that I understand what I am signing up for.
54. As a new user, I want to send my first carried to-do within minutes, so that I feel the magic immediately.
55. As a new user, I want to grant location with a clear explanation of why, so that I consent meaningfully.

**Demo & development (internal)**

56. As a developer, I want a debug time-warp that compresses a week-long journey into seconds, so that I can demo and test the full loop quickly.
57. As a developer, I want the time-warp to be impossible to enable in production, so that it can never break the Delivery Floor for real users.

## Implementation Decisions

**Architecture is backend-authoritative.** The server owns time and the
simulation; the client renders and reports location. Required for the economy,
multi-device, anti-cheat, and server-pushed arrivals.

**The journey engine is pure and deterministic — the master design decision.**
A journey is stored as parameters, not a running simulation: snail stats, start
point, base speed, **quirk seed**, last-known target (coarse location),
created-at, and status. A snail's position at any moment is a **pure function**
of these plus the current time; quirks (backwards-curse, naps, detours) are
derived from the seed so they are reproducible on every client without
continuous compute. This keeps the server near-idle during a week-long crawl and
is the foundation of both testing and cost control.

**The Delivery Floor is a server-side clamp.** Every computed arrival time is
clamped to `eta = max(24h, 0.40 × honest_distance_time)`, where
`honest_distance_time` is the travel time at the snail's *base* speed over the
straight-line distance. No snail speed, level, or purchase can produce an ETA
below this. The clamp lives only on the server; the client cannot influence it.
(24 h and 0.40 are tunable defaults; the Floor itself is non-negotiable.)

**Tracking is hybrid and coarse.** Foreground resampling (when-in-use location)
is the universal floor: on each app open, the target updates and the arrival job
reschedules. Optional low-power background sampling (iOS Visit/Significant-
Location-Change, Android geofence) makes the chase more live for users who grant
it, with graceful fallback to foreground-only on denial. Only coarse location
(~50 m resolution is all the snail can use) is sent, stored ephemerally, never
as a long-term log.

**Path & trail.** The snail travels a straight geodesic line, ignoring roads,
water, and buildings. The slime trail is rendered client-side from the journey's
traversed path, persisting and fading over time.

**Arrival.** Exactly one push (Expo Push), scheduled server-side for the computed
ETA and rescheduled whenever the target updates. No mid-journey notifications of
any kind.

**Eternal chase & recall.** There is no force-arrive; a snail may chase
indefinitely if the user keeps moving. **Recall** is always available: it cancels
the scheduled push, returns the snail to the stable empty, and keeps the to-do
open. Completion and deletion are separate manual actions.

**Stable & assignment.** The stable is finite. A snail is **busy for its entire
journey**, so stable size equals maximum concurrent journeys, not maximum to-dos.
Stable slots are purchasable.

**Snails & progression.** Rarity tiers (common Garden → mythic racer, plus a
cursed line). Four variety axes: speed band, behavior quirks, temperament/
reliability, appearance/trail. Level-ups increase speed (bounded by the absurd
ceiling and ultimately the Floor), reliability, and cosmetic evolution.

**Eggs & economy.** Eggs are earned on journey completion and purchasable. They
hatch into randomized snails from a rarity pool (gacha) with **disclosed odds**.
Speed scales with rarity/level/spend, always bounded by the Floor.

**The single test/extension seam: the use-case layer.** All server-authoritative
behavior is expressed as use-cases — `createToDo`, `assignSnailToToDo`,
`unassignSnail`, `completeToDo`, `deleteToDo`, `completeJourney`, `hatchEgg`,
`levelUpSnail`, `purchase`, plus a journey-state query — driven against
injectable **ports**:

- `Clock` — supplies "now"; advanceable in tests, drives the production
  time-warp, and is the authoritative time source (client clock ignored).
- `LocationSource` — supplies coarse target updates.
- `PushSender` — schedules/sends the single arrival push.
- `EntitlementProvider` — purchases/entitlements (RevenueCat in production).
- `Repository` — persistence.

The HTTP/transport and UI/render layers stay thin and delegate to these
use-cases; they hold no business logic and are not separate seams.

**Schema (high level).** Entities: `user`; `snail` (rarity, level, base speed,
quirk seed, temperament, cosmetics, status: resting/on-journey); `todo` (text,
status: open/done); `journey` (to-do ref, snail ref, start point, target, base
speed, quirk seed, created-at, status); `egg` (rarity-pool ref, source:
earned/purchased); `inventory`/`entitlement`; `stable_slots`. Coarse location is
held as the journey's current target plus a short trail history, not a durable
location log.

**Stack.** Expo / React Native (TypeScript); MapLibre (`maplibre-react-native`)
with tiles from MapTiler → self-hosted Protomaps on Cloudflare R2; React Native
Skia + Reanimated for the snail and trail; Supabase (Postgres, Auth anon →
upgradeable, Realtime used sparingly for param/sync only, Edge Functions,
Storage); Expo Push; RevenueCat for IAP; `expo-location` + `expo-task-manager`
as the default free background-location path. Stated preference: **minimize
metered third-party APIs and recurring cost** (see tech-stack.md "Cost &
dependency posture").

## Testing Decisions

**What a good test is here:** it asserts **external, observable behavior**, never
implementation details. Tests drive the use-case layer (or the pure engine) and
check outcomes a user or the system would observe — state transitions, that a
push was scheduled, that a reward was granted — not internal call shapes.

**Modules tested:**

- **Pure journey engine — tested directly** (no seam needed; it is pure). Core
  invariants:
  - The **Delivery Floor is never violated** for any speed, level, or spend
    (property-style coverage across a wide input range).
  - **Quirk determinism**: identical seed + inputs → identical path/behavior
    (the cursed-backwards snail reverses identically every run).
  - Position interpolation is correct and monotonic in time except where a quirk
    intends otherwise.
- **Use-case layer — tested through the one seam**, with all ports faked:
  - Creating a to-do consumes no snail and does not create a journey.
  - Assigning a snail to a to-do spawns a journey ~8 km out and marks the snail
    busy; concurrent journeys are gated by stable size.
  - Advancing the `Clock` produces correct positions and, at the clamped ETA,
    fires **exactly one** arrival push — and **never before the Floor**.
  - On completion, the snail returns to the stable and an egg is granted.
  - **Recall** cancels the scheduled push, frees the snail, and keeps the to-do
    open.
  - **Eternal chase**: a continuously-moving target never force-arrives.
  - `hatchEgg` draws from the rarity pool; `levelUpSnail` raises speed within the
    ceiling but never below the Floor; `purchase` grants entitlements and **never
    enables a sub-Floor delivery**.

**Fakes/ports:** `Clock` (advanceable), `LocationSource` (scripted coarse
positions), `PushSender` (records, never sends), `EntitlementProvider` (fake
purchases), `Repository` (in-memory or a disposable test database).

**Prior art:** none — this is greenfield. These tests **establish the pattern**;
all future feature tests should be written against this same use-case seam (or
directly, for pure modules), and should avoid asserting on internals.

## Out of Scope

- **Recurring reminders or recurring to-dos** — rejected by design (manufactured urgency).
- **Mid-journey notifications** of any kind.
- **Same-day / any sub-Floor delivery** — impossible at any price.
- **Routing / road-following** — straight geodesic only.
- **Geocoding / place names** — the snail chases coordinates, not addresses.
- **Social, flock comparison, leaderboards** — post-1.0 (and must never add urgency).
- **Geo-discovered snails, breeding/cross-breeding** — post-1.0.
- **Direct store billing** — RevenueCat for v1; going direct is a later option.
- **High-accuracy continuous GPS** — never; the snail cannot use it.
- **Web/desktop clients** — mobile-first (Expo/RN) for v1.
- **Final map/snail visual polish** — sequenced after the Phase 0 prototype
  validates the core feel.

## Further Notes

- **Issue #1 must be the Phase 0 spike**: "does the snail-crawl read as magical
  in five seconds?" (MapLibre map + Skia snail + time-warp slider). It is the
  highest-risk unknown and a see-it-to-know-it question; everything else is
  premised on it landing.
- Sequence the remaining issues along `roadmap.md` phases 1–8. Keep each issue
  small and independently grabbable.
- **Tracker publishing is blocked** on `/setup-matt-pocock-skills` + a chosen
  tracker. Until then this file is the PRD of record; once a tracker exists,
  publish and label `ready-for-agent`.
- **Tunables** (defaults, all adjustable except where noted): base speed
  0.03 mph ≈ 48 m/h; spawn distance ~8 km; Delivery Floor 24 h / 40% — the Floor
  *mechanism* is not adjustable away.
- The `Clock` port is the keystone abstraction: test fast-forward, production
  time-warp, and anti-cheat authoritative time are one and the same seam.

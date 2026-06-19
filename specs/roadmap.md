# Carrier Snail — Roadmap

> Implementation order, in small phases. **Every phase is independently
> demoable and leaves a working app.** We build the *feeling* first (a snail
> crawling on a real map), then make it real (backend, background, economy).
>
> Note: the collection, eggs, and monetization are **core to v1** — they ship in
> the 1.0 release — but they're *sequenced* after the core journey proves out.
> Core to v1 means "in the first release," not "in the first brick."

---

### Phase 0 — Spike: does the magic read?
*Prove the core visual and the demo tool before anything else.*
- Expo app boots; Mapbox renders; your location shows as a dot.
- A Skia snail sprite sits on the map and crawls a **hardcoded** straight line
  toward the dot.
- Time-warp debug slider compresses the crawl.
- ✅ **Done when:** someone glances at the screen and *gets it* in five seconds.

### Phase 1 — The journey, client-only
*The full loop end-to-end on one device, no backend.*
- Set a reminder (text). Snail **spawns ~8 km away** and crawls toward your
  foreground-sampled location at base speed via geodesic interpolation over
  wall-clock time.
- Slime trail draws behind it and **fades** over time (Skia).
- Arrival fires a **local** notification; the reminder is shown.
- ✅ **Done when:** set → crawl → arrive works locally, with no server.

### Phase 2 — Backend spine (authoritative)
*Move time and truth to the server; survive app-close.*
- Supabase: anonymous auth; schema for users, reminders, journeys.
- Journey compute moves server-side (deterministic position from stored params);
  client renders from Realtime/poll.
- Server **schedules and sends the arrival push** (Expo Push). **Delivery Floor
  clamp** enforced server-side.
- ✅ **Done when:** kill the app mid-journey, reopen later → the snail is exactly
  where it should be; arrival pushes with the app fully closed.

### Phase 3 — The hybrid chase
*Make "chases your live location" real, cheaply.*
- Foreground resample updates the target → server reschedules ETA.
- **Optional** low-power background location (iOS Visit/SLC, Android geofence)
  feeds coarse pings; permission UX + **graceful fallback to foreground-only** on
  Deny.
- ✅ **Done when:** move across town with the app closed (background granted) and
  the snail re-aims at your new resting place.

### Phase 4 — The stable & a snail's life
*Snails become objects you own, not just a sprite.*
- Snail entities; **Stable** screen; **assign-snail-to-reminder** (snail is BUSY
  until arrival); **Recall** (frees the snail, kills the reminder).
- Onboarding grants a starter **Garden Snail**. On arrival, the snail returns to
  the stable and grants an egg (placeholder reward).
- ✅ **Done when:** a finite stable gates concurrent reminders; recall works;
  arrival returns the snail home.

### Phase 5 — Variety & quirks
*Give the collection soul.*
- Rarity tiers; the four variety axes (speed band, quirks, temperament,
  trail/appearance).
- **Deterministic seeded quirks:** backwards-curse, naps, scenic detours —
  reproducible identically on every client.
- ✅ **Done when:** three visibly different snails (e.g. Garden, a wanderer, the
  cursed-backwards) behave distinctly on the same journey.

### Phase 6 — Eggs, hatching & leveling
*The collection loop closes.*
- Eggs earned from completed journeys; hatch into randomized snails from a
  rarity pool.
- **Level-ups:** faster (within the absurd ceiling), more reliable, cosmetic
  evolution. Soft currency from completed journeys.
- ✅ **Done when:** complete a journey → earn an egg → hatch a snail → level it →
  it's measurably (still-absurdly) faster — and the Delivery Floor still holds.

### Phase 7 — Monetization
*Make it earn, without selling urgency.*
- RevenueCat: **buyable eggs** (gacha), **premium cosmetics**, **stable slots**.
- Gacha **odds disclosure**; per-store IAP compliance pass.
- Speed scales with spend/level — **Delivery Floor visibly enforced and
  explained** in-app.
- ✅ **Done when:** a sandbox purchase grants eggs; **no purchase can ever beat
  the Floor.**

### Phase 8 — Polish, transparency & meta
*Make it feel finished and calm.*
- Watchable-journey UI (scrub, ETA range, the trail as history); multiple snails
  on the map at once.
- Onboarding/first-run polish; snail care/flavor; share a trail.
- ✅ **Done when:** it reads as a finished, calm, slightly-absurd product.

---

### Post-1.0 (parked, not forgotten)
- Social / flock comparison / leaderboards — **must not introduce urgency.**
- Geo-discovered snails; breeding / cross-breeding.
- Recurring reminders remain **rejected by design.**

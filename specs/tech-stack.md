# Carrier Snail — Tech Stack

> Decisions here serve the constitution in `mission.md`. Where a choice is a
> recommendation with live alternatives, it's marked. Tunable constants are
> called out as such.

## Shape

Long-haul, cross-platform mobile product with a **backend-authoritative** core.
TypeScript end to end.

## Client — Expo / React Native (TypeScript)

- **Expo (managed) + config plugins**, EAS for builds/submission. Keeps us in a
  JS/TS world and ships to iOS + Android from one codebase.
- **Maps: MapLibre** (`maplibre-react-native`) — the open-source (BSD) renderer,
  a fork of Mapbox GL at **style-spec parity**. Free renderer, **no per-MAU
  billing, no vendor lock-in.** We need almost nothing a commercial SDK sells:
  the constitution forbids roads (straight-line slime), so **zero routing** and
  **little/no geocoding**. The slime trail (a GeoJSON line layer) and the
  camera/projection calls that glue the Skia snail overlay to the map behave
  identically to Mapbox. Needs an Expo dev build (config plugin), same as the
  Mapbox RN lib did — not Expo Go.
  - **Tiles/style provider — the real cost decision, since MapLibre is *only*
    the renderer:** start on **MapTiler** (free tier, easiest on-ramp), then
    scale into **self-hosted Protomaps** — a single static `.pmtiles` basemap on
    **Cloudflare R2 (zero egress fees)**, served by HTTP range requests, **no
    per-request billing and no API key.** OSM source data is free. Switching
    providers later never touches the renderer → no lock-in.
- **Custom rendering: React Native Skia** for the snail sprite and the geodesic
  slime trail with time-based fade. **Reanimated** drives animation on the UI
  thread.
- **Location:**
  - `expo-location` for foreground sampling.
  - Background (**default, free/OSS**): `expo-location` + `expo-task-manager`
    using significant-change / geofencing for low-power coarse sampling (iOS
    Visit/SLC, Android geofence). *(Paid upgrade only if the free path proves
    unreliable across OEMs: `react-native-background-geolocation` (Transistorsoft)
    is more battle-tested but needs a **one-time paid license per platform** for
    release builds.)*
  - **Never** high-accuracy continuous GPS. The snail can't use it.
- **Notifications:** `expo-notifications` → APNs/FCM. **Arrival push only.**
- **State/data:** TanStack Query (server cache/sync) + Zustand (local UI state).
- **Payments:** **RevenueCat** for cross-platform IAP + subscriptions (eggs,
  cosmetics, stable slots). **Free until ~$2.5k/mo of tracked revenue, then ~1%**
  — i.e. it costs nothing until the app actually earns. Going direct (StoreKit 2
  + Play Billing) to drop the cut is a later option, not a v1 concern.

## Backend — authoritative (Supabase spine)

The server owns time and the simulation; the client renders and reports
location. This is required for the economy, multi-device, anti-cheat, and
server-pushed arrivals.

- **Supabase:**
  - **Postgres** — users, snails, reminders, journeys, eggs, inventory.
  - **Auth** — anonymous first (zero-friction onboarding), upgradeable to a real
    account later.
  - **Realtime** — used *sparingly*. Because journeys are deterministic, clients
    compute snail position locally from stored params; Realtime carries only
    occasional param/target updates + cross-device sync, never a position
    firehose. Keeps message/bandwidth cost near zero.
  - **Edge Functions** — journey compute, egg hatching, arrival scheduling.
  - **Storage** — cosmetic/snail assets.
  - *(Alt at scale: custom Node — Fastify/NestJS — + Postgres + a queue. Start on
    Supabase for velocity.)*
- **Scheduled work:** a cron/worker evaluates pending journeys and fires arrival
  pushes at their computed ETAs.
- **Push delivery:** Expo Push API (wraps APNs/FCM).

## The journey engine (the important part)

- **No per-second simulation.** A journey row stores: snail id + stats, start
  point, base speed, **quirk seed**, last-known target (your coarse location),
  created-at, and status.
- **Position is computed on demand** by deterministic interpolation along the
  geodesic, applying quirks from the seed — so the backwards-curse, naps, and
  detours are **reproducible without continuous compute** and identical on every
  client.
- **Location pings** (foreground resample + optional background coarse) lazily
  update the target; the server recomputes ETA and reschedules the arrival job.
- **Arrival** = computed position within threshold of the target → the scheduled
  push fires.
- **The Delivery Floor is enforced server-side** by clamping every computed ETA
  to `max(24h, 0.4 × honest_distance_time)`. The client never controls the
  clock. **Server time is authoritative; the client clock is ignored** (anti-
  cheat).

## Cost & dependency posture (lean by design)

**Stated preference: minimize external-API dependence and recurring cost.** The
design helps enormously — because journeys are **deterministic and computed
on-demand**, the client runs the map animation locally from a formula and the
server is **nearly idle during a week-long crawl** (it stores params, takes
occasional coarse pings, schedules one push). That deterministic engine is the
**master cost lever — protect it.**

Every paid/metered dependency, what it costs, and our lean stance:

| Dependency | Cost | Lean stance |
|---|---|---|
| **MapLibre** renderer | Free (BSD) | Keep. |
| **Map tiles / style** | MapTiler free tier → paid | Start MapTiler free tier → self-host **Protomaps `.pmtiles` on Cloudflare R2 (zero egress)**. No API key at the destination; OSM data free. |
| **Backend** (Supabase) | Free tier → $25/mo + usage | Start free tier. Deterministic journeys keep Realtime/bandwidth minimal. Self-host (it's OSS) or plain Postgres + tiny worker on Hetzner/Fly if the bill grows. |
| **Push** (Expo Push) | **Free** | Keep. Wraps APNs/FCM, both free. |
| **Background location** | Free (`expo-task-manager`) | Default to the free OSS path; buy the Transistorsoft license only if reliability forces it. |
| **IAP** (RevenueCat) | Free < ~$2.5k/mo rev, then ~1% | Costs nothing until you earn. Direct store billing later if the cut matters. |
| **Builds** (EAS) | Free tier → paid | Optional. `eas build --local` or CI (GitHub Actions) avoids it entirely. |
| **Geocoding** (optional) | Metered on most providers | **Avoid in v1** — the snail chases coordinates, not addresses. If we want place-name flavor later: self-host Nominatim/Photon or a free tier. |
| **Analytics / crash** (future) | Free tiers / self-host | Sentry free tier; PostHog self-host/free. Keep optional, off the critical path. |

**Genuinely unavoidable (platform tolls, not our choice):**
- **Apple Developer Program — $99/year** (required for the App Store *and* APNs push).
- **Google Play — $25 one-time.**

**The maximally-independent end-state** (worth steering toward as we scale):
MapLibre + self-hosted Protomaps on R2 (no map API key, no tile metering) +
self-hosted Postgres/worker + direct store billing. At that point we depend on
**essentially no metered third-party API** — just the two platform tolls above
and cheap flat-rate hosting. We don't *start* there (velocity wins early), but
nothing in the stack locks us out of it.

## Privacy posture (constitutional, not optional)

- **Coarse location only** (~50 m granularity is the ceiling of what's useful).
- Stored **ephemerally**: the latest target and a short trail history — not a
  long-term location log.
- Stated plainly in-app. This is a load-bearing trust promise, not legal
  boilerplate.

## Demo / dev tooling

- **Time-warp:** a debug-only journey-clock multiplier (1× / 1,000× / 100,000×)
  to compress a 7-day crawl into seconds for demos and tests. Server-supported
  behind a **dev flag**, and **never shippable to prod** — in production it would
  break the Delivery Floor.
- **Mock location + seeded journeys** for deterministic, reproducible test runs.

## Open / to confirm

- Tile provider migration trigger — when MapTiler's free tier gets tight, cut to
  self-hosted Protomaps on R2.
- Background location — validate the free `expo-task-manager` path is reliable
  enough across OEMs before considering the paid Transistorsoft license.
- Supabase managed vs self-hosted vs plain Postgres+worker — decide when the
  managed bill starts to bite.
- RevenueCat vs direct store billing — revisit as tracked revenue approaches the
  ~1% threshold.
- Gacha odds disclosure + per-store IAP compliance details.
- Exact tunables: base speed, spawn distance (1 km to <5 km default), Floor
  constants.

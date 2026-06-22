<p align="center">
  <img src="assets/readme/snail-standoff-banner.png" alt="Three snails facing Garden Snail" width="100%">
</p>

# Carrier Snail

Carrier Snail is an Expo/React Native app where your reminders are carried to
you by a snail crawling across a real map — at honest snail speed. It's a calm,
anti-urgency to-do app wrapped in a collectible game: hatch and level a stable of
snail species, earn **slime** by making deliveries and playing minigames, and
spend it in the shop.

The constitution in `specs/` is the source of truth; the **Delivery Floor** (a
reminder never arrives sooner than its honest distance-time) must never be
bypassed.

## App preview

<p align="center">
  <img src="assets/readme/app-preview-collage.png" alt="Carrier Snail app preview collage showing Intro, Map, My Snails, Snail Details, Flappy Snail, To Dos, Notifications, and Settings" width="100%">
</p>

## What's inside

- **Real-map journeys.** Each reminder rides a snail crawling a live MapLibre
  basemap at real snail speed; the trail shows distance travelled and remaining.
- **A collectible stable.** Hatch eggs into snail species (each with its own
  speed, trail, and look), then rename and level them. New players start with a
  Garden Snail and one unhatched egg.
- **Slime economy + shop.** Deliveries and minigames pay out *slime*, the soft
  currency spent on leveling, extra stable slots, eggs, and cosmetics.
- **Game Corner.** Four pick-up minigames — Flappy Snail, 2048 Snail, Snail
  Snake, and Salt Storm — reachable from a snail's detail page; scores pay out
  slime and experience for that snail.
- **To-dos, arrivals, settings.** A two-tier to-do model, an arrivals inbox, and
  optional background re-aiming, under a bottom tab bar.
- **Pixel + vibrant look.** A hybrid 8-bit / MapleStory visual language (see
  [Design system](#design-system)).

## Local development

Install dependencies:

```sh
npm install
```

Run the green gate:

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Run the native dev build:

```sh
npm run ios
# or
npm run android
```

MapLibre React Native is native code and does not run in Expo Go or on web — use
a dev build (`npm run ios` / `npm run android`).

### Standalone (release) build

A dev build streams its JS from Metro on every launch. To get a build that runs
**without a dev server** — the JS bundle is embedded and `EXPO_PUBLIC_*` values
are inlined at build time — build the release variant straight onto a connected
device:

```sh
npx expo run:android --variant release
```

The resulting APK (`android/app/build/outputs/apk/release/app-release.apk`) is a
complete standalone app; install it on another device with `adb install -r
<apk>`. It's signed with the debug keystore (fine for sideloading; a Play Store
upload needs a real release keystore or EAS Build).

### Map basemap (important)

The default style, `https://demotiles.maplibre.org/style.json`, is a **keyless
placeholder** with only low-zoom world data — it shows continents, not streets,
so the app frames it out to a world view. For a real city-level basemap (and to
see the snail crawl on actual roads), set a free
[MapTiler](https://cloud.maptiler.com) style + key in `.env`:

```sh
EXPO_PUBLIC_MAP_STYLE_URL=https://api.maptiler.com/maps/streets-v2/style.json?key=YOUR_MAPTILER_KEY
```

For the selectable Streets / Outdoor / Dark map skins in Settings, also set a
bare MapTiler key:

```sh
EXPO_PUBLIC_MAPTILER_KEY=YOUR_MAPTILER_KEY
```

Self-hosted Protomaps on Cloudflare R2 is the keyless, zero-egress option for
scale (see `specs/tech-stack.md`).

### Running on a physical device

A dev build downloads its JS from Metro on every launch, so **Metro must be
running** (`npx expo start`, or the terminal left open by `npm run android`), and
the phone must be able to reach it: put the phone on the **same Wi-Fi as your
computer**, or keep it on USB and run `adb reverse tcp:8081 tcp:8081`. A white
screen followed by an error almost always means Metro isn't running or isn't
reachable — not a code problem.

## Design system

The UI is driven by a central token module in `src/theme/` (`colors`,
`typography`, `spacing`, `radii`, `elevation`) — import tokens, never hardcode
hex. The look is "hybrid pixel + vibrant": a bright candy palette on a light
background with chunky borders, using **Press Start 2P** for titles, buttons, and
scores and **Fredoka** for readable body text (both loaded via `useFonts` at app
start). Shared UI idioms (`PixelButton`, `PixelUI`) live in `src/components/`.

## Project structure

- `src/journey/` — the pure journey/crawl engine (no I/O), unit-tested in isolation.
- `src/useCases/` — application logic behind injectable ports (repository, clock,
  push, location); the seam everything is tested through.
- `src/screens/`, `src/components/`, `src/minigames/` — the React Native UI.
- `src/theme/` — design tokens. `src/backend/` — Supabase adapters.
- `specs/` — the constitution and feature specs (source of truth).

## Backend spine

The Supabase foundation runs without credentials in local demo mode. To exercise
backend persistence, apply the migrations in `supabase/migrations/` to a Supabase
project and set:

```sh
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

When those values are absent, the app keeps using the existing in-memory local
state.

## Backend arrival worker

The scheduled arrival path lives in `runScheduledArrivalWorker`. It evaluates
pending journeys from the repository, uses the server `Clock` plus the Delivery
Floor ETA, sends exactly one arrival push through `PushSender`, then persists the
arrived journey, delivered reminder, and resting snail state.

Local/dev verification does not need real push credentials:

```sh
npm test -- --runTestsByPath src/useCases/runScheduledArrivalWorker.test.ts
```

Production scheduling should run the same use-case with a service-role Supabase
client, `SupabaseCarrierRepository`, and a `PushSender` implementation that
delivers through Expo Push.

## Foreground target updates

Foreground location updates run through `updateForegroundTarget`, which rounds
samples to roughly 50 m before persistence, re-aims active journeys from their
stored parameters, and retains only the latest target plus a short trail history.

## Optional background location

Background re-aiming is opt-in. The app asks for foreground permission first,
then background permission with plain copy that says the mode is optional and
coarse. If background permission is denied, foreground-only re-aiming still
works.

The Expo adapter uses `expo-task-manager` with balanced accuracy, 500 m movement
spacing, deferred updates, and automatic pausing. It requires a native dev build
or release build; Expo Go does not support background location.

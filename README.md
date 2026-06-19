# Carrier Snail

Carrier Snail is an Expo/React Native app where reminders crawl across a real
map at snail speed. The constitution in `specs/` is the source of truth; the
Delivery Floor must never be bypassed.

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

Run the Phase 0 native dev build:

```sh
npm run ios
# or
npm run android
```

MapLibre React Native is native code and does not run in Expo Go. The app uses
the MapLibre demo style by default; override it with
`EXPO_PUBLIC_MAP_STYLE_URL` in `.env` if needed.

## Backend spine

Issue #4 adds the Supabase foundation without requiring credentials for local
demo mode. To exercise backend persistence, apply the migration in
`supabase/migrations/` to a Supabase project and set:

```sh
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

When those values are absent, the app keeps using the existing in-memory local
state.

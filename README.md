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

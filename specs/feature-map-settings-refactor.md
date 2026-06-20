# Feature — Map cleanup + Settings tab + snail-details panel

> Resolved from a `/grill-me` session. Authoritative for this refactor. Builds on
> `feature-bottom-navbar.md` (this adds a 5th tab, a deliberate departure from the
> "exactly 4 tabs" rule, by the user's call). Honors the **Design quality bar** in
> the navbar spec.

## Goal

Strip dev/demo chrome off the Map, give real controls a proper home, and refocus
the bottom panel to be *only* about the selected snail and its to-do.

## Decisions

- **Navbar → 5 tabs:** `My Snails / Map / To Dos / Notifications / Settings`
  (Settings = `cog`, rightmost). Default tab stays **Map**.
- **Settings tab contents:**
  - **Background location** as a real **on/off toggle.** On prompts for permission
    if needed; Off stops the background task and reverts to foreground-only (adds
    `stopLowPowerUpdates` to the controller — today it only starts). Plain-language
    privacy note beside it.
  - **Speed / time-warp** lives here, wrapped in **`__DEV__`** — absent in prod.
- **Map stripped:**
  - **Trio/Single (personality-demo) toggle deleted** entirely — toggle, demo
    legend, `personalityDemoEnabled` state, and `demoSnailPersonalities` wiring. The
    map shows only real, assigned snails (a snail is on the map only once it carries
    a to-do).
  - **Header row removed** — no "Carrier Snail" title, no location label. Destination
    + ETA fold into the snail panel.
- **Onboarding → dedicated first-run screen** above the tabs; "Start with Garden
  Snail" hands off to the Map.
- **Bottom panel = strictly snail-details, peek ↔ expanded** (tap handle, no new
  native deps; gentle collapse via core RN Animated):
  - **Peek:** slim bar — selected snail name + ETA.
  - **Expanded:** name / level / quirk, the to-do it carries, destination + ETA,
    recall, and the watch-scrub.
  - **Deselected/empty:** a calm, characterful prompt ("Tap a snail to watch its
    crawl").
  - **Selection:** exactly one in-transit snail → auto-select; several → "tap a
    snail" until picked.

## Phases (each green-gated — typecheck + lint + tests — and leaves a working app)

1. **Strip the map.** Delete the Trio toggle, the demo legend, `personalityDemoEnabled`
   + `demoSnailPersonalities` usage, and the header row (title + location label).
   Keep the warp + location *state/logic*; only their map UI goes. ✅ Map shows only
   real snails; no Trio; no header row.
2. **Settings tab.** Add the `settings` tab (`TabBar` + `App` routing + a new
   `SettingsScreen`). Move the background-location control there as an on/off toggle
   (+ `stopLowPowerUpdates`); move the warp control there behind `__DEV__`. ✅ Settings
   works; location toggles both ways; warp is dev-only and off the map.
3. **Onboarding screen.** Extract onboarding to a first-run `OnboardingScreen`
   rendered above the tabs; remove the onboarding panel from the map controls. ✅
   First run shows onboarding → Start → Map.
4. **Snail-details panel.** Rebuild the bottom panel as strictly snail-details with
   peek ↔ expanded, the deselected/empty state, and destination/ETA folded in. ✅
   Panel is only snail-details; peek/expanded via a tap handle.
5. **Design polish + on-device check.** Polish Settings + Onboarding + the panel
   against the Design quality bar; verify on a physical device (UI isn't unit-testable).
   ✅ Clears the bar; feels finished.

## Out of scope
- A draggable/pan bottom sheet (chose tap peek↔expanded to avoid a native dep).
- Cutting the watch-scrub (kept, in the expanded panel).
- New settings beyond background-location + the dev warp.

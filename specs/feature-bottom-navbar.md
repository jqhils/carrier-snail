# Feature — Bottom Tab Navbar + Two-Tier To-Do Model

> Resolved design from a `/grill-me` session. This is the **authoritative spec**
> for this feature. Where it amends older reminder/recall wording in
> `mission.md`/`prd.md`, follow this spec — Phase 3 reconciles the constitution.
> The **Delivery Floor** and **one-push-on-arrival** are unchanged and inviolable.

## Goal

Add a classic mobile **bottom tab bar** (icon + label) and, in doing so, split
"reminder" into a **two-tier model**. Finally decompose the 59 KB `App.tsx` into
per-tab screens.

## Tab bar

- Four tabs, in this order: **My Snails**, **Map**, **To Dos**, **Notifications**.
- **Default/landing tab: Map** (today's home view), even though it's 2nd.
- **Hand-rolled** tab state (a single `activeTab`) — no navigation library.
- **The Map must stay mounted and warm** across tab switches (render it
  persistently, hide off-tab via `display: "none"`) so MapLibre's camera + tiles
  never reset. Other screens may mount/unmount freely.
- Icons: `@expo/vector-icons` **MaterialCommunityIcons** — `snail`,
  `map-marker`, `format-list-checks`, `bell`. Labels always visible. Safe-area
  aware (bottom inset).
- **Badges:** none, except a **single gentle, countless dot** on **Notifications**
  when there are unseen arrivals (no number, no red — a calm "something landed"
  signal, consistent with the anti-urgency thesis).

## Tab contents

- **My Snails** — the whole snail economy: the collection (resting snails **and**
  the status of any out carrying a to-do), the shop, eggs/hatching, and leveling.
- **Map** — the MapLibre map (build on the current implementation: camera centred
  on the user, MapTiler style, load-failure/placeholder overlays). **In-transit
  snails are tappable → a Details panel** (deselected = a minimal/empty
  placeholder for now; "fill later"). The existing **Expand toggle is repurposed
  to collapse the Details panel** (navbar stays visible). The dev **WARP** control
  stays on this tab.
- **To Dos** — a **limitless** to-do list. Add / edit / delete; **complete any
  to-do at any time** (with or without a snail). Per item: **Send a snail**
  (assign an idle snail → becomes a journey), **Recall** (free the snail, keep the
  to-do), and status (open / carrying + ETA / arrived).
- **Notifications** — an **arrivals inbox**: what snails have delivered, with
  history. The gentle dot clears when the tab is viewed.

## The two-tier model (constitution amendment — land in Phase 3)

- **`to-do`** is a new, **limitless** entity: `{ id, text, status: open | done,
  createdAt, doneAt? }`. (Today's `reminder` becomes this snail-optional to-do.)
- A **`journey`** is created **only when a snail is assigned** to a to-do — so a
  to-do has **0 or 1** snail. Journey creation moves from to-do-creation to
  snail-assignment. The finite stable still caps **concurrent journeys**, not
  to-dos.
- Derived display states: **open** (no journey) → **in-transit** (active journey)
  → **arrived** (journey delivered, to-do still open) → **done** (manual). `open`
  is reachable again via recall. `done` is reachable from any state, anytime.
- **Recall** = *free the snail (back to the stable), keep the to-do*. Deleting a
  to-do is a **separate** action. (Amends the old "recall = the thought dies".)
- **Completion** = manual, anytime, independent of any snail or arrival.
- **Arrival** = create a Notifications inbox entry (with an unseen/`seen` flag),
  flag the to-do **arrived** (it stays open until completed), return the snail to
  the stable + grant its egg, and fire the **single arrival push** (unchanged).
- **Assignment** happens from the **to-do** ("Send a snail" → pick an idle snail).
  If no snail is idle, the action is **disabled with a prompt** (recall one, or
  get more snails). Honors the stable concurrency cap.

## Implementation phases

Each phase = one `ready-for-agent` issue → one branch + PR into `build/v1`,
merged only on green (typecheck + lint + tests + build). New model logic lives in
**tested use-cases** (the seam in `prd.md`), not in UI. The map UI can't be
unit-tested — note where on-device verification is needed.

1. **Tab shell + decompose `App.tsx`.** Hand-rolled `activeTab` state + a
   `TabBar` (4 icons+labels, default Map). Move the *current* map + controls into
   a `MapScreen` **unchanged**; stub `MySnailsScreen` / `ToDosScreen` /
   `NotificationsScreen`. Map kept warm (`display:none` off-tab). ✅ App runs with
   tabs; nothing from today's screen is lost (it all still works under Map).
2. **Redistribute content.** Move the Stable + shop + eggs/hatching + leveling →
   `MySnailsScreen`; move the reminder composer → `ToDosScreen` (as "add a
   to-do"). The Map tab becomes map + Details panel (tap an in-transit snail →
   its details). ✅ Each surface lives in its correct tab; no duplication.
3. **Two-tier model (tested seam) + constitution amendment.** Introduce the
   `to-do` entity and use-cases: `createToDo`, `assignSnailToToDo` (idle-snail +
   stable-cap guards), `unassignSnail` (recall: free snail, keep to-do),
   `deleteToDo`, `completeToDo` (anytime) — each with tests. Wire the To Dos UI
   (limitless list, send-a-snail with the no-idle-snail prompt, recall, complete,
   status). Amend `mission.md` + `prd.md` for the model + recall. ✅ The two-tier
   model works end-to-end and is covered by use-case tests.
4. **Arrivals inbox.** `NotificationsScreen` lists delivered journeys (snail +
   to-do + time) with a `seen` flag; the gentle dot shows when unseen exist and
   clears on view. Arrival flags the to-do **arrived** (stays open), returns the
   snail, grants the egg, fires the one push. Tested in the arrival use-case. ✅
   Arrivals flow across To Dos / Notifications / stable correctly.
5. **Map Details panel + Expand-toggle repurpose + polish.** Flesh out the
   Details panel (selected snail: name/level/quirk + its to-do + ETA + recall;
   deselected: minimal default). Repurpose the Expand toggle to collapse the
   Details panel. Final pass + on-device check. ✅ Feature is complete and feels
   finished.

## Decided defaults (low-ambiguity)

- To-do edit + delete: yes. Manual reordering: no (v1).
- Re-assigning a snail to an **arrived** to-do is allowed (re-send).
- No badges except the single Notifications arrival dot.
- Onboarding runs first, then lands on the **Map** tab.
- Build on the existing map work (camera-on-user, MapTiler, overlays); don't
  rewrite it.

## Design quality bar (impeccable-derived)

Every screen must clear this bar. The UI is judged **on-device**, not by the
green gate. Source: the `impeccable` design skill, translated to React Native
(impeccable is web/CSS-native, so its *principles* transfer, not its CSS
mechanics or browser tooling).

- **Character over generic.** Pass the "AI slop" test: if this could be any app's
  tab bar + lists, it has failed. Lean into Carrier Snail's voice, calm,
  unhurried, a little whimsical (it is, after all, snails). Preserve and elevate
  the existing soft sage/cream palette, warm snail tones, and the blue accent;
  don't reach for generic SaaS styling.
- **Hierarchy.** Type scale with real contrast (≥1.25 between steps) plus weight,
  not a flat scale. One clear focal point per screen.
- **Spacing rhythm.** Vary spacing on purpose; identical padding everywhere is
  monotony. Group related things tightly, separate unrelated things generously.
- **Calm motion.** Tab changes, the Details-panel collapse, list updates: ease-out
  (Reanimated; quart/quint/expo), short, no bounce or elastic. Animate transform
  and opacity, not layout. Nothing that manufactures urgency.
- **Neutrals are tinted**, never pure black/white; tint toward the brand hue.
- **Absolute bans** (rewrite the element if tempted): coloured side-stripe accent
  borders; fake gradient text; glassmorphism by default; the big-number "hero
  metric" card; endless identical card grids (the Stable and the To-Do list each
  need their own rhythm, not a generic card wall); reaching for a modal first
  (prefer inline, the Details panel, or progressive disclosure).
- **Copy.** Every word earns its place; no restated headings. **No em dashes** in
  UI copy (use commas, colons, periods, parentheses). Hold the calm voice.
- **Empty states are designed, not blank.** The deselected Map Details, an empty
  To-Do list, an empty Notifications inbox, a near-empty starter stable: each is a
  deliberate, characterful state.

The tab bar itself: clear active/inactive states using the existing palette (not
a red), labels always legible, safe-area aware.

## Out of scope

- A navigation library (hand-rolled state by decision).
- Plain non-snail tasks beyond the to-do list itself.
- Numeric/urgency badges.
- Recurring reminders (still rejected by the constitution).

---
name: Carrier Snail
description: A cozy pixel-courier game where snails carry your to-dos across a live map.
colors:
  cream-paper: "#fdf6e9"
  cream-sunk: "#f3e7cf"
  panel: "#fffdf7"
  plum-ink: "#2a2336"
  ink-muted: "#6f6680"
  ink-faint: "#a89fb8"
  grape: "#7c5cff"
  grape-deep: "#5a3fd6"
  grape-soft: "#ece6ff"
  sky: "#37b6e9"
  sky-deep: "#1d8fc4"
  hot-pink: "#ff5da2"
  lime: "#8fd14f"
  gold: "#ffc83d"
  tangerine: "#ff8a3d"
  success: "#3fb56b"
  danger: "#ef4d5a"
  white: "#ffffff"
typography:
  display:
    fontFamily: "PressStart2P_400Regular, monospace"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: "30px"
    letterSpacing: "0.5px"
  headline:
    fontFamily: "PressStart2P_400Regular, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "0.5px"
  title:
    fontFamily: "PressStart2P_400Regular, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "0.5px"
  score:
    fontFamily: "PressStart2P_400Regular, monospace"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "0.5px"
  label:
    fontFamily: "PressStart2P_400Regular, monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0.5px"
  body:
    fontFamily: "Fredoka_600SemiBold, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
  body-strong:
    fontFamily: "Fredoka_700Bold, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: "20px"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "22px"
  xxl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.grape}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "9px 16px"
    height: "46px"
  button-primary-pressed:
    backgroundColor: "{colors.grape-deep}"
    textColor: "{colors.white}"
  button-secondary:
    backgroundColor: "{colors.sky}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "9px 16px"
    height: "46px"
  button-disabled:
    backgroundColor: "#d9d0c4"
    textColor: "{colors.ink-faint}"
    rounded: "{rounded.md}"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.plum-ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  chip-slime:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.plum-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
---

# Design System: Carrier Snail

## 1. Overview: The Cozy Pixel Courier

**Creative North Star: "The Cozy Pixel Courier"**

Carrier Snail is a warm, paper-cozy world with loud, tactile furniture. The room is unhurried: a cream-paper canvas and plum-ink lettering, never stark, the soft light of a desk where you leave notes for a snail to carry. The furniture is where the play lives: chunky, beveled candy controls that beg to be pressed, postage-bright accents, and pixel-arcade lettering on every score and label. The warmth keeps it calm; the chunk keeps it a game.

The system commits to a **light** canvas on purpose. The scene is a player glancing at their phone in daylight, sending a snail off with a reminder, not an SRE squinting at a dark dashboard. Candy saturation reads as sweet, not radioactive, only because it sits on warm cream. Move the same palette onto black and it becomes a neon gamer cliche, which this system explicitly refuses.

What it rejects: neon-on-black "dark mode gamer" UI; flat Material sterility with hairline-thin everything; soft drop-shadow blur as the only depth cue; and the calm sage/cream palette this look replaced (do not revert to sage). Snail illustrations stay smooth and lovingly drawn; only the chrome is pixel-styled.

**Key Characteristics:**
- Warm light canvas (cream paper), never pure white or pure black.
- Candy accents used like postage stamps: punctuation, not wallpaper. Grape is the one CTA voice.
- Chunky, tactile controls: 2px ink outline plus a hard bottom bevel in a deeper tone.
- Dual type system: Press Start 2P for titles/labels/scores, Fredoka for body and dense numerals.
- Depth from hard pixel shadows and layered bevels, never soft decorative blur.
- Smooth illustrated snails ride over pixel-styled chrome.

## 2. Colors: The Candy-On-Cream Palette

Candy-saturated accents on warm, plum-tinted neutrals: sweet but legible, because the brights only ever appear against cream.

### Primary
- **Grape** (#7c5cff): the single call-to-action voice. Primary buttons, current selection, focus, the active map marker ring. Its deep partner **Grape Deep** (#5a3fd6) is the pressed face and the chunky bottom bevel; **Grape Soft** (#ece6ff) tints selected rows and soft fills.

### Secondary
- **Candy Sky** (#37b6e9): secondary actions and supporting controls, with **Sky Deep** (#1d8fc4) as its bevel/pressed tone.

### Tertiary (decorative accents, used sparingly)
- **Hot Pink** (#ff5da2): badges, the cursed-rarity ramp, celebratory moments.
- **Lime** (#8fd14f): the uncommon-rarity ramp, positive flourishes.
- **Gold** (#ffc83d): coins, the slime currency chip, the mythic-rarity ramp; doubles as `warning`.
- **Tangerine** (#ff8a3d): warm accent for kickers and labels.

### Neutral
- **Cream Paper** (#fdf6e9): the app background, warm paper.
- **Cream Sunk** (#f3e7cf): recessed wells, game boards, sunken panels.
- **Panel** (#fffdf7): card and sheet fill, a hair brighter than the background.
- **Plum Ink** (#2a2336): primary text, the chunky pixel border color, and the hard pixel-shadow color, all the same cool plum near-black (never #000).
- **Ink Muted** (#6f6680) / **Ink Faint** (#a89fb8): secondary text, then disabled text and placeholders.
- **White** (#ffffff): on-accent text fill only. Never a surface.

### Status
- **Success** (#3fb56b), **Danger** (#ef4d5a) with deep partner #c92f3c for pressed/bevel.

### Named Rules
**The Tinted-Neutral Rule.** No element ever uses pure #fff or pure #000. Backgrounds tint warm toward cream; text and borders tint cool toward plum-ink. Stark neutrals are forbidden.

**The One-Grape Rule.** Grape is the only primary-action color. If two things on a screen are both grape, one of them is wrong. Decorative brights (pink, lime, gold) never stand in for the CTA.

**The Semantic-Token Rule.** Consume the semantic roles (`colors.primary`, `colors.textMuted`) and the `text.*` type tokens. Raw hex and the module-private `palette` are forbidden outside `src/theme/`.

## 3. Typography: Pixel Titles, Fredoka Body

**Display / Label Font:** Press Start 2P (monospace pixel fallback)
**Body Font:** Fredoka, in SemiBold (600) and Bold (700) (system-ui, sans-serif fallback)

**Character:** An 8-bit arcade marquee paired with a rounded, friendly sans. Press Start 2P carries the game-y identity in titles, tab labels, and scores; Fredoka does all the reading-weight work so nothing dense is ever set in pixels. Hierarchy comes from family and size, not from faux-bolding the pixel face (it has one weight).

### Hierarchy
- **Display** (Press Start 2P, 20px / 30px, +0.5 tracking): screen heroes and headline moments only.
- **Headline** (Press Start 2P, 16px / 24px): section and screen titles.
- **Title** (Press Start 2P, 13px / 20px): card headers, dialog titles.
- **Score** (Press Start 2P, 18px / 24px): in-game scores and standout numerals.
- **Label** (Press Start 2P, 10px / 16px, +0.5 tracking, often uppercase): pixel labels, kickers, tab text. Micro/tab steps exist at 8px and 7px for the navbar only.
- **Body** (Fredoka SemiBold, 14px / 20px): list text, paragraphs, prompts. Large step at 16px, small at 12px, xs at 11px. Cap prose at 65 to 75 characters.
- **Body Strong** (Fredoka Bold, 14px / 20px): emphasized values, peek titles, snail names.

### Named Rules
**The Two-Font Rule.** Press Start 2P for titles, labels, and scores. Fredoka for everything you actually read. Body copy, ETAs, and multi-line text in Press Start 2P are forbidden: at body size it is unreadable.

**The No-Faux-Weight Rule.** Never simulate weight on the pixel font. Step the size or switch to Fredoka Bold instead.

## 4. Elevation: Hard Chunk, No Blur

Depth is physical and chunky, the look of die-cut stickers and arcade buttons, not soft ambient shadow. Two flavors only. Surfaces are flat at rest; lift is for controls and floating chrome.

### Shadow Vocabulary
- **Pixel Shadow** (`shadowColor: #2a2336; shadowOffset: 0 3; shadowOpacity: 1; shadowRadius: 0`): the signature hard offset with zero blur, a crisp sticker edge. iOS renders the hard edge; Android cannot do `shadowRadius: 0`, so it falls back to a small `elevation: 4`. Used on cards, sheets, panels.
- **Soft Shadow** (`shadowColor: #2a2336; shadowOffset: 0 2; shadowOpacity: 0.18; shadowRadius: 6`): the one permitted blur, reserved for chrome floating directly over the live map (the recenter FAB, markers), where a hard black edge over basemap tiles would look dirty.

### Named Rules
**The Layered-Bevel Rule.** For true cross-platform chunk on buttons, depth comes from a thick bottom border (4 to 5px) in the deeper "bevel" tone, not from `pixelShadow`. The bevel is the 3D; the shadow is the sticker lift.

**The No-Decorative-Blur Rule.** Soft blur is permitted only as the map-overlay exception above. Glassmorphism and ambient drop-shadows as decoration are forbidden.

## 5. Components

Controls are tactile and confident: outlined, beveled, pressable. Containers are calm and flat. The contrast between loud controls and quiet surfaces is the whole game.

### Buttons
- **Shape:** gently chunky corners, 12px radius (`rounded.md`), with a 2px plum-ink outline.
- **Primary:** grape face (#7c5cff), white pixel-label text, 9px x 16px padding, 46px min height, and a 5px bottom border in Grape Deep (the bevel). A small/compact size drops to 36px min height with a 4px bevel.
- **Pressed:** the face darkens to Grape Deep and the button "sits down" (the bottom bevel shrinks), so a press reads as physical depression, not a color flash.
- **Secondary:** identical build on Candy Sky. **Danger** on red. **Disabled:** muted oat fill (#d9d0c4) with faint-ink text and no bevel.

### Chips
- **Slime / currency chip:** pill-shaped (`rounded.pill`), gold fill, plum-ink pixel label, leading coin glyph. Small status pills (rarity badges) reuse the rarity ramp colors with the 2px ink outline.

### Cards / Containers
- **Corner style:** 16px radius (`rounded.lg`); larger sheets use the same family.
- **Background:** Panel (#fffdf7) over the cream app background; sunken wells use Cream Sunk.
- **Shadow strategy:** flat at rest or a single Pixel Shadow lift; never stacked or blurred. Nested cards are forbidden.
- **Border:** 2px plum-ink outline is the default container edge; hairline `borderHairline` for internal dividers only.
- **Internal padding:** 16px (`spacing.lg`) is the default; vary deliberately, tight for grouped data, generous between unrelated blocks.

### Navigation
- **Bottom tab bar:** icon plus Press Start 2P tab label (8px tab step). Active tab carries grape; inactive tabs stay plum-ink/muted with no heavy color. The active state is the only place grape appears in the bar.

### Signature Component: the Map Detail Sheet
A bottom sheet that snaps between a short peek and an expanded card, translating on a spring. Collapsed with no selection it shows a centered, muted teaching cue ("Tap a snail for details") with a small gesture-tap glyph and a centered drag handle. Selecting a snail (tap its map marker) slides it open to the snail's details; tapping bare map collapses it. The peek stays deliberately short so the map keeps the stage.

## 6. Do's and Don'ts

### Do:
- **Do** consume semantic tokens: `colors.primary`, `text.body`, `radii.md`, `space.lg`, `pixelShadow`. Import from `../theme`.
- **Do** keep neutrals tinted: warm cream backgrounds, cool plum-ink text and borders.
- **Do** give pressable controls a 2px plum-ink outline and a deeper-tone bottom bevel (the Layered-Bevel Rule).
- **Do** set titles, labels, and scores in Press Start 2P, and all reading-weight text in Fredoka.
- **Do** reserve grape for the single primary action / current selection on a screen.
- **Do** keep snail PNG sprites smooth and anti-aliased; only the chrome is pixel-styled.

### Don't:
- **Don't** use pure #fff or #000 anywhere (the Tinted-Neutral Rule).
- **Don't** hardcode hex or reach into the private `palette`; use the semantic roles.
- **Don't** set body copy, ETAs, or any multi-line text in Press Start 2P.
- **Don't** put the candy palette on a dark/black background; it becomes a neon gamer cliche. This system is light.
- **Don't** revert to the old calm sage/cream palette; it is superseded.
- **Don't** add decorative blur or glassmorphism; the only soft shadow is chrome floating over the map.
- **Don't** nest cards, lean on hairline-only borders, or use soft drop-shadow as the primary depth cue.

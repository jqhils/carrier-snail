import type { Snail } from "../useCases/localCarrierState";
import type { Character } from "./types";

// Adapt a real owned Snail into the visual `character` the games consume. Colors
// come straight from the snail's appearance, so a hatched snail of any rarity is
// drawn in its own colors. The in-game `modifier` is left empty (cosmetic): every
// snail plays the same minigame, and what differs between snails is their *map*
// stats, which live in the snail economy — not here. To make rarity affect
// handling later, fill `modifier` from `snail.rarity` (a one-line change).
export function snailToCharacter(snail: Snail): Character {
  return {
    accentColor: snail.appearance.shellColor,
    bodyColor: snail.appearance.bodyColor,
    id: snail.id,
    modifier: {},
    name: snail.name,
    powerUp: "",
    shellColor: snail.appearance.shellColor,
    tagline: `Lv ${snail.level} · ${snail.rarity}`
  };
}

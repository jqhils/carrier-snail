import type { Character } from "./types";

// The playable roster. Only the Redbull snail carries a live power-up for now
// (one tuned modifier, easy to read in the demo); every other snail is purely
// cosmetic. To turn a snail into a power-up later, give it a non-empty modifier
// and a powerUp label — no game code changes.
export const CHARACTERS: Character[] = [
  {
    accentColor: "#5fa233",
    bodyColor: "#a8e85f",
    id: "classic",
    modifier: {},
    name: "Garden Snail",
    powerUp: "",
    shellColor: "#3f7a2a",
    tagline: "Just a snail. No tricks."
  },
  {
    accentColor: "#ffc83d",
    bodyColor: "#ffe08a",
    id: "redbull",
    modifier: { flapScale: 1.08, gravityScale: 0.8 },
    name: "Redbull Snail",
    powerUp: "Wings · floatier, stronger flaps",
    shellColor: "#e10600",
    tagline: "It gives you wiiings."
  },
  {
    accentColor: "#7c5cff",
    bodyColor: "#c4b3ff",
    id: "compsci",
    modifier: {},
    name: "Comp Sci Snail",
    powerUp: "",
    shellColor: "#5a3fd6",
    tagline: "git commit -m 'crawl'"
  },
  {
    accentColor: "#ffc83d",
    bodyColor: "#9fd9f2",
    id: "sydney-train",
    modifier: {},
    name: "Sydney Train Snail",
    powerUp: "",
    shellColor: "#1d8fc4",
    tagline: "Delayed. Always delayed."
  },
  {
    accentColor: "#9d6bff",
    bodyColor: "#c9b3ff",
    id: "usyd",
    modifier: {},
    name: "USYD Snail",
    powerUp: "",
    shellColor: "#6a45c8",
    tagline: "Sometimes crawls backwards."
  },
  {
    accentColor: "#13c4c4",
    bodyColor: "#7fe3e0",
    id: "uts",
    modifier: {},
    name: "UTS Snail",
    powerUp: "",
    shellColor: "#0a6e6e",
    tagline: "Hasn't moved in years."
  }
];

export const DEFAULT_CHARACTER_ID = "classic";

export function getCharacter(id: string): Character {
  return CHARACTERS.find((character) => character.id === id) ?? CHARACTERS[0];
}

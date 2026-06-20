import type { Character } from "./types";

// The playable roster. Only the Redbull snail carries a live power-up for now
// (one tuned modifier, easy to read in the demo); every other snail is purely
// cosmetic. To turn a snail into a power-up later, give it a non-empty modifier
// and a powerUp label — no game code changes.
export const CHARACTERS: Character[] = [
  {
    accentColor: "#6f9e54",
    bodyColor: "#cfe0a8",
    id: "classic",
    modifier: {},
    name: "Garden Snail",
    powerUp: "",
    shellColor: "#9c6b3f",
    tagline: "Just a snail. No tricks."
  },
  {
    accentColor: "#e10600",
    bodyColor: "#fbe7c6",
    id: "redbull",
    modifier: { flapScale: 1.08, gravityScale: 0.8 },
    name: "Redbull Snail",
    powerUp: "Wings · floatier, stronger flaps",
    shellColor: "#e10600",
    tagline: "It gives you wiiings."
  },
  {
    accentColor: "#3c2a1f",
    bodyColor: "#f0d6a8",
    id: "compsci",
    modifier: {},
    name: "Comp Sci Snail",
    powerUp: "",
    shellColor: "#7a4a24",
    tagline: "git commit -m 'crawl'"
  },
  {
    accentColor: "#f2b705",
    bodyColor: "#e7d6b0",
    id: "sydney-train",
    modifier: {},
    name: "Sydney Train Snail",
    powerUp: "",
    shellColor: "#6b7280",
    tagline: "Delayed. Always delayed."
  },
  {
    accentColor: "#c8742a",
    bodyColor: "#efd9b0",
    id: "usyd",
    modifier: {},
    name: "USYD Snail",
    powerUp: "",
    shellColor: "#b5651d",
    tagline: "Sometimes crawls backwards."
  },
  {
    accentColor: "#0aa3a3",
    bodyColor: "#dfeceb",
    id: "uts",
    modifier: {},
    name: "UTS Snail",
    powerUp: "",
    shellColor: "#222831",
    tagline: "Hasn't moved in years."
  }
];

export const DEFAULT_CHARACTER_ID = "classic";

export function getCharacter(id: string): Character {
  return CHARACTERS.find((character) => character.id === id) ?? CHARACTERS[0];
}

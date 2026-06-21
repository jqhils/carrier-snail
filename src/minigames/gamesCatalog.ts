import type { GameId } from "./types";

export type GameCatalogEntry = {
  available: boolean;
  blurb: string;
  id: GameId;
  name: string;
};

// The list the hub renders. Flippy is live; the rest slot in behind the same
// GameComponentProps contract when they're built.
export const GAMES: GameCatalogEntry[] = [
  {
    available: true,
    blurb: "Tap to flap your snail through the gaps.",
    id: "flappy",
    name: "Flappy Snail"
  },
  {
    available: true,
    blurb: "Slide and merge snail shells.",
    id: "2048",
    name: "2048 Snail"
  },
  {
    available: true,
    blurb: "Eat, grow, don't cross your own trail.",
    id: "snake",
    name: "Snail Snake"
  }
];

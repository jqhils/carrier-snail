// Shared contracts for the mini-games world (everything behind the "Games" tab).
//
// Design: a Character drives both the LOOK (skin colors) and, optionally, a
// passive POWER-UP (modifier) that tweaks how a game plays. Games are leaf
// components — they take a Character, report a GameResult, and know nothing
// about the picker, XP, or leaderboard. All of that lives in the hub. Adding a
// new game means writing one component to this contract; nothing else changes.

export type GameId = "flappy" | "2048" | "snake" | "salt";

// Passive power-up: optional scalar tweaks a game merges into its own config.
// Each game reads only the fields it understands; an empty modifier = cosmetic.
export type GameModifier = {
  flapScale?: number; // >1 = stronger flap (Flappy)
  gapScale?: number; // >1 = wider gaps / easier (Flappy)
  gravityScale?: number; // <1 = floatier (Flappy)
  pipeSpeedScale?: number; // <1 = slower obstacles (Flappy)
  scoreScale?: number; // reward multiplier (any game)
};

export type Character = {
  accentColor: string;
  bodyColor: string;
  id: string;
  modifier: GameModifier;
  name: string;
  powerUp: string; // human-readable label for the picker ("" = cosmetic only)
  shellColor: string;
  tagline: string;
};

export type GameResult = {
  characterId: string;
  gameId: GameId;
  // Multiplier the host applies to a snail's journey speed (the map reward).
  rewardMultiplier: number;
  score: number;
};

// Every game component conforms to this. The hub mounts it, hands it the chosen
// character, and listens for exit + result.
export type GameComponentProps = {
  character: Character;
  onExit: () => void;
  onResult: (result: GameResult) => void;
};

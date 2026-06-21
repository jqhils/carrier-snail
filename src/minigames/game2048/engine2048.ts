// 2048 engine — pure + deterministic, TILE-BASED so the UI can animate each
// tile sliding from its old cell to its new one. The slide/merge rules are the
// classic 2048 algorithm (adapted from gabrielecirulli's 2048, MIT). Spawns use
// a seeded PRNG so games are reproducible in tests. No rendering lives here.

export const BOARD_SIZE = 4;

export type Direction = "up" | "down" | "left" | "right";

// A tile has a stable id that survives across moves, so the renderer can animate
// it. On a merge the survivor keeps its id (value doubles); the absorbed tile is
// removed.
export type Tile = {
  col: number;
  id: number;
  row: number;
  value: number;
};

export type Game2048State = {
  best: number;
  nextId: number;
  over: boolean;
  score: number;
  seed: number;
  tiles: Tile[];
  won: boolean;
};

// Result of applying a move — the new state plus the bits the renderer needs to
// animate: which survivor ids merged (pop), which ids were removed, and the id
// of the freshly spawned tile (pop-in).
export type MoveResult = {
  merged: number[];
  moved: boolean;
  removed: number[];
  spawnedId: number | null;
  state: Game2048State;
};

const SPAWN_FOUR_CHANCE = 0.1;
const WIN_TILE = 2048;
const DEFAULT_SEED = 0x2048abcd;

function nextRandom(seed: number): { seed: number; value: number } {
  const next = (seed + 0x6d2b79f5) >>> 0;
  let mixed = Math.imul(next ^ (next >>> 15), next | 1);
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
  const value = ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  return { seed: next, value };
}

function gridFromTiles(tiles: Tile[]): (Tile | null)[][] {
  const grid: (Tile | null)[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );
  for (const tile of tiles) {
    grid[tile.row][tile.col] = tile;
  }
  return grid;
}

function emptyCells(tiles: Tile[]): { col: number; row: number }[] {
  const grid = gridFromTiles(tiles);
  const cells: { col: number; row: number }[] = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (grid[row][col] === null) {
        cells.push({ col, row });
      }
    }
  }
  return cells;
}

function spawnInto(
  tiles: Tile[],
  seed: number,
  nextId: number
): { nextId: number; seed: number; tile: Tile } | null {
  const cells = emptyCells(tiles);
  if (cells.length === 0) {
    return null;
  }
  const pick = nextRandom(seed);
  const cell = cells[Math.floor(pick.value * cells.length)];
  const four = nextRandom(pick.seed);
  const tile: Tile = {
    col: cell.col,
    id: nextId,
    row: cell.row,
    value: four.value < SPAWN_FOUR_CHANCE ? 4 : 2
  };
  return { nextId: nextId + 1, seed: four.seed, tile };
}

// Where the k-th tile from the moving edge lands, for a given line index.
function cellFor(
  direction: Direction,
  index: number,
  k: number
): { col: number; row: number } {
  if (direction === "left") {
    return { col: k, row: index };
  }
  if (direction === "right") {
    return { col: BOARD_SIZE - 1 - k, row: index };
  }
  if (direction === "up") {
    return { col: index, row: k };
  }
  return { col: index, row: BOARD_SIZE - 1 - k };
}

// The tiles in one row/column, ordered from the moving edge inward.
function lineTiles(
  grid: (Tile | null)[][],
  direction: Direction,
  index: number
): Tile[] {
  const line: Tile[] = [];
  for (let k = 0; k < BOARD_SIZE; k += 1) {
    const { col, row } = cellFor(direction, index, k);
    const tile = grid[row][col];
    if (tile !== null) {
      line.push(tile);
    }
  }
  return line;
}

export type SlideResult = {
  gained: number;
  merged: number[];
  moved: boolean;
  removed: number[];
  tiles: Tile[];
};

// Pure slide: returns the new tiles (copies, with updated positions/values),
// score gained, and merge/removal info. Never mutates the input tiles.
export function slide(tiles: Tile[], direction: Direction): SlideResult {
  const grid = gridFromTiles(tiles);
  const result: Tile[] = [];
  const merged: number[] = [];
  const removed: number[] = [];
  let gained = 0;
  let moved = false;

  for (let index = 0; index < BOARD_SIZE; index += 1) {
    const line = lineTiles(grid, direction, index);
    const survivors: Tile[] = [];

    let i = 0;
    while (i < line.length) {
      if (i + 1 < line.length && line[i].value === line[i + 1].value) {
        const value = line[i].value * 2;
        survivors.push({ ...line[i], value });
        gained += value;
        merged.push(line[i].id);
        removed.push(line[i + 1].id);
        i += 2;
      } else {
        survivors.push({ ...line[i] });
        i += 1;
      }
    }

    survivors.forEach((tile, k) => {
      const target = cellFor(direction, index, k);
      if (tile.row !== target.row || tile.col !== target.col) {
        moved = true;
      }
      tile.row = target.row;
      tile.col = target.col;
      result.push(tile);
    });
  }

  if (removed.length > 0) {
    moved = true;
  }

  return { gained, merged, moved, removed, tiles: result };
}

export function highestTile(tiles: Tile[]): number {
  let max = 0;
  for (const tile of tiles) {
    if (tile.value > max) {
      max = tile.value;
    }
  }
  return max;
}

// Any move still possible? (an empty cell, or two equal neighbours.)
export function movesAvailable(tiles: Tile[]): boolean {
  const grid = gridFromTiles(tiles);
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const here = grid[row][col];
      if (here === null) {
        return true;
      }
      const right = col + 1 < BOARD_SIZE ? grid[row][col + 1] : null;
      if (right !== null && right.value === here.value) {
        return true;
      }
      const down = row + 1 < BOARD_SIZE ? grid[row + 1][col] : null;
      if (down !== null && down.value === here.value) {
        return true;
      }
    }
  }
  return false;
}

export function createInitialState(
  seed: number = DEFAULT_SEED,
  best = 0
): Game2048State {
  let s = seed >>> 0;
  let nextId = 1;
  const tiles: Tile[] = [];
  for (let n = 0; n < 2; n += 1) {
    const spawned = spawnInto(tiles, s, nextId);
    if (spawned) {
      tiles.push(spawned.tile);
      s = spawned.seed;
      nextId = spawned.nextId;
    }
  }
  return { best, nextId, over: false, score: 0, seed: s, tiles, won: false };
}

// Apply a move. If nothing slides, `moved` is false and the same state is
// returned. Otherwise it slides, spawns one tile, and recomputes score/won/over.
export function applyMove(
  state: Game2048State,
  direction: Direction
): MoveResult {
  const slid = slide(state.tiles, direction);
  if (!slid.moved) {
    return { merged: [], moved: false, removed: [], spawnedId: null, state };
  }

  // A valid move always frees at least one cell, so a spawn always succeeds.
  const spawned = spawnInto(slid.tiles, state.seed, state.nextId);
  const tiles = spawned ? [...slid.tiles, spawned.tile] : slid.tiles;
  const score = state.score + slid.gained;

  return {
    merged: slid.merged,
    moved: true,
    removed: slid.removed,
    spawnedId: spawned ? spawned.tile.id : null,
    state: {
      best: Math.max(state.best, score),
      nextId: spawned ? spawned.nextId : state.nextId,
      over: !movesAvailable(tiles),
      score,
      seed: spawned ? spawned.seed : state.seed,
      tiles,
      won: state.won || highestTile(tiles) >= WIN_TILE
    }
  };
}

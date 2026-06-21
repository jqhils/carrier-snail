// Pure, deterministic Snake. The component holds this in React state and calls
// step() on a timer + turn() on a swipe — no refs, no in-place mutation, so it
// stays inside the project's hooks lint rules. Seeded RNG (mulberry32) keeps
// food placement testable.

export const GRID_COLS = 15;
export const GRID_ROWS = 17;

export type Cell = { col: number; row: number };
export type Direction = "down" | "left" | "right" | "up";
export type SnakePhase = "dead" | "playing" | "ready";

export type SnakeState = {
  // Committed heading (what the last step used) — turns are validated against
  // this so you can't reverse into yourself within a single tick.
  dir: Direction;
  food: Cell;
  // Buffered heading applied on the next step().
  nextDir: Direction;
  phase: SnakePhase;
  rngSeed: number;
  score: number;
  snake: Cell[]; // head first
};

const DELTA: Record<Direction, Cell> = {
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
  right: { col: 1, row: 0 },
  up: { col: 0, row: -1 }
};

const OPPOSITE: Record<Direction, Direction> = {
  down: "up",
  left: "right",
  right: "left",
  up: "down"
};

function mulberry32(seed: number): { next: number; value: number } {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { next: t, value };
}

function sameCell(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}

// Place food on a random empty cell. Returns the cell + the advanced seed.
function placeFood(snake: Cell[], seed: number): { food: Cell; seed: number } {
  const occupied = new Set(snake.map((c) => `${c.row}:${c.col}`));
  const empty: Cell[] = [];
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLS; col += 1) {
      if (!occupied.has(`${row}:${col}`)) {
        empty.push({ col, row });
      }
    }
  }
  if (empty.length === 0) {
    return { food: snake[0], seed };
  }
  const r = mulberry32(seed);
  const idx = Math.floor(r.value * empty.length);
  return { food: empty[idx], seed: r.next };
}

export function createInitialState(seed = 1): SnakeState {
  const row = Math.floor(GRID_ROWS / 2);
  const col = Math.floor(GRID_COLS / 2);
  const snake: Cell[] = [
    { col, row },
    { col: col - 1, row },
    { col: col - 2, row }
  ];
  const placed = placeFood(snake, seed);
  return {
    dir: "right",
    food: placed.food,
    nextDir: "right",
    phase: "ready",
    rngSeed: placed.seed,
    score: 0,
    snake
  };
}

// Begin play (first swipe/tap). No-op once playing or dead.
export function start(state: SnakeState): SnakeState {
  if (state.phase !== "ready") {
    return state;
  }
  return { ...state, phase: "playing" };
}

// Buffer a turn. Ignores reversals (can't flip 180° into your own neck) and
// repeats of the current heading.
export function turn(state: SnakeState, dir: Direction): SnakeState {
  if (state.phase === "dead") {
    return state;
  }
  const started = state.phase === "ready" ? start(state) : state;
  if (dir === OPPOSITE[started.dir]) {
    return started;
  }
  return { ...started, nextDir: dir };
}

// Advance one tick. Grows on food, dies on wall/self. Returns a fresh state.
export function step(state: SnakeState): SnakeState {
  if (state.phase !== "playing") {
    return state;
  }
  const dir = state.nextDir;
  const head = state.snake[0];
  const nextHead: Cell = {
    col: head.col + DELTA[dir].col,
    row: head.row + DELTA[dir].row
  };

  const offBoard =
    nextHead.row < 0 ||
    nextHead.row >= GRID_ROWS ||
    nextHead.col < 0 ||
    nextHead.col >= GRID_COLS;
  if (offBoard) {
    return { ...state, dir, phase: "dead" };
  }

  const ate = sameCell(nextHead, state.food);
  // Cells still occupied after the move: drop the tail unless we grew.
  const body = ate ? state.snake : state.snake.slice(0, state.snake.length - 1);
  if (body.some((c) => sameCell(c, nextHead))) {
    return { ...state, dir, phase: "dead" };
  }

  const snake = [nextHead, ...body];
  if (!ate) {
    return { ...state, dir, snake };
  }

  const filled = snake.length >= GRID_ROWS * GRID_COLS;
  const placed = placeFood(snake, state.rngSeed);
  return {
    ...state,
    dir,
    food: filled ? snake[0] : placed.food,
    phase: filled ? "dead" : "playing",
    rngSeed: placed.seed,
    score: state.score + 1,
    snake
  };
}

export function restart(seed = 1): SnakeState {
  return { ...createInitialState(seed), phase: "playing" };
}

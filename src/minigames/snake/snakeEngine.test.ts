import {
  createInitialState,
  GRID_COLS,
  GRID_ROWS,
  start,
  step,
  turn,
  type SnakeState
} from "./snakeEngine";

function play(state: SnakeState, steps: number): SnakeState {
  let s = state;
  for (let i = 0; i < steps; i += 1) {
    s = step(s);
  }
  return s;
}

describe("snakeEngine", () => {
  it("starts ready, centered, length 3, not moving until started", () => {
    const s = createInitialState(1);
    expect(s.phase).toBe("ready");
    expect(s.snake).toHaveLength(3);
    expect(step(s)).toBe(s); // ready => step is a no-op (same ref)
  });

  it("a turn input starts the game", () => {
    const s = turn(createInitialState(1), "up");
    expect(s.phase).toBe("playing");
    expect(s.nextDir).toBe("up");
  });

  it("advances the head one cell per step", () => {
    const s = start(createInitialState(1));
    const head0 = s.snake[0];
    const s1 = step(s);
    expect(s1.snake[0].col).toBe(head0.col + 1);
    expect(s1.snake[0].row).toBe(head0.row);
    expect(s1.snake).toHaveLength(3); // no food eaten => same length
  });

  it("ignores a 180° reversal", () => {
    const s = start(createInitialState(1)); // heading right
    const t = turn(s, "left"); // opposite => ignored
    expect(t.nextDir).toBe("right");
  });

  it("dies on the wall", () => {
    const dead = play(start(createInitialState(1)), GRID_COLS); // run into right wall
    expect(dead.phase).toBe("dead");
  });

  it("grows and scores when eating food", () => {
    // Put food directly ahead of the head so the next step eats it.
    const base = start(createInitialState(1));
    const head = base.snake[0];
    const seeded: SnakeState = {
      ...base,
      food: { col: head.col + 1, row: head.row }
    };
    const after = step(seeded);
    expect(after.score).toBe(1);
    expect(after.snake).toHaveLength(4); // grew by one
  });

  it("keeps food on the board", () => {
    const s = createInitialState(7);
    expect(s.food.row).toBeGreaterThanOrEqual(0);
    expect(s.food.row).toBeLessThan(GRID_ROWS);
    expect(s.food.col).toBeGreaterThanOrEqual(0);
    expect(s.food.col).toBeLessThan(GRID_COLS);
  });
});

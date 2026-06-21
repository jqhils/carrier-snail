import {
  applyMove,
  createInitialState,
  highestTile,
  movesAvailable,
  slide,
  type Game2048State,
  type Tile
} from "./engine2048";

// Build tiles from a value grid (0 = empty), assigning sequential ids.
function tilesFrom(rows: number[][]): Tile[] {
  const tiles: Tile[] = [];
  let id = 1;
  rows.forEach((row, r) =>
    row.forEach((value, c) => {
      if (value !== 0) {
        tiles.push({ col: c, id: (id += 1), row: r, value });
      }
    })
  );
  return tiles;
}

// Render tiles back to a value grid for easy assertions.
function valueGrid(tiles: Tile[]): number[][] {
  const grid = Array.from({ length: 4 }, () => Array(4).fill(0));
  for (const tile of tiles) {
    grid[tile.row][tile.col] = tile.value;
  }
  return grid;
}

function stateFrom(rows: number[][], seed = 7): Game2048State {
  return {
    best: 0,
    nextId: 999,
    over: false,
    score: 0,
    seed,
    tiles: tilesFrom(rows),
    won: false
  };
}

describe("2048 engine (tile-based)", () => {
  it("starts with two tiles on distinct cells, each a 2 or 4", () => {
    const state = createInitialState(123);
    expect(state.tiles).toHaveLength(2);
    expect(state.tiles[0].id).not.toBe(state.tiles[1].id);
    const [a, b] = state.tiles;
    expect(a.row !== b.row || a.col !== b.col).toBe(true);
    for (const tile of state.tiles) {
      expect([2, 4]).toContain(tile.value);
    }
  });

  it("slides and merges a row to the left", () => {
    const result = slide(
      tilesFrom([
        [2, 2, 0, 0],
        [4, 0, 4, 0],
        [2, 2, 2, 2],
        [0, 0, 0, 0]
      ]),
      "left"
    );
    expect(valueGrid(result.tiles)[0]).toEqual([4, 0, 0, 0]);
    expect(valueGrid(result.tiles)[1]).toEqual([8, 0, 0, 0]);
    expect(valueGrid(result.tiles)[2]).toEqual([4, 4, 0, 0]);
    expect(result.gained).toBe(4 + 8 + 8);
    expect(result.moved).toBe(true);
  });

  it("merges right / up / down by orientation", () => {
    const right = slide(
      tilesFrom([
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]),
      "right"
    );
    expect(valueGrid(right.tiles)[0]).toEqual([0, 0, 0, 4]);

    const column = [
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    expect(valueGrid(slide(tilesFrom(column), "up").tiles)[0][0]).toBe(4);
    expect(valueGrid(slide(tilesFrom(column), "down").tiles)[3][0]).toBe(4);
  });

  it("preserves the survivor's id on a merge and removes the absorbed tile", () => {
    const tiles = tilesFrom([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const survivorId = tiles[0].id;
    const absorbedId = tiles[1].id;
    const result = slide(tiles, "left");
    expect(result.merged).toContain(survivorId);
    expect(result.removed).toContain(absorbedId);
    expect(result.tiles.map((tile) => tile.id)).toContain(survivorId);
    expect(result.tiles.map((tile) => tile.id)).not.toContain(absorbedId);
  });

  it("never merges unequal neighbours and reports no move when packed", () => {
    const result = slide(
      tilesFrom([
        [2, 4, 8, 16],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]),
      "left"
    );
    expect(result.gained).toBe(0);
    expect(result.moved).toBe(false);
  });

  it("merges each tile at most once per move", () => {
    const result = slide(
      tilesFrom([
        [4, 4, 4, 4],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
      ]),
      "left"
    );
    expect(valueGrid(result.tiles)[0]).toEqual([8, 8, 0, 0]);
    expect(result.gained).toBe(16);
    expect(result.removed).toHaveLength(2);
  });

  it("does not mutate the input tiles", () => {
    const tiles = tilesFrom([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const before = JSON.stringify(tiles);
    slide(tiles, "left");
    expect(JSON.stringify(tiles)).toBe(before);
  });

  it("spawns one tile and adds score on a real move", () => {
    const before = stateFrom([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = applyMove(before, "left");
    expect(result.moved).toBe(true);
    expect(result.state.score).toBe(4);
    // one merged survivor + one spawned tile
    expect(result.state.tiles).toHaveLength(2);
    expect(result.spawnedId).not.toBeNull();
  });

  it("returns the same state on a no-op move", () => {
    const before = stateFrom([
      [2, 4, 8, 16],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ]);
    const result = applyMove(before, "left");
    expect(result.moved).toBe(false);
    expect(result.state).toBe(before);
  });

  it("detects available moves and a locked board", () => {
    expect(
      movesAvailable(
        tilesFrom([
          [2, 4, 2, 4],
          [4, 2, 4, 2],
          [2, 4, 2, 8],
          [4, 2, 8, 2]
        ])
      )
    ).toBe(false);
    expect(
      movesAvailable(
        tilesFrom([
          [2, 2, 4, 8],
          [4, 8, 16, 32],
          [2, 4, 8, 16],
          [4, 8, 16, 32]
        ])
      )
    ).toBe(true);
  });

  it("reports the highest tile", () => {
    expect(
      highestTile(
        tilesFrom([
          [2, 4, 8, 16],
          [32, 64, 128, 256],
          [0, 0, 0, 0],
          [0, 0, 0, 0]
        ])
      )
    ).toBe(256);
  });
});

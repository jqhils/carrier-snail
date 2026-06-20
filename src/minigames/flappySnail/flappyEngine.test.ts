import {
  collides,
  createInitialState,
  defaultConfig,
  restart,
  scoreToSpeedMultiplier,
  step,
  type FlappyState
} from "./flappyEngine";

const cfg = defaultConfig(400, 600);

function playing(overrides: Partial<FlappyState> = {}): FlappyState {
  return { ...createInitialState(cfg), phase: "playing", snailY: 300, ...overrides };
}

describe("flappy engine — lifecycle", () => {
  it("starts ready and centered with no pipes", () => {
    const s = createInitialState(cfg);

    expect(s.phase).toBe("ready");
    expect(s.snailY).toBe(cfg.height / 2);
    expect(s.pipes).toHaveLength(0);
  });

  it("begins playing and gives a crisp upward impulse on the first flap", () => {
    const s = step(createInitialState(cfg), cfg, { flap: true });

    expect(s.phase).toBe("playing");
    expect(s.velocity).toBe(cfg.flapVelocity);
  });

  it("restart keeps the best score but resets the run", () => {
    const dead = playing({ phase: "dead", best: 7, score: 3, snailY: 120 });
    const s = restart(dead, cfg);

    expect(s.best).toBe(7);
    expect(s.score).toBe(0);
    expect(s.phase).toBe("ready");
  });
});

describe("flappy engine — physics", () => {
  it("applies gravity so an un-flapped snail starts falling", () => {
    let s = step(createInitialState(cfg), cfg, { flap: true });
    const afterFlap = s.velocity;
    s = step(s, cfg, { flap: false });

    expect(s.velocity).toBeGreaterThan(afterFlap);

    let falling = false;
    for (let i = 0; i < 80 && s.phase === "playing"; i += 1) {
      s = step(s, cfg, { flap: false });
      if (s.velocity > 0) falling = true;
    }
    expect(falling).toBe(true);
  });

  it("clamps the snail at the ceiling", () => {
    let s = createInitialState(cfg);
    for (let i = 0; i < 30; i += 1) s = step(s, cfg, { flap: true });

    expect(s.snailY).toBeGreaterThanOrEqual(cfg.snailRadius - 1e-6);
  });

  it("spawns pipes once enough ground has scrolled", () => {
    let s = step(createInitialState(cfg), cfg, { flap: true });
    let spawned = false;
    for (let i = 0; i < 120; i += 1) {
      s = step(s, cfg, { flap: s.snailY > 320 });
      if (s.pipes.length > 0) spawned = true;
    }
    expect(spawned).toBe(true);
  });
});

describe("flappy engine — scoring & collision", () => {
  it("scores when a pipe passes the snail", () => {
    const before = playing();
    before.pipes = [{ x: cfg.snailX - cfg.pipeWidth - 1, gapY: 300, passed: false }];
    const s = step(before, cfg, { flap: false });

    expect(s.score).toBe(1);
    expect(s.pipes[0].passed).toBe(true);
  });

  it("triggers a loop flourish every tenth point", () => {
    const before = playing({ score: 9 });
    before.pipes = [{ x: cfg.snailX - cfg.pipeWidth - 1, gapY: 300, passed: false }];
    const s = step(before, cfg, { flap: false });

    expect(s.score).toBe(10);
    expect(s.spin).toBeGreaterThan(0);
  });

  it("dies on the ground and inside a pipe, survives in the gap", () => {
    const onGround = playing({ snailY: cfg.height - cfg.groundHeight - 1, velocity: 5 });
    expect(step(onGround, cfg, { flap: false }).phase).toBe("dead");

    const insidePipe = playing({ snailY: 40 });
    insidePipe.pipes = [{ x: cfg.snailX - 5, gapY: 400, passed: false }];
    expect(collides(insidePipe, cfg)).toBe(true);

    const inGap = playing({ snailY: 300 });
    inGap.pipes = [{ x: cfg.snailX - 5, gapY: 300, passed: false }];
    expect(collides(inGap, cfg)).toBe(false);
  });
});

describe("flappy engine — determinism & rewards", () => {
  it("produces identical pipe layouts for the same seed", () => {
    const run = (seed: number) => {
      let s = createInitialState(cfg, 0, seed);
      for (let i = 0; i < 300; i += 1) s = step(s, cfg, { flap: i % 8 === 0 });
      return s.pipes.map((pipe) => Math.round(pipe.gapY));
    };

    expect(run(42)).toEqual(run(42));
    expect(run(1)).not.toEqual(run(2));
  });

  it("maps score to a capped journey speed multiplier", () => {
    expect(scoreToSpeedMultiplier(0)).toBe(1);
    expect(scoreToSpeedMultiplier(10)).toBeCloseTo(1.8);
    expect(scoreToSpeedMultiplier(999)).toBe(4);
  });
});

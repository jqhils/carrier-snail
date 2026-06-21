import {
  createInitialState,
  defaultConfig,
  kindFor,
  levelFor,
  restart,
  SHIELD_FRAMES,
  START_LIVES,
  snailYFor,
  start,
  step,
  type SaltConfig,
  type SaltState
} from "./saltStormEngine";

const cfg: SaltConfig = defaultConfig(360, 720);

function run(state: SaltState, frames: number, targetX: number): SaltState {
  let s = state;
  for (let i = 0; i < frames; i += 1) {
    s = step(s, cfg, { targetX });
  }
  return s;
}

describe("saltStormEngine", () => {
  it("starts ready and centered, not moving until started", () => {
    const s = createInitialState(cfg, 1);
    expect(s.phase).toBe("ready");
    expect(s.level).toBe(0);
    expect(step(s, cfg, { targetX: 10 })).toBe(s);
  });

  it("eases the snail toward the finger target", () => {
    const s = start(createInitialState(cfg, 1));
    const moved = step(s, cfg, { targetX: 300 });
    expect(moved.snailX).toBeGreaterThan(s.snailX);
    expect(moved.snailX).toBeLessThan(300);
  });

  it("clamps the snail inside the play area", () => {
    const far = run(start(createInitialState(cfg, 1)), 60, 99999);
    expect(far.snailX).toBeLessThanOrEqual(360 - cfg.snailHalf + 0.001);
  });

  it("starts at level 1 and levels up every 10s", () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(600)).toBe(2);
    expect(levelFor(3000)).toBe(6);
    const s = run(start(createInitialState(cfg, 7)), 60, 180);
    expect(s.score).toBeGreaterThan(0);
  });

  it("waves grow with level: 1 early, 2 mid, 3+ at level 5", () => {
    const base = start(createInitialState(cfg, 7));
    const waveAt = (frame: number) => {
      const seeded: SaltState = { ...base, frame, level: 0, spawnCountdown: 1, pickupCountdown: 9999, hazards: [] };
      return step(seeded, cfg, { targetX: base.snailX }).hazards.length;
    };
    expect(waveAt(10)).toBe(1); // level 1
    expect(waveAt(610)).toBeGreaterThanOrEqual(2); // level 2
    expect(waveAt(2410)).toBeGreaterThanOrEqual(3); // level 5
  });

  it("unlocks deadlier hazards by level: salt -> bombs (3) -> poison (5)", () => {
    expect(kindFor(1, 0.99)).toBe("salt"); // early: salt only
    expect(kindFor(3, 0.99)).toBe("bomb"); // bombs appear at level 3
    expect(kindFor(5, 0.99)).toBe("poison"); // poison at level 5
  });

  it("takes 3 hits to die, with i-frames blocking damage between hits", () => {
    const base = start(createInitialState(cfg, 1));
    const snailY = snailYFor(cfg);
    const hit = (st: SaltState): SaltState =>
      step(
        { ...st, hazards: [{ id: 1, kind: "salt", rot: 0, size: cfg.hazardSize, spin: 0, vy: 0, x: base.snailX, y: snailY }], spawnCountdown: 9999, pickupCountdown: 9999 },
        cfg,
        { targetX: base.snailX }
      );
    expect(START_LIVES).toBe(3);
    let s = hit(base);
    expect(s.phase).toBe("playing");
    expect(s.lives).toBe(2);
    expect(s.invuln).toBeGreaterThan(0);
    // a hazard during i-frames does NOT cost a heart
    s = hit(s);
    expect(s.lives).toBe(2);
    // clear i-frames and hit again -> 1, then 0 = dead
    s = hit({ ...s, invuln: 0 });
    expect(s.lives).toBe(1);
    expect(hit({ ...s, invuln: 0 }).phase).toBe("dead");
  });

  it("a shield makes the snail invincible (salt shatters)", () => {
    const base = start(createInitialState(cfg, 1));
    const snailY = snailYFor(cfg);
    const seeded: SaltState = {
      ...base,
      shield: SHIELD_FRAMES,
      hazards: [{ id: 1, kind: "salt", rot: 0, size: cfg.hazardSize, spin: 0, vy: 2, x: base.snailX, y: snailY }],
      spawnCountdown: 9999,
      pickupCountdown: 9999
    };
    const after = step(seeded, cfg, { targetX: base.snailX });
    expect(after.phase).toBe("playing");
    expect(after.hazards).toHaveLength(0);
    expect(after.lives).toBe(START_LIVES);
  });

  it("catching a shell grants a shield + bonus", () => {
    const base = start(createInitialState(cfg, 1));
    const snailY = snailYFor(cfg);
    const seeded: SaltState = {
      ...base,
      pickups: [{ id: 1, size: cfg.hazardSize, vy: 2, x: base.snailX, y: snailY }],
      spawnCountdown: 9999,
      pickupCountdown: 9999
    };
    const after = step(seeded, cfg, { targetX: base.snailX });
    expect(after.shield).toBe(SHIELD_FRAMES);
    expect(after.bonus).toBe(5);
  });

  it("restart returns a live, empty board", () => {
    const r = restart(cfg, 1);
    expect(r.phase).toBe("playing");
    expect(r.hazards).toHaveLength(0);
    expect(r.score).toBe(0);
    expect(r.level).toBe(0);
    expect(r.lives).toBe(START_LIVES);
  });
});

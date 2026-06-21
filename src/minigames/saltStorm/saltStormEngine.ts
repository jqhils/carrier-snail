// Pure, deterministic "Salt Storm": a snail at the bottom dodges salt shakers
// raining down (snails hate salt). Fixed-step, like the Flappy engine — the
// component calls step() once per frame and feeds the finger's x as targetX.
//
// Engagement: you START at Level 1 and LEVEL UP every 10s (flash + the salt
// speeds up each level). Shakers are random sizes; waves grow with level
// (1 -> 2 -> 2-3 -> 3-4 at level 5+), spread so there's always a gap. An
// occasional shell grants ~3s shield. Slime banks every 10s survived (cap 8).

export type HazardKind = "bomb" | "poison" | "salt";

export type Hazard = {
  id: number;
  kind: HazardKind;
  rot: number;
  size: number;
  spin: number;
  vy: number;
  x: number;
  y: number;
};

export type Pickup = { id: number; size: number; vy: number; x: number; y: number };

export type SaltPhase = "dead" | "playing" | "ready";

export type SaltConfig = {
  ease: number;
  groundHeight: number;
  hazardSize: number;
  height: number;
  snailHalf: number;
  spawnEveryMin: number;
  spawnEveryStart: number;
  startFall: number;
  width: number;
};

export type SaltState = {
  bonus: number;
  frame: number;
  hazards: Hazard[];
  invuln: number;
  level: number;
  lives: number;
  nextId: number;
  phase: SaltPhase;
  pickupCountdown: number;
  pickups: Pickup[];
  rngSeed: number;
  score: number;
  shield: number;
  snailX: number;
  spawnCountdown: number;
  targetX: number;
};

export const SHIELD_FRAMES = 200;
export const START_LIVES = 3;
const INVULN_FRAMES = 36; // ~0.6s of flashing i-frames after a hit
const FRAMES_PER_LEVEL = 600; // 10s — level up every 10s, starting at Level 1

export function defaultConfig(width: number, height: number): SaltConfig {
  return {
    ease: 0.28,
    groundHeight: Math.round(height * 0.1),
    hazardSize: Math.max(26, Math.round(width * 0.085)) * 1.15, // +15% size
    height,
    snailHalf: Math.max(20, Math.round(width * 0.075)),
    spawnEveryMin: 22,
    spawnEveryStart: 44,
    startFall: Math.max(3.2, height * 0.005) * 1.2, // +20% base fall
    width
  };
}

function mulberry32(seed: number): { next: number; value: number } {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { next: t, value };
}

export function snailYFor(config: SaltConfig): number {
  return config.height - config.groundHeight - config.snailHalf - 6;
}

// Level 1 from the first frame, then +1 every 10s. (No "Level 0".)
export function levelFor(frame: number): number {
  return Math.floor(frame / FRAMES_PER_LEVEL) + 1;
}
// Salt falls faster every level (+8% per level on top of the +20% base).
function fallSpeedFor(config: SaltConfig, level: number, frame: number): number {
  return config.startFall * (1 + (level - 1) * 0.08) + Math.min(4, frame * 0.006);
}
function spawnEveryFor(config: SaltConfig, level: number, frame: number): number {
  return Math.max(config.spawnEveryMin, config.spawnEveryStart - level * 2 - Math.floor(frame / 130));
}
// Wave size grows with level: 1 -> 2 -> 2-3 -> 3-4 (level 5+).
function waveCountFor(level: number, roll: number): number {
  if (level >= 5) {
    return roll < 0.4 ? 4 : 3;
  }
  if (level >= 3) {
    return roll < 0.5 ? 3 : 2;
  }
  if (level >= 2) {
    return 2;
  }
  return 1;
}

// Deadlier hazards unlock as you level: salt (always), bombs (level 3+, big
// hitbox), poison (level 5+, small + fast). All deadly — variety, not new rules.
export function kindFor(level: number, roll: number): HazardKind {
  if (level >= 5) {
    if (roll < 0.45) {
      return "salt";
    }
    return roll < 0.75 ? "bomb" : "poison";
  }
  if (level >= 3) {
    return roll < 0.62 ? "salt" : "bomb";
  }
  return "salt";
}

const SIZE_MUL: Record<HazardKind, number> = { bomb: 1.25, poison: 0.82, salt: 1 };
const SPEED_MUL: Record<HazardKind, number> = { bomb: 0.92, poison: 1.28, salt: 1 };

export function createInitialState(config: SaltConfig, seed = 1): SaltState {
  return {
    bonus: 0,
    frame: 0,
    hazards: [],
    invuln: 0,
    level: 0,
    lives: START_LIVES,
    nextId: 1,
    phase: "ready",
    pickupCountdown: 300,
    pickups: [],
    rngSeed: seed,
    score: 0,
    shield: 0,
    snailX: config.width / 2,
    spawnCountdown: 22,
    targetX: config.width / 2
  };
}

export function start(state: SaltState): SaltState {
  if (state.phase !== "ready") {
    return state;
  }
  return { ...state, phase: "playing" };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function overlaps(sx: number, sy: number, half: number, x: number, y: number, bh: number): boolean {
  return Math.abs(sx - x) < half + bh && Math.abs(sy - y) < half + bh;
}

export function step(
  state: SaltState,
  config: SaltConfig,
  input: { targetX: number }
): SaltState {
  if (state.phase !== "playing") {
    return state;
  }

  const frame = state.frame + 1;
  const level = levelFor(frame);
  const shield = Math.max(0, state.shield - 1);
  const half = config.snailHalf;
  const snailX = clamp(
    state.snailX + (input.targetX - state.snailX) * config.ease,
    half,
    config.width - half
  );
  const snailY = snailYFor(config);

  const moved: Hazard[] = state.hazards.map((h) => ({
    ...h,
    rot: h.rot + h.spin,
    y: h.y + h.vy
  }));

  let lives = state.lives;
  let invuln = Math.max(0, state.invuln - 1);
  const survivors: Hazard[] = [];
  for (const h of moved) {
    if (overlaps(snailX, snailY, half, h.x, h.y, h.size * 0.5 - h.size * 0.3)) {
      if (shield > 0) {
        continue; // shielded: salt shatters, no damage
      }
      if (invuln > 0) {
        survivors.push(h); // flashing: ghost through harmlessly
        continue;
      }
      lives -= 1;
      invuln = INVULN_FRAMES; // got hit: lose a heart + brief i-frames
      if (lives <= 0) {
        return { ...state, frame, hazards: moved, invuln, level, lives: 0, phase: "dead", shield, snailX };
      }
      continue; // the hazard that hit you is consumed
    }
    if (h.y - h.size <= config.height) {
      survivors.push(h);
    }
  }

  let bonus = state.bonus;
  let nextShield = shield;
  const keptPickups: Pickup[] = [];
  for (const p of state.pickups.map((p) => ({ ...p, y: p.y + p.vy }))) {
    if (overlaps(snailX, snailY, half, p.x, p.y, p.size * 0.5)) {
      nextShield = SHIELD_FRAMES;
      bonus += 5;
      continue;
    }
    if (p.y - p.size <= config.height) {
      keptPickups.push(p);
    }
  }

  let spawnCountdown = state.spawnCountdown - 1;
  let nextId = state.nextId;
  let rngSeed = state.rngSeed;
  if (spawnCountdown <= 0) {
    const rc = mulberry32(rngSeed);
    rngSeed = rc.next;
    const n = waveCountFor(level, rc.value);
    const usable = config.width - config.hazardSize * 2;
    const zoneW = usable / n;
    for (let i = 0; i < n; i += 1) {
      const rk = mulberry32(rngSeed);
      const rx = mulberry32(rk.next);
      const rs = mulberry32(rx.next);
      const rsp = mulberry32(rs.next);
      rngSeed = rsp.next;
      const kind = kindFor(level, rk.value);
      const x = config.hazardSize + zoneW * i + rx.value * zoneW;
      const size = config.hazardSize * SIZE_MUL[kind] * (0.85 + rs.value * 0.4);
      const vy = fallSpeedFor(config, level, frame) * SPEED_MUL[kind] * (0.9 + rsp.value * 0.2);
      survivors.push({ id: nextId, kind, rot: 0, size, spin: (rsp.value - 0.5) * 0.18, vy, x, y: -size });
      nextId += 1;
    }
    spawnCountdown = spawnEveryFor(config, level, frame);
  }

  let pickupCountdown = state.pickupCountdown - 1;
  if (pickupCountdown <= 0) {
    const rp = mulberry32(rngSeed);
    rngSeed = rp.next;
    const margin = config.hazardSize;
    const px = margin + rp.value * (config.width - margin * 2);
    keptPickups.push({ id: nextId, size: config.hazardSize, vy: fallSpeedFor(config, level, frame) * 0.65, x: px, y: -config.hazardSize });
    nextId += 1;
    pickupCountdown = 360 + Math.floor(rp.value * 220);
  }

  return {
    ...state,
    bonus,
    frame,
    hazards: survivors,
    invuln,
    level,
    lives,
    nextId,
    pickupCountdown,
    pickups: keptPickups,
    rngSeed,
    score: Math.floor(frame / 6) + bonus,
    shield: nextShield,
    snailX,
    spawnCountdown
  };
}

export function restart(config: SaltConfig, seed = 1): SaltState {
  return { ...createInitialState(config, seed), phase: "playing" };
}

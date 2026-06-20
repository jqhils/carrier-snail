// Pure Flappy Snail engine — no React/RN imports, fully deterministic.
// All state transitions live here so they can be unit-tested in the green gate,
// mirroring the rest of the codebase (pure logic + Jest specs).

export type FlappyPhase = "ready" | "playing" | "dead";

export type Pipe = {
  passed: boolean;
  x: number;
  gapY: number;
};

export type FlappyConfig = {
  gapMargin: number;
  gravity: number;
  groundHeight: number;
  flapVelocity: number;
  height: number;
  maxFall: number;
  pipeGap: number;
  pipeSpacing: number;
  pipeSpeed: number;
  pipeWidth: number;
  snailRadius: number;
  snailX: number;
  width: number;
};

export type FlappyState = {
  best: number;
  distanceSinceSpawn: number;
  phase: FlappyPhase;
  pipes: Pipe[];
  score: number;
  seed: number;
  spin: number;
  tiltDeg: number;
  velocity: number;
  snailY: number;
};

const DEFAULT_SEED = 0x9e3779b9;

export function defaultConfig(width: number, height: number): FlappyConfig {
  return {
    gapMargin: 26,
    gravity: 0.5,
    groundHeight: Math.round(height * 0.13),
    flapVelocity: -8.2,
    height,
    maxFall: 12,
    pipeGap: 172,
    pipeSpacing: 220,
    pipeSpeed: 2.5,
    pipeWidth: 64,
    snailRadius: 17,
    snailX: Math.round(width * 0.3),
    width
  };
}

export function createInitialState(
  config: FlappyConfig,
  best = 0,
  seed: number = DEFAULT_SEED
): FlappyState {
  return {
    best,
    distanceSinceSpawn: 0,
    phase: "ready",
    pipes: [],
    score: 0,
    seed: seed >>> 0,
    spin: 0,
    tiltDeg: 0,
    velocity: 0,
    snailY: config.height / 2
  };
}

// mulberry32 — deterministic PRNG so pipe layouts are reproducible in tests.
function nextRandom(seed: number): { seed: number; value: number } {
  let next = (seed + 0x6d2b79f5) >>> 0;
  let mixed = Math.imul(next ^ (next >>> 15), next | 1);
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
  const value = ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  return { seed: next, value };
}

function spawnGapY(config: FlappyConfig, value: number): number {
  const minY = config.pipeGap / 2 + config.gapMargin;
  const maxY =
    config.height - config.groundHeight - config.pipeGap / 2 - config.gapMargin;
  return minY + value * (maxY - minY);
}

export function collides(state: FlappyState, config: FlappyConfig): boolean {
  const radius = config.snailRadius;

  if (state.snailY + radius >= config.height - config.groundHeight) {
    return true;
  }

  for (const pipe of state.pipes) {
    const withinX =
      config.snailX + radius > pipe.x &&
      config.snailX - radius < pipe.x + config.pipeWidth;

    if (!withinX) {
      continue;
    }

    const gapTop = pipe.gapY - config.pipeGap / 2;
    const gapBottom = pipe.gapY + config.pipeGap / 2;

    if (state.snailY - radius < gapTop || state.snailY + radius > gapBottom) {
      return true;
    }
  }

  return false;
}

// Advance one fixed step. `flap` is whether a flap input arrived this step.
export function step(
  state: FlappyState,
  config: FlappyConfig,
  input: { flap: boolean }
): FlappyState {
  const next: FlappyState = {
    ...state,
    pipes: state.pipes.map((pipe) => ({ ...pipe }))
  };

  if (input.flap && next.phase === "ready") {
    next.phase = "playing";
  }

  if (next.spin > 0) {
    next.spin = Math.max(0, next.spin - 0.34);
  }

  if (next.phase !== "playing") {
    return next;
  }

  // Gravity integrates first; a flap then overrides to a crisp upward impulse.
  next.velocity = Math.min(next.velocity + config.gravity, config.maxFall);

  if (input.flap) {
    next.velocity = config.flapVelocity;
  }

  next.snailY += next.velocity;

  if (next.snailY < config.snailRadius) {
    next.snailY = config.snailRadius;
    next.velocity = 0;
  }

  for (const pipe of next.pipes) {
    pipe.x -= config.pipeSpeed;
  }

  next.distanceSinceSpawn += config.pipeSpeed;

  if (next.distanceSinceSpawn >= config.pipeSpacing) {
    next.distanceSinceSpawn -= config.pipeSpacing;
    const draw = nextRandom(next.seed);
    next.seed = draw.seed;
    next.pipes.push({
      gapY: spawnGapY(config, draw.value),
      passed: false,
      x: config.width
    });
  }

  next.pipes = next.pipes.filter(
    (pipe) => pipe.x + config.pipeWidth > -10
  );

  for (const pipe of next.pipes) {
    if (!pipe.passed && pipe.x + config.pipeWidth < config.snailX) {
      pipe.passed = true;
      next.score += 1;

      if (next.score > next.best) {
        next.best = next.score;
      }

      if (next.score % 10 === 0) {
        next.spin = Math.PI * 2;
      }
    }
  }

  next.tiltDeg = Math.max(-28, Math.min(80, next.velocity * 4));

  if (collides(next, config)) {
    next.phase = "dead";
  }

  return next;
}

// On death, restart but keep the best score and continue the PRNG stream.
export function restart(state: FlappyState, config: FlappyConfig): FlappyState {
  return createInitialState(config, state.best, state.seed);
}

// Reward mapping consumed by the app: turns a run into a journey speed
// multiplier. 0 pts -> 1x (no change), each cleared pipe adds 8%, capped at 4x.
export function scoreToSpeedMultiplier(score: number): number {
  return Math.min(4, 1 + score * 0.08);
}

// Merge a character's passive power-up into a base config. Scales default to 1
// (no change), so a cosmetic-only snail with an empty modifier plays exactly
// like the baseline. This is the single hook a character uses to alter Flappy.
export function applyFlappyModifier(
  config: FlappyConfig,
  modifier: {
    flapScale?: number;
    gapScale?: number;
    gravityScale?: number;
    pipeSpeedScale?: number;
  }
): FlappyConfig {
  return {
    ...config,
    flapVelocity: config.flapVelocity * (modifier.flapScale ?? 1),
    gravity: config.gravity * (modifier.gravityScale ?? 1),
    pipeGap: config.pipeGap * (modifier.gapScale ?? 1),
    pipeSpeed: config.pipeSpeed * (modifier.pipeSpeedScale ?? 1)
  };
}

export type EnemyThreatKind = "rocket" | "uav" | "ballistic";

export type WaveConfig = {
  targetKills: number;
  spawnDelayMs: number;
  weights: { ballistic: number; uav: number; rocket: number };
  /** When true, spawn only UAVs and use swarm counts */
  swarm?: boolean;
  swarmCountMin?: number;
  swarmCountMax?: number;
  /** Multiplier applied to enemy movement speed */
  speedScale: number;
  /**
   * When set (and `swarm` is not used), every spawn roll uses this threat type
   * instead of `weights` — ties wave design to Grad / UAV / ballistic behaviors.
   */
  forcedThreat?: EnemyThreatKind;
};

export const WAVE_CONFIGS: WaveConfig[] = [
  {
    targetKills: 8,
    spawnDelayMs: 1800,
    weights: { ballistic: 0, uav: 1, rocket: 0 },
    forcedThreat: "uav",
    speedScale: 1,
  },
  {
    targetKills: 12,
    spawnDelayMs: 1400,
    /** Ballistic + MIRV from wave 2 onward */
    weights: { ballistic: 0.18, uav: 0.42, rocket: 0.4 },
    speedScale: 1,
  },
  {
    /** ~30% fewer kills than prior 15 */
    targetKills: 11,
    spawnDelayMs: 1400,
    weights: { ballistic: 0, uav: 1, rocket: 0 },
    swarm: true,
    swarmCountMin: 2,
    swarmCountMax: 3,
    speedScale: 1,
  },
  {
    targetKills: 18,
    spawnDelayMs: 900,
    weights: { ballistic: 0.35, uav: 0, rocket: 0.65 },
    forcedThreat: "ballistic",
    speedScale: 1,
  },
  {
    targetKills: 20,
    spawnDelayMs: 500,
    weights: { ballistic: 0.25, uav: 0.375, rocket: 0.375 },
    speedScale: 1.35,
  },
];

export const WAVE_COUNT = WAVE_CONFIGS.length;

export type WaveSpawnMode =
  | { mode: "swarm" }
  | { mode: "forced"; threat: EnemyThreatKind }
  | { mode: "weighted"; weights: { ballistic: number; uav: number; rocket: number } };

function softWeightsFromForced(threat: EnemyThreatKind): {
  ballistic: number;
  uav: number;
  rocket: number;
} {
  if (threat === "uav") {
    return { ballistic: 0.22, uav: 0.38, rocket: 0.4 };
  }
  if (threat === "ballistic") {
    return { ballistic: 0.45, uav: 0.2, rocket: 0.35 };
  }
  return { ballistic: 0.22, uav: 0.28, rocket: 0.5 };
}

function scaleWeightsForTier(
  w: { ballistic: number; uav: number; rocket: number },
  tier: number,
): { ballistic: number; uav: number; rocket: number } {
  let b = w.ballistic;
  let u = w.uav;
  let r = w.rocket;
  const gr = 0.11 * tier;
  const gb = 0.09 * tier;
  b += gb;
  r += gr;
  u = Math.max(0.05, u - gb - gr);
  const s = b + u + r;
  return { ballistic: b / s, uav: u / s, rocket: r / s };
}

/**
 * Spawn selection for a wave. After cycle 1 (`tier` ≥ 1), forced-UAV slots become a mixed
 * distribution so rockets/ballistics scale in endless play instead of locking to UAV-only.
 */
export function getWaveSpawnMode(wave: number): WaveSpawnMode {
  const idx = (wave - 1) % WAVE_COUNT;
  const cfg = WAVE_CONFIGS[idx]!;
  const tier = Math.floor((wave - 1) / WAVE_COUNT);

  if (cfg.swarm) {
    return { mode: "swarm" };
  }
  if (tier === 0 && cfg.forcedThreat) {
    return { mode: "forced", threat: cfg.forcedThreat };
  }

  const base =
    tier >= 1 && cfg.forcedThreat
      ? softWeightsFromForced(cfg.forcedThreat)
      : { ...cfg.weights };

  return { mode: "weighted", weights: scaleWeightsForTier(base, tier) };
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

/** One–two line briefing for the HUD / wave-clear cinematic (wave = the wave about to begin). */
export function getWaveIntelLine(wave: number): string {
  if (isBossWave(wave)) {
    return "EXPECTING: MEGA-BOSS";
  }
  if (isRedAlertSwarmWave(wave)) {
    return "EXPECTING: RED ALERT — MIXED ROCKET / UAV SWARM";
  }

  const mode = getWaveSpawnMode(wave);
  if (mode.mode === "swarm") {
    return "EXPECTING: UAV SWARM PACKS";
  }
  if (mode.mode === "forced") {
    const label =
      mode.threat === "ballistic"
        ? "BALLISTIC"
        : mode.threat === "rocket"
          ? "ROCKETS"
          : "UAV";
    return `EXPECTING: 100% ${label}`;
  }
  const { weights: w } = mode;
  return `EXPECTING: ${pct(w.rocket)} ROCKETS, ${pct(w.ballistic)} BALLISTIC, ${pct(w.uav)} UAV`;
}

/**
 * Red Alert mass-swarm on waves 5, 15, 25, … (not on boss milestone waves 10, 20, 30).
 */
export function isRedAlertSwarmWave(wave: number): boolean {
  return wave > 0 && wave % 10 === 5;
}

/** Mega-boss encounter on waves 10, 20, 30, … */
export function isBossWave(wave: number): boolean {
  return wave > 0 && wave % 10 === 0;
}


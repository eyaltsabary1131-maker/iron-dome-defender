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
};

export const WAVE_CONFIGS: WaveConfig[] = [
  {
    targetKills: 8,
    spawnDelayMs: 1800,
    weights: { ballistic: 0, uav: 1, rocket: 0 },
    speedScale: 1,
  },
  {
    targetKills: 12,
    spawnDelayMs: 1400,
    weights: { ballistic: 0, uav: 0.55, rocket: 0.45 },
    speedScale: 1,
  },
  {
    targetKills: 15,
    /** Slower spawns for UAV swarm — dense but manageable */
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

/** Boss encounter every 5th wave (5, 10, 15, …). */
export function isBossWave(wave: number): boolean {
  return wave > 0 && wave % 5 === 0;
}

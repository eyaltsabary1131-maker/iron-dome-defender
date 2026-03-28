import { LAUNCHER_MAG_CAPACITY } from "@/game/batteryTypes";

/** War economy & inter-wave procurement tuning */
export const ECONOMY = {
  /** Seed budget so wave 1 can pay per shot before first kills. */
  STARTING_CREDITS: 200,

  /** Passive income while a wave is in progress (not in armory / inter-wave flow). */
  PASSIVE_CREDITS_PER_SECOND: 2,

  CREDITS_ROCKET: 100,
  CREDITS_UAV: 250,
  CREDITS_BALLISTIC: 250,
  CREDITS_BOSS: 1500,

  BASE_RELOAD_MS: 3500,
  RELOAD_REDUCTION_MS: 1000,
  RAPID_RELOAD_MAX: 10,
  RAPID_RELOAD_COST: 1000,

  BASE_MAG: LAUNCHER_MAG_CAPACITY,
  EXTENDED_MAG_BONUS: 10,
  EXTENDED_MAG_MAX: 10,
  EXTENDED_MAG_COST: 1500,

  PROPULSION_BONUS: 0.25,
  PROPULSION_MAX: 10,
  PROPULSION_COST: 1200,

  AUTO_TURRET_MAX: 10,
  AUTO_TURRET_COST: 1800,
  DEBRIS_SWEEPER_MAX: 10,
  DEBRIS_SWEEPER_COST: 1600,
  EXTENDED_RANGE_MAX: 10,
  EXTENDED_RANGE_COST: 1400,

  /** One-time: +1 HP to each strategic site at the start of every wave. */
  REPAIR_CREWS_COST: 2200,

  MAX_HEARTS: 3,
  BUY_LIFE_COST: 2500,

  /** Credits per round still in the magazine when the wave ends (precision bonus). */
  RESOURCE_EFFICIENCY_PER_ROUND: 20,

  /** Floor so reload never becomes trivial */
  MIN_RELOAD_MS: 1500,

  /** Early-wave credit bonus (waves 1–2) for shop pacing */
  EARLY_WAVE_CREDIT_MULT: 1.5,
  EARLY_WAVE_MAX: 2,
} as const;

export type ShopUpgradeId =
  | "rapid_reload"
  | "extended_mag"
  | "propulsion"
  | "buy_life"
  | "auto_turret"
  | "debris_sweeper"
  | "extended_range"
  | "repair_crews";

export type BatteryType =
  | "IRON_DOME"
  | "DAVIDS_SLING"
  | "ARROW"
  | "IRON_BEAM";

export const BATTERY_DISPLAY_NAME: Record<BatteryType, string> = {
  IRON_DOME: "IRON DOME",
  DAVIDS_SLING: "DAVID'S SLING",
  ARROW: "ARROW",
  IRON_BEAM: "IRON BEAM",
};

export interface BatteryStats {
  cooldownMs: number;
  maxAmmo: number;
}

/** Strategic magazine size for all launcher types */
export const LAUNCHER_MAG_CAPACITY = 20;

export const BATTERY_STATS: Record<BatteryType, BatteryStats> = {
  IRON_DOME: { cooldownMs: 250, maxAmmo: LAUNCHER_MAG_CAPACITY },
  DAVIDS_SLING: { cooldownMs: 120, maxAmmo: LAUNCHER_MAG_CAPACITY },
  ARROW: { cooldownMs: 800, maxAmmo: LAUNCHER_MAG_CAPACITY },
  IRON_BEAM: { cooldownMs: 200, maxAmmo: LAUNCHER_MAG_CAPACITY },
};

export const PROJECTILE_DATA_KEY = {
  BATTERY: "batteryType",
  PIERCING: "piercing",
  HIT_ENEMIES: "arrowHitEnemies",
} as const;

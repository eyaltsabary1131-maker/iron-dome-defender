export type BatteryType = "IRON_DOME" | "DAVIDS_SLING" | "ARROW";

export const BATTERY_DISPLAY_NAME: Record<BatteryType, string> = {
  IRON_DOME: "IRON DOME",
  DAVIDS_SLING: "DAVID'S SLING",
  ARROW: "ARROW",
};

export interface BatteryStats {
  cooldownMs: number;
  maxAmmo: number;
}

export const BATTERY_STATS: Record<BatteryType, BatteryStats> = {
  IRON_DOME: { cooldownMs: 250, maxAmmo: 15 },
  DAVIDS_SLING: { cooldownMs: 120, maxAmmo: 40 },
  ARROW: { cooldownMs: 800, maxAmmo: 5 },
};

export const PROJECTILE_DATA_KEY = {
  BATTERY: "batteryType",
  PIERCING: "piercing",
  HIT_ENEMIES: "arrowHitEnemies",
} as const;

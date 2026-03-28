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
  /** True once this round has damaged any enemy (achievement streak / OOB miss). */
  HIT_FOR_ACH_STREAK: "hitForAchStreak",
} as const;

/** Primary explosion / VFX tint per launcher (matches combat feedback spec). */
export const WEAPON_EXPLOSION_TINT: Record<BatteryType, number> = {
  IRON_DOME: 0x00ff00,
  DAVIDS_SLING: 0x0088ff,
  ARROW: 0xffff00,
  IRON_BEAM: 0xff0000,
};

/** CSS hex for floating banners tied to weapon identity. */
export const WEAPON_VFX_COLOR_HEX: Record<BatteryType, string> = {
  IRON_DOME: "#00ff00",
  DAVIDS_SLING: "#0088ff",
  ARROW: "#ffff00",
  IRON_BEAM: "#ff0000",
};

/** Credits deducted per interceptor / beam pulse fired (pay-per-shot). */
export const INTERCEPTOR_CREDITS_PER_SHOT: Record<BatteryType, number> = {
  IRON_DOME: 5,
  DAVIDS_SLING: 8,
  ARROW: 15,
  IRON_BEAM: 10,
};

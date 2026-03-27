import { GAME_HEIGHT, GAME_WIDTH } from "@/game/config/dimensions";

export type StrategicAssetKey = "power_plant" | "military_base";

/** Hits per asset before destruction */
export const STRATEGIC_ASSET_HP_MAX = 2;

/** Credits when both assets survive the completed wave */
export const PROTECTION_BONUS_CREDITS = 500;

/** Added to base reload time when the military base is lost */
export const MILITARY_BASE_RELOAD_PENALTY_MS = 1500;

/** Blackout: overlay alpha (50% darker) */
export const BLACKOUT_OVERLAY_ALPHA = 0.5;

export const STRATEGIC_ASSETS: Record<
  StrategicAssetKey,
  {
    displayName: string;
    hudDestroyedMessage: string;
    centerX: number;
    halfWidth: number;
    /** World Y for icon / hit probe (strip area) */
    anchorY: number;
  }
> = {
  power_plant: {
    displayName: "POWER PLANT",
    hudDestroyedMessage: "GRID OFFLINE — VISIBILITY REDUCED",
    centerX: Math.round(GAME_WIDTH * 0.22),
    halfWidth: 52,
    anchorY: GAME_HEIGHT - 38,
  },
  military_base: {
    displayName: "MILITARY BASE",
    hudDestroyedMessage: "LOGISTICS DAMAGED — RELOAD +1.5s",
    centerX: Math.round(GAME_WIDTH * 0.78),
    halfWidth: 52,
    anchorY: GAME_HEIGHT - 38,
  },
};

/** Returns which asset zone contains world X, if any (may still be destroyed) */
export function getStrategicAssetKeyAtWorldX(x: number): StrategicAssetKey | null {
  const keys = Object.keys(STRATEGIC_ASSETS) as StrategicAssetKey[];
  for (const key of keys) {
    const def = STRATEGIC_ASSETS[key];
    if (Math.abs(x - def.centerX) <= def.halfWidth) {
      return key;
    }
  }
  return null;
}

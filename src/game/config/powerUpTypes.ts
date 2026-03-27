import type { BatteryType } from "@/game/batteryTypes";

/** Chicken Invaders–style crate colors → launcher families */
export type PowerUpKind = "GREEN" | "BLUE" | "YELLOW" | "RED";

export const MAX_WEAPON_POWER_LEVEL = 5;

export const POWER_UP_TO_BATTERY: Record<PowerUpKind, BatteryType> = {
  GREEN: "IRON_DOME",
  BLUE: "DAVIDS_SLING",
  YELLOW: "ARROW",
  RED: "IRON_BEAM",
};

export const POWER_UP_HEX: Record<PowerUpKind, number> = {
  GREEN: 0x39ff14,
  BLUE: 0x3399ff,
  YELLOW: 0xffdd22,
  RED: 0xff3344,
};

/** CSS colors for HUD / floating text */
export const POWER_UP_DISPLAY_COLOR: Record<PowerUpKind, string> = {
  GREEN: "#39ff14",
  BLUE: "#3399ff",
  YELLOW: "#ffdd22",
  RED: "#ff4466",
};

export const POWER_UP_LABEL: Record<PowerUpKind, string> = {
  GREEN: "IRON DOME",
  BLUE: "SLING",
  YELLOW: "ARROW",
  RED: "IRON BEAM",
};

export function randomPowerUpKind(): PowerUpKind {
  const all: PowerUpKind[] = ["GREEN", "BLUE", "YELLOW", "RED"];
  return all[Math.floor(Math.random() * all.length)]!;
}

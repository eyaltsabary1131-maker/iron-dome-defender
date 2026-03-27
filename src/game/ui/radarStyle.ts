import type * as Phaser from "phaser";

/** Load Share Tech Mono via Next/font on `<body>` so this family resolves in Canvas + DOM */
export const RADAR_FONT_FAMILY = "'Share Tech Mono', 'Consolas', monospace";

export const RADAR_GREEN = "#39ff14";
export const RADAR_AMBER = "#ffbf00";
export const RADAR_DIM = "#6b8f6b";

export function radarTextStyle(
  fontSize: string,
  color: string = RADAR_GREEN,
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: RADAR_FONT_FAMILY,
    fontSize,
    color,
    fontStyle: "bold",
  };
}

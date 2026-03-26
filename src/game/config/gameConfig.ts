import * as Phaser from "phaser";
import { MainScene } from "@/game/scenes/MainScene";

export function createGameConfig(
  _Phaser: typeof Phaser,
): Phaser.Types.Core.GameConfig {
  return {
    type: _Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: "#0b1020",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [MainScene],
  };
}

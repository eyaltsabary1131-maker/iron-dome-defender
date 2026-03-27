import * as Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/game/config/dimensions";
import { MainScene } from "@/game/scenes/MainScene";
import { PreloadScene } from "@/game/scenes/PreloadScene";

export function createGameConfig(
  _Phaser: typeof Phaser,
): Phaser.Types.Core.GameConfig {
  return {
    type: _Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#0b1020",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [PreloadScene, MainScene],
  };
}

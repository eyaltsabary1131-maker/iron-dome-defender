import * as Phaser from "phaser";
import { TextureKeys } from "@/game/assets/textureKeys";
import { GAME_HEIGHT } from "@/game/config/dimensions";
import { BaseEnemy } from "@/game/classes/BaseEnemy";

/**
 * Long-range ballistic: slow parabolic dive (gravity + drift).
 * From wave 2 onward, splits into MIRV sub-munitions around mid-descent.
 */
export class BallisticEnemy extends BaseEnemy {
  private mirvSpawned = false;
  private readonly gameWave: number;
  private readonly onMirv?: (x: number, y: number) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    speedScale = 1,
    gameWave = 1,
    onMirv?: (x: number, y: number) => void,
  ) {
    super(scene, x, y, TextureKeys.enemyBallistic);
    this.speedScale = speedScale;
    this.gameWave = gameWave;
    this.onMirv = onMirv;

    this.setDisplaySize(26, 52);
    this.hp = 6;
    this.scoreValue = 35;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setGravity(0, 88);
    body.setSize(22, 44);
    body.setOffset(5, 8);

    const vx = Phaser.Math.FloatBetween(-42, 42) * speedScale;
    const vy = Phaser.Math.FloatBetween(26, 40) * speedScale;
    body.setVelocity(vx, vy);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    const b = this.body as Phaser.Physics.Arcade.Body;
    this.setRotation(Math.atan2(b.velocity.y, b.velocity.x) + Math.PI / 2);
    this.tryMirvSplit();
  }

  private tryMirvSplit(): void {
    if (this.mirvSpawned || this.gameWave < 2) return;
    if (this.y < GAME_HEIGHT * 0.42 || this.y > GAME_HEIGHT * 0.78) {
      return;
    }
    this.mirvSpawned = true;
    this.onMirv?.(this.x, this.y);
    this.destroy();
  }
}

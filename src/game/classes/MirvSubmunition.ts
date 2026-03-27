import * as Phaser from "phaser";
import { TextureKeys } from "@/game/assets/textureKeys";
import { BaseEnemy } from "@/game/classes/BaseEnemy";

/** MIRV sub-munition after a ballistic splits (wave 10+). */
export class MirvSubmunition extends BaseEnemy {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    speedScale = 1,
  ) {
    super(scene, x, y, TextureKeys.mirvWarhead);
    this.speedScale = speedScale;
    this.setDisplaySize(9, 22);
    this.hp = 1;
    this.scoreValue = 9;
    this.spawnsDebrisOnKill = false;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(8, 18);
    body.setOffset(1, 2);

    const vx = Phaser.Math.FloatBetween(-95, 95) * speedScale;
    const vy = Phaser.Math.FloatBetween(160, 290) * speedScale;
    body.setVelocity(vx, vy);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    const b = this.body as Phaser.Physics.Arcade.Body;
    this.setRotation(Math.atan2(b.velocity.y, b.velocity.x) + Math.PI / 2);
  }
}

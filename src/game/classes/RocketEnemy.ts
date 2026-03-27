import * as Phaser from "phaser";
import { TextureKeys } from "@/game/assets/textureKeys";
import { BaseEnemy } from "@/game/classes/BaseEnemy";

/** Grad-style rocket: very fast, steep downward path, no debris on kill. */
export class RocketEnemy extends BaseEnemy {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    speedScale = 1,
  ) {
    super(scene, x, y, TextureKeys.enemyGrad);
    this.speedScale = speedScale;
    this.setDisplaySize(12, 36);
    this.hp = 1;
    this.speedY = 400;
    this.scoreValue = 8;
    this.spawnsDebrisOnKill = false;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 32);
    body.setOffset(2, 4);
    body.setAllowGravity(false);
    this.setVelocity(0, this.speedY * this.speedScale);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.setRotation(Math.PI);
  }
}

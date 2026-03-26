import * as Phaser from "phaser";
import { BaseEnemy } from "@/game/classes/BaseEnemy";

export class BallisticEnemy extends BaseEnemy {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    speedScale = 1,
  ) {
    super(scene, x, y, "enemy_white");
    this.speedScale = speedScale;
    this.setTint(0x800080);
    this.setScale(1.5);
    this.hp = 6;
    this.speedY = 300;
    this.scoreValue = 35;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(48, 48);
    this.setVelocity(0, this.speedY * this.speedScale);
  }
}

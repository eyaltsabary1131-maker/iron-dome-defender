import * as Phaser from "phaser";
import { BaseEnemy } from "@/game/classes/BaseEnemy";

export class RocketEnemy extends BaseEnemy {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    speedScale = 1,
  ) {
    super(scene, x, y, "enemy_white");
    this.speedScale = speedScale;
    this.setTint(0xe63946);
    this.setDisplaySize(14, 36);
    this.hp = 1;
    this.speedY = 220;
    this.scoreValue = 8;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 36);
    body.setAllowGravity(false);
    this.setVelocity(0, this.speedY * this.speedScale);
  }
}

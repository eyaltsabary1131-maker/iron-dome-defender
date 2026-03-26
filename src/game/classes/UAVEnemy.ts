import * as Phaser from "phaser";
import { BaseEnemy } from "@/game/classes/BaseEnemy";

export class UAVEnemy extends BaseEnemy {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    speedScale = 1,
  ) {
    super(scene, x, y, "enemy_white");
    this.speedScale = speedScale;
    this.setTint(0xff7722);
    this.setDisplaySize(36, 22);
    this.hp = 2;
    this.speedY = 55;
    this.scoreValue = 12;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(36, 22);
    body.setAllowGravity(false);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    const s = this.speedScale;
    const vx =
      Math.sin(time * 0.003) * 40 + Math.cos(time * 0.007) * 20;
    this.setVelocityX(vx * s);
    this.setVelocityY(this.speedY * s);
  }
}

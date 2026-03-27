import * as Phaser from "phaser";
import { TextureKeys } from "@/game/assets/textureKeys";
import { BaseEnemy } from "@/game/classes/BaseEnemy";

/** UAV: slower, erratic lateral drift; debris when shot or when it reaches the city. */
export class UAVEnemy extends BaseEnemy {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    speedScale = 1,
  ) {
    super(scene, x, y, TextureKeys.enemyUav);
    this.speedScale = speedScale;
    this.setDisplaySize(44, 24);
    this.hp = 2;
    this.speedY = 52;
    this.scoreValue = 12;
    this.spawnsDebrisOnKill = true;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(40, 18);
    body.setOffset(4, 5);
    body.setAllowGravity(false);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    const s = this.speedScale;
    const vx =
      Math.sin(time * 0.003) * 48 + Math.cos(time * 0.007) * 26;
    this.setVelocityX(vx * s);
    this.setVelocityY(this.speedY * s);
    const b = this.body as Phaser.Physics.Arcade.Body;
    if (b.speed > 8) {
      this.setRotation(Math.atan2(b.velocity.y, b.velocity.x) + Math.PI / 2);
    }
  }
}

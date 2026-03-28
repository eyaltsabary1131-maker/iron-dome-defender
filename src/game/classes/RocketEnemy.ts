import * as Phaser from "phaser";
import { TextureKeys } from "@/game/assets/textureKeys";
import { BaseEnemy } from "@/game/classes/BaseEnemy";

/** Downward speed in px/s (+Y). */
const ROCKET_DESCENT_SPEED = 240;

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
    this.speedY = ROCKET_DESCENT_SPEED;
    this.scoreValue = 8;
    this.spawnsDebrisOnKill = false;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(10, 32);
    body.setOffset(2, 4);
    body.setCollideWorldBounds(false);
    this.refreshBody();
    this.applyDescentVelocity();
  }

  /** Keep +Y velocity every frame (constructor-only setVelocity can be lost after body sync / group add). */
  private applyDescentVelocity(): void {
    const s = this.speedScale;
    this.setVelocity(0, this.speedY * s);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.applyDescentVelocity();
    this.setRotation(Math.PI);
  }
}

import * as Phaser from "phaser";
import { TextureKeys } from "@/game/assets/textureKeys";
import { BaseEnemy } from "@/game/classes/BaseEnemy";

const MIRV_MIN_VY = 130;

/** MIRV sub-munition after a ballistic splits (wave 10+). */
export class MirvSubmunition extends BaseEnemy {
  private readonly vx0: number;
  private readonly vy0: number;

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
    body.setCollideWorldBounds(false);
    this.refreshBody();

    this.vx0 = Phaser.Math.FloatBetween(-95, 95) * speedScale;
    this.vy0 = Phaser.Math.FloatBetween(180, 300) * speedScale;
    this.applyFallVelocity();
  }

  private applyFallVelocity(): void {
    const s = this.speedScale;
    this.setVelocity(this.vx0, Math.max(this.vy0, MIRV_MIN_VY * s));
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.applyFallVelocity();
    const b = this.body as Phaser.Physics.Arcade.Body;
    this.setRotation(Math.atan2(b.velocity.y, b.velocity.x) + Math.PI / 2);
  }
}

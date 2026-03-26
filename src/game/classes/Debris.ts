import * as Phaser from "phaser";

/** Glowing hot debris — orange / dark orange variants */
const DEBRIS_COLORS = [0xff6600, 0xff8c00, 0xff7722, 0xff9500];

export class Debris extends Phaser.GameObjects.Rectangle {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const w = Phaser.Math.Between(7, 9);
    const h = Phaser.Math.Between(9, 11);
    const color = Phaser.Math.RND.pick(DEBRIS_COLORS);
    super(scene, x, y, w, h, color);
    scene.add.existing(this);
    scene.physics.add.existing(this, false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(false);
    const vx = Phaser.Math.Between(-100, 100);
    const vy = Phaser.Math.Between(230, 280);
    body.setVelocity(vx, vy);
  }
}

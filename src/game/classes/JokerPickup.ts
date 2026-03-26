import * as Phaser from "phaser";

const PICKUP_FALL_SPEED_Y = 200;

/** Collectible that grants +1 Uncle Sam joker charge. */
export class JokerPickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "enemy_white");
    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(false);
    body.setAllowGravity(false);
    body.setVelocityY(PICKUP_FALL_SPEED_Y);

    this.setTint(0xffcc33);
    this.setDisplaySize(22, 22);

    scene.tweens.add({
      targets: this,
      angle: { from: -6, to: 6 },
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  destroy(fromScene?: boolean): void {
    this.scene?.tweens.killTweensOf(this);
    super.destroy(fromScene);
  }
}

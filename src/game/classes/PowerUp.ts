import * as Phaser from "phaser";
import type { BatteryType } from "@/game/batteryTypes";

const PICKUP_FALL_SPEED_Y = 200;

/** Advanced batteries only (Iron Dome is default loadout). */
const ADVANCED_BATTERIES: BatteryType[] = ["DAVIDS_SLING", "ARROW"];

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  public readonly batteryType: BatteryType;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "enemy_white");
    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(false);
    body.setAllowGravity(false);
    body.setVelocityY(PICKUP_FALL_SPEED_Y);

    this.batteryType = Phaser.Math.RND.pick(ADVANCED_BATTERIES);
    if (this.batteryType === "DAVIDS_SLING") {
      this.setTint(0x22dd55);
    } else {
      this.setTint(0x4488ff);
    }

    this.setDisplaySize(18, 18);

    scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 550,
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

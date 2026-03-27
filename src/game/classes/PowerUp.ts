import * as Phaser from "phaser";
import {
  POWER_UP_HEX,
  type PowerUpKind,
} from "@/game/config/powerUpTypes";

const PICKUP_FALL_SPEED_Y = 200;

/** Colored weapon crate: GREEN / BLUE / YELLOW / RED → launcher + combo level */
export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  readonly powerUpKind: PowerUpKind;
  private glowG!: Phaser.GameObjects.Graphics;
  private readonly baseTint: number;
  private readonly tintPulse = { v: 0 };

  constructor(scene: Phaser.Scene, x: number, y: number, kind: PowerUpKind) {
    super(scene, x, y, "enemy_white");
    this.powerUpKind = kind;
    this.baseTint = POWER_UP_HEX[kind];
    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(false);
    body.setAllowGravity(false);
    body.setVelocityY(PICKUP_FALL_SPEED_Y);

    this.setTint(this.baseTint);
    this.setDisplaySize(24, 24);
    this.setDepth(56);

    this.glowG = scene.add.graphics();
    this.glowG.setDepth(55);

    scene.tweens.add({
      targets: this,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    scene.tweens.add({
      targets: this.tintPulse,
      v: 1,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const v = this.tintPulse.v;
        const bright = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(this.baseTint),
          Phaser.Display.Color.ValueToColor(0xffffff),
          100,
          Math.round(v * 100),
        );
        this.setTint(
          Phaser.Display.Color.GetColor(bright.r, bright.g, bright.b),
        );
      },
    });
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.angle += 2;
    const t = time * 0.0035;
    const pulse = 0.28 + 0.22 * Math.sin(t);
    const r = 18 + 5 * Math.sin(t * 1.07);
    this.glowG.clear();
    this.glowG.lineStyle(2, this.baseTint, pulse * 0.55);
    this.glowG.strokeCircle(this.x, this.y, r);
    this.glowG.lineStyle(1, 0xffffff, pulse * 0.2);
    this.glowG.strokeCircle(this.x, this.y, r + 3);
  }

  destroy(fromScene?: boolean): void {
    this.scene?.tweens.killTweensOf([this, this.tintPulse]);
    this.glowG?.destroy();
    super.destroy(fromScene);
  }
}

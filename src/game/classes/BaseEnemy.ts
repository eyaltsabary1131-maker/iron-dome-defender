import * as Phaser from "phaser";

export class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
  protected hp = 1;
  public speedY = 100;
  public scoreValue = 10;
  /** Wave / endless scaling */
  public speedScale = 1;
  /** Rockets / MIRV fragments: no falling debris when shot down */
  public spawnsDebrisOnKill = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame?: string | number,
  ) {
    super(scene, x, y, texture, frame);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }
}

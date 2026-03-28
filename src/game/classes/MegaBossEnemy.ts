import * as Phaser from "phaser";
import { TextureKeys } from "@/game/assets/textureKeys";
import { BaseEnemy } from "@/game/classes/BaseEnemy";

export type MegaBossSpawnRocketsFn = (x: number, y: number) => void;

const ROCKET_INTERVAL_MS = 2500;

/**
 * Slow aerial boss: patrols horizontally while descending; periodically drops Grad salvos.
 * Does not self-destruct on lethal damage — MainScene runs the defeat chain.
 */
export class MegaBossEnemy extends BaseEnemy {
  readonly bossMaxHp: number;
  private rocketTimer?: Phaser.Time.TimerEvent;
  private readonly spawnRocketsFn: MegaBossSpawnRocketsFn;
  private behaviorsStopped = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    wave: number,
    speedScale: number,
    spawnRocketsFn: MegaBossSpawnRocketsFn,
  ) {
    super(scene, x, y, TextureKeys.enemyUav);
    this.spawnRocketsFn = spawnRocketsFn;
    this.bossMaxHp = 100 + wave * 5;
    this.hp = this.bossMaxHp;
    this.speedScale = speedScale;
    this.speedY = 22;
    this.scoreValue = 0;
    this.spawnsDebrisOnKill = false;

    this.setDisplaySize(132, 72);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(120, 56);
    body.setOffset(6, 10);
    body.setAllowGravity(false);
    this.setDepth(55);

    this.rocketTimer = scene.time.addEvent({
      delay: ROCKET_INTERVAL_MS,
      loop: true,
      callback: () => {
        if (!this.active || this.behaviorsStopped || this.hp <= 0) return;
        this.spawnRocketsFn(this.x, this.y + this.displayHeight * 0.42);
      },
    });
  }

  /** Lethal hit returns true without destroying the sprite (scene handles finale). */
  override takeDamage(amount: number): boolean {
    if (this.hp <= 0) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      return true;
    }
    return false;
  }

  getBossHp(): number {
    return this.hp;
  }

  stopBossBehaviors(): void {
    if (this.behaviorsStopped) return;
    this.behaviorsStopped = true;
    this.rocketTimer?.remove();
    this.rocketTimer = undefined;
    const b = this.body as Phaser.Physics.Arcade.Body;
    if (b) {
      b.setVelocity(0, 0);
      b.setEnable(false);
    }
  }

  override preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.behaviorsStopped || this.hp <= 0) return;
    const t = time * 0.0011;
    const vx = Math.sin(t) * 72 * this.speedScale;
    const vy = 20 * this.speedScale;
    this.setVelocity(vx, vy);
    const pulse = 0.68 + Math.sin(time * 0.0048) * 0.32;
    const g = Math.floor(70 + 110 * (1 - pulse));
    const b = Math.floor(75 + 100 * (1 - pulse));
    this.setTint(Phaser.Display.Color.GetColor(255, g, b));
  }

  override destroy(fromScene?: boolean): void {
    this.rocketTimer?.remove();
    this.rocketTimer = undefined;
    super.destroy(fromScene);
  }
}

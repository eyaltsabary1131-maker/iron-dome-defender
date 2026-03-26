import * as Phaser from "phaser";
import { BaseEnemy } from "@/game/classes/BaseEnemy";

const ENTRY_Y = 150;
const ENTRY_SPEED = 55;
const BASE_ROCKET_INTERVAL_MS = 1500;
const MIN_ROCKET_INTERVAL_MS = 600;
const BASE_MAX_HP = 150;

function bossTintForTier(tier: number): number {
  if (tier <= 0) return 0x8b0000;
  if (tier === 1) return 0x551a8b;
  return 0x0a0a0a;
}

function titleColorForTier(tier: number): string {
  if (tier <= 0) return "#ffcccc";
  if (tier === 1) return "#e0c8ff";
  return "#ff6666";
}

export class BossEnemy extends BaseEnemy {
  private phase: 1 | 2 = 1;
  private readonly hpBar: Phaser.GameObjects.Graphics;
  private readonly titleLabel: Phaser.GameObjects.Text;
  private readonly maxHp: number;
  private readonly tier: number;
  private readonly rocketIntervalMs: number;
  private lastRocketTime = 0;
  private readonly onRocketBurst: (x: number, y: number) => void;
  private readonly outlineG?: Phaser.GameObjects.Graphics;
  private driftTween?: Phaser.Tweens.Tween;
  private driftRestTimer?: Phaser.Time.TimerEvent;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    onRocketBurst: (x: number, y: number) => void,
    tier: number,
  ) {
    super(scene, x, y, "enemy_white");
    this.onRocketBurst = onRocketBurst;
    this.tier = Math.max(0, tier);

    this.maxHp = Math.round(BASE_MAX_HP * Math.pow(1.5, this.tier));
    this.hp = this.maxHp;
    this.scoreValue = 1000;
    this.speedY = ENTRY_SPEED;

    this.rocketIntervalMs = Math.max(
      MIN_ROCKET_INTERVAL_MS,
      Math.round(BASE_ROCKET_INTERVAL_MS * Math.pow(0.88, this.tier)),
    );

    this.setTint(bossTintForTier(this.tier));
    this.setDisplaySize(48, 48);
    this.setScale(3);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(144, 144);

    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(120);

    this.titleLabel = scene.add.text(x, y - 92, "QUDS FORCE COMMANDER", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      color: titleColorForTier(this.tier),
      fontStyle: "bold",
    });
    this.titleLabel.setOrigin(0.5);
    this.titleLabel.setDepth(119);

    if (this.tier >= 2) {
      this.outlineG = scene.add.graphics();
      this.outlineG.setDepth(118);
    }
  }

  private queueNextDrift(): void {
    if (!this.scene || !this.active || this.phase !== 2) return;
    const targetX = Phaser.Math.Between(150, 650);
    const duration = Phaser.Math.Between(1800, 3200);
    this.driftTween?.stop();
    this.driftTween = this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration,
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (!this.active || this.phase !== 2 || !this.scene) return;
        this.driftRestTimer?.remove();
        this.driftRestTimer = this.scene.time.delayedCall(
          Phaser.Math.Between(100, 400),
          () => {
            this.driftRestTimer = undefined;
            if (this.active && this.phase === 2) {
              this.queueNextDrift();
            }
          },
        );
      },
    });
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (this.phase === 1) {
      if (this.y < ENTRY_Y) {
        this.setVelocity(0, this.speedY);
      } else {
        this.phase = 2;
        this.setY(ENTRY_Y);
        this.setVelocity(0, 0);
        this.lastRocketTime = time;
        this.queueNextDrift();
      }
    } else {
      this.setVelocity(0, 0);

      if (time - this.lastRocketTime >= this.rocketIntervalMs) {
        this.lastRocketTime = time;
        this.onRocketBurst(this.x, this.y + 52);
      }
    }

    this.titleLabel.setPosition(this.x, this.y - 92);
    if (this.outlineG) {
      this.outlineG.clear();
      this.outlineG.lineStyle(3, 0xff2222, 0.92);
      this.outlineG.strokeRect(this.x - 72, this.y - 72, 144, 144);
    }
    this.drawHealthBar();
  }

  private drawHealthBar(): void {
    const barW = 120;
    const barH = 8;
    const ratio = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    const bx = this.x - barW / 2;
    const by = this.y - 72;

    this.hpBar.clear();
    this.hpBar.fillStyle(0x220000, 1);
    this.hpBar.fillRect(bx, by, barW, barH);
    this.hpBar.fillStyle(0x33ff66, 1);
    this.hpBar.fillRect(bx, by, barW * ratio, barH);
    this.hpBar.lineStyle(2, 0xffffff, 0.85);
    this.hpBar.strokeRect(bx, by, barW, barH);
  }

  destroy(fromScene?: boolean): void {
    this.driftTween?.stop();
    this.driftRestTimer?.remove();
    this.scene?.tweens.killTweensOf(this);
    this.hpBar.destroy();
    this.titleLabel.destroy();
    this.outlineG?.destroy();
    super.destroy(fromScene);
  }
}

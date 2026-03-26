import * as Phaser from "phaser";
import {
  BATTERY_DISPLAY_NAME,
  BATTERY_STATS,
  type BatteryType,
  PROJECTILE_DATA_KEY,
} from "@/game/batteryTypes";
import { BallisticEnemy } from "@/game/classes/BallisticEnemy";
import { BaseEnemy } from "@/game/classes/BaseEnemy";
import { BossEnemy } from "@/game/classes/BossEnemy";
import { Debris } from "@/game/classes/Debris";
import { JokerPickup } from "@/game/classes/JokerPickup";
import { PowerUp } from "@/game/classes/PowerUp";
import { RocketEnemy } from "@/game/classes/RocketEnemy";
import { UAVEnemy } from "@/game/classes/UAVEnemy";
import {
  isBossWave,
  WAVE_CONFIGS,
  WAVE_COUNT,
} from "@/game/waveConfig";
import {
  emitAmmoUpdated,
  emitCityHit,
  emitGameOver,
  emitJokersUpdated,
  emitScoreUpdated,
  emitWaveChanged,
  emitWeaponUpgraded,
  subscribeGameReset,
  subscribeRequestUseJoker,
} from "@/game/events/gameEvents";
import {
  initAudio,
  playBossWarning,
  playExplosion,
  playJokerNuke,
  playPowerUp,
  playShoot,
  playWaveAlert,
} from "@/game/utils/SynthAudio";

const WIDTH = 800;
const HEIGHT = 600;
const PLAYER_HALF_W = 22;
const RELOAD_MS = 2000;
/** Standard interceptor (Iron Dome). */
const PROJECTILE_SPEED_IRON = -600;
const PROJECTILE_SPEED_SLING = -750;
const PROJECTILE_SPEED_ARROW = -320;

const MIN_SPAWN_DELAY_MS = 400;
/** Arrow damage per hit vs boss (no 999 instakill). */
const ARROW_BOSS_DAMAGE = 12;

const POWERUP_CHANCE_BALLISTIC = 0.3;
const POWERUP_CHANCE_OTHER = 0.05;

export class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Triangle;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  private projectiles!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private powerUps!: Phaser.Physics.Arcade.Group;
  private jokerPickups!: Phaser.Physics.Arcade.Group;
  private debris!: Phaser.Physics.Arcade.Group;

  private explosionEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private reloadingLabel!: Phaser.GameObjects.Text;

  private score = 0;
  private cityIntegrity = 3;
  private batteryType: BatteryType = "IRON_DOME";
  private gameOver = false;

  private currentWave = 1;
  private waveKillCount = 0;
  private currentSpawnDelayMs = 2000;

  private spawnTimer?: Phaser.Time.TimerEvent;
  private unsubscribeReset?: () => void;

  private lastFiredTime = -100000;
  private readonly pointerLerp = 0.18;

  private currentAmmo = BATTERY_STATS.IRON_DOME.maxAmmo;
  private maxAmmo = BATTERY_STATS.IRON_DOME.maxAmmo;
  private isReloading = false;
  private reloadTimer?: Phaser.Time.TimerEvent;

  private jokers = 1;
  private bossFightActive = false;
  private bKey!: Phaser.Input.Keyboard.Key;
  private unsubscribeJoker?: () => void;
  private pointerDownHandler?: (p: Phaser.Input.Pointer) => void;

  private bg!: Phaser.GameObjects.TileSprite;

  constructor() {
    super({ key: "MainScene" });
  }

  preload(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 32, 32);
    g.generateTexture("enemy_white", 32, 32);
    g.destroy();

    const tw = 512;
    const th = 512;
    const bg = this.make.graphics({ x: 0, y: 0 });
    bg.fillStyle(0x0a1028);
    bg.fillRect(0, 0, tw, th);
    bg.lineStyle(1, 0x1a2a4a, 0.4);
    for (let x = 0; x <= tw; x += 40) {
      bg.lineBetween(x, 0, x, th);
    }
    for (let y = 0; y <= th; y += 40) {
      bg.lineBetween(0, y, tw, y);
    }
    for (let i = 0; i < 160; i++) {
      const a = Phaser.Math.FloatBetween(0.15, 0.95);
      bg.fillStyle(0xffffff, a);
      bg.fillCircle(
        Phaser.Math.Between(2, tw - 2),
        Phaser.Math.Between(2, th - 2),
        Phaser.Math.FloatBetween(0.4, 1.6),
      );
    }
    bg.generateTexture("bg_stars", tw, th);
    bg.destroy();
  }

  create(): void {
    emitScoreUpdated(0);
    emitCityHit(3);
    emitWeaponUpgraded({
      batteryName: BATTERY_DISPLAY_NAME.IRON_DOME,
      batteryType: "IRON_DOME",
    });
    emitWaveChanged(1);
    emitJokersUpdated(1);

    this.gameOver = false;
    this.score = 0;
    this.cityIntegrity = 3;
    this.batteryType = "IRON_DOME";
    this.maxAmmo = BATTERY_STATS.IRON_DOME.maxAmmo;
    this.currentWave = 1;
    this.waveKillCount = 0;
    this.jokers = 1;
    this.bossFightActive = false;

    this.reloadTimer?.remove();
    this.reloadTimer = undefined;
    this.currentAmmo = this.maxAmmo;
    this.isReloading = false;

    this.bg = this.add.tileSprite(0, 0, WIDTH, HEIGHT, "bg_stars");
    this.bg.setOrigin(0, 0);
    this.bg.setScrollFactor(0);
    this.bg.setDepth(-20);

    const { config, spawnDelayFactor } = this.getEffectiveWaveConfig();
    this.currentSpawnDelayMs = Math.max(
      MIN_SPAWN_DELAY_MS,
      config.spawnDelayMs / spawnDelayFactor,
    );

    this.player = this.add.triangle(
      WIDTH / 2,
      HEIGHT - 48,
      0,
      -22,
      -20,
      22,
      20,
      22,
      0x2b7fff,
    );
    this.physics.add.existing(this.player);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setImmovable(true);
    playerBody.setSize(44, 44);
    playerBody.setOffset(-22, -22);

    this.spaceKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    this.bKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);

    this.projectiles = this.physics.add.group();

    this.enemies = this.physics.add.group();

    this.powerUps = this.physics.add.group();

    this.jokerPickups = this.physics.add.group();

    this.debris = this.physics.add.group();

    this.reloadingLabel = this.add.text(0, 0, "RELOADING...", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      color: "#ffaa44",
      fontStyle: "bold",
    });
    this.reloadingLabel.setOrigin(0.5);
    this.reloadingLabel.setDepth(60);
    this.reloadingLabel.setVisible(false);

    this.explosionEmitter = this.add.particles(0, 0, "enemy_white", {
      speed: { min: 70, max: 210 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.55, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 420,
      tint: [0xff7722, 0xff3333, 0xffaa55],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    this.explosionEmitter.setDepth(100);

    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      this.onProjectileHitEnemy,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.powerUps,
      this.onPlayerCollectPowerUp,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.debris,
      this.onDebrisHitPlayer,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.jokerPickups,
      this.onPlayerCollectJokerPickup,
      undefined,
      this,
    );

    this.pointerDownHandler = (p: Phaser.Input.Pointer) => {
      if (this.gameOver) return;
      if (p.rightButtonDown()) {
        this.useJoker();
      }
    };
    this.input.on("pointerdown", this.pointerDownHandler);

    this.unsubscribeJoker = subscribeRequestUseJoker(() => {
      this.useJoker();
    });

    this.restartSpawnTimer();

    this.spawnEnemy();

    this.physics.resume();

    this.emitAmmoState();

    this.unsubscribeReset = subscribeGameReset(() => {
      this.scene.restart();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.pointerDownHandler) {
        this.input.off("pointerdown", this.pointerDownHandler);
      }
      this.reloadTimer?.remove();
      this.reloadTimer = undefined;
      this.unsubscribeJoker?.();
      this.unsubscribeJoker = undefined;
      this.unsubscribeReset?.();
      this.unsubscribeReset = undefined;
    });
  }

  update(): void {
    if (!this.gameOver) {
      this.bg.tilePositionY -= 1;
    }

    if (this.gameOver) {
      return;
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    const pointer = this.input.activePointer;
    const targetX = Phaser.Math.Clamp(
      pointer.x,
      PLAYER_HALF_W,
      WIDTH - PLAYER_HALF_W,
    );
    this.player.x = Phaser.Math.Clamp(
      Phaser.Math.Linear(this.player.x, targetX, this.pointerLerp),
      PLAYER_HALF_W,
      WIDTH - PLAYER_HALF_W,
    );

    if (pointer.isDown) {
      this.tryFireProjectiles();
    }
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.tryFireProjectiles();
    }
    if (Phaser.Input.Keyboard.JustDown(this.bKey)) {
      this.useJoker();
    }

    if (this.isReloading) {
      this.reloadingLabel.setVisible(true);
      this.reloadingLabel.setPosition(this.player.x, this.player.y - 52);
    } else {
      this.reloadingLabel.setVisible(false);
    }

    this.projectiles.children.iterate((child) => {
      if (!child) return true;
      const rect = child as Phaser.GameObjects.Rectangle;
      if (!rect.active) return true;
      const topBound = rect.getData(PROJECTILE_DATA_KEY.PIERCING) ? -140 : -40;
      if (rect.y < topBound) {
        rect.destroy();
      }
      return true;
    });

    this.powerUps.children.iterate((child) => {
      if (!child) return true;
      const pu = child as PowerUp;
      if (!pu.active) return true;
      if (pu.y > HEIGHT + 40) {
        pu.destroy();
      }
      return true;
    });

    this.enemies.children.iterate((child) => {
      if (!child) return true;
      const enemy = child as BaseEnemy;
      if (!enemy.active) return true;
      if (enemy instanceof BossEnemy) {
        return true;
      }
      const eBody = enemy.body as Phaser.Physics.Arcade.Body;
      if (eBody.bottom >= HEIGHT) {
        this.onEnemyReachedBottom(enemy);
      }
      return true;
    });

    this.jokerPickups.children.iterate((child) => {
      if (!child) return true;
      const jp = child as JokerPickup;
      if (!jp.active) return true;
      if (jp.y > HEIGHT + 48) {
        jp.destroy();
      }
      return true;
    });

    this.debris.children.iterate((child) => {
      if (!child) return true;
      const piece = child as Debris;
      if (!piece.active) return true;
      if (piece.y > HEIGHT + 48) {
        piece.destroy();
      }
      return true;
    });
  }

  private showFloatingText(
    x: number,
    y: number,
    message: string,
    color: string,
  ): void {
    const t = this.add.text(x, y, message, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      color,
      fontStyle: "bold",
      stroke: "#0a0a12",
      strokeThickness: 4,
    });
    t.setOrigin(0.5);
    t.setDepth(200);
    this.tweens.add({
      targets: t,
      y: y - 44,
      alpha: 0,
      duration: 800,
      ease: "Sine.easeOut",
      onComplete: () => {
        t.destroy();
      },
    });
  }

  private emitAmmoState(): void {
    emitAmmoUpdated({
      currentAmmo: this.currentAmmo,
      maxAmmo: this.maxAmmo,
      isReloading: this.isReloading,
    });
  }

  private startReload(): void {
    if (this.isReloading) return;
    this.isReloading = true;
    this.reloadTimer?.remove();
    this.reloadTimer = this.time.delayedCall(RELOAD_MS, () => {
      this.currentAmmo = this.maxAmmo;
      this.isReloading = false;
      this.reloadTimer = undefined;
      this.emitAmmoState();
    });
    this.emitAmmoState();
  }

  private applyBatterySwitch(next: BatteryType): void {
    this.reloadTimer?.remove();
    this.reloadTimer = undefined;
    this.isReloading = false;
    this.batteryType = next;
    const stats = BATTERY_STATS[next];
    this.maxAmmo = stats.maxAmmo;
    this.currentAmmo = stats.maxAmmo;
    this.emitAmmoState();
    emitWeaponUpgraded({
      batteryName: BATTERY_DISPLAY_NAME[next],
      batteryType: next,
    });
  }

  private getEffectiveWaveConfig(): {
    config: (typeof WAVE_CONFIGS)[number];
    enemySpeedScale: number;
    spawnDelayFactor: number;
  } {
    const waveIdx = (this.currentWave - 1) % WAVE_COUNT;
    const config = WAVE_CONFIGS[waveIdx];
    const endlessTier = Math.max(0, this.currentWave - WAVE_COUNT);
    const spawnDelayFactor = 1 + endlessTier * 0.08;
    const speedTierMult = 1 + endlessTier * 0.05;
    return {
      config,
      enemySpeedScale: config.speedScale * speedTierMult,
      spawnDelayFactor,
    };
  }

  private spawnDebrisBurst(x: number, y: number): void {
    let minD = 0;
    let maxD = 1;
    if (this.currentWave >= 6) {
      minD = 2;
      maxD = 3;
    } else if (this.currentWave >= 3) {
      minD = 1;
      maxD = 2;
    }
    const count = Phaser.Math.Between(minD, maxD);
    for (let i = 0; i < count; i++) {
      const dx = Phaser.Math.Between(-10, 10);
      const dy = Phaser.Math.Between(-10, 10);
      const piece = new Debris(this, x + dx, y + dy);
      this.debris.add(piece);
      const body = piece.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        Phaser.Math.Between(-100, 100),
        Phaser.Math.Between(230, 280),
      );
    }
  }

  private onDebrisHitPlayer(
    object1:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
    object2:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
  ): void {
    if (this.gameOver) return;

    const a = this.resolveOverlapObject(object1);
    const b = this.resolveOverlapObject(object2);
    const debris = a instanceof Debris ? a : b instanceof Debris ? b : null;
    if (!debris) return;

    debris.destroy();
    this.cameras.main.shake(140, 0.004);
    this.enterGameOver();
    this.player.destroy();
  }

  private triggerExplosion(x: number, y: number): void {
    playExplosion();
    this.explosionEmitter.explode(28, x, y);
  }

  private enterGameOver(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.reloadingLabel.setVisible(false);
    this.spawnTimer?.remove();
    this.spawnTimer = undefined;
    this.physics.pause();
    emitGameOver();
  }

  private onEnemyReachedBottom(enemy: BaseEnemy): void {
    const x = enemy.x;
    const y = enemy.y;
    this.triggerExplosion(x, y);
    enemy.destroy();
    this.cityIntegrity = Math.max(0, this.cityIntegrity - 1);
    emitCityHit(this.cityIntegrity);
    if (this.cityIntegrity === 0) {
      this.enterGameOver();
    }
  }

  private spawnIronProjectile(x: number, y: number, vx: number): void {
    if (this.gameOver || this.currentAmmo <= 0) return;

    this.currentAmmo -= 1;
    this.emitAmmoState();

    const rect = this.add.rectangle(x, y, 6, 15, 0xffff00);
    this.physics.add.existing(rect);
    this.projectiles.add(rect);
    const body = rect.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityY(PROJECTILE_SPEED_IRON);
    body.setVelocityX(vx);
    rect.setData(PROJECTILE_DATA_KEY.BATTERY, "IRON_DOME");
    rect.setData(PROJECTILE_DATA_KEY.PIERCING, false);
  }

  private spawnSlingProjectile(x: number, y: number, vx: number): void {
    if (this.gameOver || this.currentAmmo <= 0) return;

    this.currentAmmo -= 1;
    this.emitAmmoState();

    const rect = this.add.rectangle(x, y, 4, 8, 0xccff66);
    this.physics.add.existing(rect);
    this.projectiles.add(rect);
    const body = rect.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(vx, PROJECTILE_SPEED_SLING);
    rect.setData(PROJECTILE_DATA_KEY.BATTERY, "DAVIDS_SLING");
    rect.setData(PROJECTILE_DATA_KEY.PIERCING, false);
  }

  private spawnArrowProjectile(x: number, y: number): void {
    if (this.gameOver || this.currentAmmo <= 0) return;

    this.currentAmmo -= 1;
    this.emitAmmoState();

    const rect = this.add.rectangle(x, y, 14, 40, 0x66aaff);
    this.physics.add.existing(rect);
    this.projectiles.add(rect);
    const body = rect.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocity(0, PROJECTILE_SPEED_ARROW);
    rect.setData(PROJECTILE_DATA_KEY.BATTERY, "ARROW");
    rect.setData(PROJECTILE_DATA_KEY.PIERCING, true);
    rect.setData(PROJECTILE_DATA_KEY.HIT_ENEMIES, new Set<BaseEnemy>());
  }

  private tryFireProjectiles(): void {
    if (this.gameOver) return;
    if (this.isReloading || this.currentAmmo <= 0) return;
    const cooldown = BATTERY_STATS[this.batteryType].cooldownMs;
    if (this.time.now - this.lastFiredTime < cooldown) return;
    this.lastFiredTime = this.time.now;
    void initAudio();
    playShoot();
    this.spawnWeaponVolley();
  }

  private spawnWeaponVolley(): void {
    const px = this.player.x;
    const py = this.player.y - 28;
    const t = this.batteryType;

    if (t === "IRON_DOME") {
      if (Phaser.Math.Between(1, 2) === 2) {
        this.spawnIronProjectile(px - 8, py, 0);
        this.spawnIronProjectile(px + 8, py, 0);
      } else {
        this.spawnIronProjectile(px, py, 0);
      }
    } else if (t === "DAVIDS_SLING") {
      for (let i = 0; i < 3; i++) {
        const dx = Phaser.Math.Between(-5, 5);
        const vx = Phaser.Math.Between(-48, 48);
        this.spawnSlingProjectile(px + dx, py, vx);
      }
    } else {
      this.spawnArrowProjectile(px, py);
    }

    if (this.currentAmmo === 0) {
      this.startReload();
    }
  }

  private flashPlayerUpgrade(): void {
    this.tweens.add({
      targets: this.player,
      alpha: { from: 1, to: 0.35 },
      duration: 70,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeInOut",
    });
  }

  private maybeSpawnPowerUp(
    wasBallistic: boolean,
    x: number,
    y: number,
  ): void {
    const chance = wasBallistic
      ? POWERUP_CHANCE_BALLISTIC
      : POWERUP_CHANCE_OTHER;
    if (Math.random() >= chance) return;
    const pu = new PowerUp(this, x, y);
    this.powerUps.add(pu);
    const powerBody = pu.body as Phaser.Physics.Arcade.Body;
    if (powerBody) {
      powerBody.setVelocityY(200);
    }
  }

  private onPlayerCollectPowerUp(
    object1:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
    object2:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
  ): void {
    if (this.gameOver) return;

    const a = this.resolveOverlapObject(object1);
    const b = this.resolveOverlapObject(object2);

    const powerUp = a instanceof PowerUp ? a : b instanceof PowerUp ? b : null;
    if (!powerUp) return;

    powerUp.destroy();
    playPowerUp();

    this.applyBatterySwitch(powerUp.batteryType);
    this.flashPlayerUpgrade();
    this.showFloatingText(
      this.player.x,
      this.player.y - 44,
      "+POWER UP!",
      "#33ff88",
    );
  }

  private pickEnemyType(weights: {
    ballistic: number;
    uav: number;
    rocket: number;
  }): "ballistic" | "uav" | "rocket" {
    const roll = Math.random();
    if (roll < weights.ballistic) return "ballistic";
    if (roll < weights.ballistic + weights.uav) return "uav";
    return "rocket";
  }

  private createEnemyOfType(
    type: "ballistic" | "uav" | "rocket",
    x: number,
    y: number,
    speedScale: number,
  ): BaseEnemy {
    if (type === "ballistic") return new BallisticEnemy(this, x, y, speedScale);
    if (type === "uav") return new UAVEnemy(this, x, y, speedScale);
    return new RocketEnemy(this, x, y, speedScale);
  }

  private restartSpawnTimer(): void {
    this.spawnTimer?.remove();
    this.spawnTimer = this.time.addEvent({
      delay: this.currentSpawnDelayMs,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });
  }

  private advanceWave(): void {
    this.currentWave += 1;
    emitWaveChanged(this.currentWave);
    const { config, spawnDelayFactor } = this.getEffectiveWaveConfig();
    this.currentSpawnDelayMs = Math.max(
      MIN_SPAWN_DELAY_MS,
      config.spawnDelayMs / spawnDelayFactor,
    );
    if (isBossWave(this.currentWave)) {
      this.beginBossEncounter();
    } else {
      playWaveAlert();
      this.restartSpawnTimer();
    }
  }

  private beginBossEncounter(): void {
    this.spawnTimer?.remove();
    this.spawnTimer = undefined;
    this.bossFightActive = true;
    void initAudio();
    playBossWarning();
    this.time.delayedCall(2800, () => {
      if (this.gameOver || !this.bossFightActive) return;
      const bossTier = Math.floor(this.currentWave / 5) - 1;
      const boss = new BossEnemy(
        this,
        WIDTH / 2,
        -160,
        (bx, by) => {
          this.spawnBossRockets(bx, by);
        },
        bossTier,
      );
      this.enemies.add(boss);
      this.cameras.main.shake(500, 0.01);
    });
  }

  private spawnBossRockets(x: number, y: number): void {
    if (this.gameOver) return;
    const offsets = [-40, 0, 40];
    for (const dx of offsets) {
      const r = new RocketEnemy(this, x + dx, y, 1);
      this.enemies.add(r);
    }
  }

  private spawnJokerPickupAt(x: number, y: number): void {
    const pu = new JokerPickup(this, x, y);
    this.jokerPickups.add(pu);
    const jokerBody = pu.body as Phaser.Physics.Arcade.Body;
    if (jokerBody) {
      jokerBody.setVelocityY(200);
    }
  }

  private onBossDefeated(x: number, y: number): void {
    this.spawnJokerPickupAt(x, y);
    this.bossFightActive = false;
    this.advanceWave();
  }

  private useJoker(): void {
    if (this.gameOver || this.jokers <= 0) return;
    this.jokers -= 1;
    emitJokersUpdated(this.jokers);
    void initAudio();
    playJokerNuke();
    this.cameras.main.flash(600, 255, 255, 255);
    this.cameras.main.shake(800, 0.03);

    let bossEliminated = false;
    const enemyList = [...this.enemies.getChildren()] as BaseEnemy[];
    for (const enemy of enemyList) {
      if (!enemy.active) continue;
      const ex = enemy.x;
      const ey = enemy.y;
      const pts = enemy.scoreValue;
      this.triggerExplosion(ex, ey);
      this.score += pts;
      if (enemy instanceof BossEnemy) {
        bossEliminated = true;
        this.bossFightActive = false;
        this.spawnJokerPickupAt(ex, ey);
      }
      enemy.destroy();
    }
    if (bossEliminated) {
      this.advanceWave();
    }

    const projs = [...this.projectiles.getChildren()];
    for (const p of projs) {
      (p as Phaser.GameObjects.Rectangle).destroy();
    }

    const debrisList = [...this.debris.getChildren()];
    for (const d of debrisList) {
      (d as Debris).destroy();
    }

    emitScoreUpdated(this.score);
  }

  private onPlayerCollectJokerPickup(
    object1:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
    object2:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
  ): void {
    if (this.gameOver) return;

    const a = this.resolveOverlapObject(object1);
    const b = this.resolveOverlapObject(object2);
    const pickup = a instanceof JokerPickup ? a : b instanceof JokerPickup ? b : null;
    if (!pickup) return;

    pickup.destroy();
    playPowerUp();
    this.jokers += 1;
    emitJokersUpdated(this.jokers);
    this.showFloatingText(
      this.player.x,
      this.player.y - 44,
      "+JOKER CHARGE!",
      "#ffcc33",
    );
  }

  private spawnEnemy(): void {
    if (this.gameOver) return;
    if (this.bossFightActive) return;
    const { config, enemySpeedScale } = this.getEffectiveWaveConfig();
    const margin = 48;

    if (config.swarm) {
      const n = Phaser.Math.Between(
        config.swarmCountMin ?? 2,
        config.swarmCountMax ?? 3,
      );
      for (let i = 0; i < n; i++) {
        const x = Phaser.Math.Between(margin, WIDTH - margin);
        const enemy = new UAVEnemy(this, x, -48 - i * 20, enemySpeedScale);
        this.enemies.add(enemy);
      }
      return;
    }

    const x = Phaser.Math.Between(margin, WIDTH - margin);
    const y = -48;
    const kind = this.pickEnemyType(config.weights);
    const enemy = this.createEnemyOfType(kind, x, y, enemySpeedScale);
    this.enemies.add(enemy);
  }

  private onProjectileHitEnemy(
    object1: Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
    object2: Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
  ): void {
    if (this.gameOver) return;

    const a = this.resolveOverlapObject(object1);
    const b = this.resolveOverlapObject(object2);

    const projectile = this.projectiles.contains(a)
      ? a
      : this.projectiles.contains(b)
        ? b
        : null;
    const enemy = a instanceof BaseEnemy ? a : b instanceof BaseEnemy ? b : null;

    if (
      !projectile ||
      !enemy ||
      !(projectile instanceof Phaser.GameObjects.Rectangle)
    ) {
      return;
    }

    const points = enemy.scoreValue;
    const ex = enemy.x;
    const ey = enemy.y;
    const wasBallistic = enemy instanceof BallisticEnemy;
    const wasBoss = enemy instanceof BossEnemy;

    const piercing = Boolean(
      projectile.getData(PROJECTILE_DATA_KEY.PIERCING),
    );

    if (piercing && wasBoss) {
      projectile.destroy();
      this.showFloatingText(ex, ey - 28, `-${ARROW_BOSS_DAMAGE}`, "#ff4444");
      const killed = enemy.takeDamage(ARROW_BOSS_DAMAGE);
      if (killed) {
        this.triggerExplosion(ex, ey);
        this.spawnDebrisBurst(ex, ey);
        this.score += points;
        emitScoreUpdated(this.score);
        this.onBossDefeated(ex, ey);
      }
      return;
    }

    if (piercing) {
      let hitSet = projectile.getData(
        PROJECTILE_DATA_KEY.HIT_ENEMIES,
      ) as Set<BaseEnemy> | undefined;
      if (!hitSet) {
        hitSet = new Set<BaseEnemy>();
        projectile.setData(PROJECTILE_DATA_KEY.HIT_ENEMIES, hitSet);
      }
      if (hitSet.has(enemy)) {
        return;
      }
      hitSet.add(enemy);
    } else {
      projectile.destroy();
    }

    const damage = piercing ? 999 : 1;
    const killed = enemy.takeDamage(damage);
    if (killed) {
      this.triggerExplosion(ex, ey);
      this.spawnDebrisBurst(ex, ey);
      this.score += points;
      emitScoreUpdated(this.score);
      if (wasBoss) {
        this.onBossDefeated(ex, ey);
        return;
      }
      this.maybeSpawnPowerUp(wasBallistic, ex, ey);
      if (!this.bossFightActive) {
        this.waveKillCount += 1;
        const { config } = this.getEffectiveWaveConfig();
        if (this.waveKillCount >= config.targetKills) {
          this.waveKillCount = 0;
          this.advanceWave();
        }
      }
    }
  }

  private resolveOverlapObject(
    object1: Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
      | Phaser.Tilemaps.Tile,
  ): Phaser.GameObjects.GameObject {
    if (object1 instanceof Phaser.Physics.Arcade.Body) {
      return object1.gameObject;
    }
    if (object1 instanceof Phaser.Physics.Arcade.StaticBody) {
      return object1.gameObject;
    }
    return object1 as Phaser.GameObjects.GameObject;
  }
}

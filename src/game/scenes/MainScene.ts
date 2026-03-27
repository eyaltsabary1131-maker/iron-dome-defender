import * as Phaser from "phaser";
import { TextureKeys } from "@/game/assets/textureKeys";
import {
  BATTERY_DISPLAY_NAME,
  BATTERY_STATS,
  type BatteryType,
  PROJECTILE_DATA_KEY,
} from "@/game/batteryTypes";
import {
  MAX_WEAPON_POWER_LEVEL,
  POWER_UP_DISPLAY_COLOR,
  POWER_UP_TO_BATTERY,
  randomPowerUpKind,
  type PowerUpKind,
} from "@/game/config/powerUpTypes";
import { BallisticEnemy } from "@/game/classes/BallisticEnemy";
import { BaseEnemy } from "@/game/classes/BaseEnemy";
import { Debris } from "@/game/classes/Debris";
import { JokerPickup } from "@/game/classes/JokerPickup";
import { MirvSubmunition } from "@/game/classes/MirvSubmunition";
import { PowerUp } from "@/game/classes/PowerUp";
import { RocketEnemy } from "@/game/classes/RocketEnemy";
import { UAVEnemy } from "@/game/classes/UAVEnemy";
import {
  ECONOMY,
  type ShopUpgradeId,
} from "@/game/config/economyConfig";
import { GAME_HEIGHT, GAME_WIDTH } from "@/game/config/dimensions";
import {
  BLACKOUT_OVERLAY_ALPHA,
  getStrategicAssetKeyAtWorldX,
  MILITARY_BASE_RELOAD_PENALTY_MS,
  PROTECTION_BONUS_CREDITS,
  STRATEGIC_ASSETS,
  STRATEGIC_ASSET_HP_MAX,
  type StrategicAssetKey,
} from "@/game/config/strategicAssets";
import {
  isRedAlertSwarmWave,
  WAVE_CONFIGS,
  WAVE_COUNT,
} from "@/game/waveConfig";
import { RADAR_AMBER, radarTextStyle } from "@/game/ui/radarStyle";
import { getRankFromScore, type RankInfo } from "@/game/ranks";
import {
  emitAmmoUpdated,
  emitCityHit,
  emitCreditsUpdated,
  emitGameOver,
  emitGameOverDebrief,
  emitJokersUpdated,
  emitScoreUpdated,
  emitShopPanelUpdated,
  emitStrategicAssetsUpdated,
  emitWaveChanged,
  emitWeaponUpgraded,
  subscribeGameReset,
  subscribeRequestUseJoker,
  subscribeShopContinueRequest,
  subscribeShopPurchaseRequest,
} from "@/game/events/gameEvents";
import {
  getAudioContext,
  initAudio,
  isAudioMuted,
  isTacticalDroneRunning,
  playDryFireClick,
  playExplosion,
  playJetFlyby,
  playLaserZap,
  playMilitaryFanfare,
  playPowerUp,
  playPowerUpLevelUp,
  playRadioChatter,
  playRedAlertSiren,
  playShoot,
  playTacticalStrikeImpact,
  playWaveAlert,
  setTacticalDroneTension,
  startTacticalDrone,
  stopTacticalDrone,
} from "@/game/utils/SynthAudio";

const WIDTH = GAME_WIDTH;
const HEIGHT = GAME_HEIGHT;
const PLAYER_HALF_W = 44;
const RELOAD_HUD_TICK_MS = 100;
/** Standard interceptor (Iron Dome). */
const PROJECTILE_SPEED_IRON = -600;
const PROJECTILE_SPEED_SLING = -750;
const PROJECTILE_SPEED_ARROW = -320;
const PROJECTILE_OOB_PAD_X = 100;

const MIN_SPAWN_DELAY_MS = 400;
/** Tactical strike (ex–Joker) charges from interceptor kills. */
const JOKER_CHARGE_MAX = 20;

const POWERUP_CHANCE_BALLISTIC = 0.38;
const POWERUP_CHANCE_OTHER = 0.1;

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  private projectiles!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private powerUps!: Phaser.Physics.Arcade.Group;
  private jokerPickups!: Phaser.Physics.Arcade.Group;
  private debris!: Phaser.Physics.Arcade.Group;

  private explosionEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private beamSparkEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private reloadingLabel!: Phaser.GameObjects.Text;

  private score = 0;
  /** Lives (city / HVT / debris hits consume one). */
  private hearts = 3;
  private batteryType: BatteryType = "IRON_DOME";
  /** Chicken Invaders–style combo (1–5); persists across weapon color switches */
  private weaponPowerLevel = 1;
  private gameOver = false;

  private currentWave = 1;
  private waveKillCount = 0;
  private currentSpawnDelayMs = 2000;

  private spawnTimer?: Phaser.Time.TimerEvent;
  /** If spawn fails after shop close, recover after 2s (see scheduleWaveSpawnSafetyKick). */
  private waveSpawnSafetyTimer?: Phaser.Time.TimerEvent;
  private unsubscribeReset?: () => void;

  private lastFiredTime = -100000;
  private readonly pointerLerp = 0.18;

  private currentAmmo = BATTERY_STATS.IRON_DOME.maxAmmo;
  private maxAmmo = BATTERY_STATS.IRON_DOME.maxAmmo;
  private isReloading = false;
  private reloadTimer?: Phaser.Time.TimerEvent;
  private reloadHudTimer?: Phaser.Time.TimerEvent;
  private reloadStartTime = 0;
  private lastDryFireAt = -100000;
  private reloadRing!: Phaser.GameObjects.Graphics;

  private jokerKillCharge = 0;
  private redAlertSwarmActive = false;
  private redAlertTargetKills = 0;
  private bKey!: Phaser.Input.Keyboard.Key;
  private unsubscribeJoker?: () => void;
  private pointerDownHandler?: (p: Phaser.Input.Pointer) => void;

  private bgImage!: Phaser.GameObjects.Image;
  private cityStrip!: Phaser.GameObjects.Image;

  private credits = 0;
  private shopOpen = false;
  private rapidReloadLevel = 0;
  private extendedMagLevel = 0;
  private propulsionLevel = 0;

  private unsubscribeShopPurchase?: () => void;
  private unsubscribeShopContinue?: () => void;

  private powerPlantHp = STRATEGIC_ASSET_HP_MAX;
  private militaryBaseHp = STRATEGIC_ASSET_HP_MAX;
  private logisticsPenaltyMs = 0;
  private blackoutOverlay!: Phaser.GameObjects.Rectangle;
  /** Subtle static + scanlines when grid is down (damaged radar feed). */
  private blackoutStaticGfx!: Phaser.GameObjects.Graphics;
  private lastBlackoutStaticRedraw = 0;
  private strategicHealthBars!: Phaser.GameObjects.Graphics;
  private powerPlantSilhouette!: Phaser.GameObjects.Graphics;
  private militarySilhouette!: Phaser.GameObjects.Graphics;

  private postWavePhase: "none" | "waiting_clear" | "cleared_cinematic" =
    "none";
  private waveClearedBanner?: Phaser.GameObjects.Text;
  private waveClearDelayTimer?: Phaser.Time.TimerEvent;
  /** When `waiting_clear` began — used for 5s no-visible-enemy shop safety */
  private waveClearEnterAt = 0;
  /** Last time a visible enemy was added (spawn / red-alert burst). Used for stuck `waiting_clear`. */
  private lastVisibleEnemySpawnAt = 0;
  private lastGhostEnemyDiagLogAt = -1_000_000;
  constructor() {
    super({ key: "MainScene" });
  }

  create(): void {
    emitScoreUpdated(0);
    this.weaponPowerLevel = 1;
    emitWeaponUpgraded({
      batteryName: BATTERY_DISPLAY_NAME.IRON_DOME,
      batteryType: "IRON_DOME",
      powerLevel: 1,
    });
    emitWaveChanged(1);

    this.gameOver = false;
    this.score = 0;
    this.hearts = ECONOMY.MAX_HEARTS;
    emitCityHit(this.hearts);
    this.batteryType = "IRON_DOME";
    this.credits = 0;
    this.shopOpen = false;
    this.rapidReloadLevel = 0;
    this.extendedMagLevel = 0;
    this.propulsionLevel = 0;
    emitCreditsUpdated(0);
    this.emitShopUi(false);
    this.postWavePhase = "none";
    this.maxAmmo = this.getMagCapacity();
    this.currentWave = 1;
    this.waveKillCount = 0;
    this.jokerKillCharge = 0;
    this.redAlertSwarmActive = false;
    this.redAlertTargetKills = 0;
    this.lastBlackoutStaticRedraw = 0;
    this.lastVisibleEnemySpawnAt = this.time.now;
    this.lastGhostEnemyDiagLogAt = -1_000_000;
    this.emitJokerChargeUi();

    this.reloadTimer?.remove();
    this.reloadTimer = undefined;
    this.currentAmmo = this.maxAmmo;
    this.isReloading = false;

    this.bgImage = this.add.image(WIDTH / 2, HEIGHT / 2, TextureKeys.bgIsrael);
    this.bgImage.setDisplaySize(WIDTH, HEIGHT);
    this.bgImage.setDepth(-25);

    this.cityStrip = this.add.image(WIDTH / 2, HEIGHT - 70, TextureKeys.cityIsrael);
    this.cityStrip.setOrigin(0.5, 0);
    this.cityStrip.setDisplaySize(WIDTH, 140);
    this.cityStrip.setDepth(-8);

    this.powerPlantHp = STRATEGIC_ASSET_HP_MAX;
    this.militaryBaseHp = STRATEGIC_ASSET_HP_MAX;
    this.logisticsPenaltyMs = 0;

    this.buildStrategicAssetsLayer();

    const { config, spawnDelayFactor } = this.getEffectiveWaveConfig();
    this.currentSpawnDelayMs = Math.max(
      MIN_SPAWN_DELAY_MS,
      config.spawnDelayMs / spawnDelayFactor,
    );

    this.player = this.physics.add.sprite(
      WIDTH / 2,
      HEIGHT - 56,
      TextureKeys.ironDomeBattery,
    );
    this.player.setDisplaySize(88, 66);
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.setImmovable(true);
    playerBody.setSize(72, 38);
    playerBody.setOffset(8, 20);

    this.spaceKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    this.bKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);

    this.projectiles = this.physics.add.group();

    this.enemies = this.physics.add.group();

    this.powerUps = this.physics.add.group();

    this.jokerPickups = this.physics.add.group();

    this.debris = this.physics.add.group();

    this.reloadingLabel = this.add.text(
      0,
      0,
      "RELOADING…",
      radarTextStyle("13px", RADAR_AMBER),
    );
    this.reloadingLabel.setOrigin(0.5);
    this.reloadingLabel.setDepth(62);
    this.reloadingLabel.setVisible(false);

    this.reloadRing = this.add.graphics();
    this.reloadRing.setDepth(61);

    this.explosionEmitter = this.add.particles(0, 0, TextureKeys.particle, {
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

    this.beamSparkEmitter = this.add.particles(0, 0, TextureKeys.particle, {
      speed: { min: 90, max: 220 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.42, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 160, max: 280 },
      tint: [0xffffff, 0xffee88, 0xffaa33, 0xff6622],
      blendMode: Phaser.BlendModes.ADD,
      emitting: false,
    });
    this.beamSparkEmitter.setDepth(102);

    this.dustEmitter = this.add.particles(0, HEIGHT - 52, TextureKeys.particle, {
      speed: { min: 22, max: 96 },
      angle: { min: 205, max: 335 },
      scale: { start: 0.42, end: 0.04 },
      alpha: { start: 0.48, end: 0 },
      lifespan: { min: 480, max: 880 },
      gravityY: -22,
      tint: [0xc4a574, 0x8b7355, 0x5a4a38],
      blendMode: Phaser.BlendModes.NORMAL,
      emitting: false,
    });
    this.dustEmitter.setDepth(3);

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
      if (this.gameOver || this.shopOpen) return;
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
    this.emitStrategicHud();

    this.unsubscribeReset = subscribeGameReset(() => {
      this.scene.restart();
    });

    this.unsubscribeShopPurchase = subscribeShopPurchaseRequest((id) => {
      this.tryPurchaseUpgrade(id);
    });
    this.unsubscribeShopContinue = subscribeShopContinueRequest(() => {
      this.closeShopAndAdvanceWave();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      stopTacticalDrone();
      this.cancelPostWaveSequence();
      this.waveSpawnSafetyTimer?.remove();
      this.waveSpawnSafetyTimer = undefined;
      if (this.pointerDownHandler) {
        this.input.off("pointerdown", this.pointerDownHandler);
      }
      this.reloadTimer?.remove();
      this.reloadTimer = undefined;
      this.reloadHudTimer?.remove();
      this.reloadHudTimer = undefined;
      this.unsubscribeJoker?.();
      this.unsubscribeJoker = undefined;
      this.unsubscribeReset?.();
      this.unsubscribeReset = undefined;
      this.unsubscribeShopPurchase?.();
      this.unsubscribeShopPurchase = undefined;
      this.unsubscribeShopContinue?.();
      this.unsubscribeShopContinue = undefined;
    });
  }

  private getEffectiveReloadMs(): number {
    const raw =
      ECONOMY.BASE_RELOAD_MS -
      this.rapidReloadLevel * ECONOMY.RELOAD_REDUCTION_MS +
      this.logisticsPenaltyMs;
    return Math.max(ECONOMY.MIN_RELOAD_MS, raw);
  }

  private emitStrategicHud(): void {
    emitStrategicAssetsUpdated({
      powerPlantHp: this.powerPlantHp,
      militaryBaseHp: this.militaryBaseHp,
      maxHp: STRATEGIC_ASSET_HP_MAX,
      gridOffline: this.powerPlantHp <= 0,
      logisticsDamaged: this.militaryBaseHp <= 0,
    });
  }

  private buildStrategicAssetsLayer(): void {
    this.blackoutOverlay = this.add.rectangle(
      WIDTH / 2,
      HEIGHT / 2,
      WIDTH,
      HEIGHT,
      0x000000,
      BLACKOUT_OVERLAY_ALPHA,
    );
    this.blackoutOverlay.setDepth(15);
    this.blackoutOverlay.setScrollFactor(0);
    this.blackoutOverlay.setVisible(false);

    this.blackoutStaticGfx = this.add.graphics();
    this.blackoutStaticGfx.setDepth(16);
    this.blackoutStaticGfx.setScrollFactor(0);
    this.blackoutStaticGfx.setVisible(false);

    this.powerPlantSilhouette = this.add.graphics();
    this.powerPlantSilhouette.setDepth(4);
    this.drawPowerPlantSilhouette();

    this.militarySilhouette = this.add.graphics();
    this.militarySilhouette.setDepth(4);
    this.drawMilitarySilhouette();

    const pp = STRATEGIC_ASSETS.power_plant;
    const mb = STRATEGIC_ASSETS.military_base;
    this.add
      .text(pp.centerX, pp.anchorY - 66, pp.displayName, {
        ...radarTextStyle("9px", "#a8e8ff"),
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(mb.centerX, mb.anchorY - 66, mb.displayName, {
        ...radarTextStyle("9px", "#c8e8b8"),
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.strategicHealthBars = this.add.graphics();
    this.strategicHealthBars.setDepth(6);
    this.redrawStrategicHealthBars();
  }

  private drawPowerPlantSilhouette(): void {
    const { centerX: cx, anchorY: y } = STRATEGIC_ASSETS.power_plant;
    const g = this.powerPlantSilhouette;
    g.clear();
    g.fillStyle(0x6a7a88, 1);
    g.fillRect(cx - 32, y - 8, 64, 10);
    g.fillStyle(0x8a9aaa, 1);
    g.fillRect(cx - 26, y - 28, 14, 22);
    g.fillRect(cx - 6, y - 32, 14, 26);
    g.fillRect(cx + 14, y - 26, 12, 20);
    g.lineStyle(2, 0x445566, 0.9);
    g.strokeRect(cx - 32, y - 34, 64, 36);
  }

  private drawMilitarySilhouette(): void {
    const { centerX: cx, anchorY: y } = STRATEGIC_ASSETS.military_base;
    const g = this.militarySilhouette;
    g.clear();
    g.fillStyle(0x4a5a3a, 1);
    g.fillRect(cx - 36, y - 18, 72, 22);
    g.fillTriangle(cx - 8, y - 18, cx, y - 32, cx + 8, y - 18);
    g.fillStyle(0x3a4a2a, 1);
    g.fillRect(cx - 28, y - 12, 18, 10);
    g.fillRect(cx + 10, y - 12, 18, 10);
    g.lineStyle(2, 0x334422, 0.95);
    g.strokeRect(cx - 36, y - 18, 72, 22);
  }

  private redrawStrategicHealthBars(): void {
    const g = this.strategicHealthBars;
    g.clear();
    this.drawAssetHpBar(
      g,
      STRATEGIC_ASSETS.power_plant.centerX,
      STRATEGIC_ASSETS.power_plant.anchorY - 56,
      this.powerPlantHp,
    );
    this.drawAssetHpBar(
      g,
      STRATEGIC_ASSETS.military_base.centerX,
      STRATEGIC_ASSETS.military_base.anchorY - 56,
      this.militaryBaseHp,
    );
  }

  private drawAssetHpBar(
    graphics: Phaser.GameObjects.Graphics,
    cx: number,
    by: number,
    hp: number,
  ): void {
    const w = 52;
    const h = 7;
    const bx = cx - w / 2;
    graphics.fillStyle(0x220808, 1);
    graphics.fillRect(bx, by, w, h);
    const segW = (w - 4) / STRATEGIC_ASSET_HP_MAX;
    for (let i = 0; i < hp; i++) {
      graphics.fillStyle(0x33ff88, 1);
      graphics.fillRect(bx + 2 + i * segW, by + 2, segW - 1, h - 4);
    }
    graphics.lineStyle(1, 0xffffff, 0.55);
    graphics.strokeRect(bx, by, w, h);
  }

  private flashCriticalHitWarning(): void {
    const t = this.add.text(WIDTH / 2, HEIGHT * 0.38, "⚠ CRITICAL HIT", {
      ...radarTextStyle("24px", "#ff3333"),
      stroke: "#1a0000",
      strokeThickness: 5,
    });
    t.setOrigin(0.5);
    t.setDepth(220);
    t.setScrollFactor(0);
    this.tweens.add({
      targets: t,
      alpha: 0,
      scale: 1.12,
      duration: 1100,
      ease: "Power2",
      onComplete: () => {
        t.destroy();
      },
    });
  }

  private onEnemyReachedGround(enemy: BaseEnemy): void {
    const zone = getStrategicAssetKeyAtWorldX(enemy.x);
    if (zone === "power_plant" && this.powerPlantHp > 0) {
      this.applyStrategicAssetStrike("power_plant", enemy);
      return;
    }
    if (zone === "military_base" && this.militaryBaseHp > 0) {
      this.applyStrategicAssetStrike("military_base", enemy);
      return;
    }
    this.onEnemyReachedBottom(enemy);
  }

  private applyStrategicAssetStrike(
    key: StrategicAssetKey,
    enemy: BaseEnemy,
  ): void {
    const x = enemy.x;
    const y = enemy.y;
    this.triggerExplosion(x, y);
    if (enemy instanceof UAVEnemy) {
      this.spawnDebrisBurst(x, y);
      this.spawnDebrisBurst(x, y);
    }
    enemy.destroy();
    this.flashCriticalHitWarning();
    this.cameras.main.shake(200, 0.006);
    if (key === "power_plant") {
      this.powerPlantHp = Math.max(0, this.powerPlantHp - 1);
      if (this.powerPlantHp === 1) {
        this.showIncomingMessage(
          "CAUTION: POWER PLANT UNDER ATTACK!",
          4000,
        );
      }
      if (this.powerPlantHp <= 0) {
        this.blackoutOverlay.setVisible(true);
        this.blackoutStaticGfx.setVisible(true);
        this.redrawBlackoutStaticNoise();
      }
    } else {
      this.militaryBaseHp = Math.max(0, this.militaryBaseHp - 1);
      if (this.militaryBaseHp <= 0) {
        this.logisticsPenaltyMs = MILITARY_BASE_RELOAD_PENALTY_MS;
      }
    }
    this.redrawStrategicHealthBars();
    this.emitStrategicHud();
    this.loseHeartFromThreat("hvt");
  }

  private getMagCapacity(): number {
    return (
      ECONOMY.BASE_MAG + this.extendedMagLevel * ECONOMY.EXTENDED_MAG_BONUS
    );
  }

  private getPropulsionMult(): number {
    return 1 + this.propulsionLevel * ECONOMY.PROPULSION_BONUS;
  }

  private emitShopUi(open: boolean): void {
    emitShopPanelUpdated({
      open,
      credits: this.credits,
      waveJustCompleted: this.currentWave,
      rapidReloadLevel: this.rapidReloadLevel,
      extendedMagLevel: this.extendedMagLevel,
      propulsionLevel: this.propulsionLevel,
      hearts: this.hearts,
      maxHearts: ECONOMY.MAX_HEARTS,
    });
  }

  private countActiveInGroup(
    group: Phaser.Physics.Arcade.Group,
  ): number {
    let n = 0;
    group.children.iterate((child) => {
      if (child && (child as Phaser.GameObjects.GameObject).active) n += 1;
      return true;
    });
    return n;
  }

  private isBattlefieldClear(): boolean {
    return (
      this.countActiveInGroup(this.enemies) === 0 &&
      this.countActiveInGroup(this.projectiles) === 0 &&
      this.countActiveInGroup(this.debris) === 0 &&
      this.countActiveInGroup(this.powerUps) === 0 &&
      this.countActiveInGroup(this.jokerPickups) === 0
    );
  }

  private cancelPostWaveSequence(): void {
    if (this.postWavePhase === "none") return;
    this.postWavePhase = "none";
    this.waveClearDelayTimer?.remove();
    this.waveClearDelayTimer = undefined;
    this.waveClearedBanner?.destroy();
    this.waveClearedBanner = undefined;
  }

  private beginPostWaveSequence(): void {
    if (this.gameOver || this.shopOpen) return;
    if (this.postWavePhase !== "none") return;
    this.postWavePhase = "waiting_clear";
    this.waveClearEnterAt = this.time.now;
    this.spawnTimer?.remove();
    this.spawnTimer = undefined;
  }

  /**
   * Remove enemy without city/HVT damage or wave kill credit (ghost / OOB culls).
   */
  private destroyEnemy(enemy: BaseEnemy): void {
    if (!enemy || !enemy.active) return;
    enemy.destroy();
  }

  private markVisibleEnemySpawnPulse(): void {
    this.lastVisibleEnemySpawnAt = this.time.now;
  }

  /** Throttled diagnostics while `waiting_clear` is blocked by live enemy entries. */
  private logGhostEnemyBlockingShop(): void {
    const n = this.enemies.countActive(true);
    console.log("Active enemies blocking shop:", n);
    let visible = 0;
    this.enemies.children.iterate((child) => {
      const e = child as BaseEnemy;
      if (!e?.active) return true;
      if (e.visible && e.alpha > 0.02) visible += 1;
      return true;
    });
    if (n > 0 && visible === 0) {
      console.warn(
        "[MainScene] Ghost suspects: countActive > 0 but no visible enemies",
      );
    }
  }

  private countVisibleActiveEnemies(): number {
    let visible = 0;
    this.enemies.children.iterate((child) => {
      const e = child as BaseEnemy;
      if (!e?.active) return true;
      if (e.visible && e.alpha > 0.02) visible += 1;
      return true;
    });
    return visible;
  }

  /** Clears ghost/invisible blockers and opens the armory (skips WAVE CLEARED banner). */
  private forceCompleteWaveClearToShop(): void {
    this.enemies.clear(true, true);
    this.destroyAllGroupChildren(this.projectiles);
    this.destroyAllGroupChildren(this.debris);
    this.destroyAllGroupChildren(this.powerUps);
    this.destroyAllGroupChildren(this.jokerPickups);
    this.cancelPostWaveSequence();
    this.spawnTimer?.remove();
    this.spawnTimer = undefined;
    this.waveClearEnterAt = 0;
    this.openInterwaveShop();
  }

  /**
   * If kill quota was satisfied but `beginPostWaveSequence` did not run (logic desync), recover.
   * Does not use an `enemiesToSpawn` counter — this game uses a looping spawn timer until quota.
   */
  private updateWaveSpawning(): void {
    if (this.gameOver || this.shopOpen || this.postWavePhase !== "none") return;

    if (this.redAlertSwarmActive) {
      if (this.waveKillCount >= this.redAlertTargetKills) {
        this.waveKillCount = 0;
        this.redAlertSwarmActive = false;
        this.beginPostWaveSequence();
      }
      return;
    }

    const { config } = this.getEffectiveWaveConfig();
    if (this.waveKillCount >= config.targetKills) {
      this.waveKillCount = 0;
      this.beginPostWaveSequence();
    }
  }

  private showWaveClearedCinematic(): void {
    void initAudio();
    playRadioChatter();
    this.waveClearedBanner?.destroy();
    const t = this.add.text(WIDTH / 2, HEIGHT * 0.4, "WAVE CLEARED", {
      ...radarTextStyle("32px", "#39ff14"),
      stroke: "#001800",
      strokeThickness: 6,
    });
    t.setOrigin(0.5);
    t.setDepth(210);
    t.setScrollFactor(0);
    t.setAlpha(0.92);
    this.waveClearedBanner = t;
    this.tweens.add({
      targets: t,
      scale: { from: 0.88, to: 1.05 },
      duration: 400,
      ease: "Sine.easeOut",
    });
    this.waveClearDelayTimer?.remove();
    this.waveClearDelayTimer = this.time.delayedCall(1500, () => {
      this.waveClearDelayTimer = undefined;
      this.waveClearedBanner?.destroy();
      this.waveClearedBanner = undefined;
      if (this.gameOver || this.shopOpen) return;
      if (this.postWavePhase !== "cleared_cinematic") return;
      this.postWavePhase = "none";
      this.openInterwaveShop();
    });
  }

  private tickPostWaveFlow(): void {
    if (this.postWavePhase === "waiting_clear") {
      const enemyBlockers = this.countActiveInGroup(this.enemies);
      if (enemyBlockers > 0) {
        if (this.time.now - this.lastGhostEnemyDiagLogAt > 2000) {
          this.lastGhostEnemyDiagLogAt = this.time.now;
          this.logGhostEnemyBlockingShop();
        }
        const stale =
          this.lastVisibleEnemySpawnAt > 0 &&
          this.time.now - this.lastVisibleEnemySpawnAt > 5000;
        if (stale) {
          console.warn(
            "[MainScene] Force clear: 5s since last visible enemy spawn while waiting_clear — clearing enemy group",
          );
          this.enemies.clear(true, true);
        }
      }

      const stuckMs = this.time.now - this.waveClearEnterAt;
      if (
        stuckMs > 5000 &&
        !this.isBattlefieldClear() &&
        this.countVisibleActiveEnemies() === 0
      ) {
        console.warn(
          "[MainScene] Wave-end safety: 5s in waiting_clear with no visible enemies — force opening shop",
        );
        this.forceCompleteWaveClearToShop();
        return;
      }
    }

    if (this.postWavePhase === "waiting_clear" && this.isBattlefieldClear()) {
      this.postWavePhase = "cleared_cinematic";
      this.showWaveClearedCinematic();
    }
  }

  private openInterwaveShop(): void {
    if (this.gameOver) return;
    this.waveSpawnSafetyTimer?.remove();
    this.waveSpawnSafetyTimer = undefined;
    const eff =
      Math.floor(this.currentAmmo * ECONOMY.RESOURCE_EFFICIENCY_PER_ROUND);
    if (eff > 0) {
      this.credits += eff;
      emitCreditsUpdated(this.credits);
    }
    if (this.powerPlantHp > 0 && this.militaryBaseHp > 0) {
      this.credits += PROTECTION_BONUS_CREDITS;
      emitCreditsUpdated(this.credits);
    }
    this.shopOpen = true;
    this.spawnTimer?.remove();
    this.spawnTimer = undefined;
    this.physics.pause();
    this.emitShopUi(true);
  }

  private closeShopAndAdvanceWave(): void {
    if (!this.shopOpen || this.gameOver) return;

    const nextWave = this.currentWave + 1;
    console.log(`[MainScene] Closing Shop for Wave ${nextWave}`);

    this.waveSpawnSafetyTimer?.remove();
    this.waveSpawnSafetyTimer = undefined;
    this.cancelPostWaveSequence();

    this.shopOpen = false;
    this.postWavePhase = "none";

    this.cullStaleBattlefieldObjects();

    this.redAlertSwarmActive = false;
    this.waveKillCount = 0;

    this.time.paused = false;
    this.physics.resume();
    if (this.sys.isPaused()) {
      this.sys.resume();
    }
    console.log("[MainScene] Resuming Physics");

    this.emitShopUi(false);

    this.currentWave = nextWave;
    emitWaveChanged(this.currentWave);

    const { config, spawnDelayFactor } = this.getEffectiveWaveConfig();
    this.currentSpawnDelayMs = Math.max(
      MIN_SPAWN_DELAY_MS,
      config.spawnDelayMs / spawnDelayFactor,
    );

    if (isRedAlertSwarmWave(this.currentWave)) {
      console.log(
        `[MainScene] Starting Wave ${this.currentWave} Red Alert Swarm (milestone; not WAVE_CONFIGS.swarm)`,
      );
      this.beginRedAlertSwarm();
    } else {
      playWaveAlert();
      console.log(
        `[MainScene] Starting Wave ${this.currentWave} Spawn Timer (delay ${this.currentSpawnDelayMs}ms)`,
      );
      this.restartSpawnTimer();
    }

    this.scheduleWaveSpawnSafetyKick();

    if (this.currentWave === 2) {
      this.time.delayedCall(500, () => {
        if (this.gameOver || this.shopOpen) return;
        this.showIncomingMessage(
          "WATCH YOUR AMMO. RELOAD TAKES TIME!",
          4000,
        );
      });
    }
  }

  /**
   * Drops stray shots / debris that can keep `isBattlefieldClear` false forever.
   * Also clears nearly invisible leftovers that confuse the “all clear” gate.
   */
  private cullStaleBattlefieldObjects(): void {
    const padX = 100;
    const padY = 220;
    const purge = (group: Phaser.Physics.Arcade.Group) => {
      const kids = [...group.getChildren()] as Phaser.GameObjects.GameObject[];
      for (const o of kids) {
        if (!o || !o.active) continue;
        const spr = o as Phaser.Physics.Arcade.Sprite;
        const far =
          typeof spr.x === "number" &&
          typeof spr.y === "number" &&
          (spr.y < -padY ||
            spr.y > HEIGHT + padY ||
            spr.x < -padX ||
            spr.x > WIDTH + padX);
        const hidden = !spr.visible && spr.alpha < 0.02;
        if (far || hidden) {
          o.destroy();
        }
      }
    };
    purge(this.projectiles);
    purge(this.debris);
    purge(this.powerUps);
    purge(this.jokerPickups);
  }

  /**
   * Wave 3+ use `restartSpawnTimer` (looping). Milestone waves 5/10/… use `beginRedAlertSwarm` instead.
   * If the clock/physics were stuck, the timer may never arm — recover after 2s.
   */
  private scheduleWaveSpawnSafetyKick(): void {
    this.waveSpawnSafetyTimer?.remove();
    const waveToken = this.currentWave;
    this.waveSpawnSafetyTimer = this.time.delayedCall(2000, () => {
      this.waveSpawnSafetyTimer = undefined;
      if (this.gameOver || this.shopOpen || this.currentWave !== waveToken) {
        return;
      }

      if (isRedAlertSwarmWave(this.currentWave)) {
        if (this.countActiveInGroup(this.enemies) === 0) {
          console.warn(
            `[MainScene] Spawn safety: no enemies on red-alert wave ${this.currentWave}, re-running swarm`,
          );
          this.beginRedAlertSwarm();
        }
        return;
      }

      const t = this.spawnTimer;
      const timerOk = Boolean(t && !t.paused);
      if (!timerOk) {
        console.warn(
          `[MainScene] Spawn safety: spawn timer missing or paused on wave ${this.currentWave} — restarting + manual spawn`,
        );
        this.restartSpawnTimer();
        this.spawnEnemy();
      }
    });
  }

  private tryPurchaseUpgrade(id: ShopUpgradeId): void {
    if (!this.shopOpen || this.gameOver) return;
    let bought = false;
    if (id === "rapid_reload") {
      if (this.rapidReloadLevel >= ECONOMY.RAPID_RELOAD_MAX) return;
      if (this.credits < ECONOMY.RAPID_RELOAD_COST) return;
      this.credits -= ECONOMY.RAPID_RELOAD_COST;
      this.rapidReloadLevel += 1;
      bought = true;
    } else if (id === "extended_mag") {
      if (this.extendedMagLevel >= ECONOMY.EXTENDED_MAG_MAX) return;
      if (this.credits < ECONOMY.EXTENDED_MAG_COST) return;
      this.credits -= ECONOMY.EXTENDED_MAG_COST;
      this.extendedMagLevel += 1;
      const newMax = this.getMagCapacity();
      const gained = newMax - this.maxAmmo;
      this.maxAmmo = newMax;
      this.currentAmmo = Math.min(this.currentAmmo + gained, newMax);
      this.emitAmmoState();
      bought = true;
    } else if (id === "propulsion") {
      if (this.propulsionLevel >= ECONOMY.PROPULSION_MAX) return;
      if (this.credits < ECONOMY.PROPULSION_COST) return;
      this.credits -= ECONOMY.PROPULSION_COST;
      this.propulsionLevel += 1;
      bought = true;
    } else if (id === "buy_life") {
      if (this.hearts >= ECONOMY.MAX_HEARTS) return;
      if (this.credits < ECONOMY.BUY_LIFE_COST) return;
      this.credits -= ECONOMY.BUY_LIFE_COST;
      this.hearts += 1;
      emitCityHit(this.hearts);
      bought = true;
    }
    if (bought) {
      void initAudio();
      playRadioChatter();
      emitCreditsUpdated(this.credits);
      this.emitShopUi(true);
    }
  }

  private emitJokerChargeUi(): void {
    emitJokersUpdated({
      charge: this.jokerKillCharge,
      maxCharge: JOKER_CHARGE_MAX,
      ready: this.jokerKillCharge >= JOKER_CHARGE_MAX,
    });
  }

  private addJokerChargeFromKill(): void {
    if (this.jokerKillCharge >= JOKER_CHARGE_MAX) return;
    this.jokerKillCharge += 1;
    this.emitJokerChargeUi();
  }

  private awardCreditsForKillKind(
    kind: "ballistic" | "uav" | "rocket",
  ): void {
    let add: number = ECONOMY.CREDITS_ROCKET;
    if (kind === "ballistic") add = ECONOMY.CREDITS_BALLISTIC;
    else if (kind === "uav") add = ECONOMY.CREDITS_UAV;
    if (this.redAlertSwarmActive) {
      add *= 2;
    }
    if (this.currentWave <= ECONOMY.EARLY_WAVE_MAX) {
      add = Math.floor(add * ECONOMY.EARLY_WAVE_CREDIT_MULT);
    }
    this.credits += add;
    emitCreditsUpdated(this.credits);
  }

  private killCreditKind(enemy: BaseEnemy): "ballistic" | "uav" | "rocket" {
    if (enemy instanceof BallisticEnemy) return "ballistic";
    if (enemy instanceof UAVEnemy) return "uav";
    return "rocket";
  }

  private awardCreditsForKill(enemy: BaseEnemy): void {
    this.awardCreditsForKillKind(this.killCreditKind(enemy));
  }

  update(): void {
    if (this.gameOver) {
      return;
    }
    if (
      this.blackoutOverlay.visible &&
      this.time.now - this.lastBlackoutStaticRedraw > 110
    ) {
      this.lastBlackoutStaticRedraw = this.time.now;
      this.redrawBlackoutStaticNoise();
    }
    if (this.shopOpen) {
      return;
    }

    if (!isAudioMuted() && getAudioContext()?.state === "running") {
      if (!isTacticalDroneRunning()) {
        startTacticalDrone();
      }
      setTacticalDroneTension(this.countActiveInGroup(this.enemies));
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
      const p = this.getReloadProgress();
      this.reloadingLabel.setVisible(true);
      this.reloadingLabel.setPosition(this.player.x, this.player.y - 58);
      this.reloadingLabel.setText(
        `RELOADING… ${Math.round(p * 100)}%`,
      );
      this.drawReloadRing(this.player.x, this.player.y - 6, p);
    } else {
      this.reloadingLabel.setVisible(false);
      this.reloadRing.clear();
    }

    this.projectiles.children.iterate((child) => {
      if (!child || !child.active) return true;
      const proj = child as Phaser.Physics.Arcade.Sprite;
      const body = proj.body as Phaser.Physics.Arcade.Body;
      proj.setRotation(
        Math.atan2(body.velocity.y, body.velocity.x) + Math.PI / 2,
      );
      const topBound = proj.getData(PROJECTILE_DATA_KEY.PIERCING) ? -140 : -40;
      const oobX =
        proj.x < -PROJECTILE_OOB_PAD_X ||
        proj.x > WIDTH + PROJECTILE_OOB_PAD_X;
      const oobY = proj.y < topBound || proj.y > HEIGHT + 120;
      if (oobX || oobY) {
        proj.destroy();
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
      const ex = enemy.x;
      const ey = enemy.y;
      const oobFarDown = ey > GAME_HEIGHT + 100;
      const oobFarX = ex < -120 || ex > GAME_WIDTH + 120;
      if (oobFarDown || oobFarX) {
        this.destroyEnemy(enemy);
        return true;
      }
      const eBody = enemy.body as Phaser.Physics.Arcade.Body;
      if (eBody.bottom >= HEIGHT) {
        this.onEnemyReachedGround(enemy);
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

    this.updateWaveSpawning();
    this.tickPostWaveFlow();
  }

  private redrawBlackoutStaticNoise(): void {
    const g = this.blackoutStaticGfx;
    g.clear();
    g.fillStyle(0xffffff, 0.032);
    for (let i = 0; i < 320; i++) {
      g.fillRect(
        Phaser.Math.Between(0, WIDTH),
        Phaser.Math.Between(0, HEIGHT),
        1,
        1,
      );
    }
    g.lineStyle(1, 0xc0c0c0, 0.05);
    for (let y = 0; y < HEIGHT; y += 3) {
      g.lineBetween(0, y, WIDTH, y);
    }
  }

  private showIncomingMessage(body: string, durationMs = 4000): void {
    const header = this.add.text(WIDTH / 2, 38, "◆ INCOMING MESSAGE ◆", {
      ...radarTextStyle("11px", "#7fd8ff"),
      stroke: "#001018",
      strokeThickness: 3,
    });
    header.setOrigin(0.5);
    header.setDepth(212);
    header.setScrollFactor(0);
    const bodyText = this.add.text(WIDTH / 2, 58, body, {
      ...radarTextStyle("13px", "#39ff14"),
      align: "center",
      wordWrap: { width: WIDTH - 40 },
      stroke: "#001800",
      strokeThickness: 4,
    });
    bodyText.setOrigin(0.5, 0);
    bodyText.setDepth(212);
    bodyText.setScrollFactor(0);
    const fadeAt = Math.max(800, durationMs - 550);
    this.tweens.add({
      targets: [header, bodyText],
      alpha: 0,
      delay: fadeAt,
      duration: 520,
      ease: "Power2",
      onComplete: () => {
        header.destroy();
        bodyText.destroy();
      },
    });
  }

  private showFloatingText(
    x: number,
    y: number,
    message: string,
    color: string,
  ): void {
    const t = this.add.text(x, y, message, {
      ...radarTextStyle("15px", color),
      stroke: "#001a00",
      strokeThickness: 3,
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

  private getReloadProgress(): number {
    if (!this.isReloading) return 0;
    const dur = this.getEffectiveReloadMs();
    return Phaser.Math.Clamp(
      (this.time.now - this.reloadStartTime) / dur,
      0,
      1,
    );
  }

  private emitAmmoState(): void {
    emitAmmoUpdated({
      currentAmmo: this.currentAmmo,
      maxAmmo: this.maxAmmo,
      isReloading: this.isReloading,
      reloadProgress: this.isReloading ? this.getReloadProgress() : undefined,
    });
  }

  private drawReloadRing(cx: number, cy: number, progress: number): void {
    const r = 38;
    const thick = 4;
    this.reloadRing.clear();
    this.reloadRing.lineStyle(thick, 0x224422, 0.45);
    this.reloadRing.strokeCircle(cx, cy, r);
    this.reloadRing.lineStyle(thick, 0x39ff14, 0.95);
    const start = -Math.PI / 2;
    const end = start + Math.PI * 2 * progress;
    this.reloadRing.beginPath();
    this.reloadRing.arc(cx, cy, r, start, end, false);
    this.reloadRing.strokePath();
  }

  private startReload(): void {
    if (this.isReloading) return;
    this.isReloading = true;
    this.reloadStartTime = this.time.now;
    this.reloadHudTimer?.remove();
    this.reloadHudTimer = this.time.addEvent({
      delay: RELOAD_HUD_TICK_MS,
      loop: true,
      callback: () => this.emitAmmoState(),
    });
    const reloadDur = this.getEffectiveReloadMs();
    this.reloadTimer?.remove();
    this.reloadTimer = this.time.delayedCall(reloadDur, () => {
      this.currentAmmo = this.maxAmmo;
      this.isReloading = false;
      this.reloadTimer = undefined;
      this.reloadHudTimer?.remove();
      this.reloadHudTimer = undefined;
      this.reloadRing.clear();
      this.emitAmmoState();
      this.showFloatingText(this.player.x, this.player.y - 72, "READY", "#39ff14");
    });
    this.emitAmmoState();
  }

  private feedbackDryFire(reason: "empty" | "reloading"): void {
    if (this.time.now - this.lastDryFireAt < 220) return;
    this.lastDryFireAt = this.time.now;
    void initAudio();
    playDryFireClick();
    if (reason === "empty") {
      this.showFloatingText(
        this.player.x,
        this.player.y - 80,
        "EMPTY",
        "#ff4444",
      );
    }
  }

  private emitWeaponHud(): void {
    emitWeaponUpgraded({
      batteryName: BATTERY_DISPLAY_NAME[this.batteryType],
      batteryType: this.batteryType,
      powerLevel: this.weaponPowerLevel,
    });
  }

  /** Colored crate: same color → +power level; different color → switch weapon, keep level */
  private applyPowerUpFromKind(kind: PowerUpKind): void {
    const mapped = POWER_UP_TO_BATTERY[kind];
    if (this.batteryType === mapped) {
      this.weaponPowerLevel = Math.min(
        MAX_WEAPON_POWER_LEVEL,
        this.weaponPowerLevel + 1,
      );
    } else {
      this.reloadTimer?.remove();
      this.reloadTimer = undefined;
      this.reloadHudTimer?.remove();
      this.reloadHudTimer = undefined;
      this.isReloading = false;
      this.reloadRing.clear();
      this.reloadingLabel.setVisible(false);
      this.batteryType = mapped;
      this.maxAmmo = this.getMagCapacity();
      this.currentAmmo = this.maxAmmo;
      this.emitAmmoState();
    }
    this.emitWeaponHud();
  }

  private getEffectiveWaveConfig(): {
    config: (typeof WAVE_CONFIGS)[number];
    enemySpeedScale: number;
    spawnDelayFactor: number;
  } {
    const waveIdx = (this.currentWave - 1) % WAVE_COUNT;
    const config = WAVE_CONFIGS[waveIdx];
    if (!config) {
      console.error(
        `[MainScene] Missing WAVE_CONFIGS[${waveIdx}] for wave ${this.currentWave} (count=${WAVE_COUNT}) — using slot 0`,
      );
    }
    const safe = config ?? WAVE_CONFIGS[0]!;
    const endlessTier = Math.max(0, this.currentWave - WAVE_COUNT);
    const spawnDelayFactor = 1 + endlessTier * 0.08;
    const speedTierMult = 1 + endlessTier * 0.05;
    return {
      config: safe,
      enemySpeedScale: safe.speedScale * speedTierMult,
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
    this.loseHeartFromThreat("debris");
  }

  private triggerExplosion(x: number, y: number): void {
    playExplosion();
    this.explosionEmitter.explode(28, x, y);
  }

  private enterGameOver(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    const strategicAssetsIntact =
      (this.powerPlantHp > 0 ? 1 : 0) + (this.militaryBaseHp > 0 ? 1 : 0);
    const wavesCleared = Math.max(0, this.currentWave - 1);
    emitGameOverDebrief({
      finalScore: this.score,
      finalWave: this.currentWave,
      strategicAssetsIntact,
      wavesCleared,
    });
    stopTacticalDrone();
    this.jokerKillCharge = 0;
    this.emitJokerChargeUi();
    this.redAlertSwarmActive = false;
    this.cancelPostWaveSequence();
    this.waveSpawnSafetyTimer?.remove();
    this.waveSpawnSafetyTimer = undefined;
    this.shopOpen = false;
    this.spawnTimer?.remove();
    this.spawnTimer = undefined;
    this.credits = 0;
    this.rapidReloadLevel = 0;
    this.extendedMagLevel = 0;
    this.propulsionLevel = 0;
    this.powerPlantHp = 0;
    this.militaryBaseHp = 0;
    this.logisticsPenaltyMs = 0;
    this.blackoutOverlay?.setVisible(false);
    this.blackoutStaticGfx?.setVisible(false);
    emitStrategicAssetsUpdated({
      powerPlantHp: 0,
      militaryBaseHp: 0,
      maxHp: STRATEGIC_ASSET_HP_MAX,
      gridOffline: false,
      logisticsDamaged: false,
    });
    emitCreditsUpdated(0);
    this.emitShopUi(false);
    this.reloadTimer?.remove();
    this.reloadTimer = undefined;
    this.reloadHudTimer?.remove();
    this.reloadHudTimer = undefined;
    this.isReloading = false;
    this.reloadingLabel.setVisible(false);
    this.reloadRing.clear();
    this.physics.pause();
    emitGameOver();
  }

  private addScore(points: number): void {
    if (points <= 0) return;
    const beforeTier = getRankFromScore(this.score).tierIndex;
    this.score += points;
    emitScoreUpdated(this.score);
    const after = getRankFromScore(this.score);
    if (after.tierIndex > beforeTier) {
      void initAudio();
      playMilitaryFanfare();
      this.showPromotionBanner(after);
    }
  }

  private showPromotionBanner(rank: RankInfo): void {
    const t = this.add.text(
      WIDTH / 2,
      HEIGHT * 0.33,
      `PROMOTED TO\n${rank.titleEn}\n${rank.titleHe}`,
      {
        ...radarTextStyle("19px", "#ffbf00"),
        align: "center",
        stroke: "#1a1200",
        strokeThickness: 5,
      },
    );
    t.setOrigin(0.5);
    t.setDepth(226);
    t.setScrollFactor(0);
    this.tweens.add({
      targets: t,
      alpha: 0,
      scale: 1.06,
      duration: 2400,
      ease: "Power2",
      onComplete: () => {
        t.destroy();
      },
    });
  }

  private burstCityDust(impactX: number): void {
    this.dustEmitter.explode(14, impactX, HEIGHT - 58);
  }

  private onEnemyReachedBottom(enemy: BaseEnemy): void {
    const x = enemy.x;
    const y = enemy.y;
    this.triggerExplosion(x, y);
    if (enemy instanceof RocketEnemy) {
      this.burstCityDust(x);
    }
    if (enemy instanceof UAVEnemy) {
      this.spawnDebrisBurst(x, y);
      this.spawnDebrisBurst(x, y);
    }
    enemy.destroy();
    this.loseHeartFromThreat("city");
  }

  private loseHeartFromThreat(_source: "city" | "hvt" | "debris"): void {
    if (this.gameOver) return;
    this.hearts = Math.max(0, this.hearts - 1);
    emitCityHit(this.hearts);
    if (this.hearts <= 0) {
      this.enterGameOver();
      return;
    }
    this.time.delayedCall(0, () => {
      if (this.gameOver) return;
      this.restartCurrentWaveAfterHit();
    });
  }

  private destroyAllGroupChildren(
    group: Phaser.Physics.Arcade.Group,
  ): void {
    const list = [...group.getChildren()] as Phaser.GameObjects.GameObject[];
    for (const o of list) {
      o.destroy();
    }
  }

  private restartCurrentWaveAfterHit(): void {
    this.cancelPostWaveSequence();
    this.spawnTimer?.remove();
    this.spawnTimer = undefined;
    this.waveKillCount = 0;
    this.destroyAllGroupChildren(this.enemies);
    this.destroyAllGroupChildren(this.projectiles);
    this.destroyAllGroupChildren(this.powerUps);
    this.destroyAllGroupChildren(this.debris);
    this.destroyAllGroupChildren(this.jokerPickups);
    this.redAlertSwarmActive = false;
    this.reloadTimer?.remove();
    this.reloadTimer = undefined;
    this.reloadHudTimer?.remove();
    this.reloadHudTimer = undefined;
    this.isReloading = false;
    this.reloadRing.clear();
    this.reloadingLabel.setVisible(false);
    this.maxAmmo = this.getMagCapacity();
    this.currentAmmo = this.maxAmmo;
    this.emitAmmoState();
    this.showFloatingText(
      WIDTH / 2,
      HEIGHT * 0.36,
      "BREACH — SAME WAVE",
      "#ff4444",
    );
    if (isRedAlertSwarmWave(this.currentWave)) {
      this.time.delayedCall(800, () => {
        if (this.gameOver) return;
        this.beginRedAlertSwarm();
      });
    } else {
      this.restartSpawnTimer();
      this.spawnEnemy();
    }
  }

  private spawnIronProjectile(x: number, y: number, vx: number): void {
    if (this.gameOver || this.currentAmmo <= 0) return;

    this.currentAmmo -= 1;
    this.emitAmmoState();

    const spr = this.physics.add.sprite(x, y, TextureKeys.missileTamir);
    spr.setDisplaySize(10, 30);
    this.projectiles.add(spr);
    const body = spr.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(8, 24);
    body.setOffset(1, 3);
    const pm = this.getPropulsionMult();
    body.setVelocityY(PROJECTILE_SPEED_IRON * pm);
    body.setVelocityX(vx * pm);
    spr.setData(PROJECTILE_DATA_KEY.BATTERY, "IRON_DOME");
    spr.setData(PROJECTILE_DATA_KEY.PIERCING, false);
  }

  private spawnSlingProjectile(x: number, y: number, vx: number): void {
    if (this.gameOver || this.currentAmmo <= 0) return;

    this.currentAmmo -= 1;
    this.emitAmmoState();

    const spr = this.physics.add.sprite(x, y, TextureKeys.missileStunner);
    spr.setDisplaySize(9, 22);
    this.projectiles.add(spr);
    const body = spr.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(7, 18);
    body.setOffset(1, 2);
    const pm = this.getPropulsionMult();
    body.setVelocity(vx * pm, PROJECTILE_SPEED_SLING * pm);
    spr.setData(PROJECTILE_DATA_KEY.BATTERY, "DAVIDS_SLING");
    spr.setData(PROJECTILE_DATA_KEY.PIERCING, false);
  }

  private spawnArrowProjectile(
    x: number,
    y: number,
    speedMult = 1,
  ): void {
    if (this.gameOver || this.currentAmmo <= 0) return;

    this.currentAmmo -= 1;
    this.emitAmmoState();

    const spr = this.physics.add.sprite(x, y, TextureKeys.missileArrow);
    spr.setDisplaySize(14, 40);
    this.projectiles.add(spr);
    const body = spr.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(12, 36);
    body.setOffset(1, 2);
    const spd =
      PROJECTILE_SPEED_ARROW *
      this.getPropulsionMult() *
      speedMult *
      (1 + 0.1 * (this.weaponPowerLevel - 1));
    body.setVelocity(0, spd);
    spr.setData(PROJECTILE_DATA_KEY.BATTERY, "ARROW");
    spr.setData(PROJECTILE_DATA_KEY.PIERCING, true);
    spr.setData(PROJECTILE_DATA_KEY.HIT_ENEMIES, new Set<BaseEnemy>());
  }

  private getEffectiveWeaponCooldownMs(): number {
    const base = BATTERY_STATS[this.batteryType].cooldownMs;
    const lv = this.weaponPowerLevel;
    const mult = Math.max(0.42, 1 - 0.09 * (lv - 1));
    return Math.max(32, Math.floor(base * mult));
  }

  private tryFireProjectiles(): void {
    if (this.gameOver) return;
    if (this.isReloading) {
      this.feedbackDryFire("reloading");
      return;
    }
    if (this.currentAmmo <= 0) {
      this.feedbackDryFire("empty");
      return;
    }
    const cooldown = this.getEffectiveWeaponCooldownMs();
    if (this.time.now - this.lastFiredTime < cooldown) return;
    this.lastFiredTime = this.time.now;
    void initAudio();
    playShoot();
    if (this.batteryType === "IRON_BEAM") {
      this.fireIronBeamColumn();
    } else {
      this.spawnWeaponVolley();
    }
  }

  /** Instant column damage — no projectile body */
  private fireIronBeamColumn(): void {
    if (this.gameOver || this.currentAmmo <= 0) return;
    this.currentAmmo -= 1;
    this.emitAmmoState();
    void initAudio();
    playLaserZap();

    const px = this.player.x;
    const py = this.player.y - this.player.displayHeight * 0.36;
    const halfW = 22 + this.weaponPowerLevel * 14;
    const dmg = 1 + Math.floor(this.weaponPowerLevel / 2);
    const list = [...this.enemies.getChildren()] as BaseEnemy[];
    const impacts: { x: number; y: number }[] = [];

    for (const enemy of list) {
      if (!enemy.active) continue;
      if (Math.abs(enemy.x - px) > halfW) continue;
      if (enemy.y > py + 30) continue;
      const ex = enemy.x;
      const ey = enemy.y;
      const points = enemy.scoreValue;
      const spawnsDebris = enemy.spawnsDebrisOnKill;
      const wasBallistic = enemy instanceof BallisticEnemy;
      const ck = this.killCreditKind(enemy);
      impacts.push({ x: ex, y: ey });
      const killed = enemy.takeDamage(dmg);
      if (killed) {
        this.onEnemyKilledCore(ex, ey, points, spawnsDebris, wasBallistic, ck);
      }
    }

    for (const p of impacts) {
      this.beamSparkEmitter.explode(10, p.x, p.y);
    }

    const yGround = HEIGHT - 2;
    const yTip = py + 12;
    const baseThick = 5 + Math.min(8, this.weaponPowerLevel);
    const beamGfx = this.add.graphics();
    beamGfx.setDepth(97);
    beamGfx.setScrollFactor(0);

    const drawBeam = (w: number) => {
      beamGfx.clear();
      const outer = Math.max(2, w + 3);
      beamGfx.lineStyle(outer, 0x660000, 0.35);
      beamGfx.lineBetween(px, yGround, px, yTip);
      beamGfx.lineStyle(Math.max(1, w), 0xff2020, 0.98);
      beamGfx.lineBetween(px, yGround, px, yTip);
      beamGfx.lineStyle(Math.max(1, Math.floor(w * 0.4)), 0xffcccc, 0.65);
      beamGfx.lineBetween(px, yGround, px, yTip);
    };

    drawBeam(baseThick + Phaser.Math.Between(0, 1));
    this.time.addEvent({
      delay: 18,
      repeat: 7,
      callback: () => {
        drawBeam(baseThick + Phaser.Math.Between(-1, 2));
      },
    });
    this.time.delayedCall(168, () => {
      beamGfx.destroy();
    });

    if (this.currentAmmo === 0) {
      this.startReload();
    }
  }

  private spawnWeaponVolley(): void {
    const px = this.player.x;
    const py = this.player.y - this.player.displayHeight * 0.36;
    const t = this.batteryType;
    const lv = this.weaponPowerLevel;

    if (t === "IRON_DOME") {
      const want = Phaser.Math.Clamp(2 + Math.floor((lv - 1) / 2), 2, 4);
      const spread = want <= 2 ? 10 : want === 3 ? 14 : 18;
      for (let i = 0; i < want; i++) {
        if (this.currentAmmo <= 0) break;
        const tOff =
          want <= 1 ? 0 : ((i / (want - 1)) * 2 - 1) * spread;
        this.spawnIronProjectile(px + tOff, py, 0);
      }
    } else if (t === "DAVIDS_SLING") {
      const volley = Math.min(2 + Math.floor(lv / 2), 5);
      for (let i = 0; i < volley; i++) {
        if (this.currentAmmo <= 0) break;
        const dx = Phaser.Math.Between(-6, 6);
        const vx = Phaser.Math.Between(-52, 52);
        this.spawnSlingProjectile(px + dx, py, vx);
      }
    } else if (t === "ARROW" && this.currentAmmo >= 1) {
      this.spawnArrowProjectile(px, py, 1);
    }

    if (this.currentAmmo === 0) {
      this.startReload();
    }
  }

  private applySlingSplashDamage(
    cx: number,
    cy: number,
    exclude: BaseEnemy | null,
  ): void {
    const r = 92 + this.weaponPowerLevel * 22;
    const list = [...this.enemies.getChildren()] as BaseEnemy[];
    for (const e of list) {
      if (!e.active || e === exclude) continue;
      if (Phaser.Math.Distance.Between(e.x, e.y, cx, cy) > r) continue;
      const ex = e.x;
      const ey = e.y;
      const points = e.scoreValue;
      const spawnsDebris = e.spawnsDebrisOnKill;
      const wasBallistic = e instanceof BallisticEnemy;
      const ck = this.killCreditKind(e);
      if (e.takeDamage(1)) {
        this.onEnemyKilledCore(ex, ey, points, spawnsDebris, wasBallistic, ck);
      }
    }
  }

  private onEnemyKilledCore(
    ex: number,
    ey: number,
    points: number,
    spawnsDebris: boolean,
    wasBallistic: boolean,
    creditKind: "ballistic" | "uav" | "rocket",
  ): void {
    this.triggerExplosion(ex, ey);
    if (spawnsDebris) {
      this.spawnDebrisBurst(ex, ey);
    }
    this.addScore(points);
    this.awardCreditsForKillKind(creditKind);
    this.addJokerChargeFromKill();
    this.maybeSpawnPowerUp(wasBallistic, ex, ey);
    if (this.redAlertSwarmActive) {
      this.waveKillCount += 1;
      if (this.waveKillCount >= this.redAlertTargetKills) {
        this.waveKillCount = 0;
        this.redAlertSwarmActive = false;
        this.beginPostWaveSequence();
      }
    } else {
      this.waveKillCount += 1;
      const { config } = this.getEffectiveWaveConfig();
      if (this.waveKillCount >= config.targetKills) {
        this.waveKillCount = 0;
        this.beginPostWaveSequence();
      }
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
    const pu = new PowerUp(this, x, y, randomPowerUpKind());
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

    const kind = powerUp.powerUpKind;
    const mapped = POWER_UP_TO_BATTERY[kind];
    const wasSameWeapon = this.batteryType === mapped;
    const color = POWER_UP_DISPLAY_COLOR[kind];

    powerUp.destroy();
    void initAudio();
    if (wasSameWeapon) {
      playPowerUpLevelUp();
    } else {
      playPowerUp();
    }

    this.applyPowerUpFromKind(kind);
    this.flashPlayerUpgrade();

    if (wasSameWeapon) {
      this.showFloatingText(
        this.player.x,
        this.player.y - 52,
        `POWER LEVEL ${this.weaponPowerLevel}`,
        color,
      );
    } else {
      this.showFloatingText(
        this.player.x,
        this.player.y - 52,
        `${BATTERY_DISPLAY_NAME[this.batteryType]} · PWR ${this.weaponPowerLevel}`,
        color,
      );
    }
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
    if (type === "ballistic") {
      return new BallisticEnemy(
        this,
        x,
        y,
        speedScale,
        this.currentWave,
        (bx, by) => this.spawnMirvCluster(bx, by),
      );
    }
    if (type === "uav") return new UAVEnemy(this, x, y, speedScale);
    return new RocketEnemy(this, x, y, speedScale);
  }

  private spawnMirvCluster(x: number, y: number): void {
    const { enemySpeedScale } = this.getEffectiveWaveConfig();
    const n = this.currentWave < 10 ? 3 : Phaser.Math.Between(3, 5);
    for (let i = 0; i < n; i++) {
      const m = new MirvSubmunition(
        this,
        x + Phaser.Math.Between(-18, 18),
        y + Phaser.Math.Between(-10, 10),
        enemySpeedScale,
      );
      this.enemies.add(m);
    }
    this.markVisibleEnemySpawnPulse();
  }

  /** Re-arms the looping spawn clock after shop close or wave restart (not used on red-alert milestone waves). */
  private restartSpawnTimer(): void {
    this.spawnTimer?.remove();
    this.spawnTimer = this.time.addEvent({
      delay: this.currentSpawnDelayMs,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });
  }

  private beginRedAlertSwarm(): void {
    this.spawnTimer?.remove();
    this.spawnTimer = undefined;
    this.redAlertSwarmActive = true;
    this.waveKillCount = 0;
    const n = Phaser.Math.Between(30, 40);
    this.redAlertTargetKills = n;
    void initAudio();
    playRedAlertSiren();
    this.cameras.main.flash(320, 255, 30, 40);
    this.time.delayedCall(160, () => {
      if (this.gameOver) return;
      this.cameras.main.flash(240, 255, 45, 55);
    });
    const { enemySpeedScale } = this.getEffectiveWaveConfig();
    const margin = 42;
    const usable = WIDTH - margin * 2;
    for (let i = 0; i < n; i++) {
      const t = n <= 1 ? 0.5 : i / (n - 1);
      const x =
        margin +
        usable * t +
        Phaser.Math.Between(-14, 14);
      const y =
        -36 - (i % 14) * 12 - Phaser.Math.Between(0, 55);
      const useRocket = Math.random() < 0.52;
      const enemy = useRocket
        ? new RocketEnemy(this, x, y, enemySpeedScale * 1.08)
        : new UAVEnemy(this, x, y, enemySpeedScale * 1.06);
      this.enemies.add(enemy);
    }
    this.markVisibleEnemySpawnPulse();
    this.showFloatingText(
      WIDTH / 2,
      HEIGHT * 0.2,
      "RED ALERT — SWARM",
      "#ff3333",
    );
  }

  private playJetFlybySilhouette(): void {
    const g = this.add.graphics();
    g.setDepth(198);
    g.setScrollFactor(0);
    const draw = (gx: number) => {
      g.clear();
      g.fillStyle(0x121824, 0.93);
      g.fillTriangle(gx, 80, gx + 58, 62, gx + 50, 96);
      g.fillRect(gx + 50, 70, 46, 16);
      g.fillTriangle(gx + 96, 64, gx + 124, 80, gx + 96, 96);
      g.lineStyle(2, 0x3d4a62, 0.55);
      g.strokeTriangle(gx, 80, gx + 58, 62, gx + 50, 96);
    };
    const pos = { x: -150 };
    draw(pos.x);
    this.tweens.add({
      targets: pos,
      x: WIDTH + 150,
      duration: 2150,
      ease: "Sine.easeInOut",
      onUpdate: () => draw(pos.x),
      onComplete: () => g.destroy(),
    });
  }

  private useJoker(): void {
    if (this.gameOver || this.jokerKillCharge < JOKER_CHARGE_MAX) return;
    this.jokerKillCharge = 0;
    this.emitJokerChargeUi();
    void initAudio();
    playJetFlyby();
    this.playJetFlybySilhouette();
    this.time.delayedCall(880, () => {
      if (this.gameOver) return;
      playTacticalStrikeImpact();
      this.cameras.main.flash(480, 255, 248, 255);
      this.cameras.main.shake(720, 0.024);
      const enemyList = [...this.enemies.getChildren()] as BaseEnemy[];
      let scoreGain = 0;
      for (const enemy of enemyList) {
        if (!enemy.active) continue;
        const ex = enemy.x;
        const ey = enemy.y;
        const pts = enemy.scoreValue;
        this.triggerExplosion(ex, ey);
        scoreGain += pts;
        this.awardCreditsForKill(enemy);
        enemy.destroy();
      }
      this.addScore(scoreGain);
      if (this.redAlertSwarmActive) {
        this.redAlertSwarmActive = false;
        this.waveKillCount = 0;
        this.beginPostWaveSequence();
      }
      const projs = [...this.projectiles.getChildren()];
      for (const p of projs) {
        (p as Phaser.GameObjects.GameObject).destroy();
      }
      const debrisList = [...this.debris.getChildren()];
      for (const d of debrisList) {
        (d as Debris).destroy();
      }
    });
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
    this.jokerKillCharge = Math.min(
      JOKER_CHARGE_MAX,
      this.jokerKillCharge + 5,
    );
    this.emitJokerChargeUi();
    this.showFloatingText(
      this.player.x,
      this.player.y - 44,
      "+ STRIKE CHARGE",
      "#ffcc33",
    );
  }

  private spawnEnemy(): void {
    if (this.gameOver) return;
    if (this.redAlertSwarmActive) return;
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
      this.markVisibleEnemySpawnPulse();
      return;
    }

    const x = Phaser.Math.Between(margin, WIDTH - margin);
    const y = -48;
    const kind =
      config.forcedThreat && !config.swarm
        ? config.forcedThreat
        : this.pickEnemyType(config.weights);
    const enemy = this.createEnemyOfType(kind, x, y, enemySpeedScale);
    this.enemies.add(enemy);
    this.markVisibleEnemySpawnPulse();
  }

  private isProjectileGameObject(obj: Phaser.GameObjects.GameObject): boolean {
    if (!this.projectiles.contains(obj)) return false;
    return (
      obj instanceof Phaser.Physics.Arcade.Sprite ||
      obj instanceof Phaser.GameObjects.Rectangle
    );
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

    if (!projectile || !enemy || !this.isProjectileGameObject(projectile)) {
      return;
    }

    const points = enemy.scoreValue;
    const ex = enemy.x;
    const ey = enemy.y;
    const wasBallistic = enemy instanceof BallisticEnemy;
    const spawnsDebris = enemy.spawnsDebrisOnKill;
    const creditKind = this.killCreditKind(enemy);

    const piercing = Boolean(
      projectile.getData(PROJECTILE_DATA_KEY.PIERCING),
    );

    const bat = projectile.getData(PROJECTILE_DATA_KEY.BATTERY) as
      | BatteryType
      | undefined;

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

    let damage = piercing ? 999 : 1;
    if (bat === "ARROW" && enemy instanceof BallisticEnemy) {
      damage = 999;
    }

    const killed = enemy.takeDamage(damage);

    if (bat === "DAVIDS_SLING") {
      this.applySlingSplashDamage(ex, ey, killed ? null : enemy);
    }

    if (killed) {
      this.onEnemyKilledCore(
        ex,
        ey,
        points,
        spawnsDebris,
        wasBallistic,
        creditKind,
      );
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

import * as Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/game/config/dimensions";
import { TextureKeys } from "@/game/assets/textureKeys";

function gen(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (g: Phaser.GameObjects.Graphics) => void,
): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: -4096, y: -4096 });
  g.setVisible(false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

function drawIsraelMap(g: Phaser.GameObjects.Graphics): void {
  const w = GAME_WIDTH;
  const h = GAME_HEIGHT;
  g.fillStyle(0x1e4a6e, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(0x2d6aa3, 0.9);
  g.fillEllipse(120, h * 0.45, 280, h * 0.95);

  g.fillStyle(0xc4b27a, 1);
  g.fillEllipse(w * 0.58, h * 0.42, w * 0.52, h * 0.62);
  g.fillStyle(0xa89868, 1);
  g.fillEllipse(w * 0.52, h * 0.5, w * 0.22, h * 0.38);

  g.fillStyle(0x5a8f4a, 0.45);
  g.fillEllipse(w * 0.62, h * 0.32, w * 0.2, h * 0.14);
  g.fillEllipse(w * 0.45, h * 0.36, w * 0.12, h * 0.1);

  g.fillStyle(0x3a6a8a, 0.55);
  g.fillEllipse(w * 0.56, h * 0.52, 36, 72);

  g.lineStyle(2, 0x8a7a58, 0.5);
  for (let i = 0; i < 5; i++) {
    g.strokeEllipse(
      w * 0.58 + i * 3,
      h * 0.42,
      w * 0.52 - i * 8,
      h * 0.62 - i * 6,
    );
  }

  g.lineStyle(1, 0x6bffb3, 0.12);
  for (let i = 0; i < 24; i++) {
    const gx = Phaser.Math.Between(40, w - 40);
    const gy = Phaser.Math.Between(40, h - 100);
    g.strokeCircle(gx, gy, Phaser.Math.Between(2, 5));
  }
}

function drawCityStrip(g: Phaser.GameObjects.Graphics): void {
  const w = GAME_WIDTH;
  const h = 140;
  const skyH = 28;
  g.fillStyle(0x0a1528, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(0x152238, 1);
  g.fillRect(0, 0, w, skyH);

  const baseY = skyH + 8;
  let x = 0;
  while (x < w) {
    const bw = Phaser.Math.Between(18, 42);
    const bh = Phaser.Math.Between(35, h - baseY + 20);
    const by = h - bh;
    g.fillStyle(Phaser.Math.RND.pick([0x1a2233, 0x222a3a, 0x182030]), 1);
    g.fillRect(x, by, bw - 2, bh);
    g.fillStyle(0xffe066, 0.35);
    for (let wy = by + 6; wy < by + bh - 4; wy += 9) {
      for (let wx = x + 4; wx < x + bw - 8; wx += 10) {
        if (Math.random() > 0.35) {
          g.fillRect(wx, wy, 3, 4);
        }
      }
    }
    x += bw;
  }
  g.fillStyle(0x050a12, 0.65);
  g.fillRect(0, h - 6, w, 6);
}

function drawIronDome(g: Phaser.GameObjects.Graphics): void {
  const w = 96;
  const h = 72;
  g.fillStyle(0x3d4a38, 1);
  g.fillRect(12, 44, 72, 22);
  g.fillStyle(0x2a3328, 1);
  g.fillRect(8, 50, 16, 14);
  g.fillStyle(0x5a6b52, 1);
  g.fillRect(20, 38, 56, 12);
  g.fillStyle(0x8a9a88, 1);
  g.fillCircle(48, 34, 18);
  g.fillStyle(0x6a7a68, 1);
  g.fillCircle(48, 34, 12);
  g.lineStyle(2, 0xbfd4c4, 0.85);
  g.strokeCircle(48, 34, 18);
  g.lineStyle(1, 0x223322, 0.9);
  g.beginPath();
  g.moveTo(48, 16);
  g.lineTo(52, 28);
  g.lineTo(44, 28);
  g.closePath();
  g.fillPath();
}

function drawMissileTamir(g: Phaser.GameObjects.Graphics): void {
  const w = 12;
  const h = 36;
  g.fillStyle(0xe8ece8, 1);
  g.fillRect(3, 6, 6, 24);
  g.fillStyle(0xffaa22, 1);
  g.fillTriangle(6, 0, 2, 10, 10, 10);
  g.fillStyle(0x444455, 1);
  g.fillRect(2, 28, 8, 8);
  g.fillStyle(0x6688aa, 0.8);
  g.fillRect(0, 22, 3, 6);
  g.fillRect(9, 22, 3, 6);
}

function drawMissileStunner(g: Phaser.GameObjects.Graphics): void {
  const w = 14;
  const h = 28;
  g.fillStyle(0x88aa44, 1);
  g.fillRect(3, 8, 8, 16);
  g.fillStyle(0xccdd66, 1);
  g.fillTriangle(7, 2, 3, 12, 11, 12);
  g.fillStyle(0x334422, 1);
  g.fillRect(2, 22, 10, 6);
  g.fillStyle(0xaaccff, 0.6);
  g.fillEllipse(7, 18, 10, 4);
}

function drawMissileArrow(g: Phaser.GameObjects.Graphics): void {
  const w = 18;
  const h = 48;
  g.fillStyle(0x88aacc, 1);
  g.fillRect(5, 14, 8, 28);
  g.fillStyle(0x223344, 1);
  g.fillRect(5, 22, 8, 4);
  g.fillRect(5, 30, 8, 4);
  g.fillStyle(0xddeeff, 1);
  g.fillTriangle(9, 0, 4, 16, 14, 16);
  g.fillStyle(0xff6622, 0.9);
  g.fillTriangle(9, 40, 5, 48, 13, 48);
}

function drawGradRocket(g: Phaser.GameObjects.Graphics): void {
  const w = 14;
  const h = 40;
  g.fillStyle(0x8b4513, 1);
  g.fillRect(4, 14, 6, 22);
  g.fillStyle(0xcc2222, 1);
  g.fillTriangle(7, 0, 2, 18, 12, 18);
  g.fillStyle(0x333333, 1);
  g.fillRect(2, 32, 10, 8);
  g.fillStyle(0xaa6644, 1);
  g.fillTriangle(1, 20, 1, 28, 4, 24);
  g.fillTriangle(13, 20, 13, 28, 10, 24);
}

function drawUav(g: Phaser.GameObjects.Graphics): void {
  const w = 48;
  const h = 28;
  g.fillStyle(0x5a5a62, 1);
  g.fillEllipse(24, 14, 36, 10);
  g.fillStyle(0x3a3a44, 1);
  g.fillRect(18, 10, 12, 10);
  g.fillTriangle(8, 14, 0, 18, 8, 22);
  g.fillTriangle(40, 14, 48, 18, 40, 22);
  g.fillStyle(0x8899aa, 0.5);
  g.fillEllipse(24, 14, 8, 6);
}

function drawBallistic(g: Phaser.GameObjects.Graphics): void {
  const w = 32;
  const h = 64;
  g.fillStyle(0xdddddd, 1);
  g.fillRect(10, 12, 12, 44);
  g.fillStyle(0xaa2222, 1);
  g.fillTriangle(16, 0, 8, 16, 24, 16);
  g.fillStyle(0x444455, 1);
  g.fillRect(8, 50, 16, 14);
  g.fillStyle(0xffaa44, 0.85);
  g.fillTriangle(16, 56, 12, 64, 20, 64);
  g.lineStyle(1, 0x888899, 0.8);
  g.strokeRect(10, 20, 12, 30);
}

function drawMirv(g: Phaser.GameObjects.Graphics): void {
  const w = 10;
  const h = 26;
  g.fillStyle(0xcccccc, 1);
  g.fillRect(2, 6, 6, 16);
  g.fillStyle(0xff3333, 1);
  g.fillTriangle(5, 0, 1, 8, 9, 8);
  g.fillStyle(0x333344, 1);
  g.fillRect(1, 20, 8, 6);
}

function drawParticle(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0xffffff, 1);
  g.fillCircle(8, 8, 7);
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(8, 8, 4);
}

/** Ensures all gameplay textures exist (used when PNGs were not loaded). */
export function ensureMilitaryTextures(scene: Phaser.Scene): void {
  gen(scene, TextureKeys.bgIsrael, GAME_WIDTH, GAME_HEIGHT, drawIsraelMap);
  gen(scene, TextureKeys.cityIsrael, GAME_WIDTH, 140, drawCityStrip);
  gen(scene, TextureKeys.ironDomeBattery, 96, 72, drawIronDome);
  gen(scene, TextureKeys.missileTamir, 12, 36, drawMissileTamir);
  gen(scene, TextureKeys.missileStunner, 14, 28, drawMissileStunner);
  gen(scene, TextureKeys.missileArrow, 18, 48, drawMissileArrow);
  gen(scene, TextureKeys.enemyGrad, 14, 40, drawGradRocket);
  gen(scene, TextureKeys.enemyUav, 48, 28, drawUav);
  gen(scene, TextureKeys.enemyBallistic, 32, 64, drawBallistic);
  gen(scene, TextureKeys.mirvWarhead, 10, 26, drawMirv);
  gen(scene, TextureKeys.particle, 16, 16, drawParticle);
}

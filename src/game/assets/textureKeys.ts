/**
 * Texture keys used by Phaser. Optional PNGs in /public/game/assets/ (see ASSET_MANIFEST).
 * If a file is missing, PreloadScene generates a stylized fallback.
 */
export const TextureKeys = {
  bgIsrael: "asset_bg_israel",
  cityIsrael: "asset_city_israel",
  ironDomeBattery: "asset_iron_dome_battery",
  missileTamir: "asset_missile_tamir",
  missileStunner: "asset_missile_stunner",
  missileArrow: "asset_missile_arrow",
  enemyGrad: "asset_enemy_grad_rocket",
  enemyUav: "asset_enemy_uav",
  enemyBallistic: "asset_enemy_ballistic",
  mirvWarhead: "asset_mirv_warhead",
  particle: "asset_particle",
} as const;

export type TextureKey = (typeof TextureKeys)[keyof typeof TextureKeys];

/** Filenames expected under public/game/assets/ */
export const ASSET_MANIFEST: { key: TextureKey; file: string }[] = [
  { key: TextureKeys.bgIsrael, file: "bg-israel-map.png" },
  { key: TextureKeys.cityIsrael, file: "city-israel-buildings.png" },
  { key: TextureKeys.ironDomeBattery, file: "iron-dome-battery.png" },
  { key: TextureKeys.missileTamir, file: "missile-tamir.png" },
  { key: TextureKeys.missileStunner, file: "missile-stunner.png" },
  { key: TextureKeys.missileArrow, file: "missile-arrow.png" },
  { key: TextureKeys.enemyGrad, file: "enemy-grad-rocket.png" },
  { key: TextureKeys.enemyUav, file: "enemy-uav.png" },
  { key: TextureKeys.enemyBallistic, file: "enemy-ballistic-missile.png" },
];

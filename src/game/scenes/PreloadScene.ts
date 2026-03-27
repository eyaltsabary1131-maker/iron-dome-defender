import * as Phaser from "phaser";
import { ASSET_MANIFEST } from "@/game/assets/textureKeys";
import { ensureMilitaryTextures } from "@/game/assets/generateMilitaryTextures";

/**
 * Loads optional PNGs from /public/game/assets/ (see ASSET_MANIFEST filenames).
 * Missing files fall back to procedural textures in create().
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloadScene" });
  }

  preload(): void {
    for (const { key, file } of ASSET_MANIFEST) {
      this.load.image(key, `/game/assets/${file}`);
    }
  }

  create(): void {
    ensureMilitaryTextures(this);
    this.scene.start("MainScene");
  }
}

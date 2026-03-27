import type { BatteryType } from "@/game/batteryTypes";
import type { ShopUpgradeId } from "@/game/config/economyConfig";

export const GAME_EVENTS = {
  SCORE_UPDATED: "SCORE_UPDATED",
  CITY_HIT: "CITY_HIT",
  GAME_OVER: "GAME_OVER",
  GAME_RESET: "GAME_RESET",
  WEAPON_UPGRADED: "WEAPON_UPGRADED",
  WAVE_CHANGED: "WAVE_CHANGED",
  AMMO_UPDATED: "AMMO_UPDATED",
  JOKERS_UPDATED: "JOKERS_UPDATED",
  REQUEST_USE_JOKER: "REQUEST_USE_JOKER",
  CREDITS_UPDATED: "CREDITS_UPDATED",
  SHOP_PANEL_UPDATED: "SHOP_PANEL_UPDATED",
  SHOP_PURCHASE_REQUEST: "SHOP_PURCHASE_REQUEST",
  SHOP_CONTINUE_REQUEST: "SHOP_CONTINUE_REQUEST",
  STRATEGIC_ASSETS_UPDATED: "STRATEGIC_ASSETS_UPDATED",
  GAME_OVER_DEBRIEF: "GAME_OVER_DEBRIEF",
} as const;

type ScoreDetail = { score: number };
type CityDetail = { cityIntegrity: number };
export type WeaponDetail = {
  batteryName: string;
  batteryType: BatteryType;
  /** Chicken Invaders–style combo level (1–5) */
  powerLevel: number;
};
type WaveDetail = { wave: number };
export type AmmoDetail = {
  currentAmmo: number;
  maxAmmo: number;
  isReloading: boolean;
  /** 0–1 while `isReloading`; omitted when idle */
  reloadProgress?: number;
};

export type JokerChargeDetail = {
  charge: number;
  maxCharge: number;
  ready: boolean;
};
type CreditsDetail = { credits: number };

export type ShopPanelDetail = {
  open: boolean;
  credits: number;
  waveJustCompleted: number;
  rapidReloadLevel: number;
  extendedMagLevel: number;
  propulsionLevel: number;
  hearts: number;
  maxHearts: number;
};

export type StrategicAssetsDetail = {
  powerPlantHp: number;
  militaryBaseHp: number;
  maxHp: number;
  gridOffline: boolean;
  logisticsDamaged: boolean;
};

export type GameOverDebriefDetail = {
  finalScore: number;
  finalWave: number;
  /** HVT sites still operational (0–2). */
  strategicAssetsIntact: number;
  /** Full waves finished before mission failure. */
  wavesCleared: number;
};

const bus = new EventTarget();

export function emitScoreUpdated(score: number): void {
  bus.dispatchEvent(
    new CustomEvent<ScoreDetail>(GAME_EVENTS.SCORE_UPDATED, {
      detail: { score },
    }),
  );
}

export function emitCityHit(cityIntegrity: number): void {
  bus.dispatchEvent(
    new CustomEvent<CityDetail>(GAME_EVENTS.CITY_HIT, {
      detail: { cityIntegrity },
    }),
  );
}

export function emitGameOver(): void {
  bus.dispatchEvent(new CustomEvent(GAME_EVENTS.GAME_OVER));
}

export function emitGameOverDebrief(detail: GameOverDebriefDetail): void {
  bus.dispatchEvent(
    new CustomEvent<GameOverDebriefDetail>(GAME_EVENTS.GAME_OVER_DEBRIEF, {
      detail,
    }),
  );
}

export function emitGameReset(): void {
  bus.dispatchEvent(new CustomEvent(GAME_EVENTS.GAME_RESET));
}

export function emitWeaponUpgraded(detail: WeaponDetail): void {
  bus.dispatchEvent(
    new CustomEvent<WeaponDetail>(GAME_EVENTS.WEAPON_UPGRADED, {
      detail,
    }),
  );
}

export function emitWaveChanged(wave: number): void {
  bus.dispatchEvent(
    new CustomEvent<WaveDetail>(GAME_EVENTS.WAVE_CHANGED, {
      detail: { wave },
    }),
  );
}

export function emitAmmoUpdated(detail: AmmoDetail): void {
  bus.dispatchEvent(
    new CustomEvent<AmmoDetail>(GAME_EVENTS.AMMO_UPDATED, {
      detail,
    }),
  );
}

export function emitJokersUpdated(detail: JokerChargeDetail): void {
  bus.dispatchEvent(
    new CustomEvent<JokerChargeDetail>(GAME_EVENTS.JOKERS_UPDATED, {
      detail,
    }),
  );
}

export function emitRequestUseJoker(): void {
  bus.dispatchEvent(new CustomEvent(GAME_EVENTS.REQUEST_USE_JOKER));
}

export function emitCreditsUpdated(credits: number): void {
  bus.dispatchEvent(
    new CustomEvent<CreditsDetail>(GAME_EVENTS.CREDITS_UPDATED, {
      detail: { credits },
    }),
  );
}

export function emitShopPanelUpdated(detail: ShopPanelDetail): void {
  bus.dispatchEvent(
    new CustomEvent<ShopPanelDetail>(GAME_EVENTS.SHOP_PANEL_UPDATED, {
      detail,
    }),
  );
}

export function emitShopPurchaseRequest(id: ShopUpgradeId): void {
  bus.dispatchEvent(
    new CustomEvent<{ id: ShopUpgradeId }>(GAME_EVENTS.SHOP_PURCHASE_REQUEST, {
      detail: { id },
    }),
  );
}

export function emitShopContinueRequest(): void {
  bus.dispatchEvent(new CustomEvent(GAME_EVENTS.SHOP_CONTINUE_REQUEST));
}

export function emitStrategicAssetsUpdated(
  detail: StrategicAssetsDetail,
): void {
  bus.dispatchEvent(
    new CustomEvent<StrategicAssetsDetail>(
      GAME_EVENTS.STRATEGIC_ASSETS_UPDATED,
      { detail },
    ),
  );
}

export function subscribeGameEvents(handlers: {
  onScoreUpdated?: (score: number) => void;
  onCityHit?: (cityIntegrity: number) => void;
  onGameOver?: () => void;
  onGameOverDebrief?: (detail: GameOverDebriefDetail) => void;
  onGameReset?: () => void;
  onWeaponUpgraded?: (detail: WeaponDetail) => void;
  onWaveChanged?: (wave: number) => void;
  onAmmoUpdated?: (detail: AmmoDetail) => void;
  onJokersUpdated?: (detail: JokerChargeDetail) => void;
  onCreditsUpdated?: (credits: number) => void;
  onShopPanelUpdated?: (detail: ShopPanelDetail) => void;
  onStrategicAssetsUpdated?: (detail: StrategicAssetsDetail) => void;
}): () => void {
  const onScore = (e: Event) => {
    const ce = e as CustomEvent<ScoreDetail>;
    handlers.onScoreUpdated?.(ce.detail.score);
  };
  const onCity = (e: Event) => {
    const ce = e as CustomEvent<CityDetail>;
    handlers.onCityHit?.(ce.detail.cityIntegrity);
  };
  const onOver = () => handlers.onGameOver?.();
  const onDebrief = (e: Event) => {
    const ce = e as CustomEvent<GameOverDebriefDetail>;
    handlers.onGameOverDebrief?.(ce.detail);
  };
  const onReset = () => handlers.onGameReset?.();
  const onWeapon = (e: Event) => {
    const ce = e as CustomEvent<WeaponDetail>;
    handlers.onWeaponUpgraded?.(ce.detail);
  };
  const onWave = (e: Event) => {
    const ce = e as CustomEvent<WaveDetail>;
    handlers.onWaveChanged?.(ce.detail.wave);
  };
  const onAmmo = (e: Event) => {
    const ce = e as CustomEvent<AmmoDetail>;
    handlers.onAmmoUpdated?.(ce.detail);
  };
  const onJokers = (e: Event) => {
    const ce = e as CustomEvent<JokerChargeDetail>;
    handlers.onJokersUpdated?.(ce.detail);
  };
  const onCredits = (e: Event) => {
    const ce = e as CustomEvent<CreditsDetail>;
    handlers.onCreditsUpdated?.(ce.detail.credits);
  };
  const onShopPanel = (e: Event) => {
    const ce = e as CustomEvent<ShopPanelDetail>;
    handlers.onShopPanelUpdated?.(ce.detail);
  };
  const onStrategic = (e: Event) => {
    const ce = e as CustomEvent<StrategicAssetsDetail>;
    handlers.onStrategicAssetsUpdated?.(ce.detail);
  };
  bus.addEventListener(GAME_EVENTS.SCORE_UPDATED, onScore);
  bus.addEventListener(GAME_EVENTS.CITY_HIT, onCity);
  bus.addEventListener(GAME_EVENTS.GAME_OVER, onOver);
  bus.addEventListener(GAME_EVENTS.GAME_OVER_DEBRIEF, onDebrief);
  bus.addEventListener(GAME_EVENTS.GAME_RESET, onReset);
  bus.addEventListener(GAME_EVENTS.WEAPON_UPGRADED, onWeapon);
  bus.addEventListener(GAME_EVENTS.WAVE_CHANGED, onWave);
  bus.addEventListener(GAME_EVENTS.AMMO_UPDATED, onAmmo);
  bus.addEventListener(GAME_EVENTS.JOKERS_UPDATED, onJokers);
  bus.addEventListener(GAME_EVENTS.CREDITS_UPDATED, onCredits);
  bus.addEventListener(GAME_EVENTS.SHOP_PANEL_UPDATED, onShopPanel);
  bus.addEventListener(GAME_EVENTS.STRATEGIC_ASSETS_UPDATED, onStrategic);
  return () => {
    bus.removeEventListener(GAME_EVENTS.SCORE_UPDATED, onScore);
    bus.removeEventListener(GAME_EVENTS.CITY_HIT, onCity);
    bus.removeEventListener(GAME_EVENTS.GAME_OVER, onOver);
    bus.removeEventListener(GAME_EVENTS.GAME_OVER_DEBRIEF, onDebrief);
    bus.removeEventListener(GAME_EVENTS.GAME_RESET, onReset);
    bus.removeEventListener(GAME_EVENTS.WEAPON_UPGRADED, onWeapon);
    bus.removeEventListener(GAME_EVENTS.WAVE_CHANGED, onWave);
    bus.removeEventListener(GAME_EVENTS.AMMO_UPDATED, onAmmo);
    bus.removeEventListener(GAME_EVENTS.JOKERS_UPDATED, onJokers);
    bus.removeEventListener(GAME_EVENTS.CREDITS_UPDATED, onCredits);
    bus.removeEventListener(GAME_EVENTS.SHOP_PANEL_UPDATED, onShopPanel);
    bus.removeEventListener(GAME_EVENTS.STRATEGIC_ASSETS_UPDATED, onStrategic);
  };
}

export function subscribeShopPurchaseRequest(
  handler: (id: ShopUpgradeId) => void,
): () => void {
  const fn = (e: Event) => {
    const ce = e as CustomEvent<{ id: ShopUpgradeId }>;
    handler(ce.detail.id);
  };
  bus.addEventListener(GAME_EVENTS.SHOP_PURCHASE_REQUEST, fn);
  return () => bus.removeEventListener(GAME_EVENTS.SHOP_PURCHASE_REQUEST, fn);
}

export function subscribeShopContinueRequest(handler: () => void): () => void {
  const fn = () => handler();
  bus.addEventListener(GAME_EVENTS.SHOP_CONTINUE_REQUEST, fn);
  return () => bus.removeEventListener(GAME_EVENTS.SHOP_CONTINUE_REQUEST, fn);
}

export function subscribeRequestUseJoker(handler: () => void): () => void {
  const fn = () => handler();
  bus.addEventListener(GAME_EVENTS.REQUEST_USE_JOKER, fn);
  return () => bus.removeEventListener(GAME_EVENTS.REQUEST_USE_JOKER, fn);
}

export function subscribeGameReset(handler: () => void): () => void {
  const fn = () => handler();
  bus.addEventListener(GAME_EVENTS.GAME_RESET, fn);
  return () => bus.removeEventListener(GAME_EVENTS.GAME_RESET, fn);
}

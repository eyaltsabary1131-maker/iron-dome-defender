import type { BatteryType } from "@/game/batteryTypes";

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
} as const;

type ScoreDetail = { score: number };
type CityDetail = { cityIntegrity: number };
export type WeaponDetail = {
  batteryName: string;
  batteryType: BatteryType;
};
type WaveDetail = { wave: number };
export type AmmoDetail = {
  currentAmmo: number;
  maxAmmo: number;
  isReloading: boolean;
};

type JokersDetail = { jokers: number };

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

export function emitJokersUpdated(jokers: number): void {
  bus.dispatchEvent(
    new CustomEvent<JokersDetail>(GAME_EVENTS.JOKERS_UPDATED, {
      detail: { jokers },
    }),
  );
}

export function emitRequestUseJoker(): void {
  bus.dispatchEvent(new CustomEvent(GAME_EVENTS.REQUEST_USE_JOKER));
}

export function subscribeGameEvents(handlers: {
  onScoreUpdated?: (score: number) => void;
  onCityHit?: (cityIntegrity: number) => void;
  onGameOver?: () => void;
  onGameReset?: () => void;
  onWeaponUpgraded?: (detail: WeaponDetail) => void;
  onWaveChanged?: (wave: number) => void;
  onAmmoUpdated?: (detail: AmmoDetail) => void;
  onJokersUpdated?: (jokers: number) => void;
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
    const ce = e as CustomEvent<JokersDetail>;
    handlers.onJokersUpdated?.(ce.detail.jokers);
  };
  bus.addEventListener(GAME_EVENTS.SCORE_UPDATED, onScore);
  bus.addEventListener(GAME_EVENTS.CITY_HIT, onCity);
  bus.addEventListener(GAME_EVENTS.GAME_OVER, onOver);
  bus.addEventListener(GAME_EVENTS.GAME_RESET, onReset);
  bus.addEventListener(GAME_EVENTS.WEAPON_UPGRADED, onWeapon);
  bus.addEventListener(GAME_EVENTS.WAVE_CHANGED, onWave);
  bus.addEventListener(GAME_EVENTS.AMMO_UPDATED, onAmmo);
  bus.addEventListener(GAME_EVENTS.JOKERS_UPDATED, onJokers);
  return () => {
    bus.removeEventListener(GAME_EVENTS.SCORE_UPDATED, onScore);
    bus.removeEventListener(GAME_EVENTS.CITY_HIT, onCity);
    bus.removeEventListener(GAME_EVENTS.GAME_OVER, onOver);
    bus.removeEventListener(GAME_EVENTS.GAME_RESET, onReset);
    bus.removeEventListener(GAME_EVENTS.WEAPON_UPGRADED, onWeapon);
    bus.removeEventListener(GAME_EVENTS.WAVE_CHANGED, onWave);
    bus.removeEventListener(GAME_EVENTS.AMMO_UPDATED, onAmmo);
    bus.removeEventListener(GAME_EVENTS.JOKERS_UPDATED, onJokers);
  };
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

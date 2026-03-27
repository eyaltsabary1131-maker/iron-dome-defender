"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  emitGameReset,
  emitRequestUseJoker,
  emitShopContinueRequest,
  emitShopPurchaseRequest,
  subscribeGameEvents,
  type AmmoDetail,
  type GameOverDebriefDetail,
  type JokerChargeDetail,
  type ShopPanelDetail,
  type StrategicAssetsDetail,
  type WeaponDetail,
} from "@/game/events/gameEvents";
import { getRankFromScore } from "@/game/ranks";
import { Leaderboard } from "@/components/game/Leaderboard";
import { LAUNCHER_MAG_CAPACITY } from "@/game/batteryTypes";
import {
  ECONOMY,
  type ShopUpgradeId,
} from "@/game/config/economyConfig";
import { PROTECTION_BONUS_CREDITS, STRATEGIC_ASSETS } from "@/game/config/strategicAssets";
import {
  initAudio,
  isAudioMuted,
  playWaveAlert,
  setAudioMuted,
} from "@/game/utils/SynthAudio";

const DEFAULT_WEAPON: WeaponDetail = {
  batteryName: "IRON DOME",
  batteryType: "IRON_DOME",
  powerLevel: 1,
};

const CLOSED_SHOP: ShopPanelDetail = {
  open: false,
  credits: 0,
  waveJustCompleted: 0,
  rapidReloadLevel: 0,
  extendedMagLevel: 0,
  propulsionLevel: 0,
  hearts: ECONOMY.MAX_HEARTS,
  maxHearts: ECONOMY.MAX_HEARTS,
};

const DEFAULT_STRATEGIC: StrategicAssetsDetail = {
  powerPlantHp: 2,
  militaryBaseHp: 2,
  maxHp: 2,
  gridOffline: false,
  logisticsDamaged: false,
};

const DEFAULT_TACTICAL_STRIKE: JokerChargeDetail = {
  charge: 0,
  maxCharge: 20,
  ready: false,
};

const mono =
  "var(--font-share-tech-mono), 'Share Tech Mono', Consolas, monospace";

function ArmoryTile({
  icon,
  title,
  subtitle,
  cost,
  disabled,
  upgradeId,
}: {
  icon: string;
  title: string;
  subtitle: string;
  cost: number;
  disabled: boolean;
  upgradeId: ShopUpgradeId;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => emitShopPurchaseRequest(upgradeId)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        textAlign: "center",
        gap: 6,
        padding: "14px 10px 12px",
        minHeight: 148,
        fontFamily: mono,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.42 : 1,
        border: "2px solid rgba(57,255,20,0.35)",
        borderRadius: 3,
        background: disabled
          ? "rgba(0,12,6,0.55)"
          : "linear-gradient(165deg, rgba(0,32,14,0.92) 0%, rgba(0,18,8,0.88) 100%)",
        boxShadow: disabled
          ? "none"
          : "inset 0 0 20px rgba(57,255,20,0.06), 0 0 12px rgba(57,255,20,0.12)",
        color: "#39ff14",
      }}
    >
      <span style={{ fontSize: 36, lineHeight: 1, filter: "drop-shadow(0 0 6px rgba(57,255,20,0.4))" }}>
        {icon}
      </span>
      <span
        style={{
          fontWeight: 900,
          letterSpacing: "0.12em",
          fontSize: 11,
          color: "#b8ffc8",
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontSize: 9,
          opacity: 0.78,
          lineHeight: 1.35,
          letterSpacing: "0.04em",
          maxWidth: 140,
        }}
      >
        {subtitle}
      </span>
      <span
        style={{
          marginTop: "auto",
          fontSize: 12,
          fontWeight: 800,
          color: "#ffbf00",
          letterSpacing: "0.08em",
        }}
      >
        {cost} CR
      </span>
    </button>
  );
}

export function GameHUD() {
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState<number>(ECONOMY.MAX_HEARTS);
  const [weapon, setWeapon] = useState<WeaponDetail>(DEFAULT_WEAPON);
  const [wave, setWave] = useState(1);
  const [ammo, setAmmo] = useState<AmmoDetail>({
    currentAmmo: LAUNCHER_MAG_CAPACITY,
    maxAmmo: LAUNCHER_MAG_CAPACITY,
    isReloading: false,
  });
  const [lowAmmoPulse, setLowAmmoPulse] = useState(true);
  const [tacticalStrike, setTacticalStrike] =
    useState<JokerChargeDetail>(DEFAULT_TACTICAL_STRIKE);
  const [gameOver, setGameOver] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [audioMuted, setAudioMutedState] = useState(() => isAudioMuted());

  const [waveBannerSeq, setWaveBannerSeq] = useState(0);
  const [waveBannerOpacity, setWaveBannerOpacity] = useState(0);
  const [credits, setCredits] = useState(0);
  const [shop, setShop] = useState<ShopPanelDetail>(CLOSED_SHOP);
  const [strategic, setStrategic] =
    useState<StrategicAssetsDetail>(DEFAULT_STRATEGIC);
  const [missionDebrief, setMissionDebrief] =
    useState<GameOverDebriefDetail | null>(null);
  const [pwrLevelFlash, setPwrLevelFlash] = useState(false);
  const lastPowerLevelRef = useRef(1);

  useEffect(() => {
    if (weapon.powerLevel > lastPowerLevelRef.current) {
      setPwrLevelFlash(true);
      lastPowerLevelRef.current = weapon.powerLevel;
      const id = window.setTimeout(() => setPwrLevelFlash(false), 520);
      return () => window.clearTimeout(id);
    }
    lastPowerLevelRef.current = weapon.powerLevel;
  }, [weapon.powerLevel]);

  useEffect(() => {
    return subscribeGameEvents({
      onScoreUpdated: setScore,
      onCityHit: setHearts,
      onGameOver: () => setGameOver(true),
      onGameOverDebrief: setMissionDebrief,
      onGameReset: () => {
        setGameOver(false);
        setMissionDebrief(null);
        lastPowerLevelRef.current = 1;
        setPwrLevelFlash(false);
        setWeapon(DEFAULT_WEAPON);
        setTacticalStrike(DEFAULT_TACTICAL_STRIKE);
        setCredits(0);
        setShop(CLOSED_SHOP);
        setStrategic(DEFAULT_STRATEGIC);
        setHearts(ECONOMY.MAX_HEARTS);
        setAmmo({
          currentAmmo: LAUNCHER_MAG_CAPACITY,
          maxAmmo: LAUNCHER_MAG_CAPACITY,
          isReloading: false,
        });
      },
      onCreditsUpdated: setCredits,
      onShopPanelUpdated: setShop,
      onStrategicAssetsUpdated: setStrategic,
      onWeaponUpgraded: setWeapon,
      onAmmoUpdated: setAmmo,
      onJokersUpdated: setTacticalStrike,
      onWaveChanged: (w) => {
        setWave(w);
        setWaveBannerSeq((s) => s + 1);
      },
    });
  }, []);

  useEffect(() => {
    if (waveBannerSeq === 0) return;
    setWaveBannerOpacity(1);
    const fade = setTimeout(() => setWaveBannerOpacity(0), 3000);
    const remove = setTimeout(() => setWaveBannerSeq(0), 3500);
    return () => {
      clearTimeout(fade);
      clearTimeout(remove);
    };
  }, [waveBannerSeq]);

  useEffect(() => {
    const low =
      ammo.currentAmmo < 5 && ammo.currentAmmo > 0 && !ammo.isReloading && !gameOver;
    if (!low) return;
    const id = window.setInterval(() => setLowAmmoPulse((p) => !p), 380);
    return () => window.clearInterval(id);
  }, [ammo.currentAmmo, ammo.isReloading, gameOver]);

  const unlockAudio = useCallback(() => {
    void initAudio().then(() => {
      playWaveAlert();
      setAudioReady(true);
    });
  }, []);

  useEffect(() => {
    if (audioReady) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        unlockAudio();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [audioReady, unlockAudio]);

  const rankLive = getRankFromScore(score);

  const toggleMute = useCallback(() => {
    const next = !isAudioMuted();
    setAudioMuted(next);
    setAudioMutedState(next);
  }, []);

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 7,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 72% 68% at 50% 46%, transparent 0%, rgba(0,0,0,0.42) 72%, rgba(0,0,0,0.72) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 6,
          pointerEvents: "none",
          fontFamily: mono,
          fontSize: 13,
          fontWeight: 700,
          color: "#39ff14",
          letterSpacing: "0.04em",
          textShadow:
            "0 0 8px rgba(57, 255, 20, 0.35), 0 1px 4px rgba(0,0,0,0.9)",
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={toggleMute}
          aria-label={audioMuted ? "Unmute sound" : "Mute sound"}
          title={audioMuted ? "Unmute" : "Mute"}
          style={{
            position: "absolute",
            top: 8,
            right: 12,
            zIndex: 12,
            pointerEvents: "auto",
            width: 36,
            height: 32,
            padding: 0,
            margin: 0,
            border: "1px solid rgba(127,216,255,0.35)",
            borderRadius: 4,
            background: "rgba(0,18,12,0.75)",
            color: "#7fd8ff",
            fontSize: 17,
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 10px rgba(57,255,20,0.12)",
          }}
        >
          {audioMuted ? "🔇" : "🔊"}
        </button>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            width: "100%",
          }}
        >
          <span>
            Score: {score}
            <span
              style={{
                marginLeft: 12,
                padding: "3px 10px",
                border: "1px solid rgba(255,191,0,0.42)",
                borderRadius: 2,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: "#ffbf00",
                textShadow: "0 0 8px rgba(255,191,0,0.35)",
                verticalAlign: "middle",
              }}
              title={rankLive.titleHe}
            >
              {rankLive.titleEn} · {rankLive.titleHe}
            </span>
            <span style={{ marginLeft: 18, opacity: 0.95 }}>Wave: {wave}</span>
            <span
              style={{
                marginLeft: 18,
                opacity: 0.98,
                color:
                  ammo.isReloading
                    ? "#ffbf00"
                    : ammo.currentAmmo < 5 && ammo.currentAmmo > 0
                      ? lowAmmoPulse
                        ? "#ff3333"
                        : "#ffbf00"
                      : "#39ff14",
                textShadow:
                  ammo.currentAmmo < 5 && ammo.currentAmmo > 0 && !ammo.isReloading
                    ? lowAmmoPulse
                      ? "0 0 10px rgba(255,50,50,0.7)"
                      : "0 0 10px rgba(255,191,0,0.55)"
                    : "0 0 8px rgba(57, 255, 20, 0.35)",
                transition: "color 0.12s ease",
              }}
            >
              AMMO: {ammo.currentAmmo} / {ammo.maxAmmo}
            </span>
            <span
              style={{
                marginLeft: 18,
                opacity: 0.98,
                fontWeight: 700,
                color: "#ffbf00",
              }}
              title="Power Level from same-color crates (max 5)"
            >
              Active: {weapon.batteryName}{" "}
              <span
                style={{
                  marginLeft: 6,
                  padding: "2px 6px",
                  borderRadius: 3,
                  transition:
                    "transform 0.15s ease, box-shadow 0.15s ease, color 0.15s ease",
                  transform: pwrLevelFlash ? "scale(1.12)" : "scale(1)",
                  boxShadow: pwrLevelFlash
                    ? "0 0 16px rgba(57,255,20,0.85), 0 0 8px rgba(255,191,0,0.5)"
                    : "none",
                  color: pwrLevelFlash ? "#ffff88" : "#39ff14",
                }}
              >
                PWR Lv {weapon.powerLevel ?? 1}
              </span>
            </span>
            <span
              style={{
                marginLeft: 18,
                color: "#7fd8ff",
                opacity: 0.95,
              }}
            >
              BUDGET: {credits} CR
            </span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Hearts
            {Array.from({ length: ECONOMY.MAX_HEARTS }, (_, i) => (
              <span
                key={i}
                style={{
                  color:
                    i < hearts ? "#ff5566" : "rgba(255,85,102,0.22)",
                  fontSize: 17,
                  textShadow:
                    i < hearts ? "0 0 8px rgba(255,80,100,0.55)" : "none",
                }}
              >
                ♥
              </span>
            ))}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              opacity: 0.92,
              fontSize: 11,
              letterSpacing: "0.06em",
              minWidth: 108,
            }}
          >
            TACTICAL STRIKE
          </span>
          <div
            style={{
              width: 132,
              height: 11,
              borderRadius: 2,
              background: "rgba(0,20,8,0.75)",
              border: "1px solid rgba(57,255,20,0.28)",
              overflow: "hidden",
            }}
            title="Charges from interceptor kills"
          >
            <div
              style={{
                height: "100%",
                width: `${
                  tacticalStrike.maxCharge > 0
                    ? Math.round(
                        (100 * tacticalStrike.charge) /
                          tacticalStrike.maxCharge,
                      )
                    : 0
                }%`,
                background: tacticalStrike.ready
                  ? "linear-gradient(90deg, #ff8c00, #ffbf00)"
                  : "linear-gradient(90deg, #1a5c1a, #39ff14)",
                boxShadow: tacticalStrike.ready
                  ? "0 0 10px rgba(255,191,0,0.45)"
                  : "none",
                transition: "width 0.12s ease-out",
              }}
            />
          </div>
          <span style={{ opacity: 0.88, fontSize: 11, fontWeight: 800 }}>
            {tacticalStrike.charge}/{tacticalStrike.maxCharge}
          </span>
          <button
            type="button"
            onClick={() => emitRequestUseJoker()}
            style={{
              pointerEvents: "auto",
              cursor: tacticalStrike.ready ? "pointer" : "not-allowed",
              opacity: tacticalStrike.ready ? 1 : 0.52,
              padding: "6px 12px",
              borderRadius: 6,
              border: tacticalStrike.ready
                ? "1px solid rgba(255,191,0,0.65)"
                : "1px solid rgba(100, 120, 140, 0.4)",
              background: tacticalStrike.ready
                ? "linear-gradient(180deg, #4a3820 0%, #2a1e10 100%)"
                : "rgba(40, 50, 70, 0.55)",
              color: tacticalStrike.ready ? "#ffbf00" : "#8899aa",
              fontWeight: 800,
              fontSize: 11,
              fontFamily: mono,
              letterSpacing: "0.06em",
            }}
            disabled={!tacticalStrike.ready || gameOver || shop.open}
          >
            CALL STRIKE
          </button>
          <span style={{ fontSize: 11, opacity: 0.72, fontWeight: 500 }}>
            B · right-click
          </span>
        </div>

        {!gameOver && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              fontSize: 10,
              letterSpacing: "0.06em",
              opacity: 0.88,
            }}
          >
            <span style={{ color: "#7fd8ff" }}>
              HVT — {STRATEGIC_ASSETS.power_plant.displayName}:{" "}
              {strategic.powerPlantHp}/{strategic.maxHp}
            </span>
            <span style={{ color: "#b8e8a8" }}>
              {STRATEGIC_ASSETS.military_base.displayName}:{" "}
              {strategic.militaryBaseHp}/{strategic.maxHp}
            </span>
            <span style={{ color: "#88aacc", opacity: 0.85 }}>
              Protection: +{PROTECTION_BONUS_CREDITS} CR/wave if both intact
            </span>
          </div>
        )}

        {!gameOver && (strategic.gridOffline || strategic.logisticsDamaged) && (
          <div
            style={{
              marginTop: 4,
              padding: "6px 10px",
              border: "1px solid rgba(255,80,80,0.45)",
              borderRadius: 2,
              background: "rgba(40,8,8,0.55)",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.05em",
              lineHeight: 1.35,
            }}
          >
            {strategic.gridOffline && (
              <div style={{ color: "#ff6666" }}>
                {STRATEGIC_ASSETS.power_plant.hudDestroyedMessage}
              </div>
            )}
            {strategic.logisticsDamaged && (
              <div style={{ color: "#ffbf00" }}>
                {STRATEGIC_ASSETS.military_base.hudDestroyedMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {shop.open && !gameOver && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "auto",
            background:
              "radial-gradient(ellipse at 50% 20%, rgba(20,60,30,0.5) 0%, transparent 55%), linear-gradient(180deg, rgba(2,8,4,0.96) 0%, rgba(4,18,10,0.97) 100%)",
            backdropFilter: "blur(3px)",
            padding: 16,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 520,
              border: "2px solid rgba(57,255,20,0.5)",
              borderRadius: 4,
              boxShadow:
                "inset 0 0 50px rgba(0,50,24,0.45), 0 0 28px rgba(57,255,20,0.18)",
              background: "rgba(0,14,6,0.94)",
              padding: "22px 20px 20px",
              fontFamily: mono,
              color: "#39ff14",
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              style={{
                pointerEvents: "none",
                position: "absolute",
                inset: 0,
                opacity: 0.14,
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.45) 2px, rgba(0,0,0,0.45) 3px)",
                mixBlendMode: "multiply",
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.32em",
                  opacity: 0.8,
                  marginBottom: 2,
                  fontWeight: 800,
                  color: "#5dff4a",
                }}
              >
                TERMINAL // MILITARY ARMORY
              </div>
              <h2
                style={{
                  margin: "0 0 10px",
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: "0.14em",
                  color: "#ffbf00",
                  textShadow:
                    "0 0 14px rgba(255,191,0,0.4), 0 0 2px rgba(0,0,0,1)",
                }}
              >
                WAVE {shop.waveJustCompleted} SECURED
              </h2>
              <p style={{ margin: "0 0 6px", fontSize: 12, opacity: 0.9 }}>
                BUDGET{" "}
                <strong style={{ color: "#7fd8ff" }}>{shop.credits} CR</strong>
                <span style={{ marginLeft: 14, opacity: 0.85 }}>
                  HEARTS {shop.hearts}/{shop.maxHearts}
                </span>
              </p>
              <p
                style={{
                  margin: "0 0 14px",
                  fontSize: 9,
                  opacity: 0.68,
                  letterSpacing: "0.06em",
                  lineHeight: 1.45,
                }}
              >
                RESOURCE EFF: +{ECONOMY.RESOURCE_EFFICIENCY_PER_ROUND} CR per
                unfired round (magazine at armory). PROTECTION: +
                {PROTECTION_BONUS_CREDITS} CR if both HVTs intact at wave end.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <ArmoryTile
                  icon="⚡"
                  title="RAPID RELOAD"
                  subtitle={`−${ECONOMY.RELOAD_REDUCTION_MS}ms global reload · LVL ${shop.rapidReloadLevel}/${ECONOMY.RAPID_RELOAD_MAX}`}
                  cost={ECONOMY.RAPID_RELOAD_COST}
                  disabled={
                    shop.rapidReloadLevel >= ECONOMY.RAPID_RELOAD_MAX ||
                    shop.credits < ECONOMY.RAPID_RELOAD_COST
                  }
                  upgradeId="rapid_reload"
                />
                <ArmoryTile
                  icon="▤"
                  title="EXTENDED MAG"
                  subtitle={`+${ECONOMY.EXTENDED_MAG_BONUS} rounds · LVL ${shop.extendedMagLevel}/${ECONOMY.EXTENDED_MAG_MAX}`}
                  cost={ECONOMY.EXTENDED_MAG_COST}
                  disabled={
                    shop.extendedMagLevel >= ECONOMY.EXTENDED_MAG_MAX ||
                    shop.credits < ECONOMY.EXTENDED_MAG_COST
                  }
                  upgradeId="extended_mag"
                />
                <ArmoryTile
                  icon="⬆"
                  title="PROPULSION"
                  subtitle={`+${Math.round(ECONOMY.PROPULSION_BONUS * 100)}% speed · LVL ${shop.propulsionLevel}/${ECONOMY.PROPULSION_MAX}`}
                  cost={ECONOMY.PROPULSION_COST}
                  disabled={
                    shop.propulsionLevel >= ECONOMY.PROPULSION_MAX ||
                    shop.credits < ECONOMY.PROPULSION_COST
                  }
                  upgradeId="propulsion"
                />
                <ArmoryTile
                  icon="♥"
                  title="BUY LIFE"
                  subtitle="Restore +1 heart (cap 3). Same run."
                  cost={ECONOMY.BUY_LIFE_COST}
                  disabled={
                    shop.hearts >= shop.maxHearts ||
                    shop.credits < ECONOMY.BUY_LIFE_COST
                  }
                  upgradeId="buy_life"
                />
              </div>
              <button
                type="button"
                onClick={() => emitShopContinueRequest()}
                style={{
                  position: "relative",
                  zIndex: 1,
                  marginTop: 18,
                  width: "100%",
                  padding: "14px 16px",
                  fontFamily: mono,
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: "0.18em",
                  cursor: "pointer",
                  border: "2px solid #39ff14",
                  borderRadius: 2,
                  background: "rgba(57,255,20,0.14)",
                  color: "#39ff14",
                  boxShadow: "0 0 20px rgba(57,255,20,0.28)",
                }}
              >
                DEPLOY NEXT WAVE →
              </button>
            </div>
          </div>
        </div>
      )}

      {ammo.isReloading && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 96,
            transform: "translateX(-50%)",
            zIndex: 12,
            pointerEvents: "none",
            textAlign: "center",
            minWidth: 220,
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontSize: 15,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "#ffbf00",
              textShadow:
                "0 0 14px rgba(255, 191, 0, 0.55), 0 2px 8px rgba(0,0,0,0.9)",
            }}
          >
            RELOADING…
          </div>
          <div
            style={{
              marginTop: 8,
              height: 6,
              width: "100%",
              maxWidth: 240,
              marginLeft: "auto",
              marginRight: "auto",
              borderRadius: 2,
              background: "rgba(0,24,0,0.65)",
              border: "1px solid rgba(57,255,20,0.35)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round((ammo.reloadProgress ?? 0) * 100)}%`,
                background: "linear-gradient(90deg, #2a6a2a, #39ff14)",
                boxShadow: "0 0 8px rgba(57,255,20,0.5)",
                transition: "width 0.08s linear",
              }}
            />
          </div>
        </div>
      )}

      {waveBannerSeq > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 14,
            opacity: waveBannerOpacity,
            transition: "opacity 0.45s ease-out",
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontWeight: 800,
              letterSpacing: "0.06em",
              color: "#39ff14",
              textShadow:
                "0 0 24px rgba(57, 255, 20, 0.45), 0 4px 24px rgba(0,0,0,0.9)",
              fontFamily:
                "var(--font-share-tech-mono), 'Share Tech Mono', Consolas, monospace",
            }}
          >
            WAVE {wave} INCOMING!
          </div>
        </div>
      )}

      {!audioReady && !gameOver && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            background: "rgba(6, 10, 22, 0.78)",
            backdropFilter: "blur(3px)",
            zIndex: 16,
            pointerEvents: "auto",
            cursor: "pointer",
          }}
          onClick={unlockAudio}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#e8eef8",
              fontFamily:
                "var(--font-share-tech-mono), 'Share Tech Mono', Consolas, monospace",
              textAlign: "center",
              textShadow: "0 2px 12px rgba(0,0,0,0.6)",
            }}
          >
            Start Game
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#9ab0d4",
              fontFamily:
                "var(--font-share-tech-mono), 'Share Tech Mono', Consolas, monospace",
              textAlign: "center",
              maxWidth: 280,
              lineHeight: 1.45,
            }}
          >
            Tap, click, or press Space to enable audio and begin.
          </div>
        </div>
      )}

      <Leaderboard
        open={gameOver}
        finalScore={score}
        finalWave={wave}
        debrief={
          missionDebrief ?? {
            finalScore: score,
            finalWave: wave,
            strategicAssetsIntact: 0,
            wavesCleared: Math.max(0, wave - 1),
          }
        }
        onPlayAgain={() => emitGameReset()}
      />
    </>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  emitGameReset,
  emitRequestUseJoker,
  emitShopContinueRequest,
  emitShopPurchaseRequest,
  subscribeGameEvents,
  type AchievementUnlockedDetail,
  type AmmoDetail,
  type BossEncounterDetail,
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
  autoTurretLevel: 0,
  debrisSweeperLevel: 0,
  extendedRangeLevel: 0,
  repairCrewsOwned: false,
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
    volleySize: 1,
    nextSalvoCredits: 5,
  });
  const [lowAmmoPulse, setLowAmmoPulse] = useState(true);
  const [tacticalStrike, setTacticalStrike] =
    useState<JokerChargeDetail>(DEFAULT_TACTICAL_STRIKE);
  const [gameOver, setGameOver] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [audioMuted, setAudioMutedState] = useState(() => isAudioMuted());

  const [waveBannerSeq, setWaveBannerSeq] = useState(0);
  const [waveBannerOpacity, setWaveBannerOpacity] = useState(0);
  const [credits, setCredits] = useState<number>(ECONOMY.STARTING_CREDITS);
  const [shop, setShop] = useState<ShopPanelDetail>(CLOSED_SHOP);
  const [strategic, setStrategic] =
    useState<StrategicAssetsDetail>(DEFAULT_STRATEGIC);
  const [missionDebrief, setMissionDebrief] =
    useState<GameOverDebriefDetail | null>(null);
  const [pwrLevelFlash, setPwrLevelFlash] = useState(false);
  const lastPowerLevelRef = useRef(1);
  const [bossEncounter, setBossEncounter] = useState<BossEncounterDetail>({
    active: false,
  });
  const [achievementToast, setAchievementToast] =
    useState<AchievementUnlockedDetail | null>(null);
  const [achievementPeek, setAchievementPeek] = useState(false);
  const [volleyHudPulse, setVolleyHudPulse] = useState(false);

  useEffect(() => {
    if (!achievementToast) {
      setAchievementPeek(false);
      return;
    }
    const slideIn = window.setTimeout(() => setAchievementPeek(true), 40);
    const slideOut = window.setTimeout(() => setAchievementPeek(false), 3040);
    const remove = window.setTimeout(() => setAchievementToast(null), 3680);
    return () => {
      clearTimeout(slideIn);
      clearTimeout(slideOut);
      clearTimeout(remove);
    };
  }, [achievementToast]);

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
        setCredits(ECONOMY.STARTING_CREDITS);
        setShop(CLOSED_SHOP);
        setStrategic(DEFAULT_STRATEGIC);
        setBossEncounter({ active: false });
        setAchievementToast(null);
        setAchievementPeek(false);
        setVolleyHudPulse(false);
        setHearts(ECONOMY.MAX_HEARTS);
        setAmmo({
          currentAmmo: LAUNCHER_MAG_CAPACITY,
          maxAmmo: LAUNCHER_MAG_CAPACITY,
          isReloading: false,
          volleySize: 1,
          nextSalvoCredits: 5,
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
      onBossEncounterUpdated: setBossEncounter,
      onAchievementUnlocked: setAchievementToast,
      onVolleyChanged: () => {
        setVolleyHudPulse(true);
        window.setTimeout(() => setVolleyHudPulse(false), 220);
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
            "radial-gradient(ellipse 74% 70% at 50% 44%, transparent 0%, rgba(0,12,24,0.38) 58%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.82) 100%)",
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
            "0 0 12px rgba(120, 230, 255, 0.28), 0 0 10px rgba(57, 255, 20, 0.42), 0 2px 6px rgba(0,0,0,0.95)",
          zIndex: 10,
        }}
      >
        {bossEncounter.active ? (
          <div
            style={{
              position: "absolute",
              top: 2,
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(92vw, 720px)",
              pointerEvents: "none",
              zIndex: 11,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.28em",
                color: "#ff2a2a",
                textAlign: "center",
                marginBottom: 4,
                textShadow:
                  "0 0 12px rgba(255,40,40,0.85), 0 0 24px rgba(180,0,0,0.45)",
              }}
            >
              BOSS HP
            </div>
            <div
              style={{
                height: 16,
                borderRadius: 2,
                border: "2px solid rgba(255,50,50,0.95)",
                background: "rgba(8,0,0,0.75)",
                boxShadow:
                  "inset 0 0 14px rgba(0,0,0,0.9), 0 0 16px rgba(255,30,30,0.35)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(
                    0,
                    Math.min(
                      100,
                      (bossEncounter.currentHp / bossEncounter.maxHp) * 100,
                    ),
                  )}%`,
                  background:
                    "linear-gradient(180deg, #ff5555 0%, #cc0000 48%, #880000 100%)",
                  boxShadow: "0 0 10px rgba(255,80,80,0.6)",
                  transition: "width 0.12s ease-out",
                }}
              />
            </div>
          </div>
        ) : null}
        {achievementToast ? (
          <div
            style={{
              position: "absolute",
              top: 52,
              left: "50%",
              zIndex: 13,
              maxWidth: "min(94vw, 640px)",
              pointerEvents: "none",
              transform: achievementPeek
                ? "translate(-50%, 0)"
                : "translate(-50%, -160%)",
              opacity: achievementPeek ? 1 : 0,
              transition:
                "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease",
            }}
          >
            <div
              style={{
                fontFamily: mono,
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "0.1em",
                textAlign: "center",
                lineHeight: 1.45,
                padding: "12px 18px",
                borderRadius: 4,
                border: "2px solid rgba(255, 215, 80, 0.95)",
                color: "#1a1200",
                background:
                  "linear-gradient(175deg, #fff4c4 0%, #ffcc33 38%, #e6a800 100%)",
                boxShadow:
                  "0 0 28px rgba(255, 200, 60, 0.55), inset 0 1px 0 rgba(255,255,255,0.65)",
                textShadow: "0 1px 0 rgba(255,255,255,0.5)",
              }}
            >
              🏆 ACHIEVEMENT UNLOCKED: {achievementToast.displayName}! +
              {achievementToast.rewardCredits} CR
            </div>
          </div>
        ) : null}
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
                marginLeft: 14,
                padding: "2px 8px",
                border: "1px solid rgba(127,216,255,0.45)",
                borderRadius: 2,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.08em",
                display: "inline-block",
                transform: volleyHudPulse ? "scale(1.12)" : "scale(1)",
                transformOrigin: "center center",
                color: volleyHudPulse ? "#ffffff" : "#7fd8ff",
                textShadow: volleyHudPulse
                  ? "0 0 14px rgba(255,255,255,0.95), 0 0 6px rgba(255,255,255,0.6)"
                  : "0 0 8px rgba(127,216,255,0.35)",
                transition:
                  "color 0.07s ease, transform 0.12s ease-out, text-shadow 0.1s ease",
              }}
              title="Mouse wheel: cycle salvo size. Left+right click: manual reload."
            >
              VOLLEY ×{ammo.volleySize ?? 1} · −{ammo.nextSalvoCredits ?? 0}{" "}
              CR/salvo
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
              alignItems: "baseline",
              gap: "10px 14px",
              fontSize: 10,
              letterSpacing: "0.06em",
              opacity: 0.94,
              textShadow:
                "0 0 12px rgba(130, 220, 255, 0.4), 0 2px 6px rgba(0,0,0,0.92)",
            }}
          >
            <span style={{ color: "#a8ecff", fontWeight: 700 }}>
              {STRATEGIC_ASSETS.power_plant.displayName}:{" "}
              {strategic.powerPlantHp}/{strategic.maxHp}
            </span>
            <span style={{ color: "#c8f8b8", fontWeight: 700 }}>
              {STRATEGIC_ASSETS.military_base.displayName}:{" "}
              {strategic.militaryBaseHp}/{strategic.maxHp}
            </span>
            <span style={{ color: "#b8e4ff", opacity: 0.95, fontWeight: 600 }}>
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
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            pointerEvents: "auto",
            padding: "0 16px 16px",
            paddingTop: 80,
            boxSizing: "border-box",
            background:
              "radial-gradient(ellipse at 50% 20%, rgba(20,60,30,0.5) 0%, transparent 55%), linear-gradient(180deg, rgba(2,8,4,0.96) 0%, rgba(4,18,10,0.97) 100%)",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 520,
              marginTop: 0,
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              border: "2px solid rgba(57,255,20,0.5)",
              borderRadius: 4,
              boxShadow:
                "inset 0 0 50px rgba(0,50,24,0.45), 0 0 28px rgba(57,255,20,0.18)",
              background: "rgba(0,14,6,0.94)",
              padding: "18px 16px 0",
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
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
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
                  flexShrink: 0,
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
                  flexShrink: 0,
                }}
              >
                WAVE {shop.waveJustCompleted} SECURED
              </h2>
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: 12,
                  opacity: 0.9,
                  flexShrink: 0,
                }}
              >
                BUDGET{" "}
                <strong style={{ color: "#7fd8ff" }}>{shop.credits} CR</strong>
                <span style={{ marginLeft: 14, opacity: 0.85 }}>
                  HEARTS {shop.hearts}/{shop.maxHearts}
                </span>
              </p>
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 9,
                  opacity: 0.68,
                  letterSpacing: "0.06em",
                  lineHeight: 1.45,
                  flexShrink: 0,
                }}
              >
                RESOURCE EFF: +{ECONOMY.RESOURCE_EFFICIENCY_PER_ROUND} CR per
                unfired round (magazine at armory). PROTECTION: +
                {PROTECTION_BONUS_CREDITS} CR if both HVTs intact at wave end.
              </p>
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  WebkitOverflowScrolling: "touch",
                  paddingRight: 4,
                  marginRight: -4,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    paddingBottom: 8,
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
                <ArmoryTile
                  icon="🎯"
                  title="AUTO-TURRET"
                  subtitle={`Random enemy · every ${(Math.max(0.9, 5 - 0.4 * shop.autoTurretLevel)).toFixed(1)}s · LVL ${shop.autoTurretLevel}/${ECONOMY.AUTO_TURRET_MAX}`}
                  cost={ECONOMY.AUTO_TURRET_COST}
                  disabled={
                    shop.autoTurretLevel >= ECONOMY.AUTO_TURRET_MAX ||
                    shop.credits < ECONOMY.AUTO_TURRET_COST
                  }
                  upgradeId="auto_turret"
                />
                <ArmoryTile
                  icon="✦"
                  title="DEBRIS SWEEPER"
                  subtitle={`Vaporize 1 debris · every ${(Math.max(0.5, 4 - 0.3 * shop.debrisSweeperLevel)).toFixed(1)}s · LVL ${shop.debrisSweeperLevel}/${ECONOMY.DEBRIS_SWEEPER_MAX}`}
                  cost={ECONOMY.DEBRIS_SWEEPER_COST}
                  disabled={
                    shop.debrisSweeperLevel >= ECONOMY.DEBRIS_SWEEPER_MAX ||
                    shop.credits < ECONOMY.DEBRIS_SWEEPER_COST
                  }
                  upgradeId="debris_sweeper"
                />
                <ArmoryTile
                  icon="◎"
                  title="EXTENDED RANGE"
                  subtitle={`Beam column + splash radius +${Math.round(5.5 * shop.extendedRangeLevel)}% · LVL ${shop.extendedRangeLevel}/${ECONOMY.EXTENDED_RANGE_MAX}`}
                  cost={ECONOMY.EXTENDED_RANGE_COST}
                  disabled={
                    shop.extendedRangeLevel >= ECONOMY.EXTENDED_RANGE_MAX ||
                    shop.credits < ECONOMY.EXTENDED_RANGE_COST
                  }
                  upgradeId="extended_range"
                />
                <ArmoryTile
                  icon="🔧"
                  title="REPAIR CREWS"
                  subtitle={
                    shop.repairCrewsOwned
                      ? "OWNED — +1 HP each HVT at every wave start."
                      : "+1 HP to each surviving HVT at start of every wave."
                  }
                  cost={ECONOMY.REPAIR_CREWS_COST}
                  disabled={
                    shop.repairCrewsOwned ||
                    shop.credits < ECONOMY.REPAIR_CREWS_COST
                  }
                  upgradeId="repair_crews"
                />
                </div>
              </div>
              <button
                type="button"
                onClick={() => emitShopContinueRequest()}
                style={{
                  position: "relative",
                  zIndex: 30,
                  flexShrink: 0,
                  marginTop: 12,
                  marginLeft: -16,
                  marginRight: -16,
                  marginBottom: 0,
                  width: "calc(100% + 32px)",
                  maxWidth: "none",
                  padding: "14px 16px",
                  fontFamily: mono,
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: "0.18em",
                  cursor: "pointer",
                  pointerEvents: "auto",
                  border: "none",
                  borderTop: "2px solid rgba(57,255,20,0.55)",
                  borderRadius: "0 0 2px 2px",
                  background:
                    "linear-gradient(180deg, rgba(0,22,10,0.98) 0%, rgba(0,36,16,0.99) 100%)",
                  color: "#39ff14",
                  boxShadow:
                    "0 -8px 24px rgba(0,0,0,0.45), 0 0 20px rgba(57,255,20,0.22)",
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
            totalEnemiesDestroyed: 0,
          }
        }
        onPlayAgain={() => emitGameReset()}
      />
    </>
  );
}

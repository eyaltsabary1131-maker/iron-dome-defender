"use client";

import { useCallback, useEffect, useState } from "react";
import {
  emitGameReset,
  emitRequestUseJoker,
  subscribeGameEvents,
  type AmmoDetail,
  type WeaponDetail,
} from "@/game/events/gameEvents";
import { Leaderboard } from "@/components/game/Leaderboard";
import { initAudio, playWaveAlert } from "@/game/utils/SynthAudio";

const DEFAULT_WEAPON: WeaponDetail = {
  batteryName: "IRON DOME",
  batteryType: "IRON_DOME",
};

export function GameHUD() {
  const [score, setScore] = useState(0);
  const [cityIntegrity, setCityIntegrity] = useState(3);
  const [weapon, setWeapon] = useState<WeaponDetail>(DEFAULT_WEAPON);
  const [wave, setWave] = useState(1);
  const [ammo, setAmmo] = useState<AmmoDetail>({
    currentAmmo: 15,
    maxAmmo: 15,
    isReloading: false,
  });
  const [jokers, setJokers] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  const [waveBannerSeq, setWaveBannerSeq] = useState(0);
  const [waveBannerOpacity, setWaveBannerOpacity] = useState(0);

  useEffect(() => {
    return subscribeGameEvents({
      onScoreUpdated: setScore,
      onCityHit: setCityIntegrity,
      onGameOver: () => setGameOver(true),
      onGameReset: () => {
        setGameOver(false);
        setWeapon(DEFAULT_WEAPON);
        setJokers(1);
      },
      onWeaponUpgraded: setWeapon,
      onAmmoUpdated: setAmmo,
      onJokersUpdated: setJokers,
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

  return (
    <>
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
          fontFamily: "system-ui, sans-serif",
          fontSize: 14,
          fontWeight: 600,
          color: "#e8eef8",
          textShadow: "0 1px 4px rgba(0,0,0,0.85)",
          zIndex: 10,
        }}
      >
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
            <span style={{ marginLeft: 18, opacity: 0.95 }}>Wave: {wave}</span>
            <span style={{ marginLeft: 18, opacity: 0.95 }}>
              Ammo: {ammo.currentAmmo} / {ammo.maxAmmo}
            </span>
            <span
              style={{
                marginLeft: 18,
                opacity: 0.98,
                fontWeight: 700,
                color: "#c8e0ff",
              }}
            >
              Active: {weapon.batteryName}
            </span>
          </span>
          <span>City Integrity: {cityIntegrity}</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span style={{ opacity: 0.95 }}>
            Uncle Sam charges: <strong>{jokers}</strong>
          </span>
          <button
            type="button"
            onClick={() => emitRequestUseJoker()}
            style={{
              pointerEvents: "auto",
              cursor: jokers > 0 ? "pointer" : "not-allowed",
              opacity: jokers > 0 ? 1 : 0.55,
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid rgba(180, 200, 255, 0.45)",
              background:
                jokers > 0
                  ? "linear-gradient(180deg, #2a3f6a 0%, #1a2844 100%)"
                  : "rgba(40, 50, 70, 0.6)",
              color: "#e8eef8",
              fontWeight: 700,
              fontSize: 12,
              fontFamily: "system-ui, sans-serif",
            }}
            disabled={jokers <= 0 || gameOver}
          >
            UNCLE SAM (WIPE)
          </button>
          <span style={{ fontSize: 12, opacity: 0.75, fontWeight: 500 }}>
            B · right-click
          </span>
        </div>
      </div>

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
              color: "#f4f8ff",
              textShadow:
                "0 0 20px rgba(100, 160, 255, 0.55), 0 4px 24px rgba(0,0,0,0.85)",
              fontFamily: "system-ui, sans-serif",
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
              fontFamily: "system-ui, sans-serif",
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
              fontFamily: "system-ui, sans-serif",
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
        onPlayAgain={() => emitGameReset()}
      />
    </>
  );
}

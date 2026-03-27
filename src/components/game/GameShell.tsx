"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { HowToPlayScreen } from "@/components/game/HowToPlayScreen";
import { ThreatManualScreen } from "@/components/game/ThreatManualScreen";

const PhaserGame = dynamic(() => import("@/components/game/PhaserGame"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
        color: "#8fa3c4",
      }}
    >
      Loading game…
    </div>
  ),
});

export function GameShell() {
  const [phase, setPhase] = useState<"howto" | "menu" | "playing">("howto");
  const [showManual, setShowManual] = useState(false);

  const startMission = useCallback(() => {
    setPhase("playing");
  }, []);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "1.5rem",
        gap: "1rem",
      }}
    >
      {phase === "howto" && (
        <HowToPlayScreen onContinue={() => setPhase("menu")} />
      )}

      {phase === "menu" && (
        <>
          <h1
            style={{
              margin: 0,
              fontSize: "1.2rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              fontFamily:
                "var(--font-share-tech-mono), 'Share Tech Mono', Consolas, monospace",
              color: "#39ff14",
              textShadow: "0 0 12px rgba(57, 255, 20, 0.3)",
            }}
          >
            ISRAEL AIR DEFENSE
          </h1>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={startMission}
              style={{
                padding: "12px 22px",
                fontFamily:
                  "var(--font-share-tech-mono), 'Share Tech Mono', Consolas, monospace",
                fontWeight: 900,
                letterSpacing: "0.12em",
                fontSize: 12,
                cursor: "pointer",
                border: "2px solid rgba(57,255,20,0.55)",
                borderRadius: 4,
                background:
                  "linear-gradient(180deg, rgba(0,52,24,0.95), rgba(0,28,12,0.92))",
                color: "#39ff14",
              }}
            >
              LAUNCH MISSION
            </button>
            <button
              type="button"
              onClick={() => setShowManual(true)}
              style={{
                padding: "12px 22px",
                fontFamily:
                  "var(--font-share-tech-mono), 'Share Tech Mono', Consolas, monospace",
                fontWeight: 800,
                letterSpacing: "0.1em",
                fontSize: 11,
                cursor: "pointer",
                border: "2px solid rgba(127,216,255,0.45)",
                borderRadius: 4,
                background: "rgba(0,20,32,0.9)",
                color: "#7fd8ff",
              }}
            >
              THREAT MANUAL
            </button>
            <button
              type="button"
              onClick={() => setPhase("howto")}
              style={{
                padding: "12px 18px",
                fontFamily:
                  "var(--font-share-tech-mono), 'Share Tech Mono', Consolas, monospace",
                fontWeight: 700,
                letterSpacing: "0.08em",
                fontSize: 10,
                cursor: "pointer",
                border: "1px solid rgba(100,120,100,0.5)",
                borderRadius: 4,
                background: "rgba(20,28,22,0.85)",
                color: "#8faa8c",
              }}
            >
              HOW TO PLAY
            </button>
          </div>
        </>
      )}

      {showManual && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(0,8,12,0.88)",
            backdropFilter: "blur(6px)",
          }}
        >
          <ThreatManualScreen onBack={() => setShowManual(false)} />
        </div>
      )}

      {phase === "playing" && <PhaserGame />}
    </main>
  );
}

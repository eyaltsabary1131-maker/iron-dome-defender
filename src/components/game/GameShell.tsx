"use client";

import dynamic from "next/dynamic";

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
      <h1
        style={{
          margin: 0,
          fontSize: "1.25rem",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        Israel Air Defense
      </h1>
      <p style={{ margin: 0, color: "#8fa3c4", fontSize: "0.9rem" }}>
        ← → move · Space fire
      </p>
      <PhaserGame />
    </main>
  );
}

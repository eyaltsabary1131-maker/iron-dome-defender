"use client";

import { useEffect, useRef } from "react";
import type * as PhaserNS from "phaser";
import { createGameConfig } from "@/game/config/gameConfig";
import { GameHUD } from "@/components/game/GameHUD";

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<PhaserNS.Game | null>(null);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    let cancelled = false;

    void import("phaser").then((Phaser) => {
      if (cancelled || !containerRef.current) return;

      const config = createGameConfig(Phaser);
      gameRef.current = new Phaser.Game({
        ...config,
        parent,
      });
    });

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: 800,
        height: 600,
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.45)",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        ref={containerRef}
        id="phaser-game"
        style={{ width: "100%", height: "100%" }}
      />
      <GameHUD />
    </div>
  );
}

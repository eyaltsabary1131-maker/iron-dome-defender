"use client";

import { useEffect, useRef } from "react";
import type * as PhaserNS from "phaser";
import { createGameConfig } from "@/game/config/gameConfig";
import { GAME_HEIGHT, GAME_WIDTH } from "@/game/config/dimensions";
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

  const edgeMono =
    "var(--font-share-tech-mono), 'Share Tech Mono', Consolas, monospace";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        width: GAME_WIDTH,
      }}
    >
      <div
        style={{
          position: "relative",
          width: GAME_WIDTH,
          height: GAME_HEIGHT,
          borderRadius: 8,
          overflow: "hidden",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(120, 200, 255, 0.12)",
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
      <div
        aria-hidden
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          marginTop: 6,
          padding: "0 2px",
          fontFamily: edgeMono,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: "#9ad4ff",
          userSelect: "none",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 4,
            border: "1px solid rgba(120, 200, 255, 0.35)",
            background: "rgba(4, 12, 22, 0.55)",
            boxShadow:
              "0 0 14px rgba(100, 190, 255, 0.2), inset 0 0 12px rgba(80, 160, 255, 0.06)",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              gap: 3,
              opacity: 0.88,
              fontSize: 9,
              letterSpacing: "0.02em",
            }}
            aria-hidden
          >
            <span>◀</span>
            <span>▶</span>
          </span>
          <span
            style={{
              textShadow:
                "0 0 12px rgba(120, 210, 255, 0.5), 0 1px 3px rgba(0,0,0,0.85)",
            }}
          >
            move
          </span>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 4,
            border: "1px solid rgba(120, 200, 255, 0.35)",
            background: "rgba(4, 12, 22, 0.55)",
            boxShadow:
              "0 0 14px rgba(100, 190, 255, 0.2), inset 0 0 12px rgba(80, 160, 255, 0.06)",
          }}
        >
          <span
            style={{
              textShadow:
                "0 0 12px rgba(120, 210, 255, 0.5), 0 1px 3px rgba(0,0,0,0.85)",
            }}
          >
            Space fire
          </span>
          <span
            style={{ opacity: 0.88, fontSize: 9, lineHeight: 1 }}
            aria-hidden
          >
            ▲
          </span>
        </div>
      </div>
    </div>
  );
}

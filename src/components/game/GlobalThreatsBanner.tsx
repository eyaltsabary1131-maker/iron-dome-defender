"use client";

import { useEffect, useState } from "react";
import { fetchGlobalIntercepts } from "@/lib/globalStatsApi";

const mono =
  "var(--font-share-tech-mono), 'Share Tech Mono', Consolas, monospace";

export function GlobalThreatsBanner() {
  const [total, setTotal] = useState<number | null>(null);
  const [pulse, setPulse] = useState(1);

  useEffect(() => {
    let cancelled = false;
    void fetchGlobalIntercepts().then((n) => {
      if (!cancelled) setTotal(n);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t0 = performance.now();
    let id: number;
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      setPulse(0.9 + 0.1 * (0.5 + 0.5 * Math.sin(t * 2.4)));
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const formatted =
    total === null
      ? "— — —"
      : new Intl.NumberFormat("en-US").format(total);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 720,
        textAlign: "center",
        padding: "8px 14px 12px",
        fontFamily: mono,
      }}
    >
      <div
        style={{
          fontSize: "clamp(11px, 2.6vw, 14px)",
          fontWeight: 900,
          letterSpacing: "0.1em",
          lineHeight: 1.5,
          color: "#c8ff6a",
          textShadow:
            "0 0 12px rgba(255, 191, 0, 0.45), 0 0 22px rgba(57, 255, 20, 0.2)",
          opacity: 0.88 + 0.12 * pulse,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        🌍 GLOBAL THREATS NEUTRALIZED:{" "}
        <span style={{ color: "#ffbf00" }}>[ {formatted} ]</span>
      </div>
    </div>
  );
}

"use client";

import type { CSSProperties } from "react";

const mono =
  "var(--font-share-tech-mono), 'Share Tech Mono', Consolas, monospace";

const panel: CSSProperties = {
  maxWidth: 560,
  width: "100%",
  maxHeight: "min(88vh, 640px)",
  overflowY: "auto",
  padding: "22px 22px 20px",
  borderRadius: 6,
  border: "2px solid rgba(127,216,255,0.35)",
  background: "rgba(0,12,18,0.94)",
  boxShadow: "inset 0 0 40px rgba(0,32,48,0.35)",
  fontFamily: mono,
  color: "#b8e8ff",
  fontSize: 11,
  lineHeight: 1.5,
};

const h = (color: string): CSSProperties => ({
  margin: "14px 0 6px",
  fontSize: 11,
  letterSpacing: "0.2em",
  fontWeight: 900,
  color,
});

export function ThreatManualScreen({ onBack }: { onBack: () => void }) {
  return (
    <div style={panel}>
      <div style={h("#5dff4a")}>THREAT MANUAL // CLASSIFIED</div>
      <h2 style={{ margin: "0 0 8px", fontSize: 17, color: "#7fd8ff" }}>
        Enemies
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 8 }}>
        <thead>
          <tr style={{ color: "#88ccff", textAlign: "left", fontSize: 9 }}>
            <th style={{ padding: "4px 6px" }}>TYPE</th>
            <th style={{ padding: "4px 6px" }}>THREAT</th>
            <th style={{ padding: "4px 6px" }}>NOTES</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderTop: "1px solid rgba(127,216,255,0.2)" }}>
            <td style={{ padding: "6px", color: "#ffaa66" }}>Rocket</td>
            <td style={{ padding: "6px", color: "#ffbf00" }}>MEDIUM</td>
            <td style={{ padding: "6px" }}>Fast grad-style; debris on kill</td>
          </tr>
          <tr style={{ borderTop: "1px solid rgba(127,216,255,0.15)" }}>
            <td style={{ padding: "6px", color: "#88ccff" }}>UAV</td>
            <td style={{ padding: "6px", color: "#39ff14" }}>LOW–MED</td>
            <td style={{ padding: "6px" }}>Slower; swarms in early waves</td>
          </tr>
          <tr style={{ borderTop: "1px solid rgba(127,216,255,0.15)" }}>
            <td style={{ padding: "6px", color: "#ff6688" }}>Ballistic</td>
            <td style={{ padding: "6px", color: "#ff4444" }}>HIGH</td>
            <td style={{ padding: "6px" }}>
              Heavy HP; from wave 2 may MIRV-split into 3
            </td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ margin: "12px 0 8px", fontSize: 17, color: "#39ff14" }}>
        Weapons
      </h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ color: "#88ff99", textAlign: "left", fontSize: 9 }}>
            <th style={{ padding: "4px 6px" }}>CRATE</th>
            <th style={{ padding: "4px 6px" }}>SYSTEM</th>
            <th style={{ padding: "4px 6px" }}>STRENGTH</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderTop: "1px solid rgba(57,255,20,0.2)" }}>
            <td style={{ padding: "6px", color: "#39ff14" }}>■ Green</td>
            <td style={{ padding: "6px" }}>Iron Dome</td>
            <td style={{ padding: "6px" }}>2–4 Tamirs; faster RoF at high level</td>
          </tr>
          <tr style={{ borderTop: "1px solid rgba(57,255,20,0.15)" }}>
            <td style={{ padding: "6px", color: "#3399ff" }}>■ Blue</td>
            <td style={{ padding: "6px" }}>David&apos;s Sling</td>
            <td style={{ padding: "6px" }}>Spread shots + large splash radius</td>
          </tr>
          <tr style={{ borderTop: "1px solid rgba(57,255,20,0.15)" }}>
            <td style={{ padding: "6px", color: "#ffdd22" }}>■ Yellow</td>
            <td style={{ padding: "6px" }}>Arrow</td>
            <td style={{ padding: "6px" }}>
              Piercing; one-shot ballistic; faster at high level
            </td>
          </tr>
          <tr style={{ borderTop: "1px solid rgba(57,255,20,0.15)" }}>
            <td style={{ padding: "6px", color: "#ff4466" }}>■ Red</td>
            <td style={{ padding: "6px" }}>
              Iron Beam{" "}
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 8,
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  color: "#1a1a00",
                  background: "linear-gradient(90deg, #ffbf00, #ffee88)",
                  padding: "2px 5px",
                  borderRadius: 2,
                  verticalAlign: "middle",
                }}
              >
                NEW
              </span>
            </td>
            <td style={{ padding: "6px" }}>
              Instant column strike; no projectiles
            </td>
          </tr>
        </tbody>
      </table>

      <button
        type="button"
        onClick={onBack}
        style={{
          marginTop: 18,
          width: "100%",
          padding: "10px 16px",
          fontFamily: mono,
          fontWeight: 800,
          letterSpacing: "0.12em",
          fontSize: 11,
          cursor: "pointer",
          border: "1px solid rgba(127,216,255,0.45)",
          borderRadius: 4,
          background: "rgba(0,28,40,0.9)",
          color: "#7fd8ff",
        }}
      >
        BACK
      </button>
    </div>
  );
}

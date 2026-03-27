"use client";

import type { CSSProperties } from "react";

const mono =
  "var(--font-share-tech-mono), 'Share Tech Mono', Consolas, monospace";

const panel: CSSProperties = {
  maxWidth: 520,
  width: "100%",
  padding: "22px 22px 20px",
  borderRadius: 6,
  border: "2px solid rgba(57,255,20,0.35)",
  background: "rgba(0,14,6,0.94)",
  boxShadow: "inset 0 0 40px rgba(0,40,20,0.35), 0 0 24px rgba(57,255,20,0.1)",
  fontFamily: mono,
  color: "#b8ffc8",
  fontSize: 12,
  lineHeight: 1.55,
};

export function HowToPlayScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div style={panel}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.28em",
          color: "#5dff4a",
          fontWeight: 800,
          marginBottom: 10,
        }}
      >
        HOW TO PLAY
      </div>
      <h2
        style={{
          margin: "0 0 12px",
          fontSize: 18,
          fontWeight: 900,
          letterSpacing: "0.12em",
          color: "#39ff14",
          textShadow: "0 0 12px rgba(57,255,20,0.25)",
        }}
      >
        Iron Dome Defender
      </h2>
      <ul style={{ margin: "0 0 16px", paddingLeft: 18 }}>
        <li>
          Move with the mouse (or trackpad). Your launcher follows the pointer.
        </li>
        <li>
          <strong style={{ color: "#7fd8ff" }}>Click</strong> or{" "}
          <strong style={{ color: "#7fd8ff" }}>Space</strong> to fire interceptors.
        </li>
        <li>
          <strong style={{ color: "#ffbf00" }}>B</strong> or{" "}
          <strong style={{ color: "#ffbf00" }}>right-click</strong> for Tactical
          Strike when charged.
        </li>
        <li>
          Catch colored crates: <span style={{ color: "#39ff14" }}>■</span> Iron
          Dome · <span style={{ color: "#3399ff" }}>■</span> Sling ·{" "}
          <span style={{ color: "#ffdd22" }}>■</span> Arrow ·{" "}
          <span style={{ color: "#ff4466" }}>■</span> Iron Beam.
        </li>
        <li>
          Same color as your current weapon raises{" "}
          <strong style={{ color: "#ffbf00" }}>Power Level</strong> (max 5).
          Different color switches weapon but keeps your level.
        </li>
        <li>Between waves, spend credits in the Armory. Protect both HVT sites.</li>
      </ul>
      <button
        type="button"
        onClick={onContinue}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontFamily: mono,
          fontWeight: 900,
          letterSpacing: "0.14em",
          fontSize: 12,
          cursor: "pointer",
          border: "2px solid rgba(57,255,20,0.5)",
          borderRadius: 4,
          background: "linear-gradient(180deg, rgba(0,48,22,0.95), rgba(0,24,10,0.92))",
          color: "#39ff14",
          textShadow: "0 0 10px rgba(57,255,20,0.35)",
        }}
      >
        CONTINUE TO MENU
      </button>
    </div>
  );
}

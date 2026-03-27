"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import type { GameOverDebriefDetail } from "@/game/events/gameEvents";
import { getRankFromScore } from "@/game/ranks";
import {
  fetchTopScores,
  submitScore,
  type LeaderboardEntry,
} from "@/lib/leaderboardApi";

const mono =
  "var(--font-share-tech-mono), 'Share Tech Mono', Consolas, monospace";

const shell: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 14,
  background:
    "radial-gradient(ellipse at 50% 40%, rgba(8,28,16,0.92) 0%, rgba(2,8,4,0.96) 100%)",
  backdropFilter: "blur(8px)",
  zIndex: 20,
  pointerEvents: "auto",
};

const panel: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 14,
  maxWidth: 480,
  width: "100%",
  maxHeight: "min(92vh, 720px)",
  padding: "22px 20px 20px",
  borderRadius: 4,
  background: "rgba(0,14,6,0.94)",
  border: "2px solid rgba(57,255,20,0.35)",
  boxShadow:
    "inset 0 0 50px rgba(0,40,20,0.4), 0 0 28px rgba(57,255,20,0.12)",
  fontFamily: mono,
  color: "#39ff14",
  overflow: "hidden",
};

const scanlines: CSSProperties = {
  pointerEvents: "none",
  position: "absolute",
  inset: 0,
  opacity: 0.11,
  backgroundImage:
    "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 3px)",
  mixBlendMode: "multiply",
};

export function Leaderboard({
  open,
  finalScore,
  finalWave,
  debrief,
  onPlayAgain,
}: {
  open: boolean;
  finalScore: number;
  finalWave: number;
  debrief: GameOverDebriefDetail;
  onPlayAgain: () => void;
}) {
  const [name, setName] = useState("");
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [radarError, setRadarError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const rank = getRankFromScore(finalScore);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setRadarError(null);
    try {
      const data = await fetchTopScores();
      setRows(data);
    } catch {
      setRows([]);
      setRadarError("RADAR LINK FAILED — OFFLINE BRIEF");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setName("");
      setRows(null);
      setRadarError(null);
      setSubmitError(null);
      setScoreSubmitted(false);
      setShareNote(null);
      void loadLeaderboard();
    }
  }, [open, loadLeaderboard]);

  const handleSubmit = async () => {
    const trimmed = name.trim().slice(0, 10);
    if (!trimmed) {
      setSubmitError("CALLSIGN REQUIRED (10 CHAR MAX)");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitScore({
        playerName: trimmed,
        score: finalScore,
        wave: finalWave,
      });
      setScoreSubmitted(true);
      await loadLeaderboard();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "UPLOAD FAILED");
    } finally {
      setSubmitting(false);
    }
  };

  const sharePerformance = useCallback(() => {
    const url =
      typeof window !== "undefined" ? window.location.href : "";
    const text = `I just reached the rank of ${rank.titleEn} in Iron Dome Defender! 🛡️ I cleared ${debrief.wavesCleared} waves and saved the strategic assets. Can you beat my score of ${finalScore}? Play now: ${url}`;
    void navigator.clipboard.writeText(text).then(() => {
      setShareNote("COPIED TO CLIPBOARD");
      window.setTimeout(() => setShareNote(null), 2400);
    });
  }, [debrief.wavesCleared, finalScore, rank.titleEn]);

  if (!open) return null;

  return (
    <div style={shell}>
      <div style={{ ...panel, position: "relative" }}>
        <div style={scanlines} aria-hidden />
        <div style={{ position: "relative", zIndex: 1, overflowY: "auto" }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.28em",
              opacity: 0.75,
              fontWeight: 800,
              color: "#5dff4a",
            }}
          >
            CLASSIFIED // MISSION DEBRIEF
          </div>
          <h2
            style={{
              margin: "6px 0 0",
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: "0.14em",
              color: "#ffbf00",
              textShadow: "0 0 14px rgba(255,191,0,0.35)",
            }}
          >
            OPERATION ENDED
          </h2>

          <div
            style={{
              marginTop: 10,
              padding: "12px 14px",
              border: "1px solid rgba(255,191,0,0.35)",
              borderRadius: 3,
              background: "rgba(20,16,4,0.45)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                color: "#88ffc8",
                marginBottom: 6,
              }}
            >
              RANK ACHIEVED
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#ffbf00" }}>
              {rank.titleEn}
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>
              {rank.titleHe}
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: 22,
                fontWeight: 900,
                color: "#39ff14",
                letterSpacing: "0.06em",
              }}
            >
              SCORE {finalScore}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              fontSize: 11,
              letterSpacing: "0.05em",
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                border: "1px solid rgba(57,255,20,0.22)",
                borderRadius: 2,
                background: "rgba(0,24,10,0.5)",
              }}
            >
              <div style={{ opacity: 0.65, fontSize: 9 }}>STRATEGIC ASSETS</div>
              <div style={{ fontWeight: 800, marginTop: 4, color: "#7fd8ff" }}>
                SAVED {debrief.strategicAssetsIntact}/2
              </div>
            </div>
            <div
              style={{
                padding: "10px 12px",
                border: "1px solid rgba(57,255,20,0.22)",
                borderRadius: 2,
                background: "rgba(0,24,10,0.5)",
              }}
            >
              <div style={{ opacity: 0.65, fontSize: 9 }}>WAVES CLEARED</div>
              <div style={{ fontWeight: 800, marginTop: 4, color: "#7fd8ff" }}>
                {debrief.wavesCleared}
              </div>
            </div>
            <div
              style={{
                padding: "10px 12px",
                border: "1px solid rgba(57,255,20,0.22)",
                borderRadius: 2,
                background: "rgba(0,24,10,0.5)",
                gridColumn: "1 / -1",
              }}
            >
              <div style={{ opacity: 0.65, fontSize: 9 }}>LAST WAVE REACHED</div>
              <div style={{ fontWeight: 800, marginTop: 4 }}>{finalWave}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              type="button"
              onClick={() => void sharePerformance()}
              style={{
                flex: "1 1 140px",
                padding: "10px 14px",
                fontFamily: mono,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.1em",
                cursor: "pointer",
                border: "1px solid rgba(127,216,255,0.45)",
                borderRadius: 2,
                background: "rgba(20,40,60,0.55)",
                color: "#7fd8ff",
              }}
            >
              SHARE PERFORMANCE
            </button>
            {shareNote && (
              <span
                style={{
                  alignSelf: "center",
                  fontSize: 10,
                  color: "#5dff4a",
                  fontWeight: 800,
                }}
              >
                {shareNote}
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              fontWeight: 800,
              color: "#5dff4a",
              marginTop: 4,
            }}
          >
            RADAR TERMINAL — TOP 10 TRACKS
          </div>
          {radarError && !loading && (
            <div style={{ fontSize: 10, color: "#ff8888", marginBottom: 4 }}>
              {radarError}
            </div>
          )}
          <div
            style={{
              borderRadius: 3,
              border: "1px solid rgba(57,255,20,0.25)",
              background: "rgba(0,0,0,0.45)",
              maxHeight: 200,
              overflow: "auto",
            }}
          >
            {loading ? (
              <div
                style={{ padding: 20, textAlign: "center", color: "#6a9a6a" }}
              >
                ACQUIRING…
              </div>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 11,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "rgba(0,40,18,0.65)",
                      color: "#88ffc8",
                    }}
                  >
                    <th style={{ padding: "6px 8px", textAlign: "left" }}>#</th>
                    <th style={{ padding: "6px 8px", textAlign: "left" }}>
                      ID
                    </th>
                    <th style={{ padding: "6px 8px", textAlign: "right" }}>
                      SCR
                    </th>
                    <th style={{ padding: "6px 8px", textAlign: "right" }}>
                      W
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(rows ?? []).map((r, i) => (
                    <tr
                      key={r.id}
                      style={{
                        borderTop: "1px solid rgba(57,255,20,0.12)",
                      }}
                    >
                      <td style={{ padding: "6px 8px", color: "#5a8a5a" }}>
                        {i + 1}
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          maxWidth: 120,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.playerName}
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          textAlign: "right",
                          color: "#ffbf00",
                        }}
                      >
                        {r.score}
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          textAlign: "right",
                          color: "#7fd8ff",
                        }}
                      >
                        {r.wave}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && rows && rows.length === 0 && (
              <div
                style={{
                  padding: 16,
                  textAlign: "center",
                  color: "#5a7a5a",
                  fontSize: 11,
                }}
              >
                NO TRACKS ON SCOPE
              </div>
            )}
          </div>

          {!scoreSubmitted ? (
            <>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 10,
                  color: "#88cc88",
                }}
              >
                <span>LOG CALLSIGN (OPTIONAL)</span>
                <input
                  type="text"
                  maxLength={10}
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 10))}
                  placeholder="OPERATOR"
                  style={{
                    padding: "10px 12px",
                    fontFamily: mono,
                    fontSize: 14,
                    color: "#e8ffe8",
                    background: "rgba(0,0,0,0.5)",
                    border: "1px solid rgba(57,255,20,0.3)",
                    borderRadius: 2,
                    outline: "none",
                  }}
                />
              </label>
              {submitError && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#ff6666",
                    textAlign: "center",
                  }}
                >
                  {submitError}
                </div>
              )}
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSubmit()}
                style={{
                  padding: "12px 16px",
                  fontFamily: mono,
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  cursor: submitting ? "wait" : "pointer",
                  border: "2px solid #39ff14",
                  borderRadius: 2,
                  background: "rgba(57,255,20,0.14)",
                  color: "#39ff14",
                }}
              >
                {submitting ? "TRANSMITTING…" : "SUBMIT TO FIRESTORE"}
              </button>
            </>
          ) : (
            <div
              style={{
                textAlign: "center",
                fontSize: 12,
                color: "#5dff4a",
                fontWeight: 800,
              }}
            >
              SCORE LOGGED — GOOD COPY
            </div>
          )}

          <button
            type="button"
            onClick={onPlayAgain}
            style={{
              padding: "12px 16px",
              fontFamily: mono,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.14em",
              cursor: "pointer",
              border: "1px solid rgba(255,191,0,0.45)",
              borderRadius: 2,
              background: "rgba(40,32,8,0.5)",
              color: "#ffbf00",
            }}
          >
            NEW SORTIE
          </button>
        </div>
      </div>
    </div>
  );
}

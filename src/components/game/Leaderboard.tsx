"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  fetchTopScores,
  submitScore,
  type LeaderboardEntry,
} from "@/lib/leaderboardApi";

type Phase = "submit" | "leaderboard";

const mono =
  'ui-monospace, "Cascadia Code", "SFMono-Regular", Menlo, Monaco, Consolas, monospace';

const panelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 18,
  maxWidth: 420,
  width: "100%",
  padding: "28px 24px",
  borderRadius: 12,
  background: "rgba(8, 12, 28, 0.88)",
  border: "1px solid rgba(100, 180, 255, 0.25)",
  boxShadow:
    "0 0 40px rgba(80, 140, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
};

const neonTitle: CSSProperties = {
  fontFamily: mono,
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textAlign: "center",
  color: "#c8f0ff",
  textShadow:
    "0 0 12px rgba(120, 200, 255, 0.9), 0 0 28px rgba(60, 140, 255, 0.45)",
};

const btnPrimary: CSSProperties = {
  padding: "12px 20px",
  fontSize: 15,
  fontWeight: 700,
  fontFamily: mono,
  color: "#0a1020",
  background: "linear-gradient(180deg, #7ec8ff 0%, #3d8fd9 100%)",
  border: "1px solid rgba(180, 230, 255, 0.5)",
  borderRadius: 8,
  cursor: "pointer",
  boxShadow: "0 4px 20px rgba(60, 140, 220, 0.35)",
};

const btnGhost: CSSProperties = {
  padding: "10px 16px",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: mono,
  color: "#9ec8f0",
  background: "rgba(30, 50, 90, 0.5)",
  border: "1px solid rgba(120, 160, 220, 0.35)",
  borderRadius: 8,
  cursor: "pointer",
};

export function Leaderboard({
  open,
  finalScore,
  finalWave,
  onPlayAgain,
}: {
  open: boolean;
  finalScore: number;
  finalWave: number;
  onPlayAgain: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("submit");
  const [name, setName] = useState("");
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTopScores();
      setRows(data);
    } catch {
      setRows([]);
      setError("Could not load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setPhase("submit");
      setName("");
      setRows(null);
      setError(null);
      setLoading(false);
      setSubmitting(false);
    }
  }, [open]);

  const goToLeaderboardOnly = useCallback(async () => {
    setPhase("leaderboard");
    await loadLeaderboard();
  }, [loadLeaderboard]);

  const handleSubmit = async () => {
    const trimmed = name.trim().slice(0, 10);
    if (!trimmed) {
      setError("Enter a name (max 10 characters).");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitScore({
        playerName: trimmed,
        score: finalScore,
        wave: finalWave,
      });
      setPhase("leaderboard");
      await loadLeaderboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(4, 8, 22, 0.82)",
        backdropFilter: "blur(6px)",
        zIndex: 20,
        pointerEvents: "auto",
      }}
    >
      <div style={panelStyle}>
        <div style={neonTitle}>GAME OVER</div>

        {phase === "submit" && (
          <>
            <div
              style={{
                fontFamily: mono,
                fontSize: 14,
                color: "#88b8e8",
                textAlign: "center",
                lineHeight: 1.6,
              }}
            >
              Final score:{" "}
              <span
                style={{
                  color: "#ffee88",
                  textShadow: "0 0 20px rgba(255, 220, 100, 0.6)",
                }}
              >
                {finalScore}
              </span>
              <br />
              Wave reached:{" "}
              <span style={{ color: "#a8e8ff" }}>{finalWave}</span>
            </div>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontFamily: mono,
                fontSize: 12,
                color: "#7aa8d8",
              }}
            >
              <span>Your name</span>
              <input
                type="text"
                maxLength={10}
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 10))}
                placeholder="PILOT"
                style={{
                  padding: "10px 12px",
                  fontFamily: mono,
                  fontSize: 15,
                  color: "#e8f4ff",
                  background: "rgba(0, 0, 0, 0.45)",
                  border: "1px solid rgba(100, 180, 255, 0.35)",
                  borderRadius: 6,
                  outline: "none",
                  boxShadow: "inset 0 0 20px rgba(100, 160, 255, 0.08)",
                }}
              />
            </label>
            {error && (
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 12,
                  color: "#ff8888",
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <button
                type="button"
                style={btnPrimary}
                disabled={submitting}
                onClick={() => void handleSubmit()}
              >
                {submitting ? "…" : "Submit score"}
              </button>
              <button
                type="button"
                style={btnGhost}
                disabled={submitting}
                onClick={() => void goToLeaderboardOnly()}
              >
                Skip to leaderboard
              </button>
            </div>
          </>
        )}

        {phase === "leaderboard" && (
          <>
            <div
              style={{
                fontFamily: mono,
                fontSize: 13,
                color: "#88b8e8",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              TOP PILOTS
            </div>
            <div
              style={{
                overflow: "auto",
                maxHeight: 280,
                borderRadius: 8,
                border: "1px solid rgba(80, 140, 200, 0.25)",
                background: "rgba(0, 0, 0, 0.35)",
              }}
            >
              {loading ? (
                <div
                  style={{
                    padding: 24,
                    textAlign: "center",
                    fontFamily: mono,
                    color: "#6a8ab8",
                  }}
                >
                  Loading…
                </div>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: mono,
                    fontSize: 12,
                    color: "#c8e0ff",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "rgba(40, 80, 140, 0.35)",
                        color: "#a8d8ff",
                        textShadow: "0 0 8px rgba(120, 200, 255, 0.4)",
                      }}
                    >
                      <th style={{ padding: "8px 6px", textAlign: "left" }}>
                        #
                      </th>
                      <th style={{ padding: "8px 6px", textAlign: "left" }}>
                        Name
                      </th>
                      <th style={{ padding: "8px 6px", textAlign: "right" }}>
                        Score
                      </th>
                      <th style={{ padding: "8px 6px", textAlign: "right" }}>
                        Wave
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rows ?? []).map((r, i) => (
                      <tr
                        key={r.id}
                        style={{
                          borderTop: "1px solid rgba(80, 120, 180, 0.2)",
                        }}
                      >
                        <td style={{ padding: "8px 6px", color: "#6a9ad8" }}>
                          {i + 1}
                        </td>
                        <td
                          style={{
                            padding: "8px 6px",
                            maxWidth: 140,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {r.playerName}
                        </td>
                        <td
                          style={{
                            padding: "8px 6px",
                            textAlign: "right",
                            color: "#ffd888",
                          }}
                        >
                          {r.score}
                        </td>
                        <td
                          style={{
                            padding: "8px 6px",
                            textAlign: "right",
                            color: "#a8e8ff",
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
                    padding: 20,
                    textAlign: "center",
                    fontFamily: mono,
                    color: "#6a8ab8",
                  }}
                >
                  No scores yet.
                </div>
              )}
            </div>
            {error && phase === "leaderboard" && (
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  color: "#ff8888",
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}
            <button
              type="button"
              style={{
                ...btnPrimary,
                marginTop: 4,
              }}
              onClick={onPlayAgain}
            >
              Play again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

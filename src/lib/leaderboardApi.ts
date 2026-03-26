export type LeaderboardEntry = {
  id: string;
  playerName: string;
  score: number;
  wave: number;
  createdAt: string;
};

export async function fetchTopScores(): Promise<LeaderboardEntry[]> {
  const res = await fetch("/api/scores", { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to load leaderboard");
  }
  return res.json() as Promise<LeaderboardEntry[]>;
}

export async function submitScore(payload: {
  playerName: string;
  score: number;
  wave: number;
}): Promise<LeaderboardEntry> {
  const res = await fetch("/api/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(
      typeof err.error === "string" ? err.error : "Could not submit score",
    );
  }
  return data as LeaderboardEntry;
}

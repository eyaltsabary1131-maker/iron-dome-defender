export async function fetchGlobalIntercepts(): Promise<number> {
  const res = await fetch("/api/stats", { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as {
    totalIntercepts?: unknown;
  };
  const n = Number(data.totalIntercepts ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

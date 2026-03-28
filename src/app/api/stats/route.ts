import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/** Community aggregate: `stats/global_metrics` document. */
export async function GET() {
  try {
    const ref = doc(db, "stats", "global_metrics");
    const snap = await getDoc(ref);
    const totalIntercepts = snap.exists()
      ? Number(snap.data()?.total_intercepts ?? 0)
      : 0;
    const safe = Number.isFinite(totalIntercepts)
      ? Math.max(0, Math.floor(totalIntercepts))
      : 0;
    return NextResponse.json({ totalIntercepts: safe });
  } catch {
    return NextResponse.json({ totalIntercepts: 0 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/** Leaderboard: `scores` collection, highest score first, cap 10 for radar terminal UI. */
const TOP_SCORES_LIMIT = 10;

export async function GET() {
  try {
    const q = query(
      collection(db, "scores"),
      orderBy("score", "desc"),
      limit(TOP_SCORES_LIMIT),
    );
    const snapshot = await getDocs(q);
    const scores = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        playerName: String(data.playerName ?? ""),
        score: Number(data.score ?? 0),
        wave: Number(data.wave ?? 0),
        createdAt:
          typeof data.createdAt === "string"
            ? data.createdAt
            : new Date().toISOString(),
      };
    });
    return NextResponse.json(scores);
  } catch {
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const raw = body as Record<string, unknown>;
    const nameRaw = typeof raw.playerName === "string" ? raw.playerName : "";
    const playerName = nameRaw.trim().slice(0, 10);

    if (playerName.length === 0) {
      return NextResponse.json(
        { error: "playerName is required (max 10 characters)" },
        { status: 400 },
      );
    }

    const scoreNum = Number(raw.score);
    const waveNum = Number(raw.wave);

    if (!Number.isFinite(scoreNum) || !Number.isInteger(scoreNum) || scoreNum < 0) {
      return NextResponse.json(
        { error: "score must be a non-negative integer" },
        { status: 400 },
      );
    }

    if (!Number.isFinite(waveNum) || !Number.isInteger(waveNum) || waveNum < 1) {
      return NextResponse.json(
        { error: "wave must be a positive integer" },
        { status: 400 },
      );
    }

    const createdAt = new Date().toISOString();
    const docRef = await addDoc(collection(db, "scores"), {
      playerName,
      score: scoreNum,
      wave: waveNum,
      createdAt,
    });

    const record = {
      id: docRef.id,
      playerName,
      score: scoreNum,
      wave: waveNum,
      createdAt,
    };

    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not save score" },
      { status: 500 },
    );
  }
}

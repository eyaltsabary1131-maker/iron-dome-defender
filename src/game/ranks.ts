/** IDF-inspired rank tiers by career score. */

export type RankInfo = {
  /** 0 = lowest tier; used for promotion detection */
  tierIndex: number;
  titleEn: string;
  titleHe: string;
};

const RANKS: RankInfo[] = [
  { tierIndex: 0, titleEn: "Private", titleHe: "טוראי" },
  { tierIndex: 1, titleEn: "Sergeant", titleHe: "סמל" },
  { tierIndex: 2, titleEn: "Lieutenant", titleHe: "סגן" },
  { tierIndex: 3, titleEn: "Major", titleHe: "רס\"ן" },
  {
    tierIndex: 4,
    titleEn: "Air Defense Commander",
    titleHe: "מפקד מערך ההגנה האווירית",
  },
];

/**
 * Bands: 0–5k Private, 5k–15k Sergeant, 15k–30k Lieutenant, 30k–60k Major, 60k+ Commander.
 */
export function getRankFromScore(score: number): RankInfo {
  const s = Math.max(0, Math.floor(score));
  if (s >= 60000) return RANKS[4]!;
  if (s >= 30000) return RANKS[3]!;
  if (s >= 15000) return RANKS[2]!;
  if (s >= 5000) return RANKS[1]!;
  return RANKS[0]!;
}

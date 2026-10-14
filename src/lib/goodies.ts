/**
 * Goodies: points earned by practising, redeemed for credits (lib/plans
 * CREDIT_COSTS buys one more use of a metered feature with them).
 *
 * The owner's calls (2026-10-15): digital goodies first, granted
 * automatically, and only points that cannot be faked count.
 *
 * **Points are not XP.** `User.xp` is also the rank (`rating`) and the
 * leaderboard; spending it would push a student down the ranks for claiming
 * a reward. So the balance here is *derived* — earned from rows that already
 * exist, less what `Redemption` rows have spent — and XP is never touched.
 *
 * **What counts.** A source counts only when the server decided it:
 *   - a coding first solve (`ProblemSolve`): expected outputs never leave
 *     the server, so the program had to compute them;
 *   - a SQL first solve (`SqlSolve`): judged on hidden datasets server-side;
 *   - a roadmap chest (`RoadmapReward.xp`): opened by those solves;
 *   - a skill credential's first issue (proctored; a revoked one does not count);
 *   - a finished study track (`StudyEnrollment.completedAt`).
 * Left out on purpose: bug-hunt XP (a hunt's PASS can be forged — CLAUDE.md,
 * Scoring integrity), duel XP (two accounts of one person can farm it), the
 * daily contest's bonus, community and every other source. Add one only once
 * the server decides it alone.
 *
 * The amounts are each source's own XP, so a student reading "+20 XP" on a
 * medium solve also earned 20 points for it.
 */

import { solveXp } from "./activity.js";

export interface Goodie {
  id: string;
  name: string;
  blurb: string;
  /** Points it costs. */
  points: number;
  /** Credits it adds to the wallet (services/credits). */
  credits: number;
}

/**
 * The catalogue. Priced at about ten points a credit for the small items,
 * with a discount on the large one; a pack of 100 credits sells for ₹99, so
 * fifty medium problems (1,000 points) is worth roughly that pack.
 * The first two are sized to one use of a feature (CREDIT_COSTS:
 * placement mock 20, voice interview 40) so the card can say what it buys.
 */
export const GOODIES: readonly Goodie[] = [
  { id: "credits-20", name: "20 credits", blurb: "One extra placement mock test", points: 200, credits: 20 },
  { id: "credits-40", name: "40 credits", blurb: "One extra voice interview", points: 400, credits: 40 },
  { id: "credits-100", name: "100 credits", blurb: "The best value — a pack's worth", points: 900, credits: 100 },
];

export const goodieFor = (id: unknown): Goodie | null => GOODIES.find((g) => g.id === id) ?? null;

/** An account this young cannot redeem — a farm of new accounts would otherwise turn easy solves into credits. */
export const MIN_ACCOUNT_DAYS = 14;

/**
 * What the account has done, read from existing rows by services/goodies.
 * The credential and track amounts arrive already priced (CREDENTIAL_XP,
 * TRACK_BONUS_XP live beside the code that pays them, which imports Prisma),
 * so this file stays pure and holds no second copy of either table.
 */
export interface PointFacts {
  /** Difficulty of each coding problem solved (one per ProblemSolve row). */
  codingSolves: readonly string[];
  /** Difficulty of each SQL problem solved that the module still ships. */
  sqlSolves: readonly string[];
  /** RoadmapReward.xp of each chest opened. */
  chests: readonly number[];
  /** The first-issue XP of each credential held, revoked ones left out. */
  credentials: readonly number[];
  /** The bonus XP of each study track finished. */
  tracks: readonly number[];
  /** Σ Redemption.points. */
  spent: number;
}

export interface PointsSource {
  key: "coding" | "sql" | "roadmap" | "credentials" | "tracks";
  label: string;
  count: number;
  points: number;
}

export interface PointsBalance {
  earned: number;
  spent: number;
  balance: number;
  sources: PointsSource[];
}

export function pointsOf(facts: PointFacts): PointsBalance {
  const total = (xs: readonly number[]) => xs.reduce((n, x) => n + Math.max(0, x), 0);
  const sources: PointsSource[] = [
    { key: "coding", label: "Coding problems solved", count: facts.codingSolves.length, points: total(facts.codingSolves.map(solveXp)) },
    { key: "sql", label: "SQL problems solved", count: facts.sqlSolves.length, points: total(facts.sqlSolves.map(solveXp)) },
    { key: "roadmap", label: "Roadmap chests opened", count: facts.chests.length, points: total(facts.chests) },
    { key: "credentials", label: "Skill credentials earned", count: facts.credentials.length, points: total(facts.credentials) },
    { key: "tracks", label: "Study tracks finished", count: facts.tracks.length, points: total(facts.tracks) },
  ];
  const earned = sources.reduce((n, s) => n + s.points, 0);
  return { earned, spent: facts.spent, balance: Math.max(0, earned - facts.spent), sources };
}

const DAY_MS = 86_400_000;

/**
 * Why this account cannot redeem `item` now, as a sentence for the student —
 * or null when it can. Order: the account's own standing first (nothing the
 * student can fix by solving more), then the balance.
 */
export function redeemRefusal(input: { emailVerified: boolean; createdAt: Date; balance: number; item: Goodie; now?: Date }): string | null {
  const now = input.now ?? new Date();
  if (!input.emailVerified) return "Verify your email address to redeem goodies.";
  const age = now.getTime() - input.createdAt.getTime();
  if (age < MIN_ACCOUNT_DAYS * DAY_MS) {
    const left = Math.ceil((MIN_ACCOUNT_DAYS * DAY_MS - age) / DAY_MS);
    return `Goodies open once your account is ${MIN_ACCOUNT_DAYS} days old — ${left} more day${left === 1 ? "" : "s"}.`;
  }
  if (input.balance < input.item.points) {
    const short = input.item.points - input.balance;
    return `You need ${short.toLocaleString("en-IN")} more point${short === 1 ? "" : "s"} for this.`;
  }
  return null;
}

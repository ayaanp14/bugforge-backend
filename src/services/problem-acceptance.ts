import { prisma } from "../lib/prisma.js";
import { cachedShared } from "../lib/cache.js";

/**
 * Each problem's acceptance rate — accepted submissions over all submissions,
 * as LeetCode counts it — for the catalogue's Acceptance column and its sort.
 *
 * Derived, never counted up (the rule services/entitlements.ts states): one
 * GROUP BY problemId, verdict over Submission, which the (problemId, verdict)
 * index answers without touching a row (EXPLAIN: covering index scan). The
 * answer is the same for every reader and moves slowly, so it is cached in
 * both tiers for ten minutes; a list request never waits for it after the
 * first, since the cache serves the old copy while it refreshes.
 *
 * Only Submission rows count: a Run writes none, and contests, duels and
 * Battles keep their own tables.
 */

/** Below this many submissions a rate is noise — a new problem would read 0% or 100% — so it is shown as "—". */
export const ACCEPTANCE_MIN_SUBMISSIONS = 20;

const KEY = "problems:acceptance:v1";
const TTL_SECONDS = 600;

/** Percent, one decimal: 2 of 3 is 66.7. */
export function acceptanceRate(accepted: number, total: number): number | null {
  if (total < ACCEPTANCE_MIN_SUBMISSIONS) return null;
  return Math.round((accepted / total) * 1000) / 10;
}

/** problemId → rate, for the problems with enough submissions to have one. */
export function acceptanceTable(rows: ReadonlyArray<{ problemId: string; verdict: string; count: number }>): Record<string, number> {
  const tally = new Map<string, { accepted: number; total: number }>();
  for (const { problemId, verdict, count } of rows) {
    const t = tally.get(problemId) ?? { accepted: 0, total: 0 };
    t.total += count;
    if (verdict === "ACCEPTED") t.accepted += count;
    tally.set(problemId, t);
  }
  const out: Record<string, number> = {};
  for (const [id, { accepted, total }] of tally) {
    const rate = acceptanceRate(accepted, total);
    if (rate !== null) out[id] = rate;
  }
  return out;
}

const asMap = new WeakMap<Record<string, number>, ReadonlyMap<string, number>>();

/**
 * The rates, or an empty map when they cannot be had: a list is still a list
 * without its Acceptance column, so a failure here never fails the request.
 */
export async function acceptanceRates(): Promise<ReadonlyMap<string, number>> {
  try {
    const table = await cachedShared(KEY, TTL_SECONDS, async () => {
      const groups = await prisma.submission.groupBy({ by: ["problemId", "verdict"], _count: { _all: true } });
      return acceptanceTable(groups.map((g) => ({ problemId: g.problemId, verdict: g.verdict, count: g._count._all })));
    }, TTL_SECONDS * 1000);
    let map = asMap.get(table);
    if (!map) asMap.set(table, (map = new Map(Object.entries(table))));
    return map;
  } catch (err) {
    console.warn("[problem-acceptance] rates unavailable:", (err as Error).message?.split("\n")[0]);
    return new Map();
  }
}

import { prisma } from "./prisma.js";

/**
 * The judge's view of a problem, kept in memory.
 *
 * A problem carries ~5,000 hidden test cases (~1 MB of rows) and every Run or
 * Submit used to pull all of them — plus the 13-language editorial solutions,
 * starter code and hints on the Problem row — out of a database ~500 ms away,
 * before the engine had even been asked. Suites only change at seed time, so
 * the second submit on the same problem was paying the same megabyte again.
 *
 * In-process, not Redis: this Redis is ~300 ms a round trip and a 1 MB value
 * costs more to ship across than the query it would replace saves. A bounded
 * LRU of a few dozen problems is what one instance actually has hot, and a
 * 15-minute TTL is how long a reseed can be out of date before it is noticed —
 * `forgetJudgeSuite` is for anything that wants it sooner.
 */

export interface JudgeCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  orderIndex: number;
}

/** What the judge reads off the Problem row: limits, the driver signature, the XP tier and the reference solution that fills in custom cases. */
export const JUDGE_PROBLEM_SELECT = {
  id: true,
  slug: true,
  difficulty: true,
  timeLimitMs: true,
  memoryLimitMb: true,
  signature: true,
  referenceSolution: true,
  referenceLanguage: true,
} as const;

export type JudgeProblem = {
  id: string;
  slug: string;
  difficulty: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  signature: unknown;
  referenceSolution: string | null;
  referenceLanguage: string | null;
};

const MAX_PROBLEMS = 64;
const TTL_MS = 15 * 60_000;

/**
 * Bounded LRU with single-flight loads. A Map iterates in insertion order, so
 * re-inserting on every hit makes the first key the least recently used one.
 * Concurrent misses on one key share a single load rather than each pulling
 * the same megabyte through a pool of five connections.
 */
class BoundedLru<V> {
  private readonly entries = new Map<string, { value: V; expiresAt: number }>();
  private readonly inFlight = new Map<string, Promise<V>>();

  constructor(private readonly max: number, private readonly ttlMs: number) {}

  async get(key: string, load: () => Promise<V>): Promise<V> {
    const hit = this.entries.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      this.entries.delete(key);
      this.entries.set(key, hit);
      return hit.value;
    }

    const pending = this.inFlight.get(key);
    if (pending) return pending;

    const promise = load()
      .then((value) => {
        this.entries.delete(key);
        this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
        while (this.entries.size > this.max) {
          const oldest = this.entries.keys().next().value;
          if (oldest === undefined) break;
          this.entries.delete(oldest);
        }
        return value;
      })
      .finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, promise);
    return promise;
  }

  /** What is already cached for this key, or undefined. Never loads. */
  peek(key: string): V | undefined {
    const hit = this.entries.get(key);
    return hit && hit.expiresAt > Date.now() ? hit.value : undefined;
  }

  forget(key: string): void {
    this.entries.delete(key);
    this.inFlight.delete(key);
  }
}

const suites = new BoundedLru<JudgeCase[]>(MAX_PROBLEMS, TTL_MS);
const visibleSuites = new BoundedLru<JudgeCase[]>(MAX_PROBLEMS, TTL_MS);
const problems = new BoundedLru<JudgeProblem | null>(MAX_PROBLEMS, TTL_MS);

/** Every test case of a problem, visible ones first by orderIndex. Filter `isHidden` for a Run. */
export function getJudgeSuite(problemId: string): Promise<JudgeCase[]> {
  return suites.get(problemId, () =>
    prisma.testCase.findMany({
      where: { problemId },
      orderBy: { orderIndex: "asc" },
      select: { input: true, expectedOutput: true, isHidden: true, orderIndex: true },
    }),
  );
}

/**
 * Only the cases a Run shows — the visible ones.
 *
 * A Run grades against the three sample cases; the ~5,000 hidden ones are
 * what a Submit is marked on. It used to read the whole suite and filter in
 * memory, which meant every cold Run pulled 0.38 MB and 5,003 rows across the
 * wire to use three of them. Measured against production (two-sum, 5,003
 * cases): 2,275 ms for the full suite against 583 ms for the visible three.
 *
 * TestCase is ~3M rows and 425 MB, so it is the one table in this schema
 * where what you select genuinely matters. No new index is needed: the
 * existing (problemId, orderIndex) index still answers this as a ref lookup
 * and the isHidden test is a filter over one problem's entries — the saving
 * is the rows that are never fetched, not the scan.
 *
 * When a Submit has already warmed the full suite, that copy answers instead
 * of a second query.
 */
export function getJudgeVisibleCases(problemId: string): Promise<JudgeCase[]> {
  const full = suites.peek(problemId);
  if (full) return Promise.resolve(full.filter((c) => !c.isHidden));
  return visibleSuites.get(problemId, () =>
    prisma.testCase.findMany({
      where: { problemId, isHidden: false },
      orderBy: { orderIndex: "asc" },
      select: { input: true, expectedOutput: true, isHidden: true, orderIndex: true },
    }),
  );
}

/**
 * The judge's slice of the Problem row (see JUDGE_PROBLEM_SELECT), or null
 * when there is no such problem — or it is unpublished. A retired problem
 * 404s on its page but its id still worked here, so it could be run and
 * submitted (and paid XP for) from the network tab.
 */
export function getJudgeProblem(problemId: string): Promise<JudgeProblem | null> {
  return problems.get(problemId, () =>
    prisma.problem.findFirst({ where: { id: problemId, isPublished: true }, select: JUDGE_PROBLEM_SELECT }),
  );
}

/** Drop a problem's cached suite and row — for a reseed that cannot wait out the TTL. */
export function forgetJudgeSuite(problemId: string): void {
  suites.forget(problemId);
  visibleSuites.forget(problemId);
  problems.forget(problemId);
}

import { prisma } from "../lib/prisma.js";
import { cached, cachedShared, invalidate } from "../lib/cache.js";
import { SQL_PROBLEMS, SQL_TOPICS, sqlProblem } from "../lib/sql-problems/index.js";
import { buildProblem, starterQuery } from "../lib/sql-problems/build.js";
import type { SqlProblemSpec } from "../lib/sql-problems/types.js";
import { expectedResults, type TableView } from "../lib/sql/judge.js";
import type { ResultSet } from "../lib/sql/types.js";

/**
 * The SQL problems' reads (routes/sql.ts): the list, one problem's page, the
 * reader's standing and the acceptance rates. The problems are code
 * (lib/sql-problems), so the list and the pages need no query at all; only
 * standing and acceptance read SqlSubmission/SqlSolve.
 */

export interface SqlProblemRow {
  number: number;
  slug: string;
  title: string;
  difficulty: SqlProblemSpec["difficulty"];
  topics: string[];
  /** Accepted ÷ all submissions, null under 20 submissions. */
  acceptance: number | null;
}

export interface SqlExample {
  input: Record<string, TableView>;
  output: ResultSet;
}

export interface SqlProblemPage {
  number: number;
  slug: string;
  title: string;
  difficulty: SqlProblemSpec["difficulty"];
  topics: string[];
  description: string;
  ordered: boolean;
  tables: SqlProblemSpec["tables"];
  examples: SqlExample[];
  hints: string[];
  editorial: string;
  solution: string;
  alternatives: string[];
  starter: string;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

const numberOf = new Map(SQL_PROBLEMS.map((p, i) => [p.slug, i + 1]));
export const sqlNumber = (slug: string): number => numberOf.get(slug) ?? 0;

const ACCEPTANCE_TTL_SECONDS = 600;
const ACCEPTANCE_MIN = 20;

/** Accepted share per slug; one GROUP BY on the (slug, verdict) index, cached. Never fails the list. */
export async function sqlAcceptance(): Promise<Map<string, number>> {
  try {
    const rows = await cachedShared("sql:acceptance:v1", ACCEPTANCE_TTL_SECONDS, async () => {
      const grouped = await prisma.sqlSubmission.groupBy({ by: ["slug", "verdict"], _count: { _all: true } });
      return grouped.map((g) => ({ slug: g.slug, verdict: g.verdict, n: g._count._all }));
    });
    const totals = new Map<string, { all: number; ok: number }>();
    for (const r of rows) {
      const t = totals.get(r.slug) ?? { all: 0, ok: 0 };
      t.all += r.n;
      if (r.verdict === "ACCEPTED") t.ok += r.n;
      totals.set(r.slug, t);
    }
    return new Map([...totals].filter(([, t]) => t.all >= ACCEPTANCE_MIN).map(([slug, t]) => [slug, Math.round((t.ok / t.all) * 1000) / 10]));
  } catch (err) {
    console.error("[sql] acceptance failed:", err);
    return new Map();
  }
}

export async function sqlProblemList(): Promise<{ problems: SqlProblemRow[]; topics: string[]; counts: Record<string, number> }> {
  const acceptance = await sqlAcceptance();
  const problems = SQL_PROBLEMS.map((p) => ({
    number: sqlNumber(p.slug),
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    topics: p.topics,
    acceptance: acceptance.get(p.slug) ?? null,
  }));
  const counts: Record<string, number> = { EASY: 0, MEDIUM: 0, HARD: 0 };
  for (const p of problems) counts[p.difficulty] = (counts[p.difficulty] ?? 0) + 1;
  return { problems, topics: SQL_TOPICS.filter((t) => SQL_PROBLEMS.some((p) => p.topics.includes(t))), counts };
}

function tablesOf(spec: SqlProblemSpec, index: number): Record<string, TableView> {
  const data = buildProblem(spec).data[index] ?? {};
  return Object.fromEntries(spec.tables.map((t) => [t.name, { columns: t.columns.map((c) => c.name), rows: data[t.name] ?? [] }]));
}

const PAGE_TTL_MS = 60 * 60 * 1000;

/** One problem's page; null for an unknown slug. The examples' outputs come from running the reference. */
export function sqlProblemPage(slug: string): Promise<SqlProblemPage | null> {
  const spec = sqlProblem(slug);
  if (!spec) return Promise.resolve(null);
  return cached(`sql:page:v1:${slug}`, PAGE_TTL_MS, async () => {
    const expected = await expectedResults(spec);
    const built = buildProblem(spec);
    const i = SQL_PROBLEMS.indexOf(spec);
    const near = (p: SqlProblemSpec | undefined) => (p ? { slug: p.slug, title: p.title } : null);
    return {
      number: sqlNumber(spec.slug),
      slug: spec.slug,
      title: spec.title,
      difficulty: spec.difficulty,
      topics: spec.topics,
      description: spec.description,
      ordered: spec.ordered ?? false,
      tables: spec.tables,
      examples: Array.from({ length: built.visible }, (_, k) => ({ input: tablesOf(spec, k), output: expected[k]! })),
      hints: spec.hints,
      editorial: spec.editorial,
      solution: spec.solution,
      alternatives: spec.alternatives ?? [],
      starter: starterQuery(spec),
      prev: near(SQL_PROBLEMS[i - 1]),
      next: near(SQL_PROBLEMS[i + 1]),
    };
  });
}

const standingKey = (userId: string) => `sql:standing:v1:${userId}`;

/** The reader's solved and attempted slugs. */
export function sqlStanding(userId: string): Promise<{ solved: string[]; attempted: string[] }> {
  return cached(standingKey(userId), 30_000, async () => {
    const [solves, tried] = await Promise.all([
      prisma.sqlSolve.findMany({ where: { userId }, select: { slug: true } }),
      // groupBy: Prisma's `distinct` dedupes in Node on MySQL (services/roadmap.ts solvedIds).
      prisma.sqlSubmission.groupBy({ by: ["slug"], where: { userId } }),
    ]);
    const solved = solves.map((s) => s.slug);
    const solvedSet = new Set(solved);
    return { solved, attempted: tried.map((t) => t.slug).filter((s) => !solvedSet.has(s)) };
  });
}

export const forgetSqlStanding = (userId: string): void => invalidate(standingKey(userId));

/** Sitemap entries: the index and every problem. */
export const sqlSitemapEntries = (): Array<{ path: string }> => SQL_PROBLEMS.map((p) => ({ path: `/sql/${p.slug}` }));

import { prisma } from "../lib/prisma.js";
import { cached, cachedShared, invalidate } from "../lib/cache.js";
import { SQL_COMPANIES, SQL_PROBLEMS, SQL_TOPICS, sqlProblem } from "../lib/sql-problems/index.js";
import { buildProblem, starterQuery } from "../lib/sql-problems/build.js";
import type { SqlProblemSpec } from "../lib/sql-problems/types.js";
import { exampleResults, type TableView } from "../lib/sql/judge.js";
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
  /** The company the problem is set at (the `company-*.ts` sets); null for the topic and industry sets. */
  company: string | null;
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
  company: string | null;
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

export interface SqlProblemListAll {
  problems: SqlProblemRow[];
  topics: string[];
  /** The companies with a set, in the list's order (SQL_COMPANIES). */
  companies: string[];
  counts: Record<string, number>;
}

export async function sqlProblemList(): Promise<SqlProblemListAll> {
  const acceptance = await sqlAcceptance();
  const problems = SQL_PROBLEMS.map((p) => ({
    number: sqlNumber(p.slug),
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    topics: p.topics,
    company: p.company ?? null,
    acceptance: acceptance.get(p.slug) ?? null,
  }));
  const counts: Record<string, number> = { EASY: 0, MEDIUM: 0, HARD: 0 };
  for (const p of problems) counts[p.difficulty] = (counts[p.difficulty] ?? 0) + 1;
  return { problems, topics: SQL_TOPICS.filter((t) => SQL_PROBLEMS.some((p) => p.topics.includes(t))), companies: [...SQL_COMPANIES], counts };
}

export const SQL_PAGE_SIZE = 100;

export interface SqlListQuery {
  offset: number;
  limit: number;
  difficulty?: SqlProblemSpec["difficulty"];
  topic?: string;
  company?: string;
  search?: string;
}

export interface SqlListPage {
  problems: SqlProblemRow[];
  /** Rows matching the filters, across every page. */
  total: number;
  /** The offset of the next page; null on the last. */
  next: number | null;
  /** The facets, over the whole list (not the filtered one) — the masthead, the difficulty pills, the topic chips. */
  topics: Array<{ name: string; count: number }>;
  /** The company chips, the same way: every company with a set and its count. */
  companies: Array<{ name: string; count: number }>;
  counts: Record<string, number>;
  all: number;
}

/**
 * The search box's rule, answered here so it covers every problem and not
 * only the pages already loaded: a number ("12", "#12") is that problem;
 * otherwise every word must appear in the title, a topic, the company or the slug. The
 * SPA's matchesSqlSearch (components/sql/sql-ui.ts) is the same rule.
 */
export function matchesSqlSearch(row: SqlProblemRow, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const number = /^#?(\d+)\.?$/.exec(q);
  if (number) return row.number === Number(number[1]);
  const hay = `${row.title} ${row.topics.join(" ")} ${row.company ?? ""} ${row.slug.replace(/-/g, " ")}`.toLowerCase();
  return q.split(/\s+/).every((word) => hay.includes(word));
}

/** The pure half of sqlProblemListPage: narrow, search and slice the list. */
export function pageOfSqlList(list: SqlProblemListAll, o: SqlListQuery): SqlListPage {
  const matching = list.problems.filter(
    (p) =>
      (!o.difficulty || p.difficulty === o.difficulty) &&
      (!o.topic || p.topics.includes(o.topic)) &&
      (!o.company || p.company === o.company) &&
      matchesSqlSearch(p, o.search ?? ""),
  );
  const problems = matching.slice(o.offset, o.offset + o.limit);
  const end = o.offset + problems.length;
  return {
    problems,
    total: matching.length,
    next: end < matching.length ? end : null,
    topics: list.topics.map((name) => ({ name, count: list.problems.filter((p) => p.topics.includes(name)).length })),
    companies: list.companies.map((name) => ({ name, count: list.problems.filter((p) => p.company === name).length })),
    counts: list.counts,
    all: list.problems.length,
  };
}

/** One page of the list (/sql's table, 100 rows a request as the reader scrolls). */
export async function sqlProblemListPage(o: SqlListQuery): Promise<SqlListPage> {
  return pageOfSqlList(await sqlProblemList(), o);
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
    const expected = await exampleResults(spec);
    const built = buildProblem(spec);
    const i = SQL_PROBLEMS.indexOf(spec);
    const near = (p: SqlProblemSpec | undefined) => (p ? { slug: p.slug, title: p.title } : null);
    return {
      number: sqlNumber(spec.slug),
      slug: spec.slug,
      title: spec.title,
      difficulty: spec.difficulty,
      topics: spec.topics,
      company: spec.company ?? null,
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

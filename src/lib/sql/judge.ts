import { checkStatement, rewriteMysql } from "./dialect.js";
import { compareResults } from "./compare.js";
import { runSqlJob, SqlTimeoutError } from "./engine.js";
import type { Cell, ResultSet } from "./types.js";
import { buildProblem } from "../sql-problems/build.js";
import type { SqlProblemSpec } from "../sql-problems/types.js";

/**
 * Judging a learner's query against a SQL problem.
 *
 * Expected results are the reference solution run on every dataset, computed
 * once per problem per process and kept (they are a few kilobytes); a run or
 * a submission then executes only the learner's query. A run uses the visible
 * examples and returns every one side by side; a submission uses all of them
 * and returns the first failure with its tables — the hidden datasets are
 * small, and seeing the rows a query got wrong is how SQL is debugged (the
 * expected *query* never leaves the server).
 */

export type SqlVerdict = "ACCEPTED" | "WRONG_ANSWER" | "RUNTIME_ERROR" | "TIME_LIMIT_EXCEEDED" | "INVALID_QUERY";

export interface TableView {
  columns: string[];
  rows: Cell[][];
}

export interface SqlCaseResult {
  index: number;
  hidden: boolean;
  passed: boolean;
  reason?: string;
  error?: string;
  expected?: ResultSet;
  actual?: ResultSet;
  /** A failing hidden dataset's tables. */
  input?: Record<string, TableView>;
}

export interface SqlJudgeResult {
  verdict: SqlVerdict;
  message: string | null;
  passed: number;
  total: number;
  runtimeMs: number;
  cases: SqlCaseResult[];
}

/** Rows compared (both sides capped here; counts are compared in full). */
const COMPARE_ROWS = 1000;
/** Rows sent to the browser per result table. */
const SHOW_ROWS = 100;
const RUN_DEADLINE_MS = 4000;
const SUBMIT_DEADLINE_MS = 8000;

const expectedCache = new Map<string, Promise<ResultSet[]>>();

/** The reference's result on every dataset — computed once; a failure is a content bug and is not cached. */
export function expectedResults(spec: SqlProblemSpec): Promise<ResultSet[]> {
  let hit = expectedCache.get(spec.slug);
  if (!hit) {
    const built = buildProblem(spec);
    hit = runSqlJob({ schema: built.schema, datasets: built.scripts, queries: [rewriteMysql(spec.solution)], maxRows: COMPARE_ROWS }, 30_000).then((results) =>
      results.map((r, i) => {
        const outcome = r[0]!;
        if (!outcome.ok) throw new Error(`sql problem ${spec.slug}: the reference failed on dataset ${i}: ${outcome.error}`);
        return outcome.result;
      }),
    );
    hit.catch(() => expectedCache.delete(spec.slug));
    expectedCache.set(spec.slug, hit);
  }
  return hit;
}

const trim = (r: ResultSet): ResultSet => (r.rows.length > SHOW_ROWS ? { ...r, rows: r.rows.slice(0, SHOW_ROWS), truncated: true } : r);

function tablesOf(spec: SqlProblemSpec, index: number): Record<string, TableView> {
  const data = buildProblem(spec).data[index] ?? {};
  return Object.fromEntries(spec.tables.map((t) => [t.name, { columns: t.columns.map((c) => c.name), rows: (data[t.name] ?? []).slice(0, SHOW_ROWS) }]));
}

export async function judgeSql(spec: SqlProblemSpec, query: string, mode: "run" | "submit"): Promise<SqlJudgeResult> {
  const built = buildProblem(spec);
  const total = mode === "run" ? built.visible : built.data.length;
  const check = checkStatement(query);
  if (!check.ok) return { verdict: "INVALID_QUERY", message: check.error, passed: 0, total, runtimeMs: 0, cases: [] };
  const expected = await expectedResults(spec);
  let outcomes;
  try {
    outcomes = await runSqlJob(
      { schema: built.schema, datasets: built.scripts.slice(0, total), queries: [rewriteMysql(query)], maxRows: COMPARE_ROWS },
      mode === "run" ? RUN_DEADLINE_MS : SUBMIT_DEADLINE_MS,
    );
  } catch (err) {
    if (err instanceof SqlTimeoutError) {
      return { verdict: "TIME_LIMIT_EXCEEDED", message: "Your query ran past the time limit. Look for a join without a condition or a recursive query that never stops.", passed: 0, total, runtimeMs: 0, cases: [] };
    }
    throw err;
  }
  const cases: SqlCaseResult[] = [];
  let passed = 0;
  let runtime = 0;
  let firstFailure: SqlCaseResult | null = null;
  let firstError: string | null = null;
  outcomes.forEach((r, index) => {
    const outcome = r[0]!;
    const hidden = index >= built.visible;
    const exp = expected[index]!;
    if (!outcome.ok) {
      const c: SqlCaseResult = { index, hidden, passed: false, error: outcome.error, expected: trim(exp) };
      if (mode === "run") cases.push(c);
      firstError ??= outcome.error;
      if (!firstFailure) firstFailure = c;
      return;
    }
    runtime += outcome.result.ms;
    const cmp = compareResults(exp, outcome.result, spec.ordered ?? false);
    if (cmp.ok) passed++;
    const c: SqlCaseResult = { index, hidden, passed: cmp.ok, reason: cmp.ok ? undefined : cmp.reason, expected: trim(exp), actual: trim(outcome.result) };
    if (mode === "run") cases.push(c);
    else if (!cmp.ok && !firstFailure) firstFailure = c;
  });
  const failure = firstFailure as SqlCaseResult | null;
  if (mode === "submit" && failure) {
    if (failure.hidden) failure.input = tablesOf(spec, failure.index);
    cases.push(failure);
  }
  const verdict: SqlVerdict = passed === total ? "ACCEPTED" : firstError && failure?.error ? "RUNTIME_ERROR" : "WRONG_ANSWER";
  const message =
    verdict === "ACCEPTED"
      ? null
      : verdict === "RUNTIME_ERROR"
        ? firstError
        : failure?.reason ?? null;
  return { verdict, message, passed, total, runtimeMs: Math.round(runtime * 10) / 10, cases };
}

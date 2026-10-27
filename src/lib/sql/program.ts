import { tokenize, rewriteMysql, type Token } from "./dialect.js";
import { runSqlJob, SqlBusyError, SqlTimeoutError } from "./engine.js";
import type { Cell, QueryOutcome, ResultSet } from "./types.js";
import type { ProgramCase, ProgramJudgeResult, ProgramRunResult, ProgramVerdict } from "../program-judge.js";

/**
 * The SQL study plan's judge: the program judge's contract (lib/program-judge.ts
 * — a source, a stdin, the stdout it should print) answered on the SQL
 * problems' engine (lib/sql/engine.ts, SQLite as WebAssembly on a worker
 * thread) instead of a remote one.
 *
 * Why not Paiza like the other four tracks: Paiza's MySQL would teach the
 * real server, but a study exercise is run on every keystroke of a "Run"
 * button by a learner who is told the answer is judged in a second, and the
 * remote engines are ~1 s a case on a good day — the local engine is
 * milliseconds and cannot go down. The MySQL spellings the course teaches
 * are covered by the same layer the SQL problems use (lib/sql/dialect.ts,
 * lib/sql/mysql-functions.ts), plus the few DDL/DML forms below.
 *
 * The shape, mapped onto stdin/stdout so the DSL, the seed, the routes and
 * the exercise panel need nothing new:
 *
 *  - a case's **stdin is the setup script** — the CREATE TABLE and INSERT
 *    statements that build the tables the exercise talks about. A visible
 *    case shows it, which is exactly what a learner needs to see; on "Run"
 *    the learner may edit it like any other input;
 *  - the learner's **source is a script** — one or more statements separated
 *    by `;` (a SELECT, or an UPDATE followed by the SELECT that shows it);
 *  - **stdout** is every result set the script produced, in order, as text
 *    (`formatResult`), separated by a blank line. Statements that return no
 *    rows print nothing — so an exercise that changes data ends in a SELECT.
 *
 * Every dataset runs on a fresh in-memory database, so nothing a script does
 * survives it. PRAGMA (it would lift the worker's heap cap), ATTACH, DETACH
 * and VACUUM are refused before anything runs.
 */

/** Words that reach past the database the script was given. */
const REFUSED = new Set(["PRAGMA", "ATTACH", "DETACH", "VACUUM"]);
/** What a statement may start with. */
const STARTS = new Set([
  "SELECT", "WITH", "VALUES", "INSERT", "UPDATE", "DELETE", "REPLACE", "CREATE", "DROP", "ALTER",
  "BEGIN", "START", "COMMIT", "ROLLBACK", "SAVEPOINT", "RELEASE", "TRUNCATE", "EXPLAIN",
]);
/** MySQL statements that have no SQLite counterpart, with the sentence that says so. */
const MYSQL_ONLY: Record<string, string> = {
  SHOW: "SHOW is a MySQL client command — query the tables directly here.",
  DESCRIBE: "DESCRIBE is a MySQL client command — the setup script shows each table's columns.",
  DESC: "DESC is a MySQL client command — the setup script shows each table's columns.",
  USE: "There is one database here, so USE is not needed.",
  SET: "Session variables (SET) are not supported here.",
  GRANT: "GRANT and REVOKE manage users, and there is only one here.",
  REVOKE: "GRANT and REVOKE manage users, and there is only one here.",
};
/** MySQL table options, which may follow a CREATE TABLE's column list. */
const TABLE_OPTIONS = new Set(["ENGINE", "DEFAULT", "CHARSET", "CHARACTER", "COLLATE", "AUTO_INCREMENT", "COMMENT", "ROW_FORMAT"]);
const INT_TYPES = new Set(["INT", "INTEGER", "BIGINT", "SMALLINT", "MEDIUMINT", "TINYINT"]);
const MAX_STATEMENTS = 40;
const MAX_ROWS = 1000;
const RUN_DEADLINE_MS = 4000;
const JUDGE_DEADLINE_MS = 8000;

const upper = (t: Token | undefined) => (t && t.kind === "word" ? t.text.toUpperCase() : "");
const isSpace = (t: Token | undefined) => !!t && (t.kind === "space" || t.kind === "comment");
const word = (text: string): Token => ({ kind: "word", text });

export type ScriptCheck = { ok: true; statements: string[] } | { ok: false; error: string };

/**
 * The learner's script → SQLite statements, or a sentence saying why not.
 * Pure (pinned by program.test.ts).
 */
export function prepareScript(source: string): ScriptCheck {
  const tokens = tokenize(source).filter((t) => t.kind !== "comment");
  const last = [...tokens].reverse().find((t) => !isSpace(t));
  if (last && (last.kind === "string" || last.kind === "ident")) {
    const q = last.text[0]!;
    const close = q === "[" ? "]" : q;
    if (last.text.length === 1 || last.text[last.text.length - 1] !== close) return { ok: false, error: `A quote (${q}) is never closed.` };
  }
  const groups: Token[][] = [[]];
  for (const t of tokens) {
    if (t.kind === "punct" && t.text === ";") groups.push([]);
    else groups[groups.length - 1]!.push(t);
  }
  const statements = groups.filter((g) => g.some((t) => !isSpace(t)));
  if (statements.length === 0) return { ok: false, error: "Write a query first." };
  if (statements.length > MAX_STATEMENTS) return { ok: false, error: `That is ${statements.length} statements; a script here runs at most ${MAX_STATEMENTS}.` };

  const out: string[] = [];
  for (const raw of statements) {
    let stmt = raw.filter((t) => !isSpace(t) || t.kind === "space");
    const firstAt = stmt.findIndex((t) => !isSpace(t));
    const first = stmt[firstAt]!;
    const head = upper(first);
    for (const t of stmt) {
      const w = upper(t);
      if (REFUSED.has(w)) return { ok: false, error: `${w} is not allowed here — it reaches past the tables this exercise gives you.` };
    }
    if (MYSQL_ONLY[head]) return { ok: false, error: MYSQL_ONLY[head]! };
    if (!STARTS.has(head) && !(first.kind === "punct" && first.text === "(")) {
      return { ok: false, error: `A statement cannot start with "${first.text.slice(0, 30)}". Separate statements with ";".` };
    }
    const sig = stmt.filter((t) => !isSpace(t));
    // START TRANSACTION → BEGIN
    if (head === "START") {
      if (upper(sig[1]) !== "TRANSACTION" || sig.length !== 2) return { ok: false, error: "Write START TRANSACTION (or BEGIN) on its own." };
      out.push("BEGIN");
      continue;
    }
    // TRUNCATE [TABLE] t → DELETE FROM t
    if (head === "TRUNCATE") {
      const name = upper(sig[1]) === "TABLE" ? sig[2] : sig[1];
      if (!name || sig.length > (upper(sig[1]) === "TABLE" ? 3 : 2)) return { ok: false, error: "Write TRUNCATE TABLE <name>." };
      out.push(`DELETE FROM ${name.text}`);
      continue;
    }
    // INSERT IGNORE → INSERT OR IGNORE
    if (head === "INSERT" && upper(sig[1]) === "IGNORE") {
      const at = stmt.indexOf(sig[1]!);
      stmt = [...stmt.slice(0, at), word("OR"), { kind: "space", text: " " }, ...stmt.slice(at)];
    }
    // `id INT AUTO_INCREMENT PRIMARY KEY` → `id INTEGER PRIMARY KEY`: SQLite
    // numbers a row by itself only when the column is exactly an INTEGER
    // PRIMARY KEY, and would read AUTO_INCREMENT as part of the type name.
    // The type may carry a width and modifiers before the keyword
    // (`INT(11) UNSIGNED NOT NULL AUTO_INCREMENT`, the form mysqldump and
    // SHOW CREATE TABLE print): the width and the sign words go, NOT NULL
    // stays (an INTEGER PRIMARY KEY still numbers itself under it).
    // Table options after the closing parenthesis (ENGINE=InnoDB, DEFAULT
    // CHARSET=…) mean nothing here and are dropped.
    if (head === "CREATE" && upper(sig[1]) === "TABLE") {
      const next: Token[] = [];
      for (const t of stmt) {
        if (upper(t) !== "AUTO_INCREMENT") {
          next.push(t);
          continue;
        }
        let k = next.length - 1;
        for (;;) {
          while (k >= 0 && isSpace(next[k])) k--;
          const w = upper(next[k]);
          if (w === "UNSIGNED" || w === "SIGNED" || w === "ZEROFILL") next.splice(k, 1), k--;
          else if (w === "NULL" || w === "NOT") k--;
          else break;
        }
        let typeEnd = k;
        if (next[k]?.kind === "punct" && next[k]!.text === ")") {
          while (k >= 0 && !(next[k]!.kind === "punct" && next[k]!.text === "(")) k--;
          k--;
          while (k >= 0 && isSpace(next[k])) k--;
        }
        if (INT_TYPES.has(upper(next[k]))) next.splice(k, typeEnd - k + 1, word("INTEGER"));
      }
      const open = next.findIndex((t) => t.kind === "punct" && t.text === "(");
      let depth = 0;
      let close = -1;
      for (let i = open; open !== -1 && i < next.length; i++) {
        const t = next[i]!;
        if (t.kind === "punct" && t.text === "(") depth++;
        else if (t.kind === "punct" && t.text === ")" && --depth === 0) { close = i; break; }
      }
      const after = close === -1 ? undefined : next.slice(close + 1).find((t) => !isSpace(t));
      stmt = after && TABLE_OPTIONS.has(upper(after)) ? next.slice(0, close + 1) : next;
    }
    out.push(rewriteMysql(stmt.map((t) => t.text).join("")).trim());
  }
  return { ok: true, statements: out };
}

/**
 * A number as the exercises print it: an integer as itself, anything else
 * rounded to four places with trailing zeros dropped (2.5, 0.3333) — SQLite
 * and MySQL disagree on how many places a division shows, and four is
 * MySQL's own default for `/`. An exercise that wants a fixed scale says
 * ROUND(x, 2) and gets it.
 */
export function showNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  const r = Math.round(n * 10_000) / 10_000;
  return Object.is(r, -0) ? "0" : String(r);
}

const showCell = (c: Cell): string => (c === null ? "NULL" : typeof c === "number" ? showNumber(c) : c);

/** One result set as text: the column names, then a line a row, cells joined by " | "; an empty set says "(no rows)". */
export function formatResult(r: Pick<ResultSet, "columns" | "rows">): string {
  const lines = [r.columns.join(" | "), ...r.rows.map((row) => row.map(showCell).join(" | "))];
  if (r.rows.length === 0) lines.push("(no rows)");
  return lines.join("\n");
}

interface ScriptRun {
  status: ProgramVerdict;
  stdout: string;
  error: string | null;
  timeMs: number;
}

/** One dataset's outcomes → what the script printed, and the error that stopped it. */
function readOutcomes(outcomes: QueryOutcome[]): ScriptRun {
  const printed: string[] = [];
  let ms = 0;
  for (const [i, o] of outcomes.entries()) {
    if (!o.ok) {
      const error = o.setup ? `The setup script (the input) failed: ${o.error}` : outcomes.length > 1 || i > 0 ? `Statement ${i + 1}: ${o.error}` : o.error;
      return { status: "RUNTIME_ERROR", stdout: printed.join("\n\n"), error, timeMs: Math.round(ms) };
    }
    ms += o.result.ms;
    if (o.result.columns.length > 0) printed.push(formatResult(o.result));
  }
  return { status: "ACCEPTED", stdout: printed.join("\n\n"), error: null, timeMs: Math.round(ms) };
}

const TIME_LIMIT = "The script ran past the time limit. Look for a join without a condition or a recursive query that never stops.";

/**
 * A setup script → what the worker runs. It goes through the same checks and
 * rewrites as the learner's script: on Run the setup is the learner's own
 * input, and the worker `exec`s it raw — a `PRAGMA hard_heap_limit = 0`
 * there would lift the memory cap as surely as one in the query. The
 * rewrites also give a setup the MySQL forms (AUTO_INCREMENT, INSERT
 * IGNORE) a reader of the lesson would write in it.
 */
export function prepareSetup(setup: string): { ok: true; script: string } | { ok: false; error: string } {
  if (!setup.trim()) return { ok: true, script: "" };
  const prepared = prepareScript(setup);
  if (!prepared.ok) return { ok: false, error: `The setup script (the input) cannot run: ${prepared.error}` };
  return { ok: true, script: prepared.statements.join(";\n") };
}

async function runScripts(statements: string[], setups: string[], deadline: number): Promise<ScriptRun[] | ProgramVerdict> {
  const prepared = setups.map(prepareSetup);
  const refused = prepared.find((p) => !p.ok);
  // A refused setup refuses the whole job: on Submit the setups are the
  // seeded cases (a refusal there is a content bug the gate catches), and
  // on Run there is only the learner's one.
  if (refused && !refused.ok) return prepared.map(() => ({ status: "RUNTIME_ERROR" as const, stdout: "", error: refused.error, timeMs: 0 }));
  try {
    const results = await runSqlJob({ schema: "", datasets: prepared.map((p) => (p.ok ? p.script : "")), queries: statements, maxRows: MAX_ROWS, script: true }, deadline);
    return results.map(readOutcomes);
  } catch (err) {
    if (err instanceof SqlTimeoutError) return "TIME_LIMIT_EXCEEDED";
    if (err instanceof SqlBusyError) return "ENGINE_ERROR";
    throw err;
  }
}

/** The Run button, for a SQL track: the learner's script on the learner's setup. */
export async function runSqlProgram(source: string, setup: string): Promise<ProgramRunResult> {
  const script = prepareScript(source);
  if (!script.ok) return { status: "COMPILE_ERROR", stdout: "", stderr: null, compileOutput: script.error, timeMs: 0 };
  const runs = await runScripts(script.statements, [setup], RUN_DEADLINE_MS);
  if (typeof runs === "string") return { status: runs, stdout: "", stderr: runs === "TIME_LIMIT_EXCEEDED" ? TIME_LIMIT : null, compileOutput: null, timeMs: 0 };
  const run = runs[0]!;
  return { status: run.status, stdout: run.stdout, stderr: run.error, compileOutput: null, timeMs: run.timeMs };
}

/** Submit and the content gate, for a SQL track: every case's setup, one job. */
export async function judgeSqlProgram(source: string, cases: ProgramCase[], normalize: (s: string) => string): Promise<ProgramJudgeResult> {
  const total = cases.length;
  const empty = (verdict: ProgramVerdict, compileOutput: string | null = null): ProgramJudgeResult => ({
    verdict,
    passed: 0,
    total,
    cases: cases.map((c, index) => ({ index, passed: false, hidden: Boolean(c.hidden), stdin: c.hidden ? null : c.stdin, expected: c.hidden ? null : c.expected, actual: null, status: verdict, stderr: null })),
    compileOutput,
    timeMs: 0,
  });
  if (total === 0) return empty("ACCEPTED");
  const script = prepareScript(source);
  if (!script.ok) return empty("COMPILE_ERROR", script.error);
  const runs = await runScripts(script.statements, cases.map((c) => c.stdin), JUDGE_DEADLINE_MS);
  if (typeof runs === "string") return empty(runs);

  let verdict: ProgramVerdict = "ACCEPTED";
  let passed = 0;
  let timeMs = 0;
  const judged = cases.map((c, index) => {
    const run = runs[index]!;
    timeMs = Math.max(timeMs, run.timeMs);
    const ok = run.status === "ACCEPTED" && normalize(run.stdout) === normalize(c.expected);
    if (ok) passed += 1;
    else if (verdict === "ACCEPTED") verdict = run.status === "ACCEPTED" ? "WRONG_ANSWER" : run.status;
    const hidden = Boolean(c.hidden);
    return {
      index,
      passed: ok,
      hidden,
      stdin: hidden ? null : c.stdin,
      expected: hidden ? null : c.expected,
      actual: hidden ? null : run.stdout,
      status: ok ? "ACCEPTED" : run.status === "ACCEPTED" ? "WRONG_ANSWER" : run.status,
      stderr: hidden ? null : run.error,
    };
  });
  return { verdict, passed, total, cases: judged, compileOutput: null, timeMs };
}

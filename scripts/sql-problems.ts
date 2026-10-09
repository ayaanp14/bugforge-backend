/**
 * The SQL problems' gate (src/lib/sql-problems/*.ts; the guide is
 * src/lib/sql-problems/AUTHORING.md).
 *
 *   npx tsx scripts/sql-problems.ts --validate [--only second-highest-salary,…]
 *       Every spec is well formed (slug, title, topics, tables, examples,
 *       hints, editorial); every dataset — the examples and the hidden ones
 *       the generator makes — loads (row widths, primary keys); the reference
 *       solution is one SELECT, runs on every dataset, gives rows on the
 *       examples and different answers across the hidden datasets; it gives
 *       the same answer when every table's rows are stored in reverse (a query
 *       that depends on storage order — a LIMIT without a full ORDER BY, a
 *       bare column under GROUP BY — fails here, not on a learner); each of
 *       `alternatives` agrees with it on every dataset; an `ordered` problem's
 *       solution has an ORDER BY. Runs the real engine (sql.js) locally.
 *
 *   npx tsx scripts/sql-problems.ts --validate --file src/lib/sql-problems/<file>.ts
 *       The same, for the specs one module exports (every exported array),
 *       whether or not index.ts lists it yet — so several authors can each
 *       gate a new file without touching the shared index. Slugs and titles
 *       are still checked against everything index.ts lists.
 *
 *   npx tsx scripts/sql-problems.ts --show <slug> [--file …]
 *       The first example's tables and the solution's output, as the
 *       statement will draw them.
 */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SQL_PROBLEMS as LISTED, SQL_TOPICS } from "../src/lib/sql-problems/index.js";
import { buildProblem, datasetSql } from "../src/lib/sql-problems/build.js";
import type { Dataset, SqlProblemSpec } from "../src/lib/sql-problems/types.js";
import { checkStatement, rewriteMysql } from "../src/lib/sql/dialect.js";
import { compareResults } from "../src/lib/sql/compare.js";
import { closeSqlEngine, runSqlJob } from "../src/lib/sql/engine.js";
import type { ResultSet } from "../src/lib/sql/types.js";

const args = process.argv.slice(2);
const value = (name: string) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const only = value("--only")?.split(",").map((s) => s.trim()).filter(Boolean);
const file = value("--file");
/** The specs of `--file` (every exported array of the module), or none. */
const FILE_PROBLEMS: SqlProblemSpec[] = file
  ? (Object.values(await import(pathToFileURL(resolve(file)).href)).filter(Array.isArray).flat() as SqlProblemSpec[])
  : [];
const SQL_PROBLEMS: SqlProblemSpec[] = [...LISTED, ...FILE_PROBLEMS.filter((p) => !LISTED.includes(p))];

const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const COLUMN_TYPES = new Set(["int", "bigint", "decimal", "varchar", "char", "date", "datetime", "enum", "bool"]);
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const key = (r: ResultSet) => JSON.stringify([r.columns, r.rows]);

function structure(p: SqlProblemSpec): string[] {
  const out: string[] = [];
  const at = p.slug;
  if (!SLUG.test(p.slug)) out.push(`${at}: slug must be lower-case words joined by hyphens`);
  if (!p.title || p.title.length > 70) out.push(`${at}: title must be 1–70 characters`);
  if (!["EASY", "MEDIUM", "HARD"].includes(p.difficulty)) out.push(`${at}: difficulty must be EASY, MEDIUM or HARD`);
  if (!p.topics.length) out.push(`${at}: at least one topic`);
  for (const t of p.topics) if (!(SQL_TOPICS as readonly string[]).includes(t)) out.push(`${at}: topic "${t}" is not one of ${SQL_TOPICS.join(", ")}`);
  if (words(p.description) < 25) out.push(`${at}: the description is ${words(p.description)} words — say what to return, from which tables, and in what order`);
  if (/^#\s/m.test(p.description)) out.push(`${at}: the description has a "# " heading`);
  if (/__CODEKAIRO_/.test(JSON.stringify(p))) out.push(`${at}: names a judge sentinel`);
  if (!p.tables.length) out.push(`${at}: no tables`);
  const tableNames = new Set<string>();
  for (const t of p.tables) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(t.name)) out.push(`${at}: table name "${t.name}" must be a plain identifier`);
    if (tableNames.has(t.name.toLowerCase())) out.push(`${at}: table "${t.name}" twice`);
    tableNames.add(t.name.toLowerCase());
    const cols = new Set<string>();
    for (const c of t.columns) {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(c.name)) out.push(`${at}: column "${t.name}.${c.name}" must be a plain identifier`);
      if (cols.has(c.name.toLowerCase())) out.push(`${at}: column "${t.name}.${c.name}" twice`);
      cols.add(c.name.toLowerCase());
      if (!COLUMN_TYPES.has(c.type)) out.push(`${at}: column "${t.name}.${c.name}" has type "${c.type}"`);
      if (c.type === "enum" && !c.values?.length) out.push(`${at}: enum column "${t.name}.${c.name}" needs its values`);
    }
    for (const k of t.primaryKey ?? []) if (!cols.has(k.toLowerCase())) out.push(`${at}: primary key column "${k}" is not in ${t.name}`);
    // An int column must hold what MySQL's INT holds (a learner recreating the
    // tables would be refused); a 10-digit phone number or PNR is a bigint.
    t.columns.forEach((c, ci) => {
      if (c.type !== "int") return;
      for (const ex of p.examples) for (const row of ex[t.name] ?? []) {
        const v = row[ci];
        if (typeof v === "number" && (v > 2147483647 || v < -2147483648)) {
          out.push(`${at}: ${t.name}.${c.name} holds ${v}, past MySQL's INT — make the column a bigint`);
          return;
        }
      }
    });
  }
  if (p.examples.length < 1 || p.examples.length > 3) out.push(`${at}: ${p.examples.length} examples; give one to three`);
  if (p.hints.length < 2 || p.hints.length > 5) out.push(`${at}: ${p.hints.length} hints; give two to five`);
  if (words(p.editorial) < 80) out.push(`${at}: the editorial is ${words(p.editorial)} words; explain the approach in at least 80`);
  if ((p.hiddenCount ?? 30) < 15 || (p.hiddenCount ?? 30) > 60) out.push(`${at}: hiddenCount must be 15–60`);
  const statements = [p.solution, ...(p.alternatives ?? [])];
  statements.forEach((s, i) => {
    const c = checkStatement(s);
    if (!c.ok) out.push(`${at}: ${i === 0 ? "solution" : `alternative ${i}`}: ${c.error}`);
  });
  if (p.ordered && !/\border\s+by\b/i.test(p.solution.replace(/over\s*\([^)]*\)/gi, ""))) out.push(`${at}: ordered, but the solution has no ORDER BY outside a window`);
  for (const t of p.tables) {
    for (const ex of p.examples) {
      if (!(t.name in ex)) out.push(`${at}: an example has no rows key for table ${t.name} (use [] for an empty table)`);
    }
  }
  return out;
}

const reversed = (d: Dataset): Dataset => Object.fromEntries(Object.entries(d).map(([t, rows]) => [t, [...rows].reverse()]));

async function behaviour(p: SqlProblemSpec): Promise<string[]> {
  const out: string[] = [];
  const at = p.slug;
  let built;
  try {
    built = buildProblem(p);
  } catch (err) {
    return [`${at}: the datasets do not build: ${(err as Error).message}`];
  }
  const queries = [p.solution, ...(p.alternatives ?? [])].map(rewriteMysql);
  let results;
  try {
    results = await runSqlJob({ schema: built.schema, datasets: built.scripts, queries, maxRows: 5000 }, 60_000);
  } catch (err) {
    return [`${at}: ${(err as Error).message}`];
  }
  const expected: ResultSet[] = [];
  results.forEach((r, i) => {
    const sol = r[0]!;
    const where = i < built.visible ? `example ${i + 1}` : `hidden dataset ${i - built.visible + 1}`;
    if (!sol.ok) {
      out.push(`${at}: the solution fails on ${where}: ${sol.error}`);
      return;
    }
    expected[i] = sol.result;
    r.slice(1).forEach((alt, k) => {
      if (!alt.ok) out.push(`${at}: alternative ${k + 1} fails on ${where}: ${alt.error}`);
      else {
        const cmp = compareResults(sol.result, alt.result, p.ordered ?? false);
        if (!cmp.ok) out.push(`${at}: alternative ${k + 1} disagrees on ${where}: ${cmp.reason}`);
      }
    });
  });
  if (out.length) return out;
  if (expected[0]!.totalRows === 0) out.push(`${at}: the first example's answer is empty — show a result the reader can check`);
  const hidden = expected.slice(built.visible);
  const nonEmpty = hidden.filter((r) => r.totalRows > 0).length;
  if (nonEmpty < hidden.length * 0.6) out.push(`${at}: only ${nonEmpty} of ${hidden.length} hidden datasets have a non-empty answer`);
  const distinct = new Set(hidden.map(key)).size;
  if (distinct < Math.min(8, hidden.length)) out.push(`${at}: the hidden datasets give only ${distinct} different answers — vary the data more`);
  if (hidden.some((r) => r.totalRows > 1000)) out.push(`${at}: a hidden answer has over 1,000 rows — keep datasets small`);
  // Storage order must not matter.
  const reversedScripts = built.data.map((d) => datasetSql(p.tables, reversed(d)));
  const again = await runSqlJob({ schema: built.schema, datasets: reversedScripts, queries: [queries[0]!], maxRows: 5000 }, 60_000);
  again.forEach((r, i) => {
    const sol = r[0]!;
    if (!sol.ok) out.push(`${at}: the solution fails on reversed dataset ${i + 1}: ${sol.error}`);
    else {
      const cmp = compareResults(expected[i]!, sol.result, p.ordered ?? false);
      if (!cmp.ok) out.push(`${at}: the answer changes when the rows are stored in another order (dataset ${i + 1}: ${cmp.reason}) — make the result deterministic (ties, LIMIT, GROUP BY)`);
    }
  });
  return out;
}

async function validate(): Promise<number> {
  const pool = file ? FILE_PROBLEMS : SQL_PROBLEMS;
  const picked = pool.filter((p) => !only || only.includes(p.slug));
  if (only) for (const s of only) if (!SQL_PROBLEMS.some((p) => p.slug === s)) console.error(`  ✗ no problem "${s}"`);
  const problems: string[] = [];
  const slugs = new Map<string, number>();
  const titles = new Map<string, number>();
  for (const p of SQL_PROBLEMS) {
    slugs.set(p.slug, (slugs.get(p.slug) ?? 0) + 1);
    titles.set(p.title.toLowerCase(), (titles.get(p.title.toLowerCase()) ?? 0) + 1);
  }
  for (const [s, n] of slugs) if (n > 1) problems.push(`${s}: slug used ${n} times`);
  for (const [t, n] of titles) if (n > 1) problems.push(`title "${t}" used ${n} times`);
  for (const p of picked) {
    const s = structure(p);
    problems.push(...s);
    if (!s.length) problems.push(...(await behaviour(p)));
    process.stdout.write(".");
  }
  console.log("");
  await closeSqlEngine();
  if (problems.length) {
    for (const p of problems) console.error(`  ✗ ${p}`);
    console.error(`\n${problems.length} problem${problems.length === 1 ? "" : "s"}`);
    return 1;
  }
  const byTopic = new Map<string, number>();
  for (const p of picked) for (const t of p.topics) byTopic.set(t, (byTopic.get(t) ?? 0) + 1);
  console.log(`✓ ${picked.length} SQL problem${picked.length === 1 ? "" : "s"} valid  (${[...byTopic].map(([t, n]) => `${t} ${n}`).join(", ")})`);
  return 0;
}

async function show(slug: string): Promise<number> {
  const p = SQL_PROBLEMS.find((x) => x.slug === slug);
  if (!p) {
    console.error(`no problem "${slug}"`);
    return 1;
  }
  const built = buildProblem(p);
  const res = await runSqlJob({ schema: built.schema, datasets: [built.scripts[0]!], queries: [rewriteMysql(p.solution)], maxRows: 50 }, 20_000);
  await closeSqlEngine();
  const table = (cols: string[], rows: unknown[][]) => [cols.join(" | "), cols.map(() => "---").join(" | "), ...rows.map((r) => r.map((c) => (c === null ? "NULL" : String(c))).join(" | "))].join("\n");
  for (const t of p.tables) console.log(`\n${t.name}\n${table(t.columns.map((c) => c.name), p.examples[0]![t.name] ?? [])}`);
  const r = res[0]![0]!;
  console.log(`\nOutput\n${r.ok ? table(r.result.columns, r.result.rows) : `ERROR ${r.error}`}`);
  return 0;
}

const showSlug = value("--show");
const code = args.includes("--validate") ? await validate() : showSlug ? await show(showSlug) : (console.error("usage: --validate [--only a,b] | --show <slug>"), 2);
process.exit(code);

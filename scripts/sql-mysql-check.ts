/**
 * The SQL problems against a real MySQL — the check the SQLite gate cannot
 * make (scripts/sql-problems.ts --validate runs our engine only).
 *
 *   npx tsx scripts/sql-mysql-check.ts [--only slug,slug] [--hidden 8] [--file src/lib/sql-problems/<file>.ts]
 *
 * `--file` checks the specs one module exports instead of index.ts's list,
 * in a scratch database of its own (`codekairo_sql_gate_<file>`), so several
 * authors can run it at once.
 *
 * For every problem: its tables are created in a scratch database
 * (`codekairo_sql_gate`, dropped at the end) with MySQL's own types, each
 * example and the first N hidden datasets are loaded, and the reference
 * solution and every alternative run on MySQL 8. Each answer must be
 * accepted by the judge's own comparison (lib/sql/compare.ts) against what
 * the SQLite engine returns for the same dataset. It catches:
 *
 *  - a query MySQL refuses that SQLite runs (ONLY_FULL_GROUP_BY, a function
 *    that exists only in SQLite) — an editorial that would not run for the
 *    reader;
 *  - an answer that differs between the two: MySQL's decimal division and
 *    AVG carry four decimals (1/3 = 0.3333), so an unrounded ratio is a
 *    different number there; the problem should ROUND it, as the
 *    statement's output does;
 *  - a gap in the compatibility layer (lib/sql/dialect, mysql-functions).
 *
 * Uses DATABASE_URL's server (the local MySQL in Docker), never its schema.
 */
import mariadb from "mariadb";
import { basename, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SQL_PROBLEMS as LISTED } from "../src/lib/sql-problems/index.js";
import { buildProblem } from "../src/lib/sql-problems/build.js";
import type { ColumnType, SqlProblemSpec } from "../src/lib/sql-problems/types.js";
import { rewriteMysql } from "../src/lib/sql/dialect.js";
import { compareResults } from "../src/lib/sql/compare.js";
import { closeSqlEngine, runSqlJob } from "../src/lib/sql/engine.js";
import type { Cell, ResultSet } from "../src/lib/sql/types.js";

const args = process.argv.slice(2);
const value = (name: string) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const only = value("--only")?.split(",").map((s) => s.trim()).filter(Boolean);
const hiddenToCheck = Number(value("--hidden") ?? 8);

const url = new URL(process.env["DATABASE_URL"] ?? "");
const file = value("--file");
const SQL_PROBLEMS: SqlProblemSpec[] = file
  ? (Object.values(await import(pathToFileURL(resolve(file)).href)).filter(Array.isArray).flat() as SqlProblemSpec[])
  : [...LISTED];
const DB = file ? `codekairo_sql_gate_${basename(file).replace(/\.[a-z]+$/i, "").replace(/[^A-Za-z0-9]/g, "_")}` : "codekairo_sql_gate";

const MYSQL_TYPE: Record<ColumnType, string> = {
  int: "INT",
  bigint: "BIGINT",
  bool: "TINYINT",
  decimal: "DECIMAL(14,4)",
  varchar: "VARCHAR(255)",
  char: "VARCHAR(255)",
  enum: "VARCHAR(64)",
  date: "DATE",
  datetime: "DATETIME",
};

const q = (name: string) => `\`${name.replace(/`/g, "``")}\``;
const lit = (v: Cell) => (v === null ? "NULL" : typeof v === "number" ? String(v) : `'${String(v).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`);

function toCell(v: unknown): Cell {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" || typeof v === "string") return v;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "boolean") return v ? 1 : 0;
  if (Buffer.isBuffer(v)) return v.toString("utf8");
  return String(v);
}

async function main(): Promise<number> {
  const conn = await mariadb.createConnection({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    dateStrings: true,
    decimalAsNumber: false,
    bigIntAsNumber: true,
    multipleStatements: false,
  });
  const failures: string[] = [];
  const picked = SQL_PROBLEMS.filter((p) => !only || only.includes(p.slug));
  try {
    await conn.query(`DROP DATABASE IF EXISTS ${DB}`);
    await conn.query(`CREATE DATABASE ${DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_bin`);
    await conn.query(`USE ${DB}`);
    for (const p of picked) {
      failures.push(...(await checkProblem(conn, p)));
      process.stdout.write(".");
    }
  } finally {
    await conn.query(`DROP DATABASE IF EXISTS ${DB}`).catch(() => {});
    await conn.end();
    await closeSqlEngine();
  }
  console.log("");
  if (failures.length) {
    for (const f of failures) console.error(`  ✗ ${f}`);
    console.error(`\n${failures.length} problem${failures.length === 1 ? "" : "s"}`);
    return 1;
  }
  console.log(`✓ ${picked.length} SQL problems give the same answers on MySQL ${(await version()) ?? ""}`.trim());
  return 0;
}

let mysqlVersion: string | null = null;
const version = async () => mysqlVersion;

async function checkProblem(conn: mariadb.Connection, p: SqlProblemSpec): Promise<string[]> {
  const out: string[] = [];
  const built = buildProblem(p);
  const indexes = [...Array(built.visible).keys(), ...Array.from({ length: Math.min(hiddenToCheck, built.data.length - built.visible) }, (_, i) => built.visible + i)];
  const queries = [p.solution, ...(p.alternatives ?? [])];
  // Our engine's answers on the same datasets.
  const ours = await runSqlJob({ schema: built.schema, datasets: indexes.map((i) => built.scripts[i]!), queries: queries.map(rewriteMysql), maxRows: 5000 }, 60_000);
  if (!mysqlVersion) mysqlVersion = String((await conn.query("SELECT VERSION() AS v"))[0].v);
  for (let k = 0; k < indexes.length; k++) {
    const i = indexes[k]!;
    const where = i < built.visible ? `example ${i + 1}` : `hidden dataset ${i - built.visible + 1}`;
    for (const t of p.tables) await conn.query(`DROP TABLE IF EXISTS ${q(t.name)}`);
    try {
    for (const t of p.tables) {
      const cols = t.columns.map((c) => `${q(c.name)} ${MYSQL_TYPE[c.type]}`);
      if (t.primaryKey?.length) cols.push(`PRIMARY KEY (${t.primaryKey.map(q).join(", ")})`);
      await conn.query(`CREATE TABLE ${q(t.name)} (${cols.join(", ")})`);
      const rows = built.data[i]![t.name] ?? [];
      for (let r = 0; r < rows.length; r += 200) {
        const chunk = rows.slice(r, r + 200);
        await conn.query(`INSERT INTO ${q(t.name)} (${t.columns.map((c) => q(c.name)).join(", ")}) VALUES ${chunk.map((row) => `(${row.map(lit).join(", ")})`).join(", ")}`);
      }
    }
    } catch (err) {
      out.push(`${p.slug}: MySQL refuses the tables or rows (${where}): ${(err as Error).message.split("\n")[0]}`);
      continue;
    }
    for (let j = 0; j < queries.length; j++) {
      const label = j === 0 ? "solution" : `alternative ${j}`;
      const mine = ours[k]![j]!;
      if (!mine.ok) {
        out.push(`${p.slug}: ${label} fails on our engine (${where}): ${mine.error}`);
        continue;
      }
      let rows: Record<string, unknown>[];
      let columns: string[];
      try {
        const res = await conn.query({ sql: queries[j]!, rowsAsArray: true });
        const meta = (res as unknown as { meta: Array<{ name(): string }> }).meta;
        columns = meta.map((m) => m.name());
        rows = res as unknown as Record<string, unknown>[];
      } catch (err) {
        out.push(`${p.slug}: MySQL refuses the ${label} (${where}): ${(err as Error).message.split("\n")[0]}`);
        continue;
      }
      const theirs: ResultSet = { columns, rows: (rows as unknown as unknown[][]).map((r) => r.map(toCell)), totalRows: rows.length, truncated: false, ms: 0 };
      const cmp = compareResults(theirs, mine.result, p.ordered ?? false);
      if (!cmp.ok) out.push(`${p.slug}: the ${label} answers differently on MySQL (${where}): ${cmp.reason}`);
    }
  }
  return out;
}

process.exit(await main());

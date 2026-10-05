import { parentPort } from "node:worker_threads";
import { createRequire } from "node:module";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { MYSQL_FUNCTIONS, MYSQL_VARIADIC, withArity, type SqlValue } from "./mysql-functions.js";
import type { SqlJob, SqlJobReply, QueryOutcome, Cell } from "./types.js";

/**
 * The SQL problems' thread (lib/sql/engine.ts spawns it). SQLite runs here as
 * WebAssembly (sql.js), never on the API's event loop, for the one reason
 * that matters: a query has no upper bound on its cost. A recursive CTE that
 * never stops, a cross join of five tables, `randomblob(1e9)` — the engine
 * kills this thread past the job's deadline (V8 can interrupt WebAssembly,
 * which it cannot do to a native SQLite call — measured: a runaway CTE in
 * sql.js stopped 90 ms after terminate(); node:sqlite would have run on), and
 * SQLite's own allocator is capped so a query cannot take the box's memory.
 *
 * Every dataset gets a fresh in-memory database: schema, rows, then each
 * query in order (the reference first, so nothing a learner's query does can
 * touch what it is compared against). Nothing here reaches a file or the
 * network — sql.js has neither, and ATTACH can only name files in its own
 * empty in-memory filesystem.
 */

/** SQLite's heap ceiling for this thread (all databases together). */
const HEAP_LIMIT_BYTES = 48 * 1024 * 1024;
/** Rows read past `maxRows` only to count them, then the count stops. */
const COUNT_CAP = 100_000;

const require = createRequire(import.meta.url);
let engine: Promise<SqlJsStatic> | null = null;
const sqlJs = (): Promise<SqlJsStatic> =>
  (engine ??= initSqlJs({ locateFile: (file: string) => require.resolve(`sql.js/dist/${file}`) }));

function open(SQL: SqlJsStatic): Database {
  const db = new SQL.Database();
  for (const [name, fn] of MYSQL_FUNCTIONS) db.create_function(name, fn as (...args: SqlValue[]) => SqlValue);
  for (const [name, fn, min, max] of MYSQL_VARIADIC) {
    db.create_function(
      name,
      withArity((...args: SqlValue[]) => {
        if (args.length < min || args.length > max) throw new Error(`wrong number of arguments to function ${name}()`);
        return fn(args);
      }, -1),
    );
  }
  return db;
}

const cell = (v: unknown): Cell => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" || typeof v === "string") return v;
  if (v instanceof Uint8Array) return `<blob ${v.length} bytes>`;
  return String(v);
};

/** "near \"FORM\": syntax error" reads fine; sql.js prefixes nothing, but trim what it does add. */
const cleanError = (err: unknown): string => {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/^Error:\s*/, "").slice(0, 400);
};

function runQuery(db: Database, sql: string, maxRows: number): QueryOutcome {
  const started = performance.now();
  let stmt;
  try {
    stmt = db.prepare(sql);
  } catch (err) {
    return { ok: false, error: cleanError(err) };
  }
  try {
    const columns = stmt.getColumnNames();
    if (columns.length === 0) return { ok: false, error: "The statement returned no columns — write a SELECT." };
    const rows: Cell[][] = [];
    let total = 0;
    while (stmt.step()) {
      total++;
      if (rows.length < maxRows) rows.push((stmt.get() as unknown[]).map(cell));
      if (total >= COUNT_CAP) break;
    }
    return { ok: true, result: { columns, rows, totalRows: total, truncated: total > rows.length, ms: Math.round((performance.now() - started) * 100) / 100 } };
  } catch (err) {
    return { ok: false, error: cleanError(err) };
  } finally {
    stmt.free();
  }
}

async function handle(job: SqlJob): Promise<SqlJobReply> {
  const SQL = await sqlJs();
  const results: QueryOutcome[][] = [];
  for (const dataset of job.datasets) {
    const db = open(SQL);
    try {
      try {
        db.exec(job.schema);
        if (dataset) db.exec(dataset);
      } catch (err) {
        // The problem's own data failed to load: a content bug, not the learner's.
        return { id: job.id, error: `setup failed: ${cleanError(err)}` };
      }
      results.push(job.queries.map((q) => runQuery(db, q, job.maxRows)));
    } finally {
      db.close();
    }
  }
  return { id: job.id, results };
}

let heapCapped = false;
parentPort?.on("message", (job: SqlJob) => {
  void (async () => {
    if (!heapCapped) {
      // hard_heap_limit is process-wide for this module instance; set once.
      const SQL = await sqlJs();
      const db = new SQL.Database();
      db.exec(`PRAGMA hard_heap_limit = ${HEAP_LIMIT_BYTES}`);
      db.close();
      heapCapped = true;
    }
    parentPort?.postMessage(await handle(job));
  })().catch((err: unknown) => parentPort?.postMessage({ id: job.id, error: cleanError(err) } satisfies SqlJobReply));
});

import { Worker } from "node:worker_threads";
import type { SqlJob, SqlJobReply, QueryOutcome } from "./types.js";

/**
 * Runs SQL jobs on worker threads (lib/sql/sql-worker.ts) with a deadline.
 *
 * Two threads at most, one job each at a time: a SQL job is milliseconds of
 * CPU (forty small datasets, two queries each), so two keep the queue short
 * on the 2-vCPU box without letting SQL take both cores from the API. A job
 * past its deadline gets its thread terminated — the only way to stop a query
 * that will not stop — and the slot starts a fresh thread for the next job
 * (~150 ms: compiling the WebAssembly). A queue longer than QUEUE_MAX answers
 * "busy" at once rather than letting requests stack behind each other.
 */

export class SqlTimeoutError extends Error {
  constructor() {
    super("Time limit exceeded");
    this.name = "SqlTimeoutError";
  }
}

export class SqlBusyError extends Error {
  constructor() {
    super("The SQL runner is busy — try again in a few seconds.");
    this.name = "SqlBusyError";
  }
}

/** The worker failed on its own setup — the problem's data, not the learner's query. */
export class SqlSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SqlSetupError";
  }
}

const POOL_SIZE = Math.max(1, Math.min(4, Number(process.env["SQL_WORKERS"] ?? 2) || 2));
const QUEUE_MAX = 32;

/** Built, the worker is dist/lib/sql/sql-worker.js beside this file; under tsx it registers tsx's loader itself (see lib/og-card.ts spawnWorker). */
function spawnWorker(): Worker {
  const options = { resourceLimits: { maxOldGenerationSizeMb: 96 } };
  if (!import.meta.url.endsWith(".ts")) return new Worker(new URL("./sql-worker.js", import.meta.url), options);
  const entry = new URL("./sql-worker.ts", import.meta.url).href;
  const tsx = import.meta.resolve("tsx/esm/api");
  return new Worker(`import(${JSON.stringify(tsx)}).then((t) => { t.register(); return import(${JSON.stringify(entry)}); });`, { ...options, eval: true });
}

interface Queued {
  job: Omit<SqlJob, "id">;
  timeoutMs: number;
  resolve: (r: QueryOutcome[][]) => void;
  reject: (e: Error) => void;
}

interface Slot {
  worker: Worker | null;
  busy: boolean;
}

const slots: Slot[] = Array.from({ length: POOL_SIZE }, () => ({ worker: null, busy: false }));
const queue: Queued[] = [];
let nextId = 1;

function dispatch(): void {
  for (const slot of slots) {
    if (slot.busy || queue.length === 0) continue;
    const item = queue.shift()!;
    runOn(slot, item);
  }
}

function runOn(slot: Slot, item: Queued): void {
  slot.busy = true;
  const w = (slot.worker ??= spawnWorker());
  const id = nextId++;
  let settled = false;
  const done = (fn: () => void) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    w.off("message", onMessage);
    w.off("error", onError);
    w.off("exit", onExit);
    w.unref();
    slot.busy = false;
    fn();
    dispatch();
  };
  const onMessage = (reply: SqlJobReply) => {
    if (reply.id !== id) return;
    done(() => (reply.results ? item.resolve(reply.results) : item.reject(new SqlSetupError(reply.error ?? "SQL job failed"))));
  };
  const onError = (err: Error) => {
    if (slot.worker === w) slot.worker = null;
    done(() => item.reject(err));
  };
  const onExit = (code: number) => {
    if (slot.worker === w) slot.worker = null;
    done(() => item.reject(new Error(`SQL worker exited with code ${code}`)));
  };
  const timer = setTimeout(() => {
    if (slot.worker === w) slot.worker = null;
    done(() => item.reject(new SqlTimeoutError()));
    void w.terminate();
  }, item.timeoutMs);
  w.on("message", onMessage);
  w.on("error", onError);
  w.on("exit", onExit);
  w.ref();
  w.postMessage({ ...item.job, id } satisfies SqlJob);
}

/**
 * Run `queries` on a fresh database per dataset; results[dataset][query].
 * Rejects with SqlTimeoutError past `timeoutMs` (the first run of a process
 * includes starting the thread), SqlBusyError when the queue is full, and
 * SqlSetupError when the schema or a dataset does not load.
 */
export function runSqlJob(job: Omit<SqlJob, "id">, timeoutMs: number): Promise<QueryOutcome[][]> {
  if (queue.length >= QUEUE_MAX) return Promise.reject(new SqlBusyError());
  return new Promise((resolve, reject) => {
    queue.push({ job, timeoutMs, resolve, reject });
    dispatch();
  });
}

/** Stop every thread (tests and scripts, so the process can exit). */
export async function closeSqlEngine(): Promise<void> {
  await Promise.all(
    slots.map(async (s) => {
      const w = s.worker;
      s.worker = null;
      if (w) await w.terminate();
    }),
  );
}

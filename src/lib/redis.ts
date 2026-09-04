// ioredis v6 exposes the client as a named export; the default export is the
// module namespace and is not constructable under this tsconfig.
import { Redis } from "ioredis";

/**
 * Shared Redis connection.
 *
 * Two rules govern everything here:
 *
 * 1. The cache is an optimisation, never a dependency. If REDIS_URL is unset, the
 *    server is unreachable, or a command hangs, every helper returns as a miss and
 *    the caller falls through to the database. A cache outage must not take the
 *    API down, and must not make it slower than having no cache at all — hence the
 *    hard per-operation timeout.
 *
 * 2. This instance is remote (measured ~300ms round trip), so it is worth one call
 *    per request, not many. Cache whole composed payloads, not individual queries;
 *    for per-query caching prefer the in-process tier in cache.ts.
 */

const OP_TIMEOUT_MS = 600;

let client: Redis | null = null;
let unavailable = false;
let loggedError = false;

function connect(): Redis | null {
  if (unavailable) return null;
  if (client) return client;

  const url = process.env["REDIS_URL"];
  if (!url) {
    unavailable = true;
    console.log("[redis] REDIS_URL not set — caching falls back to in-process only");
    return null;
  }

  client = new Redis(url, {
    // Connect on first command so scripts that merely import a service do not
    // open a socket (and then hold the process open) for no reason.
    lazyConnect: true,
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
    retryStrategy: (times: number) => Math.min(times * 500, 10_000),
  });

  client.on("error", (err: Error) => {
    // ioredis re-emits on every reconnect attempt; one line is enough.
    if (!loggedError) {
      loggedError = true;
      console.warn("[redis] unavailable, serving from the database:", err.message);
    }
  });
  client.on("ready", () => {
    loggedError = false;
    console.log("[redis] connected");
  });

  return client;
}

/** Resolves to null rather than rejecting or hanging, whatever Redis does. */
function guard<T>(op: Promise<T>): Promise<T | null> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), OP_TIMEOUT_MS);
  });
  return Promise.race([op.catch(() => null), timeout]).finally(() => clearTimeout(timer));
}

export async function redisGetJSON<T>(key: string): Promise<T | null> {
  const r = connect();
  if (!r) return null;
  const raw = await guard(r.get(key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function redisSetJSON(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const r = connect();
  if (!r) return;
  let payload: string;
  try {
    payload = JSON.stringify(value);
  } catch {
    return; // not serialisable — silently skip rather than throw on a cache write
  }
  await guard(r.set(key, payload, "EX", ttlSeconds));
}

export async function redisDel(...keys: string[]): Promise<void> {
  const r = connect();
  if (!r || keys.length === 0) return;
  await guard(r.del(...keys));
}

/**
 * Open the connection ahead of the first request.
 *
 * Connecting lazily keeps scripts that merely import a service from opening a
 * socket, but it means the first few requests after a boot race a ~2s handshake
 * and take a miss. Calling this once at startup moves that cost off the request
 * path. Failure is fine — the client keeps retrying in the background.
 */
export async function warmRedis(): Promise<void> {
  const r = connect();
  if (!r) return;
  try {
    await r.connect();
  } catch {
    /* already connecting, or unreachable — either way, requests degrade cleanly */
  }
}

/** For graceful shutdown; safe to call when Redis was never used. */
export async function redisQuit(): Promise<void> {
  if (!client) return;
  try {
    await client.quit();
  } catch {
    client.disconnect();
  }
  client = null;
}

import { redisGetJSON, redisSetJSON, redisDel, publishInvalidation, subscribeInvalidations } from "./redis.js";

/**
 * Two-tier cache (in-process L1, Redis L2) with stale-while-revalidate.
 *
 * L1 costs nothing and absorbs the repeat traffic one instance sees. L2 is
 * shared across instances and survives restarts, but this Redis is remote at
 * ~300ms a round trip, so it is only worth consulting for work that costs more
 * than that — a composed payload, not an individual indexed query.
 *
 * The important property is stale-while-revalidate. Without it, every TTL
 * expiry hands some unlucky user the full cold rebuild — against a database at
 * ~500ms a round trip that is a multi-second page load, recurring forever on a
 * timer. With it, an expired entry is served immediately and refreshed in the
 * background, so only the very first request after a cold start ever waits.
 *
 * Single-flight de-duplication matters as much: without it, N concurrent
 * requests on a cold key all miss and all hit the database at once, which is
 * exactly the stampede a small connection pool cannot absorb.
 *
 * invalidate() deletes outright rather than marking stale — after a submission
 * the user must see fresh numbers, not a stale copy with a refresh in flight.
 *
 * Every tier degrades to a miss on failure; nothing here can break a request.
 */

type Entry = { value: unknown; freshUntil: number; staleUntil: number };

/** How long past expiry an entry may still be served while it refreshes. */
const STALE_GRACE_MS = 10 * 60_000;

const memory = new Map<string, Entry>();
const inFlight = new Map<string, Promise<unknown>>();

function store(key: string, value: unknown, ttlMs: number): void {
  const now = Date.now();
  memory.set(key, { value, freshUntil: now + ttlMs, staleUntil: now + ttlMs + STALE_GRACE_MS });
}

/** Run `load` once per key even if called concurrently. */
function singleFlight<T>(key: string, load: () => Promise<T>): Promise<T> {
  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;
  const promise = load().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

/** Refresh in the background; failures leave the existing entry in place. */
function revalidate<T>(key: string, load: () => Promise<T>): void {
  if (inFlight.has(key)) return;
  void singleFlight(key, load).catch(() => {
    /* keep serving what we have until a later attempt succeeds */
  });
}

/** Cache in memory only. For cheap, hot, instance-local values. */
export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const fill = async () => {
    const value = await load();
    store(key, value, ttlMs);
    return value;
  };

  const hit = memory.get(key);
  if (hit) {
    const now = Date.now();
    if (hit.freshUntil > now) return hit.value as T;
    if (hit.staleUntil > now) {
      revalidate(key, fill);
      return hit.value as T;
    }
  }
  return singleFlight(key, fill);
}

/**
 * Cache in memory *and* Redis. Use for payloads expensive enough to justify a
 * network round trip. The memory window is the shorter of the two so one
 * instance picks up another's invalidation reasonably quickly.
 */
export async function cachedShared<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
  memoryTtlMs = Math.min(ttlSeconds * 1000, 10_000),
): Promise<T> {
  const fill = async () => {
    const shared = await redisGetJSON<T>(key);
    if (shared !== null) {
      store(key, shared, memoryTtlMs);
      return shared;
    }
    const value = await load();
    store(key, value, memoryTtlMs);
    // Fire-and-forget: a slow cache write must not delay the response.
    void redisSetJSON(key, value, ttlSeconds);
    return value;
  };

  const hit = memory.get(key);
  if (hit) {
    const now = Date.now();
    if (hit.freshUntil > now) return hit.value as T;
    if (hit.staleUntil > now) {
      revalidate(key, fill);
      return hit.value as T;
    }
  }
  return singleFlight(key, fill);
}

function forget(key: string): void {
  memory.delete(key);
  inFlight.delete(key);
}

/** Drop a key from both tiers (or clear memory entirely when called bare). */
export function invalidate(key?: string): void {
  if (key === undefined) {
    memory.clear();
    return;
  }
  forget(key);
  void redisDel(key);
  // Other instances hold their own L1 copy that Redis deletion cannot reach,
  // and the stale window would keep them serving it. Tell them directly.
  publishInvalidation(key);
}

/**
 * Start honouring invalidations broadcast by other instances. Call once at
 * startup; without it this process keeps serving its own stale L1 copies after
 * someone else's write.
 */
export function startCacheInvalidationListener(): void {
  subscribeInvalidations(forget);
}

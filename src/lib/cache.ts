import { redisGetJSON, redisSetJSON, redisDel } from "./redis.js";

/**
 * Two-tier cache: an in-process map in front of Redis.
 *
 * L1 (memory) costs nothing and absorbs the repeat traffic a single instance
 * sees. L2 (Redis) is shared across instances and survives restarts, but this
 * Redis is remote at roughly 300ms a round trip, so it is only worth consulting
 * for things far more expensive than that — a composed dashboard payload, not an
 * individual indexed query.
 *
 * Single-flight de-duplication matters as much as the TTLs: without it, N
 * concurrent requests on a cold cache all miss and all hit the database at once,
 * which is exactly the stampede a small connection pool cannot absorb.
 *
 * Every tier degrades to a miss on failure; nothing here can break a request.
 */

type Entry = { value: unknown; expiresAt: number };

const memory = new Map<string, Entry>();
const inFlight = new Map<string, Promise<unknown>>();

/** Cache in memory only. For cheap, hot, instance-local values. */
export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = memory.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = load()
    .then((value) => {
      memory.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
}

/**
 * Cache in memory *and* Redis. Use for payloads expensive enough to justify a
 * network round trip — the memory TTL should be the shorter of the two so an
 * instance picks up another instance's invalidation reasonably quickly.
 */
export async function cachedShared<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
  memoryTtlMs = Math.min(ttlSeconds * 1000, 10_000),
): Promise<T> {
  const hit = memory.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = (async () => {
    const shared = await redisGetJSON<T>(key);
    if (shared !== null) {
      memory.set(key, { value: shared, expiresAt: Date.now() + memoryTtlMs });
      return shared;
    }
    const value = await load();
    memory.set(key, { value, expiresAt: Date.now() + memoryTtlMs });
    // Fire-and-forget: a slow cache write must not delay the response.
    void redisSetJSON(key, value, ttlSeconds);
    return value;
  })().finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
}

/** Drop a key from both tiers (or clear memory entirely when called bare). */
export function invalidate(key?: string): void {
  if (key === undefined) {
    memory.clear();
    return;
  }
  memory.delete(key);
  void redisDel(key);
}

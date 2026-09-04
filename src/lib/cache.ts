/**
 * Tiny in-process TTL cache with single-flight de-duplication.
 *
 * The dashboard aggregate recomputes several things that are identical for every
 * user on the platform — the top-10 leaderboard, the total user count, the bug
 * challenge catalogue counts. Those were being re-queried on every page load by
 * every user, against a 5-connection pool on a remote shared host.
 *
 * `cached` collapses that to one query per TTL window. The in-flight map matters
 * as much as the TTL: without it, N concurrent dashboard loads on a cold cache
 * all miss and all query, which is exactly the stampede the pool cannot absorb.
 *
 * Deliberately per-process and unbounded-TTL-free: keys are a fixed small set,
 * so there is nothing to evict. Restarting the server clears it, which is fine —
 * everything here is derivable from the database.
 */

type Entry = { value: unknown; expiresAt: number };

const entries = new Map<string, Entry>();
const inFlight = new Map<string, Promise<unknown>>();

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = entries.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;

  // Someone else is already loading this key — wait for their result instead of
  // opening a second connection for the same work.
  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = load()
    .then((value) => {
      entries.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

/** Drop a cached key (or everything) — call after a write that invalidates it. */
export function invalidate(key?: string): void {
  if (key === undefined) entries.clear();
  else entries.delete(key);
}

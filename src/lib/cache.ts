import { randomUUID } from "node:crypto";
import { redisGetJSON, redisSetJSON, redisDel, redisDelPrefix, publishInvalidation, subscribeInvalidations, warmRedis } from "./redis.js";

/**
 * Two-tier cache (in-process L1, Redis L2) with stale-while-revalidate.
 *
 * L1 costs nothing and absorbs the repeat traffic one instance sees. L2 is
 * shared across instances and survives restarts (an API redeploy included —
 * bump a key's version when its payload changes shape). Redis was remote at
 * ~300ms a round trip when this was written; since 2026-09-23 it sits in the
 * same compose project, but L2 is still only for composed payloads, not
 * individual indexed queries, so the design holds if it ever moves again.
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

/**
 * The L1 tier is bounded two ways. Per-user keys (dashboards, /api/me) arrive
 * at one per signed-in account, so without a cap the map grows for the life
 * of the process; and an entry past its stale window is dead weight that
 * nothing would ever read again, so a sweep reclaims those on a timer rather
 * than waiting for the cap.
 */
const MAX_ENTRIES = 2000;
const SWEEP_INTERVAL_MS = 60_000;

const memory = new Map<string, Entry>();
const inFlight = new Map<string, Promise<unknown>>();

/**
 * The load each key is waiting on, so an invalidation can disown it.
 *
 * forget() used to drop only the entry and the in-flight promise; the load
 * itself kept running and stored its result when it finished. A dashboard
 * build (~20 queries) that began before a submission and finished after the
 * submission's invalidate() therefore wrote the pre-submission numbers back
 * into L1 *and* Redis for the full TTL — 300 s of a stale dashboard right
 * after the user's own action, the one moment staleness is noticed. A load
 * now stores only while its token is still the current one; forget() removes
 * it, and a later load replaces it. Bounded by the loads actually running.
 */
const loads = new Map<string, symbol>();

function beginLoad(key: string): symbol {
  const token = Symbol(key);
  loads.set(key, token);
  return token;
}

/** True once, for the load that still owns `key`; releases the claim either way. */
function endLoad(key: string, token: symbol): boolean {
  if (loads.get(key) !== token) return false;
  loads.delete(key);
  return true;
}

/**
 * "Not found" answers live apart, in a small map of their own with a short
 * life. Keys are often free text from the URL — `/api/seo/head?path=…` is
 * unsigned and mounted ahead of the rate limiter for the Worker, and a slug
 * route takes whatever slug it is sent — so a stream of invented slugs used
 * to fill the one 2,000-entry map with nulls kept for the loader's full TTL
 * (an hour for a page head) and push every dashboard and /api/me out of it.
 * Here they can only evict each other. Five minutes also bounds how long a
 * page published after a crawler asked for it keeps answering 404.
 */
const MAX_MISSES = 500;
const MISS_TTL_MS = 5 * 60_000;
const misses = new Map<string, Entry>();

function store(key: string, value: unknown, ttlMs: number): void {
  const now = Date.now();
  const miss = value === null || value === undefined;
  const map = miss ? misses : memory;
  const ttl = miss ? Math.min(ttlMs, MISS_TTL_MS) : ttlMs;
  // A key holds one answer: whichever map it lands in, it leaves the other.
  (miss ? memory : misses).delete(key);
  // Delete first so a refreshed key moves to the end of insertion order; the
  // cap below then evicts what was written longest ago, not what is hottest.
  map.delete(key);
  map.set(key, { value, freshUntil: now + ttl, staleUntil: now + ttl + (miss ? 0 : STALE_GRACE_MS) });
  const cap = miss ? MAX_MISSES : MAX_ENTRIES;
  while (map.size > cap) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) break;
    map.delete(oldest);
  }
}

/** The L1 entry for a key, from either map. */
function lookup(key: string): Entry | undefined {
  return memory.get(key) ?? misses.get(key);
}

function sweep(): void {
  const now = Date.now();
  for (const map of [memory, misses]) for (const [key, entry] of map) if (entry.staleUntil < now) map.delete(key);
}

// unref() so a script that imports a service still exits when its work is done.
setInterval(sweep, SWEEP_INTERVAL_MS).unref();

/** Run `load` once per key even if called concurrently. */
function singleFlight<T>(key: string, load: () => Promise<T>): Promise<T> {
  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;
  // Only clear our own slot: after an invalidate() a newer load may hold it,
  // and deleting that one would let the next caller start a third.
  const promise: Promise<T> = load().finally(() => {
    if (inFlight.get(key) === promise) inFlight.delete(key);
  });
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
    const token = beginLoad(key);
    let value: T;
    try {
      value = await load();
    } catch (err) {
      endLoad(key, token);
      throw err;
    }
    if (endLoad(key, token)) store(key, value, ttlMs);
    return value;
  };

  const hit = lookup(key);
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
 * instance picks up another's invalidation reasonably quickly — though since
 * invalidations are also broadcast (below), the window only matters for a
 * write that bypassed invalidate(), so it can afford to be a little longer.
 */
export async function cachedShared<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
  memoryTtlMs = Math.min(ttlSeconds * 1000, 30_000),
): Promise<T> {
  const fill = async () => {
    const token = beginLoad(key);
    let value: T;
    try {
      const shared = await redisGetJSON<T>(key);
      if (shared !== null) {
        if (endLoad(key, token)) store(key, shared, memoryTtlMs);
        return shared;
      }
      value = await load();
    } catch (err) {
      endLoad(key, token);
      throw err;
    }
    // A load disowned by invalidate() still answers its own callers, but
    // writes nothing: its data predates the write that invalidated it. The
    // SET goes out in the same tick as the check, on the one connection the
    // DEL also uses, so an invalidation after this point is ordered behind it.
    if (endLoad(key, token)) {
      store(key, value, memoryTtlMs);
      // Fire-and-forget: a slow cache write must not delay the response. A
      // null is not sent: reading it back is indistinguishable from a miss,
      // so the SET only cost a round trip and 128 MB of Redis.
      if (value !== null && value !== undefined) void redisSetJSON(key, value, ttlSeconds);
    }
    return value;
  };

  const hit = lookup(key);
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
  misses.delete(key);
  inFlight.delete(key);
  loads.delete(key);
}

function forgetPrefix(prefix: string): void {
  for (const map of [memory, misses, inFlight, loads] as Map<string, unknown>[]) {
    for (const key of map.keys()) if (key.startsWith(prefix)) map.delete(key);
  }
}

/**
 * Broadcasts carry the sender's id, so an instance skips the echo of its own
 * invalidation: it already forgot the key, and forgetting it again a moment
 * later dropped whatever a request had rebuilt in between (and disowned the
 * rebuild's load) for one wasted rebuild per write. Signals are still
 * delivered to the sender — their handlers were written to expect it.
 */
const INSTANCE = randomUUID();
const PREFIX_MARK = "prefix*:";

function broadcast(body: string): void {
  publishInvalidation(`${INSTANCE}\n${body}`);
}

/** Drop a key from both tiers (or clear memory entirely when called bare). */
export function invalidate(key?: string): void {
  if (key === undefined) {
    memory.clear();
    misses.clear();
    inFlight.clear();
    loads.clear();
    return;
  }
  forget(key);
  void redisDel(key);
  // Other instances hold their own L1 copy that Redis deletion cannot reach,
  // and the stale window would keep them serving it. Tell them directly.
  broadcast(key);
}

/**
 * Drop every key that starts with `prefix`, in both tiers and on every
 * instance. For a family keyed by a free parameter — the feed per tag, a
 * standings table per month — where the writer cannot list the keys.
 */
export function invalidatePrefix(prefix: string): void {
  if (!prefix) return;
  forgetPrefix(prefix);
  void redisDelPrefix(prefix);
  broadcast(`${PREFIX_MARK}${prefix}`);
}

/**
 * invalidate()/invalidatePrefix() for a process about to exit — a seed
 * script. Those two fire and forget, which a script would cut off when it
 * closes its connection; this connects first (the client is lazy and keeps
 * no offline queue, so a first command would simply be refused), waits for
 * the Redis deletes, and leaves the broadcasts queued ahead of the QUIT that
 * closeRedis() sends. The running API receives them on the shared channel
 * and drops its L1 copies — before this, a reseed was invisible until each
 * key's TTL ran out, and Redis copies outlived API redeploys.
 */
export async function invalidateAndWait(keys: string[], prefixes: string[] = []): Promise<void> {
  await warmRedis();
  for (const key of keys) forget(key);
  for (const prefix of prefixes) forgetPrefix(prefix);
  if (keys.length) await redisDel(...keys);
  for (const prefix of prefixes) await redisDelPrefix(prefix);
  for (const key of keys) broadcast(key);
  for (const prefix of prefixes) broadcast(`${PREFIX_MARK}${prefix}`);
}

/**
 * Cross-instance signals that are not cache keys.
 *
 * Some process-local state — the session-revocation cache, the unread badge
 * count — is not kept in this map but has the same problem: instance A writes,
 * instance B keeps serving what it remembered. Rather than a second pub/sub
 * channel, those ride the invalidation channel with a reserved prefix, and the
 * listener routes them to whoever registered for the name instead of treating
 * them as keys to forget.
 *
 * The sender receives its own broadcast too, so a handler must be safe to run
 * on the instance that already applied the change locally (dropping an entry
 * that is already gone is).
 */
const SIGNAL_PREFIX = "signal:";
const signalHandlers = new Map<string, Set<(id: string) => void>>();

/** Register for `broadcastSignal(name, …)` from any instance, this one included. */
export function onSignal(name: string, handler: (id: string) => void): void {
  let set = signalHandlers.get(name);
  if (!set) {
    set = new Set();
    signalHandlers.set(name, set);
  }
  set.add(handler);
}

/** Tell every instance that `id` changed under `name`. Fire-and-forget. */
export function broadcastSignal(name: string, id: string): void {
  broadcast(`${SIGNAL_PREFIX}${name}:${id}`);
}

function receive(raw: string): void {
  // A message without a sender id comes from a process on the older format
  // (a rolling deploy); treat it as someone else's.
  const head = raw.indexOf("\n");
  const fromSelf = head >= 0 && raw.slice(0, head) === INSTANCE;
  const message = head >= 0 ? raw.slice(head + 1) : raw;
  if (message.startsWith(PREFIX_MARK)) {
    if (!fromSelf) forgetPrefix(message.slice(PREFIX_MARK.length));
    return;
  }
  if (!message.startsWith(SIGNAL_PREFIX)) {
    if (!fromSelf) forget(message);
    return;
  }
  const body = message.slice(SIGNAL_PREFIX.length);
  const sep = body.indexOf(":");
  if (sep < 0) return;
  const handlers = signalHandlers.get(body.slice(0, sep));
  if (!handlers) return;
  const id = body.slice(sep + 1);
  for (const handler of handlers) {
    try {
      handler(id);
    } catch (err) {
      console.error("[cache] signal handler failed:", (err as Error).message);
    }
  }
}

/**
 * Start honouring invalidations broadcast by other instances. Call once at
 * startup; without it this process keeps serving its own stale L1 copies after
 * someone else's write.
 */
export function startCacheInvalidationListener(): void {
  subscribeInvalidations(receive);
}

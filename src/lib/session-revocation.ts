import { prisma } from "./prisma.js";
import { broadcastSignal, onSignal } from "./cache.js";
import type { Job } from "./scheduler.js";

/**
 * Refusing sessions the account has ended.
 *
 * A JWT is self-contained: once issued there is nothing to delete, so a
 * password reset used to leave whoever already held a token still signed in —
 * which is precisely the person a reset is normally intended to remove — and
 * signing out did nothing to the token at all. Two records answer that:
 *
 *  - `User.sessionsValidFrom` is the moment everything older stopped being
 *    acceptable. A password reset or change stamps it and every token issued
 *    before it is dead. One column, every device at once.
 *  - `RevokedSession` rows name single tokens by `jti`. Signing out writes
 *    one, so the token on this device ends and the others carry on.
 *
 * Doing either check naively would add a database read to every request, so
 * both are read together into one cached entry per user. The instance that
 * performs a revocation drops its own entry at once and tells every other
 * instance to do the same over the cache invalidation channel, so in the
 * ordinary case it is instant everywhere; the TTL is only the backstop for a
 * write that bypassed both.
 */

/**
 * Three minutes. Against a ~500ms database this was the single largest
 * recurring cost per signed-in user at the old ten seconds, and with the
 * broadcast below the TTL no longer decides how fast a revocation lands.
 */
const CACHE_TTL_MS = 180_000;

/** Signal name on the invalidation channel; the payload is the user id. */
const REVOKED_SIGNAL = "session-revoked";

interface Revocations {
  /** Epoch milliseconds, or null when the account has never revoked. */
  validFrom: number | null;
  /** Tokens signed out individually and not yet expired. */
  revokedIds: Set<string>;
}

interface Entry extends Revocations {
  fetchedAt: number;
}

const cache = new Map<string, Entry>();

/**
 * Cold lookups in progress, so a page that fires a dozen authenticated
 * requests at once issues one query for the user rather than a dozen.
 */
const inFlight = new Map<string, Promise<Revocations>>();

/** Keeps the map from growing without bound on a long-running process. */
const MAX_ENTRIES = 50_000;

/**
 * One round trip for both records: the stamp off the user row and the live
 * revoked ids through the relation. Expired ids are filtered here rather than
 * left to the sweep, so a token that expired an hour ago and a row the sweep
 * has not reached yet agree.
 */
async function load(userId: string): Promise<Revocations> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      sessionsValidFrom: true,
      revokedSessions: { where: { expiresAt: { gt: new Date() } }, select: { jti: true } },
    },
  });
  return {
    validFrom: row?.sessionsValidFrom ? row.sessionsValidFrom.getTime() : null,
    revokedIds: new Set(row?.revokedSessions.map((r) => r.jti) ?? []),
  };
}

/**
 * One lookup per user at a time. The result is only cached if this promise is
 * still the registered one when it settles: a revocation that lands mid-flight
 * removes it (see `forget`), so a read that started before the write can never
 * overwrite the fresh answer with the old one.
 */
function loadOnce(userId: string): Promise<Revocations> {
  const pending = inFlight.get(userId);
  if (pending) return pending;

  const promise = load(userId).then((revocations) => {
    if (inFlight.get(userId) === promise) {
      if (cache.size >= MAX_ENTRIES) cache.clear();
      cache.set(userId, { ...revocations, fetchedAt: Date.now() });
    }
    return revocations;
  });
  promise.finally(() => {
    if (inFlight.get(userId) === promise) inFlight.delete(userId);
  }).catch(() => {
    /* surfaced to the caller through `promise` itself */
  });
  inFlight.set(userId, promise);
  return promise;
}

function forget(userId: string): void {
  cache.delete(userId);
  inFlight.delete(userId);
}

// Another instance revoked: drop whatever this one remembers about the account.
onSignal(REVOKED_SIGNAL, forget);

/**
 * True when this token has been ended: it is older than the account's last
 * revocation, or it was signed out by id.
 *
 * `issuedAt` is the token's `iat` in seconds and `jti` its id; both are
 * mandatory claims now (lib/auth-session.ts), so a token that reaches here
 * always carries them.
 *
 * A failed lookup allows the request. That is deliberate: if the database is
 * unreachable then nothing else works either, and turning a database blip into
 * a site-wide sign-out is the worse outcome of the two.
 */
export async function isSessionRevoked(userId: string, issuedAt: number, jti: string): Promise<boolean> {
  const now = Date.now();
  const cached = cache.get(userId);

  let revocations: Revocations;
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    revocations = cached;
  } else {
    try {
      revocations = await loadOnce(userId);
    } catch (err) {
      console.error("[session] revocation check failed, allowing the request:", (err as Error).message);
      return false;
    }
  }

  if (revocations.revokedIds.has(jti)) return true;
  if (revocations.validFrom === null) return false;
  // `iat` is whole seconds, so a token minted in the same second as the
  // revocation would otherwise survive it by rounding.
  return issuedAt * 1000 < revocations.validFrom;
}

/**
 * Ends every session for an account.
 *
 * The local cache entry is dropped rather than updated so the next request
 * re-reads the committed value, which keeps this correct even if the write
 * and the read disagree about ordering.
 */
export async function revokeSessions(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { sessionsValidFrom: new Date() } });
  forgetSessions(userId);
}

/**
 * Ends one session — the token behind a sign-out — and leaves the account's
 * other devices alone. `expiresAt` is the token's own `exp` in seconds: the
 * row only needs to outlive the token. Signing out twice with the same token
 * is a no-op, not an error.
 */
export async function revokeSession(userId: string, jti: string, expiresAt: number): Promise<void> {
  await prisma.revokedSession.upsert({
    where: { jti },
    update: {},
    create: { jti, userId, expiresAt: new Date(expiresAt * 1000) },
  });
  forgetSessions(userId);
}

/**
 * Drops the cached answer for one account, here and on every other instance,
 * for callers that have already written `sessionsValidFrom` themselves — the
 * password reset does it in the same statement as the new hash, so the two
 * cannot land apart.
 */
export function forgetSessions(userId: string): void {
  forget(userId);
  broadcastSignal(REVOKED_SIGNAL, userId);
}

/**
 * Removes revocation rows for tokens that have expired on their own. Runs
 * once a day through the scheduler; the reads above already ignore expired
 * rows, so this is housekeeping, not correctness.
 */
export const revokedSessionsSweep: Job = {
  name: "revoked_sessions_sweep",
  description: "Delete RevokedSession rows whose token has expired anyway.",
  periodOf: (now) => now.toISOString().slice(0, 10),
  async run(now) {
    const { count } = await prisma.revokedSession.deleteMany({ where: { expiresAt: { lt: now } } });
    return { deleted: count };
  },
};

/** Test seam. */
export function clearRevocationCache(): void {
  cache.clear();
  inFlight.clear();
}

/** Test seam: seed what a lookup would have returned, without a database. */
export function primeRevocationCache(userId: string, revocations: { validFrom?: number | null; revokedIds?: string[] }): void {
  cache.set(userId, {
    validFrom: revocations.validFrom ?? null,
    revokedIds: new Set(revocations.revokedIds ?? []),
    fetchedAt: Date.now(),
  });
}

import { prisma } from "./prisma.js";

/**
 * Refusing sessions that were issued before an account's last revocation.
 *
 * A JWT is self-contained: once issued there is nothing to delete, so a
 * password reset used to leave whoever already held a token still signed in —
 * which is precisely the person a reset is normally intended to remove.
 * `User.sessionsValidFrom` records the moment everything older stopped being
 * acceptable, and every authenticated request compares its token's issue time
 * against it.
 *
 * Doing that naively would add a database read to every request, so the answer
 * is cached briefly. The window is short enough that a revoked token dies
 * within seconds, and the instance that performs the revocation clears its own
 * entry immediately, so in the ordinary case it is instant.
 */

/** Short enough that a revocation takes effect while you are still reading the page. */
const CACHE_TTL_MS = 10_000;

interface Entry {
  /** Epoch milliseconds, or null when the account has never revoked. */
  validFrom: number | null;
  fetchedAt: number;
}

const cache = new Map<string, Entry>();

/** Keeps the map from growing without bound on a long-running process. */
const MAX_ENTRIES = 50_000;

async function load(userId: string): Promise<number | null> {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionsValidFrom: true },
  });
  return row?.sessionsValidFrom ? row.sessionsValidFrom.getTime() : null;
}

/**
 * True when this token is older than the account's last revocation.
 *
 * `issuedAt` is the token's `iat`, in seconds. Tokens minted before this
 * feature existed still carry one, because the library adds it by default.
 *
 * A token with no `iat` at all cannot be placed in time, so it is treated as
 * revoked whenever the account has revoked anything — the safe reading.
 *
 * A failed lookup allows the request. That is deliberate: if the database is
 * unreachable then nothing else works either, and turning a database blip into
 * a site-wide sign-out is the worse outcome of the two.
 */
export async function isSessionRevoked(userId: string, issuedAt: number | undefined): Promise<boolean> {
  const now = Date.now();
  const cached = cache.get(userId);

  let validFrom: number | null;
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    validFrom = cached.validFrom;
  } else {
    try {
      validFrom = await load(userId);
    } catch (err) {
      console.error("[session] revocation check failed, allowing the request:", (err as Error).message);
      return false;
    }
    if (cache.size >= MAX_ENTRIES) cache.clear();
    cache.set(userId, { validFrom, fetchedAt: now });
  }

  if (validFrom === null) return false;
  if (issuedAt === undefined) return true;

  // `iat` is whole seconds, so a token minted in the same second as the
  // revocation would otherwise survive it by rounding.
  return issuedAt * 1000 < validFrom;
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
  cache.delete(userId);
}

/**
 * Drops the cached answer for one account, for callers that have already
 * written `sessionsValidFrom` themselves — the password reset does it in the
 * same statement as the new hash, so the two cannot land apart.
 */
export function forgetSessions(userId: string): void {
  cache.delete(userId);
}

/** Test seam. */
export function clearRevocationCache(): void {
  cache.clear();
}

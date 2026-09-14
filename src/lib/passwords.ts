import bcrypt from "bcryptjs";

/**
 * Password hashing, in one place.
 *
 * bcrypt, as before: it is the right family for a credential that must be
 * hard to attack offline should the table leak, and bcryptjs is pure JS so
 * nothing native has to build on the deploy host. Two things changed.
 *
 * The cost is 12 rather than 10. Cost 10 was the 2010 recommendation; on the
 * Railway box it hashes in ~60ms, which means a leaked table is attacked at
 * hundreds of guesses a second per core. 12 quadruples that to ~250ms — felt
 * once at sign-in, never in a hot path — and the sign-in routes are behind a
 * limiter of twenty attempts per quarter hour anyway, so the extra CPU is
 * never spent on an attacker's behalf. bcryptjs yields to the event loop
 * between rounds, so a hash in flight does not stall other requests.
 *
 * Hashes written at the old cost still verify, and `needsRehash` says when
 * one should be rewritten: the login route does that the next time the
 * password is presented, so the table upgrades itself without a migration.
 */
export const BCRYPT_COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** True when the stored hash was made at a lower cost than we use now. */
export function needsRehash(hash: string): boolean {
  try {
    return bcrypt.getRounds(hash) < BCRYPT_COST;
  } catch {
    return false;
  }
}

/**
 * A hash to compare against when there is no account.
 *
 * Login used to answer "no such user" in under a millisecond and "wrong
 * password" after a full bcrypt compare, so the response time alone said
 * whether an address was registered. Comparing against this hash in the
 * no-account branch makes both paths cost the same. Computed once at boot,
 * at the current cost, from a random value nobody knows.
 */
const DUMMY_HASH: Promise<string> = bcrypt.hash(
  `no-such-account:${Math.random().toString(36).slice(2)}:${Date.now()}`,
  BCRYPT_COST,
);

/** Spend the time a real compare would have, and always fail. */
export async function burnCompare(password: string): Promise<false> {
  await bcrypt.compare(password, await DUMMY_HASH);
  return false;
}

/**
 * The one password policy, shared by sign-up, reset and change.
 *
 * Length only, on purpose. Composition rules ("one digit, one symbol") push
 * people toward `Password1!` and are no longer recommended; length is what
 * bcrypt's cost multiplies. The ceiling is well above bcrypt's 72-byte input
 * limit, which it silently truncates to — a longer password still works, it
 * is simply no stronger past that point.
 */
export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 128;

/** A usable password, or the reason it is not. */
export function passwordProblem(raw: unknown): string | null {
  if (typeof raw !== "string") return "Password is required.";
  if (raw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (raw.length > MAX_PASSWORD) return `Passwords are limited to ${MAX_PASSWORD} characters.`;
  return null;
}

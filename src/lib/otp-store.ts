import * as crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * One-time codes for password reset.
 *
 * The previous design was stateless: it bcrypt-hashed the six-digit code, put
 * that hash inside a JWT, and returned the JWT to whoever asked for a reset.
 * A JWT's payload is readable without the signing key, so anyone who knew a
 * victim's email address could ask for a reset, read the hash out of the
 * response, and brute-force six digits offline. A million candidates is a
 * small space; recovering the code and then resetting the victim's password
 * was a matter of minutes. Nothing about the token's five-minute life helped,
 * because a fresh one could be requested at any time.
 *
 * So the code never leaves the server now. The caller gets an opaque handle
 * that carries no information, and the hash stays in this map beside an
 * attempt counter, so the only way to find the code is to guess it online
 * against a limit.
 *
 * This is process-local, which is the same scope the previous active-token map
 * had. It is correct for a single instance; running more than one would need
 * this moved to Redis or a table, and a candidate could otherwise land on an
 * instance that has never heard of their challenge.
 */

/** Codes live five minutes, matching what the email tells the user. */
const TTL_MS = 5 * 60 * 1000;

/** Six digits is a million possibilities; this keeps online guessing hopeless. */
const MAX_ATTEMPTS = 5;

interface Challenge {
  /** Null for an address with no account: the flow still runs, nothing matches. */
  email: string | null;
  otpHash: string;
  expiresAt: number;
  attempts: number;
}

const challenges = new Map<string, Challenge>();
/** So a second request for the same address retires the first code. */
const latestForEmail = new Map<string, string>();

function sweep(now: number): void {
  for (const [token, challenge] of challenges) {
    if (challenge.expiresAt <= now) {
      challenges.delete(token);
      if (challenge.email && latestForEmail.get(challenge.email) === token) latestForEmail.delete(challenge.email);
    }
  }
}

/** A cryptographically random six-digit code. */
export function generateOtp(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Registers a code and returns the opaque handle the client will quote back.
 *
 * `email` is null when no account exists. A challenge is still issued so the
 * response is identical either way and cannot be used to test which addresses
 * are registered.
 */
export async function issueChallenge(email: string | null, otp: string): Promise<string> {
  const now = Date.now();
  sweep(now);

  const token = crypto.randomBytes(32).toString("base64url");
  const otpHash = await bcrypt.hash(otp, 10);
  challenges.set(token, { email, otpHash, expiresAt: now + TTL_MS, attempts: 0 });

  if (email) {
    const previous = latestForEmail.get(email);
    if (previous) challenges.delete(previous);
    latestForEmail.set(email, token);
  }
  return token;
}

export type ChallengeResult =
  | { ok: true; email: string }
  | { ok: false; reason: "unknown" | "expired" | "exhausted" | "mismatch" };

/**
 * Checks a code. Consumes the challenge on success, and counts the attempt on
 * failure so the guess budget actually runs out.
 */
export async function consumeChallenge(token: string, otp: string): Promise<ChallengeResult> {
  const now = Date.now();
  sweep(now);

  const challenge = challenges.get(token);
  if (!challenge) return { ok: false, reason: "unknown" };
  if (challenge.expiresAt <= now) {
    challenges.delete(token);
    return { ok: false, reason: "expired" };
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    challenges.delete(token);
    return { ok: false, reason: "exhausted" };
  }

  challenge.attempts += 1;
  const matches = await bcrypt.compare(otp, challenge.otpHash);

  // A challenge for an unknown address can never succeed, but it is compared
  // anyway so the work done — and the time taken — does not give it away.
  if (!matches || !challenge.email) {
    if (challenge.attempts >= MAX_ATTEMPTS) challenges.delete(token);
    return { ok: false, reason: "mismatch" };
  }

  challenges.delete(token);
  latestForEmail.delete(challenge.email);
  return { ok: true, email: challenge.email };
}

/** Test seam: forget everything. */
export function resetChallenges(): void {
  challenges.clear();
  latestForEmail.clear();
}

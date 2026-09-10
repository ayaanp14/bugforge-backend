import * as crypto from "crypto";
import { JWT_SECRET } from "./secrets.js";

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

/**
 * The key the codes are MACed under.
 *
 * bcrypt was the wrong tool here. Its cost is the point when a hash may leak
 * and be attacked offline for as long as the attacker likes; these hashes
 * never leave this process and die in five minutes, so the ~90ms of blocked
 * event loop it charged per hash and per guess protected nothing. A keyed
 * HMAC gives the same guarantee — no code recoverable from the map without
 * the key — at microsecond cost, and the five-attempt limit is still what
 * makes online guessing hopeless.
 *
 * Derived from the session secret with a label rather than used raw, so a
 * MAC minted here can never be mistaken for anything else signed by it.
 *
 * Deploying this change orphans any code hashed by the old bcrypt build:
 * verification simply fails and the user asks for a fresh one. Acceptable for
 * a five-minute code.
 */
const OTP_KEY = crypto.createHmac("sha256", JWT_SECRET).update("otp-challenge-v1").digest();

/** The code is bound to its handle, so identical codes never share a MAC. */
function macOf(token: string, otp: string): Buffer {
  return crypto.createHmac("sha256", OTP_KEY).update(`${token}:${otp}`).digest();
}

interface Challenge {
  /** Null for an address with no account: the flow still runs, nothing matches. */
  email: string | null;
  otpMac: Buffer;
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
  challenges.set(token, { email, otpMac: macOf(token, otp), expiresAt: now + TTL_MS, attempts: 0 });

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
  // Constant-time: both digests are the same length by construction, so the
  // comparison cannot leak how many leading bytes matched.
  const matches = crypto.timingSafeEqual(macOf(token, otp), challenge.otpMac);

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

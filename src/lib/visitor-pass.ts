import crypto from "node:crypto";
import { JWT_SECRET } from "./secrets.js";

/**
 * The visitor pass: proof that a person without an account passed a
 * Cloudflare Turnstile challenge recently, from this network.
 *
 * Two things a visitor can do here cost the platform something per call:
 * the online compiler (a run on the shared code-execution engine — Paiza's
 * free API, whose courtesy throttle every member's Run and Submit also
 * queue behind) and the free ATS check (a document parse on the API's main
 * thread). Per-address limits cap a person; a script rotating addresses
 * needs a challenge it cannot answer. Asking for one on every run would make
 * the compiler unusable, so the challenge is answered once and the API hands
 * back a pass: an HMAC over the caller's address (hashed — the pass is the
 * caller's to read) and an expiry, sent as the `X-Visitor-Pass` header for
 * the next PASS_TTL_MS. A pass from another network is refused, so one
 * solved challenge cannot be shared across a botnet; a phone that moves
 * between networks just answers the challenge again.
 *
 * Signed in, none of this applies — an account is the proof, and the
 * per-account limits (middleware/rate-limit executionLimiter) are the cap.
 *
 * Configured by TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY (both, or it is
 * off). Off, the visitor routes keep their per-address limits and the
 * compiler's global budget (lib/compiler) and nothing else — how the
 * resume check ran before this existed, and what local development gets.
 */

/** Its own label under JWT_SECRET, so a pass can never pass for a session token or a GitHub ticket. */
const PASS_KEY = crypto.createHmac("sha256", JWT_SECRET).update("visitor-pass:v1").digest();

/** How long one answered challenge lasts: a sitting at the compiler, or a few resume revisions. */
export const PASS_TTL_MS = 30 * 60_000;

/** The request header that carries a pass (lower-case, as Express reads it). */
export const PASS_HEADER = "x-visitor-pass";

/** What a refused request answers with, so the SPA knows to challenge again rather than show an error. */
export const PASS_REQUIRED_CODE = "VISITOR_PASS";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function turnstileSiteKey(): string | null {
  return process.env["TURNSTILE_SITE_KEY"]?.trim() || null;
}

function turnstileSecret(): string | null {
  return process.env["TURNSTILE_SECRET_KEY"]?.trim() || null;
}

/** Whether a visitor must hold a pass: only when both keys are set, so a half-configured server never locks visitors out. */
export function challengeRequired(): boolean {
  return Boolean(turnstileSiteKey() && turnstileSecret());
}

const addressTag = (address: string): string => crypto.createHash("sha256").update(address).digest("base64url").slice(0, 22);

/** A pass for this address, valid PASS_TTL_MS from `now`. */
export function mintPass(address: string, now = Date.now()): { pass: string; expiresAt: number } {
  const expiresAt = now + PASS_TTL_MS;
  const body = Buffer.from(JSON.stringify({ a: addressTag(address), e: expiresAt })).toString("base64url");
  const sig = crypto.createHmac("sha256", PASS_KEY).update(body).digest("base64url");
  return { pass: `${body}.${sig}`, expiresAt };
}

/** Whether `pass` was minted by this server, for this address, and has not expired. */
export function passIsValid(pass: unknown, address: string, now = Date.now()): boolean {
  if (typeof pass !== "string" || pass.length > 512) return false;
  const dot = pass.indexOf(".");
  if (dot <= 0) return false;
  const body = pass.slice(0, dot);
  const sig = Buffer.from(pass.slice(dot + 1), "base64url");
  const expected = crypto.createHmac("sha256", PASS_KEY).update(body).digest();
  if (sig.length !== expected.length || !crypto.timingSafeEqual(sig, expected)) return false;
  try {
    const claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { a?: unknown; e?: unknown };
    return typeof claims.e === "number" && claims.e > now && claims.a === addressTag(address);
  } catch {
    return false;
  }
}

export type ChallengeOutcome = "passed" | "failed" | "unavailable";

/**
 * Ask Cloudflare whether a Turnstile token is genuine (each token answers
 * once, within five minutes of being issued). A network failure or an
 * answer that is not Cloudflare's is `unavailable` — the route says "try
 * again", not "you look like a bot".
 */
export async function verifyTurnstile(token: string, remoteIp: string | undefined, fetchImpl: typeof fetch = fetch): Promise<ChallengeOutcome> {
  const secret = turnstileSecret();
  if (!secret) return "unavailable";
  const form = new URLSearchParams({ secret, response: token });
  if (remoteIp) form.set("remoteip", remoteIp);
  try {
    const res = await fetchImpl(SITEVERIFY_URL, { method: "POST", body: form, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return "unavailable";
    const out = (await res.json()) as { success?: unknown };
    return out.success === true ? "passed" : "failed";
  } catch {
    return "unavailable";
  }
}

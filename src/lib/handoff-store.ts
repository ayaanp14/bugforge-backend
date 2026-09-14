import crypto from "node:crypto";
import { signSession, type SessionClaims, type SessionUser } from "./auth-session.js";
import { redisDel, redisGetJSON, redisSetJSON } from "./redis.js";

/**
 * Handing a social sign-in's session to the SPA.
 *
 * The API runs the OAuth dance on its own origin, so the browser arrives at
 * the SPA by redirect and the SPA has to be told about the session somehow.
 * It used to be told the session itself: `/auth/callback?token=<JWT>`. That
 * put a thirty-day credential in a URL — in the browser's history, in the
 * static host's request log, and in the Referer of the next request if the
 * page had been slow to scrub it. Now the URL carries a code that is good for
 * one exchange within a minute, and the SPA posts it back for the token.
 *
 * What is stored is the token's claims, not the token: re-signing them
 * (lib/auth-session.ts `signSession` with pinned claims) reproduces the exact
 * token the cookie already holds, so the store never contains a credential
 * that could be lifted out of Redis and used.
 *
 * Process-local map first, Redis mirror second, the same pattern as the OTP
 * store: a code minted by one instance can be redeemed on another.
 */

/** Long enough for a redirect and a page load, not for a leak to matter. */
const TTL_MS = 60_000;

interface Handoff {
  user: SessionUser;
  claims: Pick<SessionClaims, "jti" | "iat" | "exp">;
  expiresAt: number;
}

const handoffs = new Map<string, Handoff>();

/** The Redis key is a hash of the code, so a Redis listing never shows a redeemable code. */
const redisKey = (code: string) => `handoff:v1:${crypto.createHash("sha256").update(code).digest("base64url")}`;

function sweep(now: number): void {
  for (const [code, handoff] of handoffs) if (handoff.expiresAt <= now) handoffs.delete(code);
}

/** Registers a session for pickup and returns the code to put in the URL. */
export function issueHandoff(user: SessionUser, claims: Pick<SessionClaims, "jti" | "iat" | "exp">): string {
  const now = Date.now();
  sweep(now);
  const code = crypto.randomBytes(32).toString("base64url");
  const handoff: Handoff = { user, claims, expiresAt: now + TTL_MS };
  handoffs.set(code, handoff);
  void redisSetJSON(redisKey(code), handoff, Math.ceil(TTL_MS / 1000));
  return code;
}

/**
 * Exchanges a code for the session token, once. A second exchange, an
 * expired code and a code that never existed are all the same null.
 */
export async function redeemHandoff(code: string): Promise<string | null> {
  const now = Date.now();
  sweep(now);

  let handoff = handoffs.get(code) ?? null;
  handoffs.delete(code);
  if (!handoff) {
    handoff = await redisGetJSON<Handoff>(redisKey(code));
    if (!handoff || typeof handoff.claims?.jti !== "string" || typeof handoff.user?.id !== "string") return null;
  }
  // Deleted on the way out whichever tier it came from, so a code redeemed
  // here cannot be redeemed again on another instance.
  void redisDel(redisKey(code));
  if (handoff.expiresAt <= now) return null;

  return signSession(handoff.user, handoff.claims);
}

/** Test seam. */
export function resetHandoffs(): void {
  handoffs.clear();
}

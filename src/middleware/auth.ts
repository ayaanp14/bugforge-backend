import type { Request, Response, NextFunction } from "express";
import { readSessionToken, SESSION_COOKIE } from "../lib/auth-session.js";
import { isSessionRevoked } from "../lib/session-revocation.js";
import { isOwnerEmail } from "../lib/plans.js";

/**
 * The session token on a request: the Authorization header first (required
 * cross-domain in production), the `__session` cookie as the same-site / local
 * dev fallback.
 */
function tokenOf(req: Request): string | null {
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cookieToken = (req.cookies as Record<string, string | undefined> | undefined)?.[SESSION_COOKIE];
  return headerToken || cookieToken || null;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = tokenOf(req);

  // Neither refusal is logged: a signed-out visitor probing a protected
  // route and a token past its thirty days are ordinary traffic, and at one
  // line per request they drowned the log. The 401 itself is the record.
  if (!token) {
    res.status(401).json({ error: "Unauthorized — no session" });
    return;
  }

  const claims = readSessionToken(token);
  if (!claims) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  // A valid signature is not enough on its own: the account may have ended
  // every session since this token was issued, which is what a password
  // reset does.
  if (await isSessionRevoked(claims.userId, claims.iat, claims.jti)) {
    res.status(401).json({ error: "Session ended. Please sign in again." });
    return;
  }

  req.user = { userId: claims.userId, email: claims.email, sessionId: claims.jti, sessionExpiresAt: claims.exp };
  next();
}

/**
 * Attaches the user when there is a valid session and carries on either way.
 *
 * Applies the same revocation check as `requireAuth`. Skipping it here used to
 * mean a token the account had ended still personalised every public page —
 * the problem list, the aptitude bank — for whoever held it, which is exactly
 * the holder a password reset is meant to lock out.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = tokenOf(req);
  if (!token) {
    next();
    return;
  }

  const claims = readSessionToken(token);
  if (claims && !(await isSessionRevoked(claims.userId, claims.iat, claims.jti))) {
    req.user = { userId: claims.userId, email: claims.email, sessionId: claims.jti, sessionExpiresAt: claims.exp };
  }
  next();
}

/**
 * Who may open the admin panel: ADMIN_EMAIL, comma-separated, plus the owner
 * accounts (below). Admin is a narrower grant than owner — it opens the
 * panel and nothing else, and does not touch billing or quotas.
 *
 * There used to be a built-in address here as well, so that an admin who
 * existed only on Railway could be tested against locally. The repository
 * is public, and a hard-coded address is an admin on every deployment
 * whatever the environment says (QA-039) — so the grant now comes from the
 * environment alone. Locally, put the address in ADMIN_EMAIL in .env.
 */
export function adminEmails(env: NodeJS.ProcessEnv = process.env): Set<string> {
  return new Set(
    (env["ADMIN_EMAIL"] ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Who may open the admin panel and its routes: the admin list above, and the
 * owner accounts from lib/plans (the creators, who already bypass every
 * quota — there is no sense in an account that is exempt from billing but
 * cannot read the billing table). Case-insensitive: addresses are lower-cased
 * at registration now, and a token minted before that (or an ADMIN_EMAIL typed
 * with a capital) must not lock the admin out of their own routes.
 */
export function isAdminEmail(email: string | null | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  if (!email) return false;
  const normalised = email.trim().toLowerCase();
  return adminEmails(env).has(normalised) || isOwnerEmail(normalised, env);
}

export function adminOnly(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !isAdminEmail(req.user.email)) {
    console.warn(`Admin access denied for: ${req.user?.email}`);
    res.status(403).json({ error: "Forbidden — Admin access required" });
    return;
  }
  next();
}

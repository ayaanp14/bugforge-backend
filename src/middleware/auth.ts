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

  if (!token) {
    console.warn("Auth check failed: No token in Authorization header or __session cookie.");
    res.status(401).json({ error: "Unauthorized — no session" });
    return;
  }

  const claims = readSessionToken(token);
  if (!claims) {
    console.error("Auth check failed: JWT verification error");
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  // A valid signature is not enough on its own: the account may have ended
  // every session since this token was issued, which is what a password
  // reset does.
  if (await isSessionRevoked(claims.userId, claims.iat)) {
    res.status(401).json({ error: "Session ended. Please sign in again." });
    return;
  }

  req.user = { userId: claims.userId, email: claims.email };
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
  if (claims && !(await isSessionRevoked(claims.userId, claims.iat))) {
    req.user = { userId: claims.userId, email: claims.email };
  }
  next();
}

/**
 * Addresses that are always admins; ADMIN_EMAIL adds more, comma-separated.
 *
 * In code rather than only in the environment for the same reason the owner
 * list is (lib/plans.ts): an admin who exists only on Railway is one nobody
 * can test against locally. Admin is a narrower grant than owner — it opens
 * the panel and nothing else, and does not touch billing or quotas.
 *
 * Lower-case entries only: the env additions are lower-cased, these are not.
 */
const DEFAULT_ADMIN_EMAILS = ["tabassump8319@gmail.com"];

export function adminEmails(env: NodeJS.ProcessEnv = process.env): Set<string> {
  const extra = (env["ADMIN_EMAIL"] ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_ADMIN_EMAILS, ...extra]);
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

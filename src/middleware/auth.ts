import type { Request, Response, NextFunction } from "express";
import { readSessionToken, SESSION_COOKIE } from "../lib/auth-session.js";
import { isSessionRevoked } from "../lib/session-revocation.js";

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

export function adminOnly(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const adminEmail = (process.env["ADMIN_EMAIL"] ?? "ADMIN_NOT_SET").trim().toLowerCase();

  // Case-insensitive: addresses are lower-cased at registration now, and a
  // token minted before that (or an ADMIN_EMAIL typed with a capital) must
  // not lock the admin out of their own routes.
  if (!req.user || (req.user.email ?? "").trim().toLowerCase() !== adminEmail) {
    console.warn(`Admin access denied for: ${req.user?.email}. Required: ${adminEmail}`);
    res.status(403).json({ error: "Forbidden — Admin access required" });
    return;
  }
  next();
}

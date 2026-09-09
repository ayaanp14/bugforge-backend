import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../lib/secrets.js";
import { isSessionRevoked } from "../lib/session-revocation.js";

interface JwtPayload {
  userId: string;
  email: string;
  /** Issued-at, in seconds. Added by the library on every token we mint. */
  iat?: number;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Try Authorization header first (required for cross-domain / production)
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  // Fallback to cookie for same-site / local dev
  const cookieToken = (req.cookies as Record<string, string | undefined>).__session;
  const token = headerToken || cookieToken;

  if (!token) {
    console.warn("Auth check failed: No token in Authorization header or __session cookie.");
    res.status(401).json({ error: "Unauthorized — no session" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as JwtPayload;
    
    if (!payload.userId) {
      console.error("Auth check failed: Payload missing userId", payload);
      res.status(401).json({ error: "Invalid session payload" });
      return;
    }

    // A valid signature is not enough on its own: the account may have ended
    // every session since this token was issued, which is what a password
    // reset does.
    if (await isSessionRevoked(payload.userId, payload.iat)) {
      res.status(401).json({ error: "Session ended. Please sign in again." });
      return;
    }

    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch (err) {
    console.error("Auth check failed: JWT verification error:", (err as Error).message);
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const cookieToken = (req.cookies as Record<string, string | undefined>).__session;
  const token = headerToken || cookieToken;

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as JwtPayload;

    if (payload.userId) {
      req.user = { userId: payload.userId, email: payload.email };
    }
  } catch (err) {
    console.warn("Optional auth warning (ignoring):", (err as Error).message);
  }
  next();
}

export function adminOnly(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const adminEmail = process.env["ADMIN_EMAIL"] ?? "ADMIN_NOT_SET";
  
  if (!req.user || req.user.email !== adminEmail) {
    console.warn(`Admin access denied for: ${req.user?.email}. Required: ${adminEmail}`);
    res.status(403).json({ error: "Forbidden — Admin access required" });
    return;
  }
  next();
}

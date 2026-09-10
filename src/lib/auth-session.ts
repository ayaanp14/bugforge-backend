import type { Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma.js";

/**
 * Everything needed to mint the `__session` cookie, in one place.
 *
 * This used to be split between the Express password routes and NextAuth's
 * custom jwt.encode in the frontend. Now that the frontend is a plain SPA with
 * no server, Express is the only issuer — but the token format is unchanged, so
 * existing sessions stay valid across the migration.
 */

import { JWT_SECRET, SESSION_TTL } from "./secrets.js";

export const SESSION_COOKIE = "__session";

const IS_PROD = process.env["NODE_ENV"] === "production";

/**
 * 30 days.
 *
 * In production the SPA and API are on different hosts, so the cookie has to be
 * SameSite=None (which mandates Secure). Locally both are on localhost — same
 * site, since ports don't count — so Lax works and doesn't depend on the
 * browser's localhost exemption for Secure cookies over plain http. This is the
 * same split NextAuth used before the migration.
 */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? "none" : "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: "/",
} as const;

export type SessionUser = { id: string; email: string | null };

/**
 * HS256 `{ userId, email }` — the shape backend middleware already verifies.
 *
 * The expiry is the important part. Without it a leaked token was valid for
 * ever and signing out could not take it back, because nothing about a JWT is
 * stored server-side to revoke. Tokens minted before this change carry no
 * `exp` and still verify, so nobody is signed out by the upgrade.
 */
export function signSession(user: SessionUser): string {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: SESSION_TTL,
  });
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, COOKIE_OPTIONS);
}

export function clearSessionCookie(res: Response): void {
  // Flags must match the ones it was set with or the browser keeps the cookie.
  res.clearCookie(SESSION_COOKIE, {
    path: "/",
    httpOnly: true,
    secure: COOKIE_OPTIONS.secure,
    sameSite: COOKIE_OPTIONS.sameSite,
  });
}

/** Sign the user in: mint the token and attach the cookie. */
export function establishSession(res: Response, user: SessionUser): string {
  const token = signSession(user);
  setSessionCookie(res, token);
  return token;
}

/** Slugify a display name into a username that isn't taken yet. */
export async function generateUsername(baseName: string): Promise<string> {
  let username = baseName
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  if (username.length < 3) {
    username = "user_" + Math.random().toString(36).substring(2, 7);
  }

  const existing = await prisma.user.findFirst({ where: { username }, select: { id: true } });
  if (existing) {
    username += "_" + Math.random().toString(36).substring(2, 5);
  }
  return username;
}

/** Fire-and-forget signup webhook. Never blocks or fails the request. */
export function fireRegistrationWebhook(user: { email: string | null; username: string | null }): void {
  const url = process.env["REGISTRATION_FLOW_URL"];
  if (!url) return;

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, username: user.username }),
  }).catch((err) => console.error("[auth] Registration webhook error:", err));
}

/** What a verified session token says about its holder. */
export interface SessionClaims {
  userId: string;
  email: string;
  /** Issued-at, in seconds. Added by the library on every token we mint. */
  iat?: number;
}

/**
 * The claims inside a session JWT, or null if it is not one we issued, has
 * expired, or names no account. This is the one place a Bearer token, a
 * `__session` cookie or a socket handshake is checked; the HTTP middleware and
 * the socket layer both go through it so they cannot drift apart.
 *
 * Signature and expiry only. Whether the account has since revoked its
 * sessions is a separate, cached question — see `isSessionRevoked`.
 */
export function readSessionToken(token: string): SessionClaims | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as Partial<SessionClaims>;
    if (typeof payload.userId !== "string" || !payload.userId) return null;
    return { userId: payload.userId, email: payload.email ?? "", iat: payload.iat };
  } catch {
    return null;
  }
}

/** True if the token is a well-formed, unexpired session JWT we issued. */
export function verifySessionToken(token: string): boolean {
  return readSessionToken(token) !== null;
}

/**
 * The named cookie out of a raw `Cookie` header, for the socket handshake,
 * which never passes through cookie-parser. Enough of RFC 6265 for our own
 * cookie: split on `;`, first `=` separates name from value, value is
 * percent-decoded the way Express encoded it.
 */
export function cookieFromHeader(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

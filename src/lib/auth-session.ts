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

const JWT_SECRET = process.env["JWT_SECRET"] || "your-secret-key";

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

/** HS256 `{ userId, email }` — the shape backend middleware already verifies. */
export function signSession(user: SessionUser): string {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    algorithm: "HS256",
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

  const existing = await prisma.user.findFirst({ where: { username } });
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

/** True if the token is a well-formed, unexpired session JWT we issued. */
export function verifySessionToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

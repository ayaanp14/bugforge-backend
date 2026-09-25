/**
 * The browser-facing sites this API serves, as configured. One place, since
 * CORS (index.ts) and the social sign-in redirects (routes/oauth.ts) must
 * agree on them. Trailing slashes stripped: an Origin header never carries
 * one, and CORS compares exactly.
 */

export const FRONTEND_URL = (process.env["FRONTEND_URL"] ?? "http://localhost:3000").replace(/\/+$/, "");

/**
 * The tournament site (battles.codekairo.com): a second SPA on its own
 * origin, signed in with the same account. No development default in
 * production — an unset variable must mean "no second origin", not a
 * localhost origin allowed credentials.
 */
export const BATTLES_URL = (process.env["BATTLES_URL"] ?? (process.env["NODE_ENV"] === "production" ? "" : "http://localhost:3002")).replace(/\/+$/, "");

/** Every browser origin the API answers with credentials. */
export const ALLOWED_ORIGINS = [FRONTEND_URL, BATTLES_URL].filter(Boolean);

export type Site = "main" | "battles";

/** A site named by a request (`?return=battles`) — only ever one of the two, never a URL. */
export const asSite = (value: unknown): Site => (value === "battles" && BATTLES_URL ? "battles" : "main");

export const siteUrl = (site: Site): string => (site === "battles" ? BATTLES_URL : FRONTEND_URL);

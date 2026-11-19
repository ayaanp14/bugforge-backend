import crypto from "node:crypto";

/**
 * Google and GitHub sign-in for the native Windows app (the `desktop/` repo).
 *
 * A desktop app cannot receive the provider's redirect, and it must not run
 * the OAuth dance in an embedded browser (Google refuses those, and it would
 * hand the app the member's provider password field). So it does what
 * RFC 8252 prescribes for native apps: it opens the member's own browser on
 * the same /api/auth/<provider> start route the site uses, and listens on a
 * loopback port for the end of it. The route remembers that port (cookie,
 * like the state), and when the callback has minted the session it sends
 * the browser to http://127.0.0.1:<port>/callback?code=… instead of the
 * site's /auth/callback. The app posts the code to /api/auth/handoff.
 *
 * Two rules keep that safe:
 *  - The redirect's host is fixed here, never read from the request: only a
 *    port is accepted, so the route cannot become an open redirect.
 *  - The code is bound to the app (RFC 7636, S256): the start URL carries
 *    the SHA-256 of a secret verifier the app never sends until the
 *    exchange, and lib/handoff-store.ts refuses a desktop code without the
 *    verifier that hashes to it. Anything else listening on the machine, or
 *    a link someone crafted with their own challenge, gets a code it cannot
 *    spend.
 */

export interface DesktopSignIn {
  /** The app's loopback listener. */
  port: number;
  /** base64url(SHA-256(verifier)), no padding — 43 characters. */
  challenge: string;
}

/** Below 1024 needs administrator rights to listen on, so an app never gets one. */
const MIN_PORT = 1024;
const MAX_PORT = 65535;
const CHALLENGE = /^[A-Za-z0-9_-]{43}$/;
/** RFC 7636 §4.1: 43–128 unreserved characters. */
const VERIFIER = /^[A-Za-z0-9._~-]{43,128}$/;

/** The start route's `desktop_port` + `desktop_challenge`, or null unless both are well-formed. */
export function parseDesktopSignIn(port: unknown, challenge: unknown): DesktopSignIn | null {
  if (typeof port !== "string" || !/^\d{4,5}$/.test(port)) return null;
  const value = Number(port);
  if (value < MIN_PORT || value > MAX_PORT) return null;
  if (typeof challenge !== "string" || !CHALLENGE.test(challenge)) return null;
  return { port: value, challenge };
}

/** What the start route keeps in its cookie for the callback leg. */
export function serializeDesktopSignIn(desktop: DesktopSignIn): string {
  return `${desktop.port}.${desktop.challenge}`;
}

/** The cookie back — re-validated, since a cookie is the client's to edit. */
export function readDesktopSignIn(cookie: unknown): DesktopSignIn | null {
  if (typeof cookie !== "string") return null;
  const dot = cookie.indexOf(".");
  if (dot < 0) return null;
  return parseDesktopSignIn(cookie.slice(0, dot), cookie.slice(dot + 1));
}

/** Where the browser goes at the end: the app's listener, on this machine only. */
export function loopbackUrl(desktop: DesktopSignIn, params: Record<string, string>): string {
  const url = new URL(`http://127.0.0.1:${desktop.port}/callback`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

/** S256: does this verifier hash to the challenge the sign-in started with? */
export function verifierMatches(verifier: unknown, challenge: string): boolean {
  if (typeof verifier !== "string" || !VERIFIER.test(verifier)) return false;
  const actual = Buffer.from(crypto.createHash("sha256").update(verifier).digest("base64url"));
  const expected = Buffer.from(challenge);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

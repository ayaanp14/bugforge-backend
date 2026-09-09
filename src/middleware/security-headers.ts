import type { Request, Response, NextFunction } from "express";

/**
 * Response headers that harden the API.
 *
 * Written out rather than pulled from a package because this service answers
 * with JSON and nothing else, which makes the right policy much stricter than
 * a general-purpose default: it never needs to load a script, embed a frame or
 * be embedded in one, so almost everything can simply be denied.
 *
 * These protect the API. The single-page app is served by its host, and a
 * browser only honours the headers that came with the HTML, so the app's own
 * policy has to be set there — see `frontend/vercel.json`.
 */

const IS_PROD = process.env["NODE_ENV"] === "production";

/**
 * Deny everything. A JSON API has no legitimate need to run a script, load an
 * image or be framed, so the only sane content policy is an empty one.
 */
const API_CSP = [
  "default-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Never let a browser second-guess a Content-Type. Without this a response
  // that an attacker can influence may be sniffed as HTML and run as script.
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Nothing here should ever appear inside a frame; both headers say so,
  // because the older one is still what some browsers act on.
  res.setHeader("X-Frame-Options", "DENY");

  res.setHeader("Content-Security-Policy", API_CSP);

  // Do not leak the path a user came from to another site.
  res.setHeader("Referrer-Policy", "no-referrer");

  // Turn off device access this API has no use for.
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");

  // Stop the browser resolving hostnames found in responses.
  res.setHeader("X-DNS-Prefetch-Control", "off");

  // Hide the implementation. Not a defence in itself, but there is no reason
  // to tell a scanner which framework and version to look up.
  res.removeHeader("X-Powered-By");

  // Only meaningful over TLS, and setting it locally would poison the
  // developer's browser into refusing plain http on localhost.
  if (IS_PROD) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

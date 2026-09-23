import type { Request, Response, NextFunction } from "express";
import { isTimestampFresh, verifySignature } from "../lib/crypto.js";

/**
 * Middleware to block any requests not originating from the platform
 */
export function platformGuard(req: Request, res: Response, next: NextFunction) {
  // 1. Skip checks for health or public diagnostic routes
  // /api/auth is exempt too: sign-in, sign-up and the OAuth callbacks are the
  // public entry points, and the OAuth callbacks arrive by redirect from the
  // provider, which cannot sign. Nothing there trusts the cookie for a write
  // (see routes/auth.ts), so the exemption is not a CSRF path.
  // The payment webhook is called by Cashfree, which cannot sign our platform
  // HMAC. It authenticates itself instead with its own signature header, which
  // the route verifies before touching anything — see routes/billing.ts.
  // robots.txt is fetched by crawlers, which cannot sign either; it only
  // ever says "nothing here is for you" (see index.ts). /api/seo is what
  // the site's edge Worker asks for a public page's head and the content
  // sitemaps: it holds no key, and the routes only read published content.
  // /api/problems/facets is the catalogue page's chip strips and hub index —
  // published content too, and the one route we let Cloudflare cache
  // (browserCache's `cdn` option). An answer served from the edge never
  // reaches this guard, so a signature it could not check must not be the
  // difference between a hit and a 403.
  if (req.path === "/health" || req.path === "/robots.txt" || req.path.startsWith("/api/auth") || req.path.startsWith("/api/seo/") || req.path === "/api/problems/facets" || req.path === "/api/billing/webhook") {
    return next();
  }

  const signature = req.headers["x-app-signature"] as string;
  const timestamp = req.headers["x-app-timestamp"] as string;
  const platform = req.headers["x-app-platform"] as string;

  // 2. Basic static platform check
  if (platform !== "codexa-web") {
    console.warn(`[Guard] Invalid platform header: ${platform}`);
    return res.status(403).json({ error: "Access Denied: Invalid Platform" });
  }

  // 3. HMAC Signature validation (The strict part)
  if (!signature || !timestamp) {
    console.warn(`[Guard] Missing signature or timestamp headers`);
    return res.status(403).json({ error: "Access Denied: Missing Security Credentials" });
  }

  // Use req.path for path-based signing
  const isVerified = verifySignature(signature, req.method, req.path, timestamp);

  if (!isVerified) {
    console.warn(`[Guard] Signature verification failed`, {
      method: req.method,
      path: req.path,
      timestamp
    });
    // A stale stamp is the one failure the client can fix by itself: a device
    // clock a minute or more out signed every request into this branch, and
    // since /api/auth is exempt the user could log in and then do nothing
    // else. Named, so the client re-syncs against /api/auth/time and retries
    // rather than treating it as a dead session.
    const code = isTimestampFresh(timestamp) ? "signature" : "timestamp";
    return res.status(403).json({ error: "Access Denied: Strict Origin Verification Failed", code, serverTime: Date.now() });
  }

  next();
}

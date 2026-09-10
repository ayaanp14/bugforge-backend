import type { RequestHandler } from "express";

/**
 * Browser-side caching for seeded, rarely-changing GET payloads (problem
 * detail, aptitude bank pages, plans, leaderboard).
 *
 * Every request carries Authorization and the X-App headers, so a shared cache
 * or CDN must never store these: `private` keeps the copy in the caller's own
 * browser. `stale-while-revalidate` lets a returning tab paint the last copy
 * and refresh in the background instead of waiting on the round trip.
 *
 * By default the header is only sent to anonymous callers. A signed-in
 * response often carries per-user state (solved flags, attempt counts, reveal
 * state) that the SPA refetches the moment it changes; a browser `max-age`
 * would hand back the pre-change copy for that window. Pass `shared: true`
 * for payloads that are byte-identical for every caller.
 */
export function browserCache(
  maxAgeSeconds: number,
  { shared = false }: { shared?: boolean } = {},
): RequestHandler {
  const value = `private, max-age=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 5}`;
  return (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const signedIn =
      Boolean(req.headers.authorization) || /(?:^|;\s*)__session=/.test(req.headers.cookie ?? "");
    if (shared || !signedIn) res.setHeader("Cache-Control", value);
    next();
  };
}

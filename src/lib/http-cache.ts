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
 *
 * `cdn: true` goes one step further and lets *any* shared cache — Cloudflare,
 * in front of the API — store the answer, which `shared: true` never did on
 * its own: it only ever changed who the `private` header was sent to. Two
 * things must hold before a route may pass it. The payload must not read the
 * caller at all (no `optionalAuth` branch), because an edge hit hands every
 * account the same bytes; and the path must be exempt from the platform guard
 * (middleware/platformGuard.ts), because an answer served from the edge never
 * reaches the guard. `public` with `s-maxage` is also exactly what RFC 9111
 * requires before a shared cache may store the answer to a request carrying
 * `Authorization` — which every request from the SPA does.
 */
/**
 * How long a browser keeps seeded content: a problem's statement, starters,
 * hints and editorial, the hub pages and the catalogue's counts, the bug-hunt
 * hubs, the roadmap's lessons. None of it moves with anyone's activity — only
 * a seed, a publish toggle or a deploy changes it — so it was held for five
 * minutes for no reason, and a problem reopened later in the day waited on a
 * round trip to be told nothing had changed. An hour (and, with
 * stale-while-revalidate, one stale view in the five after it) is how late a
 * content fix reaches a browser that already holds the old copy. A new build
 * can read a payload that old, which is one more reason new API fields stay
 * optional in the SPA's types. Answers that move with activity — the
 * leaderboard, the community pulse, the tournament list — keep short ages of
 * their own.
 */
export const SEEDED_CONTENT_MAX_AGE = 3600;

export function browserCache(
  maxAgeSeconds: number,
  { shared = false, cdn = false }: { shared?: boolean; cdn?: boolean } = {},
): RequestHandler {
  const value = cdn
    ? `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 5}`
    : `private, max-age=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 5}`;
  // A CDN-cacheable answer is by definition the same for every caller.
  const everyCaller = shared || cdn;
  return (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const signedIn =
      Boolean(req.headers.authorization) || /(?:^|;\s*)__session=/.test(req.headers.cookie ?? "");
    if (everyCaller || !signedIn) res.setHeader("Cache-Control", value);
    // The anonymous copy must not answer the same tab once it has signed
    // in: a visitor's aptitude question carries the worked solution, a
    // member's does not until an attempt. Keyed on the header that changes.
    if (!everyCaller) res.vary("Authorization");
    next();
  };
}

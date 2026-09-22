/**
 * What this host tells a crawler. Its own module so a test can read it:
 * index.ts starts a server on import.
 *
 * The API is not a website and nothing it answers belongs in an index —
 * X-Robots-Tag: noindex, nofollow on every response says so
 * (middleware/security-headers). Crawlable is a separate question, and the
 * two were conflated until 2026-09-22: the whole host was disallowed, so a
 * rendering crawler never issued the SPA's fetches, and every page whose
 * words come from this API rendered its empty state and was filed as a soft
 * 404. See the route in index.ts for the full account.
 */
export const ROBOTS_TXT = ["User-agent: *", "Allow: /api/", "Disallow: /", ""].join("\n");

/**
 * Whether the rules above let a crawler fetch `path`, by the most-specific
 * match a crawler uses (longest matching pattern wins; Allow wins a tie).
 * Only as clever as the rules it is given — enough to pin them.
 */
export function robotsAllows(path: string): boolean {
  let verdict = true;
  let longest = -1;
  for (const line of ROBOTS_TXT.split("\n")) {
    const rule = /^(Allow|Disallow):\s*(\S*)$/.exec(line.trim());
    if (!rule) continue;
    const [, kind, pattern] = rule;
    if (!path.startsWith(pattern)) continue;
    if (pattern.length < longest) continue;
    // A tie goes to Allow, as every major crawler resolves it.
    if (pattern.length === longest && kind === "Disallow") continue;
    longest = pattern.length;
    verdict = kind === "Allow";
  }
  return verdict;
}

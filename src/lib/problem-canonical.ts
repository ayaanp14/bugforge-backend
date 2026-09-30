/**
 * Problems the catalogue carries twice under two slugs — the same task,
 * written up twice in two authoring waves (scripts/catalog/binarysearch.ts
 * and binarysearch4.ts, dp.ts and dp4.ts, intervals.ts and greedy4.ts).
 * Found by scripts/seo-audit.mjs's duplicate-title check on 2026-09-30
 * and confirmed by reading the two statements.
 *
 * Both rows stay published — submissions, drafts and solve counts point at
 * them, and either is fine to practise — but a search engine is told which
 * address is the one, as APTITUDE_CANONICAL does for restated aptitude
 * questions (lib/aptitude-topics.ts): the second copy's page names the first
 * as canonical, the API says so to the SPA's runtime head, and only the
 * first is in the sitemap. The one kept is the one on the DSA roadmap
 * (scripts/roadmap-data.ts), which is also the longer write-up; for the coin
 * change pair, which is on neither, the older row.
 */
export const PROBLEM_CANONICAL: Readonly<Record<string, string>> = {
  sqrtx: "sqrt-x",
  "coin-change-2": "coin-change-ii",
  "find-first-and-last-position-of-element-in-sorted-array": "find-first-and-last-position",
  "minimum-number-of-arrows-to-burst-balloons": "minimum-number-of-arrows",
  "capacity-to-ship-packages-within-d-days": "capacity-to-ship-packages",
};

/** The slug a problem's page should name as canonical — its own unless it is a second copy. */
export const problemCanonicalSlug = (slug: string): string => PROBLEM_CANONICAL[slug] ?? slug;

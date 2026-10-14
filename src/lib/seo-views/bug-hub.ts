import type { BugHubPage } from "../../services/bug-hunts.js";

/**
 * The first screen of a bug hub page — /bug-hunts/javascript,
 * /bug-hunts/backend — as data, for the static-first view the Worker draws
 * from it (frontend lib/seo/views/api/bug-hub.ts; the registry and the
 * reasons are in lib/seo-views/index.ts): what BugHuntsHubPage draws — the
 * h1's subject, the blurb its lead sentence comes from, the counts and
 * split, the "Browse by" strip, and the hunts in their three difficulty
 * sections.
 *
 * Built in services/seo.ts bugHubHead from the `bugHubPage` it has already
 * loaded: no query of its own. The page's hunt list is part of that same
 * payload (GET /api/bug-challenges/hubs/:id), so the app's first frame has
 * every row; the view carries at most `ROWS_PER_LEVEL` of each section —
 * enough to fill the first viewport at every width measured (2026-10-13:
 * three columns of eight rows at 1920 × 1080 still end below the fold) —
 * because the backend hub holds 216 hunts, and drawing all of them doubled
 * the HTML for rows only a reader who scrolls before the mount would see.
 * Each section's own count is the whole section's.
 */
export interface BugHubView {
  kind: "bug-hub";
  hubKind: "language" | "category";
  label: string;
  /** The whole blurb; the page keeps its first sentence under the h1 (frontend lib/seo/summary firstSentence). */
  blurb: string;
  count: number;
  byDifficulty: Record<string, number>;
  /** The strip after this hub: the other hubs in their order. */
  related: Array<{ id: string; label: string; count: number }>;
  /** Easy, medium, hard: the section's whole count and its first rows, in the page's order. */
  levels: Array<{ level: "easy" | "medium" | "hard"; total: number; hunts: Array<{ href: string; title: string; difficulty: string; category: string; language: string; tags: string[] }> }>;
}

export const ROWS_PER_LEVEL = 24;

export function bugHubView(page: BugHubPage): BugHubView {
  const levels = (["easy", "medium", "hard"] as const)
    .map((level) => {
      const rows = page.hunts.filter((x) => x.difficulty.toLowerCase() === level);
      return {
        level,
        total: rows.length,
        hunts: rows.slice(0, ROWS_PER_LEVEL).map((x) => ({ href: `/bug-hunts/${x.slug ?? x.id}`, title: x.title, difficulty: x.difficulty, category: x.category, language: x.language, tags: x.tags.slice(0, 2) })),
      };
    })
    .filter((l) => l.total > 0);
  return {
    kind: "bug-hub",
    hubKind: page.kind,
    label: page.label,
    blurb: page.blurb,
    count: page.count,
    byDifficulty: page.byDifficulty,
    related: page.related.map((r) => ({ id: r.id, label: r.label, count: r.count })),
    levels,
  };
}

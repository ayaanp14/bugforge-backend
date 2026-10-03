/**
 * The catalogue list's filters, sorts and seeded shuffle, over rows already
 * in memory (services/dashboard.ts getCatalogue).
 *
 * GET /api/problems used to answer every filtered view and every page of the
 * shuffled default view with SQL: `JSON_CONTAINS` per tag (a scan of every
 * published row — a JSON array has no index), and for "shuffled" two queries
 * per page — every matching id, then the page's rows. The whole published
 * catalogue (id, title, slug, difficulty, tags, createdAt, timeLimitMs) is
 * already cached for the dashboard, and a solve state per reader beside it,
 * so the same answers are a filter over ~1,600 objects. Only the text search
 * still goes to MySQL: it reads `description`, which the cached rows leave
 * out on purpose (MediumText, ~1,600 of them) — one full-text statement whose
 * matches are ranked against these same rows (services/problem-search.ts)
 * and then filtered here like any other view.
 *
 * Equivalences with the SQL these replace, so the answers do not move:
 * - difficulty: MySQL's _ci collation compared case-insensitively → lowercase both.
 * - tags/company: `JSON_CONTAINS(tags, '["x"]')` is an exact, case-sensitive
 *   element match → `includes`.
 * - solved/unsolved: the relation filter "has an ACCEPTED submission" is
 *   exactly `ProblemState.solved` (the same GROUP BY).
 * - shuffled: the same FNV-1a seed and mulberry-style generator; the ids are
 *   put in a fixed order (by id) before shuffling, since the SQL read had no
 *   ORDER BY — a session that spans the deploy reshuffles once.
 */

export interface FilterableRow {
  id: string;
  title: string;
  difficulty: string;
  tags: unknown;
  timeLimitMs: number;
}

export interface CatalogueFilter {
  difficulty?: string;
  tags?: string[];
  company?: string;
  maxTime?: number | null;
  /** "solved" | "unsolved" for a signed-in reader, with their solved set. */
  status?: { want: "solved" | "unsolved"; solved: ReadonlySet<string> } | null;
}

const tagsOf = (row: { tags: unknown }): string[] => (Array.isArray(row.tags) ? (row.tags as string[]) : []);

export function filterCatalogue<T extends FilterableRow>(rows: readonly T[], f: CatalogueFilter): T[] {
  const difficulty = f.difficulty?.toLowerCase();
  const required = [...(f.tags ?? []), ...(f.company ? [f.company] : [])];
  return rows.filter((row) => {
    if (difficulty && row.difficulty.toLowerCase() !== difficulty) return false;
    if (f.maxTime && row.timeLimitMs > f.maxTime) return false;
    if (required.length > 0) {
      const tags = tagsOf(row);
      for (const t of required) if (!tags.includes(t)) return false;
    }
    if (f.status) {
      const solved = f.status.solved.has(row.id);
      if (f.status.want === "solved" ? !solved : solved) return false;
    }
    return true;
  });
}

/** `rows` arrive newest first (the catalogue's own order); the other sorts derive from it. */
export function sortCatalogue<T extends FilterableRow>(rows: readonly T[], sortBy: string | undefined): T[] {
  if (sortBy === "oldest") return [...rows].reverse();
  if (sortBy === "title-asc" || sortBy === "title-desc") {
    const dir = sortBy === "title-asc" ? 1 : -1;
    // Base sensitivity: MySQL's _ci collation ignores case and accents.
    return [...rows].sort((a, b) => dir * a.title.localeCompare(b.title, "en", { sensitivity: "base" }));
  }
  return [...rows];
}

/**
 * The deterministic order a browsing session's `seed` gives a set of ids.
 * The client sends one seed per session so every page slices the same order;
 * without one, a random order (each request its own).
 */
export function seededShuffle(ids: readonly string[], seed: string): string[] {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  if (!seed) h = (Math.random() * 4294967296) >>> 0;
  const rand = () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...ids].sort();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

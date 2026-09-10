import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { cached, cachedShared } from "../lib/cache.js";

/**
 * Query layer for the bug-hunts index.
 *
 * The page shows one section per category, each paginated independently. The
 * catalogue is small (hundreds of rows, each a handful of short columns) and
 * seeded, so it is read once per TTL into a shared cache and every view —
 * filtering, per-category slicing, the sidebar totals — is cut from that copy
 * in JS. Only the user's own solved set is asked for live.
 *
 * Before this the index ran a groupBy, then a second groupBy, then one query
 * per category, then the sidebar's four aggregates: four dependent tiers at
 * ~500ms each. Now it is one parallel tier of two reads, one of them a cache hit.
 */

export const DEFAULT_PAGE_SIZE = 10;

/** Sections render in this order; anything else falls through to the end. */
const CATEGORY_ORDER = ["frontend", "backend", "database"];

/** The shared list is seeded content; five minutes matches the id-order cache below. */
const CATALOGUE_TTL_SECONDS = 300;

export type BugHuntFilters = {
  search?: string;
  difficulty?: string;
  language?: string;
  tag?: string;
};

const SUMMARY_SELECT = {
  id: true,
  title: true,
  difficulty: true,
  category: true,
  language: true,
  tags: true,
  origin: true,
  createdAt: true,
} satisfies Prisma.BugChallengeSelect;

type Row = Prisma.BugChallengeGetPayload<{ select: typeof SUMMARY_SELECT }>;

/**
 * Every published challenge's summary row, in display order.
 *
 * Ordered by the database rather than re-sorted here so the sequence is the
 * one MySQL's collation produces — the same one every "Load more" slice used
 * to come back in. A row that crossed Redis carries its date as a string; it
 * is revived so the shape a caller sees never depends on which tier answered.
 */
async function publishedRows(): Promise<Row[]> {
  const rows = await cachedShared("bug:rows:v1", CATALOGUE_TTL_SECONDS, () =>
    prisma.bugChallenge.findMany({
      where: { isPublished: true },
      select: SUMMARY_SELECT,
      orderBy: [{ difficulty: "asc" }, { title: "asc" }],
    }),
  );
  return rows.map((r) => (r.createdAt instanceof Date ? r : { ...r, createdAt: new Date(r.createdAt) }));
}

const tagsOf = (row: Row): string[] =>
  Array.isArray(row.tags) ? row.tags.filter((t): t is string => typeof t === "string") : [];

/** Case-insensitive equality, which is what MySQL's default collation gave the old `where`. */
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * The active filters, applied to one row.
 *
 * Mirrors the old WHERE clause: difficulty and language compare the way the
 * collation did (case-insensitively), the tag dropdown wants an exact tag, and
 * free-text search reaches the title, the origin and any tag.
 */
function matches(row: Row, filters: BugHuntFilters): boolean {
  if (filters.difficulty && filters.difficulty !== "all" && !same(row.difficulty, filters.difficulty)) return false;
  if (filters.language && filters.language !== "all" && !same(row.language, filters.language)) return false;
  if (filters.tag && filters.tag !== "all" && !tagsOf(row).includes(filters.tag)) return false;

  const q = filters.search?.trim().toLowerCase();
  if (q) {
    return (
      row.title.toLowerCase().includes(q) ||
      (row.origin ?? "").toLowerCase().includes(q) ||
      tagsOf(row).some((t) => t.toLowerCase().includes(q))
    );
  }
  return true;
}

/**
 * Ids the user has already fixed, so rows can render their solved state. One
 * row per challenge rather than one per accepted submission.
 */
async function solvedIdsFor(userId: string | undefined): Promise<Set<string>> {
  if (!userId) return new Set();
  const rows = await prisma.bugSubmission.groupBy({
    by: ["challengeId"],
    where: { userId, verdict: "ACCEPTED" },
  });
  return new Set(rows.map((r) => r.challengeId));
}

const orderRank = (category: string) => {
  const i = CATEGORY_ORDER.indexOf(category.toLowerCase());
  return i === -1 ? CATEGORY_ORDER.length : i;
};

const withSolved = (rows: Row[], solved: Set<string>) =>
  rows.map((r) => ({ ...r, solved: solved.has(r.id) }));

/**
 * First page of every category, plus the totals the sidebar and filter
 * dropdown need. One request for the initial paint.
 */
export async function getBugHuntIndex(
  filters: BugHuntFilters,
  limit: number,
  userId?: string,
) {
  const [rows, solved] = await Promise.all([publishedRows(), solvedIdsFor(userId)]);

  const filtered = rows.filter((r) => matches(r, filters));

  // Rows are already in display order, so grouping preserves it within a
  // category; only the categories themselves need placing.
  const byCategory = new Map<string, Row[]>();
  for (const r of filtered) {
    const bucket = byCategory.get(r.category) ?? [];
    bucket.push(r);
    byCategory.set(r.category, bucket);
  }

  const ordered = [...byCategory.keys()].sort(
    (a, b) => orderRank(a) - orderRank(b) || a.localeCompare(b),
  );

  // Solved-per-category for the section headers. Counted across the whole
  // category, not just the first page, or "3 / 26" would change as you paginate.
  const groups = ordered.map((category) => {
    const items = byCategory.get(category)!;
    return {
      category,
      total: items.length,
      solved: items.reduce((n, r) => n + (solved.has(r.id) ? 1 : 0), 0),
      items: withSolved(items.slice(0, limit), solved),
    };
  });

  return {
    groups,
    ...catalogueSummary(rows, solved),
  };
}

/** One category's slice — what "Load more" asks for. */
export async function getBugHuntPage(
  category: string,
  filters: BugHuntFilters,
  limit: number,
  offset: number,
  userId?: string,
) {
  const [rows, solved] = await Promise.all([publishedRows(), solvedIdsFor(userId)]);

  const items = rows.filter((r) => same(r.category, category) && matches(r, filters));

  return { category, total: items.length, offset, items: withSolved(items.slice(offset, offset + limit), solved) };
}

/**
 * Catalogue totals with this user's solved counts layered on.
 *
 * Deliberately unfiltered: this describes the whole catalogue, not the current
 * view, which is how the sidebar behaved when the browser held every record.
 * The tag list can't come from a groupBy because tags is a JSON array, which
 * is one more reason the whole list is what gets cached rather than aggregates.
 *
 * Everything here is a fresh object. The rows are the shared cached copy and
 * are never assigned onto — mutating them would leak one user's solved counts
 * to everyone until the TTL expired.
 */
function catalogueSummary(rows: Row[], solved: Set<string>) {
  const byLanguage = new Map<string, { total: number; solved: number }>();
  const byDifficulty = new Map<string, { total: number; solved: number }>();
  const tagSet = new Set<string>();
  let solvedTotal = 0;

  const bump = (map: Map<string, { total: number; solved: number }>, key: string, isSolved: boolean) => {
    const entry = map.get(key) ?? { total: 0, solved: 0 };
    entry.total += 1;
    if (isSolved) entry.solved += 1;
    map.set(key, entry);
  };

  for (const r of rows) {
    const isSolved = solved.has(r.id);
    if (isSolved) solvedTotal += 1;
    bump(byLanguage, r.language, isSolved);
    bump(byDifficulty, r.difficulty, isSolved);
    for (const t of tagsOf(r)) tagSet.add(t);
  }

  return {
    summary: {
      total: rows.length,
      solved: solvedTotal,
      byLanguage: [...byLanguage.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([language, counts]) => ({ language, ...counts })),
      byDifficulty: [...byDifficulty.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([difficulty, counts]) => ({ difficulty, ...counts })),
    },
    tags: [...tagSet].sort(),
  };
}

/**
 * The catalogue in display order, ids only.
 *
 * Memory-only: it's a single indexed query, so a Redis round trip would cost
 * more than the query it replaces. The order changes only when a hunt is
 * published, which happens through the seed scripts rather than the API.
 */
function orderedIds(): Promise<{ id: string }[]> {
  return cached("bug:id-order", 300_000, () =>
    prisma.bugChallenge.findMany({
      where: { isPublished: true },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    }),
  );
}

/** Previous/next hunt in the default catalogue order, for workspace nav. */
export async function getNeighbours(id: string) {
  const ids = await orderedIds();
  const i = ids.findIndex((r) => r.id === id);
  return {
    prevId: i > 0 ? ids[i - 1]!.id : null,
    nextId: i !== -1 && i < ids.length - 1 ? ids[i + 1]!.id : null,
  };
}

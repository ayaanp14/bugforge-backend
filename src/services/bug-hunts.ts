import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { cached, cachedShared } from "../lib/cache.js";

/**
 * Query layer for the bug-hunts index.
 *
 * The page shows one section per category, each paginated independently, so
 * filtering and slicing happen in SQL rather than by shipping the whole
 * catalogue to the browser and cutting it there.
 */

export const DEFAULT_PAGE_SIZE = 10;

/** Sections render in this order; anything else falls through to the end. */
const CATEGORY_ORDER = ["frontend", "backend", "database"];

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

/**
 * Build the WHERE clause for the active filters.
 *
 * `tags` is a JSON column on MySQL, so the tag dropdown uses `array_contains`
 * (exact match) while free-text search has to reach the same column through
 * JSON_SEARCH — hence the id pre-resolution, which keeps the rest of the query
 * in Prisma instead of hand-writing the whole thing as raw SQL.
 */
async function buildWhere(filters: BugHuntFilters): Promise<Prisma.BugChallengeWhereInput> {
  const where: Prisma.BugChallengeWhereInput = { isPublished: true };

  if (filters.difficulty && filters.difficulty !== "all") where.difficulty = filters.difficulty;
  if (filters.language && filters.language !== "all") where.language = filters.language;
  if (filters.tag && filters.tag !== "all") {
    where.tags = { array_contains: filters.tag };
  }

  const q = filters.search?.trim();
  if (q) {
    const tagMatches = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM BugChallenge
      WHERE isPublished = true AND JSON_SEARCH(tags, 'one', ${`%${q}%`}) IS NOT NULL
    `;
    where.OR = [
      { title: { contains: q } },
      { origin: { contains: q } },
      ...(tagMatches.length ? [{ id: { in: tagMatches.map((r) => r.id) } }] : []),
    ];
  }

  return where;
}

/** Ids the user has already fixed, so rows can render their solved state. */
async function solvedIdsFor(userId: string | undefined): Promise<Set<string>> {
  if (!userId) return new Set();
  const rows = await prisma.bugSubmission.findMany({
    where: { userId, verdict: "ACCEPTED" },
    select: { challengeId: true },
  });
  return new Set(rows.map((r) => r.challengeId));
}

const orderRank = (category: string) => {
  const i = CATEGORY_ORDER.indexOf(category.toLowerCase());
  return i === -1 ? CATEGORY_ORDER.length : i;
};

type Row = Prisma.BugChallengeGetPayload<{ select: typeof SUMMARY_SELECT }>;
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
  const where = await buildWhere(filters);

  const [counts, solved] = await Promise.all([
    prisma.bugChallenge.groupBy({ by: ["category"], where, _count: { _all: true } }),
    solvedIdsFor(userId),
  ]);

  // Solved-per-category for the section headers. Counted across the whole
  // category, not just the first page, or "3 / 26" would change as you paginate.
  const solvedByCategory = new Map<string, number>();
  if (solved.size > 0) {
    const rows = await prisma.bugChallenge.groupBy({
      by: ["category"],
      where: { ...where, id: { in: [...solved] } },
      _count: { _all: true },
    });
    for (const r of rows) solvedByCategory.set(r.category, r._count._all);
  }

  const ordered = counts.sort(
    (a, b) => orderRank(a.category) - orderRank(b.category) || a.category.localeCompare(b.category),
  );

  const groups = await Promise.all(
    ordered.map(async (c) => ({
      category: c.category,
      total: c._count._all,
      solved: solvedByCategory.get(c.category) ?? 0,
      items: withSolved(
        await prisma.bugChallenge.findMany({
          where: { ...where, category: c.category },
          select: SUMMARY_SELECT,
          orderBy: [{ difficulty: "asc" }, { title: "asc" }],
          take: limit,
        }),
        solved,
      ),
    })),
  );

  return {
    groups,
    ...(await getCatalogueSummary(solved)),
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
  const where = { ...(await buildWhere(filters)), category };

  const [items, total, solved] = await Promise.all([
    prisma.bugChallenge.findMany({
      where,
      select: SUMMARY_SELECT,
      orderBy: [{ difficulty: "asc" }, { title: "asc" }],
      skip: offset,
      take: limit,
    }),
    prisma.bugChallenge.count({ where }),
    solvedIdsFor(userId),
  ]);

  return { category, total, offset, items: withSolved(items, solved) };
}

type SharedCatalogue = {
  total: number;
  byLanguage: { language: string; total: number }[];
  byDifficulty: { difficulty: string; total: number }[];
  tags: string[];
};

/**
 * The half of the summary that is identical for every user.
 *
 * Four aggregates plus a full read of the `tags` column — the tag list can't be
 * done as a groupBy because tags is a JSON array, so building the filter
 * dropdown means touching every row. That is well over the ~300ms Redis costs,
 * which is what earns it a place in the shared tier rather than memory alone.
 *
 * Deliberately unfiltered: this describes the whole catalogue, not the current
 * view, which is how the sidebar behaved when the browser held every record.
 */
function getSharedCatalogue(): Promise<SharedCatalogue> {
  return cachedShared("bug:catalogue", 300, async () => {
    const where: Prisma.BugChallengeWhereInput = { isPublished: true };

    const [total, byLanguage, byDifficulty, tagRows] = await Promise.all([
      prisma.bugChallenge.count({ where }),
      prisma.bugChallenge.groupBy({ by: ["language"], where, _count: { _all: true } }),
      prisma.bugChallenge.groupBy({ by: ["difficulty"], where, _count: { _all: true } }),
      prisma.bugChallenge.findMany({ where, select: { tags: true } }),
    ]);

    const tagSet = new Set<string>();
    for (const row of tagRows) {
      if (Array.isArray(row.tags)) {
        for (const t of row.tags) if (typeof t === "string") tagSet.add(t);
      }
    }

    return {
      total,
      byLanguage: byLanguage.map((l) => ({ language: l.language, total: l._count._all })),
      byDifficulty: byDifficulty.map((d) => ({ difficulty: d.difficulty, total: d._count._all })),
      tags: [...tagSet].sort(),
    };
  });
}

/**
 * Catalogue totals with this user's solved counts layered on.
 *
 * The shared half is cached and therefore handed to every caller — so this maps
 * it into fresh objects rather than assigning onto them. Mutating a cached
 * value would leak one user's solved counts to everyone until the TTL expired.
 */
async function getCatalogueSummary(solved: Set<string>) {
  const [shared, solvedRows] = await Promise.all([
    getSharedCatalogue(),
    solved.size > 0
      ? prisma.bugChallenge.findMany({
          where: { isPublished: true, id: { in: [...solved] } },
          select: { language: true, difficulty: true },
        })
      : Promise.resolve([]),
  ]);

  const countSolved = (key: "language" | "difficulty", value: string) =>
    solvedRows.filter((r) => r[key] === value).length;

  return {
    summary: {
      total: shared.total,
      solved: solvedRows.length,
      byLanguage: shared.byLanguage.map((l) => ({
        ...l,
        solved: countSolved("language", l.language),
      })),
      byDifficulty: shared.byDifficulty.map((d) => ({
        ...d,
        solved: countSolved("difficulty", d.difficulty),
      })),
    },
    tags: shared.tags,
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

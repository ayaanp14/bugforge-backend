import { Router } from "express";
import { tournamentSolveFor } from "../services/tournament-record.js";
import { ensureContest, todayUtc } from "../services/daily-contest.js";
import slugify from "slugify";
import { prisma } from "../lib/prisma.js";
import { requireAuth, optionalAuth, adminOnly } from "../middleware/auth.js";
import { cachedShared, invalidate, invalidatePrefix } from "../lib/cache.js";
import { browserCache, SEEDED_CONTENT_MAX_AGE } from "../lib/http-cache.js";
import { catalogueNeighbours, getCatalogue, invalidateDashboard, listProblemsWithStatus, loadProblemState, problemIdBySlug, publishedProblemExists, type CatalogueRow, type ProblemState } from "../services/dashboard.js";
import { normalizeSearch } from "../lib/problem-search.js";
import { searchCatalogue } from "../services/problem-search.js";
import { acceptanceRates } from "../services/problem-acceptance.js";
import { assignProblemNumbers } from "../lib/problem-numbers.js";
import { isCompanyTag } from "../lib/companies.js";
import { problemCanonicalSlug } from "../lib/problem-canonical.js";
import { isJudgeLanguage } from "../lib/judge0.js";
import { HUB_PAGE_SIZE, hubIndex, hubPage, hubProblems, hubProgress, hubsForTags, relatedProblems } from "../services/problem-hubs.js";
import { lessonsForTopics } from "../services/roadmap-lessons.js";
import { forgetProblemSeo, problemSeoText } from "../services/seo.js";
import { forgetJudgeSuite } from "../lib/test-suite-cache.js";
import { filterCatalogue, seededShuffle, sortCatalogue, type CatalogueFilter } from "../lib/catalogue-filter.js";
import { ENGAGEMENT_EVENTS, recordEngagement, type EngagementEvent } from "../services/skill-profile.js";

const router = Router();

/**
 * A published problem statement is the same bytes for everyone and changes
 * only when an admin edits it, so the whole composed payload is cached rather
 * than any one query inside it. That is the shape the shared tier is for: one
 * round trip instead of three (the problem with its visible cases, then the
 * neighbour on either side).
 */
// v3: the payload carries the problem's `number` (2026-10-03).
export const PROBLEM_KEY_PREFIX = "problem:v4:";
const problemKey = (slug: string) => `${PROBLEM_KEY_PREFIX}${slug}`;

/**
 * The editorial and its per-language solutions live under their own key. They
 * are the two largest columns on the row — a MediumText walkthrough and a Json
 * of thirteen reference programs — and the workspace only reads them when the
 * Editorial tab is opened, so they are fetched (and cached) on demand rather
 * than shipped with every statement.
 */
const editorialKey = (slug: string) => `problem:editorial:v1:${slug}`;

/** The starter stubs and the hints, which the lean payload leaves out (/:slug/starter/:lang, /:slug/hints). */
const starterKey = (slug: string) => `problem:starter:v1:${slug}`;
const hintsKey = (slug: string) => `problem:hints:v1:${slug}`;
/** The duel room's slice of a problem (routes/duels GET /:id/problem). */
export const duelProblemKey = (slug: string) => `duel-problem:v1:${slug}`;

/**
 * After any admin write, so the next reader sees the edit rather than the TTL.
 * Pass `problemId` when the caller has it; otherwise it is looked up so the
 * judge's copy still goes.
 */
export function invalidateProblem(slug: string, problemId?: string): void {
  invalidate(problemKey(slug));
  invalidate(editorialKey(slug));
  invalidate(starterKey(slug));
  invalidate(hintsKey(slug));
  invalidate(duelProblemKey(slug));
  // The catalogue carries titles, tags and difficulty, all of which an edit can
  // move, and publishing or retiring a problem changes its membership outright.
  invalidate("catalogue:published");
  // So do the other lists of published problems: the duel arena pool
  // (routes/duels publishedIds) and the placement tests' draw pool
  // (services/aptitude-bank), both five or ten minutes otherwise.
  invalidate("duels:published:problem");
  invalidate("problems:draw-pool:v1");
  forgetProblemSeo(slug);
  // The judge's copy of the row and the cases. Nothing cleared it before, so
  // for 15 minutes after an unpublish the problem stayed runnable — and paid
  // XP — from a tab already open on it, and an edited test case or time limit
  // was judged on the old values.
  if (problemId) forgetJudgeSuite(problemId);
  else
    void prisma.problem
      .findUnique({ where: { slug }, select: { id: true } })
      .then((p) => p && forgetJudgeSuite(p.id))
      .catch(() => {
        /* the TTL still bounds it */
      });
}

/**
 * After a numbering pass gave numbers out (lib/problem-numbers): the cached
 * catalogue and every cached statement predate them. Once per database in
 * practice — the boot that follows the deploy creating the table — and then
 * only when a problem was added outside the API.
 */
export function forgetProblemNumbers(): void {
  invalidate("catalogue:published");
  invalidatePrefix(PROBLEM_KEY_PREFIX);
}

/** Rows per list page, and the most a caller may ask for at once. */
const MAX_TAKE = 100;

/**
 * The fields a list row carries — the same slice `listProblemsWithStatus`
 * projects the cached catalogue down to, so every path below answers with one
 * shape.
 *
 * Deliberately absent: `createdAt` and `timeLimitMs`. Both rode on every row
 * of every list page and no consumer has ever read them — not the catalogue
 * table, not the pickers, not the mobile list (which renders id, slug, title,
 * difficulty, tags and status). `maxTime` filters on timeLimitMs and `sortBy`
 * orders on createdAt server-side; neither needs the field on the wire.
 * At the 100-row cap that was ~5.6 KB of a 26 KB answer. A search's relevance
 * score is not sent either: the order is the answer.
 */
const listRow = (p: CatalogueRow, state: ProblemState | null, rates: ReadonlyMap<string, number>) => ({
  id: p.id,
  number: p.number ?? null,
  title: p.title,
  slug: p.slug,
  difficulty: p.difficulty,
  tags: p.tags,
  status: statusOf(state, p.id),
  // Solved in a Battles tournament: the row's trophy mark.
  tournament: state?.tournamentSolved.has(p.id) ?? false,
  // Percent of submissions accepted, or null below
  // ACCEPTANCE_MIN_SUBMISSIONS (services/problem-acceptance).
  acceptance: rates.get(p.id) ?? null,
});

/**
 * Everything the workspace reads off a problem, and nothing it does not.
 *
 * Deliberately absent: `referenceSolution` and `referenceLanguage` (the answer
 * key, which has no business on the wire at all), and `editorial` plus
 * `solutions`, which GET /:slug/editorial serves on demand. Pair rooms embed
 * the same slice — see routes/pair-rooms.ts.
 */
const PROBLEM_DETAIL_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  difficulty: true,
  tags: true,
  timeLimitMs: true,
  memoryLimitMb: true,
  isPublished: true,
  createdAt: true,
  numbering: { select: { number: true } },
  starterCode: true,
  signature: true,
  hints: true,
  editorial: true,
  testCases: {
    where: { isHidden: false },
    select: { id: true, input: true, expectedOutput: true, orderIndex: true },
    orderBy: { orderIndex: "asc" },
  },
} as const;

const statusOf = (state: ProblemState | null, id: string) =>
  state === null ? "UNSOLVED" : state.solved.has(id) ? "SOLVED" : state.attempted.has(id) ? "ATTEMPTING" : "UNSOLVED";

/** The first string a query parameter carries, or nothing: `?a=1&a=2` and `?a[]=1` are arrays, `?a[b]=1` an object. */
const first = (value: unknown): string | undefined => {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && v ? v : undefined;
};

/** Every string a repeatable parameter carries. */
const all = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value]).filter((v): v is string => typeof v === "string" && v.length > 0);

// 1. GET /api/problems — List all published problems with pagination and filtering
router.get("/", optionalAuth, browserCache(60), async (req, res) => {
  try {
    // Query values are strings, arrays (`?a=1&a=2`, `?a[]=1`) or nested
    // objects depending on how the caller spelt them. Every scalar filter
    // takes the first string given and ignores the rest: an array reached
    // Prisma as `{ equals: [..] }` and `{ contains: [..] }` and 500ed
    // (QA-005). `tag` is the one filter that legitimately repeats.
    const tags = all(req.query["tag"]);
    const difficulty = first(req.query["difficulty"]);
    const company = first(req.query["company"]);
    // Normalized once (lib/problem-search): case, accents, punctuation and
    // runs of spaces fold away, anything past 100 characters is cut, and
    // what is left empty — "", "   ", "!!!" — is no search at all.
    const search = normalizeSearch(first(req.query["search"]));
    const status = first(req.query["status"]);
    const sortBy = first(req.query["sortBy"]);
    const skip = first(req.query["skip"]);
    const take = first(req.query["take"]);
    // "abc" parsed to NaN and Prisma refused `lte: NaN`; a non-number is no filter.
    const maxTimeNum = Number(first(req.query["maxTime"]));
    const maxTime = Number.isFinite(maxTimeNum) && maxTimeNum > 0 ? Math.floor(maxTimeNum) : null;
    const skipNum = Math.max(0, parseInt(String(skip ?? "0")) || 0);
    // Clamped: without a ceiling one request could ask for the whole catalogue.
    const takeNum = Math.min(MAX_TAKE, Math.max(1, parseInt(String(take ?? "")) || MAX_TAKE));
    const userId = req.user?.userId ?? null;

    // The masthead's three counts, folded into this answer when the caller asks
    // for them. The catalogue page used to fetch them as a second request
    // (GET /summary) fired beside this one, and both tiers read the same 30 s
    // `loadProblemState` memo — so the second request bought a round trip and
    // nothing else. Opt-in, because every other caller (the mobile list, the
    // pickers, the dashboard) expects the bare array this route has always
    // answered with.
    const wantsSummary = first(req.query["summary"]) === "1";
    const send = async (rows: unknown[]) => {
      if (!wantsSummary) {
        res.json(rows);
        return;
      }
      res.json({ problems: rows, summary: await catalogueSummary(userId) });
    };

    // The status filter only means something for a signed-in reader; anyone
    // else gets the unfiltered list, which is what they always got.
    const statusFilter = userId && (status === "solved" || status === "unsolved") ? status : null;

    // The plain first page — no filter, newest first — is the same slice of the
    // catalogue for everyone, and that catalogue is already held in memory for
    // the dashboard. Serve it from there: one parallel tier (the two solve-state
    // GROUP BYs) for a signed-in reader, no round trip at all for a visitor.
    // "relevance" is what a search is ordered by; without one it means the
    // catalogue's own order, like no sortBy at all.
    const isDefaultSort = !sortBy || sortBy === "newest" || sortBy === "relevance";
    const isPlainFirstPage =
      isDefaultSort && skipNum === 0 && !difficulty && tags.length === 0 && !company && !search && !maxTime && !statusFilter;
    // The Acceptance column: one cached aggregate shared by every reader,
    // overlapped with whatever else the answer waits on. It never throws.
    const ratesPromise = acceptanceRates();
    if (isPlainFirstPage) {
      const [head, rates] = await Promise.all([
        userId
          ? listProblemsWithStatus(userId, takeNum)
          : // Same projection as listProblemsWithStatus: the visitor's copy of
            // the head must be the same shape as a member's.
            getCatalogue().then((catalogue) => catalogue.slice(0, takeNum).map((p) => listRow(p, null, new Map()))),
        ratesPromise,
      ]);
      await send(head.map((row) => ({ ...row, acceptance: rates.get(row.id) ?? null })));
      return;
    }

    // The reader's solve state is two GROUP BYs over their own submissions —
    // one row per problem touched, index-only — and it does not depend on which
    // page comes back, so it overlaps the page's own read instead of following
    // it. Previously this was a third round trip that fetched every submission
    // row for the page's problems.
    const statePromise: Promise<ProblemState | null> = userId ? loadProblemState(userId) : Promise.resolve(null);
    // The client sends one `seed` for a whole browsing session, so every page
    // slices the SAME order — without it, each request reshuffles and infinite
    // scroll returns duplicate/missing rows.
    const seedStr = first(req.query["seed"]) ?? "";

    // Every view answers from memory (lib/catalogue-filter says why, and
    // which SQL each rule stands in for): no round trip for a visitor, the
    // reader's cached solve state for a member. Every chip click and every
    // scroll page of the default shuffled view lands here. A search adds one
    // full-text statement at most (services/problem-search), cached by its
    // terms and overlapped with the solve state; it used to be a `LIKE
    // '%q%'` over every statement, in newest-first order.
    const [catalogue, ranked, loaded, rates] = await Promise.all([getCatalogue(), search ? searchCatalogue(search) : null, statePromise, ratesPromise]);
    const filter: CatalogueFilter = {
      difficulty,
      tags,
      company,
      maxTime,
      status: statusFilter && loaded ? { want: statusFilter, solved: loaded.solved } : null,
    };
    let page: CatalogueRow[];
    if (ranked && (!sortBy || sortBy === "relevance" || sortBy === "shuffled")) {
      // A search's own order is its relevance — asked for by name, or by not
      // asking (Ctrl+K, the pickers), or under the catalogue page's default
      // shuffle, which would bury the best match somewhere in the list.
      // filterCatalogue keeps the order it is given.
      page = filterCatalogue(ranked, filter).slice(skipNum, skipNum + takeNum);
    } else {
      // Any other sort reorders the matches the way it orders the catalogue,
      // so it is applied to them in catalogue order (newest first).
      const ids = ranked ? new Set(ranked.map((p) => p.id)) : null;
      const matches = filterCatalogue(ids ? catalogue.filter((p) => ids.has(p.id)) : catalogue, filter);
      // "random" is the catalogue page's Pick one (take=1, no seed): the
      // shuffle, but random under a search as well, where "shuffled" means
      // best match.
      if (sortBy === "shuffled" || sortBy === "random") {
        const byId = new Map(matches.map((p) => [p.id, p]));
        page = seededShuffle(matches.map((p) => p.id), seedStr)
          .slice(skipNum, skipNum + takeNum)
          .map((id) => byId.get(id)!);
      } else {
        page = sortCatalogue(matches, sortBy, rates).slice(skipNum, skipNum + takeNum);
      }
    }
    await send(page.map((p) => listRow(p, loaded, rates)));
  } catch (err) {
    console.error("GET /api/problems error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * How many published problems carry each tag that passes `keep`, most-used
 * first. Counted over the in-memory catalogue (already held for the
 * dashboard), so neither chip strip costs a round trip.
 */
async function countTags(keep: (tag: string) => boolean): Promise<Array<{ name: string; count: number }>> {
  const catalogue = await getCatalogue();
  const counts = new Map<string, number>();
  for (const row of catalogue) {
    const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];
    for (const t of tags) if (keep(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * The catalogue page's masthead: how big the catalogue is and how far the
 * reader has got. The list route returns at most MAX_TAKE rows, so a hero that
 * counted the page it was given said "100 problems" over a 598-problem
 * catalogue. Both numbers are already in memory or index-only (see
 * loadProblemState) — which is what lets GET / fold them into its own answer
 * for nothing (`?summary=1`).
 *
 * Counted over the catalogue, not the raw submission sets: an accepted
 * submission on a problem since unpublished should not make the reader's tally
 * exceed what is on the page.
 */
async function catalogueSummary(userId: string | null): Promise<{ total: number; solved: number; attempted: number }> {
  if (!userId) return { total: (await getCatalogue()).length, solved: 0, attempted: 0 };
  const state = await loadProblemState(userId);
  let solved = 0;
  let attempted = 0;
  for (const p of state.catalogue) {
    if (state.solved.has(p.id)) solved += 1;
    else if (state.attempted.has(p.id)) attempted += 1;
  }
  return { total: state.catalogue.length, solved, attempted };
}

// The counts on their own, for a caller that wants nothing else. The SPA reads
// them off the list answer instead.
router.get("/summary", optionalAuth, browserCache(60), async (req, res) => {
  try {
    res.json(await catalogueSummary(req.user?.userId ?? null));
  } catch (err) {
    console.error("GET /api/problems/summary error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// The two chip strips on the catalogue page. Both are declared before /:slug
// so the paths are not read as problem slugs. Tags split cleanly in two: a
// tag is a hiring company or it is a topic ("Array", "Bit Manipulation").
router.get("/topics", browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (_req, res) => {
  try {
    res.json(await countTags((t) => !isCompanyTag(t)));
  } catch (err) {
    console.error("GET /api/problems/topics error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/companies", browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (_req, res) => {
  try {
    res.json(await countTags(isCompanyTag));
  } catch (err) {
    console.error("GET /api/problems/companies error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * The catalogue page's whole static shape in one answer: both chip strips and
 * the hub index that gives their chips their links. The page fired those as
 * three requests (/topics, /companies, /hubs) on every load and then joined
 * them straight back together to build the hrefs — one payload split three
 * ways. The three routes above and below stay: the hub pages and the mobile
 * app read them one at a time.
 *
 * Nothing here reads the caller, so this is the one problems route a shared
 * cache may store. `cdn: true` (with the platform-guard exemption in
 * middleware/platformGuard.ts, since an edge hit never reaches the guard) is
 * what lets Cloudflare answer it from the reader's own PoP instead of routing
 * every copy to Mumbai — which on the free plan is a trip through Europe.
 */
router.get("/facets", browserCache(SEEDED_CONTENT_MAX_AGE, { cdn: true }), async (_req, res) => {
  try {
    const [topics, companies, hubs] = await Promise.all([
      countTags((t) => !isCompanyTag(t)),
      countTags(isCompanyTag),
      hubIndex(),
    ]);
    res.json({ topics, companies, hubs });
  } catch (err) {
    console.error("GET /api/problems/facets error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * The catalogue's hub pages (services/problem-hubs): every topic and company
 * with its counts, and one hub with its whole problem list. Both are walks
 * over the in-memory catalogue, shared-cached at the edge like the strips
 * above. Declared before /:slug so "hubs" is never read as a problem.
 *
 *   GET /api/problems/hubs                 → { topics, companies, uncovered }
 *   GET /api/problems/hubs/topic/arrays    → the hub page, or 404
 *   GET /api/problems/hubs/company/amazon
 */
router.get("/hubs", browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (_req, res) => {
  try {
    res.json(await hubIndex());
  } catch (err) {
    console.error("GET /api/problems/hubs error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/hubs/:kind/:slug", browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (req, res) => {
  try {
    const kind = req.params["kind"];
    if (kind !== "topic" && kind !== "company") {
      res.status(404).json({ error: "No such hub" });
      return;
    }
    const page = await hubPage(kind, String(req.params["slug"]).toLowerCase());
    if (!page) {
      res.status(404).json({ error: "No such hub" });
      return;
    }
    // The list is not sent: the page's table takes it 100 at a time from
    // /problems below (2026-10-02 — it was 667 rows for Arrays, ~80 KB).
    // Only the edge HTML (services/seo.ts) reads it whole.
    const { problems: _whole, ...payload } = page;
    res.json(payload);
  } catch (err) {
    console.error("GET /api/problems/hubs/:kind/:slug error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * One page of a hub's problem list, easy → medium → hard, for the page's
 * problem table — 100 rows at a time as the table itself is scrolled, and
 * the table's search box (`q`, every word in the title or a topic) answered
 * over the whole hub (services/problem-hubs hubProblems). Public and
 * shared-cached like the hub itself.
 *
 *   GET /api/problems/hubs/topic/arrays/problems?offset=100&limit=100&difficulty=hard&q=window
 *     → { problems, total, next }   (next: the following offset, or null)
 */
router.get("/hubs/:kind/:slug/problems", browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (req, res) => {
  const kind = req.params["kind"];
  const slug = String(req.params["slug"]).toLowerCase();
  const offset = Number(req.query["offset"] ?? 0);
  const limit = Number(req.query["limit"] ?? HUB_PAGE_SIZE);
  const level = typeof req.query["difficulty"] === "string" && req.query["difficulty"] ? req.query["difficulty"].toUpperCase() : undefined;
  const q = typeof req.query["q"] === "string" ? req.query["q"].trim() : "";
  if ((kind !== "topic" && kind !== "company") || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug)) {
    res.status(404).json({ error: "No such hub" });
    return;
  }
  if (!Number.isInteger(offset) || offset < 0 || offset > 100_000 || !Number.isInteger(limit) || limit < 1 || limit > HUB_PAGE_SIZE || (level !== undefined && level !== "EASY" && level !== "MEDIUM" && level !== "HARD") || q.length > 80) {
    res.status(400).json({ error: `offset must be a whole number from 0, limit 1–${HUB_PAGE_SIZE}, difficulty easy, medium or hard, and the search at most 80 characters` });
    return;
  }
  const page = await hubProblems(kind, slug, { offset, limit, difficulty: level as "EASY" | "MEDIUM" | "HARD" | undefined, q });
  if (!page) {
    res.status(404).json({ error: "No such hub" });
    return;
  }
  res.json(page);
});

/**
 * The signed-in reader's standing on one hub — which of its problems they
 * have solved or tried, by slug — for the page's progress line, its plan's
 * ticks and the list's. Kept off the hub payload above, which is public and
 * shared-cached; this one is per account and never cached by a browser
 * (a solve must show on the next visit).
 *
 *   GET /api/problems/hubs/topic/arrays/progress → { solved: [slug], attempted: [slug] }
 */
router.get("/hubs/:kind/:slug/progress", requireAuth, async (req, res) => {
  const kind = req.params["kind"];
  const slug = String(req.params["slug"]).toLowerCase();
  if ((kind !== "topic" && kind !== "company") || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug)) {
    res.status(404).json({ error: "No such hub" });
    return;
  }
  const progress = await hubProgress(kind, slug, req.user!.userId);
  if (!progress) {
    res.status(404).json({ error: "No such hub" });
    return;
  }
  res.setHeader("Cache-Control", "private, no-store");
  res.json(progress);
});

// 2. GET /api/problems/[slug] — Problem detail
router.get("/:slug", optionalAuth, browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (req, res) => {
  try {
    const { slug } = req.params;
    // Nothing below depends on who is asking — the draft, the timer and the
    // submissions each have their own endpoint — so one cached copy serves
    // every reader.
    const payload = await cachedShared(problemKey(String(slug)), 600, async () => {
      const problem = await prisma.problem.findUnique({
        where: { slug: String(slug) },
        select: PROBLEM_DETAIL_SELECT,
      });

      if (!problem || !problem.isPublished) return null;

      // Where the reader goes next, and where this problem sits: the hubs
      // its tags link to and six problems of the same topic (in-memory,
      // services/problem-hubs). Cached with the statement, so a visit costs
      // the same one round trip it did.
      const tags = Array.isArray(problem.tags) ? (problem.tags as string[]) : [];
      const [related, hubs, neighbours] = await Promise.all([
        relatedProblems(problem.slug, tags, problem.difficulty),
        hubsForTags(tags),
        // Previous (newer) and next (older) in the catalogue. This was two
        // findFirst round trips in a wave of their own, for an answer the
        // process already holds: the cached catalogue is exactly the
        // published problems in createdAt-desc order, so the neighbours are
        // the entries either side of this one. A slug the catalogue has not
        // picked up yet (it refreshes every 120s, so a just-published
        // problem) still asks the database, the way it always did.
        catalogueNeighbours(problem.slug),
      ]);

      // The editorial is read only for its idea — the meta description's
      // lead — and never ships here (it has its own endpoint, /:slug/editorial).
      const { numbering, editorial, ...statement } = problem;
      const seoText = await problemSeoText({ title: problem.title, difficulty: problem.difficulty, description: problem.description, editorial, tags }, hubs);
      return {
        ...statement,
        // The page's lead sentence and meta description, the edge's words
        // exactly (services/seo.ts problemSeoText, lib/problem-intro).
        intro: seoText.intro,
        seoDescription: seoText.description,
        // "1. Two Sum" (lib/problem-numbers); null only until the next numbering pass.
        number: numbering?.number ?? null,
        prevSlug: neighbours.prevSlug,
        nextSlug: neighbours.nextSlug,
        // The topic tags alone: what the page's structured data lists as
        // what the problem teaches (a company is not a topic).
        topics: tags.filter((t) => !isCompanyTag(t)),
        related,
        hubs,
        // The roadmap tutorials for its topics ("Learn the technique").
        lessons: await lessonsForTopics(hubs.topics.map((t) => t.slug)),
        // The address the page's canonical names: its own, or the first copy
        // of a problem the catalogue carries twice (lib/problem-canonical).
        canonicalSlug: problemCanonicalSlug(problem.slug),
      };
    });

    if (!payload) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    // ?lean=1 (the web workbench and the duel room): the statement without
    // what the page may never show. The hints come from /:slug/hints when
    // their tab opens, and of the thirteen starter stubs only JavaScript's —
    // the editor's first language — ships; another language's arrives from
    // /:slug/starter/:lang when it is picked. Both were a large share of
    // every problem's payload, and in a duel the hints were in the network
    // panel of a room that hides them. Without the flag the answer is
    // unchanged: the Android app reads the full payload.
    if (first(req.query["lean"]) === "1") {
      const { hints: _hints, starterCode, ...rest } = payload;
      const stubs = (starterCode ?? {}) as Record<string, unknown>;
      res.json({
        ...rest,
        starterCode: typeof stubs["javascript"] === "string" ? { javascript: stubs["javascript"] } : {},
        starterLanguages: Object.keys(stubs).filter((k) => typeof stubs[k] === "string"),
      });
      return;
    }

    res.json(payload);
  } catch (err) {
    console.error("GET /api/problems/:slug error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2a. GET /api/problems/[slug]/starter/[lang] — One language's starter stub
//     The lean payload carries JavaScript's alone; the editor asks for the
//     rest when a language is picked. All thirteen are cached as one entry
//     (a few KB); each language is its own browser-cacheable URL.
router.get("/:slug/starter/:lang", browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (req, res) => {
  try {
    const slug = String(req.params.slug);
    const lang = String(req.params.lang);
    const stubs = await cachedShared(starterKey(slug), 600, async () => {
      const row = await prisma.problem.findUnique({ where: { slug }, select: { isPublished: true, starterCode: true } });
      return row && row.isPublished ? (row.starterCode ?? {}) : null;
    });
    if (stubs == null) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }
    const code = (stubs as Record<string, unknown>)[lang];
    // A language without a stub is an empty buffer, not an error: the
    // picker lists every language and the editor shows what there is.
    res.json({ language: lang, code: typeof code === "string" ? code : "" });
  } catch (err) {
    console.error("GET /api/problems/:slug/starter/:lang error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2a. GET /api/problems/[slug]/hints — The hints, when their tab opens
router.get("/:slug/hints", optionalAuth, browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (req, res) => {
  try {
    const slug = String(req.params.slug);
    const hints = await cachedShared(hintsKey(slug), 600, async () => {
      const row = await prisma.problem.findUnique({ where: { slug }, select: { isPublished: true, hints: true } });
      return row && row.isPublished ? (Array.isArray(row.hints) ? row.hints : []) : null;
    });
    if (hints == null) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }
    res.json({ hints });
  } catch (err) {
    console.error("GET /api/problems/:slug/hints error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2b. GET /api/problems/[slug]/editorial — The walkthrough and reference solutions
//     Loaded by the workspace when the Editorial tab opens, not with the statement.
router.get("/:slug/editorial", optionalAuth, browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (req, res) => {
  try {
    const { slug } = req.params;
    const payload = await cachedShared(editorialKey(String(slug)), 600, async () => {
      const problem = await prisma.problem.findUnique({
        where: { slug: String(slug) },
        select: { isPublished: true, editorial: true, solutions: true },
      });
      if (!problem || !problem.isPublished) return null;
      return { editorial: problem.editorial, solutions: problem.solutions };
    });

    if (!payload) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    res.json(payload);
  } catch (err) {
    console.error("GET /api/problems/:slug/editorial error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2c. POST /api/problems/[slug]/engagement { event: "open" | "hints" | "editorial" }
//     The workbench's note that the problem, its hints or its editorial were
//     shown to a member — the skill profile's evidence of help used before a
//     solve (services/skill-profile.ts). The two reads above stay shared and
//     browser-cached for everyone, which is why this is its own write rather
//     than something they record; first times only, so repeats are no-ops.
router.post("/:slug/engagement", requireAuth, async (req, res) => {
  const event = (req.body as { event?: unknown } | undefined)?.event;
  if (typeof event !== "string" || !ENGAGEMENT_EVENTS.has(event)) {
    res.status(400).json({ error: "event must be open, hints or editorial" });
    return;
  }
  const problemId = await problemIdBySlug(String(req.params.slug));
  if (!problemId) {
    res.status(404).json({ error: "Problem not found" });
    return;
  }
  await recordEngagement(req.user!.userId, problemId, event as EngagementEvent);
  res.status(204).end();
});

// 3. POST /api/problems — Create new problem (Admin)
router.post("/", requireAuth, adminOnly, async (req, res) => {
  try {
    const { title, description, difficulty, tags, timeLimitMs, memoryLimitMb, editorial, starterCode } = req.body;

    const slug = slugify.default(title, { lower: true, strict: true });

    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        difficulty,
        tags,
        timeLimitMs,
        memoryLimitMb,
        editorial,
        starterCode,
        slug,
        isPublished: true,
      },
    });

    // Its number, before the caches drop, so the catalogue the next reader
    // builds already has it. A failure leaves it for the next API boot.
    await assignProblemNumbers().catch((err) => console.error("[problems] numbering after create failed:", err));
    // A new published problem joins the catalogue, the pools and the sitemap.
    invalidateProblem(problem.slug, problem.id);
    res.status(201).json(problem);
  } catch (err) {
    console.error("POST /api/problems error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 4. PUT /api/problems/[slug] — Update problem (Admin)
router.put("/:slug", requireAuth, adminOnly, async (req, res) => {
  try {
    const { slug } = req.params;
    const updateData = req.body;

    delete updateData.id;
    delete updateData.createdAt;

    const problem = await prisma.problem.update({
      where: { slug: String(slug) },
      data: updateData,
    });

    invalidateProblem(String(slug), problem.id);
    if (problem.slug !== String(slug)) invalidateProblem(problem.slug, problem.id);

    res.json(problem);
  } catch (err) {
    console.error("PUT /api/problems/:slug error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 5. DELETE /api/problems/[slug] — Soft delete (Admin)
router.delete("/:slug", requireAuth, adminOnly, async (req, res) => {
  try {
    const { slug } = req.params;
    const retired = await prisma.problem.update({
      where: { slug: String(slug) },
      data: { isPublished: false },
      select: { id: true },
    });
    invalidateProblem(String(slug), retired.id);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/problems/:slug error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 6. POST /api/problems/[slug]/test-cases — Add test case (Admin)
router.post("/:slug/test-cases", requireAuth, adminOnly, async (req, res) => {
  try {
    const { slug } = req.params;
    const { input, expectedOutput, isHidden, orderIndex } = req.body;

    const problem = await prisma.problem.findUnique({ where: { slug: String(slug) }, select: { id: true } });
    if (!problem) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    const testCase = await prisma.testCase.create({
      data: {
        problemId: problem.id,
        input,
        expectedOutput,
        isHidden: isHidden ?? false,
        orderIndex,
      },
    });

    invalidateProblem(String(slug), problem.id);
    res.status(201).json(testCase);
  } catch (err) {
    console.error("POST /api/problems/:slug/test-cases error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 7. DELETE /api/problems/[slug]/test-cases/[testCaseId] — Delete test case (Admin)
router.delete("/:slug/test-cases/:testCaseId", requireAuth, adminOnly, async (req, res) => {
  try {
    const { slug, testCaseId } = req.params;
    const removed = await prisma.testCase.delete({ where: { id: testCaseId as string }, select: { problemId: true } });
    invalidateProblem(String(slug), removed.problemId);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE test case error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});



// 9. GET /api/problems/:slug/draft — Get user's saved draft for a problem
router.get("/:slug/draft", requireAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const language = req.query.language;
    const userId = req.user!.userId;
    // A missing language reached the compound unique as `undefined` and 500ed.
    if (!isJudgeLanguage(language)) {
      res.status(400).json({ error: "Unsupported language" });
      return;
    }

    // The slug resolves from the in-memory catalogue (services/dashboard.ts),
    // so the only round trip here is the draft itself.
    const problemId = await problemIdBySlug(String(slug));
    if (!problemId) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    const draft = await prisma.codeDraft.findUnique({
      where: {
        userId_problemId_language: {
          userId,
          problemId,
          language: language,
        },
      },
    });

    res.json(draft || { code: null });
  } catch (err) {
    console.error("GET draft error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 10. POST /api/problems/:problemId/draft — Save/Auto-save code draft
/**
 * Draft rows this process has already written, by (user, problem, language).
 *
 * Only ever an optimisation: a hit lets the autosave be a plain update
 * instead of an upsert, and a miss or a stale entry falls back to the upsert
 * that was always there. Bounded so a long-running process cannot grow one
 * entry per editor anyone has ever opened.
 */
const draftIds = new Map<string, string>();
const MAX_DRAFT_IDS = 20_000;

function rememberDraft(key: string, id: string): void {
  if (draftIds.size >= MAX_DRAFT_IDS) draftIds.clear();
  draftIds.set(key, id);
}

router.post("/:problemId/draft", requireAuth, async (req, res) => {
  try {
    const problemId = req.params.problemId as string;
    const { code, language } = req.body as { code?: unknown; language?: unknown };
    const userId = req.user!.userId;

    // Shape first: a non-string reached Prisma and 500ed, and an unknown
    // problem id hit the foreign key the same way.
    if (typeof code !== "string" || code.length > 65_536) {
      res.status(400).json({ error: "Draft code must be a string of at most 64 KB" });
      return;
    }
    if (!isJudgeLanguage(language)) {
      res.status(400).json({ error: "Unsupported language" });
      return;
    }
    if (!(await publishedProblemExists(problemId))) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    // The autosave fires every few seconds while someone types, and the row
    // used to come back whole — the 64 KB of code the client had just sent,
    // echoed on every save. Neither client reads anything off this answer
    // but success, so it carries the row's identity and nothing more.
    //
    // Prisma's upsert is four statements on MySQL (measured: a transaction
    // around a select and a write), where a plain update is two. Every save
    // after the first is an update — the row is created once and written to
    // for the rest of the session — so the id of a row we have already
    // written is remembered and the common case takes the cheap path. A miss,
    // or a row deleted underneath us, falls back to the upsert, so the answer
    // is the same either way.
    const draftKey = `${userId}:${problemId}:${language}`;
    const knownId = draftIds.get(draftKey);
    const updatedAt = new Date();

    if (knownId) {
      const { count } = await prisma.codeDraft.updateMany({
        where: { userId, problemId, language },
        data: { code, updatedAt },
      });
      if (count > 0) {
        res.json({ id: knownId, updatedAt });
        return;
      }
      draftIds.delete(draftKey);
    }

    const draft = await prisma.codeDraft.upsert({
      where: {
        userId_problemId_language: {
          userId,
          problemId,
          language,
        },
      },
      update: {
        code,
        updatedAt,
      },
      create: {
        userId,
        problemId,
        language,
        code,
      },
      select: { id: true, updatedAt: true },
    });
    rememberDraft(draftKey, draft.id);
    // The dashboard's "continue solving" card is the newest draft. Only this
    // path can change which problem that is — the first save on a problem this
    // session; the autosaves that follow every few seconds take the update
    // above and leave the card where it is — so the 300 s aggregate is
    // dropped here rather than on every keystroke batch.
    invalidateDashboard(userId);

    res.json(draft);
  } catch (err) {
    console.error("POST draft error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 11. GET /api/problems/:slug/timer — Get persistent stopwatch state
router.get("/:slug/timer", requireAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user!.userId;

    const problemId = await problemIdBySlug(String(slug));
    if (!problemId) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    // The timer is the one per-user read the workspace makes for every
    // problem on load, so the header's "solved in a tournament" chip rides on
    // it instead of costing a request of its own — and so does whether this is
    // today's contest problem: the workspace used to ask `/api/contests/daily`
    // (board, standing, streak — four queries) on every problem just to compare
    // ids, and now asks only when this says yes. `ensureContest` is an L1 hit.
    // A failed lookup leaves the key out, and the client then asks as before.
    const [timer, tournamentSolve, contest] = await Promise.all([
      prisma.problemTimer.findUnique({
        where: {
          userId_problemId: {
            userId,
            problemId,
          },
        },
      }),
      tournamentSolveFor(userId, problemId),
      ensureContest(todayUtc()).catch(() => undefined),
    ]);
    const dailyContest = contest === undefined ? undefined : contest?.problemId === problemId;

    if (!timer) {
      res.json({ elapsedSeconds: 0, isRunning: false, tournamentSolve, dailyContest });
      return;
    }

    res.json({
      elapsedSeconds: timer.elapsedSeconds,
      isRunning: timer.isRunning,
      lastStartedAt: timer.lastStartedAt,
      tournamentSolve,
      dailyContest,
    });
  } catch (err) {
    console.error("GET timer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 12. POST /api/problems/:slug/timer — Sync stopwatch state
router.post("/:slug/timer", requireAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const { action } = req.body ?? {};
    const userId = req.user!.userId;

    if (!["start", "pause", "end", "reset"].includes(action)) {
      res.status(400).json({ error: "Unknown timer action" });
      return;
    }
    // A whole number of seconds within a week; a string or a negative value
    // used to reach the integer column and 500.
    const raw = Number(req.body?.elapsedSeconds);
    const elapsedSeconds = Number.isFinite(raw) ? Math.min(7 * 24 * 3600, Math.max(0, Math.round(raw))) : 0;

    const problemId = await problemIdBySlug(String(slug));
    if (!problemId) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    let updateData: any = {};

    if (action === "start") {
      updateData = {
        isRunning: true,
        lastStartedAt: new Date(),
        // We sync the elapsed seconds from client just in case
        elapsedSeconds,
      };
    } else if (action === "pause" || action === "end") {
      updateData = {
        isRunning: false,
        lastStartedAt: null,
        elapsedSeconds,
      };
    } else if (action === "reset") {
      updateData = {
        isRunning: false,
        lastStartedAt: null,
        elapsedSeconds: 0,
      };
    }

    const timer = await prisma.problemTimer.upsert({
      where: {
        userId_problemId: {
          userId,
          problemId,
        },
      },
      update: updateData,
      create: {
        userId,
        problemId,
        ...updateData,
      },
    });

    res.json(timer);
  } catch (err) {
    console.error("POST timer error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** The most recent attempts a reader can page back through on one problem. */
const SUBMISSION_HISTORY_TAKE = 50;

// 13. GET /api/problems/:slug/submissions — Get user's submission history for a problem
router.get("/:slug/submissions", requireAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user!.userId;

    const problemId = await problemIdBySlug(String(slug));
    if (!problemId) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    // Rows, not sources. The Submissions tab is a table of verdicts, and the
    // read-only editor opens one attempt at a time — which GET
    // /api/me/submissions/:id serves, the way the dashboard's history rows
    // have always fetched theirs. `code` is a MediumText, so shipping it on
    // every row meant the whole tab cost every attempt ever made on the
    // problem: measured locally at 20,085 B for 45 rows of short test
    // solutions against 8,606 B for the same rows without it (-57%), and a
    // real solution is several times the size of those.
    //
    // The slice is the union of what the two clients read: the web table
    // (verdict, language, runtimeMs, memoryKb, submittedAt) and the mobile
    // list (verdict, passedCases, totalCases, submittedAt).
    const submissions = await prisma.submission.findMany({
      where: {
        userId,
        problemId,
      },
      select: {
        id: true,
        verdict: true,
        language: true,
        runtimeMs: true,
        memoryKb: true,
        passedCases: true,
        totalCases: true,
        submittedAt: true,
      },
      orderBy: { submittedAt: "desc" },
      take: SUBMISSION_HISTORY_TAKE,
    });

    res.json(submissions);
  } catch (err) {
    console.error("GET submissions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

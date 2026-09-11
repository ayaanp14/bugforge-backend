import { Router } from "express";
import slugify from "slugify";
import { prisma } from "../lib/prisma.js";
import { requireAuth, optionalAuth, adminOnly } from "../middleware/auth.js";
import { cachedShared, invalidate } from "../lib/cache.js";
import { browserCache } from "../lib/http-cache.js";
import { getCatalogue, listProblemsWithStatus, loadProblemState, type ProblemState } from "../services/dashboard.js";
import { COMPANY_TAGS } from "../lib/companies.js";

const router = Router();

/**
 * A published problem statement is the same bytes for everyone and changes
 * only when an admin edits it, so the whole composed payload is cached rather
 * than any one query inside it. That is the shape the shared tier is for: one
 * round trip instead of three (the problem with its visible cases, then the
 * neighbour on either side).
 */
const problemKey = (slug: string) => `problem:v1:${slug}`;

/**
 * The editorial and its per-language solutions live under their own key. They
 * are the two largest columns on the row — a MediumText walkthrough and a Json
 * of thirteen reference programs — and the workspace only reads them when the
 * Editorial tab is opened, so they are fetched (and cached) on demand rather
 * than shipped with every statement.
 */
const editorialKey = (slug: string) => `problem:editorial:v1:${slug}`;

/** After any admin write, so the next reader sees the edit rather than the TTL. */
function invalidateProblem(slug: string): void {
  invalidate(problemKey(slug));
  invalidate(editorialKey(slug));
  // The catalogue carries titles, tags and difficulty, all of which an edit can
  // move, and publishing or retiring a problem changes its membership outright.
  invalidate("catalogue:published");
}

/** Rows per list page, and the most a caller may ask for at once. */
const MAX_TAKE = 100;

/** The columns a list row carries — the same slice the cached catalogue holds. */
const LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  difficulty: true,
  tags: true,
  createdAt: true,
  timeLimitMs: true,
} as const;

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
  starterCode: true,
  signature: true,
  hints: true,
  testCases: {
    where: { isHidden: false },
    select: { id: true, input: true, expectedOutput: true, orderIndex: true },
    orderBy: { orderIndex: "asc" },
  },
} as const;

const statusOf = (state: ProblemState | null, id: string) =>
  state === null ? "UNSOLVED" : state.solved.has(id) ? "SOLVED" : state.attempted.has(id) ? "ATTEMPTING" : "UNSOLVED";

// 1. GET /api/problems — List all published problems with pagination and filtering
router.get("/", optionalAuth, browserCache(60), async (req, res) => {
  try {
    const { difficulty, tag, company, search, status, skip, take, sortBy, maxTime } = req.query;
    const skipNum = Math.max(0, parseInt(String(skip ?? "0")) || 0);
    // Clamped: without a ceiling one request could ask for the whole catalogue.
    const takeNum = Math.min(MAX_TAKE, Math.max(1, parseInt(String(take ?? "")) || MAX_TAKE));
    const userId = req.user?.userId ?? null;

    // The status filter only means something for a signed-in reader; anyone
    // else gets the unfiltered list, which is what they always got.
    const statusFilter = userId && (status === "solved" || status === "unsolved") ? status : null;

    // The plain first page — no filter, newest first — is the same slice of the
    // catalogue for everyone, and that catalogue is already held in memory for
    // the dashboard. Serve it from there: one parallel tier (the two solve-state
    // GROUP BYs) for a signed-in reader, no round trip at all for a visitor.
    const isDefaultSort = !sortBy || sortBy === "newest";
    const isPlainFirstPage =
      isDefaultSort && skipNum === 0 && !difficulty && !tag && !company && !search && !maxTime && !statusFilter;
    if (isPlainFirstPage) {
      const result = userId
        ? await listProblemsWithStatus(userId, takeNum)
        : (await getCatalogue()).slice(0, takeNum).map((p) => ({ ...p, status: "UNSOLVED" }));
      res.json(result);
      return;
    }

    const where: any = {
      isPublished: true,
    };

    if (difficulty) where.difficulty = { equals: difficulty as string }; // MySQL CI collation handles case
    if (tag) {
      const tags = Array.isArray(tag) ? (tag as string[]) : [tag as string];
      // tags is a Json array on MySQL — require every selected tag
      // (replaces the Postgres-only scalar-list hasEvery filter).
      where.AND = [
        ...(where.AND ?? []),
        ...tags.map((t: string) => ({ tags: { array_contains: [t] } })),
      ];
    }
    // A company is just another entry in the same tags array; it gets its own
    // parameter so the catalogue page's company chips read as what they are.
    if (typeof company === "string" && company) {
      where.AND = [...(where.AND ?? []), { tags: { array_contains: [company] } }];
    }
    if (maxTime) where.timeLimitMs = { lte: parseInt(maxTime as string) };
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    // Solved / unsolved as a relation filter inside the same query, rather than
    // loading every accepted submission the user ever made to build an id list.
    if (statusFilter === "solved") {
      where.submissions = { some: { userId, verdict: "ACCEPTED" } };
    } else if (statusFilter === "unsolved") {
      where.submissions = { none: { userId, verdict: "ACCEPTED" } };
    }

    // Determine Sort Order
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "oldest") orderBy = { createdAt: "asc" };
    else if (sortBy === "title-asc") orderBy = { title: "asc" };
    else if (sortBy === "title-desc") orderBy = { title: "desc" };

    // The reader's solve state is two GROUP BYs over their own submissions —
    // one row per problem touched, index-only — and it does not depend on which
    // page comes back, so it overlaps the page query instead of following it.
    // Previously this was a third round trip that fetched every submission row
    // for the page's problems.
    const statePromise: Promise<ProblemState | null> = userId ? loadProblemState(userId) : Promise.resolve(null);

    let problems;
    let state: ProblemState | null;

    if (sortBy === "shuffled") {
      // 1. Fetch all published IDs matching filters
      const [matchingProblems, loaded] = await Promise.all([
        prisma.problem.findMany({
          where,
          select: { id: true },
        }),
        statePromise,
      ]);
      state = loaded;

      // 2. Shuffle IDs deterministically. The client sends one `seed` for a
      //    whole browsing session, so every page slices the SAME order —
      //    without this, each request reshuffles and infinite scroll returns
      //    duplicate/missing rows. Falls back to a random seed when absent.
      const seedStr = String(req.query.seed ?? "");
      let h = 2166136261 >>> 0;
      for (let i = 0; i < seedStr.length; i++) {
        h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
      }
      if (!seedStr) h = (Math.random() * 4294967296) >>> 0;
      const rand = () => {
        h = (h + 0x6d2b79f5) | 0;
        let t = Math.imul(h ^ (h >>> 15), 1 | h);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      const shuffledIds = matchingProblems.map(p => p.id);
      for (let i = shuffledIds.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const tmp = shuffledIds[i];
        shuffledIds[i] = shuffledIds[j];
        shuffledIds[j] = tmp;
      }

      // 3. Take the subset for current page
      const pageIds = shuffledIds.slice(skipNum, skipNum + takeNum);

      // 4. Fetch full data for these IDs (maintain shuffled order)
      const data = await prisma.problem.findMany({
        where: { id: { in: pageIds } },
        select: LIST_SELECT,
      });

      // Mapping objects back to shuffled order
      problems = pageIds.map(id => data.find(p => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
    } else {
      [problems, state] = await Promise.all([
        prisma.problem.findMany({
          where,
          select: LIST_SELECT,
          orderBy,
          skip: skipNum,
          take: takeNum,
        }),
        statePromise,
      ]);
    }

    const result = problems.map((p) => ({
      ...p,
      status: statusOf(state, p.id),
    }));

    res.json(result);
  } catch (err) {
    console.error("GET /api/problems error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/problems/companies — every hiring company in the catalogue with how
 * many published problems carry its tag, most-asked first. Counted over the
 * in-memory catalogue (already held for the dashboard), so no round trip.
 * Declared before /:slug so the path is not read as a problem slug.
 */
router.get("/companies", browserCache(300, { shared: true }), async (_req, res) => {
  try {
    const catalogue = await getCatalogue();
    const counts = new Map<string, number>();
    for (const row of catalogue) {
      const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];
      for (const t of tags) if (COMPANY_TAGS.includes(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    const companies = [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    res.json(companies);
  } catch (err) {
    console.error("GET /api/problems/companies error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. GET /api/problems/[slug] — Problem detail
router.get("/:slug", optionalAuth, browserCache(120, { shared: true }), async (req, res) => {
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

      // Previous (newer) and next (older) in the catalogue.
      const [prevProblem, nextProblem] = await Promise.all([
        prisma.problem.findFirst({
          where: { isPublished: true, createdAt: { gt: problem.createdAt } },
          orderBy: { createdAt: "asc" },
          select: { slug: true },
        }),
        prisma.problem.findFirst({
          where: { isPublished: true, createdAt: { lt: problem.createdAt } },
          orderBy: { createdAt: "desc" },
          select: { slug: true },
        }),
      ]);

      return {
        ...problem,
        prevSlug: prevProblem?.slug || null,
        nextSlug: nextProblem?.slug || null,
      };
    });

    if (!payload) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    res.json(payload);
  } catch (err) {
    console.error("GET /api/problems/:slug error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2b. GET /api/problems/[slug]/editorial — The walkthrough and reference solutions
//     Loaded by the workspace when the Editorial tab opens, not with the statement.
router.get("/:slug/editorial", optionalAuth, browserCache(300, { shared: true }), async (req, res) => {
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

    invalidateProblem(String(slug));
    if (problem.slug !== String(slug)) invalidateProblem(problem.slug);

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
    await prisma.problem.update({
      where: { slug: String(slug) },
      data: { isPublished: false },
    });
    invalidateProblem(String(slug));
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

    invalidateProblem(String(slug));
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
    await prisma.testCase.delete({ where: { id: testCaseId as string } });
    invalidateProblem(String(slug));
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
    const language = req.query.language as string;
    const userId = req.user!.userId;

    const problem = await prisma.problem.findUnique({ where: { slug: String(slug) }, select: { id: true } });
    if (!problem) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    const draft = await prisma.codeDraft.findUnique({
      where: {
        userId_problemId_language: {
          userId,
          problemId: problem.id,
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
router.post("/:problemId/draft", requireAuth, async (req, res) => {
  try {
    const problemId = req.params.problemId as string;
    const { code, language } = req.body as { code: string; language: string };
    const userId = req.user!.userId;

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
        updatedAt: new Date(),
      },
      create: {
        userId,
        problemId,
        language,
        code,
      },
    });

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

    const problem = await prisma.problem.findUnique({ where: { slug: String(slug) }, select: { id: true } });
    if (!problem) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    const timer = await prisma.problemTimer.findUnique({
      where: {
        userId_problemId: {
          userId,
          problemId: problem.id,
        },
      },
    });

    if (!timer) {
      res.json({ elapsedSeconds: 0, isRunning: false });
      return;
    }

    res.json({
      elapsedSeconds: timer.elapsedSeconds,
      isRunning: timer.isRunning,
      lastStartedAt: timer.lastStartedAt,
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
    const { action, elapsedSeconds } = req.body;
    const userId = req.user!.userId;

    const problem = await prisma.problem.findUnique({ where: { slug: String(slug) }, select: { id: true } });
    if (!problem) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    let updateData: any = {};

    if (action === "start") {
      updateData = {
        isRunning: true,
        lastStartedAt: new Date(),
        // We sync the elapsed seconds from client just in case
        elapsedSeconds: elapsedSeconds ?? 0,
      };
    } else if (action === "pause" || action === "end") {
      updateData = {
        isRunning: false,
        lastStartedAt: null,
        elapsedSeconds: elapsedSeconds,
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
          problemId: problem.id,
        },
      },
      update: updateData,
      create: {
        userId,
        problemId: problem.id,
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

    const problem = await prisma.problem.findUnique({ where: { slug: String(slug) }, select: { id: true } });
    if (!problem) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    // `code` stays: the Submissions tab opens a selected attempt in a read-only
    // editor. What is bounded is the count — without a ceiling a determined
    // solver's every attempt, each a MediumText, came back on every tab open.
    const submissions = await prisma.submission.findMany({
      where: {
        userId,
        problemId: problem.id,
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

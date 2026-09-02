import { Router } from "express";
import slugify from "slugify";
import { prisma } from "../lib/prisma.js";
import { requireAuth, optionalAuth, adminOnly } from "../middleware/auth.js";

const router = Router();

// 1. GET /api/problems — List all published problems with pagination and filtering
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { difficulty, tag, search, status, skip, take, sortBy, maxTime } = req.query;
    const skipNum = skip ? parseInt(skip as string) : 0;
    const takeNum = take ? parseInt(take as string) : 100;

    const where: any = {
      isPublished: true,
    };

    if (difficulty) where.difficulty = { equals: difficulty as string, mode: "insensitive" };
    if (tag) {
      const tags = Array.isArray(tag) ? (tag as string[]) : [tag as string];
      where.tags = { hasEvery: tags };
    }
    if (maxTime) where.timeLimitMs = { lte: parseInt(maxTime as string) };
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { description: { contains: search as string, mode: "insensitive" } },
      ];
    }

    // Handle Status Filtering (Solved/Unsolved)
    if (req.user && (status === "solved" || status === "unsolved")) {
      const solvedSubmissions = await prisma.submission.findMany({
        where: {
          userId: req.user.userId,
          verdict: "ACCEPTED",
        },
        select: { problemId: true },
      });
      const solvedIds = solvedSubmissions.map(s => s.problemId);

      if (status === "solved") {
        where.id = { in: solvedIds };
      } else {
        where.id = { notIn: solvedIds };
      }
    }

    // Determine Sort Order
    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "oldest") orderBy = { createdAt: "asc" };
    else if (sortBy === "title-asc") orderBy = { title: "asc" };
    else if (sortBy === "title-desc") orderBy = { title: "desc" };

    let problems;

    if (sortBy === "shuffled") {
      // 1. Fetch all published IDs matching filters
      const matchingProblems = await prisma.problem.findMany({
        where,
        select: { id: true },
      });

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
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          tags: true,
          createdAt: true,
          timeLimitMs: true,
        },
      });

      // Mapping objects back to shuffled order
      problems = pageIds.map(id => data.find(p => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);
    } else {
      problems = await prisma.problem.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          tags: true,
          createdAt: true,
          timeLimitMs: true,
        },
        orderBy,
        skip: skipNum,
        take: takeNum,
      });
    }

    // Determine solved status for the current response set
    let statusMap: Record<string, string> = {}; // problemId -> "SOLVED" | "ATTEMPTING"
    if (req.user) {
      const submissions = await prisma.submission.findMany({
        where: {
          userId: req.user.userId,
          problemId: { in: problems.map((p: any) => p.id) }
        },
        select: { problemId: true, verdict: true },
      });

      submissions.forEach(sub => {
        const current = statusMap[sub.problemId];
        if (sub.verdict === "ACCEPTED") {
          statusMap[sub.problemId] = "SOLVED";
        } else if (current !== "SOLVED") {
          statusMap[sub.problemId] = "ATTEMPTING";
        }
      });
    }

    const result = problems.map((p) => ({
      ...p,
      status: statusMap[p.id] || "UNSOLVED",
    }));

    res.json(result);
  } catch (err) {
    console.error("GET /api/problems error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. GET /api/problems/[slug] — Problem detail
router.get("/:slug", optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const problem = await prisma.problem.findUnique({
      where: { slug: String(slug) },
      include: {
        testCases: {
          where: { isHidden: false },
          select: { id: true, input: true, expectedOutput: true, orderIndex: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!problem || !problem.isPublished) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    // Find Previous (Newer) and Next (Older) problem slugs
    const prevProblem = await prisma.problem.findFirst({
      where: {
        isPublished: true,
        createdAt: { gt: problem.createdAt }
      },
      orderBy: { createdAt: "asc" },
      select: { slug: true }
    });

    const nextProblem = await prisma.problem.findFirst({
      where: {
        isPublished: true,
        createdAt: { lt: problem.createdAt }
      },
      orderBy: { createdAt: "desc" },
      select: { slug: true }
    });

    res.json({
      ...problem,
      prevSlug: prevProblem?.slug || null,
      nextSlug: nextProblem?.slug || null,
    });
  } catch (err) {
    console.error("GET /api/problems/:slug error:", err);
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

    res.status(201).json(testCase);
  } catch (err) {
    console.error("POST /api/problems/:slug/test-cases error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 7. DELETE /api/problems/[slug]/test-cases/[testCaseId] — Delete test case (Admin)
router.delete("/:slug/test-cases/:testCaseId", requireAuth, adminOnly, async (req, res) => {
  try {
    const { testCaseId } = req.params;
    await prisma.testCase.delete({ where: { id: testCaseId as string } });
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

    const submissions = await prisma.submission.findMany({
      where: {
        userId,
        problemId: problem.id,
      },
      orderBy: { submittedAt: "desc" },
    });

    res.json(submissions);
  } catch (err) {
    console.error("GET submissions error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

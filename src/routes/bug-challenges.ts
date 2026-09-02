import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { judgeBugProject, type BugFile } from "../lib/bug-judge.js";

const router = Router();

const BUG_XP = 50;

// GET /api/bug-challenges — List all published bug hunts
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { difficulty, category } = req.query;

    const where: any = {
      isPublished: true,
    };

    if (difficulty) where.difficulty = difficulty as string;
    if (category) where.category = category as string;

    const challenges = await prisma.bugChallenge.findMany({
      where,
      select: {
        id: true,
        title: true,
        difficulty: true,
        category: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Solved markers for the signed-in hunter
    let solvedIds = new Set<string>();
    if (req.user) {
      const solved = await prisma.bugSubmission.findMany({
        where: { userId: req.user.userId, verdict: "ACCEPTED" },
        select: { challengeId: true },
      });
      solvedIds = new Set(solved.map((s) => s.challengeId));
    }

    res.json(challenges.map((c) => ({ ...c, solved: solvedIds.has(c.id) })));
  } catch (err) {
    console.error("GET /api/bug-challenges error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/bug-challenges/:id — Full challenge: files, report, visible tests
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const challenge = await prisma.bugChallenge.findUnique({
      where: { id: String(req.params.id) },
      include: {
        files: { select: { id: true, filePath: true, content: true, isEditable: true, language: true } },
        tests: { where: { isHidden: false }, select: { id: true, name: true } },
      },
    });

    if (!challenge || !challenge.isPublished) {
      res.status(404).json({ error: "Challenge not found" });
      return;
    }

    const hiddenCount = await prisma.challengeTest.count({
      where: { challengeId: challenge.id, isHidden: true },
    });

    // Personal history + solved marker for the signed-in hunter
    let submissions: Array<{ id: string; verdict: string; passedTests: number; totalTests: number; timeTakenSecs: number | null; submittedAt: Date }> = [];
    let solved = false;
    if (req.user) {
      submissions = await prisma.bugSubmission.findMany({
        where: { userId: req.user.userId, challengeId: challenge.id },
        select: { id: true, verdict: true, passedTests: true, totalTests: true, timeTakenSecs: true, submittedAt: true },
        orderBy: { submittedAt: "desc" },
        take: 20,
      });
      solved = submissions.some((s) => s.verdict === "ACCEPTED");
    }

    res.json({
      solved,
      submissions,
      id: challenge.id,
      title: challenge.title,
      difficulty: challenge.difficulty,
      category: challenge.category,
      description: challenge.description,
      bugReport: challenge.bugReport,
      logs: challenge.logs,
      files: challenge.files,
      visibleTests: challenge.tests,
      hiddenTestCount: hiddenCount,
      xp: BUG_XP,
    });
  } catch (err) {
    console.error("GET /api/bug-challenges/:id error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** Merge the hunter's edited files over the challenge's originals.
 *  Locked files always come from the DB — client copies are ignored. */
function mergeFiles(
  original: Array<{ filePath: string; content: string; isEditable: boolean }>,
  edited: Record<string, string> | undefined
): BugFile[] {
  return original.map((f) => ({
    filePath: f.filePath,
    content: f.isEditable && edited && typeof edited[f.filePath] === "string" ? edited[f.filePath] : f.content,
  }));
}

// POST /api/bug-challenges/:id/run — Run the VISIBLE tests only
router.post("/:id/run", requireAuth, async (req, res) => {
  try {
    const { editedFiles } = req.body as { editedFiles?: Record<string, string> };

    const challenge = await prisma.bugChallenge.findUnique({
      where: { id: String(req.params.id) },
      include: { files: true, tests: { where: { isHidden: false } } },
    });
    if (!challenge || !challenge.isPublished) {
      res.status(404).json({ error: "Challenge not found" });
      return;
    }
    if (challenge.tests.length === 0) {
      res.status(400).json({ error: "Challenge has no visible tests" });
      return;
    }

    const files = mergeFiles(challenge.files, editedFiles);
    const result = await judgeBugProject(
      files,
      challenge.tests.map((t) => ({ name: t.name, source: t.runCommand }))
    );

    res.json(result);
  } catch (err) {
    console.error("POST /api/bug-challenges/:id/run error:", err);
    res.status(500).json({ error: "Failed to run tests" });
  }
});

// POST /api/bug-challenges/:id/submit — Run ALL tests (visible + hidden)
router.post("/:id/submit", requireAuth, async (req, res) => {
  try {
    const { editedFiles, timeTakenSecs } = req.body as { editedFiles?: Record<string, string>; timeTakenSecs?: number };
    const userId = req.user!.userId;

    const challenge = await prisma.bugChallenge.findUnique({
      where: { id: String(req.params.id) },
      include: { files: true, tests: true },
    });
    if (!challenge || !challenge.isPublished) {
      res.status(404).json({ error: "Challenge not found" });
      return;
    }

    const files = mergeFiles(challenge.files, editedFiles);
    const result = await judgeBugProject(
      files,
      challenge.tests.map((t) => ({ name: t.name, source: t.runCommand }))
    );

    // Hide hidden-test failure details; reveal only names + pass/fail
    const hiddenNames = new Set(challenge.tests.filter((t) => t.isHidden).map((t) => t.name));
    const publicResults = result.results.map((r) =>
      hiddenNames.has(r.name) ? { ...r, detail: r.passed ? "" : "Hidden test failed" } : r
    );

    const alreadySolved = await prisma.bugSubmission.findFirst({
      where: { userId, challengeId: challenge.id, verdict: "ACCEPTED" },
      select: { id: true },
    });

    await prisma.bugSubmission.create({
      data: {
        userId,
        challengeId: challenge.id,
        editedFiles: editedFiles ?? {},
        verdict: result.verdict,
        passedTests: result.passedTests,
        totalTests: result.totalTests,
        timeTakenSecs: typeof timeTakenSecs === "number" ? Math.max(0, Math.round(timeTakenSecs)) : null,
      },
    });

    let awardedXp = 0;
    if (result.verdict === "ACCEPTED" && !alreadySolved) {
      awardedXp = BUG_XP;
      await prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: BUG_XP }, bugsXp: { increment: BUG_XP } },
      });
      await prisma.userStats.upsert({
        where: { userId },
        update: { bugsFixed: { increment: 1 }, lastActive: new Date() },
        create: { userId, bugsFixed: 1 },
      });
    }

    res.json({ ...result, results: publicResults, awardedXp, firstSolve: result.verdict === "ACCEPTED" && !alreadySolved });
  } catch (err) {
    console.error("POST /api/bug-challenges/:id/submit error:", err);
    res.status(500).json({ error: "Failed to submit fix" });
  }
});

export default router;

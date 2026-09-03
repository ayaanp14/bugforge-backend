import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { judgeBugProject, type BugFile, type BugLanguage } from "../lib/bug-judge.js";

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

    // One parallel batch — sequential round-trips are what make prod slow
    const [challenges, solved] = await Promise.all([
      prisma.bugChallenge.findMany({
        where,
        select: {
          id: true,
          title: true,
          difficulty: true,
          category: true,
          language: true,
          tags: true,
          origin: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      req.user
        ? prisma.bugSubmission.findMany({
            where: { userId: req.user.userId, verdict: "ACCEPTED" },
            select: { challengeId: true },
          })
        : Promise.resolve([]),
    ]);
    const solvedIds = new Set(solved.map((s) => s.challengeId));

    res.json(challenges.map((c) => ({ ...c, solved: solvedIds.has(c.id) })));
  } catch (err) {
    console.error("GET /api/bug-challenges error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/bug-challenges/stats/me — personal analytics for the hunts page
// (declared before /:id so "stats" is never treated as a challenge id)
router.get("/stats/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const [recent, accepted, totalSubmissions] = await Promise.all([
      prisma.bugSubmission.findMany({
        where: { userId },
        orderBy: { submittedAt: "desc" },
        take: 8,
        select: {
          id: true,
          verdict: true,
          passedTests: true,
          totalTests: true,
          submittedAt: true,
          challenge: { select: { id: true, title: true } },
        },
      }),
      // Debugging streak: consecutive UTC days (ending today or yesterday)
      // with at least one ACCEPTED bug fix.
      prisma.bugSubmission.findMany({
        where: { userId, verdict: "ACCEPTED" },
        select: { submittedAt: true },
      }),
      prisma.bugSubmission.count({ where: { userId } }),
    ]);
    const days = new Set(accepted.map((s) => Math.floor(s.submittedAt.getTime() / 86400000)));
    const today = Math.floor(Date.now() / 86400000);
    let streak = 0;
    let cursor = days.has(today) ? today : today - 1;
    while (days.has(cursor)) {
      streak++;
      cursor--;
    }

    res.json({
      streakDays: streak,
      totalSubmissions,
      recent: recent.map((r) => ({
        id: r.id,
        verdict: r.verdict,
        passedTests: r.passedTests,
        totalTests: r.totalTests,
        submittedAt: r.submittedAt,
        challengeId: r.challenge.id,
        challengeTitle: r.challenge.title,
      })),
    });
  } catch (err) {
    console.error("GET /api/bug-challenges/stats/me error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/bug-challenges/:id — Full challenge: files, report, visible tests
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const challengeId = String(req.params.id);

    // One parallel batch instead of three sequential round-trips
    const [challenge, hiddenCount, submissions] = await Promise.all([
      prisma.bugChallenge.findUnique({
        where: { id: challengeId },
        include: {
          files: { select: { id: true, filePath: true, content: true, isEditable: true, language: true } },
          tests: { where: { isHidden: false }, select: { id: true, name: true } },
        },
      }),
      prisma.challengeTest.count({
        where: { challengeId, isHidden: true },
      }),
      // Personal history + solved marker for the signed-in hunter
      req.user
        ? prisma.bugSubmission.findMany({
            where: { userId: req.user.userId, challengeId },
            select: { id: true, verdict: true, passedTests: true, totalTests: true, timeTakenSecs: true, submittedAt: true },
            orderBy: { submittedAt: "desc" },
            take: 20,
          })
        : Promise.resolve([]),
    ]);

    if (!challenge || !challenge.isPublished) {
      res.status(404).json({ error: "Challenge not found" });
      return;
    }

    const solved = submissions.some((s) => s.verdict === "ACCEPTED");

    res.json({
      solved,
      submissions,
      id: challenge.id,
      title: challenge.title,
      difficulty: challenge.difficulty,
      category: challenge.category,
      language: challenge.language,
      tags: challenge.tags,
      origin: challenge.origin,
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
      challenge.tests.map((t) => ({ name: t.name, source: t.runCommand })),
      challenge.language as BugLanguage
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
      challenge.tests.map((t) => ({ name: t.name, source: t.runCommand })),
      challenge.language as BugLanguage
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
        data: {
          xp: { increment: BUG_XP },
          bugsXp: { increment: BUG_XP },
          // Rating climbs with every first fix — powers the tier bar
          rating: { increment: BUG_XP },
        },
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

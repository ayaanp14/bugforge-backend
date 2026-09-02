import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { LANGUAGE_MAP } from "../lib/judge0.js";
// All test cases run in ONE engine execution (1 compile + 1 run) and are
// judged server-side — see src/lib/batch-judge.ts.
import { runBatch } from "../lib/batch-judge.js";
// The editor holds only the solution stub; the language driver (I/O parsing,
// batching, gzip, stats) is wrapped around it here at execution time.
import { applyDriver, type Language as DriverLanguage, type Signature } from "../lib/driver-codegen.js";
import { FIRST_SOLVE, createNotificationOnce, streakMilestone } from "../services/notifications.js";

const router = Router();

interface CustomTestCase {
  input: string;
  expectedOutput?: string;
}

// 9. POST /api/run — Run code against visible test cases
router.post("/run", requireAuth, async (req, res) => {
  console.log(`[POST /api/run] Received request from user ${req.user?.userId}`);
  try {
    const { code, language, problemId, customTestCases } = req.body;

    const languageId = LANGUAGE_MAP[language as string];
    if (!languageId) {
      res.status(400).json({ error: "Unsupported language" });
      return;
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { testCases: { where: { isHidden: false } } },
    }) as any;

    if (!problem) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    const limits = { timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb };
    const finalCustomCases: CustomTestCase[] = (customTestCases || []).map((tc: any) => ({ ...tc }));

    // Generate expected outputs for custom cases from the reference solution
    // (one batched reference execution covers all of them)
    const casesToGen = finalCustomCases.filter((tc: CustomTestCase) => !tc.expectedOutput);
    if (casesToGen.length > 0 && problem.referenceSolution && problem.referenceLanguage && LANGUAGE_MAP[problem.referenceLanguage]) {
      try {
        const ref = await runBatch(
          problem.referenceSolution,
          problem.referenceLanguage,
          casesToGen.map((tc) => ({ input: tc.input, expectedOutput: "" })),
          limits
        );
        ref.perCase.forEach((r, i) => {
          casesToGen[i].expectedOutput = (r.actualOutput || "").trim();
        });
      } catch (err) {
        console.error("Failed to generate expected outputs:", err);
      }
    }

    const allTestCases = [
      ...problem.testCases,
      ...finalCustomCases.map((tc: CustomTestCase, idx: number) => ({
        id: `custom-${idx}`,
        input: tc.input,
        expectedOutput: tc.expectedOutput || "",
        isHidden: false
      }))
    ];

    if (allTestCases.length === 0) {
      res.json({ results: [] });
      return;
    }

    const executedCode = problem.signature
      ? applyDriver(language as DriverLanguage, problem.signature as Signature, code)
      : code;
    const batch = await runBatch(
      executedCode,
      language as string,
      allTestCases.map((tc: any) => ({ input: tc.input, expectedOutput: tc.expectedOutput })),
      limits
    );
    // Per-case timing isn't observable in a single run; report the average.
    const perCaseRuntime = Math.round(batch.runtimeMs / allTestCases.length);

    const results = allTestCases.map((tc: any, i: number) => {
      const r = batch.perCase[i];
      return {
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: r.actualOutput,
        passed: r.passed,
        runtime: perCaseRuntime,
        memory: batch.memoryKb,
        status: r.status,
        stderr: r.stderr,
        compile_output: r.compile_output,
        message: null,
      };
    });

    res.json({ results });
  } catch (err) {
    console.error("POST /api/run error:", err);
    res.status(500).json({ error: "Failed to run code" });
  }
});

// 10. POST /api/submit — Submit code against all test cases
router.post("/submit", requireAuth, async (req, res) => {
  console.log(`[POST /api/submit] Received request from user ${req.user?.userId}`);
  try {
    const { code, language, problemId, customTestCases, roomId } = req.body;
    let userId = req.user!.userId;

    // Handle pairing mode: credits go to host
    if (roomId) {
      const room = await prisma.pairRoom.findUnique({
        where: { id: roomId },
        select: { createdBy: true }
      });
      if (room) {
        userId = room.createdBy;
        console.log(`[POST /api/submit] Pairing mode: Awarding credits to host ${userId}`);
      }
    }

    const languageId = LANGUAGE_MAP[language as string];
    if (!languageId) {
      res.status(400).json({ error: "Unsupported language" });
      return;
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { testCases: true },
    }) as any;

    if (!problem) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    let verdict = "ACCEPTED";
    let passedCases = 0;
    let maxRuntime = 0;
    let maxMemory = 0;

    const limits = { timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb };
    const finalCustomCases: CustomTestCase[] = (customTestCases || []).map((tc: any) => ({ ...tc }));

    // Generate expected outputs for custom cases from the reference solution
    const casesToGen = finalCustomCases.filter((tc: CustomTestCase) => !tc.expectedOutput);
    if (casesToGen.length > 0 && problem.referenceSolution && problem.referenceLanguage && LANGUAGE_MAP[problem.referenceLanguage]) {
      try {
        const ref = await runBatch(
          problem.referenceSolution,
          problem.referenceLanguage,
          casesToGen.map((tc) => ({ input: tc.input, expectedOutput: "" })),
          limits
        );
        ref.perCase.forEach((r, i) => {
          casesToGen[i].expectedOutput = (r.actualOutput || "").trim();
        });
      } catch (err) {
        console.error("Failed to generate expected outputs:", err);
      }
    }

    const allTestCases = [
      ...problem.testCases,
      ...finalCustomCases.map((tc: CustomTestCase, idx: number) => ({
        id: `custom-submit-${idx}`,
        input: tc.input,
        expectedOutput: tc.expectedOutput || "",
        isHidden: true // Treat custom cases as hidden during submit UI
      }))
    ];

    // One batched execution for every test case (1 compile + 1 run)
    const executedCode = problem.signature
      ? applyDriver(language as DriverLanguage, problem.signature as Signature, code)
      : code;
    const batch = await runBatch(
      executedCode,
      language as string,
      allTestCases.map((tc: any) => ({ input: tc.input, expectedOutput: tc.expectedOutput })),
      limits
    );
    maxRuntime = batch.runtimeMs;
    maxMemory = batch.memoryKb;
    passedCases = batch.perCase.filter((r) => r.passed).length;
    const firstFailure = batch.perCase.find((r) => !r.passed);
    verdict = firstFailure ? firstFailure.verdict : "ACCEPTED";
    // Compiler output / stderr of the first failing case, for the submissions UI
    const errorDetail = firstFailure
      ? (firstFailure.compile_output || firstFailure.stderr || "").trim() || null
      : null;

    // Save submission
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        roomId, // Link to the pairing room if applicable
        code,
        language: language as string,
        verdict,
        runtimeMs: maxRuntime,
        memoryKb: maxMemory,
        passedCases,
        totalCases: problem.testCases.length, // Only count official cases for ranking
      },
    });

    // Award XP and update stats if first ACCEPTED solve
    if (verdict === "ACCEPTED") {
      const prevSolved = await prisma.submission.findFirst({
        where: {
          userId,
          problemId,
          verdict: "ACCEPTED",
          id: { not: submission.id },
        },
      });

      if (!prevSolved) {
        const xpMap: Record<string, number> = { easy: 10, medium: 20, hard: 30 };
        const xpAwarded = xpMap[problem.difficulty.toLowerCase()] ?? 10;

        await prisma.user.update({
          where: { id: userId },
          data: { 
            xp: { increment: xpAwarded },
            questionsXp: { increment: xpAwarded }
          },
        });

        const stats = await prisma.userStats.findUnique({ where: { userId } });
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let newStreak = 1;
        let newLongestStreak = 1;

        if (stats) {
          const lastActiveDate = new Date(stats.lastActive);
          lastActiveDate.setHours(0, 0, 0, 0);

          const diffTime = today.getTime() - lastActiveDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 0) {
            // Already active today, keep streak
            newStreak = stats.currentStreak;
          } else if (diffDays === 1) {
            // Active yesterday, increment
            newStreak = stats.currentStreak + 1;
          } else {
            // Gap in activity, reset
            newStreak = 1;
          }
          newLongestStreak = Math.max(newStreak, stats.longestStreak);

          await prisma.userStats.update({
            where: { userId },
            data: {
              problemsSolved: { increment: 1 },
              currentStreak: newStreak,
              longestStreak: newLongestStreak,
              lastActive: new Date(),
            },
          });

          // First-ever solve + streak milestones land in the notifications bell
          if (stats.problemsSolved === 0) {
            void createNotificationOnce(userId, FIRST_SOLVE);
          }
          const milestone = streakMilestone(newStreak);
          if (milestone) {
            void createNotificationOnce(userId, milestone);
          }
        } else {
          // First time stats
          await prisma.userStats.create({
            data: {
              userId,
              problemsSolved: 1,
              currentStreak: 1,
              longestStreak: 1,
              lastActive: new Date(),
            },
          });

          // Very first solve on a brand-new stats row
          void createNotificationOnce(userId, FIRST_SOLVE);
        }
      }
    }

    res.json({
      verdict,
      passedCases,
      totalCases: problem.testCases.length,
      customResults: batch.perCase.slice(problem.testCases.length), // Return custom results separately if needed
      errorDetail,
      runtimeMs: maxRuntime,
      memoryKb: maxMemory,
      submissionId: submission.id,
    });
  } catch (err) {
    console.error("POST /api/submit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

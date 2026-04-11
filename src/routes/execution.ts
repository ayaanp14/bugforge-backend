import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { pollBatchJudge0, pollJudge0, LANGUAGE_MAP, submitBatchToJudge0, submitToJudge0 } from "../lib/judge0.js";

const router = Router();
const SUBMIT_CONCURRENCY = Math.max(
  1,
  parseInt(process.env["SUBMIT_CONCURRENCY"] ?? "50", 10) || 50
);
const POLL_CONCURRENCY = Math.max(
  1,
  parseInt(process.env["POLL_CONCURRENCY"] ?? "200", 10) || 200
);

interface CustomTestCase {
  input: string;
  expectedOutput?: string;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const currentIndex = nextIndex++;
      if (currentIndex >= items.length) return;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];

  for (let start = 0; start < items.length; start += batchSize) {
    const batch = items.slice(start, start + batchSize);
    const batchResults = await Promise.all(
      batch.map((item, index) => mapper(item, start + index))
    );
    results.push(...batchResults);
  }

  return results;
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

    let finalCustomCases: CustomTestCase[] = (customTestCases || []).map((tc: any) => ({ ...tc }));

    // Generate expected outputs if missing
    if (finalCustomCases.length > 0 && problem.referenceSolution && problem.referenceLanguage) {
      const casesToGen = finalCustomCases.filter((tc: CustomTestCase) => !tc.expectedOutput);
      if (casesToGen.length > 0) {
        const refLanguageId = LANGUAGE_MAP[problem.referenceLanguage];
        if (refLanguageId) {
          try {
            const genTokens = await submitBatchToJudge0(
              casesToGen.map((tc: CustomTestCase) => ({
                source_code: problem.referenceSolution!,
                language_id: refLanguageId,
                stdin: tc.input,
                cpu_time_limit: problem.timeLimitMs / 1000,
                memory_limit: problem.memoryLimitMb * 1024,
              })),
              problem.referenceLanguage
            );
            const genResults = await pollBatchJudge0(genTokens);
            genResults.forEach((res, i) => {
              casesToGen[i].expectedOutput = (res.stdout || "").trim();
            });
          } catch (err) {
            console.error("Failed to generate expected outputs:", err);
          }
        }
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

    const normalizeOutput = (value: string | null | undefined) => (value ?? "").trim();

    const results = await Promise.all(
      allTestCases.map(async (testCase) => {
        try {
          const submissionId = await submitToJudge0({
            source_code: code,
            language_id: languageId,
            stdin: testCase.input,
            cpu_time_limit: problem.timeLimitMs / 1000,
            memory_limit: problem.memoryLimitMb * 1024,
          }, language as string);

          const result = await pollJudge0(submissionId);
          const actualOutput = result.stdout;
          const passed = result.status.id === 3
            ? normalizeOutput(actualOutput) === normalizeOutput(testCase.expectedOutput)
            : false;

          return {
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput,
            passed,
            runtime: result.time ? Math.round(parseFloat(result.time) * 1000) : 0,
            memory: result.memory ?? 0,
            status: passed ? "Accepted" : result.status.description,
            stderr: result.stderr,
            compile_output: result.compile_output,
            message: result.message,
          };
        } catch (error) {
          const err = error as Error;
          console.error("Run testcase execution failed:", {
            problemId,
            language,
            testCaseId: testCase.id,
            message: err.message,
          });

          return {
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: null,
            passed: false,
            runtime: 0,
            memory: 0,
            status: "Execution Failed",
            stderr: err.message,
            compile_output: null,
            message: null,
          };
        }
      })
    );

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

    let finalCustomCases: CustomTestCase[] = (customTestCases || []).map((tc: any) => ({ ...tc }));

    // Generate expected outputs if missing
    if (finalCustomCases.length > 0 && problem.referenceSolution && problem.referenceLanguage) {
      const casesToGen = finalCustomCases.filter((tc: CustomTestCase) => !tc.expectedOutput);
      if (casesToGen.length > 0) {
        const refLanguageId = LANGUAGE_MAP[problem.referenceLanguage];
        if (refLanguageId) {
          try {
            const genTokens = await submitBatchToJudge0(
              casesToGen.map((tc: CustomTestCase) => ({
                source_code: problem.referenceSolution!,
                language_id: refLanguageId,
                stdin: tc.input,
                cpu_time_limit: problem.timeLimitMs / 1000,
                memory_limit: problem.memoryLimitMb * 1024,
              })),
              problem.referenceLanguage
            );
            const genResults = await pollBatchJudge0(genTokens);
            genResults.forEach((res, i) => {
              casesToGen[i].expectedOutput = (res.stdout || "").trim();
            });
          } catch (err) {
            console.error("Failed to generate expected outputs:", err);
          }
        }
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

    const results = await processInBatches(
      Array.from({ length: Math.ceil(allTestCases.length / SUBMIT_CONCURRENCY) }, (_, batchIndex) => {
        const start = batchIndex * SUBMIT_CONCURRENCY;
        return allTestCases.slice(start, start + SUBMIT_CONCURRENCY);
      }),
      1,
      async (batch) => {
        const submissionTokens = await submitBatchToJudge0(
          batch.map((testCase) => ({
            source_code: code,
            language_id: languageId,
            stdin: testCase.input,
            expected_output: testCase.expectedOutput,
            cpu_time_limit: problem.timeLimitMs / 1000,
            memory_limit: problem.memoryLimitMb * 1024,
          })),
          language as string
        );

        return await pollBatchJudge0(submissionTokens);
      }
    );

    const flatResults = results.flat();

    for (const result of flatResults) {
      const runtime = result.time ? Math.round(parseFloat(result.time) * 1000) : 0;
      maxRuntime = Math.max(maxRuntime, runtime);
      maxMemory = Math.max(maxMemory, result.memory);

      if (result.status.id === 3) {
        passedCases++;
      } else {
        if (verdict === "ACCEPTED") {
          if (result.status.id === 4) verdict = "COMPILATION_ERROR";
          else if (result.status.id === 5) verdict = "TIME_LIMIT_EXCEEDED";
          else if (result.status.id >= 6 && result.status.id <= 12) verdict = "RUNTIME_ERROR";
          else verdict = "WRONG_ANSWER";
        }
      }
    }

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
          data: { xp: { increment: xpAwarded } },
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
        }
      }
    }

    res.json({
      verdict,
      passedCases,
      totalCases: problem.testCases.length,
      customResults: flatResults.slice(problem.testCases.length), // Return custom results separately if needed
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

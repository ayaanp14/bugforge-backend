import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { executionLimiter } from "../middleware/rate-limit.js";
import { LANGUAGE_MAP } from "../lib/judge0.js";
// All test cases run in ONE engine execution (1 compile + 1 run) and are
// judged server-side — see src/lib/batch-judge.ts.
import { runBatch } from "../lib/batch-judge.js";
import { containsReservedMarker } from "../lib/batch.js";
// The editor holds only the solution stub; the language driver (I/O parsing,
// batching, gzip, stats) is wrapped around it here at execution time.
// buildDriver also hands back the line map that turns engine-reported
// positions back into the editor's own line numbers (remapDiagnostics).
import { buildDriver, remapDiagnostics, type Language as DriverLanguage, type Signature } from "../lib/driver-codegen.js";
import { FIRST_SOLVE, createNotificationOnce, streakMilestone } from "../services/notifications.js";
import { invalidateDashboard } from "../services/dashboard.js";
import { emitDuelActivity, settleDuelForSubmission } from "../lib/duels.js";
import { recordContestSubmission } from "../services/daily-contest.js";
import { ENGINE_DOWN_MESSAGE, isEngineDown } from "../lib/engine-error.js";
// The judge's slice of a problem — limits, signature, reference solution — and
// its test suite, both held in memory rather than pulled (~1 MB of hidden
// cases) out of the database on every Run and Submit.
import { getJudgeProblem, getJudgeSuite, type JudgeProblem } from "../lib/test-suite-cache.js";

const router = Router();

// Per-request judge logging is useful when an engine misbehaves and noise the
// rest of the time.
const JUDGE_DEBUG_LOGS = process.env["JUDGE_DEBUG_LOGS"] === "true";

interface CustomTestCase {
  input: string;
  expectedOutput?: string;
}

/**
 * Bounds on what one request may ask the judge to do. The body limit alone
 * (512 kb) left room for a few thousand custom cases, each without an
 * expected output costing a reference-solution run, all inside one
 * rate-limit token; and a non-string `code` reached the driver and threw.
 */
const MAX_CODE_CHARS = 65_536;
const MAX_CUSTOM_CASES = 10;
const MAX_CUSTOM_INPUT_CHARS = 4_096;

function readCustomCases(raw: unknown): CustomTestCase[] | null {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return null;
  if (raw.length > MAX_CUSTOM_CASES) return null;
  const cases: CustomTestCase[] = [];
  for (const tc of raw) {
    if (!tc || typeof tc !== "object") return null;
    const input = (tc as { input?: unknown }).input;
    const expected = (tc as { expectedOutput?: unknown }).expectedOutput;
    if (typeof input !== "string" || input.length > MAX_CUSTOM_INPUT_CHARS) return null;
    if (expected != null && (typeof expected !== "string" || expected.length > MAX_CUSTOM_INPUT_CHARS)) return null;
    cases.push({ input, ...(typeof expected === "string" ? { expectedOutput: expected } : {}) });
  }
  return cases;
}

/**
 * A custom case typed without an expected output gets one from the reference
 * solution — one batched reference execution covers all of them. Best effort:
 * a reference that fails to run leaves the case with an empty expectation
 * rather than failing the user's own run.
 */
async function fillExpectedOutputs(problem: JudgeProblem, cases: CustomTestCase[]): Promise<void> {
  const casesToGen = cases.filter((tc) => !tc.expectedOutput);
  if (casesToGen.length === 0) return;
  if (!problem.referenceSolution || !problem.referenceLanguage || !LANGUAGE_MAP[problem.referenceLanguage]) return;
  try {
    const ref = await runBatch(
      problem.referenceSolution,
      problem.referenceLanguage,
      casesToGen.map((tc) => ({ input: tc.input, expectedOutput: "" })),
      { timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb },
    );
    ref.perCase.forEach((r, i) => {
      casesToGen[i].expectedOutput = (r.actualOutput || "").trim();
    });
  } catch (err) {
    console.error("Failed to generate expected outputs:", err);
  }
}

// 9. POST /api/run — Run code against visible test cases
// Limited after requireAuth so the budget is per account, not per address:
// people on one campus network should not share one allowance.
router.post("/run", requireAuth, executionLimiter, async (req, res) => {
  if (JUDGE_DEBUG_LOGS) console.log(`[POST /api/run] Received request from user ${req.user?.userId}`);
  try {
    const { code, language } = req.body;
    const problemId = typeof req.body.problemId === "string" ? req.body.problemId : "";

    const languageId = LANGUAGE_MAP[language as string];
    if (!languageId) {
      res.status(400).json({ error: "Unsupported language" });
      return;
    }
    if (typeof code !== "string" || code.length > MAX_CODE_CHARS) {
      res.status(400).json({ error: "Code must be a string of at most 64 KB" });
      return;
    }
    if (containsReservedMarker(code)) {
      res.status(400).json({ error: "Code must not contain the reserved marker __CODEXA_" });
      return;
    }
    const customTestCases = readCustomCases(req.body.customTestCases);
    if (!customTestCases) {
      res.status(400).json({ error: `Custom test cases: at most ${MAX_CUSTOM_CASES}, each a string input under ${MAX_CUSTOM_INPUT_CHARS} characters` });
      return;
    }

    if (!problemId) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }
    const [problem, suite] = await Promise.all([getJudgeProblem(problemId), getJudgeSuite(problemId)]);
    if (!problem) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    // Mid-duel, the other side sees you reach for Run.
    void emitDuelActivity(req.user!.userId, { problemId }, { type: "running" });

    const limits = { timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb };
    const finalCustomCases: CustomTestCase[] = customTestCases.map((tc) => ({ ...tc }));
    await fillExpectedOutputs(problem, finalCustomCases);

    // Run is the visible cases only; the hidden ones are the grade.
    const visibleCases = suite.filter((c) => !c.isHidden);
    const allTestCases = [
      ...visibleCases,
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

    const driver = problem.signature
      ? buildDriver(language as DriverLanguage, problem.signature as Signature, code)
      : null;
    const executedCode = driver ? driver.code : code;
    const toEditorLine = driver ? driver.toEditorLine : null;
    const batch = await runBatch(
      executedCode,
      language as string,
      allTestCases.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput })),
      limits
    );
    // Per-case timing isn't observable in a single run; report the average.
    const perCaseRuntime = Math.round(batch.runtimeMs / allTestCases.length);

    const results = allTestCases.map((tc, i) => {
      const r = batch.perCase[i];
      return {
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: r.actualOutput,
        passed: r.passed,
        runtime: perCaseRuntime,
        memory: batch.memoryKb,
        status: r.status,
        stderr: remapDiagnostics(r.stderr, toEditorLine),
        compile_output: remapDiagnostics(r.compile_output, toEditorLine),
        message: null,
      };
    });

    // What the solution printed on its own — a debug `console.log`, say —
    // travels beside the results instead of being judged as one of them.
    const stdout = batch.userStdout;

    // …and how it went. Only the official cases count, so a custom case cannot
    // be used to fake a scary-looking score at the opponent.
    const officialCount = visibleCases.length;
    void emitDuelActivity(
      req.user!.userId,
      { problemId },
      {
        type: "ran",
        passed: results.slice(0, officialCount).filter((r: { passed: boolean }) => r.passed).length,
        total: officialCount,
      },
    );

    res.json({ results, stdout });
  } catch (err) {
    if (isEngineDown(err)) {
      console.error("POST /api/run — engine down:", err.message);
      res.status(503).json({ error: ENGINE_DOWN_MESSAGE, engineDown: true });
      return;
    }
    console.error("POST /api/run error:", err);
    res.status(500).json({ error: "Failed to run code" });
  }
});

/**
 * Streak bookkeeping from the stats row as it stood before this solve.
 * Day boundaries are local to the server, as they always were here.
 */
function nextStreak(stats: { lastActive: Date; currentStreak: number; longestStreak: number } | null) {
  if (!stats) return { currentStreak: 1, longestStreak: 1 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActiveDate = new Date(stats.lastActive);
  lastActiveDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));

  // Already active today keeps the streak; active yesterday extends it; a gap resets it.
  const currentStreak = diffDays === 0 ? stats.currentStreak : diffDays === 1 ? stats.currentStreak + 1 : 1;
  return { currentStreak, longestStreak: Math.max(currentStreak, stats.longestStreak) };
}

// 10. POST /api/submit — Submit code against all test cases
//
// Shape of the request: every read the verdict will need is fetched before
// the engine is called (and overlaps it), the verdict is written in one
// transaction, the response goes out, and only then do the duel, the
// notification bell and the dashboard cache hear about it. The user is
// waiting on the verdict; nobody is waiting on the bookkeeping.
router.post("/submit", requireAuth, executionLimiter, async (req, res) => {
  if (JUDGE_DEBUG_LOGS) console.log(`[POST /api/submit] Received request from user ${req.user?.userId}`);
  try {
    const { code, language, roomId } = req.body;
    const problemId = typeof req.body.problemId === "string" ? req.body.problemId : "";
    let userId = req.user!.userId;

    const languageId = LANGUAGE_MAP[language as string];
    if (!languageId) {
      res.status(400).json({ error: "Unsupported language" });
      return;
    }
    if (typeof code !== "string" || code.length > MAX_CODE_CHARS) {
      res.status(400).json({ error: "Code must be a string of at most 64 KB" });
      return;
    }
    if (containsReservedMarker(code)) {
      res.status(400).json({ error: "Code must not contain the reserved marker __CODEXA_" });
      return;
    }
    const customTestCases = readCustomCases(req.body.customTestCases);
    if (!customTestCases) {
      res.status(400).json({ error: `Custom test cases: at most ${MAX_CUSTOM_CASES}, each a string input under ${MAX_CUSTOM_INPUT_CHARS} characters` });
      return;
    }
    if (!problemId) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    // Pairing mode credits the host, so the room decides whose history the
    // solve lands in; it is read alongside the problem rather than before it.
    // The room id comes from the client, so it is only honoured when the
    // caller is actually seated in that room and the room is still live —
    // otherwise any request could name any room and hand its host XP, a
    // streak day, a duel win and a contest solve. A room that fails the check
    // is simply not a pairing submit: the solve lands on the caller.
    const [problem, suite, room] = await Promise.all([
      getJudgeProblem(problemId),
      getJudgeSuite(problemId),
      typeof roomId === "string" && roomId
        ? prisma.pairRoom.findFirst({
            where: {
              id: roomId,
              problemId,
              status: { in: ["waiting", "active"] },
              participants: { some: { userId: req.user!.userId } },
            },
            select: { id: true, createdBy: true },
          })
        : Promise.resolve(null),
    ]);
    const pairRoomId = room?.id ?? null;
    if (room) {
      userId = room.createdBy;
      if (JUDGE_DEBUG_LOGS) console.log(`[POST /api/submit] Pairing mode: Awarding credits to host ${userId}`);
    }

    if (!problem) {
      res.status(404).json({ error: "Problem not found" });
      return;
    }

    // The tensest moment in a duel: the other side is submitting.
    void emitDuelActivity(userId, { problemId }, { type: "submitting" });

    // Whether this would be a first solve, and the streak row it would move,
    // are only needed once there is a verdict — so they overlap the engine
    // run instead of queueing behind it. (A user who lands two accepted
    // submissions in the same second could see both counted as the first;
    // the rate limiter makes that a curiosity rather than a loophole.)
    const history = Promise.all([
      prisma.submission.findFirst({
        where: { userId, problemId, verdict: "ACCEPTED" },
        select: { id: true },
      }),
      prisma.userStats.findUnique({ where: { userId } }),
    ]);
    // Awaited after the engine; this only stops an early failure from
    // surfacing as an unhandled rejection in the meantime.
    history.catch(() => {});

    // A problem with no official cases cannot be graded; /run already
    // returns nothing for it, and /submit must not hand out an ACCEPTED (and
    // the XP behind it) for whatever was typed.
    if (suite.length === 0) {
      res.status(400).json({ error: "This problem has no test cases to judge against yet" });
      return;
    }

    const limits = { timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb };
    const finalCustomCases: CustomTestCase[] = customTestCases.map((tc) => ({ ...tc }));
    await fillExpectedOutputs(problem, finalCustomCases);

    const allTestCases = [
      ...suite,
      ...finalCustomCases.map((tc: CustomTestCase, idx: number) => ({
        id: `custom-submit-${idx}`,
        input: tc.input,
        expectedOutput: tc.expectedOutput || "",
        isHidden: true // Treat custom cases as hidden during submit UI
      }))
    ];
    const totalCases = suite.length; // Only count official cases for ranking

    // One batched execution for every test case (1 compile + 1 run)
    const driver = problem.signature
      ? buildDriver(language as DriverLanguage, problem.signature as Signature, code)
      : null;
    const executedCode = driver ? driver.code : code;
    const batch = await runBatch(
      executedCode,
      language as string,
      allTestCases.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput })),
      limits
    );
    const maxRuntime = batch.runtimeMs;
    const maxMemory = batch.memoryKb;
    // Only the official suite decides the verdict. The custom cases ride in
    // the same execution so the user sees them judged, but they are the
    // user's own — one added and left blank used to fail a correct solution,
    // and a passing one pushed `passedCases` past `totalCases`.
    const official = batch.perCase.slice(0, totalCases);
    const passedCases = official.filter((r) => r.passed).length;
    const firstFailure = official.find((r) => !r.passed);
    const verdict = firstFailure ? firstFailure.verdict : "ACCEPTED";
    // Compiler output / stderr of the first failing case, for the submissions UI
    const errorDetail = firstFailure
      ? remapDiagnostics((firstFailure.compile_output || firstFailure.stderr || "").trim() || null, driver ? driver.toEditorLine : null)
      : null;

    const [prevSolved, stats] = await history;

    // Award XP and update stats if first ACCEPTED solve
    const firstSolve = verdict === "ACCEPTED" && !prevSolved;
    const xpMap: Record<string, number> = { easy: 10, medium: 20, hard: 30 };
    const awardedXp = firstSolve ? (xpMap[problem.difficulty.toLowerCase()] ?? 10) : 0;
    const streak = nextStreak(stats);

    // The submission row, the XP and the streak land together or not at all.
    const submissionCreate = prisma.submission.create({
      data: {
        userId,
        problemId,
        roomId: pairRoomId, // Link to the pairing room if applicable
        code,
        language: language as string,
        verdict,
        runtimeMs: maxRuntime,
        memoryKb: maxMemory,
        passedCases,
        totalCases,
      },
    });
    const [submission] = firstSolve
      ? await prisma.$transaction([
          submissionCreate,
          prisma.user.update({
            where: { id: userId },
            data: {
              xp: { increment: awardedXp },
              questionsXp: { increment: awardedXp },
              // Rating climbs with every first solve — powers the tier bar
              rating: { increment: awardedXp },
            },
          }),
          prisma.userStats.upsert({
            where: { userId },
            update: {
              problemsSolved: { increment: 1 },
              currentStreak: streak.currentStreak,
              longestStreak: streak.longestStreak,
              lastActive: new Date(),
            },
            create: {
              userId,
              problemsSolved: 1,
              currentStreak: 1,
              longestStreak: 1,
              lastActive: new Date(),
            },
          }),
        ])
      : await prisma.$transaction([submissionCreate]);

    // The daily contest hears about the verdict before the response, not
    // after it like the duel: the workspace shows the rank and the clock in
    // the same breath as the verdict. One cached comparison for every other
    // problem; a row update only when this is today's kata and the warrior
    // has entered.
    const dailyContest = await recordContestSubmission(userId, problemId, verdict, submission.submittedAt).catch((err) => {
      console.error("POST /api/submit — daily contest failed:", err);
      return null;
    });

    res.json({
      verdict,
      awardedXp,
      firstSolve,
      passedCases,
      totalCases,
      customResults: batch.perCase.slice(totalCases), // Return custom results separately if needed
      errorDetail,
      runtimeMs: maxRuntime,
      memoryKb: maxMemory,
      submissionId: submission.id,
      dailyContest,
    });

    // ── After the response ──────────────────────────────────────────
    // The dashboard aggregate is cached; this submission just changed it.
    invalidateDashboard(userId);

    // If this solve landed inside a duel, the duel is decided right here — the
    // Kumite never waits for the client to tell it what the judge already knows.
    settleDuelForSubmission(userId, { problemId }, { verdict, passed: passedCases, total: totalCases }).catch((err) =>
      console.error("POST /api/submit — duel settlement failed:", err),
    );

    // First-ever solve + streak milestones land in the notifications bell
    if (firstSolve) {
      if (!stats || stats.problemsSolved === 0) {
        createNotificationOnce(userId, FIRST_SOLVE).catch((err) => console.error("POST /api/submit — notification failed:", err));
      }
      const milestone = stats ? streakMilestone(streak.currentStreak) : null;
      if (milestone) {
        createNotificationOnce(userId, milestone).catch((err) => console.error("POST /api/submit — notification failed:", err));
      }
    }
  } catch (err) {
    // The verdict may already be on its way; the bookkeeping after it must
    // not be able to answer twice.
    if (res.headersSent) {
      console.error("POST /api/submit — after-response error:", err);
      return;
    }
    if (isEngineDown(err)) {
      console.error("POST /api/submit — engine down:", err.message);
      res.status(503).json({ error: ENGINE_DOWN_MESSAGE, engineDown: true });
      return;
    }
    console.error("POST /api/submit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { aptitudeTopic, aptitudeCategory } from "../lib/aptitude-topics.js";
import { attemptClock, codingMarks, drawPaper, markFor, type DrawRule, type PaperSection, type SectionPlan } from "../lib/mock-tests.js";
import { LANGUAGE_MAP } from "../lib/judge0.js";
import { runBatch } from "../lib/batch-judge.js";
import { buildDriver, remapDiagnostics, type Language as DriverLanguage, type Signature } from "../lib/driver-codegen.js";
import { ENGINE_DOWN_MESSAGE, isEngineDown } from "../lib/engine-error.js";
import { cachedShared } from "../lib/cache.js";
import { codingPool, questionIndex } from "../services/aptitude-bank.js";

/**
 * Full-length placement tests.
 *
 * The rule that shapes this file: while a sitting is in progress the server
 * never sends an answer key or a solution. They appear once, in the result,
 * after the attempt is closed. Everything about the clock is decided from the
 * stored deadlines, so a reload cannot buy time and a stale tab cannot keep a
 * finished section alive.
 */
const router = Router();

type AttemptRow = Awaited<ReturnType<typeof prisma.mockAttempt.findFirst>>;

const sectionPlans = (sections: Array<{ key: string; name: string; orderIndex: number; durationSec: number; questionCount: number; instructions: string | null; kind?: string; marksPerQuestion?: number; blueprint: unknown }>): SectionPlan[] =>
  sections.map((section) => ({
    key: section.key,
    name: section.name,
    orderIndex: section.orderIndex,
    durationSec: section.durationSec,
    questionCount: section.questionCount,
    instructions: section.instructions,
    kind: section.kind === "coding" ? "coding" : "mcq",
    marksPerQuestion: section.marksPerQuestion ?? 1,
    blueprint: (section.blueprint ?? []) as unknown as DrawRule[],
  }));

/** The public shape of a pattern, without the blueprints that fill it. */
const testSummary = (test: any) => ({
  slug: test.slug,
  company: test.company,
  name: test.name,
  family: test.family,
  blurb: test.blurb,
  durationSec: test.durationSec,
  totalQuestions: test.totalQuestions,
  negativeMark: test.negativeMark,
  sectionalTiming: test.sectionalTiming,
  isAdaptive: test.isAdaptive,
  highlights: test.highlights,
  difficulty: test.difficulty,
  sections: (test.sections ?? []).map((section: any) => ({
    key: section.key,
    name: section.name,
    kind: section.kind ?? "mcq",
    marksPerQuestion: section.marksPerQuestion ?? 1,
    durationSec: section.durationSec,
    questionCount: section.questionCount,
  })),
});

/**
 * A pattern is seeded content (scripts/seed-mock-tests.ts) and a sitting draws
 * from it without changing it, so both of these are the same bytes for every
 * candidate. Only the attempts laid over them are personal, and those are
 * fetched alongside rather than inside.
 */
const testCatalogue = () =>
  cachedShared("mock:catalogue:v1", 600, () =>
    prisma.mockTest.findMany({
      where: { published: true },
      orderBy: [{ orderIndex: "asc" }, { name: "asc" }],
      include: { sections: { orderBy: { orderIndex: "asc" } } },
    }),
  );

const testPattern = (slug: string) =>
  cachedShared(`mock:test:v1:${slug}`, 600, () =>
    prisma.mockTest.findFirst({
      where: { slug, published: true },
      include: { sections: { orderBy: { orderIndex: "asc" } } },
    }),
  );

/* ── the clock, enforced ──────────────────────────────────────────── */

/**
 * Grades a sitting and closes it. Idempotent: an attempt already closed is
 * returned untouched, so a submit racing an expiry cannot double-count.
 */
async function finishAttempt(attemptId: string, reason: "submitted" | "expired") {
  const attempt = await prisma.mockAttempt.findUnique({
    where: { id: attemptId },
    include: { test: true, answers: true, codeAnswers: true },
  });
  if (!attempt) return null;
  if (attempt.status !== "in-progress") return attempt;

  const paper = attempt.paper as unknown as PaperSection[];
  const mcqIds = paper.filter((s) => s.kind !== "coding").flatMap((s) => s.questionIds);
  const questions = await prisma.aptitudeQuestion.findMany({
    where: { id: { in: mcqIds } },
    select: { id: true, answer: true, topic: true },
  });
  const keyed = new Map(questions.map((q) => [q.id, q]));
  const answers = new Map(attempt.answers.map((row) => [row.questionId, row]));
  const code = new Map(attempt.codeAnswers.map((row) => [row.problemId, row]));

  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let score = 0;
  let maxScore = 0;

  const sectionScores = paper.map((section, index) => {
    const marks = section.marksPerQuestion ?? 1;
    let sectionCorrect = 0;
    let sectionWrong = 0;
    let sectionSkipped = 0;
    let sectionTime = 0;
    let sectionScore = 0;
    const sectionMax = section.questionIds.length * marks;
    maxScore += sectionMax;

    if (section.kind === "coding") {
      // Coding is graded on test cases passed, so "correct" means fully
      // solved and a partial solve still earns its share of the marks.
      for (const problemId of section.questionIds) {
        const row = code.get(problemId);
        sectionTime += row?.timeSec ?? 0;
        if (!row || row.submissions === 0) sectionSkipped += 1;
        else if (row.totalCases > 0 && row.passedCases === row.totalCases) sectionCorrect += 1;
        else sectionWrong += 1;
        if (row) sectionScore += codingMarks(row.passedCases, row.totalCases, marks);
      }
    } else {
      for (const questionId of section.questionIds) {
        const row = answers.get(questionId);
        const answered = row != null && row.selected != null;
        const correct = answered && keyed.get(questionId)?.answer === row!.selected;
        sectionTime += row?.timeSec ?? 0;
        if (!answered) sectionSkipped += 1;
        else if (correct) sectionCorrect += 1;
        else sectionWrong += 1;
        sectionScore += markFor(Boolean(correct), answered, attempt.test.negativeMark) * marks;
      }
    }

    score += sectionScore;
    correctCount += sectionCorrect;
    wrongCount += sectionWrong;
    skippedCount += sectionSkipped;
    return {
      index,
      key: section.key,
      name: section.name,
      kind: section.kind ?? "mcq",
      total: section.questionIds.length,
      correct: sectionCorrect,
      wrong: sectionWrong,
      skipped: sectionSkipped,
      timeSec: sectionTime,
      score: Math.round(sectionScore * 100) / 100,
      maxScore: sectionMax,
      accuracy: sectionCorrect + sectionWrong > 0 ? Math.round((sectionCorrect / (sectionCorrect + sectionWrong)) * 100) : null,
    };
  });

  // A negative total is not a meaningful score to show a candidate.
  const finalScore = Math.max(0, Math.round(score * 100) / 100);

  return prisma.mockAttempt.update({
    where: { id: attemptId },
    data: {
      status: reason,
      submittedAt: new Date(),
      score: finalScore,
      maxScore: Math.round(maxScore * 100) / 100,
      correctCount,
      wrongCount,
      skippedCount,
      sectionScores,
    },
    include: { test: true, answers: true },
  });
}

/**
 * Brings a sitting up to date with the wall clock before anything reads it.
 * A lapsed paper is graded; a lapsed section rolls on to the next one.
 */
async function syncAttempt(attempt: NonNullable<AttemptRow> & { test: any }) {
  if (attempt.status !== "in-progress") return attempt;
  const paper = attempt.paper as unknown as PaperSection[];
  const clock = attemptClock({
    status: attempt.status,
    expiresAt: attempt.expiresAt,
    sectionEndsAt: attempt.sectionEndsAt,
    sectionalTiming: attempt.test.sectionalTiming,
  });

  if (clock.paperExpired) return (await finishAttempt(attempt.id, "expired")) ?? attempt;

  if (clock.sectionExpired) {
    const nextIndex = attempt.currentSection + 1;
    if (nextIndex >= paper.length) return (await finishAttempt(attempt.id, "expired")) ?? attempt;
    // The next section's clock starts where the last one ran out, not now, so
    // a candidate who walked away does not gain the idle minutes.
    const startedAt = attempt.sectionEndsAt ?? new Date();
    const endsAt = new Date(Math.min(startedAt.getTime() + paper[nextIndex].durationSec * 1000, attempt.expiresAt.getTime()));
    const updated = await prisma.mockAttempt.update({
      where: { id: attempt.id },
      data: { currentSection: nextIndex, sectionEndsAt: endsAt },
      include: { test: true },
    });
    // The new section may itself already have lapsed while the tab was closed.
    return syncAttempt(updated as any);
  }

  return attempt;
}

/* ── the catalogue ────────────────────────────────────────────────── */

/**
 * GET /api/tests
 * Every published pattern, with the candidate's history on each.
 */
router.get("/", optionalAuth, async (req: any, res) => {
  try {
    const userId: string | null = req.user?.userId ?? null;
    const [tests, attempts] = await Promise.all([
      testCatalogue(),
      userId
        ? prisma.mockAttempt.findMany({
            where: { userId },
            orderBy: { startedAt: "desc" },
            select: { id: true, testId: true, status: true, score: true, maxScore: true, startedAt: true, submittedAt: true },
          })
        : Promise.resolve([]),
    ]);

    const byTest = new Map<string, typeof attempts>();
    for (const attempt of attempts) {
      const list = byTest.get(attempt.testId) ?? [];
      list.push(attempt);
      byTest.set(attempt.testId, list);
    }

    res.json({
      tests: tests.map((test) => {
        const mine = byTest.get(test.id) ?? [];
        const done = mine.filter((a) => a.status !== "in-progress" && a.maxScore);
        const best = done.reduce<number | null>((acc, a) => (a.score != null && (acc == null || a.score > acc) ? a.score : acc), null);
        return {
          ...testSummary(test),
          attempts: done.length,
          bestScore: best,
          bestPercent: best != null && done[0]?.maxScore ? Math.round((best / done[0].maxScore) * 100) : null,
          // Only one sitting can be live at a time, so this is the resume link.
          inProgressId: mine.find((a) => a.status === "in-progress")?.id ?? null,
        };
      }),
      families: [
        { id: "service", label: "IT services", blurb: "The mass-recruitment tests: TCS, Infosys, Wipro, Cognizant, Capgemini, Accenture." },
        { id: "product", label: "Product companies", blurb: "Assessment rounds at product firms, where reasoning sits alongside coding." },
        { id: "generic", label: "General practice", blurb: "Full-length papers not tied to one company." },
      ],
    });
  } catch (error: any) {
    console.error("Mock tests list error:", error?.message);
    res.status(500).json({ error: "Could not load the tests" });
  }
});

/**
 * GET /api/tests/:slug
 * One pattern in full, for the instructions screen.
 */
router.get("/:slug", optionalAuth, async (req: any, res) => {
  try {
    const test = await testPattern(req.params.slug);
    if (!test) return res.status(404).json({ error: "Test not found" });

    const userId: string | null = req.user?.userId ?? null;
    const attempts = userId
      ? await prisma.mockAttempt.findMany({
          where: { userId, testId: test.id },
          orderBy: { startedAt: "desc" },
          take: 10,
          select: { id: true, status: true, score: true, maxScore: true, correctCount: true, startedAt: true, submittedAt: true },
        })
      : [];

    res.json({
      test: {
        ...testSummary(test),
        instructions: test.instructions,
        sourceNote: test.sourceNote,
        sections: test.sections.map((section) => {
          const rules = (section.blueprint ?? []) as unknown as DrawRule[];
          const coding = section.kind === "coding";
          return {
            key: section.key,
            name: section.name,
            kind: coding ? "coding" : "mcq",
            marksPerQuestion: section.marksPerQuestion,
            durationSec: section.durationSec,
            questionCount: section.questionCount,
            instructions: section.instructions,
            // What the section will ask, without saying what it will ask.
            // A coding section describes itself by its difficulty mix, since
            // naming the tags would tell a candidate which algorithm to expect.
            topics: coding
              ? [
                  ...new Set(
                    rules.map((rule) => `${rule.count} ${rule.difficulty ?? "mixed"}`).map((s) => s.replace(/^1 /, "one "))
                  ),
                ]
              : [
                  ...new Set(
                    rules.flatMap((rule) =>
                      rule.topics?.length
                        ? rule.topics.map((id) => aptitudeTopic(id)?.label ?? id)
                        : rule.category
                          ? [aptitudeCategory(rule.category)?.label ?? rule.category]
                          : []
                    )
                  ),
                ],
          };
        }),
      },
      attempts,
      inProgressId: attempts.find((a) => a.status === "in-progress")?.id ?? null,
    });
  } catch (error: any) {
    console.error("Mock test detail error:", error?.message);
    res.status(500).json({ error: "Could not load the test" });
  }
});

/* ── sitting a paper ──────────────────────────────────────────────── */

/**
 * POST /api/tests/:slug/start
 * Draws a paper and starts the clock. A sitting already in progress is
 * returned instead of a second one, so a double click cannot lose the first.
 */
router.post("/:slug/start", requireAuth, async (req: any, res) => {
  try {
    const test = await testPattern(req.params.slug);
    if (!test) return res.status(404).json({ error: "Test not found" });

    const live = await prisma.mockAttempt.findFirst({
      where: { userId: req.user.userId, testId: test.id, status: "in-progress" },
    });
    if (live) return res.json({ attemptId: live.id, resumed: true });

    const plans = sectionPlans(test.sections);
    // Both pools are seeded content shared by every sitting, so drawing a
    // paper reads them from the cache rather than pulling the whole bank and
    // the whole catalogue out of the database each time — this is the wait a
    // candidate sits through on "Drawing your paper…".
    const [pool, problems] = await Promise.all([
      questionIndex(),
      plans.some((plan) => plan.kind === "coding") ? codingPool() : Promise.resolve([]),
    ]);
    const { paper, shortfalls } = drawPaper(plans, pool, Math.random, problems);
    if (shortfalls.length) {
      console.warn(`Mock test ${test.slug} drew short:`, shortfalls.map((s) => `${s.key} -${s.missing}`).join(", "));
    }
    if (!paper.some((section) => section.questionIds.length > 0)) {
      return res.status(503).json({ error: "This test has no questions available yet" });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + test.durationSec * 1000);
    const sectionEndsAt = test.sectionalTiming
      ? new Date(Math.min(now.getTime() + paper[0].durationSec * 1000, expiresAt.getTime()))
      : null;

    const attempt = await prisma.mockAttempt.create({
      data: {
        userId: req.user.userId,
        testId: test.id,
        startedAt: now,
        expiresAt,
        sectionEndsAt,
        currentSection: 0,
        paper: paper as any,
      },
    });
    res.status(201).json({ attemptId: attempt.id, resumed: false });
  } catch (error: any) {
    console.error("Mock test start error:", error?.message);
    res.status(500).json({ error: "Could not start the test" });
  }
});

/** Loads an attempt that belongs to the caller, synced to the clock. */
async function loadOwnAttempt(id: string, userId: string) {
  const attempt = await prisma.mockAttempt.findFirst({ where: { id, userId }, include: { test: true } });
  if (!attempt) return null;
  return syncAttempt(attempt as any);
}

/**
 * GET /api/tests/attempts/:id
 * The live state: the current section's questions, the saved answers, and how
 * long is left. Never the answer key.
 */
router.get("/attempts/:id", requireAuth, async (req: any, res) => {
  try {
    const attempt = await loadOwnAttempt(req.params.id, req.user.userId);
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    const test = (attempt as any).test;
    const paper = attempt.paper as unknown as PaperSection[];

    if (attempt.status !== "in-progress") {
      return res.json({ status: attempt.status, finished: true, attemptId: attempt.id, testSlug: test.slug });
    }

    const index = Math.min(attempt.currentSection, paper.length - 1);
    const section = paper[index];
    const coding = section.kind === "coding";

    const [questions, answers, problems, codeRows] = await Promise.all([
      coding
        ? Promise.resolve([])
        : prisma.aptitudeQuestion.findMany({
            where: { id: { in: section.questionIds } },
            select: { id: true, slug: true, prompt: true, options: true, topic: true, difficulty: true },
          }),
      prisma.mockAnswer.findMany({ where: { attemptId: attempt.id }, select: { questionId: true, selected: true, marked: true, sectionIndex: true } }),
      coding
        ? prisma.problem.findMany({
            where: { id: { in: section.questionIds } },
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              difficulty: true,
              tags: true,
              starterCode: true,
              timeLimitMs: true,
              memoryLimitMb: true,
              // Only the visible cases; the hidden ones are the grade.
              testCases: { where: { isHidden: false }, orderBy: { orderIndex: "asc" }, select: { input: true, expectedOutput: true } },
            },
          })
        : Promise.resolve([]),
      coding
        ? prisma.mockCodeAnswer.findMany({
            where: { attemptId: attempt.id },
            select: { problemId: true, language: true, code: true, verdict: true, passedCases: true, totalCases: true, submissions: true, runtimeMs: true, memoryKb: true },
          })
        : Promise.resolve([]),
    ]);
    const byId = new Map(questions.map((q) => [q.id, q]));
    const problemById = new Map(problems.map((p) => [p.id, p]));
    const codeById = new Map(codeRows.map((row) => [row.problemId, row]));
    const clock = attemptClock({
      status: attempt.status,
      expiresAt: attempt.expiresAt,
      sectionEndsAt: attempt.sectionEndsAt,
      sectionalTiming: test.sectionalTiming,
    });

    res.json({
      attemptId: attempt.id,
      status: attempt.status,
      finished: false,
      test: {
        slug: test.slug,
        name: test.name,
        company: test.company,
        negativeMark: test.negativeMark,
        sectionalTiming: test.sectionalTiming,
      },
      sections: paper.map((s, i) => ({
        key: s.key,
        name: s.name,
        kind: s.kind ?? "mcq",
        questionCount: s.questionIds.length,
        index: i,
        done: i < index,
      })),
      current: {
        index,
        key: section.key,
        name: section.name,
        kind: coding ? "coding" : "mcq",
        marksPerQuestion: section.marksPerQuestion ?? 1,
        isLast: index === paper.length - 1,
        questions: coding
          ? []
          : section.questionIds
              .map((id, position) => {
                const question = byId.get(id);
                if (!question) return null;
                return {
                  number: position + 1,
                  questionId: question.id,
                  prompt: question.prompt,
                  options: question.options,
                  topic: question.topic,
                  difficulty: question.difficulty,
                };
              })
              .filter(Boolean),
        // A coding section carries the problem statements and the candidate's
        // working copy. The hidden test cases never leave the server.
        problems: coding
          ? section.questionIds
              .map((id, position) => {
                const problem = problemById.get(id);
                if (!problem) return null;
                const saved = codeById.get(id);
                return {
                  number: position + 1,
                  problemId: problem.id,
                  slug: problem.slug,
                  title: problem.title,
                  description: problem.description,
                  difficulty: problem.difficulty,
                  tags: problem.tags,
                  starterCode: problem.starterCode,
                  timeLimitMs: problem.timeLimitMs,
                  memoryLimitMb: problem.memoryLimitMb,
                  samples: problem.testCases,
                  language: saved?.language ?? null,
                  code: saved?.code ?? null,
                  best: saved
                    ? {
                        verdict: saved.verdict,
                        passedCases: saved.passedCases,
                        totalCases: saved.totalCases,
                        submissions: saved.submissions,
                        runtimeMs: saved.runtimeMs,
                        memoryKb: saved.memoryKb,
                      }
                    : null,
                };
              })
              .filter(Boolean)
          : [],
      },
      answers: answers.map((row) => ({ questionId: row.questionId, selected: row.selected, marked: row.marked })),
      clock: { paperRemainingSec: clock.paperRemainingSec, sectionRemainingSec: clock.sectionRemainingSec, serverTime: Date.now() },
    });
  } catch (error: any) {
    console.error("Mock attempt state error:", error?.message);
    res.status(500).json({ error: "Could not load the attempt" });
  }
});

/**
 * PUT /api/tests/attempts/:id/answer
 * Body: { questionId, selected: number | null, marked?: boolean, timeSec?: number }.
 * Upserted, so the answer survives a refresh; the verdict is stored but never
 * returned while the sitting is live.
 */
router.put("/attempts/:id/answer", requireAuth, async (req: any, res) => {
  try {
    const attempt = await loadOwnAttempt(req.params.id, req.user.userId);
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    if (attempt.status !== "in-progress") return res.status(409).json({ error: "This attempt is already closed" });

    const paper = attempt.paper as unknown as PaperSection[];
    const body = (req.body ?? {}) as Record<string, unknown>;
    const questionId = String(body["questionId"] ?? "");
    const sectionIndex = paper.findIndex((section) => section.questionIds.includes(questionId));
    if (sectionIndex < 0) return res.status(400).json({ error: "That question is not on this paper" });

    // Sectional timing means a section that has been left is closed for good.
    const test = (attempt as any).test;
    if (test.sectionalTiming && sectionIndex !== attempt.currentSection) {
      return res.status(409).json({ error: "That section is closed" });
    }

    const question = await prisma.aptitudeQuestion.findUnique({ where: { id: questionId }, select: { answer: true, options: true } });
    if (!question) return res.status(404).json({ error: "Question not found" });

    const raw = body["selected"];
    const selected = raw === null || raw === undefined ? null : Number(raw);
    if (selected !== null && (!Number.isInteger(selected) || selected < 0 || selected >= (question.options as string[]).length)) {
      return res.status(400).json({ error: "selected must index one of the options, or be null" });
    }
    const marked = typeof body["marked"] === "boolean" ? (body["marked"] as boolean) : undefined;
    const timeSecRaw = Number(body["timeSec"]);
    const timeSec = Number.isInteger(timeSecRaw) && timeSecRaw >= 0 ? Math.min(timeSecRaw, 7200) : undefined;

    const correct = selected !== null && selected === question.answer;
    await prisma.mockAnswer.upsert({
      where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
      create: { attemptId: attempt.id, questionId, sectionIndex, selected, correct, marked: marked ?? false, timeSec: timeSec ?? 0 },
      update: { selected, correct, ...(marked === undefined ? {} : { marked }), ...(timeSec === undefined ? {} : { timeSec }) },
    });

    res.json({ saved: true });
  } catch (error: any) {
    console.error("Mock answer error:", error?.message);
    res.status(500).json({ error: "Could not save your answer" });
  }
});

/* ── coding sections ──────────────────────────────────────────────── */

/**
 * Resolves a coding problem inside a live sitting, or the reason it cannot be
 * touched. Every coding endpoint starts here so the rules are stated once.
 */
type CodingContext =
  | { ok: false; status: number; message: string }
  | { ok: true; attempt: NonNullable<AttemptRow>; sectionIndex: number; problem: any; marks: number };

async function codingContext(attemptId: string, userId: string, problemId: string): Promise<CodingContext> {
  const refuse = (status: number, message: string): CodingContext => ({ ok: false, status, message });

  const attempt = await loadOwnAttempt(attemptId, userId);
  if (!attempt) return refuse(404, "Attempt not found");
  if (attempt.status !== "in-progress") return refuse(409, "This attempt is already closed");

  const test = (attempt as any).test;
  const paper = attempt.paper as unknown as PaperSection[];
  const sectionIndex = paper.findIndex((s) => s.kind === "coding" && s.questionIds.includes(problemId));
  if (sectionIndex < 0) return refuse(400, "That problem is not on this paper");
  if (test.sectionalTiming && sectionIndex !== attempt.currentSection) return refuse(409, "That section is closed");

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { testCases: { orderBy: { orderIndex: "asc" } } },
  });
  if (!problem) return refuse(404, "Problem not found");
  return { ok: true, attempt, sectionIndex, problem, marks: paper[sectionIndex].marksPerQuestion ?? 1 };
}

/** Compiles and runs one submission against the given cases, in one batch. */
async function judge(problem: any, code: string, language: string, cases: Array<{ input: string; expectedOutput: string }>) {
  const driver = problem.signature ? buildDriver(language as DriverLanguage, problem.signature as Signature, code) : null;
  const batch = await runBatch(
    driver ? driver.code : code,
    language,
    cases.map((c) => ({ input: c.input, expectedOutput: c.expectedOutput })),
    { timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb }
  );
  const passed = batch.perCase.filter((r) => r.passed).length;
  const firstFailure = batch.perCase.find((r) => !r.passed);
  return {
    batch,
    passed,
    verdict: firstFailure ? firstFailure.verdict : "ACCEPTED",
    error: firstFailure
      ? remapDiagnostics((firstFailure.compile_output || firstFailure.stderr || "").trim() || null, driver ? driver.toEditorLine : null)
      : null,
  };
}

/**
 * PUT /api/tests/attempts/:id/code
 * Body: { problemId, language, code, timeSec? }. Autosave for the editor.
 * Deliberately writes to the attempt, never to CodeDraft: a sitting must not
 * overwrite the draft the candidate has in ordinary practice.
 */
router.put("/attempts/:id/code", requireAuth, async (req: any, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const problemId = String(body["problemId"] ?? "");
    const context = await codingContext(req.params.id, req.user.userId, problemId);
    if (!context.ok) return res.status(context.status).json({ error: context.message });

    const language = String(body["language"] ?? "python");
    if (!LANGUAGE_MAP[language]) return res.status(400).json({ error: "Unsupported language" });
    const code = typeof body["code"] === "string" ? (body["code"] as string).slice(0, 200_000) : "";
    const timeSecRaw = Number(body["timeSec"]);
    const timeSec = Number.isInteger(timeSecRaw) && timeSecRaw >= 0 ? Math.min(timeSecRaw, 14400) : undefined;

    await prisma.mockCodeAnswer.upsert({
      where: { attemptId_problemId: { attemptId: context.attempt.id, problemId } },
      create: { attemptId: context.attempt.id, problemId, sectionIndex: context.sectionIndex, language, code, timeSec: timeSec ?? 0 },
      update: { language, code, ...(timeSec === undefined ? {} : { timeSec }) },
    });
    res.json({ saved: true });
  } catch (error: any) {
    console.error("Mock code save error:", error?.message);
    res.status(500).json({ error: "Could not save your code" });
  }
});

/**
 * POST /api/tests/attempts/:id/run
 * Body: { problemId, language, code }. Runs the visible cases only, exactly
 * as an assessment platform's Run button does. Nothing is graded here.
 */
router.post("/attempts/:id/run", requireAuth, async (req: any, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const problemId = String(body["problemId"] ?? "");
    const context = await codingContext(req.params.id, req.user.userId, problemId);
    if (!context.ok) return res.status(context.status).json({ error: context.message });

    const language = String(body["language"] ?? "python");
    if (!LANGUAGE_MAP[language]) return res.status(400).json({ error: "Unsupported language" });
    const code = String(body["code"] ?? "");
    const visible = context.problem.testCases.filter((c: any) => !c.isHidden);
    if (!visible.length) return res.json({ results: [], verdict: "ACCEPTED", passed: 0, total: 0 });

    const result = await judge(context.problem, code, language, visible);
    res.json({
      verdict: result.verdict,
      passed: result.passed,
      total: visible.length,
      error: result.error,
      runtimeMs: result.batch.runtimeMs,
      results: result.batch.perCase.map((row, i) => ({
        input: visible[i].input,
        expected: visible[i].expectedOutput,
        actual: row.actualOutput ?? "",
        passed: row.passed,
        verdict: row.verdict,
      })),
    });
  } catch (error: any) {
    if (isEngineDown(error)) return res.status(503).json({ error: ENGINE_DOWN_MESSAGE });
    console.error("Mock run error:", error?.message);
    res.status(500).json({ error: "Could not run your code" });
  }
});

/**
 * POST /api/tests/attempts/:id/submit-code
 * Body: { problemId, language, code }. Runs every case and records the result.
 * The candidate is told how many cases passed, which is what these platforms
 * report, but never which hidden case failed or what it contained.
 */
router.post("/attempts/:id/submit-code", requireAuth, async (req: any, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const problemId = String(body["problemId"] ?? "");
    const context = await codingContext(req.params.id, req.user.userId, problemId);
    if (!context.ok) return res.status(context.status).json({ error: context.message });

    const language = String(body["language"] ?? "python");
    if (!LANGUAGE_MAP[language]) return res.status(400).json({ error: "Unsupported language" });
    const code = String(body["code"] ?? "");
    const cases = context.problem.testCases;
    if (!cases.length) return res.status(503).json({ error: "This problem has no test cases" });

    const result = await judge(context.problem, code, language, cases);
    const existing = await prisma.mockCodeAnswer.findUnique({
      where: { attemptId_problemId: { attemptId: context.attempt.id, problemId } },
    });

    // The best run stands, so a candidate who experiments after solving it
    // cannot lose marks they have already earned.
    const better = !existing || result.passed >= existing.passedCases;
    await prisma.mockCodeAnswer.upsert({
      where: { attemptId_problemId: { attemptId: context.attempt.id, problemId } },
      create: {
        attemptId: context.attempt.id,
        problemId,
        sectionIndex: context.sectionIndex,
        language,
        code,
        verdict: result.verdict,
        passedCases: result.passed,
        totalCases: cases.length,
        runtimeMs: result.batch.runtimeMs,
        memoryKb: result.batch.memoryKb,
        submissions: 1,
      },
      update: {
        language,
        code,
        submissions: { increment: 1 },
        ...(better
          ? {
              verdict: result.verdict,
              passedCases: result.passed,
              totalCases: cases.length,
              runtimeMs: result.batch.runtimeMs,
              memoryKb: result.batch.memoryKb,
            }
          : {}),
      },
    });

    res.json({
      verdict: result.verdict,
      passed: result.passed,
      total: cases.length,
      marks: codingMarks(result.passed, cases.length, context.marks),
      maxMarks: context.marks,
      error: result.error,
      runtimeMs: result.batch.runtimeMs,
      memoryKb: result.batch.memoryKb,
    });
  } catch (error: any) {
    if (isEngineDown(error)) return res.status(503).json({ error: ENGINE_DOWN_MESSAGE });
    console.error("Mock code submit error:", error?.message);
    res.status(500).json({ error: "Could not submit your code" });
  }
});

/**
 * POST /api/tests/attempts/:id/section
 * Body: { index }. Leaves the current section for another. On a sectionally
 * timed paper only the next one is reachable and the move is final.
 */
router.post("/attempts/:id/section", requireAuth, async (req: any, res) => {
  try {
    const attempt = await loadOwnAttempt(req.params.id, req.user.userId);
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    if (attempt.status !== "in-progress") return res.status(409).json({ error: "This attempt is already closed" });

    const test = (attempt as any).test;
    const paper = attempt.paper as unknown as PaperSection[];
    const target = Number((req.body ?? {})["index"]);
    if (!Number.isInteger(target) || target < 0 || target >= paper.length) {
      return res.status(400).json({ error: "No such section" });
    }

    if (test.sectionalTiming) {
      if (target !== attempt.currentSection + 1) return res.status(409).json({ error: "Sections must be taken in order" });
    }

    const now = new Date();
    const endsAt = test.sectionalTiming
      ? new Date(Math.min(now.getTime() + paper[target].durationSec * 1000, attempt.expiresAt.getTime()))
      : null;
    await prisma.mockAttempt.update({
      where: { id: attempt.id },
      data: { currentSection: target, sectionEndsAt: endsAt },
    });
    res.json({ index: target });
  } catch (error: any) {
    console.error("Mock section move error:", error?.message);
    res.status(500).json({ error: "Could not move to that section" });
  }
});

/**
 * POST /api/tests/attempts/:id/submit
 * Ends the sitting and grades it.
 */
router.post("/attempts/:id/submit", requireAuth, async (req: any, res) => {
  try {
    const attempt = await prisma.mockAttempt.findFirst({ where: { id: req.params.id, userId: req.user.userId } });
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    // Already-closed sittings come back untouched, so a resubmit is harmless.
    const finished = await finishAttempt(attempt.id, "submitted");
    res.json({ attemptId: attempt.id, status: finished?.status ?? attempt.status });
  } catch (error: any) {
    console.error("Mock submit error:", error?.message);
    res.status(500).json({ error: "Could not submit the test" });
  }
});

/**
 * GET /api/tests/attempts/:id/result
 * The scorecard and the full review. This is the only place a key is served,
 * and only for a closed sitting.
 */
router.get("/attempts/:id/result", requireAuth, async (req: any, res) => {
  try {
    const attempt = await loadOwnAttempt(req.params.id, req.user.userId);
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    if (attempt.status === "in-progress") return res.status(409).json({ error: "This attempt is still running" });

    const test = (attempt as any).test;
    const paper = attempt.paper as unknown as PaperSection[];
    const mcqIds = paper.filter((s) => s.kind !== "coding").flatMap((s) => s.questionIds);
    const problemIds = paper.filter((s) => s.kind === "coding").flatMap((s) => s.questionIds);
    const [questions, answers, problems, codeRows] = await Promise.all([
      prisma.aptitudeQuestion.findMany({
        where: { id: { in: mcqIds } },
        select: { id: true, slug: true, title: true, prompt: true, options: true, answer: true, solution: true, approach: true, topic: true, difficulty: true },
      }),
      prisma.mockAnswer.findMany({ where: { attemptId: attempt.id } }),
      problemIds.length
        ? prisma.problem.findMany({
            where: { id: { in: problemIds } },
            select: { id: true, slug: true, title: true, difficulty: true, tags: true, editorial: true, _count: { select: { testCases: true } } },
          })
        : Promise.resolve([]),
      problemIds.length ? prisma.mockCodeAnswer.findMany({ where: { attemptId: attempt.id } }) : Promise.resolve([]),
    ]);
    const byId = new Map(questions.map((q) => [q.id, q]));
    const answerById = new Map(answers.map((row) => [row.questionId, row]));
    const problemById = new Map(problems.map((p) => [p.id, p]));
    const codeById = new Map(codeRows.map((row) => [row.problemId, row]));

    // Where the marks actually went, so the candidate knows what to drill.
    const perTopic = new Map<string, { total: number; correct: number }>();
    for (const id of mcqIds) {
      const question = byId.get(id);
      if (!question) continue;
      const row = perTopic.get(question.topic) ?? { total: 0, correct: 0 };
      row.total += 1;
      if (answerById.get(id)?.correct) row.correct += 1;
      perTopic.set(question.topic, row);
    }

    res.json({
      attempt: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        score: attempt.score,
        maxScore: attempt.maxScore,
        percent: attempt.maxScore ? Math.round(((attempt.score ?? 0) / attempt.maxScore) * 100) : null,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        skippedCount: attempt.skippedCount,
        sectionScores: attempt.sectionScores,
      },
      test: { slug: test.slug, name: test.name, company: test.company, negativeMark: test.negativeMark, totalQuestions: test.totalQuestions },
      topics: [...perTopic.entries()]
        .map(([id, row]) => ({ id, label: aptitudeTopic(id)?.label ?? id, ...row, percent: Math.round((row.correct / row.total) * 100) }))
        .sort((a, b) => a.percent - b.percent),
      sections: paper.map((section, index) => ({
        index,
        key: section.key,
        name: section.name,
        kind: section.kind ?? "mcq",
        questions:
          section.kind === "coding"
            ? []
            : section.questionIds
                .map((id, position) => {
                  const question = byId.get(id);
                  if (!question) return null;
                  const row = answerById.get(id);
                  return {
                    number: position + 1,
                    slug: question.slug,
                    title: question.title,
                    prompt: question.prompt,
                    options: question.options,
                    answer: question.answer,
                    solution: question.solution,
                    approach: question.approach,
                    topic: question.topic,
                    topicLabel: aptitudeTopic(question.topic)?.label ?? question.topic,
                    difficulty: question.difficulty,
                    selected: row?.selected ?? null,
                    correct: Boolean(row?.correct),
                    timeSec: row?.timeSec ?? 0,
                  };
                })
                .filter(Boolean),
        // A coding section reviews as what was written and how far it got.
        problems:
          section.kind === "coding"
            ? section.questionIds
                .map((id, position) => {
                  const problem = problemById.get(id);
                  if (!problem) return null;
                  const row = codeById.get(id);
                  const total = row?.totalCases || problem._count.testCases;
                  return {
                    number: position + 1,
                    slug: problem.slug,
                    title: problem.title,
                    difficulty: problem.difficulty,
                    tags: problem.tags,
                    hasEditorial: Boolean(problem.editorial),
                    language: row?.language ?? null,
                    code: row?.code ?? null,
                    verdict: row?.verdict ?? null,
                    passedCases: row?.passedCases ?? 0,
                    totalCases: total,
                    submissions: row?.submissions ?? 0,
                    runtimeMs: row?.runtimeMs ?? null,
                    marks: codingMarks(row?.passedCases ?? 0, total, section.marksPerQuestion ?? 1),
                    maxMarks: section.marksPerQuestion ?? 1,
                    timeSec: row?.timeSec ?? 0,
                  };
                })
                .filter(Boolean)
            : [],
      })),
    });
  } catch (error: any) {
    console.error("Mock result error:", error?.message);
    res.status(500).json({ error: "Could not load the result" });
  }
});

/**
 * GET /api/tests/me/history
 * Every sitting the candidate has taken.
 */
router.get("/me/history", requireAuth, async (req: any, res) => {
  try {
    const rows = await prisma.mockAttempt.findMany({
      where: { userId: req.user.userId },
      orderBy: { startedAt: "desc" },
      take: 40,
      include: { test: { select: { slug: true, name: true, company: true } } },
    });
    res.json({
      attempts: rows.map((row) => ({
        id: row.id,
        status: row.status,
        testSlug: row.test.slug,
        testName: row.test.name,
        company: row.test.company,
        score: row.score,
        maxScore: row.maxScore,
        percent: row.maxScore ? Math.round(((row.score ?? 0) / row.maxScore) * 100) : null,
        startedAt: row.startedAt,
        submittedAt: row.submittedAt,
      })),
    });
  } catch (error: any) {
    console.error("Mock history error:", error?.message);
    res.status(500).json({ error: "Could not load your test history" });
  }
});

export default router;

import { Router, type RequestHandler } from "express";
import { prisma } from "../lib/prisma.js";
import { isDuplicateKey } from "../lib/seat-claim.js";
import { adminOnly, optionalAuth, requireAuth } from "../middleware/auth.js";
import { executionLimiter } from "../middleware/rate-limit.js";
import { attemptClock, codingMarks, drawPaper, type DrawableQuestion, type DrawRule, type PaperSection, type SectionPlan } from "../lib/mock-tests.js";
import { isJudgeLanguage } from "../lib/judge0.js";
import { codeProblem, judgeArena, judgeCode } from "../lib/assessment-judge.js";
import { ENGINE_DOWN_MESSAGE, isEngineDown } from "../lib/engine-error.js";
import { cached, cachedShared } from "../lib/cache.js";
import { browserCache } from "../lib/http-cache.js";
import { similarity } from "../lib/code-similarity.js";
import { credentialName, isSkillLevel, LEVEL_LABEL, skillDef, skillTopic, SKILLS } from "../lib/skill-catalog.js";
import {
  bandFor,
  BREACH_LIMIT,
  breachCausesOf,
  credentialStatus,
  flagsFor,
  isCorrectSelection,
  isSignalKind,
  nextSittingAt,
  normalizeCredentialCode,
  parseSelection,
  percentOf,
  recordBreach,
  SIGNAL_CAP,
  type Signals,
} from "../lib/skill-tests.js";
import { codingPool } from "../services/aptitude-bank.js";
import { issueCredential, poolTopics, setRevoked, setWornCredential, verifyCredential, type IssueOutcome } from "../services/skill-credentials.js";

/**
 * Skill tests: one skill at one level, sat like a placement test and graded
 * into a credential.
 *
 * The sitting rules are the placement engine's (lib/mock-tests.ts: a paper
 * drawn per sitting, deadlines the server owns, sections in order — the
 * comments in routes/mock-tests.ts explain each), and the coding judge is
 * shared (lib/assessment-judge.ts). What differs, and why this is its own
 * router over its own tables:
 *
 *  - The multiple-choice questions come from a private bank (SkillQuestion)
 *    and **the key never leaves the server**: not while the sitting runs
 *    and not in the result, which breaks the score down by topic instead.
 *    A credential is worth what a stranger cannot look up, and a review
 *    page per sitting would publish the bank one candidate at a time.
 *  - A question may have several correct options, scored all-or-nothing.
 *  - A language test's coding section accepts only that language.
 *  - The runner reports integrity signals; grading turns them, and how
 *    closely the code matches the published editorial, into flags.
 *  - The sitting is proctored: leaving the screen is a breach, and the
 *    BREACH_LIMIT-th ends it as "terminated" — graded, never passed.
 *  - A passing sitting issues (or raises) a SkillCredential.
 *  - A closed sitting starts a cooldown before the next.
 */
const router = Router();

const activeAttemptKey = (userId: string, testId: string) => `${userId}:${testId}`;

/** The columns an attempt's handlers touch of its test. */
const ATTEMPT_TEST_SELECT = {
  id: true,
  slug: true,
  title: true,
  skill: true,
  level: true,
  languages: true,
  passPercent: true,
  distinctionPercent: true,
  validityMonths: true,
} as const;

type AttemptWithTest = NonNullable<Awaited<ReturnType<typeof prisma.skillAttempt.findFirst>>> & {
  test: { id: string; slug: string; title: string; skill: string; level: string; languages: unknown; passPercent: number; distinctionPercent: number; validityMonths: number };
};

/** Skill tests are always sectionally timed: a section left is closed. */
const SECTIONAL = true;

const publicCatalogueCache = browserCache(120);
const cacheWhenAnonymous: RequestHandler = (req, res, next) => (req.user ? next() : publicCatalogueCache(req, res, next));

const QUESTION_TTL_MS = 15 * 60_000;

const languagesOf = (test: { languages: unknown }): string[] => (Array.isArray(test.languages) ? (test.languages as unknown[]).map(String) : []);

const sectionPlans = (sections: Array<{ key: string; name: string; orderIndex: number; durationSec: number; questionCount: number; instructions: string | null; kind: string; marksPerQuestion: number; blueprint: unknown }>): SectionPlan[] =>
  sections.map((section) => ({
    key: section.key,
    name: section.name,
    orderIndex: section.orderIndex,
    durationSec: section.durationSec,
    questionCount: section.questionCount,
    instructions: section.instructions,
    kind: section.kind === "coding" ? "coding" : "mcq",
    marksPerQuestion: section.marksPerQuestion,
    blueprint: (section.blueprint ?? []) as unknown as DrawRule[],
  }));

/* ── seeded content, cached ───────────────────────────────────────── */

const testCatalogue = () =>
  cachedShared("skill:catalogue:v1", 600, () =>
    prisma.skillTest.findMany({
      where: { published: true },
      orderBy: [{ orderIndex: "asc" }],
      include: { sections: { orderBy: { orderIndex: "asc" } } },
    }),
  );

const testBySlug = (slug: string) =>
  cachedShared(`skill:test:v1:${slug}`, 600, () =>
    prisma.skillTest.findFirst({ where: { slug, published: true }, include: { sections: { orderBy: { orderIndex: "asc" } } } }),
  );

/**
 * The active bank's identities, shaped for drawPaper: a question's
 * `category` is its pool ("java:basic"), which is what an MCQ blueprint
 * rule pins, so a draw can never reach another skill or level.
 */
const questionIndex = (): Promise<DrawableQuestion[]> =>
  cachedShared("skill:bank-index:v1", 900, async () => {
    const rows = await prisma.skillQuestion.findMany({ where: { active: true }, select: { id: true, skill: true, level: true, topic: true } });
    return rows.map((row) => ({ id: row.id, topic: row.topic, category: `${row.skill}:${row.level}`, difficulty: row.level }));
  });

/** One question's key and option count — what every answer save checks against. */
const questionKey = (id: string) =>
  cached(`skill:question:v1:${id}`, QUESTION_TTL_MS, () => prisma.skillQuestion.findUnique({ where: { id }, select: { answer: true, options: true } }));

/* ── grading ──────────────────────────────────────────────────────── */

/**
 * Grades a sitting, closes it, and issues the credential it earned.
 * Idempotent like the placement grader: an already-closed sitting comes
 * back untouched, and the close is a guarded update so a submit racing an
 * expiry grades once.
 *
 * "terminated" is a sitting the proctoring ended (recordBreach): it is
 * graded, so the candidate sees where they stood, but its band is a fail
 * whatever the score — what was answered after looking elsewhere is not a
 * result — and it issues nothing. Its cooldown runs like any other's.
 */
async function finishAttempt(attemptId: string, reason: "submitted" | "expired" | "terminated") {
  const attempt = await prisma.skillAttempt.findUnique({
    where: { id: attemptId },
    include: { test: { select: ATTEMPT_TEST_SELECT }, answers: true, codeAnswers: true },
  });
  if (!attempt) return null;
  if (attempt.status !== "in-progress") return attempt;

  const paper = attempt.paper as unknown as PaperSection[];
  const mcqIds = paper.filter((s) => s.kind !== "coding").flatMap((s) => s.questionIds);
  const problemIds = paper.filter((s) => s.kind === "coding").flatMap((s) => s.questionIds);
  const [questions, problems] = await Promise.all([
    prisma.skillQuestion.findMany({ where: { id: { in: mcqIds } }, select: { id: true, answer: true, topic: true } }),
    problemIds.length ? prisma.problem.findMany({ where: { id: { in: problemIds } }, select: { id: true, title: true, solutions: true } }) : Promise.resolve([]),
  ]);
  const keyed = new Map(questions.map((q) => [q.id, q]));
  const problemById = new Map(problems.map((p) => [p.id, p]));
  const answers = new Map(attempt.answers.map((row) => [row.questionId, row]));
  const code = new Map(attempt.codeAnswers.map((row) => [row.problemId, row]));

  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let score = 0;
  let maxScore = 0;
  const perTopic = new Map<string, { total: number; correct: number }>();
  const similarities: Array<{ problemId: string; title: string; similarity: number }> = [];

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
      for (const problemId of section.questionIds) {
        const row = code.get(problemId);
        sectionTime += row?.timeSec ?? 0;
        if (!row || row.submissions === 0) sectionSkipped += 1;
        else if (row.totalCases > 0 && row.passedCases === row.totalCases) sectionCorrect += 1;
        else sectionWrong += 1;
        if (row) sectionScore += codingMarks(row.passedCases, row.totalCases, marks);
        // How much of the best code is the published editorial's.
        const problem = problemById.get(problemId);
        const reference = (problem?.solutions as Record<string, unknown> | null)?.[row?.language ?? ""];
        if (row && row.submissions > 0 && typeof reference === "string") {
          similarities.push({ problemId, title: problem!.title, similarity: similarity(row.code, reference, row.language) });
        }
      }
    } else {
      for (const questionId of section.questionIds) {
        const row = answers.get(questionId);
        const selected = Array.isArray(row?.selected) ? (row!.selected as number[]) : null;
        const answered = Boolean(selected && selected.length);
        const key = keyed.get(questionId);
        // Judged again here, against the key as it stands now: a question
        // corrected in the bank mid-sitting is graded on the correction.
        const correct = answered && key ? isCorrectSelection(selected, key.answer as number[]) : false;
        sectionTime += row?.timeSec ?? 0;
        if (!answered) sectionSkipped += 1;
        else if (correct) sectionCorrect += 1;
        else sectionWrong += 1;
        if (correct) sectionScore += marks;
        if (key) {
          const topic = perTopic.get(key.topic) ?? { total: 0, correct: 0 };
          topic.total += 1;
          if (correct) topic.correct += 1;
          perTopic.set(key.topic, topic);
        }
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
    };
  });

  const finalScore = Math.round(score * 100) / 100;
  const roundedMax = Math.round(maxScore * 100) / 100;
  const percent = percentOf(finalScore, roundedMax);
  const band = reason === "terminated" ? "fail" : bandFor(percent, attempt.test.passPercent, attempt.test.distinctionPercent);
  const flags = flagsFor((attempt.signals ?? {}) as Signals, similarities);
  const topicScores = [...perTopic.entries()].map(([topic, row]) => ({ topic, ...row }));
  // An expired paper closed when its time ran out, not when someone next
  // looked at it — the cooldown runs from the real end.
  const closedAt = reason === "expired" ? new Date(Math.min(Date.now(), attempt.expiresAt.getTime())) : new Date();

  const claimed = await prisma.skillAttempt.updateMany({
    where: { id: attemptId, status: "in-progress" },
    data: {
      status: reason,
      activeKey: null,
      submittedAt: closedAt,
      score: finalScore,
      maxScore: roundedMax,
      percent,
      band,
      correctCount,
      wrongCount,
      skippedCount,
      sectionScores,
      topicScores,
      flags,
    },
  });
  if (claimed.count === 0) {
    console.warn(`[skill-tests] attempt ${attemptId} was closed by a concurrent writer`);
  } else {
    if (similarities.length) {
      await Promise.all(
        similarities.map((s) =>
          prisma.skillCodeAnswer.updateMany({ where: { attemptId, problemId: s.problemId }, data: { similarity: s.similarity } }),
        ),
      );
    }
    if (band !== "fail") {
      try {
        await issueCredential({ userId: attempt.userId, test: attempt.test, attemptId, percent, band });
      } catch (err) {
        // The grade stands either way; a result read retries the issue.
        console.error(`[skill-tests] credential issue failed for ${attemptId}:`, (err as Error).message);
      }
    }
  }

  return prisma.skillAttempt.findUnique({ where: { id: attemptId }, include: { test: { select: ATTEMPT_TEST_SELECT }, answers: true } });
}

/** Brings a sitting up to date with the wall clock before anything reads it. */
async function syncAttempt(attempt: AttemptWithTest): Promise<AttemptWithTest> {
  if (attempt.status !== "in-progress") return attempt;
  const paper = attempt.paper as unknown as PaperSection[];
  const clock = attemptClock({ status: attempt.status, expiresAt: attempt.expiresAt, sectionEndsAt: attempt.sectionEndsAt, sectionalTiming: SECTIONAL });

  if (clock.paperExpired) return ((await finishAttempt(attempt.id, "expired")) as AttemptWithTest | null) ?? attempt;
  if (clock.sectionExpired) {
    const nextIndex = attempt.currentSection + 1;
    if (nextIndex >= paper.length) return ((await finishAttempt(attempt.id, "expired")) as AttemptWithTest | null) ?? attempt;
    const startedAt = attempt.sectionEndsAt ?? new Date();
    const endsAt = new Date(Math.min(startedAt.getTime() + paper[nextIndex]!.durationSec * 1000, attempt.expiresAt.getTime()));
    const updated = await prisma.skillAttempt.update({
      where: { id: attempt.id },
      data: { currentSection: nextIndex, sectionEndsAt: endsAt },
      include: { test: { select: ATTEMPT_TEST_SELECT } },
    });
    return syncAttempt(updated as AttemptWithTest);
  }
  return attempt;
}

async function loadOwnAttempt(id: string, userId: string): Promise<AttemptWithTest | null> {
  const attempt = await prisma.skillAttempt.findFirst({ where: { id, userId }, include: { test: { select: ATTEMPT_TEST_SELECT } } });
  if (!attempt) return null;
  return syncAttempt(attempt as AttemptWithTest);
}

/* ── the catalogue ────────────────────────────────────────────────── */

/** The caller's standing on each test: sittings, the live one, the cooldown, the credential. */
async function standingFor(userId: string | null, testIds: string[]) {
  if (!userId || testIds.length === 0) return new Map<string, ReturnType<typeof emptyStanding>>();
  const [attempts, credentials] = await Promise.all([
    prisma.skillAttempt.findMany({
      where: { userId, testId: { in: testIds } },
      orderBy: { startedAt: "desc" },
      select: { id: true, testId: true, status: true, percent: true, band: true, startedAt: true, submittedAt: true },
    }),
    prisma.skillCredential.findMany({
      where: { userId, testId: { in: testIds } },
      select: { testId: true, code: true, band: true, percent: true, issuedAt: true, expiresAt: true, revokedAt: true },
    }),
  ]);
  const out = new Map<string, ReturnType<typeof emptyStanding>>();
  for (const id of testIds) out.set(id, emptyStanding());
  for (const attempt of attempts) {
    const standing = out.get(attempt.testId)!;
    standing.attempts.push(attempt);
  }
  for (const credential of credentials) {
    const standing = out.get(credential.testId)!;
    standing.credential = {
      code: credential.code,
      band: credential.band,
      percent: credential.percent,
      issuedAt: credential.issuedAt,
      expiresAt: credential.expiresAt,
      status: credentialStatus(credential),
    };
  }
  return out;
}

const emptyStanding = () => ({
  attempts: [] as Array<{ id: string; status: string; percent: number | null; band: string | null; startedAt: Date; submittedAt: Date | null }>,
  credential: null as null | { code: string; band: string; percent: number; issuedAt: Date; expiresAt: Date; status: string },
});

function mineOf(standing: ReturnType<typeof emptyStanding> | undefined, cooldownDays: number) {
  if (!standing) return null;
  const live = standing.attempts.find((a) => a.status === "in-progress");
  const lastClosed = standing.attempts.find((a) => a.status !== "in-progress");
  const best = standing.attempts.reduce<number | null>((acc, a) => (a.percent != null && (acc == null || a.percent > acc) ? a.percent : acc), null);
  return {
    inProgressId: live?.id ?? null,
    nextSittingAt: live ? null : nextSittingAt(lastClosed?.submittedAt ?? null, cooldownDays),
    sittings: standing.attempts.filter((a) => a.status !== "in-progress").length,
    bestPercent: best,
    credential: standing.credential,
  };
}

const testSummary = (test: Awaited<ReturnType<typeof testCatalogue>>[number]) => ({
  slug: test.slug,
  skill: test.skill,
  level: test.level,
  levelLabel: isSkillLevel(test.level) ? LEVEL_LABEL[test.level] : test.level,
  title: test.title,
  blurb: test.blurb,
  durationSec: test.durationSec,
  totalQuestions: test.totalQuestions,
  passPercent: test.passPercent,
  distinctionPercent: test.distinctionPercent,
  cooldownDays: test.cooldownDays,
  validityMonths: test.validityMonths,
  languages: languagesOf(test),
  sections: test.sections.map((s) => ({ name: s.name, kind: s.kind, questionCount: s.questionCount, durationSec: s.durationSec })),
});

/**
 * GET /api/skill-tests
 * Every published test, grouped by skill, with the caller's standing.
 */
router.get("/", optionalAuth, cacheWhenAnonymous, async (req, res) => {
  const userId = req.user?.userId ?? null;
  const tests = await testCatalogue();
  const standing = await standingFor(userId, tests.map((t) => t.id));
  const skills = SKILLS.map((skill) => ({
    id: skill.id,
    label: skill.label,
    short: skill.short,
    blurb: skill.blurb,
    tests: tests
      .filter((t) => t.skill === skill.id)
      .map((t) => ({ ...testSummary(t), mine: userId ? mineOf(standing.get(t.id), t.cooldownDays) : null })),
  })).filter((skill) => skill.tests.length > 0);
  res.json({ skills });
});

/**
 * GET /api/skill-tests/:slug
 * One test for its instructions page: the rules, what it covers, and the
 * caller's sittings and credential.
 */
router.get("/:slug", optionalAuth, cacheWhenAnonymous, async (req, res) => {
  const slug = String(req.params["slug"]);
  const test = await testBySlug(slug);
  if (!test) return res.status(404).json({ error: "Test not found" });
  const userId = req.user?.userId ?? null;
  const [topics, standing] = await Promise.all([poolTopics(test.skill, test.level), standingFor(userId, [test.id])]);
  const def = skillDef(test.skill);
  res.json({
    test: {
      ...testSummary(test),
      skillLabel: def?.label ?? test.skill,
      instructions: test.instructions,
      sections: test.sections.map((s) => ({
        key: s.key,
        name: s.name,
        kind: s.kind,
        questionCount: s.questionCount,
        durationSec: s.durationSec,
        marksPerQuestion: s.marksPerQuestion,
        instructions: s.instructions,
      })),
      topics: topics.map((id) => ({ id, label: skillTopic(test.skill, id)?.label ?? id })),
      // The proctoring rule the page states before the clock starts.
      breachLimit: BREACH_LIMIT,
    },
    mine: userId
      ? {
          ...mineOf(standing.get(test.id), test.cooldownDays),
          attempts: (standing.get(test.id)?.attempts ?? []).slice(0, 10),
        }
      : null,
  });
});

/* ── sitting a test ───────────────────────────────────────────────── */

/**
 * POST /api/skill-tests/:slug/start
 * Draws a paper and starts the clock — or resumes the live sitting, or says
 * when the cooldown ends (429 with `nextSittingAt`).
 */
router.post("/:slug/start", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const test = await testBySlug(String(req.params["slug"]));
  if (!test) return res.status(404).json({ error: "Test not found" });

  const recent = await prisma.skillAttempt.findMany({
    where: { userId, testId: test.id },
    orderBy: { startedAt: "desc" },
    take: 2,
    select: { id: true, status: true, submittedAt: true },
  });
  const live = recent.find((a) => a.status === "in-progress");
  if (live) return res.json({ attemptId: live.id, resumed: true });
  const wait = nextSittingAt(recent.find((a) => a.status !== "in-progress")?.submittedAt ?? null, test.cooldownDays);
  if (wait) {
    return res.status(429).json({ error: `You can sit this test again on ${wait.toUTCString().slice(0, 16)}.`, nextSittingAt: wait });
  }

  const plans = sectionPlans(test.sections);
  const [pool, problems] = await Promise.all([questionIndex(), plans.some((p) => p.kind === "coding") ? codingPool() : Promise.resolve([])]);
  const { paper, shortfalls } = drawPaper(plans, pool, Math.random, problems);
  if (shortfalls.length) console.warn(`Skill test ${test.slug} drew short:`, shortfalls.map((s) => `${s.key} -${s.missing}`).join(", "));
  // A certification paper is never sat short: a missing question is marks
  // the candidate could not earn.
  if (shortfalls.length || !paper.every((section) => section.questionIds.length > 0)) {
    return res.status(503).json({ error: "This test cannot be sat right now. Please try again later." });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + test.durationSec * 1000);
  const sectionEndsAt = new Date(Math.min(now.getTime() + paper[0]!.durationSec * 1000, expiresAt.getTime()));
  try {
    const attempt = await prisma.skillAttempt.create({
      data: { userId, testId: test.id, activeKey: activeAttemptKey(userId, test.id), startedAt: now, expiresAt, sectionEndsAt, currentSection: 0, paper: paper as any },
      select: { id: true },
    });
    res.status(201).json({ attemptId: attempt.id, resumed: false });
  } catch (err) {
    if (!isDuplicateKey(err)) throw err;
    const running = await prisma.skillAttempt.findFirst({ where: { userId, testId: test.id, status: "in-progress" }, select: { id: true } });
    if (!running) return res.status(409).json({ error: "That sitting just ended. Start it again." });
    res.json({ attemptId: running.id, resumed: true });
  }
});

/**
 * GET /api/skill-tests/attempts/:id
 * The live state: the current section's questions, the saved answers, the
 * clock. Never the key.
 */
router.get("/attempts/:id", requireAuth, async (req, res) => {
  const attempt = await loadOwnAttempt(String(req.params["id"]), req.user!.userId);
  if (!attempt) return res.status(404).json({ error: "Attempt not found" });
  const test = attempt.test;
  if (attempt.status !== "in-progress") {
    return res.json({ status: attempt.status, finished: true, attemptId: attempt.id, testSlug: test.slug });
  }

  const paper = attempt.paper as unknown as PaperSection[];
  const index = Math.min(attempt.currentSection, paper.length - 1);
  const section = paper[index]!;
  const coding = section.kind === "coding";

  const [questions, answers, problems, codeRows] = await Promise.all([
    coding ? Promise.resolve([]) : prisma.skillQuestion.findMany({ where: { id: { in: section.questionIds } }, select: { id: true, prompt: true, options: true, kind: true, topic: true } }),
    prisma.skillAnswer.findMany({ where: { attemptId: attempt.id }, select: { questionId: true, selected: true, marked: true } }),
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
            testCases: { where: { isHidden: false }, orderBy: { orderIndex: "asc" }, select: { input: true, expectedOutput: true } },
          },
        })
      : Promise.resolve([]),
    coding
      ? prisma.skillCodeAnswer.findMany({
          where: { attemptId: attempt.id },
          select: { problemId: true, language: true, code: true, verdict: true, passedCases: true, totalCases: true, submissions: true, runtimeMs: true, memoryKb: true },
        })
      : Promise.resolve([]),
  ]);
  const byId = new Map(questions.map((q) => [q.id, q]));
  const problemById = new Map(problems.map((p) => [p.id, p]));
  const codeById = new Map(codeRows.map((row) => [row.problemId, row]));
  const clock = attemptClock({ status: attempt.status, expiresAt: attempt.expiresAt, sectionEndsAt: attempt.sectionEndsAt, sectionalTiming: SECTIONAL });

  res.json({
    attemptId: attempt.id,
    status: attempt.status,
    finished: false,
    test: {
      slug: test.slug,
      title: test.title,
      skill: test.skill,
      skillLabel: skillDef(test.skill)?.label ?? test.skill,
      level: test.level,
      languages: languagesOf(test),
    },
    sections: paper.map((s, i) => ({ key: s.key, name: s.name, kind: s.kind ?? "mcq", questionCount: s.questionIds.length, index: i, done: i < index })),
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
              return { number: position + 1, questionId: question.id, prompt: question.prompt, options: question.options, multi: question.kind === "multi", topic: question.topic };
            })
            .filter(Boolean),
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
                  ? { verdict: saved.verdict, passedCases: saved.passedCases, totalCases: saved.totalCases, submissions: saved.submissions, runtimeMs: saved.runtimeMs, memoryKb: saved.memoryKb }
                  : null,
              };
            })
            .filter(Boolean)
        : [],
    },
    answers: answers.map((row) => ({ questionId: row.questionId, selected: Array.isArray(row.selected) ? row.selected : [], marked: row.marked })),
    clock: { paperRemainingSec: clock.paperRemainingSec, sectionRemainingSec: clock.sectionRemainingSec, serverTime: Date.now() },
    // The server's count, so a reload cannot hand back fresh warnings.
    integrity: { breaches: ((attempt.signals ?? {}) as Signals).breaches ?? 0, limit: BREACH_LIMIT },
  });
});

/**
 * PUT /api/skill-tests/attempts/:id/answer
 * Body: { questionId, selected: number[] | number | null, marked?, timeSec? }.
 */
router.put("/attempts/:id/answer", requireAuth, async (req, res) => {
  const attempt = await loadOwnAttempt(String(req.params["id"]), req.user!.userId);
  if (!attempt) return res.status(404).json({ error: "Attempt not found" });
  if (attempt.status !== "in-progress") return res.status(409).json({ error: "This attempt is already closed" });

  const paper = attempt.paper as unknown as PaperSection[];
  const body = (req.body ?? {}) as Record<string, unknown>;
  const questionId = String(body["questionId"] ?? "");
  const sectionIndex = paper.findIndex((section) => section.kind !== "coding" && section.questionIds.includes(questionId));
  if (sectionIndex < 0) return res.status(400).json({ error: "That question is not on this paper" });
  if (sectionIndex !== attempt.currentSection) return res.status(409).json({ error: "That section is closed" });

  const question = await questionKey(questionId);
  if (!question) return res.status(404).json({ error: "Question not found" });
  const selection = parseSelection(body["selected"], (question.options as unknown[]).length);
  if (selection === "invalid") return res.status(400).json({ error: "selected must name options on this question, or be null" });
  const marked = typeof body["marked"] === "boolean" ? (body["marked"] as boolean) : undefined;
  const timeSecRaw = Number(body["timeSec"]);
  const timeSec = Number.isInteger(timeSecRaw) && timeSecRaw >= 0 ? Math.min(timeSecRaw, 7200) : undefined;
  const correct = isCorrectSelection(selection, question.answer as number[]);

  await prisma.skillAnswer.upsert({
    select: { id: true },
    where: { attemptId_questionId: { attemptId: attempt.id, questionId } },
    create: { attemptId: attempt.id, questionId, sectionIndex, selected: selection ?? [], correct, marked: marked ?? false, timeSec: timeSec ?? 0 },
    update: { selected: selection ?? [], correct, ...(marked === undefined ? {} : { marked }), ...(timeSec === undefined ? {} : { timeSec }) },
  });
  res.json({ saved: true });
});

/* ── coding ───────────────────────────────────────────────────────── */

type CodingContext = { ok: false; status: number; message: string } | { ok: true; attempt: AttemptWithTest; sectionIndex: number; marks: number };

async function codingContext(attemptId: string, userId: string, problemId: string, language: string | null): Promise<CodingContext> {
  const refuse = (status: number, message: string): CodingContext => ({ ok: false, status, message });
  const attempt = await loadOwnAttempt(attemptId, userId);
  if (!attempt) return refuse(404, "Attempt not found");
  if (attempt.status !== "in-progress") return refuse(409, "This attempt is already closed");
  const paper = attempt.paper as unknown as PaperSection[];
  const sectionIndex = paper.findIndex((s) => s.kind === "coding" && s.questionIds.includes(problemId));
  if (sectionIndex < 0) return refuse(400, "That problem is not on this paper");
  if (sectionIndex !== attempt.currentSection) return refuse(409, "That section is closed");
  if (language !== null) {
    if (!isJudgeLanguage(language)) return refuse(400, "Unsupported language");
    const allowed = languagesOf(attempt.test);
    if (allowed.length && !allowed.includes(language)) return refuse(400, `This test's coding section must be answered in ${skillDef(attempt.test.skill)?.label ?? allowed.join(", ")}`);
  }
  return { ok: true, attempt, sectionIndex, marks: paper[sectionIndex]!.marksPerQuestion ?? 1 };
}

/** PUT /api/skill-tests/attempts/:id/code — the editor's autosave. */
router.put("/attempts/:id/code", requireAuth, async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const problemId = String(body["problemId"] ?? "");
  const language = String(body["language"] ?? "python");
  const context = await codingContext(String(req.params["id"]), req.user!.userId, problemId, language);
  if (!context.ok) return res.status(context.status).json({ error: context.message });
  const code = typeof body["code"] === "string" ? (body["code"] as string).slice(0, 200_000) : "";
  const timeSecRaw = Number(body["timeSec"]);
  const timeSec = Number.isInteger(timeSecRaw) && timeSecRaw >= 0 ? Math.min(timeSecRaw, 14400) : undefined;
  await prisma.skillCodeAnswer.upsert({
    select: { id: true },
    where: { attemptId_problemId: { attemptId: context.attempt.id, problemId } },
    create: { attemptId: context.attempt.id, problemId, sectionIndex: context.sectionIndex, language, code, timeSec: timeSec ?? 0 },
    update: { language, code, ...(timeSec === undefined ? {} : { timeSec }) },
  });
  res.json({ saved: true });
});

/** POST /api/skill-tests/attempts/:id/run — the visible cases only; nothing graded. */
router.post("/attempts/:id/run", requireAuth, executionLimiter, async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const refused = codeProblem(body["code"] ?? "");
    if (refused) return res.status(400).json({ error: refused });
    const problemId = String(body["problemId"] ?? "");
    const language = String(body["language"] ?? "python");
    const [context, arena] = await Promise.all([codingContext(String(req.params["id"]), req.user!.userId, problemId, language), judgeArena(problemId)]);
    if (!context.ok) return res.status(context.status).json({ error: context.message });
    if (!arena) return res.status(404).json({ error: "Problem not found" });
    const visible = arena.cases.filter((c) => !c.isHidden);
    if (!visible.length) return res.json({ results: [], verdict: "ACCEPTED", passed: 0, total: 0 });
    const result = await judgeCode(arena.problem, String(body["code"] ?? ""), language, visible);
    res.json({
      verdict: result.verdict,
      passed: result.passed,
      total: visible.length,
      error: result.error,
      runtimeMs: result.batch.runtimeMs,
      results: result.batch.perCase.map((row, i) => ({ input: visible[i]!.input, expected: visible[i]!.expectedOutput, actual: row.actualOutput ?? "", passed: row.passed, verdict: row.verdict })),
    });
  } catch (error) {
    if (isEngineDown(error)) return res.status(503).json({ error: ENGINE_DOWN_MESSAGE });
    throw error;
  }
});

/**
 * POST /api/skill-tests/attempts/:id/submit-code — every case; the best
 * submission per problem stands (the guarded update in routes/mock-tests.ts
 * explains why the comparison is in the WHERE).
 */
router.post("/attempts/:id/submit-code", requireAuth, executionLimiter, async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const refused = codeProblem(body["code"] ?? "");
    if (refused) return res.status(400).json({ error: refused });
    const problemId = String(body["problemId"] ?? "");
    const language = String(body["language"] ?? "python");
    const [context, arena] = await Promise.all([codingContext(String(req.params["id"]), req.user!.userId, problemId, language), judgeArena(problemId)]);
    if (!context.ok) return res.status(context.status).json({ error: context.message });
    if (!arena) return res.status(404).json({ error: "Problem not found" });
    const code = String(body["code"] ?? "");
    const cases = arena.cases;
    if (!cases.length) return res.status(503).json({ error: "This problem has no test cases" });

    const result = await judgeCode(arena.problem, code, language, cases);
    const key = { attemptId_problemId: { attemptId: context.attempt.id, problemId } };
    const best = { verdict: result.verdict, passedCases: result.passed, totalCases: cases.length, runtimeMs: result.batch.runtimeMs, memoryKb: result.batch.memoryKb };
    await prisma.$transaction([
      prisma.skillCodeAnswer.upsert({
        select: { id: true },
        where: key,
        create: { attemptId: context.attempt.id, problemId, sectionIndex: context.sectionIndex, language, code, submissions: 1, ...best },
        update: { language, code, submissions: { increment: 1 } },
      }),
      // The best run's code is what grading compares with the editorial, so
      // it moves with the score.
      prisma.skillCodeAnswer.updateMany({
        where: { attemptId: context.attempt.id, problemId, passedCases: { lte: result.passed } },
        data: best,
      }),
    ]);
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
  } catch (error) {
    if (isEngineDown(error)) return res.status(503).json({ error: ENGINE_DOWN_MESSAGE });
    throw error;
  }
});

/** POST /api/skill-tests/attempts/:id/section — Body: { index }. Only the next section; final. */
router.post("/attempts/:id/section", requireAuth, async (req, res) => {
  const attempt = await loadOwnAttempt(String(req.params["id"]), req.user!.userId);
  if (!attempt) return res.status(404).json({ error: "Attempt not found" });
  if (attempt.status !== "in-progress") return res.status(409).json({ error: "This attempt is already closed" });
  const paper = attempt.paper as unknown as PaperSection[];
  const target = Number((req.body ?? {})["index"]);
  if (!Number.isInteger(target) || target < 0 || target >= paper.length) return res.status(400).json({ error: "No such section" });
  if (target !== attempt.currentSection + 1) return res.status(409).json({ error: "Sections must be taken in order" });
  const endsAt = new Date(Math.min(Date.now() + paper[target]!.durationSec * 1000, attempt.expiresAt.getTime()));
  await prisma.skillAttempt.update({ where: { id: attempt.id }, data: { currentSection: target, sectionEndsAt: endsAt }, select: { id: true } });
  res.json({ index: target });
});

/**
 * POST /api/skill-tests/attempts/:id/signal — Body: { kind }.
 * The runner reports leaving the tab, a blocked paste, leaving full screen.
 * Counters only, capped; a read-modify-write is fine — two signals landing
 * together lose one count, which changes nothing a reviewer would decide.
 */
router.post("/attempts/:id/signal", requireAuth, async (req, res) => {
  const kind = (req.body ?? {})["kind"];
  if (!isSignalKind(kind)) return res.status(400).json({ error: "Unknown signal" });
  const attempt = await prisma.skillAttempt.findFirst({
    where: { id: String(req.params["id"]), userId: req.user!.userId, status: "in-progress" },
    select: { id: true, signals: true },
  });
  if (!attempt) return res.status(204).end();
  const signals = { ...((attempt.signals ?? {}) as Signals) };
  signals[kind] = Math.min(SIGNAL_CAP, (signals[kind] ?? 0) + 1);
  await prisma.skillAttempt.update({ where: { id: attempt.id }, data: { signals }, select: { id: true } });
  res.status(204).end();
});

/**
 * POST /api/skill-tests/attempts/:id/breach — Body: { causes: BreachCause[] }.
 * The sitting left the screen: one departure, whichever signals it fired
 * (the runner gathers them into one report). Counts it and, at the limit,
 * ends the sitting. Answers { breaches, limit, ended }; a sitting already
 * closed answers ended so the runner leaves for the result.
 *
 * A read-modify-write like /signal: departures are seconds apart (each needs
 * the candidate to come back first), so two never race in practice.
 */
router.post("/attempts/:id/breach", requireAuth, async (req, res) => {
  const causes = breachCausesOf((req.body ?? {})["causes"]);
  if (causes.length === 0) return res.status(400).json({ error: "Unknown breach" });
  const attempt = await loadOwnAttempt(String(req.params["id"]), req.user!.userId);
  if (!attempt) return res.status(404).json({ error: "Attempt not found" });
  if (attempt.status !== "in-progress") {
    return res.json({ breaches: ((attempt.signals ?? {}) as Signals).breaches ?? 0, limit: BREACH_LIMIT, ended: true });
  }
  const { signals, breaches, ended } = recordBreach((attempt.signals ?? {}) as Signals, causes);
  await prisma.skillAttempt.update({ where: { id: attempt.id }, data: { signals }, select: { id: true } });
  if (ended) await finishAttempt(attempt.id, "terminated");
  res.json({ breaches, limit: BREACH_LIMIT, ended });
});

/** POST /api/skill-tests/attempts/:id/submit — ends and grades the sitting. */
router.post("/attempts/:id/submit", requireAuth, async (req, res) => {
  const attempt = await prisma.skillAttempt.findFirst({ where: { id: String(req.params["id"]), userId: req.user!.userId }, select: { id: true, status: true } });
  if (!attempt) return res.status(404).json({ error: "Attempt not found" });
  const finished = await finishAttempt(attempt.id, "submitted");
  res.json({ attemptId: attempt.id, status: finished?.status ?? attempt.status });
});

/**
 * GET /api/skill-tests/attempts/:id/result
 * The scorecard: score, band, sections, topics with where to practise them,
 * the coding answers' outcomes, and the credential the sitting earned.
 * Deliberately no per-question review — see the header.
 */
router.get("/attempts/:id/result", requireAuth, async (req, res) => {
  const attempt = await loadOwnAttempt(String(req.params["id"]), req.user!.userId);
  if (!attempt) return res.status(404).json({ error: "Attempt not found" });
  if (attempt.status === "in-progress") return res.status(409).json({ error: "This sitting is still running" });
  const test = attempt.test;
  const paper = attempt.paper as unknown as PaperSection[];
  const problemIds = paper.filter((s) => s.kind === "coding").flatMap((s) => s.questionIds);

  let [credential, problems, codeRows] = await Promise.all([
    prisma.skillCredential.findUnique({
      where: { userId_testId: { userId: attempt.userId, testId: test.id } },
      select: { code: true, band: true, percent: true, attemptId: true, issuedAt: true, expiresAt: true, revokedAt: true },
    }),
    problemIds.length ? prisma.problem.findMany({ where: { id: { in: problemIds } }, select: { id: true, slug: true, title: true, difficulty: true } }) : Promise.resolve([]),
    problemIds.length ? prisma.skillCodeAnswer.findMany({ where: { attemptId: attempt.id }, select: { problemId: true, language: true, verdict: true, passedCases: true, totalCases: true, submissions: true } }) : Promise.resolve([]),
  ]);

  // A passing sitting whose issue failed at grading (a deadlock, a restart)
  // gets it now; issueCredential is idempotent.
  let issued: IssueOutcome = null;
  if (attempt.band && attempt.band !== "fail" && attempt.percent != null && (!credential || (credential.attemptId !== attempt.id && credential.percent < attempt.percent))) {
    issued = await issueCredential({ userId: attempt.userId, test, attemptId: attempt.id, percent: attempt.percent, band: attempt.band as "pass" | "distinction" }).catch(() => null);
    if (issued) {
      credential = await prisma.skillCredential.findUnique({
        where: { userId_testId: { userId: attempt.userId, testId: test.id } },
        select: { code: true, band: true, percent: true, attemptId: true, issuedAt: true, expiresAt: true, revokedAt: true },
      });
    }
  }

  const problemById = new Map(problems.map((p) => [p.id, p]));
  const codeById = new Map(codeRows.map((row) => [row.problemId, row]));
  const topics = ((attempt.topicScores ?? []) as Array<{ topic: string; total: number; correct: number }>)
    .map((row) => {
      const topic = skillTopic(test.skill, row.topic);
      return { id: row.topic, label: topic?.label ?? row.topic, total: row.total, correct: row.correct, percent: row.total ? Math.round((row.correct / row.total) * 100) : 0, practice: topic?.practice ?? null };
    })
    .sort((a, b) => a.percent - b.percent || b.total - a.total);
  const lastClosed = await prisma.skillAttempt.findFirst({
    where: { userId: attempt.userId, testId: test.id, status: { not: "in-progress" } },
    orderBy: { submittedAt: "desc" },
    select: { submittedAt: true },
  });
  const testRow = await testBySlug(test.slug);

  res.json({
    attempt: {
      id: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percent: attempt.percent,
      band: attempt.band,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      skippedCount: attempt.skippedCount,
      sectionScores: attempt.sectionScores,
      // How many times it left the screen — what a "terminated" result explains.
      breaches: ((attempt.signals ?? {}) as Signals).breaches ?? 0,
    },
    test: {
      slug: test.slug,
      title: test.title,
      skill: test.skill,
      skillLabel: skillDef(test.skill)?.label ?? test.skill,
      level: test.level,
      name: credentialName(test.skill, test.level),
      passPercent: test.passPercent,
      distinctionPercent: test.distinctionPercent,
    },
    topics,
    problems: problemIds
      .map((id) => {
        const problem = problemById.get(id);
        if (!problem) return null;
        const row = codeById.get(id);
        return { slug: problem.slug, title: problem.title, difficulty: problem.difficulty, language: row?.language ?? null, verdict: row?.verdict ?? null, passedCases: row?.passedCases ?? 0, totalCases: row?.totalCases ?? 0, submissions: row?.submissions ?? 0 };
      })
      .filter(Boolean),
    credential: credential
      ? {
          code: credential.code,
          band: credential.band,
          percent: credential.percent,
          fromThisSitting: credential.attemptId === attempt.id,
          issuedAt: credential.issuedAt,
          expiresAt: credential.expiresAt,
          status: credentialStatus(credential),
        }
      : null,
    nextSittingAt: testRow ? nextSittingAt(lastClosed?.submittedAt ?? null, testRow.cooldownDays) : null,
  });
});

/** GET /api/skill-tests/me/history — every sitting, newest first. */
router.get("/me/history", requireAuth, async (req, res) => {
  const rows = await prisma.skillAttempt.findMany({
    where: { userId: req.user!.userId },
    orderBy: { startedAt: "desc" },
    take: 40,
    select: { id: true, status: true, percent: true, band: true, startedAt: true, submittedAt: true, test: { select: { slug: true, title: true, skill: true, level: true } } },
  });
  res.json({ attempts: rows.map((row) => ({ id: row.id, status: row.status, percent: row.percent, band: row.band, startedAt: row.startedAt, submittedAt: row.submittedAt, test: row.test })) });
});

/* ── credentials ──────────────────────────────────────────────────── */

/**
 * GET /api/skill-tests/credentials/:code
 * The public verification read. Anyone, signed in or not; `isOwner` lets
 * the page offer the holder its own buttons.
 */
router.get("/credentials/:code", optionalAuth, async (req, res) => {
  const code = normalizeCredentialCode(req.params["code"]);
  if (!code) return res.status(404).json({ error: "No credential has that code" });
  const credential = await verifyCredential(code, req.user?.userId ?? null);
  if (!credential) return res.status(404).json({ error: "No credential has that code" });
  res.json({ credential });
});

/** PUT /api/skill-tests/me/worn — Body: { code: string | null }. Which credential's frame to wear. */
router.put("/me/worn", requireAuth, async (req, res) => {
  const raw = (req.body ?? {})["code"];
  const code = raw === null ? null : normalizeCredentialCode(raw);
  if (raw !== null && !code) return res.status(400).json({ error: "code must be a credential code or null" });
  const refused = await setWornCredential(req.user!.userId, code);
  if (refused) return res.status(400).json({ error: refused });
  res.json({ worn: code });
});

/* ── review (admins) ──────────────────────────────────────────────── */

/**
 * GET /api/skill-tests/admin/attempts?flagged=1
 * Recent graded sittings — the flagged ones when asked — with the signals
 * and the credential each touched, for a person to judge.
 */
router.get("/admin/attempts", requireAuth, adminOnly, async (req, res) => {
  const flaggedOnly = req.query["flagged"] === "1";
  // Flags are a Json list; filtering on "non-empty" is done here rather than
  // with a JSON predicate the MySQL adapter may or may not translate.
  const graded = await prisma.skillAttempt.findMany({
    where: { status: { not: "in-progress" } },
    orderBy: { submittedAt: "desc" },
    take: flaggedOnly ? 500 : 100,
    select: {
      id: true,
      status: true,
      percent: true,
      band: true,
      startedAt: true,
      submittedAt: true,
      signals: true,
      flags: true,
      test: { select: { slug: true, title: true } },
      user: { select: { id: true, name: true, username: true, email: true } },
      codeAnswers: { select: { problemId: true, language: true, passedCases: true, totalCases: true, similarity: true } },
    },
  });
  const rows = (flaggedOnly ? graded.filter((row) => Array.isArray(row.flags) && row.flags.length > 0) : graded).slice(0, 100);
  const credentials = await prisma.skillCredential.findMany({
    where: { attemptId: { in: rows.map((r) => r.id) } },
    select: { attemptId: true, code: true, band: true, revokedAt: true, revokedReason: true },
  });
  const byAttempt = new Map(credentials.map((c) => [c.attemptId, c]));
  res.json({ attempts: rows.map((row) => ({ ...row, credential: byAttempt.get(row.id) ?? null })) });
});

/** POST /api/skill-tests/admin/credentials/:code/revoke — Body: { reason }. */
router.post("/admin/credentials/:code/revoke", requireAuth, adminOnly, async (req, res) => {
  const code = normalizeCredentialCode(req.params["code"]);
  const reason = String((req.body ?? {})["reason"] ?? "").trim().slice(0, 500);
  if (!code) return res.status(404).json({ error: "No credential has that code" });
  if (!reason) return res.status(400).json({ error: "Say why it is being revoked" });
  if (!(await setRevoked(code, true, reason))) return res.status(404).json({ error: "No credential has that code" });
  res.json({ revoked: true });
});

/** POST /api/skill-tests/admin/credentials/:code/restore */
router.post("/admin/credentials/:code/restore", requireAuth, adminOnly, async (req, res) => {
  const code = normalizeCredentialCode(req.params["code"]);
  if (!code || !(await setRevoked(code, false, null))) return res.status(404).json({ error: "No credential has that code" });
  res.json({ restored: true });
});

export default router;

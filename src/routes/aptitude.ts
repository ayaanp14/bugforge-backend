import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { questionBySlug, questionIndex, topicOrder } from "../services/aptitude-bank.js";
import { cachedShared } from "../lib/cache.js";
import { browserCache } from "../lib/http-cache.js";
import { APTITUDE_CATEGORIES, APTITUDE_DIFFICULTIES, APTITUDE_TOPICS, aptitudeTopic, type AptitudeDifficulty } from "../lib/aptitude-topics.js";

/**
 * Aptitude preparation.
 *
 * The bank is read-only content (see scripts/seed-aptitude.ts); what a
 * candidate does with it is an AptitudeAttempt row per answer. Answers and
 * solutions leave the server only after an attempt — or on a question the
 * candidate has already attempted, so a revisit shows what they learned.
 */
const router = Router();

type Status = "new" | "attempted" | "solved";

/** A topic list arrives one page at a time; the client asks for the next by offset. */
const PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 50;

/**
 * The candidate's standing on every question they have touched.
 *
 * Two GROUP BYs — one row per question with its attempt count, and the subset
 * answered correctly at least once — rather than every attempt row the user
 * ever made, ordered, and reduced in JS. Both read the
 * (userId, questionId, createdAt) index and nothing else.
 */
async function progressFor(userId: string | null) {
  const byQuestion = new Map<string, { correct: boolean; attempts: number }>();
  if (!userId) return byQuestion;
  const [attempts, solvedRows] = await Promise.all([
    prisma.aptitudeAttempt.groupBy({ by: ["questionId"], where: { userId }, _count: { _all: true } }),
    prisma.aptitudeAttempt.groupBy({ by: ["questionId"], where: { userId, correct: true } }),
  ]);
  for (const row of attempts) byQuestion.set(row.questionId, { correct: false, attempts: row._count._all });
  for (const row of solvedRows) {
    const entry = byQuestion.get(row.questionId);
    if (entry) entry.correct = true;
  }
  return byQuestion;
}

const statusOf = (entry: { correct: boolean } | undefined): Status => (entry ? (entry.correct ? "solved" : "attempted") : "new");


/**
 * GET /api/aptitude/topics
 * The syllabus with question counts and, when signed in, progress per topic.
 */
router.get("/topics", optionalAuth, browserCache(120), async (req: any, res) => {
  try {
    const userId: string | null = req.user?.userId ?? null;
    const [questions, progress] = await Promise.all([questionIndex(), progressFor(userId)]);

    const perTopic = new Map<string, { total: number; byDifficulty: Record<AptitudeDifficulty, number>; solved: number; attempted: number }>();
    for (const topic of APTITUDE_TOPICS) perTopic.set(topic.id, { total: 0, byDifficulty: { easy: 0, medium: 0, hard: 0 }, solved: 0, attempted: 0 });
    let solved = 0;
    let attempted = 0;
    for (const q of questions) {
      const row = perTopic.get(q.topic);
      if (!row) continue;
      row.total += 1;
      if (q.difficulty in row.byDifficulty) row.byDifficulty[q.difficulty as AptitudeDifficulty] += 1;
      const status = statusOf(progress.get(q.id));
      if (status === "solved") {
        row.solved += 1;
        solved += 1;
      } else if (status === "attempted") {
        row.attempted += 1;
        attempted += 1;
      }
    }

    let correctAttempts = 0;
    let totalAttempts = 0;
    for (const entry of progress.values()) {
      totalAttempts += entry.attempts;
    }
    for (const entry of progress.values()) if (entry.correct) correctAttempts += 1;

    res.json({
      categories: APTITUDE_CATEGORIES.map((category) => ({
        ...category,
        topics: APTITUDE_TOPICS.filter((topic) => topic.category === category.id).map((topic) => ({ ...topic, ...perTopic.get(topic.id)! })),
      })),
      totals: {
        questions: questions.length,
        solved,
        attempted,
        // Questions got right at least once, over questions touched.
        accuracy: progress.size ? Math.round((correctAttempts / progress.size) * 100) : null,
        attempts: totalAttempts,
      },
    });
  } catch (error: any) {
    console.error("Aptitude topics error:", error?.message);
    res.status(500).json({ error: "Could not load the aptitude syllabus" });
  }
});

/**
 * GET /api/aptitude/questions?topic=&difficulty=&offset=&limit=
 * One page of a topic's questions, in order, without answers.
 *
 * A topic can run past fifty questions, so the list is paged: the client asks
 * for the next slice by offset. The progress figures cover the whole filtered
 * topic rather than the loaded page, so the "solved" count does not shrink to
 * whatever happens to be on screen.
 */
router.get("/questions", optionalAuth, browserCache(120), async (req: any, res) => {
  try {
    const topicId = typeof req.query.topic === "string" ? req.query.topic : "";
    const topic = aptitudeTopic(topicId);
    if (!topic) return res.status(404).json({ error: "Unknown topic" });
    const difficulty = APTITUDE_DIFFICULTIES.includes(req.query.difficulty) ? (req.query.difficulty as AptitudeDifficulty) : null;

    const limitRaw = Number(req.query.limit);
    const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, MAX_PAGE_SIZE) : PAGE_SIZE;
    const offsetRaw = Number(req.query.offset);
    const offset = Number.isInteger(offsetRaw) && offsetRaw > 0 ? offsetRaw : 0;

    const where = { topic: topic.id, ...(difficulty ? { difficulty } : {}) };
    const userId: string | null = req.user?.userId ?? null;
    // The slice itself is the same for everyone who asks for it; only the
    // status marks laid over it are the candidate's. Both halves are fetched
    // together so a signed-in reader still pays one round trip.
    const [page, attempts] = await Promise.all([
      cachedShared(`aptitude:page:v1:${topic.id}:${difficulty ?? "all"}:${offset}:${limit}`, 900, async () => {
        const [rows, total] = await Promise.all([
          prisma.aptitudeQuestion.findMany({
            where,
            orderBy: { orderIndex: "asc" },
            skip: offset,
            take: limit,
            select: { id: true, slug: true, title: true, difficulty: true, tags: true, timeTargetSec: true, orderIndex: true },
          }),
          prisma.aptitudeQuestion.count({ where }),
        ]);
        return { rows, total };
      }),
      // Scoped to this topic and level, so paging never widens the query.
      userId
        ? prisma.aptitudeAttempt.findMany({ where: { userId, question: where }, select: { questionId: true, correct: true } })
        : Promise.resolve([] as Array<{ questionId: string; correct: boolean }>),
    ]);
    const { rows, total } = page;

    const byQuestion = new Map<string, { correct: boolean; attempts: number }>();
    for (const attempt of attempts) {
      const entry = byQuestion.get(attempt.questionId) ?? { correct: false, attempts: 0 };
      entry.correct = entry.correct || attempt.correct;
      entry.attempts += 1;
      byQuestion.set(attempt.questionId, entry);
    }
    let solved = 0;
    for (const entry of byQuestion.values()) if (entry.correct) solved += 1;

    res.json({
      topic,
      category: APTITUDE_CATEGORIES.find((category) => category.id === topic.category) ?? null,
      questions: rows.map((row) => {
        const entry = byQuestion.get(row.id);
        return {
          slug: row.slug,
          title: row.title,
          difficulty: row.difficulty,
          tags: row.tags,
          timeTargetSec: row.timeTargetSec,
          status: statusOf(entry),
          attempts: entry?.attempts ?? 0,
        };
      }),
      page: { offset, limit, total, hasMore: offset + rows.length < total },
      progress: { total, solved, attempted: byQuestion.size - solved },
    });
  } catch (error: any) {
    console.error("Aptitude list error:", error?.message);
    res.status(500).json({ error: "Could not load the questions" });
  }
});

/**
 * GET /api/aptitude/questions/:slug
 * The question with its hints and neighbours. The answer and solution are
 * included only once the candidate has attempted it.
 */
router.get("/questions/:slug", optionalAuth, browserCache(120), async (req: any, res) => {
  try {
    const question = await questionBySlug(req.params.slug);
    if (!question) return res.status(404).json({ error: "Question not found" });
    const topic = aptitudeTopic(question.topic);

    const userId: string | null = req.user?.userId ?? null;
    const [siblings, attempts] = await Promise.all([
      // Every question in the topic, only to find the one either side of this
      // one. That ordering is fixed by orderIndex at seed time.
      topicOrder(question.topic),
      userId
        ? prisma.aptitudeAttempt.findMany({
            where: { userId, questionId: question.id },
            orderBy: { createdAt: "asc" },
            select: { selected: true, correct: true, timeSec: true, usedHints: true, createdAt: true },
          })
        : Promise.resolve([]),
    ]);
    const index = siblings.findIndex((s) => s.slug === question.slug);
    const solved = attempts.some((a) => a.correct);
    const revealed = attempts.length > 0;

    res.json({
      question: {
        slug: question.slug,
        topic: question.topic,
        topicLabel: topic?.label ?? question.topic,
        category: question.category,
        title: question.title,
        prompt: question.prompt,
        options: question.options,
        difficulty: question.difficulty,
        hints: question.hints,
        tags: question.tags,
        timeTargetSec: question.timeTargetSec,
      },
      position: { index: index + 1, total: siblings.length },
      neighbours: { prev: siblings[index - 1]?.slug ?? null, next: siblings[index + 1]?.slug ?? null },
      status: solved ? "solved" : revealed ? "attempted" : "new",
      attempts,
      // What the candidate already earned the right to see.
      reveal: revealed ? { answer: question.answer, solution: question.solution, approach: question.approach } : null,
    });
  } catch (error: any) {
    console.error("Aptitude question error:", error?.message);
    res.status(500).json({ error: "Could not load the question" });
  }
});

/**
 * POST /api/aptitude/questions/:slug/attempt
 * Body: { selected: number | null, timeSec?, usedHints? }. A null selection
 * is "show me the solution": recorded as an attempt that was not correct.
 */
router.post("/questions/:slug/attempt", requireAuth, async (req: any, res) => {
  try {
    const slug = String(req.params.slug);
    const userId: string = req.user.userId;
    // The question is seeded content and comes from the same shared cache the
    // detail page warms, so in the usual case this tier is only the count —
    // which reaches the question through its slug rather than waiting on the
    // row for an id. The attempt just recorded is then the count plus one,
    // instead of a third round trip to ask again.
    const [question, priorAttempts] = await Promise.all([
      questionBySlug(slug),
      prisma.aptitudeAttempt.count({ where: { userId, question: { slug } } }),
    ]);
    if (!question) return res.status(404).json({ error: "Question not found" });

    const body = (req.body ?? {}) as Record<string, unknown>;
    const options = question.options as string[];
    const selectedRaw = body["selected"];
    const selected = selectedRaw === null || selectedRaw === undefined ? null : Number(selectedRaw);
    if (selected !== null && (!Number.isInteger(selected) || selected < 0 || selected >= options.length)) {
      return res.status(400).json({ error: "selected must index one of the options, or be null" });
    }
    const timeSec = Number.isInteger(body["timeSec"]) && (body["timeSec"] as number) >= 0 ? Math.min(3600, body["timeSec"] as number) : null;
    const usedHints = Number.isInteger(body["usedHints"]) ? Math.max(0, Math.min(4, body["usedHints"] as number)) : 0;

    const correct = selected !== null && selected === question.answer;

    // The same answer to the same question inside a few seconds is a retry
    // — the response was lost on the way back and the client asked again —
    // not a second attempt. It used to become a second row, inflating the
    // attempt count and the topic stats.
    const recent = await prisma.aptitudeAttempt.findFirst({
      where: { userId, questionId: question.id, selected, createdAt: { gte: new Date(Date.now() - 10_000) } },
      select: { id: true },
    });
    if (!recent) {
      await prisma.aptitudeAttempt.create({
        data: { userId, questionId: question.id, selected, correct, timeSec, usedHints },
      });
    }

    res.status(201).json({
      correct,
      selected,
      answer: question.answer,
      solution: question.solution,
      approach: question.approach,
      attempts: recent ? priorAttempts : priorAttempts + 1,
    });
  } catch (error: any) {
    console.error("Aptitude attempt error:", error?.message);
    res.status(500).json({ error: "Could not record your answer" });
  }
});

/**
 * GET /api/aptitude/me
 * The candidate's recent attempts, for a "pick up where you left off" strip.
 */
router.get("/me", requireAuth, async (req: any, res) => {
  try {
    const rows = await prisma.aptitudeAttempt.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { question: { select: { slug: true, title: true, topic: true, difficulty: true } } },
    });
    res.json({
      recent: rows.map((row) => ({
        slug: row.question.slug,
        title: row.question.title,
        topic: row.question.topic,
        topicLabel: aptitudeTopic(row.question.topic)?.label ?? row.question.topic,
        difficulty: row.question.difficulty,
        correct: row.correct,
        at: row.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Aptitude me error:", error?.message);
    res.status(500).json({ error: "Could not load your progress" });
  }
});

export default router;

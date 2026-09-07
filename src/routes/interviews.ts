import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import {
  evaluateAndContinue,
  evaluateFinal,
  openInterview,
  questionBudgetFor,
  writeReport,
  type InterviewConfig,
  type InterviewQuestion as AskedQuestion,
  type Usage,
} from "../services/interview-ai.js";

const router = Router();

/**
 * @route   POST /api/interviews/save
 * @desc    Save a custom interview configuration for the current user
 * @access  Private
 */
router.post("/save", requireAuth, async (req: any, res) => {
  const {
    roleId,
    roundId,
    difficulty,
    experienceBand,
    interviewStyle,
    stackFocusIds,
    focusAreaIds,
  } = req.body;

  if (!roleId || !roundId) {
    return res.status(400).json({ error: "Missing required fields: roleId and roundId are mandatory." });
  }

  try {
    const savedInterview = await prisma.savedInterview.create({
      data: {
        userId: req.user.userId,
        roleId,
        roundId,
        difficulty,
        experienceBand,
        interviewStyle,
        stackFocusIds: stackFocusIds || [],
        focusAreaIds: focusAreaIds || [],
      },
    });

    res.json({
      success: true,
      message: "Interview configuration saved successfully",
      interview: savedInterview,
    });
  } catch (error) {
    console.error("Error saving interview:", error);
    res.status(500).json({ error: "Failed to save interview configuration" });
  }
});

/**
 * @route   GET /api/interviews/my
 * @desc    Get all saved interview configurations for the current user
 * @access  Private
 */
router.get("/my", requireAuth, async (req: any, res) => {
  try {
    const interviews = await prisma.savedInterview.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });

    res.json(interviews);
  } catch (error) {
    console.error("Error fetching saved interviews:", error);
    res.status(500).json({ error: "Failed to fetch saved interviews" });
  }
});

/**
 * @route   PATCH /api/interviews/:id
 * @desc    Update an existing interview configuration
 * @access  Private
 */
router.patch("/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;
  const {
    roleId,
    roundId,
    difficulty,
    experienceBand,
    interviewStyle,
    stackFocusIds,
    focusAreaIds,
  } = req.body;

  try {
    const interview = await prisma.savedInterview.findUnique({
      where: { id },
    });

    if (!interview) {
      return res.status(404).json({ error: "Interview configuration not found" });
    }

    if (interview.userId !== req.user.userId) {
      return res.status(403).json({ error: "You do not have permission to update this configuration" });
    }

    const updatedInterview = await prisma.savedInterview.update({
      where: { id },
      data: {
        roleId,
        roundId,
        difficulty,
        experienceBand,
        interviewStyle,
        stackFocusIds: stackFocusIds || [],
        focusAreaIds: focusAreaIds || [],
      },
    });

    res.json({
      success: true,
      message: "Interview configuration updated successfully",
      interview: updatedInterview,
    });
  } catch (error) {
    console.error("Error updating interview:", error);
    res.status(500).json({ error: "Failed to update interview configuration" });
  }
});

/**
 * @route   DELETE /api/interviews/:id
 * @desc    Delete a saved interview configuration
 * @access  Private
 */
router.delete("/:id", requireAuth, async (req: any, res) => {
  const { id } = req.params;

  try {
    const interview = await prisma.savedInterview.findUnique({
      where: { id },
    });

    if (!interview) {
      return res.status(404).json({ error: "Interview configuration not found" });
    }

    if (interview.userId !== req.user.userId) {
      return res.status(403).json({ error: "You do not have permission to delete this configuration" });
    }

    await prisma.savedInterview.delete({
      where: { id },
    });

    res.json({ success: true, message: "Interview configuration deleted" });
  } catch (error) {
    console.error("Error deleting interview:", error);
    res.status(500).json({ error: "Failed to delete interview configuration" });
  }
});

/** Config the model layer needs, pulled off a saved template row. */
function configFrom(template: {
  roleId: string;
  roundId: string;
  difficulty: string | null;
  experienceBand: string | null;
  interviewStyle: string | null;
  stackFocusIds: unknown;
  focusAreaIds: unknown;
}): InterviewConfig {
  return {
    roleId: template.roleId,
    roundId: template.roundId,
    difficulty: template.difficulty ?? "medium",
    experienceBand: template.experienceBand ?? "mid",
    interviewStyle: template.interviewStyle ?? "balanced",
    stackFocusIds: (template.stackFocusIds as string[] | null) ?? [],
    focusAreaIds: (template.focusAreaIds as string[] | null) ?? [],
  };
}

/**
 * Rounds and focus areas where the candidate is expected to *write* code rather
 * than talk about it.
 *
 * The model is asked for a stub and told to leave it empty when a question does
 * not need one, but that is a judgement call it gets wrong — and an empty
 * `starterCode` is exactly what the UI reads as "no editor". The result is a
 * binary search question with nothing but a plain textarea. For these rounds the
 * stub is therefore guaranteed here rather than left to the model.
 */
const CODE_ROUNDS = new Set(["coding-interview", "machine-coding", "debugging-interview"]);
const CODE_FOCUS = new Set(["dsa", "debugging"]);

function wantsCode(config: InterviewConfig) {
  return CODE_ROUNDS.has(config.roundId) || config.focusAreaIds.some((id) => CODE_FOCUS.has(id));
}

/**
 * Monaco language id for the configured stack. First stack pick wins; a config
 * with no stack selected falls back to JavaScript.
 */
const STACK_LANGUAGE: Record<string, string> = {
  "react-next": "typescript",
  mern: "javascript",
  "node-express": "javascript",
  "java-spring": "java",
  "python-django": "python",
  "sql-analytics": "sql",
  testing: "javascript",
  "cloud-devops": "yaml",
  mobile: "typescript",
  "ml-data": "python",
  security: "javascript",
};

function languageFor(config: InterviewConfig) {
  for (const id of config.stackFocusIds) {
    if (STACK_LANGUAGE[id]) return STACK_LANGUAGE[id];
  }
  return "javascript";
}

/** Comment syntax differs enough that a JS stub in a SQL round looks broken. */
function defaultStub(language: string) {
  if (language === "python" || language === "yaml") return "# Write your solution here";
  if (language === "sql") return "-- Write your query here";
  return "// Write your solution here";
}

/**
 * The stub actually stored for a question. A model-supplied stub always wins;
 * otherwise a coding round gets a placeholder so the editor still opens, and
 * a discussion round gets null so it does not.
 */
function starterCodeFor(starterCode: string, config: InterviewConfig, language: string) {
  if (starterCode?.trim()) return starterCode;
  return wantsCode(config) ? defaultStub(language) : null;
}

/** Folds one call's usage into the session's running totals. */
function usageIncrement(usage: Usage) {
  return {
    promptTokens: { increment: usage.promptTokens },
    cachedTokens: { increment: usage.cachedTokens },
    completionTokens: { increment: usage.completionTokens },
    reasoningTokens: { increment: usage.reasoningTokens },
    costMicros: { increment: usage.costMicros },
  };
}

/**
 * @route   POST /api/interviews/start
 * @desc    Start a new mock interview session
 * @access  Private
 */
router.post("/start", requireAuth, async (req: any, res) => {
  const { savedInterviewId } = req.body;

  if (!savedInterviewId) {
    return res.status(400).json({ error: "savedInterviewId is required to start an interview" });
  }

  try {
    const template = await prisma.savedInterview.findUnique({ where: { id: savedInterviewId } });

    if (!template) {
      return res.status(404).json({ error: "Saved interview configuration not found" });
    }
    if (template.userId !== req.user.userId) {
      return res.status(403).json({ error: "You do not have permission to use this configuration" });
    }

    const config = configFrom(template);
    const budget = questionBudgetFor(config.difficulty);

    const session = await prisma.mockInterviewSession.create({
      data: {
        userId: req.user.userId,
        savedInterviewId: template.id,
        status: "started",
        questionBudget: budget,
      },
    });

    const { question, usage } = await openInterview(config, budget);
    const language = languageFor(config);

    const [firstQuestion] = await prisma.$transaction([
      prisma.mockInterviewQuestion.create({
        data: {
          sessionId: session.id,
          questionText: question.question,
          topic: question.topic,
          difficulty: question.difficulty,
          focusArea: question.focusArea,
          starterCode: starterCodeFor(question.starterCode, config, language),
          expectedSkills: question.expectedSkills,
          status: "pending",
          orderIndex: 0,
        },
      }),
      prisma.mockInterviewSession.update({
        where: { id: session.id },
        data: usageIncrement(usage),
      }),
    ]);

    res.json({
      success: true,
      message: "Interview session started successfully",
      session: { ...session, questionBudget: budget },
      question: firstQuestion,
      language,
      progress: { asked: 1, total: budget },
    });
  } catch (error: any) {
    console.error("Error starting interview session:", error?.message);
    res.status(500).json({ error: "Failed to start interview session" });
  }
});

/**
 * @route   POST /api/interviews/session/:sessionId/answer
 * @desc    Score the answer and, unless the budget is spent, ask the next question
 * @access  Private
 */
router.post("/session/:sessionId/answer", requireAuth, async (req: any, res) => {
  const { sessionId } = req.params;
  const { questionId, answer } = req.body;

  if (!questionId || typeof answer !== "string" || !answer.trim()) {
    return res.status(400).json({ error: "questionId and a non-empty answer are required" });
  }

  try {
    const session = await prisma.mockInterviewSession.findUnique({
      where: { id: sessionId },
      include: {
        savedInterview: true,
        questions: { orderBy: { orderIndex: "asc" } },
      },
    });

    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.userId !== req.user.userId) {
      return res.status(403).json({ error: "You do not have permission to answer in this session" });
    }
    if (session.status === "completed") {
      return res.status(409).json({ error: "This interview has already finished" });
    }

    const current = session.questions.find((q) => q.id === questionId);
    if (!current) return res.status(404).json({ error: "Question not found in this session" });
    if (current.status === "evaluated") {
      return res.status(409).json({ error: "That question has already been answered" });
    }

    const config = configFrom(session.savedInterview);
    const budget = session.questionBudget;
    // Everything already asked and answered, in order — the cached prefix.
    const transcript = session.questions
      .filter((q) => q.orderIndex < current.orderIndex && q.status === "evaluated")
      .map((q) => ({ questionText: q.questionText, userAnswer: q.userAnswer }));

    const asked = current.orderIndex + 1;
    const isLast = asked >= budget;

    let nextQ: AskedQuestion | null = null;
    let evaluation;
    let usage: Usage;

    if (isLast) {
      ({ evaluation, usage } = await evaluateFinal(config, budget, transcript, current.questionText, answer));
    } else {
      const turn = await evaluateAndContinue(config, budget, transcript, current.questionText, answer, asked);
      evaluation = turn.evaluation;
      usage = turn.usage;
      nextQ = turn.nextQuestion;
    }

    const writes: any[] = [
      prisma.mockInterviewQuestion.update({
        where: { id: current.id },
        data: {
          userAnswer: answer,
          evaluationScore: evaluation.score,
          feedback: evaluation.feedback,
          verdict: evaluation.verdict,
          missed: evaluation.missed,
          status: "evaluated",
        },
      }),
      prisma.mockInterviewSession.update({
        where: { id: session.id },
        data: usageIncrement(usage),
      }),
    ];

    // orderIndex comes from the answered question, not from a count, so two
    // answers landing together cannot collide on the same slot.
    if (nextQ) {
      const next = nextQ;
      writes.push(
        prisma.mockInterviewQuestion.create({
          data: {
            sessionId: session.id,
            questionText: next.question,
            topic: next.topic,
            difficulty: next.difficulty,
            focusArea: next.focusArea,
            starterCode: starterCodeFor(next.starterCode, config, languageFor(config)),
            expectedSkills: next.expectedSkills,
            status: "pending",
            orderIndex: current.orderIndex + 1,
          },
        }),
      );
    }

    const results = await prisma.$transaction(writes);
    const nextQuestion = isLast ? null : results[2];

    // The evaluation is stored above but deliberately not returned. A candidate
    // who sees "3/10" after question two answers the rest of the interview
    // differently — and a score on the wire is a score in the devtools network
    // tab. All of it is released at once by /complete.
    res.json({
      success: true,
      nextQuestion,
      language: languageFor(config),
      done: isLast,
      progress: { asked: isLast ? budget : asked + 1, total: budget },
    });
  } catch (error: any) {
    console.error("Error evaluating answer:", error?.message);
    res.status(500).json({ error: "Failed to evaluate answer" });
  }
});

/**
 * @route   POST /api/interviews/session/:sessionId/complete
 * @desc    Close the session and build its report
 * @access  Private
 *
 * Every number here is computed from rows already on disk. The model is only
 * asked for prose, and only over feedback it has already written — which is why
 * the closing report costs a fraction of a single interview turn.
 */
router.post("/session/:sessionId/complete", requireAuth, async (req: any, res) => {
  const { sessionId } = req.params;

  try {
    const session = await prisma.mockInterviewSession.findUnique({
      where: { id: sessionId },
      include: {
        savedInterview: true,
        questions: { orderBy: { orderIndex: "asc" } },
      },
    });

    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.userId !== req.user.userId) {
      return res.status(403).json({ error: "You do not have permission to close this session" });
    }
    if (session.status === "completed") {
      return res.json({ success: true, alreadyCompleted: true, report: reportOf(session, session.questions) });
    }

    const scored = session.questions.filter((q) => q.status === "evaluated" && q.evaluationScore !== null);

    // Walked out before answering anything: close it, no report, no model call.
    if (scored.length === 0) {
      const abandoned = await prisma.mockInterviewSession.update({
        where: { id: session.id },
        data: { status: "abandoned", completedAt: new Date() },
      });
      return res.json({ success: true, abandoned: true, session: abandoned });
    }

    const scores = scored.map((q) => q.evaluationScore as number);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Per-topic averages, straight out of the rows.
    const byTopic = new Map<string, number[]>();
    for (const q of scored) {
      const topic = q.topic ?? "general";
      const bucket = byTopic.get(topic) ?? [];
      bucket.push(q.evaluationScore as number);
      byTopic.set(topic, bucket);
    }
    const topicBreakdown = [...byTopic.entries()]
      .map(([topic, values]) => ({
        topic,
        asked: values.length,
        average: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)),
      }))
      .sort((a, b) => a.average - b.average);

    const { report, usage } = await writeReport(
      configFrom(session.savedInterview),
      scored.map((q) => ({
        topic: q.topic,
        score: q.evaluationScore as number,
        feedback: q.feedback ?? "",
        missed: ((q.missed as string[] | null) ?? []),
      })),
      average,
      session.questionBudget,
    );

    const completed = await prisma.mockInterviewSession.update({
      where: { id: session.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        overallScore: Math.round(average * 10),
        summary: report.summary,
        strengths: report.strengths,
        weaknesses: report.weaknesses,
        nextSteps: report.nextSteps,
        topicBreakdown,
        ...usageIncrement(usage),
      },
    });

    res.json({ success: true, report: reportOf(completed, scored) });
  } catch (error: any) {
    console.error("Error completing interview session:", error?.message);
    res.status(500).json({ error: "Failed to complete interview session" });
  }
});

/**
 * @route   GET /api/interviews/session/:sessionId
 * @desc    The session with its questions, and the report once it has one
 * @access  Private
 */
router.get("/session/:sessionId", requireAuth, async (req: any, res) => {
  try {
    const session = await prisma.mockInterviewSession.findUnique({
      where: { id: req.params.sessionId },
      include: { savedInterview: true, questions: { orderBy: { orderIndex: "asc" } } },
    });

    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.userId !== req.user.userId) {
      return res.status(403).json({ error: "You do not have permission to view this session" });
    }

    // While the interview is still live the stored scores stay server-side —
    // resuming a session must not hand back the marks for answers already
    // given. They are released together with the report once it closes. Note
    // `session` carries its own nested copy of the questions, so both the
    // nested and the top-level list have to be blanked, not just one.
    const live = session.status !== "completed";
    const questions = live
      ? session.questions.map((q) => ({
          ...q,
          evaluationScore: null,
          feedback: null,
          verdict: null,
          missed: [],
        }))
      : session.questions;

    res.json({
      session: { ...session, questions },
      questions,
      language: languageFor(configFrom(session.savedInterview)),
      report: session.status === "completed" ? reportOf(session, session.questions) : null,
      progress: { asked: session.questions.length, total: session.questionBudget },
    });
  } catch (error: any) {
    console.error("Error fetching interview session:", error?.message);
    res.status(500).json({ error: "Failed to fetch interview session" });
  }
});

/** Report shape shared by /complete and /session/:id. */
/* ── report analytics ───────────────────────────────────────────────────── */

/**
 * Everything below is derived from the question rows at read time rather than
 * stored on the session. Two reasons: a report can never drift out of step with
 * the answers it describes, and an interview finished before any of this existed
 * still gets the full breakdown without a backfill.
 */

/** Acronyms the model writes lower case, which a naive title-caser mangles. */
const ACRONYMS = new Set([
  "dsa", "sql", "api", "css", "html", "http", "ui", "ux", "orm", "jwt",
  "cli", "cdn", "dom", "tcp", "ssr", "crud", "oop", "io", "rest", "grpc",
]);

/** Chart axes have finite room, and the model sometimes writes a whole sentence
 * where a topic tag belongs ("Implement Express endpoint with validation…"). */
const MAX_LABEL = 42;

function prettyLabel(raw: string) {
  // Slugs come through as-is ("api-design", "node-express"); as labels they read
  // far better spaced, and it lets the acronym list see the parts separately.
  const text = raw.trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
  if (!text) return "General";
  const words = text.split(" ");
  // Two or three words is a tag, and title case suits it. Anything longer is a
  // phrase, where title casing every word reads worse than leaving it alone.
  const cased =
    words.length <= 3
      ? words
          .map((word) =>
            ACRONYMS.has(word.toLowerCase())
              ? word.toUpperCase()
              : word.charAt(0).toUpperCase() + word.slice(1),
          )
          .join(" ")
      : text.charAt(0).toUpperCase() + text.slice(1);
  return cased.length > MAX_LABEL ? `${cased.slice(0, MAX_LABEL - 1).trimEnd()}…` : cased;
}

/**
 * One field can carry several labels: focusArea comes back as "backend, dsa,
 * api-design" often enough that treating the whole string as one bucket gives a
 * chart with one bar per unique *combination* rather than per area.
 */
function splitLabels(raw: string | null) {
  const parts = (raw ?? "")
    .split(/\s*[,/|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);
  return parts.length ? parts : ["general"];
}

/**
 * Groups by a case-insensitive key. The model is inconsistent about casing — one
 * interview produced "dsa" and "DSA" as two separate rows — so grouping on the
 * raw string splits what is really one topic in half and makes every bucket read
 * "1 question". A multi-valued row counts once in each of its buckets, so `asked`
 * can exceed the number of questions.
 */
function groupAverages(rows: Array<{ label: string | null; score: number }>) {
  const buckets = new Map<string, { label: string; scores: number[] }>();
  for (const row of rows) {
    for (const piece of splitLabels(row.label)) {
      const key = piece.toLowerCase();
      const bucket = buckets.get(key) ?? { label: prettyLabel(piece), scores: [] };
      bucket.scores.push(row.score);
      buckets.set(key, bucket);
    }
  }
  return [...buckets.values()]
    .map((b) => ({
      label: b.label,
      asked: b.scores.length,
      average: Number((b.scores.reduce((a, c) => a + c, 0) / b.scores.length).toFixed(1)),
    }))
    .sort((a, b) => a.average - b.average);
}

/** A band, not a verdict — one interview is evidence, not a hiring decision. */
function readinessFor(average: number) {
  if (average >= 8.5) {
    return { band: "Interview ready", note: "You would hold your own in a real round at this level." };
  }
  if (average >= 7) {
    return { band: "Nearly there", note: "The substance is mostly right; the gaps are in depth and articulation." };
  }
  if (average >= 5) {
    return { band: "Developing", note: "You can reach the right answer, but not yet reliably or completely." };
  }
  return { band: "Early days", note: "Focus on fundamentals before sitting a real round of this type." };
}

type ReportQuestion = {
  orderIndex: number;
  questionText: string;
  topic: string | null;
  difficulty: string | null;
  focusArea: string | null;
  userAnswer: string | null;
  evaluationScore: number | null;
  verdict: string | null;
  feedback: string | null;
  missed: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function analyticsOf(questions: ReportQuestion[]) {
  const scored = questions
    .filter((q) => q.evaluationScore !== null)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  if (scored.length === 0) return null;

  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const scores = scored.map((q) => q.evaluationScore as number);
  const average = mean(scores);

  // Time between a question being created and its answer being scored. It
  // includes the model's own latency, which is seconds against minutes of
  // thinking — close enough to read as time spent, not precise enough to bill.
  const seconds = (q: ReportQuestion) =>
    Math.max(0, Math.round((q.updatedAt.getTime() - q.createdAt.getTime()) / 1000));

  // Severity order, so the chart legend and colours stay stable between reports.
  const verdictMix = ["strong", "adequate", "weak", "no_answer"]
    .map((verdict) => ({ verdict, count: scored.filter((q) => q.verdict === verdict).length }))
    .filter((v) => v.count > 0);

  const byDifficulty = ["easy", "medium", "hard"].flatMap((level) => {
    const rows = scored.filter((q) => (q.difficulty ?? "").toLowerCase() === level);
    if (!rows.length) return [];
    return [{
      label: prettyLabel(level),
      asked: rows.length,
      average: Number(mean(rows.map((q) => q.evaluationScore as number)).toFixed(1)),
    }];
  });

  // A gap that recurs is worth more than a long flat list of one-offs.
  const gaps = new Map<string, { gap: string; count: number }>();
  for (const q of scored) {
    for (const raw of ((q.missed as string[] | null) ?? [])) {
      const text = String(raw).trim();
      if (!text) continue;
      const entry = gaps.get(text.toLowerCase()) ?? { gap: text, count: 0 };
      entry.count += 1;
      gaps.set(text.toLowerCase(), entry);
    }
  }

  // Warmed up or wore down? Only says anything once there are halves to compare.
  const half = Math.floor(scored.length / 2);
  const trend =
    scored.length >= 4
      ? {
          first: Number(mean(scores.slice(0, half)).toFixed(1)),
          second: Number(mean(scores.slice(-half)).toFixed(1)),
        }
      : null;

  const spread = Math.sqrt(mean(scores.map((s) => (s - average) ** 2)));
  const totalSeconds = scored.reduce((a, q) => a + seconds(q), 0);

  return {
    answered: scored.length,
    average: Number(average.toFixed(1)),
    best: Math.max(...scores),
    worst: Math.min(...scores),
    spread: Number(spread.toFixed(1)),
    consistency: spread <= 1 ? "steady" : spread <= 2 ? "mixed" : "uneven",
    readiness: readinessFor(average),
    trend,
    pace: { totalSeconds, averageSeconds: Math.round(totalSeconds / scored.length) },
    trajectory: scored.map((q, i) => ({
      order: i + 1,
      score: q.evaluationScore as number,
      topic: prettyLabel(q.topic ?? "general"),
      difficulty: q.difficulty,
      verdict: q.verdict,
      seconds: seconds(q),
    })),
    verdictMix,
    byTopic: groupAverages(scored.map((q) => ({ label: q.topic, score: q.evaluationScore as number }))),
    byFocus: groupAverages(scored.map((q) => ({ label: q.focusArea, score: q.evaluationScore as number }))),
    byDifficulty,
    recurringGaps: [...gaps.values()].sort((a, b) => b.count - a.count).slice(0, 10),
    questions: scored.map((q, i) => ({
      order: i + 1,
      question: q.questionText,
      topic: prettyLabel(q.topic ?? "general"),
      difficulty: q.difficulty,
      score: q.evaluationScore,
      verdict: q.verdict,
      feedback: q.feedback,
      missed: ((q.missed as string[] | null) ?? []),
      answer: q.userAnswer,
      seconds: seconds(q),
    })),
  };
}

function reportOf(
  session: {
    overallScore: number | null;
    summary: string | null;
    strengths: unknown;
    weaknesses: unknown;
    nextSteps: unknown;
    topicBreakdown: unknown;
    completedAt: Date | null;
  },
  questions: ReportQuestion[],
) {
  return {
    // Stored ×10 so the average keeps a decimal place without a float column.
    overallScore: session.overallScore === null ? null : session.overallScore / 10,
    summary: session.summary,
    strengths: (session.strengths as string[] | null) ?? [],
    weaknesses: (session.weaknesses as string[] | null) ?? [],
    nextSteps: (session.nextSteps as string[] | null) ?? [],
    topicBreakdown: (session.topicBreakdown as Array<{ topic: string; asked: number; average: number }> | null) ?? [],
    completedAt: session.completedAt,
    analytics: analyticsOf(questions),
  };
}

export default router;

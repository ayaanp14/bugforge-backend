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
      // The room the candidate is sitting in — role, round, depth, focus. It is
      // shown alongside the question rather than left behind on the builder.
      setup: config,
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

/* ── history ────────────────────────────────────────────────────────────── */

/**
 * The history page needs two things that look unrelated but come from the same
 * rows: a list of past sessions, and the analytics that only exist *across*
 * sessions (is the score climbing? which topic keeps costing marks, whatever
 * the round?). Both are folded into one response rather than two endpoints, so
 * opening the page is one request and the two halves can never disagree.
 */

/**
 * The columns the history screens actually read.
 *
 * A question row carries `questionText`, `starterCode`, `feedback` and a
 * MediumText `userAnswer`; the list needs a mark, a topic and two timestamps.
 * Selecting the whole row meant a ten-session page dragged every transcript the
 * user has ever written out of the database to render "7/7 answered". The full
 * rows are still loaded — once, per session — when a report is opened.
 */
const LIST_QUESTION = {
  evaluationScore: true,
  topic: true,
  verdict: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** As above, plus the fields the cross-session breakdowns group by. */
const ANALYTICS_QUESTION = {
  ...LIST_QUESTION,
  focusArea: true,
  difficulty: true,
  missed: true,
} as const;

type HistoryQuestion = {
  evaluationScore: number | null;
  topic: string | null;
  verdict: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type AnalyticsQuestion = HistoryQuestion & {
  focusArea: string | null;
  difficulty: string | null;
  missed: unknown;
};

type HistorySession<Q extends HistoryQuestion = HistoryQuestion> = {
  id: string;
  status: string;
  questionBudget: number;
  overallScore: number | null;
  createdAt: Date;
  completedAt: Date | null;
  savedInterview: {
    roleId: string;
    roundId: string;
    difficulty: string | null;
    focusAreaIds?: unknown;
  };
  questions: Q[];
};

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round1 = (n: number) => Number(n.toFixed(1));

/** Wall-clock seconds a session took, from its first question to its last mark. */
function sessionSeconds(session: HistorySession) {
  if (!session.questions.length) return 0;
  const start = session.createdAt.getTime();
  const end = (
    session.completedAt ??
    session.questions.reduce(
      (latest, q) => (q.updatedAt > latest ? q.updatedAt : latest),
      session.questions[0].updatedAt,
    )
  ).getTime();
  return Math.max(0, Math.round((end - start) / 1000));
}

function verdictMixOf(questions: Array<{ verdict: string | null }>) {
  return ["strong", "adequate", "weak", "no_answer"]
    .map((verdict) => ({ verdict, count: questions.filter((q) => q.verdict === verdict).length }))
    .filter((v) => v.count > 0);
}

/**
 * One row in the history list. Deliberately not the full report — thirty
 * sessions each carrying every question and answer is megabytes of JSON for a
 * page that shows a score and a date. The report is fetched per session when a
 * row is opened.
 */
function summaryOf(session: HistorySession) {
  const scored = session.questions.filter((q) => q.evaluationScore !== null);
  const scores = scored.map((q) => q.evaluationScore as number);
  const average = scores.length ? mean(scores) : null;

  // The stored overallScore is authoritative for a closed session; a session
  // walked out of never got one, so its answers are averaged instead.
  const score =
    session.overallScore !== null ? session.overallScore / 10 : average === null ? null : round1(average);

  const topics = groupAverages(
    scored.map((q) => ({ label: q.topic, score: q.evaluationScore as number })),
  );

  // Exactly the fields a row draws — nothing here is "might be useful later".
  // The setup recap, the summary prose and the transcript all belong to the
  // report, which is fetched when a row is opened.
  return {
    id: session.id,
    status: session.status,
    createdAt: session.createdAt,
    roleId: session.savedInterview.roleId,
    roundId: session.savedInterview.roundId,
    difficulty: session.savedInterview.difficulty,
    questionBudget: session.questionBudget,
    answered: scored.length,
    score,
    durationSeconds: sessionSeconds(session),
    verdictMix: verdictMixOf(scored),
    // Weakest first: on a list row the useful three are the ones that cost marks.
    weakestTopics: topics.slice(0, 3).map((t) => t.label),
    readiness: average === null ? null : readinessFor(average).band,
  };
}

/** Averages grouped by a saved-config id, carrying the id through for labelling. */
function groupByConfigId(rows: Array<{ id: string; score: number }>) {
  const buckets = new Map<string, { id: string; scores: number[] }>();
  for (const row of rows) {
    const bucket = buckets.get(row.id) ?? { id: row.id, scores: [] };
    bucket.scores.push(row.score);
    buckets.set(row.id, bucket);
  }
  return [...buckets.values()]
    .map((b) => ({
      id: b.id,
      label: prettyLabel(b.id),
      asked: b.scores.length,
      average: round1(mean(b.scores)),
    }))
    .sort((a, b) => a.average - b.average);
}

/** Local YYYY-MM-DD — the calendar the user sits in, not UTC. */
function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

const ACTIVITY_DAYS = 84;

/** One cell per day for the last twelve weeks, plus the streak they add up to. */
function activityOf(sessions: HistorySession[]) {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    const key = dayKey(session.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const days: Array<{ date: string; count: number }> = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = ACTIVITY_DAYS - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const key = dayKey(day);
    days.push({ date: key, count: counts.get(key) ?? 0 });
  }

  // A streak that reaches today is alive; one that ended yesterday is still the
  // current streak until today is over, so an empty today does not break it.
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current += 1;
    else if (i < days.length - 1) break;
  }

  let longest = 0;
  let run = 0;
  for (const day of days) {
    run = day.count > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
  }

  return { days, streak: { current, longest } };
}

/**
 * Everything that only means something once there is more than one interview.
 * Per-session analytics already live on the report; this is the career view.
 */
function careerAnalytics(sessions: HistorySession<AnalyticsQuestion>[]) {
  const questions = sessions.flatMap((s) => s.questions);
  const scored = questions.filter((q) => q.evaluationScore !== null);
  const activity = activityOf(sessions);

  const totals = {
    sessions: sessions.length,
    completed: sessions.filter((s) => s.status === "completed").length,
    abandoned: sessions.filter((s) => s.status === "abandoned").length,
    inProgress: sessions.filter((s) => s.status === "started").length,
    questionsAnswered: scored.length,
    // Only sessions that scored something count toward time spent. A round
    // opened and abandoned still has a clock running between its creation and
    // its last touch, and summing those turns "time in the room" into hours
    // nobody sat.
    timeSeconds: sessions
      .filter((s) => s.questions.some((q) => q.evaluationScore !== null))
      .reduce((a, s) => a + sessionSeconds(s), 0),
  };

  // Nothing scored yet: the counts above still mean something, the charts do
  // not. A null `scores` block is what the UI reads as "no data yet".
  if (scored.length === 0) return { totals, activity, scores: null };

  const values = scored.map((q) => q.evaluationScore as number);
  const average = mean(values);
  const spread = Math.sqrt(mean(values.map((s) => (s - average) ** 2)));

  // Oldest first — a progress line that runs backwards reads as a decline.
  const ordered = [...sessions].reverse();
  const timeline = ordered
    .map((session) => {
      const marks = session.questions
        .filter((q) => q.evaluationScore !== null)
        .map((q) => q.evaluationScore as number);
      if (!marks.length) return null;
      return {
        id: session.id,
        date: session.completedAt ?? session.createdAt,
        score: session.overallScore !== null ? session.overallScore / 10 : round1(mean(marks)),
        roleId: session.savedInterview.roleId,
        roundId: session.savedInterview.roundId,
        difficulty: session.savedInterview.difficulty,
        answered: marks.length,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .map((row, index) => ({ ...row, order: index + 1 }));

  const sessionScores = timeline.map((t) => t.score);
  const best = timeline.reduce((a, b) => (b.score > a.score ? b : a));

  // Early sessions against recent ones. Under four there are no halves to
  // compare and the "trend" would be noise dressed up as a finding.
  const half = Math.floor(timeline.length / 2);
  const trend =
    timeline.length >= 4
      ? { first: round1(mean(sessionScores.slice(0, half))), second: round1(mean(sessionScores.slice(-half))) }
      : null;

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

  const sessionAverage = (session: HistorySession) => {
    const marks = session.questions
      .filter((q) => q.evaluationScore !== null)
      .map((q) => q.evaluationScore as number);
    return marks.length ? mean(marks) : null;
  };
  const configRows = (pick: (s: HistorySession) => string) =>
    sessions.flatMap((session) => {
      const avg = sessionAverage(session);
      return avg === null ? [] : [{ id: pick(session), score: avg }];
    });

  return {
    totals,
    activity,
    scores: {
      average: round1(average),
      best: Math.max(...values),
      worst: Math.min(...values),
      spread: round1(spread),
      consistency: spread <= 1 ? "steady" : spread <= 2 ? "mixed" : "uneven",
      readiness: readinessFor(average),
      trend,
      bestSession: { id: best.id, score: best.score, date: best.date, roleId: best.roleId, roundId: best.roundId },
      timeline,
      verdictMix: verdictMixOf(scored),
      byTopic: groupAverages(scored.map((q) => ({ label: q.topic, score: q.evaluationScore as number }))),
      byFocus: groupAverages(scored.map((q) => ({ label: q.focusArea, score: q.evaluationScore as number }))),
      byDifficulty: ["easy", "medium", "hard"].flatMap((level) => {
        const rows = scored.filter((q) => (q.difficulty ?? "").toLowerCase() === level);
        if (!rows.length) return [];
        return [{
          label: prettyLabel(level),
          asked: rows.length,
          average: round1(mean(rows.map((q) => q.evaluationScore as number))),
        }];
      }),
      byRole: groupByConfigId(configRows((s) => s.savedInterview.roleId)),
      byRound: groupByConfigId(configRows((s) => s.savedInterview.roundId)),
      recurringGaps: [...gaps.values()].sort((a, b) => b.count - a.count).slice(0, 12),
    },
  };
}

/** Rows per page when the caller does not say. */
const DEFAULT_PAGE = 10;

/** Ceiling on how far back the career analytics look. */
const ANALYTICS_CAP = 200;

const STATUSES = new Set(["completed", "abandoned", "started"]);

/**
 * A session still in progress keeps its marks hidden, exactly as it does while
 * it is being sat — the history page is not a back door to them.
 */
function hideLiveMarks<T extends { status: string; questions: unknown[] }>(sessions: T[]): T[] {
  return sessions.map((session) =>
    session.status === "started"
      ? ({
          ...session,
          questions: (session.questions as Array<Record<string, unknown>>).map((q) => ({
            ...q,
            evaluationScore: null,
            feedback: null,
            verdict: null,
            missed: [],
          })),
        } as T)
      : session,
  );
}

/**
 * @route   GET /api/interviews/history
 * @desc    One page of past sessions, plus (on the first page) the analytics
 *          and filter options that span every session
 * @access  Private
 */
router.get("/history", requireAuth, async (req: any, res) => {
  try {
    const requested = Number(req.query.limit);
    const take = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 50) : DEFAULT_PAGE;
    const cursor = typeof req.query.cursor === "string" && req.query.cursor ? req.query.cursor : null;
    const sort = req.query.sort === "best" || req.query.sort === "worst" ? req.query.sort : "recent";
    const status = STATUSES.has(req.query.status) ? (req.query.status as string) : null;
    const roleId = typeof req.query.roleId === "string" && req.query.roleId ? req.query.roleId : null;
    // The analytics span every session, so they are computed once for the first
    // page and never again while paging. A caller that only wants rows — the
    // builder's "recent sessions" strip — opts out entirely.
    const wantsAnalytics = !cursor && req.query.analytics !== "0";

    const byScore = sort !== "recent";
    const where = {
      userId: req.user.userId,
      ...(status ? { status } : {}),
      ...(roleId ? { savedInterview: { is: { roleId } } } : {}),
      // A ranking by score is a ranking of sessions that have one. Left in, the
      // unscored rows pile up at whichever end MySQL puts NULLs and the list
      // reads as though the worst interviews were never marked.
      ...(byScore ? { overallScore: { not: null } } : {}),
    };

    const orderBy = byScore
      ? [{ overallScore: sort === "best" ? ("desc" as const) : ("asc" as const) }, { createdAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

    // One row past the page: its existence is what says there is a next page,
    // without a second count query on the hot path.
    const [rows, total] = await Promise.all([
      prisma.mockInterviewSession.findMany({
        where,
        orderBy,
        take: take + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          status: true,
          questionBudget: true,
          overallScore: true,
          createdAt: true,
          completedAt: true,
          savedInterview: { select: { roleId: true, roundId: true, difficulty: true } },
          questions: { select: LIST_QUESTION, orderBy: { orderIndex: "asc" } },
        },
      }),
      prisma.mockInterviewSession.count({ where }),
    ]);

    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;

    const body: Record<string, unknown> = {
      sessions: hideLiveMarks(page).map(summaryOf),
      nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
      total,
    };

    if (wantsAnalytics) {
      // Deliberately unfiltered: "your average across every round" must not
      // change because the list below it is filtered to one role.
      const everything = await prisma.mockInterviewSession.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: "desc" },
        take: ANALYTICS_CAP,
        select: {
          id: true,
          status: true,
          questionBudget: true,
          overallScore: true,
          createdAt: true,
          completedAt: true,
          savedInterview: {
            select: { roleId: true, roundId: true, difficulty: true, focusAreaIds: true },
          },
          questions: { select: ANALYTICS_QUESTION, orderBy: { orderIndex: "asc" } },
        },
      });
      const all = hideLiveMarks(everything);

      body["analytics"] = careerAnalytics(all);
      // The filter controls are driven from the whole history, not the page —
      // a role filter that only lists the roles on screen is no filter at all.
      body["filters"] = {
        roles: [...new Set(all.map((s) => s.savedInterview.roleId))],
        focusAreas: [
          ...new Set(all.flatMap((s) => (s.savedInterview.focusAreaIds as string[] | null) ?? [])),
        ],
        statusCounts: {
          all: all.length,
          completed: all.filter((s) => s.status === "completed").length,
          abandoned: all.filter((s) => s.status === "abandoned").length,
          started: all.filter((s) => s.status === "started").length,
        },
      };
    }

    res.json(body);
  } catch (error: any) {
    console.error("Error fetching interview history:", error?.message);
    res.status(500).json({ error: "Failed to fetch interview history" });
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
      setup: configFrom(session.savedInterview),
      status: session.status,
      completedAt: session.completedAt,
      startedAt: session.createdAt,
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

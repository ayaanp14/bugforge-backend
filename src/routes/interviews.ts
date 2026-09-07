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
      return res.json({ success: true, alreadyCompleted: true, report: reportOf(session) });
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

    res.json({ success: true, report: reportOf(completed), questions: scored });
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
      report: session.status === "completed" ? reportOf(session) : null,
      progress: { asked: session.questions.length, total: session.questionBudget },
    });
  } catch (error: any) {
    console.error("Error fetching interview session:", error?.message);
    res.status(500).json({ error: "Failed to fetch interview session" });
  }
});

/** Report shape shared by /complete and /session/:id. */
function reportOf(session: {
  overallScore: number | null;
  summary: string | null;
  strengths: unknown;
  weaknesses: unknown;
  nextSteps: unknown;
  topicBreakdown: unknown;
  completedAt: Date | null;
}) {
  return {
    // Stored ×10 so the average keeps a decimal place without a float column.
    overallScore: session.overallScore === null ? null : session.overallScore / 10,
    summary: session.summary,
    strengths: (session.strengths as string[] | null) ?? [],
    weaknesses: (session.weaknesses as string[] | null) ?? [],
    nextSteps: (session.nextSteps as string[] | null) ?? [],
    topicBreakdown: (session.topicBreakdown as Array<{ topic: string; asked: number; average: number }> | null) ?? [],
    completedAt: session.completedAt,
  };
}

export default router;

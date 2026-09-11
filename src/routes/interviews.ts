import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { prettyLabel } from "../lib/interview-labels.js";
import { estimatedQuestions, voiceDurationMinutes } from "../lib/interview-duration.js";
import { checkInterviewQuota, checkVoiceDuration } from "../services/entitlements.js";
import { normalizeStarterCode } from "../lib/starter-code.js";
import {
  askNextQuestion,
  evaluateAnswer,
  openInterview,
  prefetchQuestion,
  questionBudgetFor,
  writeReport,
  type InterviewConfig,
  type InterviewQuestion as AskedQuestion,
  type Usage,
} from "../services/interview-ai.js";
import { realtimeProvider } from "../services/realtime-interview.js";
import { cachedShared } from "../lib/cache.js";
import { invalidateDashboard } from "../services/dashboard.js";
import {
  finalizeInterview,
  interviewHistoryKey,
  invalidateInterviewHistory,
  usageIncrement,
} from "../services/interview-completion.js";

const router = Router();

/** The most saved setups one account keeps. */
const MAX_SAVED_TEMPLATES = 30;

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

  if (typeof roleId !== "string" || typeof roundId !== "string" || !roleId.trim() || !roundId.trim()) {
    return res.status(400).json({ error: "Missing required fields: roleId and roundId are mandatory." });
  }
  if (roleId.length > 80 || roundId.length > 80) {
    return res.status(400).json({ error: "Role and round names are limited to 80 characters." });
  }

  try {
    // Templates are a short list on the builder and the dashboard; nothing
    // capped it, so one account could grow the list without limit.
    const owned = await prisma.savedInterview.count({ where: { userId: req.user.userId } });
    if (owned >= MAX_SAVED_TEMPLATES) {
      return res.status(409).json({
        error: `You can keep up to ${MAX_SAVED_TEMPLATES} saved setups. Delete one you no longer use to add another.`,
      });
    }

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

    // The dashboard lists saved templates; it used to keep the pre-save copy
    // for its TTL.
    invalidateDashboard(req.user.userId);

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

    // Every turn of a round reads its configuration from this row, so editing
    // it under an open round changed the interviewer's role, depth and focus
    // for the questions that followed — and the report's header — half-way
    // through. The round has to close first.
    const open = await prisma.mockInterviewSession.count({ where: { savedInterviewId: id, status: "started" } });
    if (open > 0) {
      return res.status(409).json({
        error: "This setup has an interview in progress. Finish or close that round before editing it.",
        openSessions: open,
      });
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

    // Sessions cascade with the template (the relation is required, so they
    // cannot be left behind). A single unconfirmed click on a trash icon used
    // to take every interview and report ever sat on the setup with it. The
    // caller now has to say so: the first request reports what would go, and
    // only `purge: true` — sent after a confirmation — actually deletes.
    const sessions = await prisma.mockInterviewSession.count({ where: { savedInterviewId: id } });
    const purge = req.body?.purge === true || req.query["purge"] === "true";
    if (sessions > 0 && !purge) {
      return res.status(409).json({
        error: `This setup has ${sessions} interview${sessions === 1 ? "" : "s"} in your history. Deleting it removes them and their reports too.`,
        sessions,
        requiresPurge: true,
      });
    }

    await prisma.savedInterview.delete({
      where: { id },
    });

    // Its sessions went with it, and the history analytics counted them.
    invalidateInterviewHistory(req.user.userId);
    invalidateDashboard(req.user.userId);

    res.json({ success: true, message: "Interview configuration deleted", removedSessions: sessions });
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
  const config: InterviewConfig = {
    roleId: template.roleId,
    roundId: template.roundId,
    difficulty: template.difficulty ?? "medium",
    experienceBand: template.experienceBand ?? "mid",
    interviewStyle: template.interviewStyle ?? "balanced",
    stackFocusIds: (template.stackFocusIds as string[] | null) ?? [],
    focusAreaIds: (template.focusAreaIds as string[] | null) ?? [],
  };
  // Named in the prompt so the stub arrives in the language the editor opens in.
  config.language = languageFor(config);
  return config;
}

/**
 * Rounds and focus areas where the candidate is expected to *write* code rather
 * than talk about it. They get the schema with a `starterCode` field; the
 * others do not, so the model cannot even offer a stub there.
 *
 * Within a coding round the model decides per question: a stub opens the
 * editor, an empty string opens a text box (which has its own code formatting).
 * The prompt spells out when each is right; what arrives is only cleaned up,
 * never replaced — see normalizeStarterCode.
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
  angular: "typescript",
  "vue-nuxt": "javascript",
  dotnet: "csharp",
  "go-microservices": "go",
  "php-laravel": "php",
  flutter: "dart",
  "data-spark": "python",
  "genai-llm": "python",
};

function languageFor(config: InterviewConfig) {
  for (const id of config.stackFocusIds) {
    if (STACK_LANGUAGE[id]) return STACK_LANGUAGE[id];
  }
  return "javascript";
}

/**
 * The stub actually stored for a question: the model's, cleaned and closed, or
 * null when it sent nothing — which is exactly what the UI reads as "no
 * editor, show the text box".
 */
function starterCodeFor(starterCode: string, language: string) {
  return normalizeStarterCode(starterCode, language);
}

/**
 * @route   POST /api/interviews/start
 * @desc    Start a new mock interview session
 * @access  Private
 */
router.post("/start", requireAuth, async (req: any, res) => {
  const { savedInterviewId } = req.body;
  // Anything that is not explicitly "voice" is the typed round this endpoint
  // has always run, so an older client that sends no mode is unaffected.
  const mode = req.body?.mode === "voice" ? "voice" : "written";

  if (typeof savedInterviewId !== "string" || !savedInterviewId) {
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

    // Metered before anything is created, so a refusal leaves no orphan row and
    // costs no model call.
    const quota = await checkInterviewQuota(req.user.userId);
    if (quota) return res.status(402).json(quota);

    const config = configFrom(template);
    const budget = questionBudgetFor(config.difficulty);

    if (mode === "voice") {
      const provider = realtimeProvider();
      if (!provider.isConfigured()) {
        return res.status(503).json({ error: "Voice interviews are not available on this deployment" });
      }

      const durationMin = voiceDurationMinutes(req.body?.durationMin);

      // Longer rounds are a paid feature, so the length is checked as well as
      // the count — otherwise free could ask for thirty minutes twice a week.
      const lengthGate = await checkVoiceDuration(req.user.userId, durationMin);
      if (lengthGate) return res.status(402).json(lengthGate);

      // No opening question is written here. In a spoken round the interviewer
      // asks it out loud on the socket, and the question rows are recovered
      // from the transcript when the round closes.
      const session = await prisma.mockInterviewSession.create({
        data: {
          userId: req.user.userId,
          savedInterviewId: template.id,
          status: "started",
          // A placeholder until the round ends: a spoken interview is bounded
          // by the clock, and the real count is whatever fitted, written back
          // by /voice/complete.
          questionBudget: estimatedQuestions(durationMin),
          mode: "voice",
          provider: provider.id,
          realtimeModel: provider.model,
          durationLimitSec: durationMin * 60,
        },
      });

      // A new row changes the session count and the activity calendar.
      invalidateInterviewHistory(req.user.userId);

      return res.json({
        success: true,
        message: "Voice interview session created",
        session,
        mode: "voice",
        setup: config,
        language: languageFor(config),
        durationLimitSec: durationMin * 60,
      });
    }

    const language = languageFor(config);

    // A round already open on this template is handed back, not duplicated.
    // The session page used to open on `?savedInterviewId=` and POST here on
    // every mount, so a refresh mid-interview created a second row (and a
    // second opening question) and left the first one "started" forever —
    // each one a slot off the weekly quota. The client now rewrites its URL
    // to `?sessionId=` as well, so this is the server-side half of the same
    // fix: whichever way the page is reopened, it lands in the same room.
    const open = await prisma.mockInterviewSession.findFirst({
      where: { userId: req.user.userId, savedInterviewId: template.id, status: "started", mode: "written" },
      orderBy: { createdAt: "desc" },
      include: { questions: { orderBy: { orderIndex: "asc" } } },
    });
    if (open) {
      const pending = open.questions.find((q) => q.status === "pending") ?? null;
      const { questions, ...session } = open;
      return res.json({
        success: true,
        resumed: true,
        message: "Interview session resumed",
        session,
        question: pending,
        mode: "written",
        language,
        setup: config,
        progress: { asked: pending ? pending.orderIndex + 1 : questions.length, total: open.questionBudget },
      });
    }

    // The opening question is written before the row exists: a model failure
    // here used to leave a "started" session with no questions behind — one
    // that showed in history as an open round and counted against the quota.
    const { question, usage } = await openInterview(config, budget, wantsCode(config));

    const session = await prisma.mockInterviewSession.create({
      data: {
        userId: req.user.userId,
        savedInterviewId: template.id,
        status: "started",
        questionBudget: budget,
        // The opening question's cost, on the row from the start.
        promptTokens: usage.promptTokens,
        cachedTokens: usage.cachedTokens,
        completionTokens: usage.completionTokens,
        reasoningTokens: usage.reasoningTokens,
        costMicros: usage.costMicros,
      },
    });
    invalidateInterviewHistory(req.user.userId);

    const firstQuestion = await prisma.mockInterviewQuestion.create({
      data: {
        sessionId: session.id,
        questionText: question.question,
        topic: question.topic,
        difficulty: question.difficulty,
        focusArea: question.focusArea,
        starterCode: starterCodeFor(question.starterCode ?? "", language),
        expectedSkills: question.expectedSkills,
        status: "pending",
        orderIndex: 0,
      },
    });

    // Question two starts being written now, while the candidate is still
    // reading question one. By the time they submit it is already on disk.
    prefetchAhead({ id: session.id, questionBudget: budget }, config, [], firstQuestion.questionText, 1);

    res.json({
      success: true,
      message: "Interview session started successfully",
      session: { ...session, questionBudget: budget },
      question: firstQuestion,
      mode: "written",
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

/* ── prefetching the next question ──────────────────────────────────────── */

/**
 * The interview's whole latency budget lives here.
 *
 * A candidate spends thirty seconds to three minutes writing an answer, and a
 * question takes five to fifteen seconds to generate. Those two facts used to
 * be arranged the expensive way round: the answer arrived, and only then did
 * anyone start writing what came next, so every turn cost a candidate the full
 * generation while they watched a spinner.
 *
 * Now the question after the one on screen is written *during* that answering
 * time and parked as a row with status "prefetched". Submitting an answer costs
 * a database write and nothing else. Scoring is not on this path at all — it
 * happens once, at /complete, so it never competes with question generation for
 * a provider that refuses about a third of what it is sent.
 *
 * The map holds work this process is already doing, so a submit that arrives
 * mid-flight can wait on it rather than starting a second copy of it. It is not
 * a queue and does not survive a restart: the row either exists or it does not,
 * and /answer falls back to generating inline when it does not.
 */
const prefetching = new Map<string, Promise<unknown>>();

function prefetchKey(sessionId: string, orderIndex: number) {
  return `${sessionId}:${orderIndex}`;
}

/**
 * Writes question `orderIndex` ahead of time. Safe to call twice for the same
 * slot — the unique constraint on (sessionId, orderIndex) settles the race.
 */
function prefetchAhead(
  session: { id: string; questionBudget: number },
  config: InterviewConfig,
  transcript: Array<{ questionText: string; userAnswer: string | null }>,
  askedQuestion: string,
  orderIndex: number,
) {
  // Past the budget there is nothing left to ask.
  if (orderIndex >= session.questionBudget) return;

  const key = prefetchKey(session.id, orderIndex);
  if (prefetching.has(key)) return;

  const job = (async () => {
    try {
      const { nextQuestion, usage } = await prefetchQuestion(
        config,
        session.questionBudget,
        transcript,
        askedQuestion,
        orderIndex,
        wantsCode(config),
      );
      await prisma.$transaction([
        prisma.mockInterviewQuestion.create({
          data: {
            sessionId: session.id,
            questionText: nextQuestion.question,
            topic: nextQuestion.topic,
            difficulty: nextQuestion.difficulty,
            focusArea: nextQuestion.focusArea,
            starterCode: starterCodeFor(nextQuestion.starterCode ?? "", languageFor(config)),
            expectedSkills: nextQuestion.expectedSkills,
            // Written, but not the candidate's to see until they submit.
            status: "prefetched",
            orderIndex,
          },
        }),
        prisma.mockInterviewSession.update({ where: { id: session.id }, data: usageIncrement(usage) }),
      ]);
    } catch (error: any) {
      // Never fatal. /answer generates the question inline when the slot is
      // empty, which is exactly the behaviour this replaced.
      if (error?.code !== "P2002") {
        console.error(`Prefetch of question ${orderIndex} failed:`, error?.message);
      }
    } finally {
      prefetching.delete(key);
    }
  })();

  prefetching.set(key, job);
}

/** Waits for an in-flight prefetch of one slot, if this process started one. */
async function settlePrefetch(sessionId: string, orderIndex: number) {
  const job = prefetching.get(prefetchKey(sessionId, orderIndex));
  if (job) await job.catch(() => undefined);
}

/* ── scoring in the same idle window ────────────────────────────────────── */

/**
 * Marks in flight, by session.
 *
 * Scoring was moved to /complete to get it off the turn, which worked but piled
 * every answer into one closing call — seven evaluations at once, and the
 * candidate watching a minute of it. The idle window the prefetch already uses
 * is big enough for both: a question takes a few seconds to write and an answer
 * a few to mark, against thirty seconds or more of someone typing.
 *
 * So the mark for answer N is started once question N+2 has been written —
 * deliberately second, because a late question is a wait the candidate sees and
 * a late mark is not. /complete settles whatever is still outstanding and scores
 * anything that never ran, so this is an optimisation, never a dependency.
 */
const marking = new Map<string, Set<Promise<unknown>>>();

function trackMark(sessionId: string, job: Promise<unknown>) {
  const jobs = marking.get(sessionId) ?? new Set();
  jobs.add(job);
  marking.set(sessionId, jobs);
  void job.finally(() => {
    jobs.delete(job);
    if (jobs.size === 0) marking.delete(sessionId);
  });
}

/** Waits for marks this process started for a session. Never throws. */
async function settleMarking(sessionId: string) {
  const jobs = marking.get(sessionId);
  if (!jobs?.size) return;
  await Promise.allSettled([...jobs]);
}

/** Scores one answer in the background, after the prefetch it queues behind. */
function markInBackground(
  session: { id: string; questionBudget: number },
  config: InterviewConfig,
  transcript: Array<{ questionText: string; userAnswer: string | null }>,
  question: { id: string; questionText: string },
  answer: string,
  after: number,
) {
  const job = (async () => {
    try {
      // Question first: the candidate is waiting on one of these and not the other.
      await settlePrefetch(session.id, after);
      const { evaluation, usage } = await evaluateAnswer(
        config,
        session.questionBudget,
        transcript,
        question.questionText,
        answer,
      );
      await storeEvaluation(session.id, question.id, evaluation, usage);
    } catch (error: any) {
      // /complete re-scores anything still unmarked, so this is recoverable.
      console.error(`Background marking failed for question ${question.id}:`, error?.message);
    }
  })();
  trackMark(session.id, job);
}

/** Writes one mark and folds its usage into the session totals. */
async function storeEvaluation(
  sessionId: string,
  questionId: string,
  evaluation: { score: number; feedback: string; verdict: string; missed: string[] },
  usage: Usage,
) {
  await prisma.$transaction([
    prisma.mockInterviewQuestion.update({
      where: { id: questionId },
      data: {
        evaluationScore: evaluation.score,
        feedback: evaluation.feedback,
        verdict: evaluation.verdict,
        missed: evaluation.missed,
        status: "evaluated",
      },
    }),
    prisma.mockInterviewSession.update({ where: { id: sessionId }, data: usageIncrement(usage) }),
  ]);
}

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
    if (session.status !== "started") {
      return res.status(409).json({ error: "This interview has already finished" });
    }

    const current = session.questions.find((q) => q.id === questionId);
    if (!current) return res.status(404).json({ error: "Question not found in this session" });
    if (current.status === "prefetched") {
      return res.status(409).json({ error: "That question has not been asked yet" });
    }

    const config = configFrom(session.savedInterview);
    const budget = session.questionBudget;
    const language = languageFor(config);

    // Already submitted. The answer is written before the next question is
    // generated, so a turn whose generation failed leaves the row "answered"
    // with nothing after it — and the candidate retrying from the "not saved"
    // message must not be told "already answered" and left with nowhere to go.
    // Where the round has moved on (the other tab answered, the prefetch
    // landed), hand back where it is; where it has not, carry on below as if
    // this were the first submit, minus the write.
    const alreadyAnswered = current.status !== "pending";
    if (alreadyAnswered) {
      const moved = session.questions.find(
        (q) => q.orderIndex === current.orderIndex + 1 && q.status === "pending",
      );
      if (moved) {
        return res.json({
          success: true,
          stale: true,
          nextQuestion: moved,
          language,
          done: false,
          progress: { asked: moved.orderIndex + 1, total: budget },
        });
      }
      if (current.orderIndex + 1 >= budget) {
        return res.json({ success: true, stale: true, nextQuestion: null, language, done: true, progress: { asked: budget, total: budget } });
      }
    }
    // Everything already asked and answered, in order — the cached prefix.
    // A turn whose score has not landed yet still belongs in the transcript;
    // what makes it history is the answer, not the mark.
    const transcript = session.questions
      .filter((q) => q.orderIndex < current.orderIndex && q.userAnswer !== null)
      .map((q) => ({ questionText: q.questionText, userAnswer: q.userAnswer }));

    const asked = current.orderIndex + 1;
    const isLast = asked >= budget;
    const nextIndex = current.orderIndex + 1;

    // The answer is recorded first and on its own. Nothing here is scored —
    // marking happens once, at /complete — so this write is the entire cost of
    // a turn when the next question was prefetched in time. A retry keeps the
    // answer that already landed.
    if (!alreadyAnswered) {
      await prisma.mockInterviewQuestion.update({
        where: { id: current.id },
        data: { userAnswer: answer, status: "answered" },
      });
    }
    const recorded = alreadyAnswered ? (current.userAnswer ?? answer) : answer;

    let nextQuestion = null;

    if (!isLast) {
      // Written while they were typing, in the usual case.
      await settlePrefetch(session.id, nextIndex);
      let ready = await prisma.mockInterviewQuestion.findUnique({
        where: { sessionId_orderIndex: { sessionId: session.id, orderIndex: nextIndex } },
      });

      if (!ready) {
        // Prefetch failed or never ran — an unusually fast answer, a restart,
        // or a provider refusal that outlasted its retries. Generate inline,
        // which is what every turn used to do.
        const turn = await askNextQuestion(
          config,
          budget,
          [...transcript, { questionText: current.questionText, userAnswer: recorded }],
          current.questionText,
          recorded,
          asked,
          wantsCode(config),
        );
        const next = turn.nextQuestion;
        try {
          [ready] = await prisma.$transaction([
            prisma.mockInterviewQuestion.create({
              data: {
                sessionId: session.id,
                questionText: next.question,
                topic: next.topic,
                difficulty: next.difficulty,
                focusArea: next.focusArea,
                starterCode: starterCodeFor(next.starterCode ?? "", language),
                expectedSkills: next.expectedSkills,
                status: "pending",
                orderIndex: nextIndex,
              },
            }),
            prisma.mockInterviewSession.update({
              where: { id: session.id },
              data: usageIncrement(turn.usage),
            }),
          ]);
        } catch (error: any) {
          // A prefetch on another instance, or a retry racing this one, wrote
          // the slot first. Theirs is the question; this generation is waste,
          // not a failure.
          if (error?.code !== "P2002") throw error;
          ready = await prisma.mockInterviewQuestion.findUnique({
            where: { sessionId_orderIndex: { sessionId: session.id, orderIndex: nextIndex } },
          });
          if (!ready) throw error;
        }
      }
      if (ready.status === "prefetched") {
        // Hand it over: it is the candidate's question now.
        ready = await prisma.mockInterviewQuestion.update({
          where: { id: ready.id },
          data: { status: "pending" },
        });
      }

      nextQuestion = ready;

      const history = [...transcript, { questionText: current.questionText, userAnswer: recorded }];

      // Both of these run while the candidate reads and types, and neither is
      // on the path back to them. The question goes first because a missing one
      // is a visible wait; the mark is not needed until the round closes. A
      // retried turn whose mark already landed is not marked again.
      prefetchAhead(session, config, history, ready.questionText, nextIndex + 1);
      if (current.evaluationScore === null) {
        markInBackground(session, config, transcript, current, recorded, nextIndex + 1);
      }
    }

    // No score is returned, and the last answer's has not even been computed. A
    // candidate who sees "3/10" after question two answers the rest of the
    // interview differently — and a score on the wire is a score in the devtools
    // network tab. All of it is released together by /complete.
    res.json({
      success: true,
      nextQuestion,
      language,
      done: isLast,
      progress: { asked: isLast ? budget : asked + 1, total: budget },
    });
  } catch (error: any) {
    console.error("Error recording answer:", error?.message);
    res.status(500).json({ error: "Failed to submit answer" });
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
/**
 * Closes in flight, by session. Two tabs (or a double click that beat the
 * button's disabled state) closing the same round used to each mark and each
 * write a report — two model calls for one interview. The second caller now
 * waits on the first and gets the same answer.
 */
const completing = new Map<string, Promise<CompleteOutcome>>();

type CompleteOutcome = { status: number; body: Record<string, unknown> };

async function completeWrittenSession(sessionId: string, userId: string): Promise<CompleteOutcome> {
  // A turn hands back its question before its mark is written, so the last
  // one or two answers may still be scoring when the candidate closes the
  // round. Let anything still running finish before reading the rows, rather
  // than starting a second copy of it below.
  await settleMarking(sessionId);

  let session = await prisma.mockInterviewSession.findUnique({
    where: { id: sessionId },
    include: {
      savedInterview: true,
      questions: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!session) return { status: 404, body: { error: "Session not found" } };
  if (session.userId !== userId) {
    return { status: 403, body: { error: "You do not have permission to close this session" } };
  }
  if (session.status === "completed") {
    return { status: 200, body: { success: true, alreadyCompleted: true, report: reportOf(session, session.questions) } };
  }
  if (session.status !== "started") {
    return { status: 409, body: { error: "This interview was already closed" } };
  }
  // A spoken round is closed by /voice/complete, which scores the transcript.
  // Closing it here would find no question rows and file it as walked-out.
  if (session.mode === "voice") {
    return { status: 400, body: { error: "This is a voice interview; close it from the voice room" } };
  }

  // Whatever the idle windows did not cover — in the normal case just the
  // final answer, which had no window after it, plus anything a failed
  // background mark or a restart left behind. Concurrent, so this costs the
  // slowest one rather than the sum.
  const unmarked = session.questions.filter((q) => q.userAnswer !== null && q.evaluationScore === null);
  if (unmarked.length > 0) {
    const config = configFrom(session.savedInterview);
    const budget = session.questionBudget;
    const ordered = session.questions;

    await Promise.allSettled(
      unmarked.map(async (question) => {
        const transcript = ordered
          .filter((q) => q.orderIndex < question.orderIndex && q.userAnswer !== null)
          .map((q) => ({ questionText: q.questionText, userAnswer: q.userAnswer }));
        const { evaluation, usage } = await evaluateAnswer(
          config,
          budget,
          transcript,
          question.questionText,
          question.userAnswer as string,
        );
        await storeEvaluation(session!.id, question.id, evaluation, usage);
      }),
    );

    session = await prisma.mockInterviewSession.findUnique({
      where: { id: sessionId },
      include: { savedInterview: true, questions: { orderBy: { orderIndex: "asc" } } },
    });
    if (!session) return { status: 404, body: { error: "Session not found" } };
  }

  const answered = session.questions.filter((q) => q.userAnswer !== null);
  const scored = session.questions.filter((q) => q.status === "evaluated" && q.evaluationScore !== null);

  // Walked out before answering anything: close it, no report, no model call.
  if (answered.length === 0) {
    const abandoned = await prisma.mockInterviewSession.update({
      where: { id: session.id },
      data: { status: "abandoned", completedAt: new Date() },
    });
    invalidateInterviewHistory(session.userId);
    return { status: 200, body: { success: true, abandoned: true, session: abandoned } };
  }

  // Answers exist that could not be marked — the provider was down, or
  // refused past its retries. Closing anyway used to file a fully answered
  // round as "abandoned" (nothing scored) or write a report with those
  // answers silently missing (some scored). Neither is recoverable once the
  // status flips, so the round stays open and the candidate is asked to try
  // again in a moment.
  if (scored.length < answered.length) {
    return {
      status: 503,
      body: {
        error: "Your answers could not be scored right now. Nothing is lost — try closing the round again in a moment.",
        retryable: true,
        unmarked: answered.length - scored.length,
      },
    };
  }

  const completed = await finalizeInterview(session, configFrom(session.savedInterview), scored);
  return { status: 200, body: { success: true, report: reportOf(completed, scored) } };
}

router.post("/session/:sessionId/complete", requireAuth, async (req: any, res) => {
  const { sessionId } = req.params;

  try {
    let job = completing.get(sessionId);
    if (!job) {
      job = completeWrittenSession(sessionId, req.user.userId).finally(() => completing.delete(sessionId));
      completing.set(sessionId, job);
    }
    const outcome = await job;
    res.status(outcome.status).json(outcome.body);
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
  mode?: string;
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
    // Which room an open round resumes in: the history list used to send every
    // "started" row to the written page, which closed a spoken round unscored.
    mode: session.mode ?? "written",
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
 * The two halves of the history response that span every session — the career
 * analytics and the filter options — computed from one read of up to
 * ANALYTICS_CAP sessions with every mark and every `missed` list. That is by
 * far the heaviest query on the page, and it was run on every first-page load.
 * The result is cached per user and dropped whenever a session is opened,
 * closed or deleted (see services/interview-completion), so between those
 * moments a page load pays for the page and nothing else.
 */
async function historyExtras(userId: string) {
  // Deliberately unfiltered: "your average across every round" must not
  // change because the list below it is filtered to one role.
  const everything = await prisma.mockInterviewSession.findMany({
    where: { userId },
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

  return {
    analytics: careerAnalytics(all),
    // The filter controls are driven from the whole history, not the page —
    // a role filter that only lists the roles on screen is no filter at all.
    filters: {
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
    },
  };
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
          mode: true,
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
      // Dates inside serialise to ISO strings through Redis, which is what
      // res.json() produces on a miss, so the response is the same either way.
      const extras = await cachedShared(interviewHistoryKey(req.user.userId), 300, () =>
        historyExtras(req.user.userId),
      );
      body["analytics"] = extras.analytics;
      body["filters"] = extras.filters;
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

    // A prefetched question has been written but not asked. It is on disk only
    // so that submitting an answer is instant, and handing it out here would
    // let a candidate read the rest of the interview out of the network tab.
    const asked = session.questions.filter((q) => q.status !== "prefetched");

    // While the interview is still live the stored scores stay server-side —
    // resuming a session must not hand back the marks for answers already
    // given. They are released together with the report once it closes.
    const live = session.status !== "completed";
    const questions = live
      ? asked.map((q) => ({
          ...q,
          evaluationScore: null,
          feedback: null,
          verdict: null,
          missed: [],
        }))
      : asked;

    // The list travels once, at the top level — that is what both the web and
    // the mobile client read. `session` used to carry a second, nested copy of
    // the same rows (each with a MediumText answer), doubling every report load.
    const { questions: stored, ...sessionRow } = session;

    res.json({
      session: sessionRow,
      questions,
      language: languageFor(configFrom(session.savedInterview)),
      setup: configFrom(session.savedInterview),
      status: session.status,
      completedAt: session.completedAt,
      startedAt: session.createdAt,
      report: session.status === "completed" ? reportOf(session, stored) : null,
      progress: { asked: asked.length, total: session.questionBudget },
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

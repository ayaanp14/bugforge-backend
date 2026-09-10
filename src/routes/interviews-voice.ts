import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { prettyLabel } from "../lib/interview-labels.js";
import {
  analyzeVoiceTranscript,
  questionBudgetFor,
  type InterviewConfig,
} from "../services/interview-ai.js";
import {
  candidateWordCount,
  coalesce,
  sanitizeEvents,
  stateOf,
} from "../lib/voice-transcript.js";
import { voiceDurationMinutes } from "../lib/interview-duration.js";
import { finalizeInterview, invalidateInterviewHistory } from "../services/interview-completion.js";
import {
  buildContext,
  realtimeProvider,
  RealtimeUnavailable,
} from "../services/realtime-interview.js";

/**
 * The spoken interview's server side.
 *
 * Note what is *not* here: the conversation. Audio goes browser-to-model over a
 * socket this process never sees, because putting Express in that path would
 * add a hop to every 20ms of speech in both directions. What is left is the
 * work that genuinely needs a server — issuing a credential that is safe to
 * hand a browser, writing down what was said as it is said, and marking the
 * round once it is over.
 *
 * Mounted alongside the written router on /api/interviews. Paths are namespaced
 * under /session/:id/voice, so the two never collide.
 */

const router = Router();

/* ── shared guard ──────────────────────────────────────────────────────── */

type Guarded = {
  session: {
    id: string;
    userId: string;
    status: string;
    mode: string;
    questionBudget: number;
    startedAt: Date | null;
    durationLimitSec: number | null;
    voiceState: unknown;
    savedInterview: {
      roleId: string;
      roundId: string;
      difficulty: string | null;
      experienceBand: string | null;
      interviewStyle: string | null;
      stackFocusIds: unknown;
      focusAreaIds: unknown;
    };
  };
};

/**
 * Every voice endpoint answers the same three questions before doing anything:
 * does the session exist, does it belong to the caller, and is it actually a
 * spoken round. Getting that wrong on the token endpoint would mint a
 * credential for someone else's interview, so it is one function rather than
 * three copies.
 */
async function guard(
  sessionId: string,
  userId: string,
): Promise<{ ok: true; data: Guarded["session"] } | { ok: false; status: number; error: string }> {
  const session = await prisma.mockInterviewSession.findUnique({
    where: { id: sessionId },
    include: { savedInterview: true },
  });

  if (!session) return { ok: false, status: 404, error: "Session not found" };
  if (session.userId !== userId) {
    return { ok: false, status: 403, error: "You do not have permission to use this session" };
  }
  if (session.mode !== "voice") {
    return { ok: false, status: 400, error: "This session is not a voice interview" };
  }
  return { ok: true, data: session as unknown as Guarded["session"] };
}

function configFrom(template: Guarded["session"]["savedInterview"]): InterviewConfig {
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

/** Monaco/stack language, mirroring the written round's mapping. */
const STACK_LANGUAGE: Record<string, string> = {
  "react-next": "TypeScript",
  mern: "JavaScript",
  "node-express": "JavaScript",
  "java-spring": "Java",
  "python-django": "Python",
  "sql-analytics": "SQL",
  testing: "JavaScript",
  "cloud-devops": "YAML",
  mobile: "TypeScript",
  "ml-data": "Python",
  security: "JavaScript",
};

function languageFor(config: InterviewConfig) {
  for (const id of config.stackFocusIds) {
    if (STACK_LANGUAGE[id]) return STACK_LANGUAGE[id];
  }
  return "JavaScript";
}

/**
 * Rounds started before the round length was configurable have no limit stored.
 * They get the default rather than an unbounded interview.
 */
const DEFAULT_LIMIT_SEC = voiceDurationMinutes(undefined) * 60;

/** The topic list the interviewer is briefed on — stacks first, then focus. */
function topicsFor(config: InterviewConfig) {
  const topics = [...config.stackFocusIds, ...config.focusAreaIds].map(prettyLabel);
  return topics.length ? [...new Set(topics)] : [prettyLabel(config.roundId)];
}

/* ── bootstrap ─────────────────────────────────────────────────────────── */

/**
 * @route   GET /api/interviews/session/:sessionId/voice
 * @desc    Everything the voice screen needs to render before it connects
 * @access  Private
 */
router.get("/session/:sessionId/voice", requireAuth, async (req: any, res) => {
  try {
    const check = await guard(req.params.sessionId, req.user.userId);
    if (!check.ok) return res.status(check.status).json({ error: check.error });

    const session = check.data;
    const config = configFrom(session.savedInterview);
    const state = stateOf(session.voiceState);

    // A reload mid-interview should not lose what has already been said.
    const events = await prisma.interviewEvent.findMany({
      where: { sessionId: session.id, type: "transcript" },
      orderBy: { sequence: "asc" },
      select: { sequence: true, speaker: true, text: true, questionNumber: true },
    });

    res.json({
      session: {
        id: session.id,
        status: session.status,
        mode: session.mode,
        questionBudget: session.questionBudget,
        startedAt: session.startedAt,
        durationLimitSec: session.durationLimitSec ?? DEFAULT_LIMIT_SEC,
      },
      setup: config,
      language: languageFor(config),
      topics: topicsFor(config),
      state,
      transcript: events,
      /** Where a resumed client must continue counting from. */
      nextSequence: events.length ? Math.max(...events.map((e) => e.sequence)) + 1 : 1,
      /** Seconds already burned, so a resumed round does not restart the clock. */
      elapsedSec: session.startedAt
        ? Math.max(0, Math.round((Date.now() - session.startedAt.getTime()) / 1000))
        : 0,
    });
  } catch (error: any) {
    console.error("[voice] bootstrap failed:", error?.message);
    res.status(500).json({ error: "Failed to load the voice interview" });
  }
});

/* ── credentials ───────────────────────────────────────────────────────── */

/**
 * @route   POST /api/interviews/session/:sessionId/voice/session
 * @desc    Mint a short-lived credential for the browser's realtime socket
 * @access  Private
 *
 * Called once to connect and again on every reconnect — tokens are single-use
 * by design, so a resumed session needs a fresh one.
 */
router.post("/session/:sessionId/voice/session", requireAuth, async (req: any, res) => {
  try {
    const check = await guard(req.params.sessionId, req.user.userId);
    if (!check.ok) return res.status(check.status).json({ error: check.error });

    const session = check.data;
    if (session.status === "completed") {
      return res.status(409).json({ error: "This interview has already been completed" });
    }

    const provider = realtimeProvider();
    if (!provider.isConfigured()) {
      return res.status(503).json({ error: "Voice interviews are not available on this deployment" });
    }

    const config = configFrom(session.savedInterview);
    const state = stateOf(session.voiceState);

    // Questions already asked, so a reconnect does not re-ask them. Only the
    // interviewer's own lines: what the candidate said is context the model
    // rebuilds from its resumption handle, and repeating it here would be the
    // "send the whole transcript every time" cost PHASE 17 rules out.
    const asked = await prisma.interviewEvent.findMany({
      where: { sessionId: session.id, type: "question_started" },
      orderBy: { sequence: "asc" },
      select: { text: true },
      take: 20,
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { name: true },
    });

    const credential = await provider.createCredential(
      buildContext({
        config,
        durationMinutes: Math.round((session.durationLimitSec ?? DEFAULT_LIMIT_SEC) / 60),
        language: languageFor(config),
        roleLabel: prettyLabel(config.roleId),
        roundLabel: prettyLabel(config.roundId),
        topics: topicsFor(config),
        askedSoFar: asked.map((a) => a.text ?? "").filter(Boolean),
        currentQuestion: state.currentQuestion,
        candidateName: user?.name ?? null,
      }),
      // Resuming picks the conversation back up inside the model rather than
      // starting a second interview with the same candidate.
      typeof req.body?.resume === "boolean" && req.body.resume ? state.resumeHandle : null,
    );

    // First connect is also when the clock starts.
    if (!session.startedAt) {
      await prisma.mockInterviewSession.update({
        where: { id: session.id },
        data: { startedAt: new Date() },
      });
    }

    res.json({
      provider: credential.provider,
      model: credential.model,
      url: credential.url,
      setup: credential.setup,
      expiresAt: credential.expiresAt,
    });
  } catch (error: any) {
    if (error instanceof RealtimeUnavailable) {
      return res.status(503).json({ error: error.message });
    }
    console.error("[voice] token mint failed:", error?.message);
    res.status(500).json({ error: "Could not start the voice session" });
  }
});

/* ── incremental persistence ───────────────────────────────────────────── */

/**
 * @route   POST /api/interviews/session/:sessionId/voice/events
 * @desc    Append transcript lines and lifecycle events as they happen
 * @access  Private
 *
 * The client batches on a short timer and posts without awaiting — audio must
 * never wait on a database write. Sequence numbers come from the client, which
 * is the only party that knows the true order of things it observed, and the
 * unique constraint makes a retried batch idempotent rather than duplicated.
 */
router.post("/session/:sessionId/voice/events", requireAuth, async (req: any, res) => {
  try {
    const check = await guard(req.params.sessionId, req.user.userId);
    if (!check.ok) return res.status(check.status).json({ error: check.error });

    const session = check.data;
    const rows = sanitizeEvents(req.body?.events).map((event) => ({
      ...event,
      sessionId: session.id,
      // Prisma types Json input as its own union; the sanitiser has already
      // guaranteed this is a plain object.
      metadata: event.metadata as object,
    }));

    if (rows.length === 0) return res.json({ success: true, written: 0 });

    // skipDuplicates makes a resent batch a no-op. Without it a flaky network
    // turns one retry into a doubled turn in the transcript, which then scores
    // as if the candidate said everything twice.
    const written = await prisma.interviewEvent.createMany({ data: rows, skipDuplicates: true });

    // The state rides along on the same request rather than costing another.
    if (req.body?.state && typeof req.body.state === "object") {
      const merged = { ...stateOf(session.voiceState), ...req.body.state };
      await prisma.mockInterviewSession.update({
        where: { id: session.id },
        data: { voiceState: merged as object },
      });
    }

    res.json({ success: true, written: written.count });
  } catch (error: any) {
    console.error("[voice] event write failed:", error?.message);
    res.status(500).json({ error: "Failed to record interview events" });
  }
});

/* ── completion ────────────────────────────────────────────────────────── */

/** Enough of a conversation to be worth scoring at all. */
const MIN_CANDIDATE_WORDS = 12;

/**
 * @route   POST /api/interviews/session/:sessionId/voice/complete
 * @desc    Close a spoken round: derive question rows, score, write the report
 * @access  Private
 */
router.post("/session/:sessionId/voice/complete", requireAuth, async (req: any, res) => {
  const { sessionId } = req.params;

  try {
    const check = await guard(sessionId, req.user.userId);
    if (!check.ok) return res.status(check.status).json({ error: check.error });

    const session = check.data;

    if (session.status === "completed") {
      return res.json({ success: true, alreadyCompleted: true });
    }

    // Anything the client managed to flush on its way out is already written;
    // this is simply the last read of it.
    const events = await prisma.interviewEvent.findMany({
      where: { sessionId: session.id, type: "transcript" },
      orderBy: { sequence: "asc" },
      select: { speaker: true, text: true },
    });

    const lines = coalesce(events);
    const spokenWords = candidateWordCount(lines);

    const endedAt = new Date();
    const durationSec = session.startedAt
      ? Math.max(0, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000))
      : null;

    // Connected, said nothing, left. There is nothing to score and no report
    // worth writing, so it closes the same way an abandoned written round does.
    if (spokenWords < MIN_CANDIDATE_WORDS) {
      const abandoned = await prisma.mockInterviewSession.update({
        where: { id: session.id },
        data: { status: "abandoned", completedAt: endedAt, endedAt, durationSec },
      });
      invalidateInterviewHistory(session.userId);
      return res.json({ success: true, abandoned: true, session: abandoned });
    }

    const config = configFrom(session.savedInterview);
    const budget = session.questionBudget || questionBudgetFor(config.difficulty);

    const { questions, usage } = await analyzeVoiceTranscript(config, budget, lines);

    if (questions.length === 0) {
      const abandoned = await prisma.mockInterviewSession.update({
        where: { id: session.id },
        data: { status: "abandoned", completedAt: endedAt, endedAt, durationSec },
      });
      invalidateInterviewHistory(session.userId);
      return res.json({ success: true, abandoned: true, session: abandoned });
    }

    // The rows the rest of the product already knows how to read. Written after
    // the fact, but shaped exactly like the ones a typed round writes as it goes.
    await prisma.$transaction(
      questions.map((q, index) =>
        prisma.mockInterviewQuestion.upsert({
          where: { sessionId_orderIndex: { sessionId: session.id, orderIndex: index } },
          update: {},
          create: {
            sessionId: session.id,
            orderIndex: index,
            questionText: q.question,
            userAnswer: q.answer,
            topic: q.topic,
            difficulty: q.difficulty,
            focusArea: q.focusArea,
            expectedSkills: q.expectedSkills,
            evaluationScore: q.score,
            verdict: q.verdict,
            feedback: q.feedback,
            missed: q.missed,
            status: "evaluated",
          },
        }),
      ),
    );

    const stored = await prisma.mockInterviewQuestion.findMany({
      where: { sessionId: session.id, status: "evaluated" },
      orderBy: { orderIndex: "asc" },
    });

    const completed = await finalizeInterview(
      // The budget becomes the count that actually fitted in the time. A spoken
      // round never had a target to miss, so a report reading "6 of 8" would be
      // describing a shortfall that does not exist.
      { id: session.id, userId: session.userId, questionBudget: stored.length },
      config,
      stored,
      usage,
      { endedAt, durationSec, questionBudget: stored.length },
    );

    res.json({
      success: true,
      session: { id: completed.id, status: completed.status, overallScore: completed.overallScore },
      questionsScored: stored.length,
    });
  } catch (error: any) {
    console.error("[voice] completion failed:", error?.message);
    res.status(500).json({ error: "Failed to close the voice interview" });
  }
});

export default router;

import { Router, type Request, type Response, type NextFunction } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { executionLimiter } from "../middleware/rate-limit.js";
import { browserCache } from "../lib/http-cache.js";
import { MAX_SOURCE_BYTES, MAX_STDIN_BYTES } from "../lib/program-judge.js";
import {
  StudyError,
  enroll,
  gradeQuiz,
  lastSubmission,
  lessonFor,
  markRead,
  modulePrintFor,
  runExercise,
  submitExercise,
  trackFor,
  tracksFor,
} from "../services/study-plans.js";

/**
 * The study plans.
 *
 *   GET  /                                   every track, with the reader's standing when signed in
 *   GET  /:track                             the syllabus with every lesson's status, pace, streak
 *   GET  /:track/lessons/:lesson             one lesson (solutions, hidden cases and answers withheld)
 *   GET  /:track/lessons/:lesson/last/:i     the reader's last submission for an exercise
 *   GET  /:track/modules/:module/print       the whole module with the answer key — the print page behind the PDFs
 *   POST /:track/enroll        {paceDays}    enrol, or change the pace
 *   POST /:track/lessons/:lesson/read        the text was read
 *   POST /:track/lessons/:lesson/quiz        {answers: (number|null)[]} → graded, best score kept
 *   POST /:track/lessons/:lesson/run         {exercise, code, stdin} → the program on the learner's input
 *   POST /:track/lessons/:lesson/submit      {exercise, code} → judged against every case, recorded
 *
 * Reads are open (optionalAuth): the syllabus and the text are the pitch,
 * and the print page must render for the PDF script with no session. Every
 * write needs an account, and the two that run code sit behind the same
 * per-user executionLimiter as /api/run.
 */
const router = Router();

type Authed = Request & { user?: { userId: string } };

function handleStudyError(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof StudyError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  next(err);
}

router.get("/", optionalAuth, async (req: Authed, res) => {
  res.json({ tracks: await tracksFor(req.user?.userId ?? null) });
});

router.get("/:track", optionalAuth, async (req: Authed, res) => {
  const payload = await trackFor(String(req.params["track"]), req.user?.userId ?? null);
  if (!payload) {
    res.status(404).json({ error: "No such study plan" });
    return;
  }
  res.json(payload);
});

router.get("/:track/lessons/:lesson", optionalAuth, async (req: Authed, res) => {
  const payload = await lessonFor(String(req.params["track"]), String(req.params["lesson"]), req.user?.userId ?? null);
  if (!payload) {
    res.status(404).json({ error: "No such lesson" });
    return;
  }
  res.json(payload);
});

router.get("/:track/lessons/:lesson/last/:exercise", requireAuth, async (req: Authed, res, next) => {
  try {
    const index = parseInt(String(req.params["exercise"]), 10);
    const last = await lastSubmission(req.user!.userId, String(req.params["track"]), String(req.params["lesson"]), Number.isInteger(index) ? index : -1);
    res.json({ last });
  } catch (err) {
    handleStudyError(err, res, next);
  }
});

router.get("/:track/modules/:module/print", optionalAuth, browserCache(300), async (req, res) => {
  const payload = await modulePrintFor(String(req.params["track"]), String(req.params["module"]));
  if (!payload) {
    res.status(404).json({ error: "No such module" });
    return;
  }
  res.json(payload);
});

router.post("/:track/enroll", requireAuth, async (req: Authed, res, next) => {
  try {
    const paceDays = Number((req.body as { paceDays?: unknown })?.paceDays);
    res.json({ enrollment: await enroll(req.user!.userId, String(req.params["track"]), paceDays) });
  } catch (err) {
    handleStudyError(err, res, next);
  }
});

router.post("/:track/lessons/:lesson/read", requireAuth, async (req: Authed, res, next) => {
  try {
    res.json(await markRead(req.user!.userId, String(req.params["track"]), String(req.params["lesson"])));
  } catch (err) {
    handleStudyError(err, res, next);
  }
});

router.post("/:track/lessons/:lesson/quiz", requireAuth, async (req: Authed, res, next) => {
  try {
    const body = req.body as { answers?: unknown };
    const answers = Array.isArray(body?.answers) ? body.answers.map((a) => (a === null || a === undefined ? null : Number(a))) : null;
    if (!answers) {
      res.status(400).json({ error: "answers must be an array" });
      return;
    }
    res.json(await gradeQuiz(req.user!.userId, String(req.params["track"]), String(req.params["lesson"]), answers));
  } catch (err) {
    handleStudyError(err, res, next);
  }
});

function readCode(req: Request, res: Response): { exercise: number; code: string; stdin: string } | null {
  const body = req.body as { exercise?: unknown; code?: unknown; stdin?: unknown };
  const exercise = Number(body?.exercise ?? 0);
  const code = typeof body?.code === "string" ? body.code : "";
  const stdin = typeof body?.stdin === "string" ? body.stdin : "";
  if (!Number.isInteger(exercise) || exercise < 0) {
    res.status(400).json({ error: "exercise must be an index" });
    return null;
  }
  if (!code.trim()) {
    res.status(400).json({ error: "There is no code to run" });
    return null;
  }
  if (Buffer.byteLength(code, "utf8") > MAX_SOURCE_BYTES) {
    res.status(413).json({ error: "That program is too large for an exercise" });
    return null;
  }
  if (Buffer.byteLength(stdin, "utf8") > MAX_STDIN_BYTES) {
    res.status(413).json({ error: "That input is too large" });
    return null;
  }
  return { exercise, code, stdin };
}

router.post("/:track/lessons/:lesson/run", requireAuth, executionLimiter, async (req: Authed, res, next) => {
  try {
    const input = readCode(req, res);
    if (!input) return;
    const result = await runExercise(String(req.params["track"]), String(req.params["lesson"]), input.exercise, input.code, input.stdin);
    if (result.status === "ENGINE_ERROR") {
      res.status(503).json({ error: "The code runner is not answering right now. Give it a moment and run again." });
      return;
    }
    res.json(result);
  } catch (err) {
    handleStudyError(err, res, next);
  }
});

router.post("/:track/lessons/:lesson/submit", requireAuth, executionLimiter, async (req: Authed, res, next) => {
  try {
    const input = readCode(req, res);
    if (!input) return;
    res.json(await submitExercise(req.user!.userId, String(req.params["track"]), String(req.params["lesson"]), input.exercise, input.code));
  } catch (err) {
    handleStudyError(err, res, next);
  }
});

export default router;

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { TutorError, clearTutor, tutorReply, tutorState } from "../services/tutor.js";

/**
 * The Socratic tutor on a problem (services/tutor.ts) — mounted at
 * /api/problems ahead of the problems router; it has only /:slug/tutor.
 *
 * The answer streams as SSE over the signed POST, exactly as the assistant's
 * does (routes/assistant.ts explains the headers): `rung` {rung} when the
 * message climbs, `token` {t} as the answer is written, then `done`
 * {turnId, rung}, or `error` {error, status}. A refusal found before anything
 * streams — ranked play, an unconfigured model, a skipped rung — is an
 * ordinary JSON answer with its status.
 */

const router = Router();

/**
 * Unlimited by decision, like the assistant; twenty a minute is a script,
 * not a student thinking.
 */
const burstLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: "You are asking very quickly. Give it a moment.",
  keyOf: (req) => (req as typeof req & { user?: { userId: string } }).user?.userId ?? "anon",
});

const slugOf = (req: { params: Record<string, string | undefined> }) => String(req.params["slug"] ?? "").slice(0, 200);

/** GET /api/problems/:slug/tutor — the rung reached, the thread, and whether the tutor is on here. */
router.get("/:slug/tutor", requireAuth, async (req: any, res) => {
  try {
    res.setHeader("Cache-Control", "private, no-store");
    res.json(await tutorState(req.user.userId, slugOf(req)));
  } catch (err) {
    if (err instanceof TutorError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

/** DELETE /api/problems/:slug/tutor — clear the conversation (the rung reached stays). */
router.delete("/:slug/tutor", requireAuth, async (req: any, res) => {
  try {
    await clearTutor(req.user.userId, slugOf(req));
    res.status(204).end();
  } catch (err) {
    if (err instanceof TutorError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
});

/** POST /api/problems/:slug/tutor {message, code?, language?, rung?} — one turn, streamed. */
router.post("/:slug/tutor", requireAuth, burstLimiter, async (req: any, res) => {
  const body = req.body ?? {};
  const ask = {
    message: typeof body.message === "string" ? body.message : "",
    // The workbench's own 64 KB cap; lib/tutor clips what the model reads.
    code: typeof body.code === "string" ? body.code.slice(0, 64 * 1024) : null,
    language: typeof body.language === "string" ? body.language : null,
    rung: typeof body.rung === "number" ? body.rung : null,
  };

  let streaming = false;
  const send = (event: string, data: unknown) => {
    if (!streaming) {
      streaming = true;
      res.status(200);
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
    }
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    (res as typeof res & { flush?: () => void }).flush?.();
  };

  try {
    const { turnId, rung } = await tutorReply(
      req.user.userId,
      slugOf(req),
      ask,
      (r) => send("rung", { rung: r }),
      (t) => send("token", { t }),
    );
    send("done", { turnId, rung });
    res.end();
  } catch (err) {
    const status = err instanceof TutorError ? err.status : 500;
    const text = err instanceof TutorError ? err.message : "The tutor could not answer — try again.";
    if (status >= 500) console.error(`[tutor] ${req.user.userId}:`, (err as Error)?.message);
    // Before anything streamed the refusal is a plain answer; after, the
    // stream is the only channel left.
    if (!streaming) return res.status(status).json({ error: text });
    send("error", { error: text, status });
    res.end();
  }
});

export default router;

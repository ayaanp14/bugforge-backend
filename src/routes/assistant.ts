import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { AssistantError, clearHistory, history, reply } from "../services/assistant.js";
import { checkAssistantQuota } from "../services/entitlements.js";

/**
 * The site assistant's endpoints — the chat itself as a server-sent stream,
 * and the conversation around it.
 *
 * Streamed, because the answer takes several seconds to write and a chat
 * that shows nothing until the last token feels broken. Plain SSE over the
 * signed POST the rest of the API uses (EventSource cannot send the guard's
 * headers, so the client reads the body as a stream instead). `no-transform`
 * keeps the compression middleware from buffering the stream into one
 * chunk, and every write is flushed for the same reason.
 */

const router = Router();

/** A burst guard under the daily allowance: a page's worth of questions a minute, not a script's. */
const burstLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  message: "You are asking very quickly. Give it a moment.",
  keyOf: (req) => (req as typeof req & { user?: { userId: string } }).user?.userId ?? req.ip ?? "unknown",
});

/**
 * @route   GET /api/assistant
 * @desc    The conversation so far and today's allowance
 * @access  Private
 */
router.get("/", requireAuth, async (req: any, res) => {
  const [messages, quota] = await Promise.all([history(req.user.userId), checkAssistantQuota(req.user.userId)]);
  res.json({ messages, quota: { used: quota.used, limit: quota.limit } });
});

/**
 * @route   DELETE /api/assistant
 * @desc    Clear the conversation (the day's allowance is unaffected)
 * @access  Private
 */
router.delete("/", requireAuth, async (req: any, res) => {
  await clearHistory(req.user.userId);
  res.json({ success: true });
});

/**
 * @route   POST /api/assistant/chat
 * @desc    Ask a question; the answer streams back as SSE
 * @access  Private
 *
 * Events: `token` {t} as the answer is written, then `done` {messageId, used,
 * limit}, or `error` {error} if the model failed. A refusal (the daily
 * allowance) is an ordinary 402 JSON answer, since nothing has streamed yet.
 */
router.post("/chat", requireAuth, burstLimiter, async (req: any, res) => {
  const message = typeof req.body?.message === "string" ? req.body.message : "";
  if (!message.trim()) return res.status(400).json({ error: "Write a question first." });

  const quota = await checkAssistantQuota(req.user.userId);
  if (quota.denial) return res.status(402).json(quota.denial);

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    (res as typeof res & { flush?: () => void }).flush?.();
  };

  try {
    const { messageId } = await reply(req.user.userId, message, (t) => send("token", { t }));
    send("done", { messageId, used: quota.used + 1, limit: quota.limit });
  } catch (err) {
    const status = err instanceof AssistantError ? err.status : 500;
    const text = err instanceof AssistantError ? err.message : "The assistant could not answer — try again.";
    // The stream is the only channel left once headers have gone; the
    // failure is still worth a line in the log, since the client only sees
    // the sentence.
    if (status >= 500) console.error(`[assistant] ${req.user.userId}:`, (err as Error)?.message);
    send("error", { error: text, status });
  } finally {
    res.end();
  }
});

export default router;

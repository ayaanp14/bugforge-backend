/**
 * "Why it failed", read — mounted at /api/me/submissions ahead of the /api/me
 * routers (Express runs both; this one has only the /:id/analysis and
 * /:id/roast paths). Owner-only: an analysis quotes the code it reviewed.
 * The workbench polls it after a failed submit until the model's review lands
 * (or is skipped).
 */
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { isRoastStyle } from "../lib/code-roast.js";
import { analysisFor, RoastError, roastFor } from "../services/submission-analysis.js";

const router = Router();

/** GET /api/me/submissions/:id/analysis — "pending" before its row exists, 404 when not the caller's (or accepted). */
router.get("/:id/analysis", requireAuth, async (req, res) => {
  const view = await analysisFor(req.user!.userId, String(req.params["id"] ?? ""));
  if (!view) {
    res.status(404).json({ error: "No analysis for that submission." });
    return;
  }
  res.setHeader("Cache-Control", "private, no-store");
  res.json(view);
});

/**
 * A stored roast is free to ask for again; a new one is a model call. Ten a
 * minute is far past a student laughing at their last few submissions.
 */
const roastLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Easy, the roaster needs a breather. Try again in a minute.",
  keyOf: (req) => (req as typeof req & { user?: { userId: string } }).user?.userId ?? "anon",
});

/** POST /api/me/submissions/:id/roast {style: "english" | "hinglish"} — the roast, written once per style and kept. */
router.post("/:id/roast", requireAuth, roastLimiter, async (req, res) => {
  const style = (req.body as { style?: unknown } | undefined)?.style ?? "english";
  if (!isRoastStyle(style)) {
    res.status(400).json({ error: "style must be english or hinglish." });
    return;
  }
  try {
    const roast = await roastFor(req.user!.userId, String(req.params["id"] ?? "").slice(0, 64), style);
    res.setHeader("Cache-Control", "private, no-store");
    res.json(roast);
  } catch (err) {
    if (err instanceof RoastError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;

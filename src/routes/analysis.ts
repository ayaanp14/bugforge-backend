/**
 * "Why it failed", read — mounted at /api/me/submissions ahead of the /api/me
 * routers (Express runs both; this one has only the /:id/analysis path).
 * Owner-only: an analysis quotes the code it reviewed. The workbench polls it
 * after a failed submit until the model's review lands (or is skipped).
 */
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { analysisFor } from "../services/submission-analysis.js";

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

export default router;

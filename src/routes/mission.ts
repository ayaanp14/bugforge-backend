/**
 * Today's mission, the writes — mounted at /api/me/mission ahead of the
 * /api/me routers. The mission itself is read with the dashboard
 * (GET /api/me/dashboard `mission`, services/mission.ts); each write here
 * drops that cache and answers 204, and the home reads the day again.
 */
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { isMinuteChoice, MINUTE_CHOICES } from "../lib/mission.js";
import { MARK_ACTIONS, markMissionItem, setMissionMinutes, type MarkAction } from "../services/mission.js";

const router = Router();

/** PUT /api/me/mission { minutes } — the time there is today (and, until changed, every day after). */
router.put("/", requireAuth, async (req, res) => {
  const minutes = (req.body as { minutes?: unknown } | undefined)?.minutes;
  if (!isMinuteChoice(minutes)) {
    res.status(400).json({ error: `minutes must be one of ${MINUTE_CHOICES.join(", ")}.` });
    return;
  }
  await setMissionMinutes(req.user!.userId, minutes);
  res.status(204).end();
});

/** POST /api/me/mission/items/:id { action: "done" | "skip" | "undo" } — a hand tick, a skip, or taking either back. */
router.post("/items/:id", requireAuth, async (req, res) => {
  const action = (req.body as { action?: unknown } | undefined)?.action;
  if (typeof action !== "string" || !MARK_ACTIONS.has(action)) {
    res.status(400).json({ error: "action must be done, skip or undo." });
    return;
  }
  const result = await markMissionItem(req.user!.userId, String(req.params["id"] ?? ""), action as MarkAction);
  if (result === "missing") {
    res.status(404).json({ error: "That item is not on today's mission." });
    return;
  }
  if (result === "not-manual") {
    res.status(400).json({ error: "This item ticks itself when it is done." });
    return;
  }
  res.status(204).end();
});

export default router;

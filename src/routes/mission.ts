/**
 * Today's mission, the writes — mounted at /api/me/mission ahead of the
 * /api/me routers. The mission itself is read with the dashboard
 * (GET /api/me/dashboard `mission`, services/mission.ts); each write here
 * rebuilds the day alone, writes it into the cached aggregate, and answers
 * the new day with the "Up next" that goes with it (MissionWrite) — the
 * home patches both into the copy it holds rather than reading the page
 * again. Until 2026-10-13 a write answered 204 and dropped the whole
 * dashboard, so changing the minutes cost a full rebuild and transfer.
 */
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { isMinuteChoice, MINUTE_CHOICES } from "../lib/mission.js";
import { MARK_ACTIONS, markMissionItem, setMissionMinutes, type MarkAction } from "../services/mission.js";

const router = Router();

/** PUT /api/me/mission { minutes } — the time there is today (and, until changed, every day after). Answers the re-picked day. */
router.put("/", requireAuth, async (req, res) => {
  const minutes = (req.body as { minutes?: unknown } | undefined)?.minutes;
  if (!isMinuteChoice(minutes)) {
    res.status(400).json({ error: `minutes must be one of ${MINUTE_CHOICES.join(", ")}.` });
    return;
  }
  res.json(await setMissionMinutes(req.user!.userId, minutes));
});

/** POST /api/me/mission/items/:id { action: "done" | "skip" | "undo" } — a hand tick, a skip, or taking either back. Answers the day as marked. */
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
  res.json(result);
});

export default router;

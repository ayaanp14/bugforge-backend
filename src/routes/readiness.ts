import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { TargetError, readinessFor, setTarget } from "../services/readiness.js";
import { repickMissionToday } from "../services/mission.js";

/**
 * Placement readiness (services/readiness.ts) — mounted at /api/me/readiness
 * ahead of the /api/me routers, like /api/me/skills.
 *
 *   GET /api/me/readiness?company=&test=   the estimate for a company (the saved target by default)
 *   PUT /api/me/readiness/target           {company, test?, date?} — save it; {company: null} clears it
 *
 * Today's mission leans on the target (lib/mission.ts), so a save re-picks
 * the day's undone items for it and drops the dashboard, which also carries
 * the readiness line.
 */

const router = Router();

router.get("/", requireAuth, async (req: any, res) => {
  const q = req.query as Record<string, unknown>;
  const company = typeof q["company"] === "string" && q["company"].trim() ? q["company"].slice(0, 80) : null;
  // `test=` (empty) asks for every pattern of the company; absent means "the saved one".
  const test = typeof q["test"] === "string" ? q["test"].slice(0, 120) || null : undefined;
  res.setHeader("Cache-Control", "private, no-store");
  res.json(await readinessFor(req.user.userId, { company, test }));
});

router.put("/target", requireAuth, async (req: any, res) => {
  try {
    await setTarget(req.user.userId, req.body ?? {});
    await repickMissionToday(req.user.userId);
    res.status(204).end();
  } catch (err) {
    if (err instanceof TargetError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

export default router;

/**
 * The account's skill profile — mounted at /api/me/skills, ahead of
 * routes/me.ts. Both reads are the same cached computation
 * (services/skill-profile.ts): the profile is every skill at a glance, a
 * skill's own read adds its evidence, its components with their reasons and
 * the problems to do next. Personal and changed by every verdict, so never
 * cached by the browser.
 */
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { skillDetail } from "../lib/skill-profile.js";
import { SKILL_KEYS, skillProfileFor } from "../services/skill-profile.js";

const router = Router();

/** GET /api/me/skills — every measurable skill, the focus lists, this week's changes and the mistake mix. */
router.get("/", requireAuth, async (req, res) => {
  const profile = await skillProfileFor(req.user!.userId);
  res.setHeader("Cache-Control", "private, no-store");
  res.json(profile.view);
});

/** GET /api/me/skills/:key — one skill in full ("dsa:two-pointers"). */
router.get("/:key", requireAuth, async (req, res) => {
  const key = String(req.params["key"] ?? "");
  if (!SKILL_KEYS.has(key)) {
    res.status(404).json({ error: "No such skill." });
    return;
  }
  const profile = await skillProfileFor(req.user!.userId);
  const detail = skillDetail(profile, key);
  if (!detail) {
    // A real skill the catalogue cannot evidence yet (no problems, hunts or tests for it).
    res.status(404).json({ error: "This skill cannot be measured yet." });
    return;
  }
  res.setHeader("Cache-Control", "private, no-store");
  res.json(detail);
});

export default router;

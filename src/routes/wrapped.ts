/**
 * CodeKairo Wrapped — GET /api/me/wrapped?year=2026 (services/wrapped.ts).
 * Mounted ahead of the /api/me routers. Signed-in only and the account's own
 * year only: there is no way to ask for someone else's.
 */
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { wrappedYear } from "../lib/wrapped.js";
import { wrappedFor } from "../services/wrapped.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const year = wrappedYear(req.query["year"]);
  if (year === null) {
    res.status(400).json({ error: "No Wrapped for that year." });
    return;
  }
  res.setHeader("Cache-Control", "private, no-store");
  res.json(await wrappedFor(req.user!.userId, year));
});

export default router;

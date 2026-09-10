import { Router } from "express";
import { getLeaderboard } from "../services/dashboard.js";
import { browserCache } from "../lib/http-cache.js";

const router = Router();

// GET /api/leaderboard — Return top 10 users by metric
//
// The same top ten for everyone, recomputed at most once a minute server-side
// (getLeaderboard caps the query at ten rows and caches it for 60s), so the
// browser may keep its copy for the same minute and repaint from it.
router.get("/", browserCache(60, { shared: true }), async (req, res) => {
  const { type = "combined" } = req.query;
  try {
    res.json(await getLeaderboard(String(type)));
  } catch (err) {
    console.error("GET /api/leaderboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

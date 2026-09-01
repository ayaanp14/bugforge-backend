import { Router } from "express";
import { getLeaderboard } from "../services/dashboard.js";

const router = Router();

// GET /api/leaderboard — Return top 10 users by metric
router.get("/", async (req, res) => {
  const { type = "combined" } = req.query;
  try {
    res.json(await getLeaderboard(String(type)));
  } catch (err) {
    console.error("GET /api/leaderboard error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

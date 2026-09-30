import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { getPublicGitHub, getPublicProfile, getPublicSubmissions } from "../services/public-profile.js";

/**
 * Public profiles (services/public-profile.ts): what anyone — signed in or
 * not — may read about an account at /u/<username>. Every route here is a
 * read. A session is optional and only answers "is this my own profile?".
 */

const router = Router();

const NOT_FOUND = { error: "There is no CodeKairo profile with that username." };

// GET /api/users/:username — the profile page's one read
router.get("/:username", optionalAuth, async (req, res) => {
  const profile = await getPublicProfile(String(req.params["username"]), req.user?.userId ?? null);
  if (!profile) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  res.json(profile);
});

// GET /api/users/:username/submissions?page=&limit= — paging past the first five rows
router.get("/:username/submissions", async (req, res) => {
  // Bounded as /api/me/submissions is: no whole-history pulls, no negative skip.
  const page = Math.max(1, parseInt(String(req.query["page"] ?? ""), 10) || 1);
  const limit = Math.min(25, Math.max(1, parseInt(String(req.query["limit"] ?? ""), 10) || 5));
  const history = await getPublicSubmissions(String(req.params["username"]), page, limit);
  if (!history) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  res.json(history);
});

// GET /api/users/:username/github — { card } when a GitHub account is connected and readable, else { card: null }
router.get("/:username/github", async (req, res) => {
  const github = await getPublicGitHub(String(req.params["username"]));
  if (!github) {
    res.status(404).json(NOT_FOUND);
    return;
  }
  res.json(github);
});

export default router;

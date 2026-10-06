import { Router, type Response } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { browserCache } from "../lib/http-cache.js";
import { getPublicGitHub, getPublicProfile, getPublicSubmissions } from "../services/public-profile.js";

/**
 * Public profiles (services/public-profile.ts): what anyone — signed in or
 * not — may read about an account at /u/<username>. Every route here is a
 * read. A session is optional and only answers "is this my own profile?".
 *
 * The profile itself carries `isSelf`, so browserCache(60) without `shared`
 * sends its header to anonymous callers only (and Varies on Authorization):
 * a visitor or a crawler following a profile's links reuses it for a minute,
 * a member never gets a browser copy. The history pages and the GitHub card
 * read nothing off the caller, so every browser keeps them for a minute. The
 * owner looking at their own history right after a solve still sees it: the
 * solve invalidates `Submission` in every tab, and that refetch is forced
 * past the browser cache (store/api/apiSlice). Only a page no tab holds can
 * reopen on the minute-old copy.
 */

const router = Router();

const NOT_FOUND = { error: "There is no CodeKairo profile with that username." };

/**
 * A name that is not taken today may be tomorrow — a sign-up, a rename — so
 * the refusal is not one a browser should keep for the minute a profile is
 * kept.
 */
function notFound(res: Response): void {
  res.removeHeader("Cache-Control");
  res.status(404).json(NOT_FOUND);
}

// GET /api/users/:username — the profile page's one read
router.get("/:username", optionalAuth, browserCache(60), async (req, res) => {
  const profile = await getPublicProfile(String(req.params["username"]), req.user?.userId ?? null);
  if (!profile) {
    notFound(res);
    return;
  }
  res.json(profile);
});

// GET /api/users/:username/submissions?page=&limit= — paging past the first five rows
// optionalAuth on both sub-reads only so an owner previewing a hidden profile gets them.
router.get("/:username/submissions", optionalAuth, browserCache(60, { shared: true }), async (req, res) => {
  // Bounded as /api/me/submissions is: no whole-history pulls, no negative skip.
  const page = Math.max(1, parseInt(String(req.query["page"] ?? ""), 10) || 1);
  const limit = Math.min(25, Math.max(1, parseInt(String(req.query["limit"] ?? ""), 10) || 5));
  const history = await getPublicSubmissions(String(req.params["username"]), req.user?.userId ?? null, page, limit);
  if (!history) {
    notFound(res);
    return;
  }
  res.json(history);
});

// GET /api/users/:username/github — { card } when a GitHub account is connected and readable, else { card: null }
router.get("/:username/github", optionalAuth, browserCache(60, { shared: true }), async (req, res) => {
  const github = await getPublicGitHub(String(req.params["username"]), req.user?.userId ?? null);
  if (!github) {
    notFound(res);
    return;
  }
  res.json(github);
});

export default router;

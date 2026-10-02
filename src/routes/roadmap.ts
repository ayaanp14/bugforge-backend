import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { browserCache } from "../lib/http-cache.js";
import { roadmapFor, roadmapForVisitor } from "../services/roadmap.js";
import { lessonPage, lessonSyllabus } from "../services/roadmap-lessons.js";

/**
 * The DSA roadmap. One read: the fixed stages with the reader's standing on
 * each. There is nothing to write — progress is the judge's business
 * (routes/execution.ts), and the stage-cleared notification is fired from
 * there.
 */
const router = Router();

// Readable without an account: a visitor gets the road with nothing solved
// (the SPA opens /roadmap to search engines); a member gets their standing.
// The visitor's copy — the road with nothing solved — is the same bytes for
// every visitor and is what a crawler reads, so it may sit in their browser
// for a minute. browserCache sends the header to anonymous callers only
// (and Varies on Authorization), so a member's standing is never cached.
router.get("/", optionalAuth, browserCache(60), async (req: any, res) => {
  res.json(req.user ? await roadmapFor(req.user.userId) : await roadmapForVisitor());
});

// The lessons behind the stages (services/roadmap-lessons): the syllabus
// and one lesson's page. Nothing in either reads the caller — a reader's
// standing is the road's own read above — so both are the same bytes for
// everyone and may sit in any browser for five minutes.
router.get("/lessons", browserCache(300, { shared: true }), async (_req, res) => {
  res.json(await lessonSyllabus());
});

router.get("/lessons/:slug", browserCache(300, { shared: true }), async (req, res) => {
  const slug = String(req.params["slug"] ?? "");
  const page = /^[a-z0-9][a-z0-9-]{0,80}$/.test(slug) ? await lessonPage(slug) : null;
  if (!page) {
    res.status(404).json({ error: "There is no lesson at this address." });
    return;
  }
  res.json(page);
});

export default router;

import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { roadmapFor, roadmapForVisitor } from "../services/roadmap.js";

/**
 * The DSA roadmap. One read: the fixed stages with the reader's standing on
 * each. There is nothing to write — progress is the judge's business
 * (routes/execution.ts), and the stage-cleared notification is fired from
 * there.
 */
const router = Router();

// Readable without an account: a visitor gets the road with nothing solved
// (the SPA opens /roadmap to search engines); a member gets their standing.
router.get("/", optionalAuth, async (req: any, res) => {
  res.json(req.user ? await roadmapFor(req.user.userId) : await roadmapForVisitor());
});

export default router;

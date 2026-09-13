import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { roadmapFor } from "../services/roadmap.js";

/**
 * The DSA roadmap. One read: the fixed stages with the reader's standing on
 * each. There is nothing to write — progress is the judge's business
 * (routes/execution.ts), and the stage-cleared notification is fired from
 * there.
 */
const router = Router();

router.get("/", requireAuth, async (req: any, res) => {
  res.json(await roadmapFor(req.user.userId));
});

export default router;

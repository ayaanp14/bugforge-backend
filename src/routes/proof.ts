import { Router } from "express";
import { browserCache } from "../lib/http-cache.js";
import { socialProof } from "../services/social-proof.js";

/**
 * GET /api/proof — the landing page's "who is here" (services/social-proof).
 * Caller-free: the same answer for everyone, so it is cached in the browser
 * for anyone, signed in or not; the platform guard still applies (the SPA
 * signs it), so it is not a CDN route.
 */
const router = Router();

router.get("/", browserCache(300, { shared: true }), async (_req, res) => {
  res.json(await socialProof());
});

export default router;

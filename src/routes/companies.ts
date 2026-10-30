import { Router } from "express";
import { browserCache, SEEDED_CONTENT_MAX_AGE } from "../lib/http-cache.js";
import { companyDirectory } from "../services/company-directory.js";

/**
 * /api/companies — the company directory (services/company-directory): every
 * company with its coding questions, test patterns, process and experiences.
 * Caller-free, shared-cached like the other seeded reads.
 */
const router = Router();

router.get("/", browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (_req, res) => {
  res.json({ companies: await companyDirectory() });
});

export default router;

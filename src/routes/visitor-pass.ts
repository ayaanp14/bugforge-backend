import { Router } from "express";
import { browserCache } from "../lib/http-cache.js";
import { challengeRequired, mintPass, turnstileSiteKey, verifyTurnstile } from "../lib/visitor-pass.js";
import { addressOf, visitorPassLimiter } from "../middleware/rate-limit.js";

/**
 * /api/visitor-pass — how a visitor gets the pass the compiler and the free
 * ATS check ask for (lib/visitor-pass says why it exists).
 *
 *   GET  /   { siteKey }   the Turnstile site key, or null when no challenge
 *                          is asked (the SPA then sends no pass at all)
 *   POST /   { token }     a Turnstile token → { pass, expiresAt }
 */
const router = Router();

// The same answer for everyone, changing only with the server's env.
router.get("/", browserCache(300, { shared: true }), (_req, res) => {
  res.json({ siteKey: challengeRequired() ? turnstileSiteKey() : null });
});

router.post("/", visitorPassLimiter, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!challengeRequired()) {
    res.json(mintPass(addressOf(req)));
    return;
  }
  const token = (req.body as { token?: unknown } | undefined)?.token;
  // Turnstile tokens run to about 2 KB; anything longer is not one.
  if (typeof token !== "string" || !token || token.length > 4096) {
    res.status(400).json({ error: "The check did not finish. Try again." });
    return;
  }
  const outcome = await verifyTurnstile(token, req.ip);
  if (outcome === "unavailable") {
    res.status(503).json({ error: "We couldn't confirm the check just now. Try again in a moment." });
    return;
  }
  if (outcome === "failed") {
    res.status(403).json({ error: "The check did not pass. Reload the page and try again." });
    return;
  }
  res.json(mintPass(addressOf(req)));
});

export default router;

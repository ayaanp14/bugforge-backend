import { Router } from "express";
import type { Request } from "express";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { claimInvite, invitePage, previewInvite } from "../services/referrals.js";

/**
 * Invite links (services/referrals.ts, rules in lib/referrals.ts).
 *
 *   GET  /api/referrals/me             the member's link, what it pays, the
 *                                      friends who joined and what each paid
 *   GET  /api/referrals/invite/:code   what /r/<code> shows anyone: who sent
 *                                      it and the terms; 404 for no such code
 *   POST /api/referrals/claim          { code } — count this new account as
 *                                      invited; 201, or 404/409 with the sentence
 */
const router = Router();

/** A claim is made once per sign-up; this only stops a script walking codes. */
const claimLimiter = rateLimit({
  windowMs: 60 * 60_000,
  max: 20,
  message: "Too many invite codes tried. Try again in an hour.",
  keyOf: (req) => (req as Request).user?.userId ?? "anon",
});

router.get("/me", requireAuth, async (req, res) => {
  const page = await invitePage(req.user!.userId);
  if (!page) return void res.status(404).json({ error: "Account not found" });
  res.json(page);
});

router.get("/invite/:code", async (req, res) => {
  const preview = await previewInvite(req.params["code"]);
  if (!preview) return void res.status(404).json({ error: "That invite link doesn't work." });
  res.json(preview);
});

router.post("/claim", requireAuth, claimLimiter, async (req, res) => {
  const body = (req.body ?? {}) as { code?: unknown };
  const outcome = await claimInvite(req.user!.userId, body.code);
  if (!outcome.ok) return void res.status(outcome.status).json({ error: outcome.error });
  res.status(201).json(outcome);
});

export default router;

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { redeemLimiter } from "../middleware/rate-limit.js";
import { goodiesPage, redeem } from "../services/goodies.js";

/**
 * Goodies (lib/goodies.ts): points earned by practising, redeemed for credits.
 *
 *   GET  /api/goodies               balance + where it came from, the items
 *                                   with why each cannot be redeemed yet, the
 *                                   wallet, the newest redemptions
 *   POST /api/goodies/:id/redeem    granted at once, or 409 with the sentence
 */
export const goodiesRouter = Router();

goodiesRouter.get("/", requireAuth, async (req, res) => {
  const page = await goodiesPage(req.user!.userId);
  if (!page) return void res.status(404).json({ error: "Account not found" });
  res.json(page);
});

goodiesRouter.post("/:id/redeem", requireAuth, redeemLimiter, async (req, res) => {
  const outcome = await redeem(req.user!.userId, String(req.params["id"]));
  if (!outcome.ok) return void res.status(outcome.status).json({ error: outcome.error });
  res.status(201).json(outcome);
});

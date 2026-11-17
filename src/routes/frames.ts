import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { framesPage, setWornFrame } from "../services/frames.js";

/**
 * Profile-picture frames (lib/frames.ts), at /api/me/frames:
 *
 *   GET /api/me/frames                 every frame shown to the account: earned, progress, the one worn
 *   PUT /api/me/frames/worn {frame}    wear one — an id, "none", or null for Auto; 409 when not earned
 *
 * Owner-only by construction: both read and write the caller's own account.
 */
export const framesRouter = Router();

framesRouter.get("/", requireAuth, async (req, res) => {
  res.json(await framesPage(req.user!.userId));
});

framesRouter.put("/worn", requireAuth, async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const outcome = await setWornFrame(req.user!.userId, body["frame"]);
  if (!outcome.ok) return void res.status(outcome.status).json({ error: outcome.error });
  res.json({ worn: outcome.worn });
});

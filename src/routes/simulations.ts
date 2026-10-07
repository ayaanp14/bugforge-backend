import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { SimulationError, endRun, openRound, simulationList, simulationPage, startRun } from "../services/simulations.js";

/**
 * Company simulations (services/simulations.ts) at /api/simulations.
 *
 *   GET  /                              every simulation, with the reader's latest run of each
 *   GET  /:slug                         one simulation: rounds, sources, the live run and the past ones
 *   POST /:slug/runs {hrMode}           start a run (or get the live one back)
 *   POST /runs/:id/rounds/:key/open     open a round; answers where to go
 *   POST /runs/:id/end                  end a live run early
 *
 * The templates are public reads; a visitor gets them without runs. Every
 * write is the member's own run.
 */

const router = Router();

const fail = (res: any, err: unknown) => {
  if (err instanceof SimulationError) return res.status(err.status).json({ error: err.message });
  throw err;
};

router.get("/", optionalAuth, async (req: any, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  res.json(await simulationList(req.user?.userId ?? null));
});

router.post("/runs/:id/rounds/:key/open", requireAuth, async (req: any, res) => {
  try {
    res.json(await openRound(req.user.userId, String(req.params.id), String(req.params.key)));
  } catch (err) {
    fail(res, err);
  }
});

router.post("/runs/:id/end", requireAuth, async (req: any, res) => {
  try {
    await endRun(req.user.userId, String(req.params.id));
    res.status(204).end();
  } catch (err) {
    fail(res, err);
  }
});

router.get("/:slug", optionalAuth, async (req: any, res) => {
  try {
    res.setHeader("Cache-Control", "private, no-store");
    res.json(await simulationPage(req.user?.userId ?? null, String(req.params.slug)));
  } catch (err) {
    fail(res, err);
  }
});

router.post("/:slug/runs", requireAuth, async (req: any, res) => {
  try {
    res.status(201).json(await startRun(req.user.userId, String(req.params.slug), req.body?.hrMode));
  } catch (err) {
    fail(res, err);
  }
});

export default router;

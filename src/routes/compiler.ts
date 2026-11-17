import { Router, type NextFunction, type Request, type Response } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { compilerVisitorHourLimiter, compilerVisitorLimiter, executionLimiter } from "../middleware/rate-limit.js";
import { requireVisitorPass } from "../middleware/visitor-pass.js";
import { LOCAL_LANGUAGES, parseRunRequest, visitorBudget } from "../lib/compiler.js";
import { runProgram } from "../lib/program-judge.js";
import { ENGINE_DOWN_MESSAGE } from "../lib/engine-error.js";

/**
 * /api/compiler — the online compiler behind /compiler/<language>: one
 * whole program and its stdin, run once, the output returned. Nothing is
 * stored and nothing is judged.
 *
 * Open to visitors, since a compiler that asks for an account first is not
 * what anyone searching "online java compiler" is looking for. The two
 * paths differ only in what caps them:
 *   - signed in: the per-account executionLimiter every other Run uses;
 *   - a visitor: per-address limits, a visitor pass (a Turnstile challenge
 *     answered in the last half hour — lib/visitor-pass) and the budget all
 *     visitors share (lib/compiler VisitorBudget), so the free engine stays
 *     free for members' judging.
 */
const router = Router();

const visitorGate = Router();
visitorGate.use(compilerVisitorLimiter, compilerVisitorHourLimiter, requireVisitorPass);

function limitByCaller(req: Request, res: Response, next: NextFunction): void {
  if (req.user) executionLimiter(req, res, next);
  else visitorGate(req, res, next);
}

router.post("/run", optionalAuth, limitByCaller, async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const parsed = parseRunRequest(req.body);
  if (!parsed.ok) {
    res.status(parsed.status).json({ error: parsed.error });
    return;
  }

  // SQL runs in this process (lib/sql/engine, its own queue and deadline), so a
  // visitor's SQL draws nothing from the budget kept for the remote engine.
  const visitor = !req.user && !LOCAL_LANGUAGES.has(parsed.run.language);
  if (visitor) {
    const slot = visitorBudget.take();
    if (slot !== "ok") {
      res.setHeader("Retry-After", slot === "busy" ? "5" : String(visitorBudget.secondsToRefill()));
      res.status(503).json({
        error:
          slot === "busy"
            ? "The free runner is busy for a moment. Run again in a few seconds, or sign in free to skip the queue."
            : "The free runner has done all the runs it can this hour. Sign in free to keep running code.",
      });
      return;
    }
  }

  try {
    const { language, code, stdin } = parsed.run;
    const result = await runProgram(code, language, stdin);
    if (result.status === "ENGINE_ERROR") {
      // For SQL that is the local engine's queue being full, not an outage.
      res.status(503).json({ error: LOCAL_LANGUAGES.has(language) ? "The SQL runner is busy — run again in a few seconds." : ENGINE_DOWN_MESSAGE });
      return;
    }
    res.json(result);
  } finally {
    if (visitor) visitorBudget.release();
  }
});

export default router;

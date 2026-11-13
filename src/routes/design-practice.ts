import { Router, type NextFunction, type Request, type Response } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { addressOf, rateLimit } from "../middleware/rate-limit.js";
import { DesignPracticeError, designAttempt, designProblem, designProblems, submitDesign } from "../services/design-practice.js";

/**
 * The system design canvas (services/design-practice). The problem list and a
 * problem's page read for visitors too (optionalAuth: their own standing only
 * when signed in); a review and its result are the member's own.
 */
const router = Router();

/** A review is a model call; twenty an hour is a heavy practice day. */
const designReviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "That is a lot of design reviews in one hour. Give it a little while before the next one.",
  keyOf: (req) => (req as Request & { user?: { userId: string } }).user?.userId ?? addressOf(req),
});

const fail = (res: Response, next: NextFunction) => (error: unknown) => {
  if (error instanceof DesignPracticeError) return void res.status(error.status).json({ error: error.message });
  next(error);
};

router.get("/", optionalAuth, (req: any, res, next) => {
  designProblems(req.user?.userId ?? null).then((body) => res.json(body), fail(res, next));
});

router.get("/attempts/:id", requireAuth, (req: any, res, next) => {
  designAttempt(req.user.userId, String(req.params.id).slice(0, 191)).then((body) => res.json(body), fail(res, next));
});

router.get("/:slug", optionalAuth, (req: any, res, next) => {
  designProblem(String(req.params.slug), req.user?.userId ?? null).then((body) => res.json(body), fail(res, next));
});

router.post("/:slug/attempts", requireAuth, designReviewLimiter, (req: any, res, next) => {
  submitDesign(req.user.userId, String(req.params.slug), req.body?.answer).then((body) => res.status(201).json(body), fail(res, next));
});

export default router;

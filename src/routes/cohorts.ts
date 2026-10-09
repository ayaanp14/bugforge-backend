import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";
import {
  CohortError,
  closeCohort,
  cohortFor,
  cohortsOf,
  createCohort,
  joinByCode,
  joinSession,
  leaveCohort,
  previewInvite,
  regenerateCode,
  removeMember,
  rename,
  setGoal,
  startSession,
} from "../services/cohorts.js";

/**
 * Study cohorts (services/cohorts.ts) at /api/cohorts. Every route is for a
 * signed-in member: a cohort the caller is not in is the same 404 as one that
 * never existed, and only an invite code admits anyone.
 *
 *   GET    /                              → { cohorts, limits }
 *   POST   /                              → { id }            create (the caller owns it)
 *   GET    /invite/:code                  → InvitePreview     what a link shows before joining
 *   POST   /join                          → { id }            { code }
 *   GET    /:id                           → CohortView
 *   PATCH  /:id                           → 204               { name }            owner
 *   PUT    /:id/goal                      → 204               { skills, target }  owner
 *   POST   /:id/code                      → { inviteCode }    a new code; the old one dies  owner
 *   DELETE /:id/members/:userId           → 204               owner
 *   POST   /:id/close                     → 204               owner
 *   POST   /:id/leave                     → 204
 *   POST   /:id/sessions                  → { roomId }        { slug }
 *   POST   /:id/sessions/:sessionId/join  → { roomId }
 */

const router = Router();

const userOf = (req: Request) => req.user!.userId;

/** Typing and clicking speed, not a quota. */
const writeLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: "That is a lot of changes in a minute. Give it a moment.",
  keyOf: (req) => (req as Request).user?.userId ?? "anon",
});

/** Codes are 40 random bits, but nothing should get to try them by the thousand. */
const codeLimiter = rateLimit({
  windowMs: 60 * 60_000,
  max: 30,
  message: "Too many invite codes tried. Try again in an hour.",
  keyOf: (req) => (req as Request).user?.userId ?? "anon",
});

const ID = /^[a-z0-9]{10,40}$/i;
const param = (req: Request, name: string) => {
  const v = String((req.params as Record<string, unknown>)[name] ?? "");
  if (!ID.test(v)) throw new CohortError("No such cohort.", 404);
  return v;
};

/** Express 5 forwards a rejected promise to the error handler; a CohortError is an answer, not a crash. */
const handle =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  async (req: Request, res: Response): Promise<void> => {
    try {
      await fn(req, res);
    } catch (err) {
      if (!(err instanceof CohortError)) throw err;
      res.status(err.status).json({ error: err.message });
    }
  };

const noStore = (res: Response) => res.setHeader("Cache-Control", "private, no-store");

router.get(
  "/",
  requireAuth,
  handle(async (req, res) => {
    noStore(res);
    res.json(await cohortsOf(userOf(req)));
  }),
);

router.post(
  "/",
  requireAuth,
  writeLimiter,
  handle(async (req, res) => {
    res.status(201).json(await createCohort(userOf(req), req.body));
  }),
);

router.get(
  "/invite/:code",
  requireAuth,
  codeLimiter,
  handle(async (req, res) => {
    noStore(res);
    res.json(await previewInvite(userOf(req), req.params["code"]));
  }),
);

router.post(
  "/join",
  requireAuth,
  codeLimiter,
  handle(async (req, res) => {
    res.json(await joinByCode(userOf(req), (req.body as Record<string, unknown> | undefined)?.["code"]));
  }),
);

router.get(
  "/:id",
  requireAuth,
  handle(async (req, res) => {
    noStore(res);
    res.json(await cohortFor(userOf(req), param(req, "id")));
  }),
);

router.patch(
  "/:id",
  requireAuth,
  writeLimiter,
  handle(async (req, res) => {
    await rename(userOf(req), param(req, "id"), req.body);
    res.status(204).end();
  }),
);

router.put(
  "/:id/goal",
  requireAuth,
  writeLimiter,
  handle(async (req, res) => {
    await setGoal(userOf(req), param(req, "id"), req.body);
    res.status(204).end();
  }),
);

router.post(
  "/:id/code",
  requireAuth,
  writeLimiter,
  handle(async (req, res) => {
    res.json(await regenerateCode(userOf(req), param(req, "id")));
  }),
);

router.delete(
  "/:id/members/:userId",
  requireAuth,
  writeLimiter,
  handle(async (req, res) => {
    await removeMember(userOf(req), param(req, "id"), param(req, "userId"));
    res.status(204).end();
  }),
);

router.post(
  "/:id/close",
  requireAuth,
  writeLimiter,
  handle(async (req, res) => {
    await closeCohort(userOf(req), param(req, "id"));
    res.status(204).end();
  }),
);

router.post(
  "/:id/leave",
  requireAuth,
  writeLimiter,
  handle(async (req, res) => {
    await leaveCohort(userOf(req), param(req, "id"));
    res.status(204).end();
  }),
);

router.post(
  "/:id/sessions",
  requireAuth,
  writeLimiter,
  handle(async (req, res) => {
    res.status(201).json(await startSession(userOf(req), param(req, "id"), req.body));
  }),
);

router.post(
  "/:id/sessions/:sessionId/join",
  requireAuth,
  writeLimiter,
  handle(async (req, res) => {
    res.json(await joinSession(userOf(req), param(req, "id"), param(req, "sessionId")));
  }),
);

export default router;

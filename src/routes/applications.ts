import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { ApplicationError, createApplication, deleteApplication, targetFromApplication, trackerFor, updateApplication } from "../services/applications.js";

/**
 * The application tracker (services/applications.ts) at /api/me/applications
 * — mounted ahead of the /api/me routers. Owner-only by construction: every
 * read and write is scoped by the session's account, and someone else's id
 * is the same 404 as one that never existed.
 *
 *   GET    /             → { applications, summary, target }
 *   POST   /             → the new row
 *   PATCH  /:id          → the row as it now stands
 *   DELETE /:id          → 204
 *   POST   /:id/target   → { company, date } — the readiness target, today's mission re-picked
 */

const router = Router();

/** Typing speed, not a cap: the tracker itself holds 200 rows. */
const writeLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  message: "That is a lot of changes in a minute. Give it a moment.",
  keyOf: (req) => (req as typeof req & { user?: { userId: string } }).user?.userId ?? "anon",
});

const ID = /^[a-z0-9]{10,40}$/i;
const idOf = (req: { params: object }) => {
  const id = String((req.params as Record<string, unknown>)["id"] ?? "");
  if (!ID.test(id)) throw new ApplicationError("No such application.", 404);
  return id;
};

function fail(res: import("express").Response, err: unknown): boolean {
  if (!(err instanceof ApplicationError)) return false;
  res.status(err.status).json({ error: err.message });
  return true;
}

router.get("/", requireAuth, async (req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  res.json(await trackerFor(req.user!.userId));
});

router.post("/", requireAuth, writeLimiter, async (req, res) => {
  try {
    res.status(201).json(await createApplication(req.user!.userId, req.body));
  } catch (err) {
    if (!fail(res, err)) throw err;
  }
});

router.patch("/:id", requireAuth, writeLimiter, async (req, res) => {
  try {
    res.json(await updateApplication(req.user!.userId, idOf(req), req.body));
  } catch (err) {
    if (!fail(res, err)) throw err;
  }
});

router.delete("/:id", requireAuth, writeLimiter, async (req, res) => {
  try {
    await deleteApplication(req.user!.userId, idOf(req));
    res.status(204).end();
  } catch (err) {
    if (!fail(res, err)) throw err;
  }
});

router.post("/:id/target", requireAuth, writeLimiter, async (req, res) => {
  try {
    res.json(await targetFromApplication(req.user!.userId, idOf(req)));
  } catch (err) {
    if (!fail(res, err)) throw err;
  }
});

export default router;

import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { parseClientError, parseEvents, recordEvents, reportError } from "../lib/telemetry.js";

/**
 * Where the SPA and the app send what happened to them.
 *
 * Both endpoints answer 204 before anything is written and never fail the
 * caller: telemetry that can error is telemetry the client has to handle,
 * and the client has better things to do. A signed-out visitor is accepted
 * too (optionalAuth) — the landing page is where most people are lost, and
 * knowing that needs their page views.
 */
const router = Router();

/**
 * Generous for a page that batches, tight enough that a tab stuck in a
 * reporting loop — an error thrown while reporting an error — cannot fill
 * the table. Keyed by address: the same person signed out and in is one bucket.
 */
const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: "Too many telemetry requests.",
});

function platformOf(body: unknown): "web" | "android" {
  const p = body && typeof body === "object" ? (body as { platform?: unknown }).platform : null;
  return p === "android" ? "android" : "web";
}

// POST /api/events — a batch of product events
router.post("/", ingestLimiter, optionalAuth, (req, res) => {
  const events = parseEvents(req.body);
  res.status(204).end();
  recordEvents(events, { userId: req.user?.userId ?? null, platform: platformOf(req.body) });
});

// POST /api/events/errors — one client-side error
router.post("/errors", ingestLimiter, optionalAuth, (req, res) => {
  const input = parseClientError(req.body, {
    userId: req.user?.userId ?? null,
    userAgent: req.headers["user-agent"] ?? null,
    source: platformOf(req.body),
  });
  res.status(204).end();
  if (input) reportError(input);
});

export default router;

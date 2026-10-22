import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { signSession } from "../lib/auth-session.js";
import { prisma } from "../lib/prisma.js";
import { isExternalSlug, isExternalSource, parsePageProblem, parseSolve, SOLVE_LIMITS, type ExternalSource, type ReportedSolve } from "../lib/external.js";
import {
  ExternalError,
  badgeFor,
  clearExternalTutor,
  externalTutorReply,
  externalTutorState,
  importSolves,
  nextFor,
  parseFailure,
  problemInfo,
  recordSolve,
  reviewFailure,
  reviewsFor,
  setRevision,
  type RevisionAction,
} from "../services/external.js";

/**
 * The browser extension's API (services/external.ts, lib/external.ts), at
 * /api/ext. Every route names the other site and its problem by the site's
 * own slug — `/:source/:slug` — and refuses a source or slug it does not
 * recognise before anything is read.
 *
 * The extension calls from its service worker and side panel, which Chrome
 * exempts from CORS for the hosts the manifest names, so no origin is added
 * to ALLOWED_ORIGINS for it; it signs like the SPA, under its own platform
 * id (middleware/platformGuard.ts), and authenticates with a Bearer session
 * minted for it by `POST /api/ext/session` from a signed-in page.
 */

const router = Router();

type Req = { params: Record<string, string | undefined>; query: Record<string, unknown>; body?: unknown; user?: { userId: string; email: string | null } };

const userIdOf = (req: unknown): string | null => (req as Req).user?.userId ?? null;

/** The `:source/:slug` pair, or null after answering 404. */
function target(req: Req, res: { status: (n: number) => { json: (b: unknown) => void } }): { source: ExternalSource; slug: string } | null {
  const source = req.params["source"];
  const slug = req.params["slug"];
  if (!isExternalSource(source) || !isExternalSlug(slug)) {
    res.status(404).json({ error: "Unknown problem." });
    return null;
  }
  return { source, slug };
}

function fail(res: { status: (n: number) => { json: (b: unknown) => void } }, err: unknown): boolean {
  if (err instanceof ExternalError) {
    res.status(err.status).json({ error: err.message });
    return true;
  }
  return false;
}

const titleOf = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : null);
const bodyOf = (req: unknown): Record<string, unknown> => {
  const b = (req as Req).body;
  return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
};

const perUser = (req: unknown) => userIdOf(req) ?? "anon";

/** The tutor's own brake (routes/tutor.ts), counted per account. */
const tutorLimiter = rateLimit({ windowMs: 60_000, max: 20, message: "You are asking very quickly. Give it a moment.", keyOf: perUser });
/** Each review is one model call; a person reads one per failed submission. */
const reviewLimiter = rateLimit({ windowMs: 60 * 60_000, max: 60, message: "That is a lot of reviews in an hour. Try again a little later.", keyOf: perUser });
const importLimiter = rateLimit({ windowMs: 60 * 60_000, max: 10, message: "The solved list was imported a moment ago. Try again later.", keyOf: perUser });

/**
 * POST /api/ext/session — a session for the extension, from a signed-in page
 * of the site (pages/ExtensionConnectPage). A token of its own, so signing
 * the extension out (`POST /api/auth/logout` with it) ends only that one.
 */
router.post("/session", requireAuth, (req, res) => {
  const user = (req as unknown as Req).user!;
  res.setHeader("Cache-Control", "no-store");
  res.status(201).json({ token: signSession({ id: user.userId, email: user.email }) });
});

/** GET /api/ext/me — who the extension is signed in as, and the badge. */
router.get("/me", requireAuth, async (req, res) => {
  const userId = userIdOf(req)!;
  const [user, badge] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, username: true, avatar_url: true } }),
    badgeFor(userId),
  ]);
  if (!user) return res.status(401).json({ error: "Session expired." });
  res.setHeader("Cache-Control", "private, no-store");
  res.json({ user: { name: user.name, username: user.username, avatar: user.avatar_url }, ...badge });
});

/** GET /api/ext/:source/reviews — the revision list: due, then the week ahead. Ahead of /:source/:slug, which would take "reviews" for a slug. */
router.get("/:source/reviews", requireAuth, async (req, res) => {
  const source = req.params["source"];
  if (!isExternalSource(source)) return res.status(404).json({ error: "Unknown site." });
  res.setHeader("Cache-Control", "private, no-store");
  res.json(await reviewsFor(userIdOf(req)!, source));
});

/** GET /api/ext/:source/:slug?title= — the panel: our copy, its companies, topics, lessons, stage; the account's record. */
router.get("/:source/:slug", optionalAuth, async (req, res) => {
  const t = target(req as unknown as Req, res);
  if (!t) return;
  res.setHeader("Cache-Control", "private, no-store");
  res.json(await problemInfo(t.source, t.slug, titleOf(req.query["title"]), userIdOf(req)));
});

/** POST /api/ext/:source/:slug/solve {title, difficulty, tags, at?, track?} — an accept the extension saw. */
router.post("/:source/:slug/solve", requireAuth, async (req, res) => {
  const t = target(req as unknown as Req, res);
  if (!t) return;
  const body = bodyOf(req);
  const solve = parseSolve({ ...body, slug: t.slug }, Date.now());
  if (typeof solve === "string") return res.status(400).json({ error: solve });
  const track = typeof body["track"] === "boolean" ? body["track"] : null;
  res.status(201).json(await recordSolve(userIdOf(req)!, t.source, solve, track));
});

/** PUT /api/ext/:source/:slug/revision {action: track|untrack|remembered|forgot}. */
router.put("/:source/:slug/revision", requireAuth, async (req, res) => {
  const t = target(req as unknown as Req, res);
  if (!t) return;
  const action = bodyOf(req)["action"];
  if (action !== "track" && action !== "untrack" && action !== "remembered" && action !== "forgot") return res.status(400).json({ error: "Unknown action." });
  try {
    res.json(await setRevision(userIdOf(req)!, t.source, t.slug, action as RevisionAction));
  } catch (err) {
    if (!fail(res, err)) throw err;
  }
});

/** GET /api/ext/:source/:slug/next?title= — after an accept: the weakest skill it works and what to do for it. */
router.get("/:source/:slug/next", requireAuth, async (req, res) => {
  const t = target(req as unknown as Req, res);
  if (!t) return;
  res.setHeader("Cache-Control", "private, no-store");
  res.json(await nextFor(userIdOf(req)!, t.source, t.slug, titleOf(req.query["title"])));
});

/** POST /api/ext/:source/import {solves: [{slug, title, difficulty, tags, at}], trackDays?} — the solved list, at once. */
router.post("/:source/import", requireAuth, importLimiter, async (req, res) => {
  const source = req.params["source"];
  if (!isExternalSource(source)) return res.status(404).json({ error: "Unknown site." });
  const body = bodyOf(req);
  const list = Array.isArray(body["solves"]) ? body["solves"] : null;
  if (!list) return res.status(400).json({ error: "Send the solved list." });
  if (list.length > SOLVE_LIMITS.import) return res.status(413).json({ error: `At most ${SOLVE_LIMITS.import} solves at once.` });
  const now = Date.now();
  const solves = list.map((s) => parseSolve(s, now)).filter((s): s is ReportedSolve => typeof s !== "string");
  const days = typeof body["trackDays"] === "number" && body["trackDays"] > 0 && body["trackDays"] <= 365 ? body["trackDays"] : null;
  res.json(await importSolves(userIdOf(req)!, source, solves, days ? now - days * 86_400_000 : null));
});

// ── The tutor (SSE, as routes/tutor.ts) ─────────────────────────────

router.get("/:source/:slug/tutor", requireAuth, async (req, res) => {
  const t = target(req as unknown as Req, res);
  if (!t) return;
  res.setHeader("Cache-Control", "private, no-store");
  res.json(await externalTutorState(userIdOf(req)!, t.source, t.slug));
});

router.delete("/:source/:slug/tutor", requireAuth, async (req, res) => {
  const t = target(req as unknown as Req, res);
  if (!t) return;
  await clearExternalTutor(userIdOf(req)!, t.source, t.slug);
  res.status(204).end();
});

/** POST /api/ext/:source/:slug/tutor {problem, url, message, code?, language?, rung?} — one turn, streamed. */
router.post("/:source/:slug/tutor", requireAuth, tutorLimiter, async (req, res) => {
  const t = target(req as unknown as Req, res);
  if (!t) return;
  const body = bodyOf(req);
  const problem = parsePageProblem(body["problem"]);
  if (!problem) return res.status(400).json({ error: "The tutor needs the problem's title and statement." });

  let streaming = false;
  const send = (event: string, data: unknown) => {
    if (!streaming) {
      streaming = true;
      res.status(200);
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();
    }
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    (res as typeof res & { flush?: () => void }).flush?.();
  };

  try {
    const { turnId, rung } = await externalTutorReply(
      userIdOf(req)!,
      t.source,
      t.slug,
      {
        problem,
        url: typeof body["url"] === "string" ? body["url"].slice(0, 500) : null,
        message: typeof body["message"] === "string" ? body["message"] : "",
        code: typeof body["code"] === "string" ? body["code"].slice(0, 64 * 1024) : null,
        language: typeof body["language"] === "string" ? body["language"] : null,
        rung: typeof body["rung"] === "number" ? body["rung"] : null,
      },
      (r) => send("rung", { rung: r }),
      (tok) => send("token", { t: tok }),
    );
    send("done", { turnId, rung });
    res.end();
  } catch (err) {
    const status = err instanceof ExternalError ? err.status : 500;
    const text = err instanceof ExternalError ? err.message : "The tutor could not answer — try again.";
    if (status >= 500) console.error(`[ext tutor] ${userIdOf(req)}:`, (err as Error)?.message);
    if (!streaming) return res.status(status).json({ error: text });
    send("error", { error: text, status });
    res.end();
  }
});

/** POST /api/ext/:source/:slug/failures {problem, url, verdict, code, language, passed?, total?, runtimeMs?, errorDetail?, shownCase?} — "Why it failed". */
router.post("/:source/:slug/failures", requireAuth, reviewLimiter, async (req, res) => {
  const t = target(req as unknown as Req, res);
  if (!t) return;
  const body = bodyOf(req);
  const problem = parsePageProblem(body["problem"]);
  if (!problem) return res.status(400).json({ error: "The review needs the problem's title and statement." });
  const failure = parseFailure(body, problem);
  if (typeof failure === "string") return res.status(400).json({ error: failure });
  try {
    res.status(201).json(await reviewFailure(userIdOf(req)!, t.source, t.slug, failure));
  } catch (err) {
    if (!fail(res, err)) throw err;
  }
});

export default router;

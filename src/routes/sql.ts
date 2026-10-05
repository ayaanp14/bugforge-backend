import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { executionLimiter } from "../middleware/rate-limit.js";
import { browserCache, SEEDED_CONTENT_MAX_AGE } from "../lib/http-cache.js";
import { prisma } from "../lib/prisma.js";
import { nextStreak, solveXp } from "../lib/activity.js";
import { claimFirstSolve } from "../lib/solve-payout.js";
import { sqlProblem } from "../lib/sql-problems/index.js";
import { judgeSql } from "../lib/sql/judge.js";
import { SqlBusyError } from "../lib/sql/engine.js";
import { forgetSqlStanding, sqlProblemList, sqlProblemPage, sqlStanding } from "../services/sql-problems.js";
import { invalidateDashboard } from "../services/dashboard.js";
import { createNotificationOnce, streakMilestone } from "../services/notifications.js";

/**
 * /api/sql — LeetCode-style database problems (lib/sql-problems), judged on
 * SQLite behind a MySQL layer (lib/sql). The list and a problem's page are
 * caller-free and shared-cached; standing, history, run and submit are the
 * account's.
 */
export const sqlRouter = Router();

const SLUG = /^[a-z0-9][a-z0-9-]{0,119}$/;
const MAX_QUERY_CHARS = 20_000;

sqlRouter.get("/", browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (_req, res) => {
  res.json(await sqlProblemList());
});

sqlRouter.get("/standing", requireAuth, async (req, res) => {
  res.json(await sqlStanding(req.user!.userId));
});

sqlRouter.get("/:slug", browserCache(SEEDED_CONTENT_MAX_AGE, { shared: true }), async (req, res) => {
  const slug = String(req.params["slug"] ?? "");
  const page = SLUG.test(slug) ? await sqlProblemPage(slug) : null;
  if (!page) {
    res.removeHeader("Cache-Control");
    res.status(404).json({ error: "There is no SQL problem at this address." });
    return;
  }
  res.json(page);
});

sqlRouter.get("/:slug/submissions", requireAuth, async (req, res) => {
  const slug = String(req.params["slug"] ?? "");
  if (!sqlProblem(slug)) {
    res.status(404).json({ error: "There is no SQL problem at this address." });
    return;
  }
  const rows = await prisma.sqlSubmission.findMany({
    where: { userId: req.user!.userId, slug },
    orderBy: { submittedAt: "desc" },
    take: 25,
    select: { id: true, query: true, verdict: true, passedCases: true, totalCases: true, runtimeMs: true, submittedAt: true },
  });
  res.json({ submissions: rows });
});

/** The query from the body, or a 400 already sent. */
function queryOf(req: Request, res: Response): string | null {
  const query = (req.body as { query?: unknown } | undefined)?.query;
  if (typeof query !== "string" || !query.trim()) {
    res.status(400).json({ error: "Write a query first." });
    return null;
  }
  if (query.length > MAX_QUERY_CHARS) {
    res.status(400).json({ error: `A query is at most ${MAX_QUERY_CHARS.toLocaleString("en-IN")} characters.` });
    return null;
  }
  return query;
}

function busy(res: Response, err: unknown): boolean {
  if (err instanceof SqlBusyError) {
    res.status(503).json({ error: err.message, engineDown: true });
    return true;
  }
  return false;
}

sqlRouter.post("/:slug/run", requireAuth, executionLimiter, async (req, res) => {
  const spec = sqlProblem(String(req.params["slug"] ?? ""));
  if (!spec) {
    res.status(404).json({ error: "There is no SQL problem at this address." });
    return;
  }
  const query = queryOf(req, res);
  if (query === null) return;
  try {
    res.json(await judgeSql(spec, query, "run"));
  } catch (err) {
    if (!busy(res, err)) throw err;
  }
});

sqlRouter.post("/:slug/submit", requireAuth, executionLimiter, async (req, res) => {
  const spec = sqlProblem(String(req.params["slug"] ?? ""));
  if (!spec) {
    res.status(404).json({ error: "There is no SQL problem at this address." });
    return;
  }
  const query = queryOf(req, res);
  if (query === null) return;
  const userId = req.user!.userId;
  // Read while the judge runs, as /api/submit does (routes/execution.ts). The
  // claim read only ever skips work: a problem already claimed stays claimed,
  // and "not claimed" is not trusted — the insert in claimFirstSolve still
  // decides. The stats row is what the streak is computed from.
  const history = Promise.all([
    prisma.sqlSolve.findUnique({ where: { userId_slug: { userId, slug: spec.slug } }, select: { id: true } }),
    prisma.userStats.findUnique({ where: { userId }, select: { lastActive: true, currentStreak: true, longestStreak: true } }),
  ]);
  // Awaited after the judge; this only stops an early failure from surfacing
  // as an unhandled rejection in the meantime.
  history.catch(() => {});
  let result;
  try {
    result = await judgeSql(spec, query, "submit");
  } catch (err) {
    if (busy(res, err)) return;
    throw err;
  }
  const submission = await prisma.sqlSubmission.create({
    data: { userId, slug: spec.slug, query, verdict: result.verdict, passedCases: result.passed, totalCases: result.total, runtimeMs: result.runtimeMs },
    select: { id: true, submittedAt: true },
  });
  const [alreadyClaimed, stats] = await history;
  // A first accept pays and moves the solving streak exactly as a coding
  // problem's does: one transaction, decided by the unique (userId, slug)
  // claim — lib/solve-payout.ts.
  const prize = solveXp(spec.difficulty);
  const streak = nextStreak(stats);
  const firstSolve =
    result.verdict === "ACCEPTED" && !alreadyClaimed
      ? await claimFirstSolve(userId, { sqlSlug: spec.slug }, submission.submittedAt, prize, streak)
      : false;
  const awardedXp = firstSolve ? prize : 0;
  res.json({ ...result, submissionId: submission.id, awardedXp, firstSolve });

  // ── After the response ──────────────────────────────────────────
  forgetSqlStanding(userId);
  // Every submit moves the dashboard, not only a paid one: the history lists
  // it, and an accepted one lights today on the heatmap even when the problem
  // was solved before. This also drops the heatmap, rank and /api/me copies.
  invalidateDashboard(userId);
  if (firstSolve && stats) {
    const milestone = streakMilestone(streak.currentStreak);
    if (milestone) createNotificationOnce(userId, milestone).catch((err) => console.error("POST /api/sql/:slug/submit — notification failed:", err));
  }
});

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { executionLimiter } from "../middleware/rate-limit.js";
import { browserCache, SEEDED_CONTENT_MAX_AGE } from "../lib/http-cache.js";
import { prisma } from "../lib/prisma.js";
import { isDuplicateKey, withLockRetry } from "../lib/seat-claim.js";
import { sqlProblem } from "../lib/sql-problems/index.js";
import { judgeSql } from "../lib/sql/judge.js";
import { SqlBusyError } from "../lib/sql/engine.js";
import { forgetSqlStanding, sqlProblemList, sqlProblemPage, sqlStanding } from "../services/sql-problems.js";
import { invalidateDashboard } from "../services/dashboard.js";

/**
 * /api/sql — LeetCode-style database problems (lib/sql-problems), judged on
 * SQLite behind a MySQL layer (lib/sql). The list and a problem's page are
 * caller-free and shared-cached; standing, history, run and submit are the
 * account's.
 */
export const sqlRouter = Router();

const SLUG = /^[a-z0-9][a-z0-9-]{0,119}$/;
const MAX_QUERY_CHARS = 20_000;
/** XP for a first accepted solve — the coding problems' table (routes/execution.ts). */
const XP: Record<string, number> = { EASY: 10, MEDIUM: 20, HARD: 30 };

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
  let awardedXp = 0;
  if (result.verdict === "ACCEPTED") {
    const prize = XP[spec.difficulty] ?? 10;
    // The unique (userId, slug) claim decides who is paid — lib/solve-payout.ts.
    const paid = await withLockRetry("claimSqlSolve", async () => {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.sqlSolve.create({ data: { userId, slug: spec.slug, submittedAt: submission.submittedAt }, select: { id: true } });
          await tx.userStats.upsert({ where: { userId }, update: { lastActive: new Date() }, create: { userId, lastActive: new Date() } });
          await tx.user.update({ where: { id: userId }, data: { xp: { increment: prize }, questionsXp: { increment: prize }, rating: { increment: prize } }, select: { id: true } });
        });
        return true;
      } catch (err) {
        if (isDuplicateKey(err)) return false;
        throw err;
      }
    });
    if (paid) awardedXp = prize;
  }
  res.json({ ...result, submissionId: submission.id, awardedXp, firstSolve: awardedXp > 0 });
  forgetSqlStanding(userId);
  if (awardedXp > 0) invalidateDashboard(userId);
});

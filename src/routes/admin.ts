import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { adminOnly, requireAuth } from "../middleware/auth.js";
import { CALENDAR_UTC_OFFSET_MINUTES } from "../lib/clock.js";
import { listJobs, recentRuns, runJobNow } from "../lib/scheduler.js";
import { activePlan } from "../services/entitlements.js";
import { invalidateProblem } from "./problems.js";
import { emailEnabled } from "../lib/email.js";

/**
 * The admin panel's API: what the creator needs to run the product from a
 * page rather than a terminal — who signed up, what broke, what got used,
 * who paid, which problems are live, and the reminder jobs.
 *
 * Read-mostly by design. The two writes (publish toggle, run a job) are the
 * two things that were being done with scripts against production; anything
 * riskier — editing a problem's tests, refunding — stays a script, on purpose,
 * until there is a reason to make it a button.
 *
 * Everything under here is `requireAuth, adminOnly` (see isAdminEmail).
 */
const router = Router();

router.use(requireAuth, adminOnly);

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** A whole number from the query string, clamped. */
function intArg(value: unknown, fallback: number, min: number, max: number): number {
  const n = parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** A short free-text search term, or null. */
function termArg(value: unknown): string | null {
  const s = typeof value === "string" ? value.trim().slice(0, 80) : "";
  return s.length >= 2 ? s : null;
}

/**
 * Day buckets in the product calendar (IST — see lib/clock.ts). The offset is
 * applied in SQL so the database groups by the day the user experienced, not
 * the UTC day the row was stamped with.
 */
const DAY_EXPR = (column: string) => Prisma.sql`DATE(DATE_ADD(${Prisma.raw(column)}, INTERVAL ${Prisma.raw(String(CALENDAR_UTC_OFFSET_MINUTES))} MINUTE))`;

interface DayCount {
  day: string;
  count: number;
}

/** COUNT per product day over a window. `distinct` counts distinct values of that column instead of rows. */
async function perDay(table: string, column: string, since: Date, extra: Prisma.Sql = Prisma.empty, distinct?: string): Promise<DayCount[]> {
  const counter = distinct ? Prisma.sql`COUNT(DISTINCT ${Prisma.raw(distinct)})` : Prisma.sql`COUNT(*)`;
  const rows = await prisma.$queryRaw<Array<{ day: Date | string; count: bigint | number }>>(
    Prisma.sql`SELECT ${DAY_EXPR(column)} AS day, ${counter} AS count FROM ${Prisma.raw(table)} WHERE ${Prisma.raw(column)} >= ${since} ${extra} GROUP BY day ORDER BY day`,
  );
  return rows.map((r) => ({ day: dayString(r.day), count: Number(r.count) }));
}

const dayString = (d: Date | string): string => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));

/* ── overview ──────────────────────────────────────────────────────── */

// GET /api/admin/overview — the numbers at the top of the panel
router.get("/overview", async (_req, res) => {
  const now = Date.now();
  const dayAgo = new Date(now - DAY_MS);
  const weekAgo = new Date(now - 7 * DAY_MS);
  const monthAgo = new Date(now - 30 * DAY_MS);

  const [
    usersTotal,
    usersNew7d,
    usersNew24h,
    dau,
    wau,
    solversToday,
    submissions24h,
    accepted24h,
    activeSubscriptions,
    revenue30d,
    feedback7d,
    platformRating,
    errors24h,
    errorGroups24h,
    interviews24h,
    duels24h,
    contestEntriesToday,
    runs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.$queryRaw<Array<{ n: bigint }>>`SELECT COUNT(DISTINCT userId) AS n FROM AppEvent WHERE createdAt >= ${dayAgo} AND userId IS NOT NULL`,
    prisma.$queryRaw<Array<{ n: bigint }>>`SELECT COUNT(DISTINCT userId) AS n FROM AppEvent WHERE createdAt >= ${weekAgo} AND userId IS NOT NULL`,
    prisma.$queryRaw<Array<{ n: bigint }>>`SELECT COUNT(DISTINCT userId) AS n FROM Submission WHERE submittedAt >= ${dayAgo}`,
    prisma.submission.count({ where: { submittedAt: { gte: dayAgo } } }),
    prisma.submission.count({ where: { submittedAt: { gte: dayAgo }, verdict: "ACCEPTED" } }),
    prisma.subscription.groupBy({
      by: ["planId"],
      where: { status: "active", currentPeriodEnd: { gt: new Date(now) } },
      _count: { _all: true },
    }),
    prisma.paymentOrder.aggregate({ where: { status: "paid", updatedAt: { gte: monthAgo } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.feedback.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.feedback.aggregate({ where: { kind: "platform", createdAt: { gte: monthAgo } }, _avg: { rating: true } }),
    prisma.errorReport.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.$queryRaw<Array<{ n: bigint }>>`SELECT COUNT(DISTINCT fingerprint) AS n FROM ErrorReport WHERE createdAt >= ${dayAgo}`,
    prisma.mockInterviewSession.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.duel.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.dailyContestEntry.count({ where: { startedAt: { gte: dayAgo } } }),
    recentRuns(12),
  ]);

  res.json({
    generatedAt: new Date(now).toISOString(),
    users: { total: usersTotal, new7d: usersNew7d, new24h: usersNew24h, dau: Number(dau[0]?.n ?? 0), wau: Number(wau[0]?.n ?? 0) },
    activity: {
      solversToday: Number(solversToday[0]?.n ?? 0),
      submissions24h,
      accepted24h,
      interviews24h,
      duels24h,
      contestEntriesToday,
    },
    billing: {
      activeByPlan: activeSubscriptions.map((r) => ({ planId: r.planId, count: r._count._all })),
      revenue30d: revenue30d._sum.amount ?? 0,
      paidOrders30d: revenue30d._count._all,
    },
    feedback: { count7d: feedback7d, platformRating30d: platformRating._avg.rating },
    errors: { count24h: errors24h, groups24h: Number(errorGroups24h[0]?.n ?? 0) },
    jobs: { emailEnabled: emailEnabled(), recentRuns: runs },
  });
});

/* ── errors ────────────────────────────────────────────────────────── */

// GET /api/admin/errors?hours=24&source=web|api|android — grouped by fingerprint
router.get("/errors", async (req, res) => {
  const hours = intArg(req.query["hours"], 24, 1, 24 * 30);
  const source = typeof req.query["source"] === "string" && ["web", "api", "android"].includes(req.query["source"]) ? req.query["source"] : null;
  const since = new Date(Date.now() - hours * HOUR_MS);
  const where = { createdAt: { gte: since }, ...(source ? { source } : {}) };

  const groups = await prisma.errorReport.groupBy({
    by: ["fingerprint"],
    where,
    _count: { _all: true },
    _max: { createdAt: true },
    _min: { createdAt: true },
    orderBy: { _count: { fingerprint: "desc" } },
    take: 100,
  });
  if (groups.length === 0) {
    res.json({ hours, groups: [] });
    return;
  }
  // One representative row per group: the newest occurrence.
  const samples = await prisma.errorReport.findMany({
    where: { fingerprint: { in: groups.map((g) => g.fingerprint) } },
    distinct: ["fingerprint"],
    orderBy: { createdAt: "desc" },
    select: { fingerprint: true, source: true, kind: true, message: true, path: true },
  });
  const sampleOf = new Map(samples.map((s) => [s.fingerprint, s]));
  // Distinct accounts hit per group — Prisma's groupBy counts rows, not distinct values.
  const affected = await prisma.$queryRaw<Array<{ fingerprint: string; n: bigint }>>(
    Prisma.sql`SELECT fingerprint, COUNT(DISTINCT userId) AS n FROM ErrorReport WHERE createdAt >= ${since} AND fingerprint IN (${Prisma.join(groups.map((g) => g.fingerprint))}) GROUP BY fingerprint`,
  );
  const usersOf = new Map(affected.map((a) => [a.fingerprint, Number(a.n)]));

  res.json({
    hours,
    groups: groups.map((g) => ({
      fingerprint: g.fingerprint,
      count: g._count._all,
      users: usersOf.get(g.fingerprint) ?? 0,
      firstSeen: g._min.createdAt,
      lastSeen: g._max.createdAt,
      ...(sampleOf.get(g.fingerprint) ?? { source: "?", kind: "?", message: "(no sample)", path: null }),
    })),
  });
});

// GET /api/admin/errors/:fingerprint — recent occurrences with stacks
router.get("/errors/:fingerprint", async (req, res) => {
  const fingerprint = String(req.params["fingerprint"]).slice(0, 40);
  const occurrences = await prisma.errorReport.findMany({
    where: { fingerprint },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
  if (occurrences.length === 0) {
    res.status(404).json({ error: "No such error group" });
    return;
  }
  const total = await prisma.errorReport.count({ where: { fingerprint } });
  res.json({ fingerprint, total, occurrences });
});

/* ── analytics ─────────────────────────────────────────────────────── */

// GET /api/admin/analytics?days=14 — the charts
router.get("/analytics", async (req, res) => {
  const days = intArg(req.query["days"], 14, 2, 90);
  const since = new Date(Date.now() - days * DAY_MS);

  const [activeUsers, visitors, pageViews, signups, submissions, accepted, errors, topEvents, topPaths] = await Promise.all([
    perDay("AppEvent", "createdAt", since, Prisma.sql`AND userId IS NOT NULL`, "userId"),
    perDay("AppEvent", "createdAt", since, Prisma.sql`AND name = 'page_view'`, "COALESCE(userId, sessionId)"),
    perDay("AppEvent", "createdAt", since, Prisma.sql`AND name = 'page_view'`),
    perDay("User", "createdAt", since),
    perDay("Submission", "submittedAt", since),
    perDay("Submission", "submittedAt", since, Prisma.sql`AND verdict = 'ACCEPTED'`),
    perDay("ErrorReport", "createdAt", since),
    prisma.appEvent.groupBy({
      by: ["name"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { name: "desc" } },
      take: 30,
    }),
    prisma.appEvent.groupBy({
      by: ["path"],
      where: { createdAt: { gte: since }, name: "page_view" },
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 30,
    }),
  ]);

  res.json({
    days,
    series: { activeUsers, visitors, pageViews, signups, submissions, accepted, errors },
    topEvents: topEvents.map((e) => ({ name: e.name, count: e._count._all })),
    topPaths: topPaths.map((p) => ({ path: p.path, count: p._count._all })),
  });
});

/* ── users ─────────────────────────────────────────────────────────── */

const USER_ROW = {
  id: true,
  name: true,
  username: true,
  email: true,
  provider: true,
  instituteName: true,
  xp: true,
  createdAt: true,
  stats: { select: { problemsSolved: true, bugsFixed: true, currentStreak: true, lastActive: true } },
  subscriptions: {
    where: { status: "active" },
    orderBy: { currentPeriodEnd: "desc" as const },
    take: 1,
    select: { planId: true, currentPeriodEnd: true },
  },
} as const;

// GET /api/admin/users?q=<email|username|name> — lookup, or the newest accounts
router.get("/users", async (req, res) => {
  const q = termArg(req.query["q"]);
  const users = await prisma.user.findMany({
    where: q ? { OR: [{ email: { contains: q } }, { username: { contains: q } }, { name: { contains: q } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 25,
    select: USER_ROW,
  });
  res.json({ q, users });
});

// GET /api/admin/users/:id — one account in full
router.get("/users/:id", async (req, res) => {
  const id = String(req.params["id"]);
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...USER_ROW,
      questionsXp: true,
      bugsXp: true,
      rating: true,
      location: true,
      remindStreak: true,
      remindDailyKata: true,
      weeklyDigest: true,
      subscriptions: { orderBy: { createdAt: "desc" }, take: 10 },
      paymentOrders: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, planId: true, period: true, amount: true, status: true, createdAt: true, providerPaymentId: true } },
      submissions: {
        orderBy: { submittedAt: "desc" },
        take: 10,
        select: { id: true, verdict: true, language: true, submittedAt: true, problem: { select: { slug: true, title: true } } },
      },
      feedback: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, kind: true, rating: true, comment: true, createdAt: true } },
      _count: { select: { submissions: true, bugSubmissions: true, mockSessions: true, notifications: true, posts: true } },
    },
  });
  if (!user) {
    res.status(404).json({ error: "No such user" });
    return;
  }
  const plan = await activePlan(user.id, user.email);
  const recentErrors = await prisma.errorReport.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, source: true, kind: true, message: true, path: true, createdAt: true, fingerprint: true },
  });
  res.json({ user, plan: { id: plan.plan.id, name: plan.plan.name, currentPeriodEnd: plan.currentPeriodEnd }, recentErrors });
});

/* ── problems ──────────────────────────────────────────────────────── */

// GET /api/admin/problems?q=&published=all|yes|no&page=1
router.get("/problems", async (req, res) => {
  const q = termArg(req.query["q"]);
  const published = req.query["published"] === "yes" ? true : req.query["published"] === "no" ? false : null;
  const page = intArg(req.query["page"], 1, 1, 1000);
  const take = 50;
  const where = {
    ...(q ? { OR: [{ title: { contains: q } }, { slug: { contains: q } }] } : {}),
    ...(published === null ? {} : { isPublished: published }),
  };
  const [total, problems] = await Promise.all([
    prisma.problem.count({ where }),
    prisma.problem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
      select: {
        id: true,
        slug: true,
        title: true,
        difficulty: true,
        tags: true,
        isPublished: true,
        createdAt: true,
        _count: { select: { submissions: true, testCases: true } },
      },
    }),
  ]);
  res.json({ total, page, pageSize: take, problems });
});

// PATCH /api/admin/problems/:slug — { isPublished }
router.patch("/problems/:slug", async (req, res) => {
  const slug = String(req.params["slug"]);
  const isPublished = (req.body as { isPublished?: unknown })?.isPublished;
  if (typeof isPublished !== "boolean") {
    res.status(400).json({ error: "isPublished must be true or false" });
    return;
  }
  const problem = await prisma.problem.update({
    where: { slug },
    data: { isPublished },
    select: { slug: true, isPublished: true },
  });
  invalidateProblem(slug);
  res.json(problem);
});

/* ── billing ───────────────────────────────────────────────────────── */

// GET /api/admin/subscriptions — live subscriptions and the latest orders
router.get("/subscriptions", async (_req, res) => {
  const [subscriptions, orders] = await Promise.all([
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { id: true, email: true, username: true, name: true } } },
    }),
    prisma.paymentOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        planId: true,
        period: true,
        amount: true,
        status: true,
        providerPaymentId: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, email: true, username: true } },
      },
    }),
  ]);
  res.json({ subscriptions, orders });
});

/* ── jobs ──────────────────────────────────────────────────────────── */

// GET /api/admin/jobs — registered jobs and their recent runs
router.get("/jobs", async (_req, res) => {
  const runs = await recentRuns(60);
  res.json({
    emailEnabled: emailEnabled(),
    jobs: listJobs().map((j) => ({ name: j.name, description: j.description, due: j.periodOf(new Date()) })),
    runs,
  });
});

// POST /api/admin/jobs/:name/run — run one now, outside its window
router.post("/jobs/:name/run", async (req, res) => {
  const name = String(req.params["name"]);
  if (!listJobs().some((j) => j.name === name)) {
    res.status(404).json({ error: "No such job" });
    return;
  }
  // Runs to completion before answering so the panel can show the result;
  // the jobs are minutes at most and this is an operator's click.
  const runId = await runJobNow(name);
  const run = runId ? await prisma.jobRun.findUnique({ where: { id: runId } }) : null;
  res.json({ run });
});

export default router;

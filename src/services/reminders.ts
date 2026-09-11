/**
 * The reminders: the three scheduled nudges that bring people back.
 *
 * Until these existed the bell only ever spoke when the user was already
 * here (welcome, first solve, a streak milestone earned by solving). Nothing
 * reached someone who had *not* opened the app today — which is the only
 * person a reminder is for. Three jobs, each once a day or week, each
 * idempotent per period through the dated notification type and the JobRun
 * claim (lib/scheduler.ts):
 *
 *  - streak_at_risk  — evening, IST: a live streak that has not been extended
 *                      today. In-app and email. The highest-intent nudge there
 *                      is, so it is the one that gets mail.
 *  - daily_kata      — morning, IST, once the UTC contest day has rolled:
 *                      today's kata for everyone active this fortnight. In-app
 *                      only — a daily email is how a product gets marked spam.
 *  - weekly_digest   — Monday morning, IST: the week's numbers and one nudge.
 *                      In-app and email.
 *
 * Every user-facing string is built by a pure function here so the tests can
 * pin the copy and the windows without a database.
 */
import { prisma } from "../lib/prisma.js";
import { dayKey, dayStart, daysBetween, weekStart, zoned } from "../lib/clock.js";
import { sendEmail } from "../lib/email.js";
import { registerJob, type Job } from "../lib/scheduler.js";
import { createNotificationsOnce } from "./notifications.js";
import { dayOf, ensureContest } from "./daily-contest.js";

const FRONTEND_URL = (process.env["FRONTEND_URL"] ?? "http://localhost:3000").replace(/\/+$/, "");
const DAY_MS = 86_400_000;
/** Users per query. Small enough that the IN() list and the createMany stay comfortable. */
const BATCH = 200;
/** Concurrent mail sends; the flow is one HTTP call each. */
const MAIL_CONCURRENCY = 4;

const UNSUBSCRIBE_LINE = "You can turn reminders off any time under Profile → Reminders.";

/* ── windows ───────────────────────────────────────────────────────── */

const zonedHour = (now: Date): number => zoned(now).getUTCHours();

/** 18:00–20:00 in the product zone, keyed by the product day. */
export function streakAtRiskPeriod(now: Date): string | null {
  const h = zonedHour(now);
  return h >= 18 && h < 20 ? dayKey(now) : null;
}

/**
 * 06:00–09:00 in the product zone, keyed by the *UTC* contest day — by then
 * the day has rolled (00:00 UTC is 05:30 IST) and today's kata exists.
 */
export function dailyKataPeriod(now: Date): string | null {
  const h = zonedHour(now);
  return h >= 6 && h < 9 ? dayOf(now) : null;
}

/** Monday 08:00–11:00 in the product zone, keyed by that week's Monday. */
export function weeklyDigestPeriod(now: Date): string | null {
  const z = zoned(now);
  if (z.getUTCDay() !== 1) return null;
  const h = z.getUTCHours();
  return h >= 8 && h < 11 ? dayKey(weekStart(now)) : null;
}

/* ── copy ──────────────────────────────────────────────────────────── */

export interface ReminderContent {
  title: string;
  body: string;
  href: string;
  subject: string;
  text: string;
}

export function streakAtRiskContent(streak: number): ReminderContent {
  const days = streak === 1 ? "1-day" : `${streak}-day`;
  return {
    title: `Your ${days} streak ends at midnight 🔥`,
    body: "One accepted solve before midnight keeps it alive. Today's kata is the quickest way in.",
    href: "/contests",
    subject: `Your ${days} CodeKairo streak ends tonight`,
    text:
      `You have not solved anything today, and your ${days} streak ends at midnight.\n\n` +
      `One accepted solve keeps it alive — today's kata is a ten-minute way in:\n${FRONTEND_URL}/contests\n\n` +
      UNSUBSCRIBE_LINE,
  };
}

export function dailyKataContent(contest: { title: string; difficulty: string }): ReminderContent {
  const difficulty = contest.difficulty.charAt(0).toUpperCase() + contest.difficulty.slice(1).toLowerCase();
  return {
    title: `Today's kata: ${contest.title} (${difficulty})`,
    body: "The daily contest is open until midnight UTC. Solve it on the clock to rank and keep your contest streak.",
    href: "/contests",
    subject: `Today's kata: ${contest.title}`,
    text: `${contest.title} (${difficulty}) is today's kata.\n${FRONTEND_URL}/contests\n\n${UNSUBSCRIBE_LINE}`,
  };
}

export interface WeekStats {
  /** Distinct problems accepted this week. */
  solved: number;
  /** Bug hunts accepted this week. */
  bugs: number;
  /** Daily-contest points earned this week. */
  contestPoints: number;
  /** Current solving streak, days. */
  streak: number;
  /** Lifetime XP. */
  xp: number;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function weeklyDigestContent(name: string | null, s: WeekStats): ReminderContent {
  const parts = [plural(s.solved, "kata", "katas"), plural(s.bugs, "bug", "bugs")];
  if (s.contestPoints > 0) parts.push(`${s.contestPoints} contest ${s.contestPoints === 1 ? "point" : "points"}`);
  const line = parts.join(", ");
  const quiet = s.solved === 0 && s.bugs === 0;
  const nudge = quiet
    ? "A quiet week. Today's kata takes ten minutes and starts a new streak."
    : s.streak > 0
      ? `Your ${s.streak}-day streak is alive — today's kata keeps it that way.`
      : "Keep the blade sharp: today's kata is waiting.";
  const greeting = name ? `${name.split(" ")[0]}, here` : "Here";
  return {
    title: "Your week in the dojo 📜",
    body: `${line} this week${s.streak > 0 ? ` · ${s.streak}-day streak` : ""}. ${nudge}`,
    href: "/",
    subject: quiet ? "A quiet week in the dojo" : `This week: ${line}`,
    text:
      `${greeting} is your week on CodeKairo:\n\n` +
      `  Katas solved:    ${s.solved}\n` +
      `  Bugs fixed:      ${s.bugs}\n` +
      `  Contest points:  ${s.contestPoints}\n` +
      `  Streak:          ${s.streak} ${s.streak === 1 ? "day" : "days"}\n` +
      `  Total XP:        ${s.xp}\n\n` +
      `${nudge}\n${FRONTEND_URL}/contests\n\n` +
      UNSUBSCRIBE_LINE,
  };
}

/* ── delivery ──────────────────────────────────────────────────────── */

interface Recipient {
  userId: string;
  email: string | null;
  name: string | null;
}

/** Send with bounded concurrency; returns how many the flow accepted. */
async function mailAll(kind: string, targets: Array<{ to: string; subject: string; text: string }>): Promise<number> {
  let sent = 0;
  let next = 0;
  const worker = async () => {
    while (next < targets.length) {
      const t = targets[next++];
      if (await sendEmail({ ...t, kind })) sent++;
    }
  };
  await Promise.all(Array.from({ length: Math.min(MAIL_CONCURRENCY, targets.length) }, worker));
  return sent;
}

/**
 * Notify a batch (dated type, once per user) and mail those newly notified
 * who have an address and the channel on. `email` may be omitted to keep a
 * reminder in-app only.
 */
async function deliver(
  type: string,
  batch: Array<Recipient & { content: ReminderContent }>,
  email: boolean,
): Promise<{ notified: number; mailed: number }> {
  const fresh = await createNotificationsOnce(
    type,
    batch.map((r) => ({ userId: r.userId, title: r.content.title, body: r.content.body, href: r.content.href })),
  );
  if (!email || fresh.length === 0) return { notified: fresh.length, mailed: 0 };
  const freshSet = new Set(fresh);
  const targets = batch
    .filter((r) => freshSet.has(r.userId) && r.email)
    .map((r) => ({ to: r.email as string, subject: r.content.subject, text: r.content.text }));
  const mailed = await mailAll(type.replace(/_\d.*$/, ""), targets);
  return { notified: fresh.length, mailed };
}

/* ── the jobs ──────────────────────────────────────────────────────── */

const USER_SELECT = { id: true, email: true, name: true } as const;

/**
 * Streaks in danger: active yesterday (product calendar), not yet today.
 * Anyone last active before yesterday has already lost the streak — /api/me
 * zeroes it lazily — and a reminder would only rub it in.
 */
const streakAtRisk: Job = {
  name: "streak_at_risk",
  description: "Evening nudge (IST) to anyone whose live streak has not been extended today. In-app + email.",
  periodOf: streakAtRiskPeriod,
  async run(now) {
    const today = dayStart(now);
    const yesterday = new Date(today.getTime() - DAY_MS);
    const type = `streak_at_risk_${dayKey(now)}`;
    let notified = 0;
    let mailed = 0;
    let cursor: string | undefined;
    for (;;) {
      const rows = await prisma.userStats.findMany({
        where: {
          currentStreak: { gt: 0 },
          lastActive: { gte: yesterday, lt: today },
          user: { remindStreak: true },
        },
        select: { id: true, userId: true, currentStreak: true, user: { select: USER_SELECT } },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      if (rows.length === 0) break;
      const outcome = await deliver(
        type,
        rows.map((r) => ({ userId: r.userId, email: r.user.email, name: r.user.name, content: streakAtRiskContent(r.currentStreak) })),
        true,
      );
      notified += outcome.notified;
      mailed += outcome.mailed;
      if (rows.length < BATCH) break;
      cursor = rows[rows.length - 1].id;
    }
    return { notified, mailed };
  },
};

/** Today's kata, to everyone who has been around this fortnight. In-app only. */
const dailyKata: Job = {
  name: "daily_kata",
  description: "Morning (IST) announcement of today's kata to everyone active in the last 14 days. In-app only.",
  periodOf: dailyKataPeriod,
  async run(now) {
    const contest = await ensureContest(dayOf(now));
    if (!contest) return { notified: 0, reason: "no contest today" };
    const content = dailyKataContent({ title: contest.problem.title, difficulty: contest.difficulty });
    const type = `daily_kata_${contest.date}`;
    const since = new Date(now.getTime() - 14 * DAY_MS);
    let notified = 0;
    let cursor: string | undefined;
    for (;;) {
      const rows = await prisma.userStats.findMany({
        where: { lastActive: { gte: since }, user: { remindDailyKata: true } },
        select: { id: true, userId: true },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      if (rows.length === 0) break;
      const outcome = await deliver(
        type,
        rows.map((r) => ({ userId: r.userId, email: null, name: null, content })),
        false,
      );
      notified += outcome.notified;
      if (rows.length < BATCH) break;
      cursor = rows[rows.length - 1].id;
    }
    return { notified, kata: contest.problem.slug };
  },
};

/** The week's numbers for a batch of users, in three grouped queries rather than three per user. */
async function weekStatsFor(userIds: string[], since: Date, sinceDay: string, now: Date): Promise<Map<string, WeekStats>> {
  const [solves, bugs, contest, users] = await Promise.all([
    prisma.submission.groupBy({
      by: ["userId", "problemId"],
      where: { userId: { in: userIds }, verdict: "ACCEPTED", submittedAt: { gte: since } },
    }),
    prisma.bugSubmission.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, verdict: "ACCEPTED", submittedAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.dailyContestEntry.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, date: { gte: sinceDay } },
      _sum: { points: true },
    }),
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, xp: true, stats: { select: { currentStreak: true, lastActive: true } } },
    }),
  ]);
  const out = new Map<string, WeekStats>();
  for (const u of users) {
    // A streak that lapsed is shown as zero, the way /api/me shows it.
    const lapsed = !u.stats || daysBetween(u.stats.lastActive, now) > 1;
    out.set(u.id, { solved: 0, bugs: 0, contestPoints: 0, streak: lapsed ? 0 : u.stats!.currentStreak, xp: u.xp });
  }
  for (const s of solves) out.get(s.userId)!.solved++;
  for (const b of bugs) out.get(b.userId)!.bugs = b._count._all;
  for (const c of contest) out.get(c.userId)!.contestPoints = c._sum.points ?? 0;
  return out;
}

/** Monday's digest to everyone active this month. In-app + email. */
const weeklyDigest: Job = {
  name: "weekly_digest",
  description: "Monday morning (IST) summary of the week — katas, bugs, contest points, streak — to everyone active in the last 30 days. In-app + email.",
  periodOf: weeklyDigestPeriod,
  async run(now) {
    const weekBegan = weekStart(now);
    const since = new Date(weekBegan.getTime() - 7 * DAY_MS);
    const sinceDay = dayKey(since);
    const activeSince = new Date(now.getTime() - 30 * DAY_MS);
    const type = `weekly_digest_${dayKey(weekBegan)}`;
    let notified = 0;
    let mailed = 0;
    let cursor: string | undefined;
    for (;;) {
      const rows = await prisma.userStats.findMany({
        where: { lastActive: { gte: activeSince }, user: { weeklyDigest: true } },
        select: { id: true, userId: true, user: { select: USER_SELECT } },
        orderBy: { id: "asc" },
        take: BATCH,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      if (rows.length === 0) break;
      const stats = await weekStatsFor(rows.map((r) => r.userId), since, sinceDay, now);
      const outcome = await deliver(
        type,
        rows.map((r) => ({
          userId: r.userId,
          email: r.user.email,
          name: r.user.name,
          content: weeklyDigestContent(r.user.name, stats.get(r.userId) ?? { solved: 0, bugs: 0, contestPoints: 0, streak: 0, xp: 0 }),
        })),
        true,
      );
      notified += outcome.notified;
      mailed += outcome.mailed;
      if (rows.length < BATCH) break;
      cursor = rows[rows.length - 1].id;
    }
    return { notified, mailed, week: dayKey(weekBegan) };
  },
};

export const REMINDER_JOBS: Job[] = [streakAtRisk, dailyKata, weeklyDigest];

/** Register the three with the scheduler. Called once at boot. */
export function registerReminderJobs(): void {
  for (const job of REMINDER_JOBS) registerJob(job);
}

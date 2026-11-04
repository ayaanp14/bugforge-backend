import { prisma } from "../lib/prisma.js";
import { zoned } from "../lib/clock.js";
import { registerJob, type Job } from "../lib/scheduler.js";
import {
  FESTIVAL_ANNOUNCEMENT,
  FESTIVAL_WINDOW,
  festivalAnnouncePeriod,
  festivalKinds,
  festivalLighting,
  festivalShowing,
  litDays,
  type FestivalSlice,
} from "../lib/festival.js";
import { invalidateMe } from "./me.js";
import { forgetPublicUser } from "./public-profile.js";
import { createNotificationsOnce } from "./notifications.js";

const DAY_MS = 86_400_000;
const BATCH = 500;

/**
 * Lets a local server run as if on a festival day, for the smoke script. Never
 * in production, where the calendar alone decides.
 */
function festivalNow(): Date {
  const override = process.env["FESTIVAL_NOW"];
  return override && process.env["NODE_ENV"] !== "production" ? new Date(override) : new Date();
}

/**
 * The days this account has lit. Two reads on the (userId, verdict,
 * submittedAt) indexes, bounded to seven days of one person's accepted
 * submissions, and neither touches a code column.
 */
async function litDaysOf(userId: string): Promise<string[]> {
  const where = { userId, verdict: "ACCEPTED", submittedAt: { gte: FESTIVAL_WINDOW.from, lt: FESTIVAL_WINDOW.until } };
  const [coding, sql] = await Promise.all([
    // A pair room's submission is filed under its host, so it lights nothing.
    prisma.submission.findMany({ where: { ...where, roomId: null }, select: { submittedAt: true } }),
    prisma.sqlSubmission.findMany({ where, select: { submittedAt: true } }),
  ]);
  return litDays([...coding, ...sql].map((row) => row.submittedAt));
}

/**
 * Writes what the lights have earned. Idempotent on the (userId, kind) key, so
 * a retried solve or a dashboard read racing it cannot pay twice, and a read
 * repairs a solve whose write failed. Only a new row drops the caches.
 */
async function award(userId: string, lit: number): Promise<void> {
  const kinds = festivalKinds(lit);
  if (kinds.length === 0) return;
  const { count } = await prisma.honour.createMany({
    data: kinds.map((kind) => ({ userId, kind, grantedBy: "festival" })),
    skipDuplicates: true,
  });
  if (count > 0) {
    invalidateMe(userId);
    forgetPublicUser(userId);
  }
}

/** The home's strip: null outside the campaign, and on a failure, which must never fail the page. */
export async function festivalFor(userId: string, now = festivalNow()): Promise<FestivalSlice | null> {
  if (!festivalShowing(now)) return null;
  try {
    const lit = await litDaysOf(userId);
    await award(userId, lit.length);
    return { lit };
  } catch (err) {
    console.error("festival read failed:", (err as Error).message);
    return null;
  }
}

/**
 * After an accepted submission, before the answer: the client reads /api/me
 * the moment it has the verdict, and the frame and the badge should be on that
 * read. Costs nothing outside the seven days, and a failure costs only the
 * reward's timing, because the next dashboard read repairs it.
 */
export async function noteFestivalSolve(userId: string, now = festivalNow()): Promise<void> {
  if (!festivalLighting(now)) return;
  try {
    await award(userId, (await litDaysOf(userId)).length);
  } catch (err) {
    console.error("festival solve failed:", (err as Error).message);
  }
}

/** In-app only, to accounts seen this month that keep the daily notes on. The mail is a separate campaign. */
const festivalAnnouncement: Job = {
  name: "diwali_2026_start",
  description: "The first day of Diwali 2026: tells accounts active in the last 30 days about the seven diyas. In-app only.",
  periodOf: (now) => festivalAnnouncePeriod(now, zoned(now).getUTCHours()),
  async run(now) {
    const since = new Date(now.getTime() - 30 * DAY_MS);
    const { type, title, body, href } = FESTIVAL_ANNOUNCEMENT;
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
      const fresh = await createNotificationsOnce(type, rows.map((r) => ({ userId: r.userId, title, body, href })));
      notified += fresh.length;
      if (rows.length < BATCH) break;
      cursor = rows[rows.length - 1].id;
    }
    return { notified };
  },
};

export function registerFestivalJobs(): void {
  registerJob(festivalAnnouncement);
}

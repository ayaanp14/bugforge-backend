import { prisma } from "../lib/prisma.js";
import { dayKey, dayStart, zoned } from "../lib/clock.js";
import type { Job } from "../lib/scheduler.js";
import { createNotificationsOnce } from "./notifications.js";
import { skillProfileFor } from "./skill-profile.js";

/**
 * review_due: an afternoon nudge (IST) to accounts with a skill due on its
 * spaced-review ladder (lib/skill-score reviewSchedule) — "Two Pointers is
 * due for review". In-app and pushed, never mailed, and at most once every
 * REMIND_EVERY_DAYS, so a skill left overdue is mentioned, not nagged about.
 * Off with Profile → Reminders (`User.remindReviews`).
 *
 * Finding who has something due is the hard part: the profile that knows is
 * seven reads and a scoring pass per account. So the job reads the review
 * index instead — ReviewDue, the profile's next review dates, written each
 * time a profile is computed (services/skill-profile.ts) — one indexed query
 * for the due rows. A review date moves only when an attempt lands, so a row
 * is exact unless the account has attempted something since it was written;
 * four grouped MAX queries per batch find those, and only they are
 * recomputed (which rewrites their rows), up to MAX_RECOMPUTES a run. The
 * rest is the row as it stands.
 *
 * Skipped: anyone active today (the home's mission already lists the review),
 * anyone reminded in the last REMIND_EVERY_DAYS, and accounts whose profile
 * has not been computed in ACTIVE_WITHIN_DAYS — the reminder is for people
 * part-way through something, not a mailing list.
 */

const DAY_MS = 86_400_000;
const BATCH = 200;
export const REMIND_EVERY_DAYS = 3;
export const ACTIVE_WITHIN_DAYS = 30;
const MAX_RECOMPUTES = 300;

/** 16:00–18:00 in the product zone — after classes, before the streak nudge at six. */
export function reviewDuePeriod(now: Date): string | null {
  const h = zoned(now).getUTCHours();
  return h >= 16 && h < 18 ? dayKey(now) : null;
}

/**
 * The words, from the due skills, most overdue first. Pure.
 *
 * The link goes where the first of them can be practised: the home's
 * mission when it is a skill the mission lines up reviews for (a coding
 * topic — lib/mission picks problems), otherwise that skill on the skill
 * profile, which has the way to practise every kind. Promising the mission
 * for an aptitude section sent people to a list that did not have it.
 */
export function reviewDueContent(skills: ReadonlyArray<{ key: string; label: string }>): { title: string; body: string; href: string } {
  const [a, b, c] = skills.map((s) => s.label);
  const n = skills.length;
  const names = n === 1 ? a : n === 2 ? `${a} and ${b}` : n === 3 ? `${a}, ${b} and ${c}` : `${a}, ${b} and ${n - 2} more`;
  const first = skills[0]!;
  const onMission = first.key.startsWith("dsa:");
  const noun = first.key.startsWith("apt:") ? "question" : first.key.startsWith("debug:") ? "hunt" : "problem";
  const start = n > 1 ? `Start with ${a}: one` : "One";
  return {
    title: `${names} ${n > 1 ? "are" : "is"} due for review`,
    body: `${start} ${noun} you have not seen keeps it. ${onMission ? "Today's mission on your home page has it lined up." : "Your skill profile shows where to practise it."}`,
    href: onMission ? "/" : `/skills?skill=${encodeURIComponent(first.key)}`,
  };
}

/** The latest attempt of each account, across everything a review date is walked over. */
async function latestAttempts(userIds: string[]): Promise<Map<string, number>> {
  const where = { userId: { in: userIds } };
  const [code, bugs, sql, aptitude] = await Promise.all([
    prisma.submission.groupBy({ by: ["userId"], where, _max: { submittedAt: true } }),
    prisma.bugSubmission.groupBy({ by: ["userId"], where, _max: { submittedAt: true } }),
    prisma.sqlSubmission.groupBy({ by: ["userId"], where, _max: { submittedAt: true } }),
    prisma.aptitudeAttempt.groupBy({ by: ["userId"], where, _max: { createdAt: true } }),
  ]);
  const out = new Map<string, number>();
  const note = (userId: string, at: Date | null | undefined) => {
    if (at && at.getTime() > (out.get(userId) ?? 0)) out.set(userId, at.getTime());
  };
  for (const r of code) note(r.userId, r._max.submittedAt);
  for (const r of bugs) note(r.userId, r._max.submittedAt);
  for (const r of sql) note(r.userId, r._max.submittedAt);
  for (const r of aptitude) note(r.userId, r._max.createdAt);
  return out;
}

const indexSkills = (raw: unknown): Array<{ key: string; label: string; dueAt: string }> =>
  Array.isArray(raw)
    ? (raw as Array<{ key?: unknown; label?: unknown; dueAt?: unknown }>).filter((s) => typeof s.key === "string" && typeof s.label === "string" && typeof s.dueAt === "string") as Array<{ key: string; label: string; dueAt: string }>
    : [];

export const reviewDue: Job = {
  name: "review_due",
  description: "Afternoon (IST) nudge to accounts with a skill due for spaced review, at most every 3 days, from the review index. In-app + push.",
  periodOf: reviewDuePeriod,
  async run(now) {
    const type = `review_due_${dayKey(now)}`;
    const today = dayStart(now);
    const remindedSince = new Date(now.getTime() - REMIND_EVERY_DAYS * DAY_MS);
    let notified = 0;
    let considered = 0;
    let recomputed = 0;
    let deferred = 0;
    let cursor: string | undefined;
    for (;;) {
      const rows = await prisma.reviewDue.findMany({
        where: {
          dueAt: { lte: now },
          computedAt: { gte: new Date(now.getTime() - ACTIVE_WITHIN_DAYS * DAY_MS) },
          user: { remindReviews: true },
        },
        select: { userId: true, skills: true, computedAt: true },
        orderBy: { userId: "asc" },
        take: BATCH,
        ...(cursor ? { cursor: { userId: cursor }, skip: 1 } : {}),
      });
      if (rows.length === 0) break;
      considered += rows.length;
      const ids = rows.map((r) => r.userId);
      const [recent, activeToday, latest] = await Promise.all([
        prisma.notification.findMany({ where: { userId: { in: ids }, type: { startsWith: "review_due_" }, createdAt: { gte: remindedSince } }, select: { userId: true }, distinct: ["userId"] }),
        prisma.userStats.findMany({ where: { userId: { in: ids }, lastActive: { gte: today } }, select: { userId: true } }),
        latestAttempts(ids),
      ]);
      const skip = new Set([...recent.map((r) => r.userId), ...activeToday.map((r) => r.userId)]);

      const batch: Array<{ userId: string; title: string; body: string; href: string }> = [];
      for (const row of rows) {
        if (skip.has(row.userId)) continue;
        let due: Array<{ key: string; label: string }>;
        if ((latest.get(row.userId) ?? 0) > row.computedAt.getTime()) {
          // Something was attempted since the row was written: ask the
          // profile itself (which rewrites the row), within the run's budget.
          if (recomputed >= MAX_RECOMPUTES) {
            deferred++;
            continue;
          }
          recomputed++;
          const profile = await skillProfileFor(row.userId);
          due = profile.view.skills
            .filter((s) => s.due && s.nextReviewAt)
            .sort((a, b) => a.nextReviewAt!.localeCompare(b.nextReviewAt!))
            .map((s) => ({ key: s.key, label: s.label }));
        } else {
          due = indexSkills(row.skills).filter((s) => new Date(s.dueAt) <= now).map((s) => ({ key: s.key, label: s.label }));
        }
        if (due.length) batch.push({ userId: row.userId, ...reviewDueContent(due) });
      }
      if (batch.length) notified += (await createNotificationsOnce(type, batch)).length;
      if (rows.length < BATCH) break;
      cursor = rows[rows.length - 1]!.userId;
    }
    return { notified, considered, recomputed, deferred };
  },
};

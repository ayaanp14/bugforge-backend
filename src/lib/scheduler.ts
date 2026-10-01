/**
 * Scheduled jobs, without a job system.
 *
 * The API is one long-running process, so a timer is enough to wake up; what
 * a timer cannot do on its own is run a job *once* when there may be two
 * processes (a deploy overlaps the old instance with the new one) or when the
 * process restarts inside the window. Both are answered by the `JobRun` row:
 * a job is due for a *period* ("2026-09-11", "2026-W37"), and inserting
 * `<job>:<period>` as the primary key is the claim. The second instance's
 * insert fails on the key and it does nothing; a restart finds the row and
 * does nothing. The table doubles as the log the admin panel reads.
 *
 * Jobs are due inside a window of hours rather than at an instant, because
 * the tick is every few minutes and the process may not be up at 18:00:00
 * exactly. A window that was missed entirely (the process was down for it)
 * is skipped, not caught up: a streak reminder at 3 am is worse than none.
 */
import { prisma } from "./prisma.js";

export interface Job {
  name: string;
  /** What the job does, for the panel. */
  description: string;
  /** The period this instant belongs to when the job is due now, else null. */
  periodOf(now: Date): string | null;
  /** Do the work; the returned object is stored as the run's result. */
  run(now: Date): Promise<Record<string, unknown>>;
  /**
   * For a job due on every tick that keeps its own claims (the tournament
   * reminders): true when a run did nothing, and its row is then deleted
   * rather than kept — 288 empty rows a day would bury the panel's log. The
   * row still held the period while the run was going; a late second
   * instance that runs the same period again finds the job's own claims taken.
   */
  idle?(result: Record<string, unknown>): boolean;
}

const jobs = new Map<string, Job>();

export function registerJob(job: Job): void {
  jobs.set(job.name, job);
}

export function listJobs(): Job[] {
  return [...jobs.values()];
}

/** The period of a run started from the admin panel rather than the timer. */
const MANUAL_PREFIX = "manual-";

/** Whether the insert failed because the row already exists. */
const isDuplicate = (err: unknown): boolean => (err as { code?: string })?.code === "P2002";

/**
 * Run one job for one period, if nobody has. Returns the run row's id when
 * this call did the work, null when the period was already claimed.
 */
export async function runJob(job: Job, period: string, now = new Date()): Promise<string | null> {
  const id = `${job.name}:${period}`;
  try {
    await prisma.jobRun.create({ data: { id, job: job.name, period } });
  } catch (err) {
    if (isDuplicate(err)) return null;
    throw err;
  }

  if (!job.idle) console.log(`[jobs] ${id} starting`);
  try {
    const result = await job.run(now);
    // An operator's "run now" keeps its row either way: the panel shows what it did.
    if (job.idle?.(result) && !period.startsWith(MANUAL_PREFIX)) {
      await prisma.jobRun.delete({ where: { id } }).catch(() => undefined);
      return id;
    }
    await prisma.jobRun.update({ where: { id }, data: { finishedAt: new Date(), result: result as object } });
    console.log(`[jobs] ${id} done`, JSON.stringify(result));
  } catch (err) {
    const message = (err as Error)?.stack ?? String(err);
    console.error(`[jobs] ${id} failed:`, message);
    await prisma.jobRun
      .update({ where: { id }, data: { finishedAt: new Date(), error: message.slice(0, 4000) } })
      .catch(() => undefined);
  }
  return id;
}

/**
 * A run outside the schedule, from the admin panel. The period carries a
 * timestamp so it never collides with the scheduled one for the same day —
 * "send it again" is what the button means.
 */
export function runJobNow(name: string): Promise<string | null> {
  const job = jobs.get(name);
  if (!job) return Promise.reject(new Error(`Unknown job: ${name}`));
  const now = new Date();
  return runJob(job, `${MANUAL_PREFIX}${now.toISOString().replace(/[:.]/g, "-")}`, now);
}

let ticking = false;

/** One pass over every job. Safe to call from a timer: overlapping ticks are dropped. */
export async function tick(now = new Date()): Promise<void> {
  if (ticking) return;
  ticking = true;
  try {
    for (const job of jobs.values()) {
      const period = job.periodOf(now);
      if (!period) continue;
      await runJob(job, period, now).catch((err) => console.error(`[jobs] ${job.name} could not be claimed:`, err));
    }
  } finally {
    ticking = false;
  }
}

const TICK_MS = 5 * 60_000;

/** Start the timer. `unref` so it never keeps a draining process alive. */
export function startScheduler(): void {
  if (process.env["JOBS_DISABLED"] === "true") {
    console.log("[jobs] JOBS_DISABLED=true — scheduler not started");
    return;
  }
  // A short first delay so boot is not slowed by a job that happens to be due.
  setTimeout(() => void tick(), 30_000).unref();
  setInterval(() => void tick(), TICK_MS).unref();
}

/** The most recent runs, newest first, for the panel. */
export function recentRuns(take = 40) {
  return prisma.jobRun.findMany({ orderBy: { startedAt: "desc" }, take });
}

import { prisma } from "../lib/prisma.js";
import { FREE_PLAN, OWNER_PLAN, isOwnerEmail, planFor, type Plan } from "../lib/plans.js";

/**
 * Who is allowed to do what, and how much of it they have already done.
 *
 * Usage is *derived* rather than counted into a column. An interview already
 * writes a `MockInterviewSession` row and a bug attempt already writes a
 * `BugSubmission` row, so the quota is a `count()` over rows that must exist
 * anyway. A separate counter would be a second source of truth to keep in step
 * with the first, and every bug in that class ends the same way: someone is
 * billed for or denied something the transcript says did not happen.
 *
 * The cost is one indexed count per metered request, which both tables are
 * already indexed for (`[userId, createdAt]`, `[userId, submittedAt]`).
 */

export interface Usage {
  interviewsThisWeek: number;
  bugsToday: number;
}

export interface Entitlement {
  plan: Plan;
  /** Null when the user is on free — nothing to expire. */
  currentPeriodEnd: Date | null;
  usage: Usage;
}

/** Monday 00:00 local. A "week" the candidate recognises, not a rolling 168h. */
export function weekStart(now = new Date()): Date {
  const start = new Date(now);
  // getDay() is 0 for Sunday, which belongs to the week that began six days ago.
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function dayStart(now = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Whether this account belongs to the creator (see ownerEmails in lib/plans).
 * Read from the user row rather than the session token so it holds for every
 * caller and every token, however old.
 */
export async function isOwnerAccount(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  return isOwnerEmail(user?.email);
}

/**
 * The user's live plan.
 *
 * An owner account is always on OWNER_PLAN, whatever the subscription table
 * says: every quota and plan gate reads its limits from here, so this one
 * branch is the whole bypass.
 *
 * Otherwise expiry is enforced in the query, so a lapsed subscription stops
 * granting anything the second it lapses without a job having to run. Where
 * two are somehow active — an upgrade paid before the old one expired — the
 * one that runs longest wins, which is always the one the user paid most
 * recently for.
 */
export async function activePlan(userId: string): Promise<{ plan: Plan; currentPeriodEnd: Date | null }> {
  const [owner, subscription] = await Promise.all([
    isOwnerAccount(userId),
    prisma.subscription.findFirst({
      where: { userId, status: "active", currentPeriodEnd: { gt: new Date() } },
      orderBy: { currentPeriodEnd: "desc" },
      select: { planId: true, currentPeriodEnd: true },
    }),
  ]);

  if (owner) return { plan: OWNER_PLAN, currentPeriodEnd: null };
  if (!subscription) return { plan: FREE_PLAN, currentPeriodEnd: null };
  return { plan: planFor(subscription.planId), currentPeriodEnd: subscription.currentPeriodEnd };
}

/** Interviews started since Monday, both written and spoken. */
export async function interviewsThisWeek(userId: string): Promise<number> {
  return prisma.mockInterviewSession.count({
    where: { userId, createdAt: { gte: weekStart() } },
  });
}

/**
 * Distinct bug challenges touched today.
 *
 * Distinct, not submissions: a bug hunt is not one shot, and charging a day's
 * allowance for every failed run would make the quota punish iteration — which
 * is the thing the module exists to teach.
 */
export async function bugsToday(userId: string): Promise<number> {
  const rows = await prisma.bugSubmission.findMany({
    where: { userId, submittedAt: { gte: dayStart() } },
    select: { challengeId: true },
    distinct: ["challengeId"],
  });
  return rows.length;
}

export async function entitlementFor(userId: string): Promise<Entitlement> {
  const [{ plan, currentPeriodEnd }, interviews, bugs] = await Promise.all([
    activePlan(userId),
    interviewsThisWeek(userId),
    bugsToday(userId),
  ]);
  return {
    plan,
    currentPeriodEnd,
    usage: { interviewsThisWeek: interviews, bugsToday: bugs },
  };
}

/** A refusal the candidate is meant to read, with the upgrade it points at. */
export interface QuotaDenial {
  error: string;
  reason: "quota_exceeded" | "plan_required";
  limit: number | null;
  used: number;
  planId: string;
  /** What the UI should offer next. */
  upgrade: true;
}

const atLimit = (used: number, limit: number | null) => limit !== null && used >= limit;

/**
 * Interview quota. Checked before a session row is created, so a refusal costs
 * nothing and leaves no half-started interview behind.
 */
export async function checkInterviewQuota(userId: string): Promise<QuotaDenial | null> {
  const [{ plan }, used] = await Promise.all([activePlan(userId), interviewsThisWeek(userId)]);
  const limit = plan.entitlements.interviewsPerWeek;
  if (!atLimit(used, limit)) return null;

  return {
    error:
      `You have used all ${limit} mock interviews on the ${plan.name} plan this week. ` +
      `Upgrade for more, or come back on Monday.`,
    reason: "quota_exceeded",
    limit,
    used,
    planId: plan.id,
    upgrade: true,
  };
}

/** Voice rounds longer than the plan allows are a plan gate, not a quota. */
export async function checkVoiceDuration(
  userId: string,
  minutes: number,
): Promise<QuotaDenial | null> {
  const { plan } = await activePlan(userId);
  if (plan.entitlements.voiceDurationsMin.includes(minutes)) return null;

  const longest = Math.max(...plan.entitlements.voiceDurationsMin);
  return {
    error: `${minutes} minute interviews need a higher plan. ${plan.name} includes rounds up to ${longest} minutes.`,
    reason: "plan_required",
    limit: longest,
    used: minutes,
    planId: plan.id,
    upgrade: true,
  };
}

/**
 * Bug quota, charged per distinct challenge per day.
 *
 * A challenge already worked today is always allowed through, however many
 * times it is submitted — otherwise the first failed attempt would lock the
 * candidate out of finishing it.
 */
export async function checkBugQuota(userId: string, challengeId: string): Promise<QuotaDenial | null> {
  const { plan } = await activePlan(userId);
  const limit = plan.entitlements.bugsPerDay;
  if (limit === null) return null;

  const already = await prisma.bugSubmission.findFirst({
    where: { userId, challengeId, submittedAt: { gte: dayStart() } },
    select: { id: true },
  });
  if (already) return null;

  const used = await bugsToday(userId);
  if (!atLimit(used, limit)) return null;

  return {
    error:
      `You have used ${limit === 1 ? "your bug hunt" : `all ${limit} bug hunts`} for today on the ` +
      `${plan.name} plan. Upgrade for more, or come back tomorrow.`,
    reason: "quota_exceeded",
    limit,
    used,
    planId: plan.id,
    upgrade: true,
  };
}

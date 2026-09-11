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

/**
 * The clock the quotas run on: the product calendar in lib/clock.ts (IST by
 * default). "Come back tomorrow" and "come back on Monday" mean the
 * candidate's tomorrow and Monday; the windows used to roll at the server's
 * midnight — UTC on Railway, 05:30 in India — so a bug hunt used at 6 am was
 * not back until 5:30 the next morning. Re-exported so the tests and the
 * older call sites keep their names.
 */
import { dayStart, weekStart } from "../lib/clock.js";
export { dayStart, weekStart };

/**
 * Whether this account belongs to the creator (see ownerEmails in lib/plans).
 *
 * Read from the user row so it holds for every caller and every token,
 * however old. A caller that already has the email — every authenticated
 * route does, from `req.user` — may pass it and skip the round trip: the
 * token's email is the row's email as of sign-in, and an owner's email does
 * not change under them.
 */
export async function isOwnerAccount(userId: string, email?: string | null): Promise<boolean> {
  if (email) return isOwnerEmail(email);
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
export async function activePlan(userId: string, email?: string | null): Promise<{ plan: Plan; currentPeriodEnd: Date | null }> {
  const [owner, subscription] = await Promise.all([
    isOwnerAccount(userId, email),
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

/**
 * Interviews used since Monday, both written and spoken.
 *
 * "Used", not "created": a round the candidate never actually sat — opened
 * and abandoned before the first answer, or left "started" by a refresh or a
 * model failure at the door — should not cost a slot. What counts is a
 * closed round, a written round with at least one answer on disk, or a
 * spoken round whose audio actually began.
 */
export async function interviewsThisWeek(userId: string): Promise<number> {
  return prisma.mockInterviewSession.count({
    where: {
      userId,
      createdAt: { gte: weekStart() },
      OR: [
        { status: "completed" },
        { questions: { some: { userAnswer: { not: null } } } },
        { mode: "voice", startedAt: { not: null } },
      ],
    },
  });
}

/**
 * Distinct bug challenges touched today.
 *
 * Distinct, not submissions: a bug hunt is not one shot, and charging a day's
 * allowance for every failed run would make the quota punish iteration — which
 * is the thing the module exists to teach.
 *
 * Grouped in SQL rather than `distinct` in the client, which fetched every
 * submission of the day and deduplicated it here.
 */
export async function bugsToday(userId: string): Promise<number> {
  const rows = await prisma.bugSubmission.groupBy({
    by: ["challengeId"],
    where: { userId, submittedAt: { gte: dayStart() } },
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
 *
 * The three lookups do not depend on one another, so they go out together:
 * one round trip where there were four, and none at all for an owner whose
 * email the caller already had.
 */
export async function checkBugQuota(userId: string, challengeId: string, email?: string | null): Promise<QuotaDenial | null> {
  if (email && isOwnerEmail(email)) return null;

  const [{ plan }, already, used] = await Promise.all([
    activePlan(userId, email),
    prisma.bugSubmission.findFirst({
      where: { userId, challengeId, submittedAt: { gte: dayStart() } },
      select: { id: true },
    }),
    bugsToday(userId),
  ]);
  const limit = plan.entitlements.bugsPerDay;
  if (limit === null) return null;
  if (already) return null;
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

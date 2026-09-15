import { Prisma } from "@prisma/client";
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
  /** Rounds sat this week on the plan's own allowance — bonus rounds not included. */
  interviewsThisWeek: number;
  bugsToday: number;
  /** Bonus mock interviews still unspent: the roadmap's chests, less the rounds sat on them. */
  interviewCredits: number;
  /** Messages sent to the site assistant since the day began. */
  assistantMessagesToday: number;
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
/** A round that was actually sat — see `interviewsThisWeek`. */
const SAT_ROUND: Prisma.MockInterviewSessionWhereInput = {
  OR: [
    { status: "completed" },
    { questions: { some: { userAnswer: { not: null } } } },
    { mode: "voice", startedAt: { not: null } },
  ],
};

export async function interviewsThisWeek(userId: string): Promise<number> {
  return prisma.mockInterviewSession.count({
    where: {
      userId,
      createdAt: { gte: weekStart() },
      // A round admitted on a roadmap credit is not the plan's to count; it
      // has its own ledger below.
      onCredit: false,
      ...SAT_ROUND,
    },
  });
}

/**
 * Bonus mock interviews from the roadmap's chests, less the ones spent.
 *
 * Derived, like every quota here: granted is the sum over RoadmapReward
 * rows, spent is the count of rounds opened `onCredit` that were actually
 * sat — the same rule the weekly count applies, so a bonus round abandoned
 * at the door is not a bonus round lost. No counter to keep in step with
 * either table.
 */
export async function interviewCredits(userId: string): Promise<number> {
  const [granted, spent] = await Promise.all([
    prisma.roadmapReward.aggregate({ where: { userId }, _sum: { interviewCredits: true } }),
    prisma.mockInterviewSession.count({ where: { userId, onCredit: true, ...SAT_ROUND } }),
  ]);
  return Math.max(0, (granted._sum.interviewCredits ?? 0) - spent);
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

/**
 * Messages the account has sent the assistant today. Every row counts,
 * cleared or not: "clear conversation" hides history, it does not refill
 * the day's allowance.
 */
export async function assistantMessagesToday(userId: string): Promise<number> {
  return prisma.assistantMessage.count({ where: { userId, role: "user", createdAt: { gte: dayStart() } } });
}

export async function entitlementFor(userId: string): Promise<Entitlement> {
  const [{ plan, currentPeriodEnd }, interviews, bugs, credits, assistant] = await Promise.all([
    activePlan(userId),
    interviewsThisWeek(userId),
    bugsToday(userId),
    interviewCredits(userId),
    assistantMessagesToday(userId),
  ]);
  return {
    plan,
    currentPeriodEnd,
    usage: { interviewsThisWeek: interviews, bugsToday: bugs, interviewCredits: credits, assistantMessagesToday: assistant },
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
 *
 * The plan's allowance goes first; once it is used up a roadmap credit, if
 * there is one, admits the round `onCredit` — the caller stamps the session
 * so the credit is spent by that row and not by the plan's count. Only then
 * is the candidate refused.
 */
export async function checkInterviewQuota(userId: string): Promise<{ denial: QuotaDenial | null; onCredit: boolean }> {
  const [{ plan }, used] = await Promise.all([activePlan(userId), interviewsThisWeek(userId)]);
  const limit = plan.entitlements.interviewsPerWeek;
  if (!atLimit(used, limit)) return { denial: null, onCredit: false };

  if ((await interviewCredits(userId)) > 0) return { denial: null, onCredit: true };

  return {
    denial: {
      error:
        `You have used all ${limit} mock interviews on the ${plan.name} plan this week. ` +
        `Upgrade for more, clear a tier of the DSA roadmap for a bonus round, or come back on Monday.`,
      reason: "quota_exceeded",
      limit,
      used,
      planId: plan.id,
      upgrade: true,
    },
    onCredit: false,
  };
}

/**
 * The assistant's daily allowance. Checked before the model is called, so a
 * refusal costs no tokens off the shared free tier.
 */
export async function checkAssistantQuota(userId: string): Promise<{ denial: QuotaDenial | null; used: number; limit: number | null }> {
  const [{ plan }, used] = await Promise.all([activePlan(userId), assistantMessagesToday(userId)]);
  const limit = plan.entitlements.assistantMessagesPerDay;
  if (!atLimit(used, limit)) return { denial: null, used, limit };
  return {
    denial: {
      error: `You have used today's ${limit} assistant messages on the ${plan.name} plan. Upgrade for more, or ask again tomorrow.`,
      reason: "quota_exceeded",
      limit,
      used,
      planId: plan.id,
      upgrade: true,
    },
    used,
    limit,
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

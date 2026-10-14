import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  ACTION_LABELS,
  CREDIT_COSTS,
  FREE_PLAN,
  OWNER_PLAN,
  allowanceLabel,
  freeForAll,
  isOwnerEmail,
  lifetimePlan,
  planOfSubscription,
  tierOf,
  withFreeForAll,
  type FreeForAll,
  type MeteredAction,
  type Plan,
} from "../lib/plans.js";
import { grantsLifetimeAccess } from "../lib/honours.js";
import { creditBalance, creditRefsSince, newMeteredId, refundSpend, spendCredits } from "./credits.js";

/**
 * Who is allowed to do what, and how much of it they have already done.
 *
 * Usage is *derived* rather than counted into a column. An interview already
 * writes a `MockInterviewSession` row, a placement test a `MockAttempt`, a
 * resume review a `ResumeAnalysis`, a simulation a `SimulationRun` — so the
 * quota is a count over rows that must exist anyway. A separate counter would
 * be a second source of truth to keep in step with the first, and every bug
 * in that class ends the same way: someone is billed for or denied something
 * the transcript says did not happen.
 *
 * Since 2026-10-15 every metered feature is a rolling window from lib/plans
 * (`{ limit, days }`): "1 every 10 days" is counted over the ten days before
 * now, so the refusal can always name the day the next one is free. A use
 * paid for with credits (a `CreditSpend` naming the row), a round admitted on
 * a roadmap chest's bonus (`onCredit`) and a round or sitting that belongs to
 * a company simulation (paid by the run's own allowance) are not the plan's
 * to count.
 */

export interface AllowanceState {
  limit: number | null;
  days: number;
  /** Plan-paid uses in the window. */
  used: number;
  /** null when unlimited. */
  remaining: number | null;
  /** When the next plan-paid use frees up, while none is left; ISO. */
  nextAt: string | null;
  /** What one more use costs in credits. */
  creditCost: number;
}

export interface Usage {
  allowances: Record<MeteredAction, AllowanceState>;
  /** Credits in the wallet (services/credits). */
  credits: number;
  /** Bonus mock interviews still unspent: the roadmap's chests, less the rounds sat on them. */
  interviewCredits: number;
  bugsToday: number;
  /** Messages sent to the site assistant since the day began. */
  assistantMessagesToday: number;
}

export interface Entitlement {
  plan: Plan;
  /** Null when the user is on free — nothing to expire. */
  currentPeriodEnd: Date | null;
  usage: Usage;
  /** The free-for-all period (lib/plans FREE_FOR_ALL_UNTIL): while it runs, `plan.entitlements` are the lifted ones. */
  freeForAll: FreeForAll;
}

/**
 * The clock the daily quotas run on: the product calendar in lib/clock.ts
 * (IST by default). Re-exported so the tests and the older call sites keep
 * their names.
 */
import { dayStart, weekStart } from "../lib/clock.js";
export { dayStart, weekStart };

/**
 * Whether this account belongs to the creator (see ownerEmails in lib/plans).
 *
 * Read from the user row so it holds for every caller and every token,
 * however old. A caller that already has the email — every authenticated
 * route does, from `req.user` — may pass it and skip the round trip.
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
 * two are active — a Pro paused under a Pro Max — the higher plan wins, and
 * the lower one takes over when it ends.
 *
 * While the free-for-all period runs (lib/plans FREE_FOR_ALL_UNTIL) the plan
 * comes back with every limit lifted — the same id and name, so "you are on
 * Pro until <date>" stays true. Done here and nowhere else, for the same
 * reason the owner branch is: this is the one place limits come from.
 */
export async function activePlan(userId: string, email?: string | null): Promise<{ plan: Plan; currentPeriodEnd: Date | null }> {
  const [owner, liveRows, honours] = await Promise.all([
    isOwnerAccount(userId, email),
    // Every live row, not the latest-ending one: a Pro paused under a Pro
    // Max (services/billing grantAccess) ends later than the Max does, and
    // the higher plan is the one in force. One or two rows.
    prisma.subscription.findMany({
      where: { userId, status: "active", currentPeriodEnd: { gt: new Date() } },
      select: { planId: true, period: true, currentPeriodEnd: true },
      take: 10,
    }),
    // A founding member (lib/honours.ts) holds every limit lifted for good.
    prisma.honour.findMany({ where: { userId }, select: { kind: true } }),
  ]);

  const subscription = [...liveRows].sort((a, b) => tierOf(b.planId) - tierOf(a.planId) || b.currentPeriodEnd.getTime() - a.currentPeriodEnd.getTime())[0];
  if (owner) return { plan: OWNER_PLAN, currentPeriodEnd: null };
  if (grantsLifetimeAccess(honours.map((h) => h.kind))) return { plan: lifetimePlan(), currentPeriodEnd: null };
  if (!subscription) return { plan: withFreeForAll(FREE_PLAN), currentPeriodEnd: null };
  return { plan: withFreeForAll(planOfSubscription(subscription.planId, subscription.period)), currentPeriodEnd: subscription.currentPeriodEnd };
}

/**
 * A round that was actually sat. "Used", not "created": a round opened and
 * abandoned before the first answer, or left "started" by a refresh or a
 * model failure at the door, should not cost a slot. What counts is a
 * closed round, a written round with at least one answer on disk, or a
 * spoken round whose audio actually began. Also the admin panel's "sat"
 * column (services/admin-interviews.ts).
 */
export const SAT_ROUND: Prisma.MockInterviewSessionWhereInput = {
  OR: [
    { status: "completed" },
    { questions: { some: { userAnswer: { not: null } } } },
    { mode: "voice", startedAt: { not: null } },
  ],
};

const INTERVIEW_MODE: Record<"writtenInterview" | "voiceInterview", "written" | "voice"> = {
  writtenInterview: "written",
  voiceInterview: "voice",
};

export const interviewActionOf = (mode: string): "writtenInterview" | "voiceInterview" => (mode === "voice" ? "voiceInterview" : "writtenInterview");

/**
 * The instants of the plan-paid uses of `action` since `since`, oldest
 * first. Bounded: no allowance is near a hundred, and the window only needs
 * the oldest `used − limit + 1` to say when one frees up.
 */
async function usesSince(userId: string, action: MeteredAction, since: Date): Promise<Date[]> {
  const take = 100;
  if (action === "writtenInterview" || action === "voiceInterview") {
    // Interview rounds carry their own markers instead of a CreditSpend
    // lookup: `onCredit` (a roadmap bonus), `creditCost` (credits) and a
    // simulation's setup (the run's allowance) are each not the plan's.
    const rows = await prisma.mockInterviewSession.findMany({
      where: {
        userId,
        mode: INTERVIEW_MODE[action],
        createdAt: { gte: since },
        onCredit: false,
        creditCost: null,
        savedInterview: { simulationRunId: null },
        ...SAT_ROUND,
      },
      orderBy: { createdAt: "asc" },
      take,
      select: { createdAt: true },
    });
    return rows.map((r) => r.createdAt);
  }

  const [rows, paid] = await Promise.all([
    action === "resumeAnalysis"
      ? // A failed review gave the member nothing, so it costs nothing.
        prisma.resumeAnalysis.findMany({ where: { userId, createdAt: { gte: since }, status: { not: "failed" } }, orderBy: { createdAt: "asc" }, take, select: { id: true, createdAt: true } })
      : action === "placementMock"
        ? prisma.mockAttempt
            .findMany({ where: { userId, startedAt: { gte: since }, viaSimulation: false }, orderBy: { startedAt: "asc" }, take, select: { id: true, startedAt: true } })
            .then((list) => list.map((r) => ({ id: r.id, createdAt: r.startedAt })))
        : prisma.simulationRun.findMany({ where: { userId, createdAt: { gte: since } }, orderBy: { createdAt: "asc" }, take, select: { id: true, createdAt: true } }),
    creditRefsSince(userId, action, since),
  ]);
  return rows.filter((r) => !paid.has(r.id)).map((r) => r.createdAt);
}

/** Pure: the allowance as it stands given the plan-paid uses in the window, oldest first (null = not counted, unlimited). Exported for its test. */
export function stateOf(plan: Plan, action: MeteredAction, uses: Date[] | null): AllowanceState {
  const { limit, days } = plan.entitlements.allowances[action];
  const used = uses?.length ?? 0;
  if (limit === null) return { limit, days, used, remaining: null, nextAt: null, creditCost: CREDIT_COSTS[action] };
  const remaining = Math.max(0, limit - used);
  // With `used` uses in the window and room for `limit`, a slot opens when
  // the (used − limit)th oldest leaves it.
  const leaving = remaining === 0 && uses ? uses[used - limit] : undefined;
  return { limit, days, used, remaining, nextAt: leaving ? new Date(leaving.getTime() + days * 86_400_000).toISOString() : null, creditCost: CREDIT_COSTS[action] };
}

const windowStart = (days: number) => new Date(Date.now() - days * 86_400_000);

/** One action's allowance as it stands, on a plan already in hand. An unlimited one costs no query. */
async function allowanceOn(userId: string, plan: Plan, action: MeteredAction): Promise<AllowanceState> {
  const { limit, days } = plan.entitlements.allowances[action];
  if (limit === null) return stateOf(plan, action, null);
  return stateOf(plan, action, await usesSince(userId, action, windowStart(days)));
}

export async function allowanceFor(userId: string, email: string | null | undefined, action: MeteredAction): Promise<{ plan: Plan; state: AllowanceState }> {
  const { plan } = await activePlan(userId, email);
  return { plan, state: await allowanceOn(userId, plan, action) };
}

/**
 * Bonus mock interviews from the roadmap's chests, less the ones spent.
 * Granted is the sum over RoadmapReward rows, spent is the count of rounds
 * opened `onCredit` that were actually sat.
 */
export async function interviewCredits(userId: string): Promise<number> {
  const [granted, spent] = await Promise.all([
    prisma.roadmapReward.aggregate({ where: { userId }, _sum: { interviewCredits: true } }),
    prisma.mockInterviewSession.count({ where: { userId, onCredit: true, ...SAT_ROUND } }),
  ]);
  return Math.max(0, (granted._sum.interviewCredits ?? 0) - spent);
}

/**
 * Distinct bug challenges touched today — distinct, not submissions, so a
 * failed run never costs the day. Unlimited on every plan since 2026-10-15;
 * kept for the field and the admin view.
 */
export async function bugsToday(userId: string): Promise<number> {
  const rows = await prisma.bugSubmission.groupBy({
    by: ["challengeId"],
    where: { userId, submittedAt: { gte: dayStart() } },
  });
  return rows.length;
}

/** Messages the account has sent the assistant today; "clear" hides history, it does not refill the day. */
export async function assistantMessagesToday(userId: string): Promise<number> {
  return prisma.assistantMessage.count({ where: { userId, role: "user", createdAt: { gte: dayStart() } } });
}

const METERED: MeteredAction[] = ["resumeAnalysis", "placementMock", "writtenInterview", "voiceInterview", "simulation"];

/**
 * The plan and every allowance, for GET /api/billing/me and the assistant.
 * `email` is the token's: a route that has `req.user` passes it so the
 * owner test is a set lookup rather than a round trip.
 */
export async function entitlementFor(userId: string, email?: string | null): Promise<Entitlement> {
  const { plan, currentPeriodEnd } = await activePlan(userId, email);
  const [states, credits, bonus, bugs, assistant] = await Promise.all([
    Promise.all(METERED.map((action) => allowanceOn(userId, plan, action))),
    creditBalance(userId),
    interviewCredits(userId),
    bugsToday(userId),
    assistantMessagesToday(userId),
  ]);
  const allowances = Object.fromEntries(METERED.map((action, i) => [action, states[i]])) as Record<MeteredAction, AllowanceState>;
  return {
    plan,
    currentPeriodEnd,
    usage: { allowances, credits, interviewCredits: bonus, bugsToday: bugs, assistantMessagesToday: assistant },
    freeForAll: freeForAll(),
  };
}

/* ── Refusals ─────────────────────────────────────────────────────────── */

/** A refusal the member is meant to read, with what the UI should offer next. */
export interface QuotaDenial {
  error: string;
  reason: "quota_exceeded" | "plan_required" | "credits_short";
  limit: number | null;
  used: number;
  planId: string;
  upgrade: true;
  /** The metered feature refused, when it is one. */
  action?: MeteredAction;
  /** When the next free use opens, ISO. */
  nextAt?: string | null;
  /** One more use on credits: its price and the wallet. The client offers it when the balance covers it. */
  credits?: { cost: number; balance: number };
}

/** Thrown by meteredCreate and the gates; routes answer `402` with `denial`. */
export class QuotaError extends Error {
  constructor(public denial: QuotaDenial) {
    super(denial.error);
    this.name = "QuotaError";
  }
}

/** "21 Oct" in the product's calendar. */
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

function denialFor(plan: Plan, action: MeteredAction, state: AllowanceState, balance: number, reason: QuotaDenial["reason"] = "quota_exceeded"): QuotaDenial {
  const label = ACTION_LABELS[action];
  const allowance = allowanceLabel({ limit: state.limit, days: state.days });
  const when = state.nextAt ? `Your next free one is on ${shortDate(state.nextAt)}` : "Your next free one opens soon";
  const pay = balance >= state.creditCost ? `use ${state.creditCost} credits for one now` : `buy credits (${state.creditCost} for one)`;
  const upgrade = plan.id === "free" ? ", or go Pro for more" : "";
  const error =
    reason === "credits_short"
      ? `You need ${state.creditCost} credits for one more ${label.one} and have ${balance}. Buy a credit pack on the pricing page${upgrade}.`
      : `You have used ${plan.id === "free" ? "your free" : `the ${plan.name} plan's`} ${state.limit === 1 ? label.one : label.many} (${allowance}). ${when} — or ${pay}${upgrade}.`;
  return {
    error,
    reason,
    limit: state.limit,
    used: state.used,
    planId: plan.id,
    upgrade: true,
    action,
    nextAt: state.nextAt,
    credits: { cost: state.creditCost, balance },
  };
}

/**
 * Create one use of a metered feature, paid for by the plan or — when the
 * member asked (`useCredits`) and the allowance is spent — by credits.
 *
 * `create(id)` makes the row under the id given (minted here, so a credit
 * spend can name it before it exists) and says whether it made a new one
 * (`created: false` when an existing row was handed back instead — a live
 * sitting resumed — which costs nothing). `remove(id)` takes back a row that
 * turned out not to fit.
 *
 * The plan's path is "create, then count, then undo if over" — two requests
 * racing for the last free use both create, both count the other, and the
 * later one is taken back; the same rule satRoundFits keeps for interviews.
 */
export async function meteredCreate<T extends { created: boolean }>(
  userId: string,
  email: string | null | undefined,
  action: MeteredAction,
  useCredits: boolean,
  create: (id: string) => Promise<T>,
  remove: (id: string) => Promise<void>,
): Promise<T> {
  const { plan, state } = await allowanceFor(userId, email, action);

  if (state.remaining === null || state.remaining > 0) {
    const id = newMeteredId();
    const row = await create(id);
    if (!row.created || state.remaining === null) return row;
    const after = await allowanceOn(userId, plan, action);
    if (after.limit !== null && after.used > after.limit) {
      await remove(id);
      throw new QuotaError(denialFor(plan, action, after, await creditBalance(userId)));
    }
    return row;
  }

  const balance = await creditBalance(userId);
  if (!useCredits) throw new QuotaError(denialFor(plan, action, state, balance));

  const id = newMeteredId();
  if (!(await spendCredits(userId, action, id, state.creditCost))) {
    throw new QuotaError(denialFor(plan, action, state, await creditBalance(userId), "credits_short"));
  }
  try {
    const row = await create(id);
    if (!row.created) await refundSpend(action, id);
    return row;
  } catch (err) {
    await refundSpend(action, id);
    throw err;
  }
}

/** A feature the plan does not include at all — the export, the optimisation, a skill-test level. */
export async function requireFeature(
  userId: string,
  email: string | null | undefined,
  allowed: (plan: Plan) => boolean,
  what: string,
): Promise<void> {
  const { plan } = await activePlan(userId, email);
  if (allowed(plan)) return;
  throw new QuotaError({
    error: `${what} is part of Pro. Free covers the rest — see the plans to add it.`,
    reason: "plan_required",
    limit: null,
    used: 0,
    planId: plan.id,
    upgrade: true,
  });
}

/* ── Interviews ───────────────────────────────────────────────────────── */

/**
 * What admits an interview round of `mode`, asked at /start and again when
 * the round becomes sat (the first answer, the first voice connect).
 *
 * In order: a round of a company simulation is the run's (no charge here);
 * then the plan's window for that mode; then a roadmap chest's bonus round
 * (`onCredit`); then credits, only when the member asked (`creditCost` is
 * stamped on the round and charged when it is sat). Only then a refusal.
 */
export async function checkInterviewQuota(
  userId: string,
  email: string | null | undefined,
  mode: string,
  options: { useCredits?: boolean; simulation?: boolean } = {},
): Promise<{ denial: QuotaDenial | null; onCredit: boolean; creditCost: number | null }> {
  if (options.simulation) return { denial: null, onCredit: false, creditCost: null };
  const action = interviewActionOf(mode);
  const { plan, state } = await allowanceFor(userId, email, action);
  if (state.remaining === null || state.remaining > 0) return { denial: null, onCredit: false, creditCost: null };
  if ((await interviewCredits(userId)) > 0) return { denial: null, onCredit: true, creditCost: null };
  const balance = await creditBalance(userId);
  if (options.useCredits) {
    if (balance >= state.creditCost) return { denial: null, onCredit: false, creditCost: state.creditCost };
    return { denial: denialFor(plan, action, state, balance, "credits_short"), onCredit: false, creditCost: null };
  }
  return { denial: denialFor(plan, action, state, balance), onCredit: false, creditCost: null };
}

/**
 * Whether a round that has just been stamped as sat still fits what it was
 * admitted on.
 *
 * The quota counts rounds *sat*, not opened, so a round abandoned at the
 * door costs nothing; checking only at /start let a free account open
 * several rounds and sit them all. The routes stamp the round (the answer,
 * `startedAt`), then ask this, which counts the stamped round with the rest,
 * and undo the stamp when it does not fit. A round on credits is charged
 * here — the first moment it is really used — and refused if the wallet no
 * longer covers it.
 */
export async function satRoundFits(
  userId: string,
  email: string | null | undefined,
  round: { id: string; mode: string; onCredit: boolean; creditCost: number | null; simulation: boolean },
): Promise<boolean> {
  if (round.simulation) return true;
  if (round.creditCost !== null) return spendCredits(userId, interviewActionOf(round.mode), round.id, round.creditCost);
  if (round.onCredit) {
    const [granted, spent] = await Promise.all([
      prisma.roadmapReward.aggregate({ where: { userId }, _sum: { interviewCredits: true } }),
      prisma.mockInterviewSession.count({ where: { userId, onCredit: true, ...SAT_ROUND } }),
    ]);
    return spent <= (granted._sum.interviewCredits ?? 0);
  }
  const { state } = await allowanceFor(userId, email, interviewActionOf(round.mode));
  return state.limit === null || state.used <= state.limit;
}

/** What a round refused at that moment is told; the numbers moved under it, so none are quoted. */
export const SAT_ROUND_REFUSAL = {
  error: "You have used the interviews your plan allows for now. Use credits, go Pro for more, or clear a tier of the DSA roadmap for a bonus round.",
  reason: "quota_exceeded",
  upgrade: true,
} as const;

/* ── The rest ─────────────────────────────────────────────────────────── */

/** The assistant's daily allowance (unlimited on every plan today; kept so a cap can return). */
export async function checkAssistantQuota(userId: string, email?: string | null): Promise<{ denial: QuotaDenial | null; used: number; limit: number | null }> {
  const [{ plan }, used] = await Promise.all([activePlan(userId, email), assistantMessagesToday(userId)]);
  const limit = plan.entitlements.assistantMessagesPerDay;
  if (limit === null || used < limit) return { denial: null, used, limit };
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
export async function checkVoiceDuration(userId: string, minutes: number, email?: string | null): Promise<QuotaDenial | null> {
  const { plan } = await activePlan(userId, email);
  if (plan.entitlements.voiceDurationsMin.includes(minutes)) return null;
  const longest = Math.max(...plan.entitlements.voiceDurationsMin);
  return {
    error: `${minutes} minute interviews are part of Pro. ${plan.name} includes rounds up to ${longest} minutes.`,
    reason: "plan_required",
    limit: longest,
    used: minutes,
    planId: plan.id,
    upgrade: true,
  };
}

/**
 * Bug quota, charged per distinct challenge per day. A challenge already
 * worked today is always allowed through, however many times it is
 * submitted. Unlimited on every plan since 2026-10-15, so this answers
 * without a query unless a plan sets a number again.
 */
export async function checkBugQuota(userId: string, challengeId: string, email?: string | null): Promise<QuotaDenial | null> {
  if (email && isOwnerEmail(email)) return null;
  const { plan } = await activePlan(userId, email);
  const limit = plan.entitlements.bugsPerDay;
  if (limit === null) return null;
  const [already, used] = await Promise.all([
    prisma.bugSubmission.findFirst({ where: { userId, challengeId, submittedAt: { gte: dayStart() } }, select: { id: true } }),
    bugsToday(userId),
  ]);
  if (already || used < limit) return null;
  return {
    error: `You have used ${limit === 1 ? "your bug hunt" : `all ${limit} bug hunts`} for today on the ${plan.name} plan. Upgrade for more, or come back tomorrow.`,
    reason: "quota_exceeded",
    limit,
    used,
    planId: plan.id,
    upgrade: true,
  };
}

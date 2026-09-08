/**
 * What each plan costs and what it unlocks.
 *
 * One table, read by the pricing page, the checkout, the webhook and every
 * quota check. Entitlements are data rather than `if (plan === "pro")` branches
 * scattered through the routes, so changing a limit is editing a number here
 * and nothing else — and a new plan is one entry.
 *
 * `null` means unlimited throughout. It is deliberately not `Infinity` or `-1`:
 * those read as numbers and invite arithmetic that silently does the wrong
 * thing, whereas `null` forces every caller to handle "no limit" explicitly.
 */

export type PlanId = "free" | "starter" | "pro" | "elite";
export type BillingPeriod = "monthly" | "yearly";

export interface PlanEntitlements {
  /** Mock interviews that may be started per rolling week. */
  interviewsPerWeek: number | null;
  /** Voice-round lengths this plan may choose, in minutes. */
  voiceDurationsMin: number[];
  /** Distinct bug challenges that may be worked per day. */
  bugsPerDay: number | null;
  /** DSA problems per day. Unlimited on every plan, including free. */
  problemsPerDay: number | null;
  /** Duels per day. Unlimited on every plan, including free. */
  duelsPerDay: number | null;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Rupees per month. Zero on free. */
  monthly: number;
  /**
   * Rupees per year. Ten months for twelve — the two free months are the whole
   * reason to commit, and a round multiple keeps the saving legible.
   */
  yearly: number;
  entitlements: PlanEntitlements;
  /** Marketing lines, in display order. */
  highlights: string[];
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Everything you need to keep practising.",
    monthly: 0,
    yearly: 0,
    entitlements: {
      interviewsPerWeek: 2,
      voiceDurationsMin: [10],
      bugsPerDay: 1,
      problemsPerDay: null,
      duelsPerDay: null,
    },
    highlights: [
      "Unlimited DSA problem solving",
      "2 mock interviews a week (10 min)",
      "1 bug hunt a day",
      "Unlimited 1v1 and 2v2 duels",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "For the week before an interview.",
    monthly: 199,
    yearly: 1990,
    entitlements: {
      interviewsPerWeek: 8,
      voiceDurationsMin: [10, 20],
      bugsPerDay: 5,
      problemsPerDay: null,
      duelsPerDay: null,
    },
    highlights: [
      "Unlimited DSA problem solving",
      "8 mock interviews a week",
      "10 and 20 minute voice rounds",
      "5 bug hunts a day",
      "Unlimited 1v1 and 2v2 duels",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Full-length rounds, every day.",
    monthly: 399,
    yearly: 3990,
    entitlements: {
      interviewsPerWeek: 20,
      voiceDurationsMin: [10, 20, 30],
      bugsPerDay: 20,
      problemsPerDay: null,
      duelsPerDay: null,
    },
    highlights: [
      "Unlimited DSA problem solving",
      "20 mock interviews a week",
      "Full 30 minute voice rounds",
      "20 bug hunts a day",
      "Unlimited 1v1 and 2v2 duels",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    tagline: "No ceilings.",
    monthly: 799,
    yearly: 7990,
    entitlements: {
      interviewsPerWeek: null,
      voiceDurationsMin: [10, 20, 30],
      bugsPerDay: null,
      problemsPerDay: null,
      duelsPerDay: null,
    },
    highlights: [
      "Unlimited DSA problem solving",
      "Unlimited mock interviews",
      "Full 30 minute voice rounds",
      "Unlimited bug hunts",
      "Unlimited 1v1 and 2v2 duels",
    ],
  },
];

const BY_ID = new Map(PLANS.map((plan) => [plan.id, plan]));

export const FREE_PLAN = BY_ID.get("free") as Plan;

/** Never throws: an unknown or missing id is treated as the free tier. */
export function planFor(id: string | null | undefined): Plan {
  return (id && BY_ID.get(id as PlanId)) || FREE_PLAN;
}

export function isPaidPlan(id: string): id is Exclude<PlanId, "free"> {
  const plan = BY_ID.get(id as PlanId);
  return Boolean(plan && plan.monthly > 0);
}

/** Rupees for one purchase of this plan at this period. */
export function priceOf(plan: Plan, period: BillingPeriod): number {
  return period === "yearly" ? plan.yearly : plan.monthly;
}

/** How long a paid period runs. Months are calendar months, not 30 days. */
export function periodEnd(from: Date, period: BillingPeriod): Date {
  const end = new Date(from);
  if (period === "yearly") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

/**
 * What each plan costs and what it unlocks.
 *
 * One table, read by the checkout, the webhook, every quota check and the
 * assistant's "Plans" section — and, through a generated copy
 * (scripts/plans-manifest.ts → frontend/src/content/plans.ts), by the
 * pricing page, which draws it without asking the API so the page paints in
 * full on its first frame. Entitlements are data rather than
 * `if (plan === "pro")` branches scattered through the routes, so changing a
 * limit is editing a number here (and regenerating the copy) and nothing else.
 *
 * `null` means unlimited throughout. It is deliberately not `Infinity` or `-1`:
 * those read as numbers and invite arithmetic that silently does the wrong
 * thing, whereas `null` forces every caller to handle "no limit" explicitly.
 *
 * The catalogue since 2026-10-15 (the owner's call, replacing Starter ₹199 /
 * Pro ₹399 / Elite ₹799 a month): one paid plan, Pro, sold three ways — a
 * month, a quarter, a year — plus two passes that are Pro for a fixed time
 * (a 7-day Sprint and a 6-month placement season), and credit packs that pay
 * for one more use of a metered feature once the plan's allowance is spent.
 * Every purchase is a one-time payment (Cashfree orders, no mandate): a
 * "subscription" and a "pass" differ only in how long they run. Allowances
 * are rolling windows — "1 every 10 days" is ten days from the use, not a
 * calendar block — so the page can always say when the next free one is.
 *
 * Pro Max (same day, the owner's ask: "what if the user needs more?") sits
 * above Pro for the heavy weeks: mock tests, written interviews and resume
 * reviews without a cap, more voice rounds and simulations, and bonus
 * credits paid into the wallet with every month bought.
 */

export type PlanId = "free" | "pro" | "max" | "starter" | "elite" | "owner";

/** The features metered by a rolling window, each with its own allowance and credit price. */
export const METERED_ACTIONS = ["resumeAnalysis", "placementMock", "writtenInterview", "voiceInterview", "simulation"] as const;
export type MeteredAction = (typeof METERED_ACTIONS)[number];

/** `limit` uses in any `days`-long window ending now; `limit: null` is unlimited. */
export interface Allowance {
  limit: number | null;
  days: number;
}

export interface PlanEntitlements {
  allowances: Record<MeteredAction, Allowance>;
  /** Skill-test levels this plan may sit; null = every level. */
  skillTestLevels: string[] | null;
  /** The resume's PDF/DOCX download. */
  resumeExport: boolean;
  /** The whole-resume AI optimisation (one bullet's rewrite stays free). */
  resumeOptimize: boolean;
  /** Voice-round lengths this plan may choose, in minutes. */
  voiceDurationsMin: number[];
  /** Distinct bug challenges per day. Unlimited on every plan since 2026-10-15. */
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
  entitlements: PlanEntitlements;
}

const FREE_ENTITLEMENTS: PlanEntitlements = {
  allowances: {
    resumeAnalysis: { limit: 1, days: 7 },
    placementMock: { limit: 1, days: 10 },
    writtenInterview: { limit: 1, days: 7 },
    voiceInterview: { limit: 1, days: 10 },
    simulation: { limit: 1, days: 14 },
  },
  skillTestLevels: ["basic"],
  resumeExport: false,
  resumeOptimize: false,
  voiceDurationsMin: [10],
  bugsPerDay: null,
  problemsPerDay: null,
  duelsPerDay: null,
};

const PRO_ENTITLEMENTS: PlanEntitlements = {
  allowances: {
    resumeAnalysis: { limit: 1, days: 1 },
    placementMock: { limit: 1, days: 2 },
    writtenInterview: { limit: null, days: 30 },
    // Voice is the one feature with a real cost per use (Gemini Live audio),
    // so it stays capped on the paid plan too — the owner's numbers.
    voiceInterview: { limit: 8, days: 30 },
    simulation: { limit: 5, days: 30 },
  },
  skillTestLevels: null,
  resumeExport: true,
  resumeOptimize: true,
  voiceDurationsMin: [10, 20, 30],
  bugsPerDay: null,
  problemsPerDay: null,
  duelsPerDay: null,
};

const MAX_ENTITLEMENTS: PlanEntitlements = {
  ...PRO_ENTITLEMENTS,
  allowances: {
    resumeAnalysis: { limit: null, days: 30 },
    placementMock: { limit: null, days: 30 },
    writtenInterview: { limit: null, days: 30 },
    // Still capped: a voice round is the one use with a real cost each time
    // (Gemini Live audio). 12 a month plus the bonus credits' worth keeps the
    // monthly price above the worst month's voice bill at today's estimate.
    voiceInterview: { limit: 12, days: 30 },
    // A simulation's voice rounds do not count against the voice cap
    // (services/entitlements), so this is capped too.
    simulation: { limit: 10, days: 30 },
  },
};

/** Every limit lifted — the owner, a founding member, the free-for-all period. */
export const LIFTED_ENTITLEMENTS: PlanEntitlements = {
  allowances: {
    resumeAnalysis: { limit: null, days: 1 },
    placementMock: { limit: null, days: 1 },
    writtenInterview: { limit: null, days: 1 },
    voiceInterview: { limit: null, days: 1 },
    simulation: { limit: null, days: 1 },
  },
  skillTestLevels: null,
  resumeExport: true,
  resumeOptimize: true,
  voiceDurationsMin: [10, 20, 30],
  bugsPerDay: null,
  problemsPerDay: null,
  duelsPerDay: null,
};

/** The plans on sale, in ladder order. */
export const PLANS: Plan[] = [
  { id: "free", name: "Free", tagline: "Practise every day, free forever.", entitlements: FREE_ENTITLEMENTS },
  { id: "pro", name: "Pro", tagline: "Everything you need for placement season.", entitlements: PRO_ENTITLEMENTS },
  { id: "max", name: "Pro Max", tagline: "For the weeks you practise every day.", entitlements: MAX_ENTITLEMENTS },
];

/**
 * Plans no longer sold, kept so a subscription bought before 2026-10-15
 * keeps what it paid for until its date: Starter (₹199) is now Pro's
 * entitlements under its own name, and Elite (₹799, "no ceilings") keeps no
 * ceilings. Never listed, never checked out (isPaidPlan says no); ranked by
 * tierOf so a running Elite is not replaced by a Pro bought by mistake.
 */
const LEGACY_PLANS: Plan[] = [
  { id: "starter", name: "Starter", tagline: "An earlier plan, kept until its end date.", entitlements: PRO_ENTITLEMENTS },
  { id: "elite", name: "Elite", tagline: "An earlier plan, kept until its end date.", entitlements: LIFTED_ENTITLEMENTS },
];

/**
 * Pro as it was sold until 2026-10-15 (₹399 a month, "20 mock interviews a
 * week"): a subscription bought then — its `period` is the old "monthly" or
 * "yearly", never an offer id — keeps 20 voice rounds a week until its end
 * date, above today's 8 a month. The terms promise a price change never
 * touches a plan already paid for (content/legal.ts, "Price changes").
 */
export const PRO_BEFORE_2026_10_15: Plan = {
  id: "pro",
  name: "Pro",
  tagline: "Pro as bought before 15 October 2026, kept until its end date.",
  entitlements: { ...PRO_ENTITLEMENTS, allowances: { ...PRO_ENTITLEMENTS.allowances, voiceInterview: { limit: 20, days: 7 } } },
};

/** The plan a stored subscription grants: its plan id, read with the period it was bought for. */
export function planOfSubscription(planId: string, period: string): Plan {
  if (planId === "pro" && (period === "monthly" || period === "yearly")) return PRO_BEFORE_2026_10_15;
  return planFor(planId);
}

/* ── What can be bought ───────────────────────────────────────────────── */

/**
 * One thing on sale that grants a plan for a time. Pro three ways and two
 * passes; all are one payment, and a purchase while one is running adds its
 * time to the end (services/billing grantAccess). Prices are rupees,
 * GST included.
 */
export type OfferId = "pro-monthly" | "pro-quarterly" | "pro-yearly" | "max-monthly" | "max-quarterly" | "max-yearly" | "sprint" | "season";

export interface PlanOffer {
  id: OfferId;
  kind: "plan" | "pass";
  planId: "pro" | "max";
  name: string;
  price: number;
  /** Calendar months, or days for the short pass. Exactly one is set. */
  months: number | null;
  days: number | null;
  /** Credits paid into the wallet when the order is paid (services/billing grantAccess). */
  bonusCredits: number;
}

/** Pro Max's bonus: this many credits for every month bought. */
export const MAX_BONUS_CREDITS_PER_MONTH = 50;

export const PLAN_OFFERS: PlanOffer[] = [
  { id: "pro-monthly", kind: "plan", planId: "pro", name: "Pro · Monthly", price: 149, months: 1, days: null, bonusCredits: 0 },
  { id: "pro-quarterly", kind: "plan", planId: "pro", name: "Pro · Quarterly", price: 399, months: 3, days: null, bonusCredits: 0 },
  { id: "pro-yearly", kind: "plan", planId: "pro", name: "Pro · Yearly", price: 999, months: 12, days: null, bonusCredits: 0 },
  { id: "max-monthly", kind: "plan", planId: "max", name: "Pro Max · Monthly", price: 399, months: 1, days: null, bonusCredits: MAX_BONUS_CREDITS_PER_MONTH },
  { id: "max-quarterly", kind: "plan", planId: "max", name: "Pro Max · Quarterly", price: 999, months: 3, days: null, bonusCredits: 3 * MAX_BONUS_CREDITS_PER_MONTH },
  { id: "max-yearly", kind: "plan", planId: "max", name: "Pro Max · Yearly", price: 2999, months: 12, days: null, bonusCredits: 12 * MAX_BONUS_CREDITS_PER_MONTH },
  { id: "sprint", kind: "pass", planId: "pro", name: "Sprint Pass", price: 99, months: null, days: 7, bonusCredits: 0 },
  { id: "season", kind: "pass", planId: "pro", name: "Placement Season Pass", price: 699, months: 6, days: null, bonusCredits: 0 },
];

/**
 * Credits: one more use of a metered feature after the allowance is spent.
 * Bought in packs, never expire, spent only when the member chooses to
 * (the client asks; a route never takes credits by itself).
 */
export type CreditPackId = "credits-100" | "credits-300" | "credits-700";

export interface CreditPack {
  id: CreditPackId;
  name: string;
  price: number;
  credits: number;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "credits-100", name: "Starter pack", price: 99, credits: 100 },
  { id: "credits-300", name: "Value pack", price: 249, credits: 300 },
  { id: "credits-700", name: "Mega pack", price: 499, credits: 700 },
];

/**
 * What one extra use costs. Each is above what the use costs to run — a
 * voice round is the dear one (Gemini Live audio), a mock or a resume
 * review a few rupees of model time — at the Starter pack's ₹0.99 a credit.
 */
export const CREDIT_COSTS: Record<MeteredAction, number> = {
  resumeAnalysis: 10,
  placementMock: 20,
  writtenInterview: 15,
  voiceInterview: 40,
  simulation: 60,
};

/** The PaymentOrder.planId of a credit pack (its `period` is the pack id). */
export const CREDITS_PRODUCT = "credits";

export function offerFor(id: unknown): PlanOffer | null {
  return PLAN_OFFERS.find((offer) => offer.id === id) ?? null;
}

export function creditPackFor(id: unknown): CreditPack | null {
  return CREDIT_PACKS.find((pack) => pack.id === id) ?? null;
}

/**
 * The creator's own plan: nothing metered, nothing to buy.
 *
 * It is deliberately not in PLANS — it is never listed on the pricing page,
 * cannot be checked out (isPaidPlan says no) and is never stored on a
 * subscription row. An account gets it only by being on the owner list below,
 * which activePlan() in services/entitlements consults before the database.
 */
export const OWNER_PLAN: Plan = {
  id: "owner",
  name: "Owner",
  tagline: "The creator's account — no limits, no billing.",
  entitlements: LIFTED_ENTITLEMENTS,
};

/**
 * Lifetime access, held through an honour (lib/honours.ts — the founding
 * members, 2026-10-09): every limit lifted for good, never billed.
 *
 * It keeps the old Elite id so every client that switches on the plan id
 * (the pricing page's "current plan", the billing view) treats it as the top
 * plan without a new case; the name says why it has no end date. Like
 * OWNER_PLAN it is not in PLANS, cannot be bought and is never stored on a
 * subscription row — activePlan() hands it out when the honour row exists.
 */
export function lifetimePlan(): Plan {
  return { id: "elite", name: "Lifetime", tagline: "Founding member: everything, for good.", entitlements: LIFTED_ENTITLEMENTS };
}

/**
 * Addresses that are always owners; OWNER_EMAILS adds more, comma-separated.
 *
 * Kept in code rather than only in the environment so the same accounts are
 * owners locally, in CI and in production without a dashboard step — an owner
 * who is one only on Railway is an owner nobody can test against.
 *
 * Lower-case entries only: ownerEmails() lower-cases the env additions but not
 * these, and isOwnerEmail() compares against a lower-cased input.
 */
const DEFAULT_OWNER_EMAILS = ["tabassump8319@gmail.com", "ayaanpathan14@gmail.com"];

export function ownerEmails(env: NodeJS.ProcessEnv = process.env): Set<string> {
  const extra = (env["OWNER_EMAILS"] ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_OWNER_EMAILS, ...extra]);
}

/** Case-insensitive; a missing email is never an owner. */
export function isOwnerEmail(email: string | null | undefined, env: NodeJS.ProcessEnv = process.env): boolean {
  if (!email) return false;
  return ownerEmails(env).has(email.trim().toLowerCase());
}

/* ── The free-for-all period ──────────────────────────────────────────── */

/**
 * Until this instant every account is treated as if it held the top of the
 * ladder: every limit on every plan is lifted. Checkout stays open (since
 * 2026-10-12): a plan bought now runs from its payment like any other.
 *
 * Decided on 2026-10-01 — everything free for every user until 1 January.
 * The plans stay listed (the pricing page shows what each will cost after
 * the date) but activePlan() in services/entitlements hands every quota
 * check the lifted entitlements. A subscription bought before the period
 * keeps its row and resumes as bought when the period ends.
 *
 * Midnight IST, the product calendar (lib/clock.ts): "until 1 January"
 * means the Indian 1 January, not 05:30 that morning. The same instant is
 * written in frontend/src/content/free-for-all.ts for the copy that is
 * baked at build time (FAQ, feature guide, meta description); the pricing
 * page and the interview lobby read it from /api/billing instead.
 */
export const FREE_FOR_ALL_UNTIL = new Date("2027-01-01T00:00:00+05:30");

export interface FreeForAll {
  /** Whether the period is running at the instant asked about. */
  active: boolean;
  /** When it ends, ISO 8601 — the client formats it. */
  until: string;
  /** The end as people read it: "1 January 2027". */
  untilLabel: string;
}

/** The date as it is read in India, where the calendar the product keeps runs. */
export function freeForAllUntilLabel(): string {
  return FREE_FOR_ALL_UNTIL.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}

export function freeForAll(now: Date = new Date()): FreeForAll {
  return { active: now.getTime() < FREE_FOR_ALL_UNTIL.getTime(), until: FREE_FOR_ALL_UNTIL.toISOString(), untilLabel: freeForAllUntilLabel() };
}

/**
 * The plan as it stands while the period runs: the same id and name — a
 * Pro subscriber is still on Pro until their date — with every limit
 * lifted. The owner plan is already unlimited and is returned as it is.
 */
export function withFreeForAll(plan: Plan, now: Date = new Date()): Plan {
  if (plan.id === "owner" || !freeForAll(now).active) return plan;
  return { ...plan, entitlements: LIFTED_ENTITLEMENTS };
}

const BY_ID = new Map([...PLANS, ...LEGACY_PLANS].map((plan) => [plan.id, plan]));

export const FREE_PLAN = BY_ID.get("free") as Plan;

/** Never throws: an unknown or missing id is treated as the free tier. */
export function planFor(id: string | null | undefined): Plan {
  return (id && BY_ID.get(id as PlanId)) || FREE_PLAN;
}

/** Only plans on sale today: a legacy id, free and the owner plan cannot be bought. */
export function isPaidPlan(id: string): boolean {
  return PLAN_OFFERS.some((offer) => offer.planId === id);
}

/**
 * Where a plan sits in the ladder, so a checkout that would replace a
 * running plan with a lesser one can be refused. Legacy Starter ranks with
 * Pro (same entitlements), Pro Max above it, legacy Elite (no limits) on top.
 */
const RANK: Record<string, number> = { free: 0, starter: 1, pro: 1, max: 2, elite: 3 };
export function tierOf(id: string | null | undefined): number {
  return id ? (RANK[id] ?? -1) : -1;
}

/**
 * When a period bought on `from` ends. `period` is what PaymentOrder and
 * Subscription store: an offer id, or the legacy "monthly"/"yearly".
 *
 * Months are calendar months, clamped to the month: `setMonth(+1)` from
 * 31 January landed on 3 March, so a subscription bought at the end of a
 * month ran three days short of the next one. A month from the 31st is now
 * the last day of the next month.
 */
export function periodEnd(from: Date, period: string): Date {
  const offer = offerFor(period);
  const months = offer ? offer.months : period === "yearly" ? 12 : 1;
  const end = new Date(from);
  if (offer && offer.days !== null) {
    end.setTime(end.getTime() + offer.days * 86_400_000);
    return end;
  }
  const day = end.getDate();
  end.setDate(1);
  end.setMonth(end.getMonth() + (months ?? 1));
  const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
  end.setDate(Math.min(day, lastDay));
  return end;
}

/* ── Words ────────────────────────────────────────────────────────────── */

/** What each metered action is called in a sentence ("your free resume analysis"). */
export const ACTION_LABELS: Record<MeteredAction, { one: string; many: string }> = {
  resumeAnalysis: { one: "resume analysis", many: "resume analyses" },
  placementMock: { one: "placement mock test", many: "placement mock tests" },
  writtenInterview: { one: "written AI interview", many: "written AI interviews" },
  voiceInterview: { one: "voice AI interview", many: "voice AI interviews" },
  simulation: { one: "company simulation", many: "company simulations" },
};

/** The window in words: "a day", "a week", "a month", "every 10 days", "every 2 weeks". */
function windowWords(days: number, limit: number): string {
  if (days === 1) return "a day";
  if (days === 7) return "a week";
  if (days === 30) return "a month";
  const span = days % 7 === 0 ? `${days / 7} weeks` : `${days} days`;
  return limit === 1 ? `every ${span}` : `per ${span}`;
}

/** "1 every 10 days", "8 a month", "Unlimited" — the pricing page's cells and the refusals both say it this way. */
export function allowanceLabel(allowance: Allowance): string {
  if (allowance.limit === null) return "Unlimited";
  return `${allowance.limit} ${windowWords(allowance.days, allowance.limit)}`;
}

import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { GOALS, detailsFor, isGoal, isLevel, onboardingStateOf, type Goal, type GoalDetails, type GoalLanguage, type Level } from "../lib/onboarding.js";

/**
 * What members say they are preparing for, for the admin panel: the answer
 * on each account (the user list's column and filter, the detail's field),
 * and for the accounts made in a window, how they split across the four
 * goals, skipped and never asked — and how many of each did something real
 * in their first week, which is the number the question exists to move.
 *
 * Everything is read from the four User columns (lib/onboarding.ts) and rows
 * that already exist; nothing is stored for this view. Three statements per
 * report, whatever the window: the split with its activation, the details
 * (companies, languages), and the `onboarding` telemetry events.
 */

/** Where an account stands on the question. */
export type OnboardingStatus = "answered" | "skipped" | "unasked";

/** The user list's goal filter: a goal, or a status. */
export const GOAL_FILTERS = [...GOALS, "skipped", "unasked"] as const;
export type GoalFilter = (typeof GOAL_FILTERS)[number];
export const isGoalFilter = (v: unknown): v is GoalFilter => typeof v === "string" && (GOAL_FILTERS as readonly string[]).includes(v);

/**
 * onboardedAt is set by an answer *and* by a skip (lib/onboarding.ts), so a
 * stamp with no valid goal is a skip; no stamp at all is never asked — a new
 * account that has not reached /welcome yet, or an older one that has not
 * answered the dashboard's line.
 */
export function onboardingStatus(row: { goal: string | null; onboardedAt: Date | string | null }): OnboardingStatus {
  if (!row.onboardedAt) return "unasked";
  return isGoal(row.goal) ? "answered" : "skipped";
}

export function goalFilterWhere(filter: GoalFilter): Prisma.UserWhereInput {
  if (filter === "unasked") return { onboardedAt: null };
  if (filter === "skipped") return { onboardedAt: { not: null }, goal: null };
  return { goal: filter };
}

/** What a user-list row carries. */
export function onboardingRow(row: { goal: string | null; level: string | null; onboardedAt: Date | string | null }) {
  const status = onboardingStatus(row);
  return {
    status,
    goal: status === "answered" ? (row.goal as Goal) : null,
    level: status === "answered" && isLevel(row.level) ? row.level : null,
  };
}

/** What the user detail carries: the row's fields, the details, when, and how the app will ask if it has not. */
export function onboardingDetail(row: { goal: string | null; level: string | null; goalDetails: unknown; onboardedAt: Date | string | null; createdAt: Date | string }) {
  const base = onboardingRow(row);
  return {
    ...base,
    details: detailsFor(base.goal, row.goalDetails),
    /** When it was answered or skipped. */
    at: row.onboardedAt ? new Date(row.onboardedAt).toISOString() : null,
    /** "welcome" — sent to /welcome on next load; "prompt" — an older account, shown the dashboard's line; null — settled. */
    ask: onboardingStateOf(row).ask,
  };
}

/* ── the window's report ─────────────────────────────────────────────── */

export type GoalBucketKey = Goal | "skipped" | "unasked";
const BUCKETS: readonly GoalBucketKey[] = [...GOALS, "skipped", "unasked"];

const WEEK_MS = 7 * 86_400_000;

export interface GoalBucket {
  key: GoalBucketKey;
  accounts: number;
  /** For a goal: how the answers split by level ("unset" = no level given). */
  levels: Record<Level | "unset", number>;
  /** Accounts at least a week old — the ones whose first week is over. */
  matured: number;
  /** Of those, how many did something real in their first seven days (ACTIVATION). */
  activated: number;
  /** Every account active in its first seven days so far, younger ones included. */
  activeSoFar: number;
}

/** One row of the grouped split: a (goal, level, answered) combination. */
export interface SplitRow {
  goal: string | null;
  level: string | null;
  /** Counts and flags come back as BIGINT or DECIMAL depending on the expression; num() reads any of them. */
  answered: unknown;
  accounts: unknown;
  matured: unknown;
  active: unknown;
  maturedActive: unknown;
}

/** One row of the grouped telemetry: the raw props, unquoted. */
export interface EventRow {
  goal: string | null;
  prefilled: string | null;
  keptGuess: string | null;
  skipped: string | null;
  edit: string | null;
  source: string | null;
  n: unknown;
}

const num = (v: unknown): number => (v == null ? 0 : Number(v) || 0);
/** A JSON boolean read back through JSON_UNQUOTE: "true", or a client that sent the string or 1. */
const yes = (v: string | null): boolean => v === "true" || v === "1";
const emptyLevels = (): Record<Level | "unset", number> => ({ new: 0, some: 0, comfortable: 0, unset: 0 });

/** The grouped split as buckets, in the panel's fixed order. Pure; pinned by admin-onboarding.test.ts. */
export function bucketsOf(rows: readonly SplitRow[]): GoalBucket[] {
  const out = new Map<GoalBucketKey, GoalBucket>(
    BUCKETS.map((key) => [key, { key, accounts: 0, levels: emptyLevels(), matured: 0, activated: 0, activeSoFar: 0 }]),
  );
  for (const r of rows) {
    const key: GoalBucketKey = !num(r.answered) ? "unasked" : isGoal(r.goal) ? r.goal : "skipped";
    const b = out.get(key)!;
    const n = num(r.accounts);
    b.accounts += n;
    b.matured += num(r.matured);
    b.activated += num(r.maturedActive);
    b.activeSoFar += num(r.active);
    if (isGoal(key)) b.levels[isLevel(r.level) ? r.level : "unset"] += n;
  }
  return BUCKETS.map((k) => out.get(k)!);
}

/** The details of the window's answers: which companies and languages people named. */
export function detailsSummary(rows: ReadonlyArray<{ goal: string | null; goalDetails: unknown }>) {
  const companies = new Map<string, { company: string; placements: number; product: number }>();
  const languages = new Map<GoalLanguage, number>();
  for (const r of rows) {
    if (!isGoal(r.goal)) continue;
    const d: GoalDetails = detailsFor(r.goal, r.goalDetails);
    for (const name of d.companies ?? []) {
      const c = companies.get(name) ?? { company: name, placements: 0, product: 0 };
      if (r.goal === "placements") c.placements++;
      else c.product++;
      companies.set(name, c);
    }
    if (d.language) languages.set(d.language, (languages.get(d.language) ?? 0) + 1);
  }
  return {
    companies: [...companies.values()].sort((a, b) => b.placements + b.product - (a.placements + a.product) || a.company.localeCompare(b.company)).slice(0, 12),
    languages: [...languages.entries()].map(([language, count]) => ({ language, count })).sort((a, b) => b.count - a.count),
  };
}

/**
 * The `onboarding` events (frontend pages/WelcomePage and the dashboard's
 * PlanPrompt: track("onboarding", { goal, level, prefilled, keptGuess,
 * skipped, edit, source })), summed. `source` is "welcome" (the page) or
 * "prompt" (an older account's "Not now" on the dashboard line). A change
 * made later (`edit`, /welcome opened from the profile or the plan) is
 * counted apart: it has no guess to keep and is not a first decision, so it
 * would only blur the skip and guess rates. Counts of events, not accounts.
 */
export function eventsSummary(rows: readonly EventRow[]) {
  let total = 0;
  let skipped = 0;
  let prefilled = 0;
  let keptGuess = 0;
  let changes = 0;
  const sources = new Map<string, { source: string; total: number; skipped: number }>();
  for (const r of rows) {
    const n = num(r.n);
    if (yes(r.edit)) {
      changes += n;
      continue;
    }
    total += n;
    const skip = yes(r.skipped);
    if (skip) skipped += n;
    // The guess only matters for an answer: a skip keeps nothing.
    else if (yes(r.prefilled)) {
      prefilled += n;
      if (yes(r.keptGuess)) keptGuess += n;
    }
    const key = r.source || "unknown";
    const s = sources.get(key) ?? { source: key, total: 0, skipped: 0 };
    s.total += n;
    if (skip) s.skipped += n;
    sources.set(key, s);
  }
  return { total, answered: total - skipped, skipped, prefilled, keptGuess, changes, sources: [...sources.values()].sort((a, b) => b.total - a.total) };
}

/**
 * "Did something real in the first week": any problem, bug hunt or SQL
 * submission, aptitude answer, placement or skill test started, study lesson
 * read, quizzed or completed, or mock interview opened, within seven days of
 * the account's creation. Each EXISTS is one index probe on a (userId, time)
 * index — or a userId-prefixed one — per account in the window; the whole
 * split is one statement. Page views, the community and pair rooms are left
 * out on purpose: browsing is not preparing.
 */
const WITHIN_WEEK = (column: string) =>
  Prisma.sql`${Prisma.raw(column)} >= u.createdAt AND ${Prisma.raw(column)} < u.createdAt + INTERVAL 7 DAY`;
const ACTIVE_IN_FIRST_WEEK = Prisma.sql`(
  EXISTS (SELECT 1 FROM Submission x WHERE x.userId = u.id AND ${WITHIN_WEEK("x.submittedAt")})
  OR EXISTS (SELECT 1 FROM BugSubmission x WHERE x.userId = u.id AND ${WITHIN_WEEK("x.submittedAt")})
  OR EXISTS (SELECT 1 FROM SqlSubmission x WHERE x.userId = u.id AND ${WITHIN_WEEK("x.submittedAt")})
  OR EXISTS (SELECT 1 FROM AptitudeAttempt x WHERE x.userId = u.id AND ${WITHIN_WEEK("x.createdAt")})
  OR EXISTS (SELECT 1 FROM MockAttempt x WHERE x.userId = u.id AND ${WITHIN_WEEK("x.startedAt")})
  OR EXISTS (SELECT 1 FROM SkillAttempt x WHERE x.userId = u.id AND ${WITHIN_WEEK("x.startedAt")})
  OR EXISTS (SELECT 1 FROM MockInterviewSession x WHERE x.userId = u.id AND ${WITHIN_WEEK("x.createdAt")})
  OR EXISTS (SELECT 1 FROM StudyLessonProgress x WHERE x.userId = u.id AND (
    (${WITHIN_WEEK("x.readAt")}) OR (${WITHIN_WEEK("x.quizAt")}) OR (${WITHIN_WEEK("x.completedAt")})
  ))
)`;

/** At most this many answered accounts' details are read for the companies/languages tally. */
const DETAIL_ROWS = 5000;

export async function onboardingReport(since: Date, now: Date = new Date()) {
  const weekAgo = new Date(now.getTime() - WEEK_MS);
  const [split, details, events] = await Promise.all([
    prisma.$queryRaw<SplitRow[]>`
      SELECT goal, level, answered, COUNT(*) AS accounts, SUM(matured) AS matured, SUM(active) AS active, SUM(matured AND active) AS maturedActive
      FROM (
        SELECT u.goal AS goal, u.level AS level, (u.onboardedAt IS NOT NULL) AS answered,
          (u.createdAt <= ${weekAgo}) AS matured,
          ${ACTIVE_IN_FIRST_WEEK} AS active
        FROM User u
        WHERE u.createdAt >= ${since}
      ) t
      GROUP BY goal, level, answered`,
    prisma.user.findMany({
      where: { createdAt: { gte: since }, goal: { in: ["placements", "product", "language"] } },
      select: { goal: true, goalDetails: true },
      take: DETAIL_ROWS,
    }),
    // Grouped on the raw props (index name, createdAt): a handful of rows however many answers.
    prisma.$queryRaw<EventRow[]>`
      SELECT
        JSON_UNQUOTE(JSON_EXTRACT(props, '$.goal')) AS goal,
        JSON_UNQUOTE(JSON_EXTRACT(props, '$.prefilled')) AS prefilled,
        JSON_UNQUOTE(JSON_EXTRACT(props, '$.keptGuess')) AS keptGuess,
        JSON_UNQUOTE(JSON_EXTRACT(props, '$.skipped')) AS skipped,
        JSON_UNQUOTE(JSON_EXTRACT(props, '$.edit')) AS edit,
        JSON_UNQUOTE(JSON_EXTRACT(props, '$.source')) AS source,
        COUNT(*) AS n
      FROM AppEvent
      WHERE name = 'onboarding' AND createdAt >= ${since}
      GROUP BY goal, prefilled, keptGuess, skipped, edit, source`,
  ]);
  const buckets = bucketsOf(split);
  return {
    since: since.toISOString(),
    signups: buckets.reduce((n, b) => n + b.accounts, 0),
    buckets,
    ...detailsSummary(details),
    events: eventsSummary(events),
  };
}

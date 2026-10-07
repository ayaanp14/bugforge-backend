/**
 * What a member is preparing for — the one question a new account is asked
 * (/welcome on the SPA) — and the rules that read the answer.
 *
 * Before this, sign-up ended on a dashboard and a nav bar of ~15 features
 * with nothing saying where to begin. The answer is four columns on `User`
 * (`goal`, `level`, `goalDetails`, `onboardedAt`) and everything that reads it
 * derives from them: the dashboard's "Your plan" (services/onboarding-plan.ts,
 * ticked from rows that already exist, never stored progress), the nav
 * group the SPA marks, the assistant's account block, the digest's line, the
 * admin breakdown. Pure and import-light so the SPA's copy
 * (frontend/src/lib/onboarding.ts) can mirror it line for line — keep the
 * two in step.
 */
import { COMPANY_RENAMED, isCompanyTag } from "./companies.js";

export const GOALS = ["placements", "product", "language", "practice"] as const;
export type Goal = (typeof GOALS)[number];

/** How comfortable with coding problems — where the plan and "Up next" start. */
export const LEVELS = ["new", "some", "comfortable"] as const;
export type Level = (typeof LEVELS)[number];

/**
 * The languages a "learning a language" answer can name: exactly the study
 * plan tracks, whose keys are also judge language ids (driver-codegen
 * ALL_LANGUAGES) and skill-test skills (`java-basic`) — one string reaches
 * all three.
 */
export const GOAL_LANGUAGES = ["java", "python", "cpp", "javascript"] as const;
export type GoalLanguage = (typeof GOAL_LANGUAGES)[number];

/** At most this many target companies; more is a list, not a target. */
export const MAX_GOAL_COMPANIES = 5;

export interface GoalDetails {
  /** COMPANY_TAGS names (renames applied), for placements and product goals. */
  companies?: string[];
  /** For the language goal. */
  language?: GoalLanguage;
}

/**
 * Accounts created from this instant on are sent to /welcome after their
 * first sign-in; older ones were never asked and get a dismissible line on
 * the dashboard instead — interrupting someone who has used the site for
 * months with a sign-up screen would be the wrong first impression of it.
 */
// Midnight IST on the day it was built (the audience's calendar, as the
// streaks and the scheduler use); an account made between this and the
// deploy is days old at most, so being sent to /welcome is still right.
export const ONBOARDING_LAUNCH = new Date("2026-10-05T18:30:00.000Z");

/**
 * What the SPA should do about the question: `welcome` — send to /welcome
 * (a new account, never answered); `prompt` — show the dashboard line (an
 * older account, never answered); null — answered or skipped, never ask.
 */
export type OnboardingAsk = "welcome" | "prompt" | null;

export interface OnboardingState {
  goal: Goal | null;
  level: Level | null;
  details: GoalDetails;
  /** ISO time it was answered or skipped; null = never asked. */
  answeredAt: string | null;
  ask: OnboardingAsk;
}

/** The User columns the state is read from — select these. */
export const ONBOARDING_SELECT = {
  goal: true,
  level: true,
  goalDetails: true,
  onboardedAt: true,
  createdAt: true,
} as const;

export const isGoal = (value: unknown): value is Goal => typeof value === "string" && (GOALS as readonly string[]).includes(value);
export const isLevel = (value: unknown): value is Level => typeof value === "string" && (LEVELS as readonly string[]).includes(value);
export const isGoalLanguage = (value: unknown): value is GoalLanguage =>
  typeof value === "string" && (GOAL_LANGUAGES as readonly string[]).includes(value);

/** A company name as the catalogue tags it, or null for one it does not know. */
export function normalizeCompany(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 40) return null;
  const renamed = COMPANY_RENAMED[trimmed] ?? trimmed;
  return isCompanyTag(renamed) ? renamed : null;
}

/**
 * The stored details, read defensively: the column is Json, so anything in
 * it is re-checked rather than trusted, and only the keys the goal uses are
 * kept (a goal changed from product to language drops the companies).
 */
export function detailsFor(goal: Goal | null, raw: unknown): GoalDetails {
  const obj = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  if (goal === "placements" || goal === "product") {
    const list = Array.isArray(obj["companies"]) ? obj["companies"] : [];
    const companies: string[] = [];
    for (const entry of list) {
      const name = normalizeCompany(entry);
      if (name && !companies.includes(name)) companies.push(name);
      if (companies.length === MAX_GOAL_COMPANIES) break;
    }
    return companies.length ? { companies } : {};
  }
  if (goal === "language") {
    return isGoalLanguage(obj["language"]) ? { language: obj["language"] } : {};
  }
  return {};
}

/**
 * The placement target an account has without saving one: the first company
 * it named for a placements or product goal. Readiness and today's mission
 * read it until a target is saved (services/readiness.ts already shows it
 * first), so the student who answered /welcome sees both from day one —
 * before 2026-10-07 they waited for a target only /readiness could save.
 */
export function implicitTargetCompany(goal: string | null, rawDetails: unknown): string | null {
  if (goal !== "placements" && goal !== "product") return null;
  return detailsFor(goal, rawDetails).companies?.[0] ?? null;
}

/** How far ahead a drive date may be: what PUT /api/me/readiness/target accepts too. */
export const MAX_DRIVE_DAYS = 2 * 366;

/**
 * An optional drive or interview date (YYYY-MM-DD) as a UTC midnight, or an
 * error. A day in the past is refused (a typo, or a drive already gone), and
 * so is one more than two years out.
 */
export function parseDriveDate(raw: unknown, now = Date.now()): { ok: true; value: Date | null } | { ok: false; error: string } {
  if (raw == null || raw === "") return { ok: true, value: null };
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { ok: false, error: "driveDate must be YYYY-MM-DD." };
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) return { ok: false, error: "driveDate is not a real day." };
  if (date.getTime() < now - 86_400_000) return { ok: false, error: "driveDate is in the past." };
  if (date.getTime() > now + MAX_DRIVE_DAYS * 86_400_000) return { ok: false, error: "driveDate is more than two years away." };
  return { ok: true, value: date };
}

export function onboardingStateOf(row: {
  goal: string | null;
  level: string | null;
  goalDetails: unknown;
  onboardedAt: Date | string | null;
  createdAt: Date | string;
}): OnboardingState {
  const goal = isGoal(row.goal) ? row.goal : null;
  const level = isLevel(row.level) ? row.level : null;
  const answeredAt = row.onboardedAt ? new Date(row.onboardedAt).toISOString() : null;
  const ask: OnboardingAsk = answeredAt ? null : new Date(row.createdAt) >= ONBOARDING_LAUNCH ? "welcome" : "prompt";
  return { goal, level, details: detailsFor(goal, row.goalDetails), answeredAt, ask };
}

export type OnboardingInput =
  | { skip: true }
  | {
      skip: false;
      goal: Goal;
      level: Level | null;
      details: GoalDetails;
      /** A drive date given with a company goal: the first company and this date become the saved placement target. */
      driveDate: Date | null;
    };

/**
 * The body of PUT /api/me/onboarding: `{ skip: true }`, or
 * `{ goal, level?, details? }`. Unknown companies are dropped rather than
 * refused (a tag renamed between the page loading and the save should not
 * fail the whole answer); an unknown goal, level or language is a 400.
 */
export function parseOnboarding(body: unknown): { ok: true; value: OnboardingInput } | { ok: false; error: string } {
  const obj = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  if (!obj) return { ok: false, error: "Expected a JSON object." };
  if (obj["skip"] === true) return { ok: true, value: { skip: true } };

  const goal = obj["goal"];
  if (!isGoal(goal)) return { ok: false, error: `goal must be one of: ${GOALS.join(", ")}.` };

  const rawLevel = obj["level"];
  if (rawLevel != null && !isLevel(rawLevel)) return { ok: false, error: `level must be one of: ${LEVELS.join(", ")}.` };

  const rawDetails = obj["details"];
  if (rawDetails != null && (typeof rawDetails !== "object" || Array.isArray(rawDetails))) {
    return { ok: false, error: "details must be an object." };
  }
  const detailsObj = (rawDetails ?? {}) as Record<string, unknown>;
  if (goal === "language" && detailsObj["language"] != null && !isGoalLanguage(detailsObj["language"])) {
    return { ok: false, error: `language must be one of: ${GOAL_LANGUAGES.join(", ")}.` };
  }
  if (detailsObj["companies"] != null && !Array.isArray(detailsObj["companies"])) {
    return { ok: false, error: "companies must be a list." };
  }

  const details = detailsFor(goal, detailsObj);
  const drive = parseDriveDate(obj["driveDate"]);
  if (!drive.ok) return drive;
  // A date means something only beside a company to aim it at.
  return { ok: true, value: { skip: false, goal, level: (rawLevel ?? null) as Level | null, details, driveDate: details.companies?.length ? drive.value : null } };
}

// ── Shapes the dashboard carries (built by services/onboarding-plan.ts) ──

export interface PlanStep {
  /** Stable within a goal ("aptitude", "mock", "roadmap-stage" …) — the SPA keys rows by it. */
  key: string;
  /** Imperative, short: "Try an aptitude section". */
  title: string;
  /** One line under it: what the step is or why it is here. */
  detail: string;
  /** Where the step is done (an app path). */
  href: string;
  /** Derived from rows that already exist — never stored. */
  done: boolean;
}

export interface DashboardPlan {
  goal: Goal;
  level: Level | null;
  details: GoalDetails;
  /** Three to five, in the order they are meant to be done. */
  steps: PlanStep[];
}

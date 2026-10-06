import { prisma } from "../lib/prisma.js";
import { cached } from "../lib/cache.js";
import { isCompanyTag } from "../lib/companies.js";
import { SKILLS } from "../lib/skill-catalog.js";
import { detailsFor, isGoal, isGoalLanguage, isLevel, type DashboardPlan, type GoalLanguage } from "../lib/onboarding.js";
import { EMPTY_PLAN_FACTS, buildPlan, companyListFor, mockTestFor, type PlanFacts, type RoadFacts } from "../lib/onboarding-plan.js";
import { SAT_ROUND } from "./entitlements.js";
// roadmap imports invalidateDashboard from dashboard, which imports this
// file: the cycle dashboard ↔ roadmap already exists and is inert for the
// same reason — everything here is called at request time, never at load.
import { roadDefinition, walk } from "./roadmap.js";
// dashboard imports this file for the plan: the same call-time-only cycle.
import { invalidateDashboard, type ProblemState } from "./dashboard.js";

/**
 * "Your plan" on the dashboard: the facts lib/onboarding-plan.ts ticks its
 * steps from, gathered for one account inside the dashboard build
 * (services/dashboard.ts buildDashboard).
 *
 * What the dashboard already loads is reused rather than asked again — the
 * solved set and the catalogue (problemState), today's problem (the
 * contest snapshot), the credentials, the study band and the user slice's
 * SQL count and weekly first solves — and is handed in as promises, so the
 * plan waits on loads that are already in flight instead of queueing its own.
 * The rest are existence checks (`findFirst … select id`) on per-user
 * indexes, and only the ones the member's goal reads: a placements plan
 * never asks about duels. An account with no goal costs nothing at all.
 *
 * Freshness: the dashboard is cached for five minutes and dropped by
 * invalidateDashboard on the writes below. Each step's source and who drops
 * the cache when it changes:
 *   - solves, the road, a company list, the weekly count — every judge (execution.ts, sql.ts)
 *   - today's problem — execution.ts and the contest route
 *   - a duel — lib/duels.ts settle
 *   - a credential — services/skill-credentials.ts issue/renew
 *   - a study enrolment or a completed lesson — services/study-plans.ts
 *   - an aptitude attempt — routes/aptitude.ts, the account's first in this process (notePlanActivity)
 *   - a finished placement or skill-test sitting — their finishAttempt (routes/mock-tests.ts, routes/skill-tests.ts)
 *   - a resume analysis finished — the analysis runner (services/resumes.ts)
 *   - an interview becoming sat — the first answer (routes/interviews.ts) or first connect (routes/interviews-voice.ts)
 * A sitting abandoned in progress ticks when its time runs out, which no
 * write marks: that one waits for the five-minute TTL.
 */

export interface PlanLoads {
  problemState: Promise<ProblemState>;
  dailyContest: Promise<{ problem: { title: string; difficulty: string } | null; streak: { solvedToday: boolean } }>;
  credentials: Promise<ReadonlyArray<{ skill: string; status: string }>>;
  study: Promise<{ track: string } | null>;
  me: Promise<{ stats: { sqlSolved: number } | null; trends: { solvedThisWeek: number; sqlSolvedThisWeek: number } } | null>;
}

/** The User columns the plan reads — part of the dashboard's own user select (services/me.ts). */
export interface PlanAnswer {
  goal: string | null;
  level: string | null;
  goalDetails: unknown;
}

/** The skills of the "CS fundamentals" group (SQL, OOP, OS, networks), from the skill catalogue. */
const FUNDAMENTAL_SKILLS = SKILLS.filter((s) => s.group === "fundamentals").map((s) => s.id);

/**
 * A sitting that is over: closed (submitted, expired or terminated — each
 * stamps `submittedAt`), or past its deadline and not yet closed by a read
 * (both test routes expire a paper lazily, on the next look at it).
 */
const sittingOver = (now: Date) => ({ OR: [{ submittedAt: { not: null } }, { expiresAt: { lte: now } }] });

/**
 * The published placement tests in catalogue order — thirty-odd rows, the
 * same for everyone, so they are held for the road's five minutes rather
 * than asked per dashboard.
 */
function placementTests() {
  return cached("onboarding:placement-tests", 5 * 60_000, () =>
    prisma.mockTest.findMany({
      where: { published: true },
      orderBy: { orderIndex: "asc" },
      select: { id: true, slug: true, company: true, name: true },
    }),
  );
}

/** A track's first module: its title and lesson keys. Content, the same for everyone, so cached like the tracks. */
function firstModule(track: GoalLanguage) {
  return cached(`onboarding:first-module:${track}`, 5 * 60_000, () =>
    prisma.studyModule.findFirst({
      where: { track: { key: track, isPublished: true } },
      orderBy: { position: "asc" },
      select: { title: true, lessons: { select: { key: true } } },
    }),
  );
}

/** The road's first stage and the one being worked on, from the solved set the dashboard already holds. */
async function roadFacts(solved: Set<string>): Promise<RoadFacts | null> {
  const road = await roadDefinition();
  if (road.stages.length === 0) return null;
  // The same pure rule the roadmap page applies (services/roadmap walk), so
  // the step can never call a stage cleared that the map shows open.
  const stages = walk(road, solved);
  const first = stages[0]!;
  return {
    first: { key: first.id, title: first.title, solved: first.solved, required: first.required, cleared: first.status === "cleared" },
    currentKey: stages.find((s) => s.status === "open")?.id ?? null,
  };
}

const exists = (row: Promise<{ id: string } | null>): Promise<boolean> => row.then((r) => r !== null);

/** The skills holding a credential that stands today — the status credentialsFor computed. */
const validSkills = (rows: ReadonlyArray<{ skill: string; status: string }>): string[] =>
  rows.filter((c) => c.status === "valid").map((c) => c.skill);

async function placementsFacts(userId: string, companies: readonly string[], loads: PlanLoads, now: Date): Promise<Partial<PlanFacts>> {
  const [aptitudeTried, mock, resumeChecked, state, credentials] = await Promise.all([
    exists(prisma.aptitudeAttempt.findFirst({ where: { userId }, select: { id: true } })),
    // The mock and its sitting are one chain: which test is the plan's
    // depends on the (cached) list, and the sitting is looked for on it.
    placementTests().then(async (tests) => {
      const test = mockTestFor(companies, tests);
      const sat = await exists(
        prisma.mockAttempt.findFirst({ where: { userId, ...(test ? { testId: test.id } : {}), ...sittingOver(now) }, select: { id: true } }),
      );
      return { test, sat };
    }),
    exists(prisma.resumeAnalysis.findFirst({ where: { userId, status: "done" }, select: { id: true } })),
    loads.problemState,
    loads.credentials,
  ]);
  return {
    aptitudeTried,
    mock: mock.test ? { slug: mock.test.slug, company: mock.test.company, name: mock.test.name } : null,
    mockSat: mock.sat,
    resumeChecked,
    road: await roadFacts(state.solved),
    validCredentialSkills: validSkills(credentials),
  };
}

async function productFacts(userId: string, companies: readonly string[], loads: PlanLoads): Promise<Partial<PlanFacts>> {
  const [fundamentalsSat, interviewSat, state, me] = await Promise.all([
    exists(
      prisma.skillAttempt.findFirst({
        where: { userId, test: { skill: { in: FUNDAMENTAL_SKILLS } }, ...sittingOver(new Date()) },
        select: { id: true },
      }),
    ),
    // "Sat" is the entitlements rule (a completed round, an answered
    // question, or a voice round whose audio began) — the one the quota and
    // the admin panel count, so a round opened and left is not a mock done.
    exists(prisma.mockInterviewSession.findFirst({ where: { userId, ...SAT_ROUND }, select: { id: true } })),
    loads.problemState,
    loads.me,
  ]);
  const { list, anySolved } = companyListFor(companies, state.catalogue, state.solved, isCompanyTag);
  return {
    fundamentalsSat,
    interviewSat,
    road: await roadFacts(state.solved),
    companyList: list,
    companySolved: anySolved,
    sqlSolved: me?.stats?.sqlSolved ?? 0,
  };
}

async function languageFacts(userId: string, language: GoalLanguage | undefined, loads: PlanLoads): Promise<Partial<PlanFacts>> {
  // No language named: the plan most recently walked stands in for one, so
  // a member who answered "a language" and then started Python is shown
  // Python's steps rather than "pick a track".
  const band = language ? null : await loads.study;
  const track = language ?? (band && isGoalLanguage(band.track) ? band.track : null);
  if (!track) return { validCredentialSkills: validSkills(await loads.credentials) };

  const module = await firstModule(track);
  const keys = module?.lessons.map((l) => l.key) ?? [];
  const [enrolled, done, credentials] = await Promise.all([
    exists(prisma.studyEnrollment.findUnique({ where: { userId_trackKey: { userId, trackKey: track } }, select: { id: true } })),
    // Complete = `completedAt` stamped, the same count the module-done
    // notification makes (services/study-plans settleLesson).
    keys.length ? prisma.studyLessonProgress.count({ where: { userId, lessonKey: { in: keys }, completedAt: { not: null } } }) : Promise.resolve(0),
    loads.credentials,
  ]);
  return {
    study: { track, enrolled, firstModule: module ? { title: module.title, done, lessons: keys.length } : null },
    validCredentialSkills: validSkills(credentials),
  };
}

async function practiceFacts(userId: string, withRoad: boolean, loads: PlanLoads): Promise<Partial<PlanFacts>> {
  const [duelPlayed, contest, me, state] = await Promise.all([
    exists(prisma.duelParticipant.findFirst({ where: { userId, duel: { status: "finished" } }, select: { id: true } })),
    loads.dailyContest,
    loads.me,
    withRoad ? loads.problemState : Promise.resolve(null),
  ]);
  return {
    duelPlayed,
    daily: { solvedToday: contest.streak.solvedToday, problem: contest.problem ? { title: contest.problem.title, difficulty: contest.problem.difficulty } : null },
    // The streak counts SQL first solves as solves (lib/activity), so the week does too.
    solvedThisWeek: (me?.trends.solvedThisWeek ?? 0) + (me?.trends.sqlSolvedThisWeek ?? 0),
    road: state ? await roadFacts(state.solved) : null,
  };
}

/**
 * The plan for the dashboard, or null when no goal is set (never answered,
 * or skipped). A failure here is logged and answers null: the plan is one
 * band of the home page, and an error in one of its existence checks must
 * not take the whole dashboard down with it.
 */
export async function onboardingPlanFor(userId: string, answer: Promise<PlanAnswer | null>, loads: PlanLoads): Promise<DashboardPlan | null> {
  try {
    const row = await answer;
    if (!row || !isGoal(row.goal)) return null;
    const goal = row.goal;
    const level = isLevel(row.level) ? row.level : null;
    const details = detailsFor(goal, row.goalDetails);
    const companies = details.companies ?? [];

    const facts =
      goal === "placements"
        ? await placementsFacts(userId, companies, loads, new Date())
        : goal === "product"
          ? await productFacts(userId, companies, loads)
          : goal === "language"
            ? await languageFacts(userId, details.language, loads)
            : await practiceFacts(userId, level === "new", loads);

    return buildPlan(goal, level, details, { ...EMPTY_PLAN_FACTS, ...facts });
  } catch (err) {
    console.error("dashboard plan failed:", (err as Error).message);
    return null;
  }
}

// ── Freshness for writes that are not otherwise rare ───────────────

/**
 * (kind, account) pairs this process has already dropped the dashboard for.
 *
 * An aptitude answer is written once per question, dozens in a sitting, and
 * the plan's step it can tick ("Try an aptitude section") flips on the
 * first one ever. Dropping the dashboard and /api/me on every answer would
 * be a dozen Redis commands a question for nothing after the first; once per
 * account per process is enough — a restart, or another instance, drops it
 * once more, which is harmless. Bounded: cleared when it grows past the cap,
 * which costs at most one extra drop per account.
 */
const noted = new Set<string>();
const NOTED_CAP = 50_000;

/** Call after a write that can tick a plan step only the first time it happens. */
export function notePlanActivity(userId: string, kind: "aptitude"): void {
  const key = `${kind}:${userId}`;
  if (noted.has(key)) return;
  if (noted.size >= NOTED_CAP) noted.clear();
  noted.add(key);
  invalidateDashboard(userId);
}

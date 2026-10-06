/**
 * "Your plan" — the dashboard's three-to-five-step checklist for what a
 * member said they are preparing for (lib/onboarding.ts) — as a pure
 * function of the answer and a handful of facts about the account.
 *
 * Every tick is derived, the way the roadmap derives a stage's standing from
 * `Submission` rows: the facts are read from rows the features already write
 * (an aptitude attempt, a finished placement sitting, a credential, a done
 * resume analysis, a sat interview …) by services/onboarding-plan.ts, and
 * nothing here is stored. A plan step can therefore never disagree with the
 * page it links to, needs no backfill for work done before the plan existed,
 * and costs no write on the paths that do the work.
 *
 * Kept free of Prisma so the rules — which steps, in which order, what ticks
 * them — are pinned by onboarding-plan.test.ts without a database.
 */
import { companyHub } from "./problem-topics.js";
import { GOAL_LANGUAGES, type DashboardPlan, type Goal, type GoalDetails, type GoalLanguage, type Level, type PlanStep } from "./onboarding.js";

/** The road's first stage, as services/roadmap `walk` sees it for this account. */
export interface RoadFacts {
  first: { key: string; title: string; solved: number; required: number; cleared: boolean };
  /** The first open, uncleared stage — where the map should open; null once the road is done. */
  currentKey: string | null;
}

export interface PlanFacts {
  /** Null on a database whose road is not seeded: the step is left out rather than shown undoable. */
  road: RoadFacts | null;
  /** Any AptitudeAttempt. */
  aptitudeTried: boolean;
  /** The placement test the plan points at: the first chosen company that has one (mockTestFor). */
  mock: { slug: string; company: string; name: string } | null;
  /** A finished sitting of `mock` — or of any placement test when `mock` is null. */
  mockSat: boolean;
  /** Skills holding a credential that stands today (not expired, not revoked). */
  validCredentialSkills: readonly string[];
  /** A resume analysis that ran to the end. */
  resumeChecked: boolean;
  /** The study list the plan points at: the first chosen company with a hub (companyListFor). */
  companyList: { company: string; slug: string; solved: number } | null;
  /** Solved problems carrying any company tag — the step's tick when no company was chosen. */
  companySolved: number;
  /** SQL problems solved (SqlSolve, as `me.stats.sqlSolved` counts them). */
  sqlSolved: number;
  /** A finished sitting of a CS-fundamentals skill test (SQL, OOP, OS, networks). */
  fundamentalsSat: boolean;
  /** A mock interview that was actually sat (services/entitlements SAT_ROUND). */
  interviewSat: boolean;
  study: {
    /** The language track the plan is about: the answer's, else the plan most recently walked. */
    track: GoalLanguage | null;
    enrolled: boolean;
    /** The track's first module and how many of its lessons are complete; null before it is known. */
    firstModule: { title: string; done: number; lessons: number } | null;
  };
  /** Today's daily problem (services/daily-contest contestSnapshot). */
  daily: { solvedToday: boolean; problem: { title: string; difficulty: string } | null };
  /** A duel this account played to the end. */
  duelPlayed: boolean;
  /** First solves in the last seven days, coding and SQL (services/me getUserTrends). */
  solvedThisWeek: number;
}

/** What a fact nobody loaded reads as: not done. The service fills only the facts its goal's steps read. */
export const EMPTY_PLAN_FACTS: PlanFacts = {
  road: null,
  aptitudeTried: false,
  mock: null,
  mockSat: false,
  validCredentialSkills: [],
  resumeChecked: false,
  companyList: null,
  companySolved: 0,
  sqlSolved: 0,
  fundamentalsSat: false,
  interviewSat: false,
  study: { track: null, enrolled: false, firstModule: null },
  daily: { solvedToday: false, problem: null },
  duelPlayed: false,
  solvedThisWeek: 0,
};

/** Problems solved from a company's list before its step ticks: enough to have started it, not to have finished it. */
export const COMPANY_LIST_TARGET = 3;

/** The practice goal's weekly target — lower for someone new to coding problems. */
export const weeklyTarget = (level: Level | null): number => (level === "new" ? 3 : 5);

const LANGUAGE_LABEL: Record<GoalLanguage, string> = { java: "Java", python: "Python", cpp: "C++", javascript: "JavaScript" };

const titleCase = (difficulty: string) => difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();

// ── Picking what a step points at ─────────────────────────────────

/**
 * Placement tests name some companies differently from the catalogue's
 * COMPANY_TAGS, which is what an answer stores: the tag is "HCL", the
 * paper is "HCLTech". Only real differences go here; case and spacing are
 * ignored by the comparison below.
 */
const MOCK_TEST_COMPANY: Readonly<Record<string, string>> = { HCL: "HCLTech" };

const companyKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * The placement test for the first chosen company that has one, from tests
 * listed in their catalogue order (MockTest.orderIndex) — so a company with
 * several papers (TCS: Foundation, Full, Advanced Coding) is pointed at the
 * first, which is the one a candidate meets first.
 */
export function mockTestFor<T extends { company: string }>(companies: readonly string[], tests: readonly T[]): T | null {
  for (const company of companies) {
    const want = companyKey(MOCK_TEST_COMPANY[company] ?? company);
    const hit = tests.find((t) => companyKey(t.company) === want);
    if (hit) return hit;
  }
  return null;
}

/**
 * The study list for the first chosen company whose hub has problems, with
 * how many of them are solved; and the solved problems carrying any company
 * tag, which ticks the step when no company was chosen. One walk over the
 * catalogue already in memory (services/dashboard getCatalogue).
 */
export function companyListFor(
  companies: readonly string[],
  catalogue: ReadonlyArray<{ id: string; tags: unknown }>,
  solved: ReadonlySet<string>,
  isCompany: (tag: string) => boolean,
): { list: PlanFacts["companyList"]; anySolved: number } {
  const wanted = companies.filter((c) => companyHub(c));
  const total = new Map<string, number>();
  const done = new Map<string, number>();
  let anySolved = 0;
  for (const p of catalogue) {
    const tags = Array.isArray(p.tags) ? (p.tags as unknown[]) : [];
    const isSolved = solved.has(p.id);
    if (isSolved && tags.some((t) => typeof t === "string" && isCompany(t))) anySolved++;
    for (const company of wanted) {
      if (!tags.includes(company)) continue;
      total.set(company, (total.get(company) ?? 0) + 1);
      if (isSolved) done.set(company, (done.get(company) ?? 0) + 1);
    }
  }
  const company = wanted.find((c) => (total.get(c) ?? 0) > 0);
  const hub = company ? companyHub(company) : undefined;
  return {
    list: company && hub ? { company, slug: hub.slug, solved: done.get(company) ?? 0 } : null,
    anySolved,
  };
}

// ── The steps ─────────────────────────────────────────────────────

function roadmapStep(road: RoadFacts, level: Level | null, title: string): PlanStep {
  const { first, currentKey } = road;
  const progress = `${first.title}: ${Math.min(first.solved, first.required)} of ${first.required} solved`;
  return {
    key: "roadmap",
    title,
    detail: level === "new" ? `${progress} — Easy problems, one idea at a time.` : `${progress}.`,
    // The map opens on the stage being worked on; once the road is done, on the road.
    href: currentKey ? `/roadmap?stage=${encodeURIComponent(currentKey)}` : "/roadmap",
    done: first.cleared,
  };
}

function placementsSteps(details: GoalDetails, level: Level | null, f: PlanFacts): PlanStep[] {
  const chose = (details.companies ?? []).length > 0;
  const steps: PlanStep[] = [
    {
      key: "aptitude",
      title: "Try an aptitude section",
      detail: "Quant, logical and verbal — the first round of most campus tests.",
      href: "/aptitude",
      done: f.aptitudeTried,
    },
    f.mock
      ? {
          key: "mock",
          title: `Sit the ${f.mock.company} mock`,
          detail: `${f.mock.name}, timed and sectioned like the real paper.`,
          href: `/tests/${f.mock.slug}`,
          done: f.mockSat,
        }
      : {
          key: "mock",
          title: "Sit a placement mock test",
          detail: chose
            ? "Your companies have no paper here yet — any full paper shows where you stand."
            : "A full paper, timed like the real one — see where you stand.",
          href: "/tests",
          done: f.mockSat,
        },
  ];
  if (f.road) steps.push(roadmapStep(f.road, level, "Clear the first roadmap stage"));
  steps.push(
    {
      key: "skill-test",
      title: "Pass a Basic skill test",
      detail: "A credential for your resume — a language, DSA or CS fundamentals.",
      href: "/skill-tests?level=basic",
      done: f.validCredentialSkills.length > 0,
    },
    {
      key: "resume",
      title: "Check your resume",
      detail: "An ATS score with fixes, against the role you are applying for.",
      href: "/resume",
      done: f.resumeChecked,
    },
  );
  return steps;
}

function productSteps(level: Level | null, f: PlanFacts): PlanStep[] {
  const steps: PlanStep[] = [];
  if (f.road) steps.push(roadmapStep(f.road, level, "Clear your first roadmap stage"));
  const easy = level === "new" ? " — start with its Easy problems" : "";
  steps.push(
    f.companyList
      ? {
          key: "company",
          title: `Start the ${f.companyList.company} study list`,
          detail: `${Math.min(f.companyList.solved, COMPANY_LIST_TARGET)} of ${COMPANY_LIST_TARGET} solved${easy}.`,
          href: `/challenges/company/${f.companyList.slug}`,
          done: f.companyList.solved >= COMPANY_LIST_TARGET,
        }
      : {
          key: "company",
          title: "Start a company study list",
          detail: "Every company page has a study plan — pick the one you are aiming for.",
          href: "/challenges",
          done: f.companySolved >= COMPANY_LIST_TARGET,
        },
    {
      key: "sql",
      title: "Solve a SQL problem",
      detail: "Database rounds ask for queries — write MySQL, judged on hidden data.",
      href: "/sql",
      done: f.sqlSolved > 0,
    },
    {
      key: "fundamentals",
      title: "Sit a CS fundamentals test",
      detail: "SQL, OOP, operating systems or networks — the interview's theory round.",
      href: "/skill-tests?group=fundamentals",
      done: f.fundamentalsSat,
    },
    {
      key: "interview",
      title: "Do a mock interview",
      detail: "An AI interviewer, written or by voice, with a report at the end.",
      href: "/mock-interview",
      done: f.interviewSat,
    },
  );
  return steps;
}

function languageSteps(details: GoalDetails, f: PlanFacts): PlanStep[] {
  const track = details.language ?? f.study.track;
  if (!track) {
    // No language named and no plan started: the steps still lead somewhere,
    // and the credential step ticks for any language's.
    return [
      {
        key: "track",
        title: "Pick a language track",
        detail: "Java, Python, C++ or JavaScript, start to finish.",
        href: "/study-plans",
        done: false,
      },
      {
        key: "module",
        title: "Finish your first module",
        detail: "Every lesson and the checkpoint at its end.",
        href: "/study-plans",
        done: false,
      },
      {
        key: "skill-test",
        title: "Pass a Basic language test",
        detail: "A credential that says you can read and write the language.",
        href: "/skill-tests?group=language&level=basic",
        done: f.validCredentialSkills.some((s) => (GOAL_LANGUAGES as readonly string[]).includes(s)),
      },
    ];
  }
  const label = LANGUAGE_LABEL[track];
  const module = f.study.firstModule;
  return [
    {
      key: "track",
      title: `Start the ${label} track`,
      detail: "Lessons, exercises and a checkpoint per module, at a pace you set.",
      href: `/study-plans/${track}`,
      done: f.study.enrolled,
    },
    {
      key: "module",
      title: "Finish the first module",
      detail: module ? `${module.title}: ${Math.min(module.done, module.lessons)} of ${module.lessons} lessons done.` : "Every lesson and the checkpoint at its end.",
      href: `/study-plans/${track}`,
      done: module !== null && module.lessons > 0 && module.done >= module.lessons,
    },
    {
      key: "skill-test",
      title: `Pass the ${label} Basic skill test`,
      detail: "A credential that says you can read and write it.",
      href: `/skill-tests/${track}-basic`,
      // Any level: an Intermediate credential says Basic too.
      done: f.validCredentialSkills.includes(track),
    },
  ];
}

function practiceSteps(level: Level | null, f: PlanFacts): PlanStep[] {
  const target = weeklyTarget(level);
  const steps: PlanStep[] = [];
  // Someone new to coding problems gets the road's first stage ahead of the
  // daily problem, which is as likely to be a Hard as an Easy.
  if (level === "new" && f.road) steps.push(roadmapStep(f.road, level, "Clear the first roadmap stage"));
  steps.push(
    {
      key: "daily",
      title: "Solve today's problem",
      detail: f.daily.problem ? `${f.daily.problem.title} · ${titleCase(f.daily.problem.difficulty)}.` : "One problem a day, the same for everyone.",
      href: "/contests",
      done: f.daily.solvedToday,
    },
    {
      key: "duel",
      title: "Play a duel",
      detail: "A live 1v1 on the same problem — first to pass every test wins.",
      href: "/duels",
      done: f.duelPlayed,
    },
    {
      key: "weekly",
      title: `Solve ${target} problems this week`,
      detail: `${Math.min(f.solvedThisWeek, target)} of ${target} in the last seven days.`,
      href: level === "new" ? "/challenges?difficulty=easy" : "/challenges",
      done: f.solvedThisWeek >= target,
    },
  );
  return steps;
}

/**
 * The level's say in the order, kept to two moves: someone new starts on the
 * road (the Easy problems, one idea at a time); someone fine with Mediums
 * starts with the goal's full mock — a placement paper or an interview — to
 * find what is missing before practising it. Everyone else gets the goal's
 * own order.
 */
const FRONT_FOR_LEVEL: Record<Level, Partial<Record<Goal, string>>> = {
  new: { placements: "roadmap", product: "roadmap", practice: "roadmap" },
  some: {},
  comfortable: { placements: "mock", product: "interview" },
};

function toFront(steps: PlanStep[], key: string | undefined): PlanStep[] {
  const at = key ? steps.findIndex((s) => s.key === key) : -1;
  if (at <= 0) return steps;
  return [steps[at]!, ...steps.slice(0, at), ...steps.slice(at + 1)];
}

export function buildPlan(goal: Goal, level: Level | null, details: GoalDetails, facts: PlanFacts): DashboardPlan {
  const steps =
    goal === "placements"
      ? placementsSteps(details, level, facts)
      : goal === "product"
        ? productSteps(level, facts)
        : goal === "language"
          ? languageSteps(details, facts)
          : practiceSteps(level, facts);
  return { goal, level, details, steps: level ? toFront(steps, FRONT_FOR_LEVEL[level][goal]) : steps };
}

// ── "Up next" on the dashboard ────────────────────────────────────

export type Difficulty = "easy" | "medium" | "hard";

/**
 * The difficulty of each untouched pick "Up next" offers (after anything
 * already attempted), by level. Two of the level's step for one of the
 * neighbouring one, so "solved a few" sees Mediums beside an Easy rather
 * than Easies until the ~500 of them run out, and "fine with Mediums" meets
 * a Hard. No level keeps the catalogue's own order (newest first).
 */
export const UP_NEXT_SLOTS: Record<Level, readonly Difficulty[]> = {
  new: ["easy", "easy", "easy"],
  some: ["easy", "medium", "medium"],
  comfortable: ["medium", "medium", "hard"],
};

/** How many problems "Up next" offers. */
export const UP_NEXT_SIZE = 3;

/**
 * "Up next" in full: what was already tried comes first, in the catalogue's
 * order as it always did, and the level picks fill what is left
 * (services/dashboard computeProblemInsights hands in the lists from its one
 * pass over the catalogue).
 */
export function upNext<T extends { id: string }>(
  level: Level | null,
  tried: readonly T[],
  byDifficulty: Readonly<Record<Difficulty, readonly T[]>>,
  any: readonly T[],
): T[] {
  const first = tried.slice(0, UP_NEXT_SIZE);
  return [...first, ...upNextPicks(level, UP_NEXT_SIZE - first.length, byDifficulty, any)];
}

/**
 * The untouched problems to offer, given each difficulty's first few in
 * catalogue order (`byDifficulty`) and the first few of any (`any`). A slot
 * whose difficulty has run out takes the next untouched problem of any.
 */
export function upNextPicks<T extends { id: string }>(
  level: Level | null,
  slots: number,
  byDifficulty: Readonly<Record<Difficulty, readonly T[]>>,
  any: readonly T[],
): T[] {
  if (slots <= 0) return [];
  if (!level) return any.slice(0, slots);
  const picked: T[] = [];
  const taken = new Set<string>();
  const cursor: Record<Difficulty, number> = { easy: 0, medium: 0, hard: 0 };
  for (const difficulty of UP_NEXT_SLOTS[level].slice(0, slots)) {
    const pool = byDifficulty[difficulty];
    while (cursor[difficulty] < pool.length && taken.has(pool[cursor[difficulty]]!.id)) cursor[difficulty]++;
    const hit = pool[cursor[difficulty]] ?? any.find((p) => !taken.has(p.id));
    if (!hit) break;
    cursor[difficulty]++;
    picked.push(hit);
    taken.add(hit.id);
  }
  return picked;
}

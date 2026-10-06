import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isCompanyTag } from "./companies.js";
import {
  COMPANY_LIST_TARGET,
  EMPTY_PLAN_FACTS,
  UP_NEXT_SLOTS,
  buildPlan,
  companyListFor,
  mockTestFor,
  upNext,
  upNextPicks,
  weeklyTarget,
  type PlanFacts,
  type RoadFacts,
} from "./onboarding-plan.js";

/**
 * "Your plan": which steps each goal gets, in which order for a level, and
 * which facts tick them. The facts are what services/onboarding-plan.ts reads
 * from existing rows; here they are written by hand, so every rule is pinned
 * without a database.
 *
 * Run with: npm test
 */

const facts = (over: Partial<PlanFacts> = {}): PlanFacts => ({ ...EMPTY_PLAN_FACTS, ...over });

const road = (over: Partial<RoadFacts["first"]> = {}, currentKey: string | null = "arrays"): RoadFacts => ({
  first: { key: "arrays", title: "Arrays", solved: 1, required: 3, cleared: false, ...over },
  currentKey,
});

const keys = (plan: { steps: Array<{ key: string }> }) => plan.steps.map((s) => s.key);
const step = (plan: { steps: Array<{ key: string; done: boolean; href: string; title: string; detail: string }> }, key: string) => {
  const found = plan.steps.find((s) => s.key === key);
  assert.ok(found, `no step ${key}`);
  return found;
};

describe("buildPlan — every goal", () => {
  it("has three to five steps with unique keys and app hrefs, for every goal and level", () => {
    for (const goal of ["placements", "product", "language", "practice"] as const) {
      for (const level of [null, "new", "some", "comfortable"] as const) {
        for (const f of [facts(), facts({ road: road() })]) {
          const plan = buildPlan(goal, level, {}, f);
          assert.ok(plan.steps.length >= 3 && plan.steps.length <= 5, `${goal}/${level}: ${plan.steps.length} steps`);
          assert.equal(new Set(keys(plan)).size, plan.steps.length, `${goal}/${level}: duplicate keys`);
          for (const s of plan.steps) assert.match(s.href, /^\/[a-z]/, `${goal}/${level}/${s.key}: ${s.href}`);
          assert.equal(plan.goal, goal);
          assert.equal(plan.level, level);
        }
      }
    }
  });

  it("ticks nothing for an account that has done nothing", () => {
    for (const goal of ["placements", "product", "language", "practice"] as const) {
      const plan = buildPlan(goal, null, {}, facts({ road: road() }));
      assert.deepEqual(plan.steps.filter((s) => s.done).map((s) => s.key), [], goal);
    }
  });

  it("leaves the roadmap step out on a road that is not seeded", () => {
    assert.ok(!keys(buildPlan("placements", null, {}, facts())).includes("roadmap"));
    assert.ok(keys(buildPlan("placements", null, {}, facts({ road: road() }))).includes("roadmap"));
  });
});

describe("buildPlan — placements", () => {
  const details = { companies: ["Mphasis", "HCL"] };

  it("runs aptitude → mock → road → skill test → resume", () => {
    assert.deepEqual(keys(buildPlan("placements", null, details, facts({ road: road() }))), ["aptitude", "mock", "roadmap", "skill-test", "resume"]);
  });

  it("points the mock at the chosen company's paper", () => {
    const plan = buildPlan("placements", null, details, facts({ mock: { slug: "hcltech-aptitude-technical", company: "HCLTech", name: "HCLTech Aptitude + Technical" } }));
    const mock = step(plan, "mock");
    assert.equal(mock.title, "Sit the HCLTech mock");
    assert.equal(mock.href, "/tests/hcltech-aptitude-technical");
  });

  it("falls back to any paper when no chosen company has one", () => {
    const mock = step(buildPlan("placements", null, details, facts()), "mock");
    assert.equal(mock.href, "/tests");
    assert.match(mock.detail, /no paper here yet/);
    assert.doesNotMatch(step(buildPlan("placements", null, {}, facts()), "mock").detail, /no paper here yet/);
  });

  it("ticks each step from its own fact", () => {
    const plan = buildPlan(
      "placements",
      null,
      details,
      facts({ aptitudeTried: true, mockSat: true, road: road({ cleared: true, solved: 3 }, "hashing"), validCredentialSkills: ["java"], resumeChecked: true }),
    );
    assert.ok(plan.steps.every((s) => s.done));
    // A cleared first stage sends the map to the stage being worked on now.
    assert.equal(step(plan, "roadmap").href, "/roadmap?stage=hashing");
  });

  it("puts the road first for someone new, the mock first for someone comfortable", () => {
    assert.deepEqual(keys(buildPlan("placements", "new", details, facts({ road: road() }))), ["roadmap", "aptitude", "mock", "skill-test", "resume"]);
    assert.deepEqual(keys(buildPlan("placements", "some", details, facts({ road: road() }))), ["aptitude", "mock", "roadmap", "skill-test", "resume"]);
    assert.deepEqual(keys(buildPlan("placements", "comfortable", details, facts({ road: road() }))), ["mock", "aptitude", "roadmap", "skill-test", "resume"]);
  });

  it("speaks of Easy problems to someone new", () => {
    assert.match(step(buildPlan("placements", "new", details, facts({ road: road() })), "roadmap").detail, /Easy/);
    assert.doesNotMatch(step(buildPlan("placements", "some", details, facts({ road: road() })), "roadmap").detail, /Easy/);
  });
});

describe("buildPlan — product", () => {
  const amazon = { company: "Amazon", slug: "amazon", solved: 2 };

  it("runs road → company list → SQL → fundamentals → interview", () => {
    assert.deepEqual(keys(buildPlan("product", null, { companies: ["Amazon"] }, facts({ road: road(), companyList: amazon }))), ["roadmap", "company", "sql", "fundamentals", "interview"]);
  });

  it("ticks the company list at three solved from it", () => {
    const below = step(buildPlan("product", null, {}, facts({ companyList: amazon })), "company");
    assert.equal(below.done, false);
    assert.equal(below.href, "/challenges/company/amazon");
    assert.equal(below.title, "Start the Amazon study list");
    assert.match(below.detail, /^2 of 3 solved/);
    const at = step(buildPlan("product", null, {}, facts({ companyList: { ...amazon, solved: COMPANY_LIST_TARGET + 4 } })), "company");
    assert.equal(at.done, true);
    assert.match(at.detail, /^3 of 3 solved/);
  });

  it("falls back to the catalogue's company lists when none was chosen", () => {
    const none = step(buildPlan("product", null, {}, facts({ companySolved: 2 })), "company");
    assert.equal(none.href, "/challenges");
    assert.equal(none.done, false);
    assert.equal(step(buildPlan("product", null, {}, facts({ companySolved: 3 })), "company").done, true);
  });

  it("ticks SQL, fundamentals and the interview from their facts", () => {
    const plan = buildPlan("product", null, {}, facts({ sqlSolved: 1, fundamentalsSat: true, interviewSat: true }));
    assert.deepEqual(plan.steps.filter((s) => s.done).map((s) => s.key), ["sql", "fundamentals", "interview"]);
    assert.equal(step(plan, "fundamentals").href, "/skill-tests?group=fundamentals");
  });

  it("moves the interview to the front for someone comfortable", () => {
    assert.deepEqual(keys(buildPlan("product", "comfortable", {}, facts({ road: road() }))), ["interview", "roadmap", "company", "sql", "fundamentals"]);
    assert.deepEqual(keys(buildPlan("product", "new", {}, facts({ road: road() }))), ["roadmap", "company", "sql", "fundamentals", "interview"]);
  });
});

describe("buildPlan — language", () => {
  const study = (over: Partial<PlanFacts["study"]> = {}): PlanFacts["study"] => ({ track: null, enrolled: false, firstModule: null, ...over });

  it("walks the named language's track, first module and Basic test", () => {
    const plan = buildPlan("language", null, { language: "java" }, facts({ study: study({ track: "java", firstModule: { title: "Basics", done: 2, lessons: 6 } }) }));
    assert.deepEqual(keys(plan), ["track", "module", "skill-test"]);
    assert.equal(step(plan, "track").title, "Start the Java track");
    assert.equal(step(plan, "track").href, "/study-plans/java");
    assert.equal(step(plan, "module").detail, "Basics: 2 of 6 lessons done.");
    assert.equal(step(plan, "skill-test").href, "/skill-tests/java-basic");
  });

  it("ticks enrolment, a finished module and a credential in that language only", () => {
    const done = buildPlan(
      "language",
      null,
      { language: "cpp" },
      facts({ study: study({ track: "cpp", enrolled: true, firstModule: { title: "Basics", done: 6, lessons: 6 } }), validCredentialSkills: ["cpp"] }),
    );
    assert.ok(done.steps.every((s) => s.done));
    const otherLanguage = buildPlan("language", null, { language: "cpp" }, facts({ validCredentialSkills: ["java"] }));
    assert.equal(step(otherLanguage, "skill-test").done, false);
    // A module with no lessons is not "finished".
    assert.equal(step(buildPlan("language", null, { language: "cpp" }, facts({ study: study({ firstModule: { title: "x", done: 0, lessons: 0 } }) })), "module").done, false);
  });

  it("follows the plan being walked when no language was named", () => {
    const plan = buildPlan("language", null, {}, facts({ study: study({ track: "python", enrolled: true }) }));
    assert.equal(step(plan, "track").title, "Start the Python track");
    assert.equal(step(plan, "track").done, true);
  });

  it("points at the study plans index with no language and no plan", () => {
    const plan = buildPlan("language", null, {}, facts({ validCredentialSkills: ["sql"] }));
    assert.equal(step(plan, "track").href, "/study-plans");
    assert.equal(step(plan, "skill-test").done, false, "a SQL credential is not a language's");
    assert.equal(step(buildPlan("language", null, {}, facts({ validCredentialSkills: ["python"] })), "skill-test").done, true);
  });
});

describe("buildPlan — practice", () => {
  it("runs today's problem → a duel → the week", () => {
    const plan = buildPlan("practice", "some", {}, facts({ road: road(), daily: { solvedToday: false, problem: { title: "Two Sum", difficulty: "EASY" } } }));
    assert.deepEqual(keys(plan), ["daily", "duel", "weekly"]);
    assert.equal(step(plan, "daily").detail, "Two Sum · Easy.");
    assert.equal(step(plan, "weekly").title, "Solve 5 problems this week");
  });

  it("adds the road first, and a smaller week, for someone new", () => {
    const plan = buildPlan("practice", "new", {}, facts({ road: road(), solvedThisWeek: 3 }));
    assert.deepEqual(keys(plan), ["roadmap", "daily", "duel", "weekly"]);
    assert.equal(weeklyTarget("new"), 3);
    assert.equal(step(plan, "weekly").done, true);
    assert.equal(step(plan, "weekly").href, "/challenges?difficulty=easy");
  });

  it("ticks the week at the target and not before", () => {
    assert.equal(step(buildPlan("practice", null, {}, facts({ solvedThisWeek: 4 })), "weekly").done, false);
    assert.equal(step(buildPlan("practice", null, {}, facts({ solvedThisWeek: 5 })), "weekly").done, true);
    assert.match(step(buildPlan("practice", null, {}, facts({ solvedThisWeek: 9 })), "weekly").detail, /^5 of 5/);
  });

  it("ticks today's problem and a duel from their facts", () => {
    const plan = buildPlan("practice", null, {}, facts({ daily: { solvedToday: true, problem: null }, duelPlayed: true }));
    assert.deepEqual(plan.steps.filter((s) => s.done).map((s) => s.key), ["daily", "duel"]);
  });
});

describe("mockTestFor", () => {
  const tests = [
    { slug: "tcs-nqt-foundation", company: "TCS" },
    { slug: "tcs-nqt-full", company: "TCS" },
    { slug: "hcltech-aptitude-technical", company: "HCLTech" },
    { slug: "tech-mahindra-written", company: "Tech Mahindra" },
  ];

  it("reads the catalogue's HCL as the paper's HCLTech", () => {
    assert.equal(mockTestFor(["HCL"], tests)?.slug, "hcltech-aptitude-technical");
  });

  it("takes the first chosen company that has a paper, and that company's first paper", () => {
    assert.equal(mockTestFor(["Mphasis", "TCS", "HCL"], tests)?.slug, "tcs-nqt-foundation");
    assert.equal(mockTestFor(["tech mahindra"], tests)?.slug, "tech-mahindra-written");
  });

  it("answers null when none has one", () => {
    assert.equal(mockTestFor(["Mphasis", "Virtusa"], tests), null);
    assert.equal(mockTestFor([], tests), null);
  });
});

describe("companyListFor", () => {
  const catalogue = [
    { id: "p1", tags: ["Array", "Amazon"] },
    { id: "p2", tags: ["Amazon", "Google"] },
    { id: "p3", tags: ["Google"] },
    { id: "p4", tags: ["Array"] },
    { id: "p5", tags: "not a list" },
  ];

  it("takes the first chosen company with problems, and counts what is solved from it", () => {
    const { list, anySolved } = companyListFor(["Zomato", "Amazon"], catalogue, new Set(["p1", "p2", "p3", "p4"]), isCompanyTag);
    assert.deepEqual(list, { company: "Amazon", slug: "amazon", solved: 2 });
    assert.equal(anySolved, 3, "p4 carries no company");
  });

  it("answers no list when no company was chosen or none has problems", () => {
    assert.equal(companyListFor([], catalogue, new Set(), isCompanyTag).list, null);
    assert.equal(companyListFor(["Zomato"], catalogue, new Set(), isCompanyTag).list, null);
  });

  it("slugs a company the way its hub does", () => {
    const { list } = companyListFor(["Goldman Sachs"], [{ id: "g", tags: ["Goldman Sachs"] }], new Set(), isCompanyTag);
    assert.equal(list?.slug, "goldman-sachs");
  });
});

describe("upNextPicks", () => {
  const p = (id: string) => ({ id });
  const byDifficulty = { easy: [p("e1"), p("e2"), p("e3")], medium: [p("m1"), p("m2"), p("m3")], hard: [p("h1"), p("h2"), p("h3")] };
  const any = [p("h1"), p("m1"), p("e1")];
  const ids = (rows: Array<{ id: string }>) => rows.map((r) => r.id);

  it("keeps the catalogue's order with no level", () => {
    assert.deepEqual(ids(upNextPicks(null, 3, byDifficulty, any)), ["h1", "m1", "e1"]);
    assert.deepEqual(ids(upNextPicks(null, 1, byDifficulty, any)), ["h1"]);
  });

  it("offers Easy to someone new, Easy then Medium to some, Medium then Hard to the comfortable", () => {
    assert.deepEqual(ids(upNextPicks("new", 3, byDifficulty, any)), ["e1", "e2", "e3"]);
    assert.deepEqual(ids(upNextPicks("some", 3, byDifficulty, any)), ["e1", "m1", "m2"]);
    assert.deepEqual(ids(upNextPicks("comfortable", 3, byDifficulty, any)), ["m1", "m2", "h1"]);
    assert.deepEqual([...UP_NEXT_SLOTS.comfortable], ["medium", "medium", "hard"]);
  });

  it("fills only the slots attempted problems left", () => {
    assert.deepEqual(ids(upNextPicks("some", 1, byDifficulty, any)), ["e1"]);
    assert.deepEqual(upNextPicks("some", 0, byDifficulty, any), []);
  });

  it("takes any untouched problem once a difficulty runs out, never the same one twice", () => {
    const thin = { easy: [p("e1")], medium: [], hard: [] };
    assert.deepEqual(ids(upNextPicks("new", 3, thin, [p("m9"), p("e1"), p("h9")])), ["e1", "m9", "h9"]);
    assert.deepEqual(ids(upNextPicks("comfortable", 3, thin, [p("e1")])), ["e1"]);
  });
});

describe("upNext — the dashboard's Up next", () => {
  // Newest first, as the catalogue is ordered: two Hards lead, which is what
  // a brand-new account was offered before levels.
  const catalogue = [
    { id: "h1", difficulty: "HARD" },
    { id: "h2", difficulty: "HARD" },
    { id: "m1", difficulty: "MEDIUM" },
    { id: "e1", difficulty: "EASY" },
    { id: "m2", difficulty: "MEDIUM" },
    { id: "e2", difficulty: "EASY" },
    { id: "e3", difficulty: "EASY" },
    { id: "h3", difficulty: "HARD" },
    { id: "m3", difficulty: "MEDIUM" },
  ];

  /** The lists computeProblemInsights builds in its pass: tried in catalogue order, the first three untouched, three per difficulty. */
  function recommend(level: Parameters<typeof upNext>[0], solved: string[] = [], tried: string[] = []) {
    const attempting = catalogue.filter((r) => tried.includes(r.id));
    const untouchedRows = catalogue.filter((r) => !tried.includes(r.id) && !solved.includes(r.id));
    const by = { easy: [] as typeof catalogue, medium: [] as typeof catalogue, hard: [] as typeof catalogue };
    for (const r of untouchedRows) {
      const bucket = by[r.difficulty.toLowerCase() as keyof typeof by];
      if (bucket.length < 3) bucket.push(r);
    }
    return upNext(level, attempting, by, untouchedRows.slice(0, 3)).map((r) => r.id);
  }

  it("keeps the catalogue's order with no level", () => {
    assert.deepEqual(recommend(null), ["h1", "h2", "m1"]);
  });

  it("offers Easy to someone new, an Easy then Mediums to some, Mediums then a Hard to the comfortable", () => {
    assert.deepEqual(recommend("new"), ["e1", "e2", "e3"]);
    assert.deepEqual(recommend("some"), ["e1", "m1", "m2"]);
    assert.deepEqual(recommend("comfortable"), ["m1", "m2", "h1"]);
  });

  it("still puts what was tried first, in catalogue order, whatever its difficulty", () => {
    assert.deepEqual(recommend("new", [], ["h3"]), ["h3", "e1", "e2"]);
    assert.deepEqual(recommend("new", [], ["h3", "m3", "h2", "m2"]), ["h2", "m2", "h3"]);
  });

  it("skips what is solved, and falls back to any untouched problem when a difficulty runs out", () => {
    assert.deepEqual(recommend("new", ["e1", "e2"]), ["e3", "h1", "h2"]);
  });
});

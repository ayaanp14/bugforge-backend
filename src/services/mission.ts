import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { dayKey, dayStart } from "../lib/clock.js";
import { COMPANY_TAGS } from "../lib/companies.js";
import { areasByGain, companyKey, type Readiness } from "../lib/readiness.js";
import { lessonForHub } from "../lib/roadmap-lessons.js";
import { recommendFor } from "../lib/skill-profile.js";
import { toDifficulty, type Difficulty } from "../lib/skill-score.js";
import { nextSittingAt } from "../lib/skill-tests.js";
import { implicitTargetCompany, isGoal, isLevel, type DashboardPlan } from "../lib/onboarding.js";
import { simulationForCompany } from "../lib/simulations/index.js";
import {
  APTITUDE_ITEM_ANSWERS,
  DEFAULT_MINUTES,
  MILESTONE_MINUTES,
  MOCK_REST_DAYS,
  activityKey,
  buildMission,
  isMinuteChoice,
  keptOnResize,
  missionView,
  readItems,
  readMarks,
  slotsFor,
  type ActivityKind,
  type DiscoverCandidate,
  type DiscoverKey,
  type MissionCandidates,
  type MissionFacts,
  type MissionItem,
  type MissionMark,
  type MissionView,
  type ProblemPick,
  type SkillPick,
  type TargetCandidates,
} from "../lib/mission.js";
import { SAT_ROUND } from "./entitlements.js";
import { skillCatalogues, skillProfileFor } from "./skill-profile.js";
import { cohortGoalFor } from "./cohorts.js";
// The usual inert cycles: dashboard imports this file for the mission, and
// roadmap imports invalidateDashboard from dashboard.
import { invalidateDashboard, loadProblemState, type ProblemState } from "./dashboard.js";
import { roadDefinition } from "./roadmap.js";

/**
 * Today's mission (lib/mission.ts) for one account: the candidates gathered
 * from what the dashboard build already loads plus the skill profile, the
 * day frozen in MissionDay the first time it is asked for, and its ticks
 * read from the evidence on every read.
 *
 * Inside the dashboard build (services/dashboard.ts) like "Your plan" — one
 * request for the home — and, like the plan, a failure answers null rather
 * than failing the page. The writes (minutes, a hand tick, a skip) drop the
 * dashboard; the next read fills the day back up to its size.
 */

export interface MissionLoads {
  problemState: Promise<ProblemState>;
  dailyContest: Promise<{ problem: { slug: string; title: string; difficulty: string } | null; streak: { solvedToday: boolean } }>;
  study: Promise<{ track: string; title: string; behind: number; next: { slug: string; title: string } | null; completedAt: Date | string | null } | null>;
  plan: Promise<DashboardPlan | null>;
  continueSolving: Promise<{ problem: { slug: string; title: string; difficulty: string } | null }>;
  row: Promise<{ goal: string | null; level: string | null; dailyMinutes: number | null; goalDetails: unknown; targetCompany: string | null; targetDate: Date | null } | null>;
  /** Readiness for the saved target (services/readiness.ts); null without one, so no other account pays for it. */
  readiness: Promise<Readiness | null>;
}

const minutesOf = (stored: number | null | undefined) => (isMinuteChoice(stored) ? stored : DEFAULT_MINUTES);

/** The fallback's difficulty for a level: what someone at it should be able to finish. */
const FALLBACK_DIFFICULTY = { new: ["easy"], some: ["easy", "medium"], comfortable: ["medium"] } as const;

async function gatherCandidates(userId: string, loads: MissionLoads, state: ProblemState): Promise<MissionCandidates> {
  const [profile, cats, contest, study, plan, unfinished, row, road, readiness] = await Promise.all([
    skillProfileFor(userId),
    skillCatalogues(),
    loads.dailyContest,
    loads.study,
    loads.plan,
    loads.continueSolving,
    loads.row,
    roadDefinition().catch(() => null),
    loads.readiness,
  ]);
  const rawGoal = row?.goal;
  const rawLevel = row?.level;
  const goal = isGoal(rawGoal) ? rawGoal : null;
  const level = isLevel(rawLevel) ? rawLevel : null;
  const order = road?.stages.map((s) => s.id) ?? [];
  const bySlug = new Map(cats.problems.map((p) => [p.slug, p]));
  const pick = (slug: string | undefined): ProblemPick | null => {
    const p = slug ? bySlug.get(slug) : undefined;
    return p && !state.solved.has(p.id) ? { id: p.id, slug: p.slug, title: p.title, difficulty: p.difficulty } : null;
  };

  // A DSA skill's next problems (lib/skill-profile recommendFor: unfinished
  // first, then the difficulty its mastery calls for) and its tutorial.
  // `prefer`: problems to move to the front, keeping that order among them
  // and among the rest (a target company's own).
  const skillPick = (key: string, prefer?: ReadonlySet<string>): SkillPick | null => {
    const s = profile.scored.get(key);
    if (!s || !key.startsWith("dsa:")) return null;
    const recs = recommendFor(key, profile.scored, profile.input, prefer ? 12 : 4)
      .map((r) => pick(r.slug))
      .filter((p): p is ProblemPick => p != null);
    const problems = prefer ? [...recs.filter((p) => prefer.has(p.id)), ...recs.filter((p) => !prefer.has(p.id))].slice(0, 4) : recs;
    if (!problems.length) return null;
    const lesson = lessonForHub(key.slice(4), order);
    return {
      key,
      label: s.node.label,
      mastery: s.score.mastery,
      problems,
      lesson: lesson ? { slug: lesson.slug, title: lesson.title, minutes: lesson.minutes } : null,
      status: s.score.status,
    };
  };
  const picks = (keys: readonly string[]) => keys.map((k) => skillPick(k)).filter((s): s is SkillPick => s != null);
  const { focus } = profile.view;

  // A bug hunt for the weakest debugging skill already begun, else any:
  // unsolved, easiest first for someone new, in a stable order.
  const solvedHunts = new Set(profile.input.items.filter((i) => i.source === "bug" && i.attempts.some((a) => a.outcome === "accepted")).map((i) => i.id));
  const debugWeak = [...profile.scored.values()]
    .filter((s) => s.node.domain === "debugging" && s.score.status !== "unstarted")
    .sort((a, b) => a.score.mastery - b.score.mastery)[0];
  const RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
  const hunts = [...cats.bugById.entries()]
    .filter(([id, b]) => !solvedHunts.has(id) && (!debugWeak || b.skills.includes(debugWeak.node.key)))
    .sort((a, b) => RANK[a[1].difficulty] - RANK[b[1].difficulty] || a[1].title.localeCompare(b[1].title))
    .slice(0, 6)
    .map(([id, b]) => ({ id, title: b.title, href: b.href, difficulty: b.difficulty, skill: debugWeak?.node.key ?? null, skillLabel: debugWeak?.node.label ?? null }));

  const next = study && !study.completedAt ? study.next : null;
  const step = plan?.steps.find((s) => !s.done && MILESTONE_MINUTES[s.key] != null) ?? null;
  const wanted = new Set<string>(FALLBACK_DIFFICULTY[level ?? "some"]);
  const fallback = state.catalogue
    .filter((p) => !state.solved.has(p.id) && !state.attempted.has(p.id) && wanted.has(p.difficulty.toLowerCase()))
    .slice(0, 12)
    .map((p) => ({ id: p.id, slug: p.slug, title: p.title, difficulty: toDifficulty(p.difficulty) }));

  // Three independent reads, together: awaited inside the object literal they
  // ran one after another on the dashboard's critical path.
  const [target, discover, cohort] = await Promise.all([
    readiness ? targetCandidates(userId, readiness, profile, state, skillPick) : null,
    discoverCandidates(userId, row),
    // A cohort's goal never fails the day: without it the mission is what it was.
    cohortGoalFor(userId).catch(() => null),
  ]);

  return {
    goal,
    level,
    finish: pick(unfinished.problem?.slug),
    due: picks(focus.due),
    weakest: picks(focus.weakest),
    building: picks(focus.building),
    ready: picks(focus.ready),
    hunts,
    daily: contest.problem && !contest.streak.solvedToday ? pick(contest.problem.slug) : null,
    studyLesson: study && next ? { key: `${study.track}:${next.slug}`, title: next.title, href: `/study-plans/${study.track}/${next.slug}`, trackTitle: study.title, behind: study.behind } : null,
    milestone: step ? { key: step.key, title: step.title, detail: step.detail, href: step.href } : null,
    fallback,
    target,
    discover,
    cohort,
  };
}

/**
 * The features this account has never used, in the order the mission offers
 * them (lib/mission DiscoverKey): a drive date for a target that has none
 * (the mission plans towards a date only once it has one), the target
 * company's simulation, then the tutor. Two counts, on indexed columns.
 */
async function discoverCandidates(userId: string, row: Awaited<MissionLoads["row"]>): Promise<DiscoverCandidate[]> {
  const company = row?.targetCompany ?? implicitTargetCompany(row?.goal ?? null, row?.goalDetails);
  const sim = company ? simulationForCompany(company) : undefined;
  const [tutorTurns, runs] = await Promise.all([
    prisma.tutorTurn.count({ where: { userId } }),
    sim ? prisma.simulationRun.count({ where: { userId } }) : Promise.resolve(1),
  ]);
  const out: DiscoverCandidate[] = [];
  if (company && !row?.targetDate) out.push({ key: "drive-date", company });
  if (sim && runs === 0) out.push({ key: "simulation", company: sim.company, slug: sim.slug });
  if (tutorTurns === 0) out.push({ key: "tutor" });
  return out;
}

type Profile = Awaited<ReturnType<typeof skillProfileFor>>;

/**
 * The placement target as the mission reads it (lib/mission.ts
 * TargetCandidates): readiness's areas by what they would gain, and for
 * each the thing to do — the pattern to sit when none was graded lately,
 * the paper's weakest aptitude section, the company's weakest topics (its
 * own problems first), the weakest fundamental and a skill test of it that
 * can be sat now. A handful of reads, only for an account with a target.
 */
async function targetCandidates(
  userId: string,
  r: Readiness,
  profile: Profile,
  state: ProblemState,
  skillPick: (key: string, prefer?: ReadonlySet<string>) => SkillPick | null,
): Promise<TargetCandidates> {
  const areas = areasByGain(r.areas);
  const gapsOf = (key: string) => areas.find((a) => a.key === key)?.gaps ?? [];
  const label = (key: string) => profile.scored.get(key)?.node.label ?? key;

  // The company's own problems, to put first among a topic's.
  const tag = COMPANY_TAGS.find((t) => companyKey(t) === companyKey(r.company));
  const companyProblems = new Set(tag ? state.catalogue.filter((p) => Array.isArray(p.tags) && (p.tags as string[]).includes(tag)).map((p) => p.id) : []);
  const coding = gapsOf("coding")
    .map((g) => skillPick(g.skill, companyProblems))
    .filter((s): s is SkillPick => s != null)
    .slice(0, 3);

  const aptGap = gapsOf("assessment").find((g) => g.skill.startsWith("apt:"));
  const aptitude = aptGap ? { category: aptGap.skill.slice(4), label: label(aptGap.skill), mastery: aptGap.mastery } : null;

  const csGap = gapsOf("fundamentals")[0];
  const csNode = csGap ? profile.scored.get(csGap.skill)?.node : undefined;
  const testSkill = csNode?.match && "skillTest" in csNode.match ? csNode.match.skillTest : null;

  const restSince = new Date(Date.now() - MOCK_REST_DAYS * 86_400_000);
  const [recentSittings, skillTests] = await Promise.all([
    r.patterns.length
      ? prisma.mockAttempt.findMany({
          where: { userId, status: { in: ["submitted", "expired"] }, startedAt: { gte: restSince }, test: { slug: { in: r.patterns.map((p) => p.slug) } } },
          select: { test: { select: { slug: true } } },
        })
      : Promise.resolve([]),
    testSkill ? skillTestToSit(userId, testSkill) : Promise.resolve(null),
  ]);
  const sat = new Set(recentSittings.map((s) => s.test.slug));
  const pattern = r.patterns.find((p) => !sat.has(p.slug));

  const candidates: Omit<TargetCandidates, "doneToday"> = {
    company: r.company,
    daysLeft: r.target?.daysLeft ?? null,
    areas: areas.map((a) => a.key),
    mock: pattern ? { slug: pattern.slug, name: pattern.name } : null,
    aptitude,
    coding,
    fundamentals: csGap && csNode ? { key: csGap.skill, label: csNode.label, mastery: csGap.mastery, notesHref: csNode.href, test: skillTests } : null,
  };
  // What of it was already done today, so nothing is set already ticked.
  const keys = [
    candidates.mock && activityKey("mock", candidates.mock.slug),
    aptitude && activityKey("aptitude", aptitude.category),
    skillTests && activityKey("skill-test", skillTests.slug),
    candidates.areas.includes("interview") && activityKey("interview", null),
    candidates.areas.includes("resume") && activityKey("resume", null),
  ].filter((k): k is string => typeof k === "string");
  return { ...candidates, doneToday: await activitiesToday(userId, keys) };
}

const LEVEL_ORDER = ["basic", "intermediate", "advanced"];

/**
 * The skill test of a skill to sit next: its lowest level without a valid
 * credential, if that one is out of its cooldown and not being sat now.
 * Null when there is none to sit today — the mission offers the notes.
 */
async function skillTestToSit(userId: string, skill: string): Promise<{ slug: string; title: string } | null> {
  const tests = (await prisma.skillTest.findMany({ where: { skill, published: true }, select: { id: true, slug: true, title: true, level: true, cooldownDays: true } })).sort(
    (a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level),
  );
  if (!tests.length) return null;
  const now = new Date();
  const [credentials, sittings] = await Promise.all([
    prisma.skillCredential.findMany({ where: { userId, testId: { in: tests.map((t) => t.id) }, revokedAt: null, expiresAt: { gt: now } }, select: { testId: true } }),
    prisma.skillAttempt.findMany({ where: { userId, testId: { in: tests.map((t) => t.id) } }, orderBy: { startedAt: "desc" }, take: 10, select: { testId: true, status: true, submittedAt: true } }),
  ]);
  // An Intermediate credential says Basic too: the next level is above the highest held.
  const held = Math.max(-1, ...tests.filter((t) => credentials.some((c) => c.testId === t.id)).map((t) => LEVEL_ORDER.indexOf(t.level)));
  const next = tests.find((t) => LEVEL_ORDER.indexOf(t.level) > held);
  if (!next) return null;
  const mine = sittings.filter((s) => s.testId === next.id);
  if (mine.some((s) => s.status === "in-progress")) return null;
  const lastClosed = mine.find((s) => s.status !== "in-progress");
  if (nextSittingAt(lastClosed?.submittedAt ?? null, next.cooldownDays, now)) return null;
  return { slug: next.slug, title: next.title };
}

/**
 * Which of these activity keys (lib/mission activityKey) were done today, in
 * the product's calendar: a graded sitting of the pattern, APTITUDE_ITEM_ANSWERS
 * answers in the category, a closed sitting of the skill test, a sat mock
 * interview, a resume analysis. One read per kind asked about, none for the rest.
 */
async function activitiesToday(userId: string, keys: readonly string[]): Promise<Set<string>> {
  const refs = (kind: ActivityKind) => keys.filter((k) => k.startsWith(`${kind}:`)).map((k) => k.slice(kind.length + 1));
  const since = dayStart();
  const mocks = refs("mock");
  const aptitude = refs("aptitude");
  const tests = refs("skill-test");
  const [mockRows, aptRows, testRows, interviews, resumes] = await Promise.all([
    mocks.length
      ? prisma.mockAttempt.findMany({ where: { userId, status: { in: ["submitted", "expired"] }, startedAt: { gte: since }, test: { slug: { in: mocks } } }, select: { test: { select: { slug: true } } } })
      : Promise.resolve([]),
    aptitude.length
      ? prisma.aptitudeAttempt.findMany({ where: { userId, createdAt: { gte: since }, question: { category: { in: aptitude } } }, select: { questionId: true, question: { select: { category: true } } } })
      : Promise.resolve([]),
    tests.length
      ? prisma.skillAttempt.findMany({ where: { userId, status: { not: "in-progress" }, startedAt: { gte: since }, test: { slug: { in: tests } } }, select: { test: { select: { slug: true } } } })
      : Promise.resolve([]),
    keys.includes("interview") ? prisma.mockInterviewSession.count({ where: { userId, createdAt: { gte: since }, AND: [SAT_ROUND] } }) : Promise.resolve(0),
    keys.includes("resume") ? prisma.resumeAnalysis.count({ where: { userId, createdAt: { gte: since }, status: { not: "failed" } } }) : Promise.resolve(0),
  ]);
  const done = new Set<string>();
  for (const m of mockRows) done.add(activityKey("mock", m.test.slug));
  // Distinct questions: answering one again is not ten answers.
  const perCategory = new Map<string, Set<string>>();
  for (const a of aptRows) perCategory.set(a.question.category, (perCategory.get(a.question.category) ?? new Set()).add(a.questionId));
  for (const [category, qs] of perCategory) if (qs.size >= APTITUDE_ITEM_ANSWERS) done.add(activityKey("aptitude", category));
  for (const t of testRows) done.add(activityKey("skill-test", t.test.slug));
  if (interviews > 0) done.add(activityKey("interview", null));
  if (resumes > 0) done.add(activityKey("resume", null));
  return done;
}

/** What the evidence says about the day's items. Only the lookups its items need are made. */
async function missionFacts(userId: string, items: readonly MissionItem[], state: ProblemState, plan: Promise<DashboardPlan | null> | null): Promise<MissionFacts> {
  const bugIds = items.flatMap((i) => (i.evidence && "bugId" in i.evidence ? [i.evidence.bugId] : []));
  const sqlSlugs = items.flatMap((i) => (i.evidence && "sqlSlug" in i.evidence ? [i.evidence.sqlSlug] : []));
  const lessonKeys = items.flatMap((i) => (i.evidence && "lessonKey" in i.evidence ? [i.evidence.lessonKey] : []));
  const activityKeys = items.flatMap((i) => (i.evidence && "activity" in i.evidence ? [activityKey(i.evidence.activity, i.evidence.ref)] : []));
  const discoverKeys = new Set(items.flatMap((i) => (i.evidence && "discover" in i.evidence ? [i.evidence.discover] : [])));
  const [bugs, sqlSolved, lessons, planned, activities, discovered] = await Promise.all([
    bugIds.length
      ? prisma.bugSubmission.groupBy({ by: ["challengeId"], where: { userId, challengeId: { in: bugIds }, verdict: "ACCEPTED" } })
      : Promise.resolve([]),
    sqlSlugs.length ? prisma.sqlSolve.findMany({ where: { userId, slug: { in: sqlSlugs } }, select: { slug: true } }) : Promise.resolve([]),
    lessonKeys.length
      ? prisma.studyLessonProgress.findMany({ where: { userId, lessonKey: { in: lessonKeys }, completedAt: { not: null } }, select: { lessonKey: true } })
      : Promise.resolve([]),
    plan ?? Promise.resolve(null),
    activityKeys.length ? activitiesToday(userId, activityKeys) : Promise.resolve(new Set<string>()),
    discoverKeys.size ? featuresUsed(userId, discoverKeys) : Promise.resolve(new Set<DiscoverKey>()),
  ]);
  return {
    solvedProblems: state.solved,
    solvedBugs: new Set(bugs.map((b) => b.challengeId)),
    solvedSql: new Set(sqlSolved.map((s) => s.slug)),
    completedLessons: new Set(lessons.map((l) => l.lessonKey)),
    planDone: new Set((planned?.steps ?? []).filter((s) => s.done).map((s) => s.key)),
    activities,
    discovered,
  };
}

/** Which of these features the account has used at least once: a drive date saved, a simulation started, a word to the tutor. */
async function featuresUsed(userId: string, keys: ReadonlySet<DiscoverKey>): Promise<Set<DiscoverKey>> {
  const [user, runs, turns] = await Promise.all([
    keys.has("drive-date") ? prisma.user.findUnique({ where: { id: userId }, select: { targetDate: true } }) : Promise.resolve(null),
    keys.has("simulation") ? prisma.simulationRun.count({ where: { userId } }) : Promise.resolve(0),
    keys.has("tutor") ? prisma.tutorTurn.count({ where: { userId } }) : Promise.resolve(0),
  ]);
  const used = new Set<DiscoverKey>();
  if (user?.targetDate) used.add("drive-date");
  if (runs > 0) used.add("simulation");
  if (turns > 0) used.add("tutor");
  return used;
}

const json = (v: unknown) => v as Prisma.InputJsonValue;

/**
 * Today's mission, or null when it cannot be built (logged; the home falls
 * back to its old "continue solving"). Builds and stores the day on its
 * first read; refills it when it holds fewer items than its minutes call
 * for (after the minutes changed, or when a day was built with too little
 * to suggest).
 */
export async function missionFor(userId: string, loads: MissionLoads): Promise<MissionView | null> {
  try {
    const day = dayKey();
    const [row, existing, state] = await Promise.all([loads.row, prisma.missionDay.findUnique({ where: { userId_day: { userId, day } } }), loads.problemState]);
    const minutes = existing?.minutes ?? minutesOf(row?.dailyMinutes);
    let items = existing ? readItems(existing.items) : [];
    const marks = existing ? readMarks(existing.marks) : {};

    if (!existing || items.length < slotsFor(minutes)) {
      const built = buildMission(await gatherCandidates(userId, loads, state), minutes, items);
      if (existing) {
        if (built.length > items.length) await prisma.missionDay.update({ where: { userId_day: { userId, day } }, data: { items: json(built) } });
        items = built;
      } else {
        // Two dashboard builds racing on a fresh day both get here; the
        // primary key keeps the first, and the second shows what it kept.
        const created = await prisma.missionDay.createMany({ data: [{ userId, day, minutes, items: json(built), marks: json({}) }], skipDuplicates: true });
        if (created.count) items = built;
        else items = readItems((await prisma.missionDay.findUnique({ where: { userId_day: { userId, day } }, select: { items: true } }))?.items);
      }
    }

    return missionView(day, minutes, items, marks, await missionFacts(userId, items, state, loads.plan));
  } catch (err) {
    console.error("dashboard mission failed:", (err as Error).message);
    return null;
  }
}

/**
 * Change the minutes for today and the days after. What is done stays; the
 * rest is dropped and the next dashboard read re-picks it for the new time.
 */
export async function setMissionMinutes(userId: string, minutes: number): Promise<void> {
  await Promise.all([dropUndone(userId, minutes), prisma.user.update({ where: { id: userId }, data: { dailyMinutes: minutes }, select: { id: true } })]);
  invalidateDashboard(userId);
}

/**
 * Re-pick today's undone items after the placement target changed (PUT
 * /api/me/readiness/target): the day was chosen for the old company or
 * date. What is done stays, as when the minutes change.
 */
export async function repickMissionToday(userId: string): Promise<void> {
  await dropUndone(userId, null);
  invalidateDashboard(userId);
}

/** Keep today's done items (and their marks), drop the rest; the next read refills the day. */
async function dropUndone(userId: string, minutes: number | null): Promise<void> {
  const day = dayKey();
  const existing = await prisma.missionDay.findUnique({ where: { userId_day: { userId, day } } });
  if (!existing) return;
  const items = readItems(existing.items);
  const marks = readMarks(existing.marks);
  const facts = await missionFacts(userId, items, await loadProblemState(userId), null);
  const kept = keptOnResize(items, marks, facts);
  const keptMarks: Record<string, MissionMark> = {};
  for (const i of kept) if (marks[i.id]) keptMarks[i.id] = marks[i.id]!;
  await prisma.missionDay.update({ where: { userId_day: { userId, day } }, data: { ...(minutes != null && { minutes }), items: json(kept), marks: json(keptMarks) } });
}

export type MarkAction = "done" | "skip" | "undo";
export const MARK_ACTIONS: ReadonlySet<string> = new Set<MarkAction>(["done", "skip", "undo"]);

/**
 * Tick or skip one of today's items by hand, or take the mark back. Only an
 * item nothing else records (a roadmap lesson) can be ticked by hand: the
 * rest are done when their evidence says so, which is the point of them.
 */
export async function markMissionItem(userId: string, itemId: string, action: MarkAction): Promise<"ok" | "missing" | "not-manual"> {
  const day = dayKey();
  const existing = await prisma.missionDay.findUnique({ where: { userId_day: { userId, day } } });
  const item = existing ? readItems(existing.items).find((i) => i.id === itemId) : undefined;
  if (!existing || !item) return "missing";
  if (action === "done" && item.evidence !== null) return "not-manual";
  const marks = readMarks(existing.marks);
  if (action === "undo") delete marks[itemId];
  else marks[itemId] = action === "skip" ? "skipped" : "done";
  await prisma.missionDay.update({ where: { userId_day: { userId, day } }, data: { marks: json(marks) } });
  invalidateDashboard(userId);
  return "ok";
}

import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { dayKey } from "../lib/clock.js";
import { lessonForHub } from "../lib/roadmap-lessons.js";
import { recommendFor } from "../lib/skill-profile.js";
import { toDifficulty, type Difficulty } from "../lib/skill-score.js";
import { isGoal, isLevel, type DashboardPlan } from "../lib/onboarding.js";
import {
  DEFAULT_MINUTES,
  MILESTONE_MINUTES,
  buildMission,
  isMinuteChoice,
  keptOnResize,
  missionView,
  readItems,
  readMarks,
  slotsFor,
  type MissionCandidates,
  type MissionFacts,
  type MissionItem,
  type MissionMark,
  type MissionView,
  type ProblemPick,
  type SkillPick,
} from "../lib/mission.js";
import { skillCatalogues, skillProfileFor } from "./skill-profile.js";
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
  row: Promise<{ goal: string | null; level: string | null; dailyMinutes: number | null } | null>;
}

const minutesOf = (stored: number | null | undefined) => (isMinuteChoice(stored) ? stored : DEFAULT_MINUTES);

/** The fallback's difficulty for a level: what someone at it should be able to finish. */
const FALLBACK_DIFFICULTY = { new: ["easy"], some: ["easy", "medium"], comfortable: ["medium"] } as const;

async function gatherCandidates(userId: string, loads: MissionLoads, state: ProblemState): Promise<MissionCandidates> {
  const [profile, cats, contest, study, plan, unfinished, row, road] = await Promise.all([
    skillProfileFor(userId),
    skillCatalogues(),
    loads.dailyContest,
    loads.study,
    loads.plan,
    loads.continueSolving,
    loads.row,
    roadDefinition().catch(() => null),
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
  const skillPick = (key: string): SkillPick | null => {
    const s = profile.scored.get(key);
    if (!s || !key.startsWith("dsa:")) return null;
    const problems = recommendFor(key, profile.scored, profile.input, 4)
      .map((r) => pick(r.slug))
      .filter((p): p is ProblemPick => p != null);
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
  const picks = (keys: readonly string[]) => keys.map(skillPick).filter((s): s is SkillPick => s != null);
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
  };
}

/** What the evidence says about the day's items. Only the lookups its items need are made. */
async function missionFacts(userId: string, items: readonly MissionItem[], state: ProblemState, plan: Promise<DashboardPlan | null> | null): Promise<MissionFacts> {
  const bugIds = items.flatMap((i) => (i.evidence && "bugId" in i.evidence ? [i.evidence.bugId] : []));
  const lessonKeys = items.flatMap((i) => (i.evidence && "lessonKey" in i.evidence ? [i.evidence.lessonKey] : []));
  const [bugs, lessons, planned] = await Promise.all([
    bugIds.length
      ? prisma.bugSubmission.findMany({ where: { userId, challengeId: { in: bugIds }, verdict: "ACCEPTED" }, select: { challengeId: true }, distinct: ["challengeId"] })
      : Promise.resolve([]),
    lessonKeys.length
      ? prisma.studyLessonProgress.findMany({ where: { userId, lessonKey: { in: lessonKeys }, completedAt: { not: null } }, select: { lessonKey: true } })
      : Promise.resolve([]),
    plan ?? Promise.resolve(null),
  ]);
  return {
    solvedProblems: state.solved,
    solvedBugs: new Set(bugs.map((b) => b.challengeId)),
    completedLessons: new Set(lessons.map((l) => l.lessonKey)),
    planDone: new Set((planned?.steps ?? []).filter((s) => s.done).map((s) => s.key)),
  };
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
  const day = dayKey();
  const [existing] = await Promise.all([
    prisma.missionDay.findUnique({ where: { userId_day: { userId, day } } }),
    prisma.user.update({ where: { id: userId }, data: { dailyMinutes: minutes }, select: { id: true } }),
  ]);
  if (existing) {
    const items = readItems(existing.items);
    const marks = readMarks(existing.marks);
    const facts = await missionFacts(userId, items, await loadProblemState(userId), null);
    const kept = keptOnResize(items, marks, facts);
    const keptMarks: Record<string, MissionMark> = {};
    for (const i of kept) if (marks[i.id]) keptMarks[i.id] = marks[i.id]!;
    await prisma.missionDay.update({ where: { userId_day: { userId, day } }, data: { minutes, items: json(kept), marks: json(keptMarks) } });
  }
  invalidateDashboard(userId);
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

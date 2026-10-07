import type { Difficulty } from "./skill-score.js";
import type { Goal, Level } from "./onboarding.js";

/**
 * Today's mission: what to do today, in the time there is, and why — as a
 * pure function of candidates services/mission.ts gathers (the skill
 * profile's focus lists and their problems, the onboarding plan's next step,
 * the unfinished draft, today's contest problem, the study plan's next
 * lesson, a bug hunt) and the minutes the member says they have.
 *
 * It absorbs "Your plan" rather than sitting beside it (the user's call,
 * 2026-10-07: no fourth list of things to do): the plan's next undone step
 * is one of the day's items when there is time for it.
 *
 * Two rules shape it, both for the home page:
 *
 *  - **The day's size is the minutes alone.** `slotsFor(minutes)` items, no
 *    more and no fewer while there is anything to suggest, so the home can
 *    draw the mission's rows before it arrives (frontend lib/mission.ts
 *    mirrors the table; e2e/dashboard-loading.spec.ts holds the page still).
 *    The minutes then steer *which* items fit: each is chosen against the
 *    time left per slot, and a big step (a full mock test) waits for a day
 *    with room for it.
 *  - **The list holds still for the day.** It is built once and frozen in
 *    MissionDay; only its ticks move. Re-picking on every read would swap an
 *    item out from under someone the moment they solved it — the profile no
 *    longer recommends a solved problem.
 *
 * Ticks are derived like everything else here: an item is done when its
 * evidence exists (the problem or hunt accepted, the study lesson complete,
 * the plan step done) — every item is chosen unsolved, so "solved now" means
 * "solved since it was set". Only a roadmap lesson, which keeps no read
 * record, is ticked by hand. Skipping is by hand too.
 */

export const MINUTE_CHOICES = [15, 30, 45, 60, 90, 120, 180, 240] as const;
export const DEFAULT_MINUTES = 60;

export const isMinuteChoice = (v: unknown): v is (typeof MINUTE_CHOICES)[number] => typeof v === "number" && (MINUTE_CHOICES as readonly number[]).includes(v);

/**
 * Items a day of `minutes` holds. About twenty minutes an item — an Easy is
 * fifteen, a Medium twenty-five — rounded so that an hour is three things
 * done properly rather than five rushed. Mirrored by the SPA.
 */
export function slotsFor(minutes: number): number {
  if (minutes <= 15) return 1;
  if (minutes <= 30) return 2;
  if (minutes <= 60) return 3;
  if (minutes <= 90) return 4;
  if (minutes <= 120) return 5;
  if (minutes <= 180) return 7;
  return 9;
}

/** Fair time for a problem, a hunt and a study lesson, by difficulty. */
export const PROBLEM_MINUTES: Readonly<Record<Difficulty, number>> = { easy: 15, medium: 25, hard: 40 };
export const HUNT_MINUTES: Readonly<Record<Difficulty, number>> = { easy: 15, medium: 20, hard: 30 };
export const STUDY_LESSON_MINUTES = 15;

/**
 * Items one skill may take in a day. A beginner weak only in arrays got a
 * review, the tutorial and a practice problem, all arrays (2026-10-07): two
 * is focus, three is a rut, and the next slot goes to something else.
 */
export const MAX_PER_SKILL = 2;

/**
 * The onboarding plan's steps that become a mission item of their own, and
 * how long each takes. The steps missing here are practice the other items
 * already are — clearing a roadmap stage, starting a company list, the
 * week's count, today's problem — so they are not listed twice.
 */
export const MILESTONE_MINUTES: Readonly<Record<string, number>> = {
  aptitude: 20,
  mock: 60,
  "skill-test": 45,
  resume: 15,
  sql: 15,
  fundamentals: 40,
  interview: 30,
  duel: 15,
  track: 10,
  module: 20,
};

export type MissionKind = "finish" | "review" | "learn" | "lesson" | "practice" | "explore" | "debug" | "challenge" | "target" | "milestone";

/** The order the day is drawn in: pick up what was left, recall, learn, practise, then the bigger steps. */
const KIND_ORDER: readonly MissionKind[] = ["finish", "review", "learn", "lesson", "practice", "explore", "debug", "challenge", "target", "milestone"];

/**
 * Something done on the site today that ticks a placement-target item: a
 * graded sitting of a test pattern, ten aptitude answers in a category, a
 * closed skill-test sitting, a sat mock interview, a resume analysis.
 * Read from the rows those features already write (services/mission.ts
 * activitiesToday) — still "ticks are derived".
 */
export type ActivityKind = "mock" | "aptitude" | "skill-test" | "interview" | "resume";

export const activityKey = (kind: ActivityKind, ref: string | null): string => (ref ? `${kind}:${ref}` : kind);

/**
 * Something on the site the student has never used, offered as one "try
 * this" item a day until each has been tried (the owner's ask, 2026-10-07:
 * most of what was built went unexplored). Ticked by its first use.
 */
export type DiscoverKey = "drive-date" | "simulation" | "tutor";

export type MissionEvidence =
  | { discover: DiscoverKey; problemId?: string }
  | { problemId: string }
  | { bugId: string }
  | { lessonKey: string }
  | { planStep: string }
  | { activity: ActivityKind; ref: string | null }
  | null;

export interface MissionItem {
  /** "<kind>:<what>", unique within the day. */
  id: string;
  kind: MissionKind;
  title: string;
  /** What it belongs to: the skill, "Daily contest", "Your plan". */
  context: string;
  /** Why it is on today's list, in one sentence. */
  why: string;
  href: string;
  /** An entry into a workbench (problem, hunt): the SPA opens it in a new tab. */
  workbench: boolean;
  minutes: number;
  difficulty: Difficulty | null;
  /** The skill it works, when it works one. */
  skill: string | null;
  /** What ticks it; null for an item ticked by hand. */
  evidence: MissionEvidence;
}

export interface ProblemPick {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
}

export interface SkillPick {
  key: string;
  label: string;
  mastery: number;
  /** Unsolved problems for it, best first (lib/skill-profile recommendFor). */
  problems: ProblemPick[];
  /** Its roadmap lesson, when the road has one. */
  lesson: { slug: string; title: string; minutes: number } | null;
  status: "unstarted" | "learning" | "practising" | "strong";
}

export interface MissionCandidates {
  goal: Goal | null;
  level: Level | null;
  /** The newest unfinished draft. */
  finish: ProblemPick | null;
  /** Skills due for review, most overdue first. */
  due: SkillPick[];
  weakest: SkillPick[];
  building: SkillPick[];
  ready: SkillPick[];
  /** Unsolved bug hunts, best first, with the debugging skill they work. */
  hunts: Array<{ id: string; title: string; href: string; difficulty: Difficulty; skill: string | null; skillLabel: string | null }>;
  /** Today's contest problem, when not solved today. */
  daily: ProblemPick | null;
  /** The study plan's next lesson. */
  studyLesson: { key: string; title: string; href: string; trackTitle: string; behind: number } | null;
  /** The onboarding plan's next undone step. */
  milestone: { key: string; title: string; detail: string; href: string } | null;
  /** Unsolved problems in catalogue order, at the level's difficulty — when nothing else fills a slot. */
  fallback: ProblemPick[];
  /** The placement target's weakest areas (lib/readiness), when the account has saved one. */
  target: TargetCandidates | null;
  /** Features never used, best first (DiscoverKey); at most one becomes an item a day. */
  discover: DiscoverCandidate[];
}

export type DiscoverCandidate =
  | { key: "drive-date"; company: string }
  | { key: "simulation"; company: string; slug: string }
  | { key: "tutor" };

// ── The placement target (Phase 5 of ADAPTIVE_COACH.md) ───────────

/**
 * Within this many days of the drive the target leads the day: its weakest
 * area's item comes straight after an unfinished draft, ahead of reviews and
 * the weakest skill, and a second one follows. Further out, or with no date,
 * it is one item after the plan's step — a nudge, not the day.
 */
export const TARGET_WINDOW_DAYS = 30;
/** A graded sitting of the target's pattern this recent says enough: the mock is not offered again until it is older. */
export const MOCK_REST_DAYS = 14;
/** Aptitude answers in one category, in a day, that make an aptitude item done — about two minutes each. */
export const APTITUDE_ITEM_ANSWERS = 10;
export const TARGET_MINUTES = { mock: 60, aptitude: 20, skillTest: 45, notes: 20, interview: 30, resume: 15 } as const;

/** lib/readiness AreaKey, as the mission reads it. */
export type TargetArea = "assessment" | "coding" | "fundamentals" | "interview" | "resume";

export interface TargetCandidates {
  company: string;
  /** Days to the drive; null with no date (or one already past). */
  daysLeft: number | null;
  /** The areas below ready, the one with most to gain first (lib/readiness areasByGain). */
  areas: TargetArea[];
  /** The company's test pattern to sit, when none was graded in the last MOCK_REST_DAYS. */
  mock: { slug: string; name: string } | null;
  /** The pattern's weakest aptitude section. */
  aptitude: { category: string; label: string; mastery: number } | null;
  /** The company's coding topics below ready, most to gain first; the company's own problems first in each. */
  coding: SkillPick[];
  /** The weakest CS fundamental: its notes, and the skill test to sit when one can be sat now. */
  fundamentals: { key: string; label: string; mastery: number; notesHref: string; test: { slug: string; title: string } | null } | null;
  /** Activity keys already done today (activityKey): an item is never set already ticked. */
  doneToday: ReadonlySet<string>;
}

const problemItem = (kind: MissionKind, p: ProblemPick, context: string, why: string, skill: string | null): MissionItem => ({
  id: `${kind}:${p.id}`,
  kind,
  title: p.title,
  context,
  why,
  href: `/problems/${p.slug}`,
  workbench: true,
  minutes: PROBLEM_MINUTES[p.difficulty],
  difficulty: p.difficulty,
  skill,
  evidence: { problemId: p.id },
});

const RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

/**
 * A skill's problem that fits: its first recommendation unless it needs more
 * than twice the time each remaining slot has, in which case its easiest.
 * Twice, not a hair over: the slots after a long item shrink to what is
 * left, and a tighter rule kept every Hard off every day but the longest.
 */
function fitting(problems: readonly ProblemPick[], perSlot: number, used: ReadonlySet<string>): ProblemPick | null {
  const open = problems.filter((p) => !used.has(p.id));
  if (!open.length) return null;
  const first = open[0]!;
  if (PROBLEM_MINUTES[first.difficulty] <= perSlot * 2) return first;
  return [...open].sort((a, b) => RANK[a.difficulty] - RANK[b.difficulty])[0]!;
}

/** The day's time and slots not yet given to an item. */
interface Room {
  minutesLeft: number;
  slotsLeft: number;
}

type Proposal = (perSlot: number, used: ReadonlySet<string>, room: Room) => MissionItem | null;

/**
 * Whether a step bigger than a practice item fits what is left of the day:
 * it, and an Easy for every other slot. The row count is fixed by the
 * minutes, so a full mock (an hour) needs a two-hour day to sit beside four
 * Easy problems; on a shorter day the area's smaller item stands in.
 */
const holds = (need: number, room: Room): boolean => need + PROBLEM_MINUTES.easy * (room.slotsLeft - 1) <= room.minutesLeft;

/** The plan steps an activity item does the work of: one of them on the day is enough. */
const PLAN_STEPS_COVERED: Readonly<Record<ActivityKind, readonly string[]>> = {
  mock: ["mock"],
  aptitude: ["aptitude"],
  "skill-test": ["skill-test", "fundamentals"],
  interview: ["interview"],
  resume: ["resume"],
};

const coveredSteps = (i: MissionItem): readonly string[] => (i.evidence && "activity" in i.evidence ? PLAN_STEPS_COVERED[i.evidence.activity] : []);
const planStepOf = (i: MissionItem): string | null => (i.evidence && "planStep" in i.evidence ? i.evidence.planStep : null);

const skillProblem = (kind: MissionKind, s: SkillPick | undefined, why: (s: SkillPick) => string): Proposal => (perSlot, used) => {
  if (!s) return null;
  const p = fitting(s.problems, perSlot, used);
  return p ? problemItem(kind, p, s.label, why(s), s.key) : null;
};

/**
 * Build the day. `keep` are items already on it that stay (done ones, when
 * the minutes change); they count against both the slots and the minutes.
 */
export function buildMission(c: MissionCandidates, minutes: number, keep: readonly MissionItem[] = []): MissionItem[] {
  const slots = Math.max(slotsFor(minutes), keep.length);
  const picked: MissionItem[] = [...keep];
  const used = new Set<string>(keep.map((i) => i.id));
  const usedRefs = new Set<string>(keep.flatMap((i) => (i.evidence && "problemId" in i.evidence && i.evidence.problemId ? [i.evidence.problemId] : [])));

  const learnable = [...c.weakest, ...c.building, ...c.ready].find((s) => s.lesson && (s.status === "unstarted" || s.status === "learning"));
  const languageGoal = c.goal === "language";
  const practiceGoal = c.goal === "practice";
  const interviewGoal = c.goal === "placements" || c.goal === "product";

  /** Whether an item may join the day: new, within its skill's share, no problem twice, no plan step twice over. */
  const fits = (item: MissionItem | null): item is MissionItem => {
    if (!item || used.has(item.id)) return false;
    if (item.skill && picked.filter((i) => i.skill === item.skill).length >= MAX_PER_SKILL) return false;
    if (item.evidence && "problemId" in item.evidence && item.evidence.problemId && usedRefs.has(item.evidence.problemId)) return false;
    const step = planStepOf(item);
    const covers = coveredSteps(item);
    if (picked.some((i) => (step && coveredSteps(i).includes(step)) || (covers.length && covers.includes(planStepOf(i) ?? "")))) return false;
    return true;
  };
  /** The first of several proposals whose item may join the day. */
  const oneOf = (...ps: Proposal[]): Proposal => (perSlot, refs, room) => {
    for (const p of ps) {
      const item = p(perSlot, refs, room);
      if (fits(item)) return item;
    }
    return null;
  };

  // The placement target: its areas with most to gain, each with its items
  // in order of preference (a full mock, else the paper's weakest section…),
  // as one proposal that takes the first that fits. Near the drive it comes
  // twice — the second time it takes the next thing on that list.
  const t = c.target;
  const near = t != null && t.daysLeft != null && t.daysLeft <= TARGET_WINDOW_DAYS;
  const lean = t && t.areas.length ? oneOf(...t.areas.flatMap((a) => areaProposals(t, a, near))) : null;
  // One feature never used, the first of the list that fits.
  const discover = c.discover.length ? oneOf(...c.discover.map((d) => discoverProposal(c, d))) : null;

  // The order is the day's priorities: pick up what was left (the cheapest
  // progress there is), recall what is due, work the weakest skill, then the
  // plan's next step, then the rest. A goal moves its own work forward — a
  // language learner's day starts in the language, a practiser's on today's
  // problem, an interview goal gets its debugging early. Reading a tutorial
  // comes after practice: an earlier order filled a 90-minute day with a
  // review, a tutorial and the plan step and no practice at all.
  //
  // A placement target within TARGET_WINDOW_DAYS goes ahead of the review:
  // with the drive close, the area that would move readiness most is worth
  // more today than keeping a skill fresh.
  const proposals: Proposal[] = [
    (_perSlot, refs) => (c.finish && !refs.has(c.finish.id) ? problemItem("finish", c.finish, "", "You have a draft on this one; finish it while it is fresh.", null) : null),
    ...(near && lean ? [lean] : []),
    ...(languageGoal ? [studyLessonProposal(c)] : []),
    skillProblem("review", c.due[0], (s) => `${s.label} is due for review. Solving one you have not seen keeps it.`),
    ...(practiceGoal ? [dailyProposal(c)] : []),
    skillProblem("practice", c.weakest[0], (s) => `${s.label} is one of your weakest at ${s.mastery}%.`),
    ...(near && lean ? [lean] : []),
    // Early enough that a short day still meets it: a thing never tried is
    // worth more than a fourth practice problem, and it stops once tried.
    ...(discover ? [discover] : []),
    milestoneProposal(c, minutes),
    ...(!near && lean ? [lean] : []),
    ...(interviewGoal ? [huntProposal(c)] : []),
    (perSlot) =>
      learnable?.lesson && minutes >= 45
        ? {
            id: `learn:${learnable.lesson.slug}`,
            kind: "learn",
            title: learnable.lesson.title,
            context: learnable.label,
            why: learnable.status === "unstarted" ? `${learnable.label} is next on your path; read the technique before its problems.` : `${learnable.label} is at ${learnable.mastery}%; the tutorial covers what the problems lean on.`,
            href: `/roadmap/${learnable.lesson.slug}`,
            workbench: false,
            minutes: Math.min(learnable.lesson.minutes, Math.max(10, perSlot)),
            difficulty: null,
            skill: learnable.key,
            evidence: null,
          }
        : null,
    skillProblem("practice", c.building[0], (s) => `Keep ${s.label} going: it is at ${s.mastery}%.`),
    ...(!languageGoal && c.studyLesson && c.studyLesson.behind > 0 ? [studyLessonProposal(c)] : []),
    skillProblem("practice", c.ready[0], (s) => `${s.label} is ready to start: what it builds on is in place.`),
    skillProblem("review", c.due[1], (s) => `${s.label} is due for review too.`),
    ...(!interviewGoal && minutes >= 90 ? [huntProposal(c)] : []),
    ...(practiceGoal ? [] : [dailyProposal(c)]),
    skillProblem("practice", c.weakest[1], (s) => `${s.label} is weak too, at ${s.mastery}%.`),
    skillProblem("practice", c.building[1], (s) => `Keep ${s.label} going: it is at ${s.mastery}%.`),
    ...(languageGoal || !c.studyLesson ? [] : [studyLessonProposal(c)]),
    skillProblem("practice", c.weakest[2], (s) => `${s.label} is at ${s.mastery}%.`),
    skillProblem("practice", c.ready[1], (s) => `${s.label} is ready to start.`),
    ...(interviewGoal || minutes >= 90 ? [] : [huntProposal(c)]),
    skillProblem("review", c.due[2], (s) => `${s.label} is due for review.`),
    ...c.fallback.map((p): Proposal => (_perSlot, refs) => (refs.has(p.id) ? null : problemItem("practice", p, "Practice", "More practice at your level.", null))),
  ];

  for (const propose of proposals) {
    if (picked.length >= slots) break;
    const spent = picked.reduce((n, i) => n + i.minutes, 0);
    const room: Room = { minutesLeft: minutes - spent, slotsLeft: slots - picked.length };
    const perSlot = Math.max(10, room.minutesLeft / room.slotsLeft);
    const item = propose(perSlot, usedRefs, room);
    if (!fits(item)) continue;
    picked.push(item);
    used.add(item.id);
    if (item.evidence && "problemId" in item.evidence && item.evidence.problemId) usedRefs.add(item.evidence.problemId);
  }

  return orderItems(picked);
}

function studyLessonProposal(c: MissionCandidates): Proposal {
  return () =>
    c.studyLesson
      ? {
          id: `lesson:${c.studyLesson.key}`,
          kind: "lesson",
          title: c.studyLesson.title,
          context: c.studyLesson.trackTitle,
          why: c.studyLesson.behind > 0 ? `You are ${c.studyLesson.behind} ${c.studyLesson.behind === 1 ? "lesson" : "lessons"} behind your pace.` : "The next lesson in your study plan.",
          href: c.studyLesson.href,
          workbench: false,
          minutes: STUDY_LESSON_MINUTES,
          difficulty: null,
          skill: null,
          evidence: { lessonKey: c.studyLesson.key },
        }
      : null;
}

function dailyProposal(c: MissionCandidates): Proposal {
  return (_perSlot, refs) => (c.daily && !refs.has(c.daily.id) ? problemItem("challenge", c.daily, "Daily contest", "Today's problem: everyone solves the same one, ranked on the clock.", null) : null);
}

function huntProposal(c: MissionCandidates): Proposal {
  return (perSlot) => {
    const hunt = c.hunts.find((h) => HUNT_MINUTES[h.difficulty] <= perSlot * 2) ?? c.hunts[0];
    if (!hunt) return null;
    return {
      id: `debug:${hunt.id}`,
      kind: "debug",
      title: hunt.title,
      context: hunt.skillLabel ?? "Debugging",
      why: hunt.skillLabel ? `Debugging is its own skill; ${hunt.skillLabel.toLowerCase()} is your weakest kind.` : "Debugging is its own skill: read the report, find the bug, fix it.",
      href: hunt.href,
      workbench: true,
      minutes: HUNT_MINUTES[hunt.difficulty],
      difficulty: hunt.difficulty,
      skill: hunt.skill,
      evidence: { bugId: hunt.id },
    };
  };
}

/** The plan's next step, when the day has room for it: a full mock waits for a long day. */
function milestoneProposal(c: MissionCandidates, minutes: number): Proposal {
  return (perSlot) => {
    const m = c.milestone;
    const need = m ? MILESTONE_MINUTES[m.key] : undefined;
    if (!m || need == null) return null;
    if (need > Math.max(perSlot * 2, minutes * 0.6)) return null;
    return {
      id: `milestone:${m.key}`,
      kind: "milestone",
      title: m.title,
      context: "Your plan",
      why: m.detail,
      href: m.href,
      workbench: false,
      minutes: need,
      difficulty: null,
      skill: null,
      evidence: { planStep: m.key },
    };
  };
}

/** One "try this" item (DiscoverKey). The tutor's is a problem with the tutor open on it — one no other item of the day holds. */
function discoverProposal(c: MissionCandidates, d: DiscoverCandidate): Proposal {
  return (_perSlot, refs) => {
    const base = { kind: "explore" as const, workbench: false, difficulty: null, skill: null };
    if (d.key === "drive-date") {
      return {
        ...base,
        id: "explore:drive-date",
        title: `Set your ${d.company} drive date`,
        context: d.company,
        why: "With a date, today's mission plans towards it and readiness counts the days.",
        href: "/readiness",
        minutes: 5,
        evidence: { discover: "drive-date" },
      };
    }
    if (d.key === "simulation") {
      return {
        ...base,
        id: "explore:simulation",
        title: `Start the ${d.company} simulation`,
        context: d.company,
        why: `${d.company}'s online test, then its interview rounds in order: the whole process as one run.`,
        href: `/simulations/${d.slug}`,
        minutes: 10,
        evidence: { discover: "simulation" },
      };
    }
    const p = c.fallback.find((x) => !refs.has(x.id));
    if (!p) return null;
    return {
      ...base,
      id: "explore:tutor",
      title: `Ask the tutor on ${p.title}`,
      context: "Tutor",
      why: "The tutor answers with a question first, and gives only as much help as you ask for.",
      href: `/problems/${p.slug}?tutor=open`,
      workbench: true,
      minutes: PROBLEM_MINUTES[p.difficulty],
      difficulty: p.difficulty,
      evidence: { discover: "tutor", problemId: p.id },
    };
  };
}

/** "18 days to TCS: " near the drive, "" otherwise — the countdown leads the reason when it is the reason. */
function leadOf(t: TargetCandidates, near: boolean): string {
  if (!near || t.daysLeft == null) return "";
  if (t.daysLeft === 0) return `${t.company} is today: `;
  if (t.daysLeft === 1) return `${t.company} is tomorrow: `;
  return `${t.daysLeft} days to ${t.company}: `;
}

const sentence = (lead: string, rest: string) => (lead ? lead + rest : rest.charAt(0).toUpperCase() + rest.slice(1));

/** A placement-target item ticked by an activity done today. */
function activityItem(kind: MissionKind, activity: ActivityKind, ref: string | null, fields: Omit<MissionItem, "id" | "kind" | "evidence" | "workbench" | "difficulty">): MissionItem {
  return { id: `target:${activityKey(activity, ref)}`, kind, workbench: false, difficulty: null, evidence: { activity, ref }, ...fields };
}

/**
 * The items one readiness area offers, best first; the first that fits the
 * day is taken. Each says why in the target's words, with the countdown in
 * front when the drive is near.
 */
function areaProposals(t: TargetCandidates, area: TargetArea, near: boolean): Proposal[] {
  const lead = leadOf(t, near);
  const fresh = (kind: ActivityKind, ref: string | null) => !t.doneToday.has(activityKey(kind, ref));
  const coding = (n: number): Proposal =>
    skillProblem("practice", t.coding[n], (s) =>
      sentence(lead, s.mastery > 0 ? `${s.label} is the weakest topic ${t.company}'s problems use, at ${s.mastery}%.` : `${t.company}'s problems use ${s.label}, and you have not started it.`),
    );

  switch (area) {
    case "assessment":
      return [
        (_p, _r, room) =>
          t.mock && fresh("mock", t.mock.slug) && holds(TARGET_MINUTES.mock, room)
            ? activityItem("target", "mock", t.mock.slug, {
                title: `${t.mock.name} mock`,
                context: t.company,
                why: sentence(lead, `a timed sitting of ${t.company}'s pattern shows where the marks are.`),
                href: `/tests/${t.mock.slug}`,
                minutes: TARGET_MINUTES.mock,
                skill: null,
              })
            : null,
        () =>
          t.aptitude && fresh("aptitude", t.aptitude.category)
            ? activityItem("practice", "aptitude", t.aptitude.category, {
                title: `${APTITUDE_ITEM_ANSWERS} ${t.aptitude.label} questions`,
                context: t.aptitude.label,
                why: sentence(
                  lead,
                  t.aptitude.mastery > 0
                    ? `${t.aptitude.label} is the weakest section of ${t.company}'s test for you, at ${t.aptitude.mastery}%.`
                    : `${t.aptitude.label} is a section of ${t.company}'s test you have not practised yet.`,
                ),
                href: `/aptitude/${t.aptitude.category}`,
                minutes: TARGET_MINUTES.aptitude,
                skill: `apt:${t.aptitude.category}`,
              })
            : null,
        coding(0),
      ];
    case "coding":
      return [coding(0), coding(1)];
    case "fundamentals": {
      const f = t.fundamentals;
      if (!f) return [];
      return [
        (_p, _r, room) =>
          f.test && fresh("skill-test", f.test.slug) && holds(TARGET_MINUTES.skillTest, room)
            ? activityItem("target", "skill-test", f.test.slug, {
                title: `${f.test.title} test`,
                context: t.company,
                why: sentence(lead, f.mastery > 0 ? `${f.label} is your weakest fundamental, at ${f.mastery}%; a sitting measures it.` : `${f.label} has no test sitting yet, and readiness counts only those.`),
                href: `/skill-tests/${f.test.slug}`,
                minutes: TARGET_MINUTES.skillTest,
                skill: f.key,
              })
            : null,
        // Reading keeps no record, so the notes are ticked by hand, like a roadmap lesson.
        () => ({
          id: `learn:${f.key}`,
          kind: "learn",
          title: `${f.label} notes`,
          context: f.label,
          why: sentence(lead, f.test ? `read up on ${f.label} before its skill test.` : `${f.label} is your weakest fundamental; the notes cover what interviews ask.`),
          href: f.notesHref,
          workbench: false,
          minutes: TARGET_MINUTES.notes,
          difficulty: null,
          skill: f.key,
          evidence: null,
        }),
      ];
    }
    case "interview":
      return [
        (_p, _r, room) =>
          fresh("interview", null) && holds(TARGET_MINUTES.interview, room)
            ? activityItem("target", "interview", null, {
                title: "Mock interview",
                context: t.company,
                why: sentence(lead, `interview practice has the most room in your ${t.company} readiness.`),
                href: "/mock-interview",
                minutes: TARGET_MINUTES.interview,
                skill: null,
              })
            : null,
      ];
    case "resume":
      return [
        () =>
          fresh("resume", null)
            ? activityItem("target", "resume", null, {
                title: `Resume check for ${t.company}`,
                context: t.company,
                why: sentence(lead, `readiness reads your resume's score against ${/^[AEIOU]/i.test(t.company) ? "an" : "a"} ${t.company} role.`),
                href: "/resume",
                minutes: TARGET_MINUTES.resume,
                skill: null,
              })
            : null,
      ];
  }
}

export function orderItems(items: readonly MissionItem[]): MissionItem[] {
  return [...items].sort(
    (a, b) =>
      KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
      (a.difficulty && b.difficulty ? RANK[a.difficulty] - RANK[b.difficulty] : 0),
  );
}

// ── The day as it stands ──────────────────────────────────────────

export type MissionMark = "done" | "skipped";

/** What the evidence says, for the items on the day. */
export interface MissionFacts {
  solvedProblems: ReadonlySet<string>;
  solvedBugs: ReadonlySet<string>;
  completedLessons: ReadonlySet<string>;
  planDone: ReadonlySet<string>;
  /** Activity keys done today (activityKey). */
  activities: ReadonlySet<string>;
  /** Features used at least once (DiscoverKey). */
  discovered: ReadonlySet<DiscoverKey>;
}

export const EMPTY_MISSION_FACTS: MissionFacts = { solvedProblems: new Set(), solvedBugs: new Set(), completedLessons: new Set(), planDone: new Set(), activities: new Set(), discovered: new Set() };

export type ItemState = "todo" | "done" | "skipped";

export interface MissionItemView extends MissionItem {
  state: ItemState;
  /** Ticked by its evidence, or by hand. */
  by: "evidence" | "hand" | null;
  /** Can be ticked by hand (nothing records it otherwise). */
  manual: boolean;
}

export interface MissionView {
  day: string;
  minutes: number;
  items: MissionItemView[];
  /** The first item still to do — the one the home sets large. */
  current: string | null;
  done: number;
  total: number;
  minutesDone: number;
  minutesTotal: number;
  complete: boolean;
}

export function evidenceDone(e: MissionEvidence, f: MissionFacts): boolean {
  if (!e) return false;
  // Before problemId: the tutor's item names a problem, but trying the tutor is what ticks it.
  if ("discover" in e) return f.discovered.has(e.discover);
  if ("problemId" in e) return f.solvedProblems.has(e.problemId);
  if ("bugId" in e) return f.solvedBugs.has(e.bugId);
  if ("lessonKey" in e) return f.completedLessons.has(e.lessonKey);
  if ("activity" in e) return f.activities.has(activityKey(e.activity, e.ref));
  return f.planDone.has(e.planStep);
}

export function missionView(day: string, minutes: number, items: readonly MissionItem[], marks: Readonly<Record<string, MissionMark>>, facts: MissionFacts): MissionView {
  const views: MissionItemView[] = items.map((item) => {
    const proven = evidenceDone(item.evidence, facts);
    const mark = marks[item.id];
    const state: ItemState = proven || mark === "done" ? "done" : mark === "skipped" ? "skipped" : "todo";
    return { ...item, state, by: proven ? "evidence" : mark === "done" ? "hand" : null, manual: item.evidence === null };
  });
  const done = views.filter((i) => i.state === "done");
  const counted = views.filter((i) => i.state !== "skipped");
  return {
    day,
    minutes,
    items: views,
    current: views.find((i) => i.state === "todo")?.id ?? null,
    done: done.length,
    total: counted.length,
    minutesDone: done.reduce((n, i) => n + i.minutes, 0),
    minutesTotal: counted.reduce((n, i) => n + i.minutes, 0),
    complete: views.length > 0 && views.every((i) => i.state !== "todo"),
  };
}

/**
 * The items that stay when the minutes change: what is already done. The
 * rest is re-picked for the new time.
 */
export function keptOnResize(items: readonly MissionItem[], marks: Readonly<Record<string, MissionMark>>, facts: MissionFacts): MissionItem[] {
  return items.filter((i) => evidenceDone(i.evidence, facts) || marks[i.id] === "done");
}

const KINDS: ReadonlySet<string> = new Set(KIND_ORDER);

/** Read stored items, dropping anything that is not one (a row written by a later version, a hand edit). */
export function readItems(raw: unknown): MissionItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (i): i is MissionItem =>
      !!i &&
      typeof i === "object" &&
      typeof (i as MissionItem).id === "string" &&
      KINDS.has((i as MissionItem).kind) &&
      typeof (i as MissionItem).title === "string" &&
      typeof (i as MissionItem).href === "string" &&
      typeof (i as MissionItem).minutes === "number",
  );
}

/** Read a stored marks object, dropping anything that is not a known mark. */
export function readMarks(raw: unknown): Record<string, MissionMark> {
  const out: Record<string, MissionMark> = {};
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) if (v === "done" || v === "skipped") out[k] = v;
  }
  return out;
}

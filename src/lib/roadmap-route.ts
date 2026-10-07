import { STATUS_BANDS, type Difficulty, type SkillStatus } from "./skill-score.js";
import { targetDifficulty } from "./skill-profile.js";

/**
 * The road, read against the skill profile: which skills each stage is
 * about, which stages the profile already rates strong, where the road's
 * front is for this reader, and the order to work in — the "route".
 *
 * The road itself does not change. Its stages, their order, the lock and the
 * chests are the syllabus (services/roadmap.ts): a stage is *cleared* only
 * by solving its own problems, and a tier's chest opens only when every one
 * of its stages is cleared. What the profile changes is what is *open* and
 * where the map starts. A stage opens when every uncleared stage before it
 * is one the profile already rates strong (`walk`'s `strong` set), so a
 * learner who has shown arrays and hashing elsewhere starts at two pointers
 * instead of being walked through what they know — and the front of the road
 * is the first open stage they are *not* strong in. Skipping earns nothing:
 * a stage opened early is open, not cleared, and pays no chest.
 *
 * Pure, pinned by roadmap-route.test.ts; the profile and the stage skills
 * come in as plain records.
 */

/** A skill a stage is about, as the profile has it. */
export interface StageSkill {
  key: string;
  label: string;
  mastery: number;
  confidence: number;
  due: boolean;
  status: SkillStatus;
}

export type StageStatus = "locked" | "open" | "cleared";

export interface StageForRoute {
  id: string;
  title: string;
  tierTitle: string;
  status: StageStatus;
  solved: number;
  required: number;
  /** Opened by the profile rather than by clearing the stage before. */
  fastTrack: boolean;
  skills: StageSkill[];
}

/** How sure the profile must be before it opens the road ahead or calls a cleared stage weak. */
export const MIN_ROUTE_CONFIDENCE = 0.35;
/** A stage is strong when every skill it is about is at least this. */
export const STRONG_STAGE = STATUS_BANDS.strong;
/** A cleared stage is worth strengthening below this. */
export const WEAK_STAGE = 50;
/** A skill is a stage's when at least this share of its problems carry it. */
export const STAGE_SKILL_SHARE = 0.5;

/**
 * The skills a stage is about: those carried by at least half its problems,
 * and always the most common one. "Sorting & Greedy" is about both; a stage
 * of array problems that happen to use a hash map now and then is about
 * arrays.
 */
export function stageSkillsOf(problemSkills: ReadonlyArray<readonly string[]>): string[] {
  if (!problemSkills.length) return [];
  const count = new Map<string, number>();
  for (const skills of problemSkills) for (const k of new Set(skills)) count.set(k, (count.get(k) ?? 0) + 1);
  const ranked = [...count.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const dominant = ranked.filter(([, n]) => n / problemSkills.length >= STAGE_SKILL_SHARE).map(([k]) => k);
  return dominant.length ? dominant : ranked.slice(0, 1).map(([k]) => k);
}

/** The stage's standing in the profile: its weakest skill sets it. */
export function stageMastery(skills: readonly StageSkill[]): number {
  return skills.length ? Math.min(...skills.map((s) => s.mastery)) : 0;
}

const sure = (s: StageSkill) => s.confidence >= MIN_ROUTE_CONFIDENCE;

/** Every skill the stage is about is strong, on enough evidence to say so. */
export function isStrongStage(skills: readonly StageSkill[]): boolean {
  return skills.length > 0 && skills.every((s) => s.mastery >= STRONG_STAGE && sure(s));
}

/** Cleared, but the profile says one of its skills has slipped or never set. */
export function isWeakClearedStage(stage: Pick<StageForRoute, "status" | "skills">): boolean {
  return stage.status === "cleared" && stage.skills.some((s) => s.mastery < WEAK_STAGE && sure(s));
}

/**
 * The front of the road: the first open stage the reader is not already
 * strong in — or, when every open stage is strong, the first open one. Null
 * once every stage is cleared.
 */
export function frontOf(stages: readonly StageForRoute[]): string | null {
  const open = stages.filter((s) => s.status === "open");
  return (open.find((s) => !isStrongStage(s.skills)) ?? open[0])?.id ?? null;
}

export type RouteReason = "review" | "current" | "strengthen" | "finish";

export interface RouteStep {
  id: string;
  title: string;
  reason: RouteReason;
  why: string;
}

const names = (skills: readonly StageSkill[]) => {
  const labels = skills.map((s) => s.label);
  return labels.length > 1 ? `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}` : (labels[0] ?? "");
};

/** At most this many steps: the route is what to do next, not the whole road again. */
export const ROUTE_LENGTH = 5;

/**
 * The order to work in. Reviews first — a skill due for review fades while
 * it waits — then the front of the road, then cleared stages whose skills
 * the profile says are weak, then a stage skipped as strong that still has
 * to be cleared for its tier's chest.
 */
export function routeOf(stages: readonly StageForRoute[], front: string | null): RouteStep[] {
  const steps: RouteStep[] = [];
  const taken = new Set<string>();
  const add = (s: StageForRoute, reason: RouteReason, why: string) => {
    if (taken.has(s.id) || steps.length >= ROUTE_LENGTH) return;
    taken.add(s.id);
    steps.push({ id: s.id, title: s.title, reason, why });
  };

  for (const s of stages.filter((x) => x.status !== "locked" && x.id !== front && x.skills.some((k) => k.due)).slice(0, 2)) {
    add(s, "review", `${names(s.skills.filter((k) => k.due))} ${s.skills.filter((k) => k.due).length > 1 ? "are" : "is"} due for review.`);
  }
  const current = stages.find((s) => s.id === front);
  if (current) {
    add(
      current,
      "current",
      current.fastTrack
        ? "Opened early: the stages before it are skills you have already shown."
        : current.solved > 0
          ? `${Math.min(current.solved, current.required)} of ${current.required} solved to clear it.`
          : "Next on your road.",
    );
  }
  const weak = stages.filter(isWeakClearedStage).sort((a, b) => stageMastery(a.skills) - stageMastery(b.skills));
  for (const s of weak.slice(0, 2)) {
    const low = s.skills.filter((k) => k.mastery < WEAK_STAGE).sort((a, b) => a.mastery - b.mastery)[0]!;
    add(s, "strengthen", `Cleared, but ${low.label} is at ${low.mastery}%.`);
  }
  const skipped = stages.find((s) => s.status === "open" && s.id !== front && isStrongStage(s.skills));
  if (skipped) add(skipped, "finish", `You are strong here (${stageMastery(skipped.skills)}%); clear it to open the ${skipped.tierTitle} chest.`);
  return steps;
}

/**
 * The problem in a stage to do next: the first unsolved one at the
 * difficulty the stage's mastery calls for (lib/skill-profile
 * targetDifficulty), else the first unsolved one — the authored order is
 * the stage's own sequence, so it is marked, not re-sorted.
 */
export function recommendedIn(problems: ReadonlyArray<{ slug: string; difficulty: string; solved: boolean }>, mastery: number): string | null {
  const open = problems.filter((p) => !p.solved);
  const want: Difficulty = targetDifficulty(mastery);
  return (open.find((p) => p.difficulty.toLowerCase() === want) ?? open[0])?.slug ?? null;
}

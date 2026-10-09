import { randomBytes } from "node:crypto";
import { dayKey, weekStart } from "./clock.js";
import { learningRank, skillNode, type SkillDomain } from "./skill-graph.js";
import { targetDifficulty } from "./skill-profile.js";
import type { Difficulty } from "./skill-score.js";

/**
 * Study cohorts (Phase 9 of ADAPTIVE_COACH.md, §16): up to eight members
 * learning together towards one weekly goal, with study sessions on the pair
 * rooms. The rules, pure — services/cohorts.ts reads rows and calls these.
 *
 * Learning only, by the owner's decision (2026-10-09): what a member sees of
 * another is effort — solves towards the goal this week, days active — never
 * a skill's mastery, and there is no ranking. The members are listed by when
 * they joined, never by how much they did. The goal's suggestion reads every
 * member's weakest skills on the server and answers only a skill name, so
 * nobody learns whose weakness it was.
 */

export const COHORT_LIMITS = {
  /** Members, the owner included (the owner's call). */
  members: 8,
  /** Cohorts one account may be in, owned or joined: a brake on invite-spam, not a feature. */
  perAccount: 5,
  nameMax: 60,
  goalSkills: 2,
  targetMin: 1,
  targetMax: 20,
  /** Live sessions at once: eight members fill two four-seat rooms. */
  liveSessions: 2,
  /** Problems in the week's shared practice set. */
  practice: 5,
} as const;

/**
 * A session is a pair room, and a pair room seats at most four
 * (routes/pair-rooms.ts clamps 2–4). A cohort of eight is two rooms, which is
 * why COHORT_LIMITS.liveSessions is 2 and the page says so.
 */
export const SESSION_SEATS = 4;

/** The skill domains a goal may come from: the ones with a catalogue to solve. */
export const GOAL_DOMAINS: readonly SkillDomain[] = ["dsa", "sql", "debugging"];

export type SolveSource = "problem" | "bug" | "sql";

// ── Invite codes ──────────────────────────────────────────────────

/**
 * Crockford's base32, as the skill credentials use (lib/skill-tests.ts): no
 * I, L, O or U, so a code read out in a hostel corridor survives the trip.
 */
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * "7H3K-9QXM": 8 symbols, 40 random bits. The code is the only thing that
 * admits a stranger, so it is random, never derived from the row; the
 * unique index settles a collision (the service retries).
 */
export function inviteCode(bytes: Uint8Array = randomBytes(5)): string {
  let bits = 0n;
  for (const byte of bytes.slice(0, 5)) bits = (bits << 8n) | BigInt(byte);
  let symbols = "";
  for (let i = 0; i < 8; i += 1) {
    symbols = CROCKFORD[Number(bits & 31n)]! + symbols;
    bits >>= 5n;
  }
  return `${symbols.slice(0, 4)}-${symbols.slice(4)}`;
}

/** A code as typed or as a link carries it ("7h3k 9qxm", "7H3K9QXO") to its stored form, or null. */
export function normalizeInviteCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const raw = input.trim().toUpperCase().replace(/[\s-]/g, "");
  if (raw.length !== 8) return null;
  const mapped = raw.replace(/O/g, "0").replace(/[IL]/g, "1");
  if (![...mapped].every((ch) => CROCKFORD.includes(ch))) return null;
  return `${mapped.slice(0, 4)}-${mapped.slice(4)}`;
}

// ── Input ─────────────────────────────────────────────────────────

export type Parsed<T> = { ok: T } | { error: string };

export function parseName(input: unknown): Parsed<string> {
  const name = typeof input === "string" ? input.replace(/\s+/g, " ").trim() : "";
  if (name.length < 2) return { error: "Give the cohort a name of at least two characters." };
  if (name.length > COHORT_LIMITS.nameMax) return { error: `A cohort's name is at most ${COHORT_LIMITS.nameMax} characters.` };
  return { ok: name };
}

/** Whether a skill key can be a weekly goal: known, and in a domain with problems to solve. */
export function isGoalSkill(key: unknown): key is string {
  if (typeof key !== "string") return false;
  const node = skillNode(key);
  return node != null && GOAL_DOMAINS.includes(node.domain);
}

export interface CohortGoal {
  skills: string[];
  target: number;
}

export function parseGoal(body: unknown): Parsed<CohortGoal> {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const skills = Array.isArray(b["skills"]) ? [...new Set(b["skills"])] : [];
  if (skills.length < 1 || skills.length > COHORT_LIMITS.goalSkills) return { error: "Pick one or two skills for the week." };
  if (!skills.every(isGoalSkill)) return { error: "A goal is a coding, SQL or debugging skill." };
  const target = b["target"];
  if (typeof target !== "number" || !Number.isInteger(target) || target < COHORT_LIMITS.targetMin || target > COHORT_LIMITS.targetMax) {
    return { error: `A target is ${COHORT_LIMITS.targetMin} to ${COHORT_LIMITS.targetMax} solves a week.` };
  }
  return { ok: { skills: skills as string[], target } };
}

/** The stored goal as the rest of the code reads it: unknown keys dropped (a skill can leave the graph). */
export function readGoalSkills(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter(isGoalSkill).slice(0, COHORT_LIMITS.goalSkills) : [];
}

// ── Joining ───────────────────────────────────────────────────────

/**
 * Why a join is refused, as the sentence the page shows, or null to admit.
 * An existing member is admitted again (idempotent) before any other rule,
 * so a second click on the link is never "full".
 */
export function joinRefusal(c: { closed: boolean; members: number; isMember: boolean; accountCohorts: number }): string | null {
  if (c.isMember) return null;
  if (c.closed) return "This cohort has been closed by its owner.";
  if (c.members >= COHORT_LIMITS.members) return `This cohort is full: it already has ${COHORT_LIMITS.members} members.`;
  if (c.accountCohorts >= COHORT_LIMITS.perAccount) return `You are in ${COHORT_LIMITS.perAccount} cohorts already. Leave one to join another.`;
  return null;
}

/**
 * Who owns the cohort after the owner leaves (or deletes the account): the
 * member who joined earliest. Null when nobody is left — the cohort closes.
 */
export function successorOf(members: ReadonlyArray<{ userId: string; joinedAt: Date }>, leaving: string): string | null {
  const rest = members.filter((m) => m.userId !== leaving).sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime() || a.userId.localeCompare(b.userId));
  return rest[0]?.userId ?? null;
}

// ── The week and its progress ─────────────────────────────────────

export interface GoalWeek {
  /** Monday 00:00 IST, as a real instant. */
  start: Date;
  /** The next Monday 00:00 IST — exclusive. */
  end: Date;
  /** The Monday as YYYY-MM-DD. */
  key: string;
  /** Days of the week gone, today included (1 on a Monday, 7 on a Sunday). */
  day: number;
}

const DAY_MS = 86_400_000;

export function goalWeek(now = new Date()): GoalWeek {
  const start = weekStart(now);
  return {
    start,
    end: new Date(start.getTime() + 7 * DAY_MS),
    key: dayKey(start),
    day: Math.min(7, Math.floor((now.getTime() - start.getTime()) / DAY_MS) + 1),
  };
}

/** One accepted item: a problem, a hunt or a SQL problem, with the skills it evidences. */
export interface SolveRow {
  userId: string;
  source: SolveSource;
  ref: string;
  at: Date;
  skills: readonly string[];
}

export interface MemberProgress {
  userId: string;
  /** Distinct items this week that work a goal skill. */
  solved: number;
  target: number;
  met: boolean;
  /** Days this week with any submission at all (any source, any verdict). */
  activeDays: number;
}

export interface CohortProgress {
  members: MemberProgress[];
  /** Members who met the target — a count, never who. */
  met: number;
  /** The group's goal solves this week, together. */
  together: number;
}

/**
 * The week's progress, per member. An item counts once however often it is
 * re-solved, and only when its first accept *this week* — a re-solve of
 * something done last month is practice, but the goal is new ground, so the
 * caller passes each member's earliest accept per item and this keeps the
 * ones inside the week.
 *
 * `activity` is every submission time in the week (any verdict): a day of
 * failed attempts is still a day of work, which is what "active" means here.
 */
export function progressOf(
  members: readonly string[],
  goal: CohortGoal,
  solves: readonly SolveRow[],
  activity: ReadonlyArray<{ userId: string; at: Date }>,
  week: GoalWeek,
): CohortProgress {
  const inWeek = (d: Date) => d >= week.start && d < week.end;
  const wanted = new Set(goal.skills);
  const solved = new Map<string, Set<string>>();
  for (const s of solves) {
    if (!inWeek(s.at) || !s.skills.some((k) => wanted.has(k))) continue;
    solved.set(s.userId, (solved.get(s.userId) ?? new Set()).add(`${s.source}:${s.ref}`));
  }
  const days = new Map<string, Set<string>>();
  for (const a of activity) if (inWeek(a.at)) days.set(a.userId, (days.get(a.userId) ?? new Set()).add(dayKey(a.at)));
  const rows = members.map((userId): MemberProgress => {
    const n = solved.get(userId)?.size ?? 0;
    return { userId, solved: n, target: goal.target, met: goal.skills.length > 0 && n >= goal.target, activeDays: days.get(userId)?.size ?? 0 };
  });
  return { members: rows, met: rows.filter((r) => r.met).length, together: rows.reduce((n, r) => n + r.solved, 0) };
}

// ── The suggestion ────────────────────────────────────────────────

/** Weak skills read per member: their three weakest, as the skill profile ranks them. */
export const SUGGEST_FROM = 3;

/**
 * The goal to suggest from the members' weakest skills (lib/skill-profile
 * focus.weakest, read on the server): the goal skill the most members share
 * a weakness in, ties to the one earlier in the learning order. Only the
 * key leaves — never a count or a name, so nobody's weakness is shown.
 * Null when no two members share one and the cohort has more than one
 * member: a suggestion from one person's profile would point straight at them.
 */
export function suggestGoal(weakest: ReadonlyArray<readonly string[]>): string | null {
  const votes = new Map<string, number>();
  for (const list of weakest) for (const key of new Set(list.filter(isGoalSkill).slice(0, SUGGEST_FROM))) votes.set(key, (votes.get(key) ?? 0) + 1);
  const need = weakest.length > 1 ? 2 : 1;
  const ranked = [...votes.entries()].filter(([, n]) => n >= need).sort((a, b) => b[1] - a[1] || learningRank(a[0]) - learningRank(b[0]));
  return ranked[0]?.[0] ?? null;
}

// ── The shared practice set ───────────────────────────────────────

export interface PracticeCandidate {
  source: SolveSource;
  ref: string;
  slug: string;
  title: string;
  href: string;
  difficulty: Difficulty;
  number: number | null;
  skills: readonly string[];
}

export interface PracticeItem extends Omit<PracticeCandidate, "skills"> {
  skill: string;
  /** How many members have it accepted — a count, shown as "2 have solved it", never who. */
  solvedBy: number;
}

const RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

/**
 * The week's practice set, the same for everyone: problems for the goal
 * skills, alternating between them, skipping what most of the cohort has
 * solved already (more than half), at the difficulty the group's median
 * mastery calls for (lib/skill-profile targetDifficulty — the rule
 * recommendFor uses for one learner), nearest first, then the fewest
 * solvers, then catalogue order. `medianMastery` is read on the server and
 * never sent.
 */
export function practiceSet(
  goal: CohortGoal,
  candidates: readonly PracticeCandidate[],
  solvedBy: ReadonlyMap<string, number>,
  members: number,
  medianMastery: ReadonlyMap<string, number>,
  limit: number = COHORT_LIMITS.practice,
): PracticeItem[] {
  const key = (c: { source: string; ref: string }) => `${c.source}:${c.ref}`;
  const lists = goal.skills.map((skill) => {
    const want = RANK[targetDifficulty(medianMastery.get(skill) ?? 0)];
    return candidates
      .filter((c) => c.skills.includes(skill) && (solvedBy.get(key(c)) ?? 0) * 2 <= members)
      .map((c) => ({ c, skill, distance: Math.abs(RANK[c.difficulty] - want), solvers: solvedBy.get(key(c)) ?? 0 }))
      .sort(
        (a, b) =>
          a.distance - b.distance ||
          a.solvers - b.solvers ||
          (a.c.number ?? Number.MAX_SAFE_INTEGER) - (b.c.number ?? Number.MAX_SAFE_INTEGER) ||
          a.c.title.localeCompare(b.c.title),
      );
  });
  const out: PracticeItem[] = [];
  const seen = new Set<string>();
  for (let i = 0; out.length < limit && lists.some((l) => i < l.length); i += 1) {
    for (const list of lists) {
      const next = list[i];
      if (!next || seen.has(key(next.c)) || out.length >= limit) continue;
      seen.add(key(next.c));
      const { skills: _skills, ...rest } = next.c;
      out.push({ ...rest, skill: next.skill, solvedBy: next.solvers });
    }
  }
  return out;
}

/** The middle of the members' masteries for a skill (the lower middle for an even count). */
export function median(values: readonly number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)]!;
}

// ── Sessions ──────────────────────────────────────────────────────

/** routes/pair-rooms.ts EMPTY_ROOM_TTL_MS: a room nobody is in for this long is over. */
export const SESSION_IDLE_MS = 60 * 60 * 1000;

/**
 * Whether a session's room is still one to join: not closed, and either
 * someone is connected or it started within the hour (the pair-room rule
 * that closes an abandoned room on its next read).
 */
export function sessionLive(room: { status: string; startedAt: Date | null }, connected: number, now = Date.now()): boolean {
  if (room.status === "closed") return false;
  if (connected > 0) return true;
  return now - (room.startedAt?.getTime() ?? 0) < SESSION_IDLE_MS;
}

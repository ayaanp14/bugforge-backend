import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { cached, invalidate } from "../lib/cache.js";
import { socketsInRoom } from "../lib/realtime.js";
import { decodeCode } from "../lib/obfuscation.js";
import { kickedUserIdsOf } from "../lib/room-kicks.js";
import { SKILLS, skillNode } from "../lib/skill-graph.js";
import {
  COHORT_LIMITS,
  GOAL_DOMAINS,
  SESSION_SEATS,
  goalWeek,
  inviteCode,
  joinRefusal,
  median,
  normalizeInviteCode,
  parseGoal,
  parseName,
  practiceSet,
  progressOf,
  readGoalSkills,
  sessionLive,
  successorOf,
  suggestGoal,
  type CohortGoal,
  type CohortProgress,
  type GoalWeek,
  type PracticeCandidate,
  type PracticeItem,
  type SolveRow,
} from "../lib/cohorts.js";
import { createNotification } from "./notifications.js";
import { openPairRoom, PairRoomError, seatInRoom } from "./pair-rooms.js";
import { skillCatalogues, skillProfileFor } from "./skill-profile.js";

/**
 * Study cohorts (Phase 9 of ADAPTIVE_COACH.md, §16). Rules in lib/cohorts.ts;
 * this file reads rows, caches the composed view a minute per cohort, and
 * writes the few facts no other row holds: who is in which cohort, its name,
 * code and goal, and which pair rooms were its sessions.
 *
 * Every read and write is for a member: a cohort the caller is not in is the
 * same 404 as one that does not exist, so ids cannot be probed. Only the
 * invite code admits anyone.
 */

export class CohortError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CohortError";
  }
}

const NOT_FOUND = () => new CohortError("No such cohort.", 404);
const OWNER_ONLY = () => new CohortError("Only the cohort's owner can do that.", 403);

const CORE_TTL_MS = 60_000;
const coreKey = (id: string) => `cohort:v1:${id}`;

/** Drop a cohort's cached view (every write to it, and a member's solve does not — a minute behind is fine). */
export function forgetCohort(id: string): void {
  invalidate(coreKey(id));
}

// ── The composed view ─────────────────────────────────────────────

interface Person {
  userId: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  joinedAt: Date;
}

/** What one cohort looks like this week, the same for every member (per-viewer bits are added by `viewFor`). */
interface Core {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  closedAt: Date | null;
  createdAt: Date;
  goal: CohortGoal | null;
  goalSetAt: Date | null;
  week: GoalWeek;
  people: Person[];
  progress: CohortProgress | null;
  /** The practice set, each with who has it accepted (kept on the server; only a count and "you" leave). */
  practice: Array<PracticeItem & { solvers: string[] }>;
  suggestion: string | null;
}

/** Each member's first accept of every problem, hunt and SQL problem — the evidence of the week and of "solved by". */
async function solvesOf(userIds: string[]): Promise<{ rows: SolveRow[]; problemSkills: (id: string) => readonly string[] }> {
  const cats = await skillCatalogues();
  const [problems, bugs, sql] = await Promise.all([
    prisma.submission.groupBy({ by: ["userId", "problemId"], where: { userId: { in: userIds }, verdict: "ACCEPTED" }, _min: { submittedAt: true } }),
    prisma.bugSubmission.groupBy({ by: ["userId", "challengeId"], where: { userId: { in: userIds }, verdict: "ACCEPTED" }, _min: { submittedAt: true } }),
    prisma.sqlSolve.findMany({ where: { userId: { in: userIds } }, select: { userId: true, slug: true, submittedAt: true } }),
  ]);
  const rows: SolveRow[] = [];
  for (const p of problems) {
    const c = cats.problemById.get(p.problemId);
    if (c && p._min.submittedAt) rows.push({ userId: p.userId, source: "problem", ref: p.problemId, at: p._min.submittedAt, skills: c.skills });
  }
  for (const b of bugs) {
    const c = cats.bugById.get(b.challengeId);
    if (c && b._min.submittedAt) rows.push({ userId: b.userId, source: "bug", ref: b.challengeId, at: b._min.submittedAt, skills: c.skills });
  }
  for (const s of sql) {
    const c = cats.sqlBySlug.get(s.slug);
    if (c) rows.push({ userId: s.userId, source: "sql", ref: s.slug, at: s.submittedAt, skills: c.skills });
  }
  return { rows, problemSkills: (id) => cats.problemById.get(id)?.skills ?? [] };
}

/** Every submission time this week, any source and verdict: what "active days" counts. */
async function activityOf(userIds: string[], week: GoalWeek): Promise<Array<{ userId: string; at: Date }>> {
  const where = { userId: { in: userIds }, submittedAt: { gte: week.start, lt: week.end } };
  const select = { userId: true, submittedAt: true } as const;
  // A ceiling, not a feature: eight people cannot submit this much in a week by hand.
  const take = 5_000;
  const [a, b, c] = await Promise.all([
    prisma.submission.findMany({ where, select, take }),
    prisma.bugSubmission.findMany({ where, select, take }),
    prisma.sqlSubmission.findMany({ where, select, take }),
  ]);
  return [...a, ...b, ...c].map((r) => ({ userId: r.userId, at: r.submittedAt }));
}

/** The practice candidates for the goal's skills, from the same catalogue the skill profile reads. */
async function candidatesFor(goal: CohortGoal): Promise<PracticeCandidate[]> {
  const cats = await skillCatalogues();
  const wanted = (skills: readonly string[]) => skills.some((k) => goal.skills.includes(k));
  const out: PracticeCandidate[] = [];
  for (const p of cats.problems) {
    if (wanted(p.skills)) out.push({ source: "problem", ref: p.id, slug: p.slug, title: p.title, href: `/problems/${p.slug}`, difficulty: p.difficulty, number: p.number, skills: p.skills });
  }
  for (const [id, b] of cats.bugById) {
    if (wanted(b.skills)) out.push({ source: "bug", ref: id, slug: b.href.split("/").pop() ?? id, title: b.title, href: b.href, difficulty: b.difficulty, number: null, skills: b.skills });
  }
  for (const [slug, q] of cats.sqlBySlug) {
    if (wanted(q.skills)) out.push({ source: "sql", ref: slug, slug, title: q.title, href: q.href, difficulty: q.difficulty, number: null, skills: q.skills });
  }
  return out;
}

/**
 * Each member's skill profile, read only to find the group's shared weak
 * spots and the median mastery of the goal skills. Neither leaves the
 * server as anything but a skill name and the practice set's difficulty.
 * A profile that fails to load is left out, never fails the page.
 */
async function profilesOf(userIds: string[]) {
  const settled = await Promise.allSettled(userIds.map((id) => skillProfileFor(id)));
  return settled.flatMap((s) => (s.status === "fulfilled" ? [s.value] : []));
}

async function buildCore(id: string): Promise<Core | null> {
  const cohort = await prisma.cohort.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      ownerId: true,
      inviteCode: true,
      goalSkills: true,
      goalTarget: true,
      goalSetAt: true,
      closedAt: true,
      createdAt: true,
      members: { orderBy: { joinedAt: "asc" }, select: { userId: true, joinedAt: true, user: { select: { name: true, username: true, avatar_url: true } } } },
    },
  });
  if (!cohort) return null;
  const week = goalWeek();
  const people: Person[] = cohort.members.map((m) => ({ userId: m.userId, name: m.user.name, username: m.user.username, avatarUrl: m.user.avatar_url, joinedAt: m.joinedAt }));
  const ids = people.map((p) => p.userId);
  const skills = readGoalSkills(cohort.goalSkills);
  const goal: CohortGoal | null = skills.length ? { skills, target: cohort.goalTarget } : null;

  const [{ rows }, activity, profiles] = await Promise.all([solvesOf(ids), activityOf(ids, week), profilesOf(ids)]);
  const suggestion = suggestGoal(profiles.map((p) => p.view.focus.weakest));

  let practice: Core["practice"] = [];
  if (goal) {
    const solvers = new Map<string, string[]>();
    for (const r of rows) {
      const k = `${r.source}:${r.ref}`;
      solvers.set(k, [...(solvers.get(k) ?? []), r.userId]);
    }
    const medians = new Map(goal.skills.map((k) => [k, median(profiles.map((p) => p.scored.get(k)?.score.mastery ?? 0))]));
    const counts = new Map([...solvers].map(([k, v]) => [k, v.length]));
    practice = practiceSet(goal, await candidatesFor(goal), counts, ids.length, medians).map((p) => ({ ...p, solvers: solvers.get(`${p.source}:${p.ref}`) ?? [] }));
  }

  return {
    id: cohort.id,
    name: cohort.name,
    ownerId: cohort.ownerId,
    inviteCode: cohort.inviteCode,
    closedAt: cohort.closedAt,
    createdAt: cohort.createdAt,
    goal,
    goalSetAt: cohort.goalSetAt,
    week,
    people,
    progress: goal ? progressOf(ids, goal, rows, activity, week) : progressOf(ids, { skills: [], target: 0 }, [], activity, week),
    practice,
    suggestion,
  };
}

/** The cohort's view, cached a minute — or rebuilt when the week turned over since it was cached. */
async function coreOf(id: string): Promise<Core | null> {
  const core = await cached(coreKey(id), CORE_TTL_MS, () => buildCore(id));
  if (core && core.week.key !== goalWeek().key) {
    forgetCohort(id);
    return cached(coreKey(id), CORE_TTL_MS, () => buildCore(id));
  }
  return core;
}

/** The cohort for a member, or the 404 a stranger gets for an id that does not exist. */
async function memberCore(userId: string, id: string): Promise<Core> {
  const core = await coreOf(id);
  if (!core || !core.people.some((p) => p.userId === userId)) throw NOT_FOUND();
  return core;
}

const skillOf = (key: string) => {
  const node = skillNode(key);
  return { key, label: node?.label ?? key, href: node?.href ?? "/skills", domain: node?.domain ?? "dsa" };
};

export interface CohortSessionView {
  id: string;
  roomId: string;
  problem: { slug: string; title: string; difficulty: string };
  startedBy: string | null;
  startedAt: string;
  seats: number;
  taken: number;
  youAreIn: boolean;
}

/** The cohort's live sessions — read fresh every time (a room's liveness is a socket count, not a cached fact). */
async function liveSessions(cohortId: string, userId: string, people: readonly Person[]): Promise<CohortSessionView[]> {
  const rows = await prisma.cohortSession.findMany({
    where: { cohortId, room: { status: { not: "closed" } } },
    orderBy: { startedAt: "desc" },
    take: 10,
    select: {
      id: true,
      roomId: true,
      startedBy: true,
      startedAt: true,
      room: { select: { status: true, startedAt: true, maxParticipants: true, problem: { select: { slug: true, title: true, difficulty: true } }, participants: { select: { userId: true } } } },
    },
  });
  const out: CohortSessionView[] = [];
  for (const s of rows) {
    if (!sessionLive(s.room, await socketsInRoom(s.roomId))) continue;
    const starter = people.find((p) => p.userId === s.startedBy);
    out.push({
      id: s.id,
      roomId: s.roomId,
      problem: s.room.problem,
      startedBy: starter ? (starter.name ?? starter.username) : null,
      startedAt: s.startedAt.toISOString(),
      seats: s.room.maxParticipants,
      taken: s.room.participants.length,
      youAreIn: s.room.participants.some((p) => p.userId === userId),
    });
  }
  return out;
}

export interface CohortView {
  id: string;
  name: string;
  isOwner: boolean;
  closed: boolean;
  inviteCode: string;
  createdAt: string;
  limits: { members: number; seats: number; liveSessions: number; targetMin: number; targetMax: number; goalSkills: number };
  week: { key: string; start: string; end: string; day: number };
  goal: { skills: ReturnType<typeof skillOf>[]; target: number; setAt: string | null } | null;
  /** A goal skill several members are weak in — a name only, never whose. Offered to the owner. */
  suggestion: ReturnType<typeof skillOf> | null;
  members: Array<{
    userId: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
    isOwner: boolean;
    isYou: boolean;
    joinedAt: string;
    solved: number;
    target: number;
    met: boolean;
    activeDays: number;
  }>;
  summary: { members: number; met: number; together: number };
  practice: Array<PracticeItem & { youSolved: boolean }>;
  sessions: CohortSessionView[];
  /** The skills a goal may name, for the owner's picker (empty for everyone else). */
  goalOptions: Array<{ key: string; label: string; domain: string }>;
}

/** Every goal-able skill, in the graph's order (learning order within DSA). */
const GOAL_OPTIONS = SKILLS.filter((s) => GOAL_DOMAINS.includes(s.domain)).map((s) => ({ key: s.key, label: s.label, domain: s.domain }));

function viewOf(core: Core, userId: string, sessions: CohortSessionView[]): CohortView {
  const progress = new Map((core.progress?.members ?? []).map((m) => [m.userId, m]));
  return {
    id: core.id,
    name: core.name,
    isOwner: core.ownerId === userId,
    closed: core.closedAt != null,
    inviteCode: core.inviteCode,
    createdAt: core.createdAt.toISOString(),
    limits: {
      members: COHORT_LIMITS.members,
      seats: SESSION_SEATS,
      liveSessions: COHORT_LIMITS.liveSessions,
      targetMin: COHORT_LIMITS.targetMin,
      targetMax: COHORT_LIMITS.targetMax,
      goalSkills: COHORT_LIMITS.goalSkills,
    },
    week: { key: core.week.key, start: core.week.start.toISOString(), end: core.week.end.toISOString(), day: core.week.day },
    goal: core.goal ? { skills: core.goal.skills.map(skillOf), target: core.goal.target, setAt: core.goalSetAt?.toISOString() ?? null } : null,
    suggestion: core.suggestion ? skillOf(core.suggestion) : null,
    members: core.people.map((p) => {
      const m = progress.get(p.userId);
      return {
        userId: p.userId,
        name: p.name,
        username: p.username,
        avatarUrl: p.avatarUrl,
        isOwner: p.userId === core.ownerId,
        isYou: p.userId === userId,
        joinedAt: p.joinedAt.toISOString(),
        solved: core.goal ? (m?.solved ?? 0) : 0,
        target: core.goal?.target ?? 0,
        met: core.goal ? (m?.met ?? false) : false,
        activeDays: m?.activeDays ?? 0,
      };
    }),
    summary: { members: core.people.length, met: core.goal ? (core.progress?.met ?? 0) : 0, together: core.goal ? (core.progress?.together ?? 0) : 0 },
    practice: core.practice.map(({ solvers, ...p }) => ({ ...p, youSolved: solvers.includes(userId) })),
    sessions,
    goalOptions: core.ownerId === userId && !core.closedAt ? GOAL_OPTIONS : [],
  };
}

export async function cohortFor(userId: string, id: string): Promise<CohortView> {
  const core = await memberCore(userId, id);
  const sessions = core.closedAt ? [] : await liveSessions(id, userId, core.people);
  return viewOf(core, userId, sessions);
}

// ── The list ──────────────────────────────────────────────────────

export interface CohortListItem {
  id: string;
  name: string;
  isOwner: boolean;
  closed: boolean;
  members: number;
  goal: { skills: string[]; target: number } | null;
  /** The caller's own progress this week — their own, so it may be shown on their list. */
  you: { solved: number; met: boolean } | null;
}

export async function cohortsOf(userId: string): Promise<{ cohorts: CohortListItem[]; limits: { perAccount: number; members: number } }> {
  const rows = await prisma.cohortMember.findMany({ where: { userId }, orderBy: { joinedAt: "desc" }, select: { cohortId: true } });
  const cores = await Promise.all(rows.map((r) => coreOf(r.cohortId)));
  const cohorts = cores
    .filter((c): c is Core => c != null)
    .map((c) => {
      const mine = c.progress?.members.find((m) => m.userId === userId);
      return {
        id: c.id,
        name: c.name,
        isOwner: c.ownerId === userId,
        closed: c.closedAt != null,
        members: c.people.length,
        goal: c.goal ? { skills: c.goal.skills.map((k) => skillOf(k).label), target: c.goal.target } : null,
        you: c.goal && mine ? { solved: mine.solved, met: mine.met } : null,
      };
    })
    // Open ones first; a closed cohort stays listed for its members to see and leave.
    .sort((a, b) => Number(a.closed) - Number(b.closed));
  return { cohorts, limits: { perAccount: COHORT_LIMITS.perAccount, members: COHORT_LIMITS.members } };
}

// ── Writes ────────────────────────────────────────────────────────

/** Cohorts the account is in that still count against its cap: open ones. */
const openCount = (userId: string) => prisma.cohortMember.count({ where: { userId, cohort: { closedAt: null } } });

const isDuplicate = (err: unknown) => err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

/** Write with a fresh invite code, retrying on the one-in-a-trillion collision. */
async function withFreshCode<T>(write: (code: string) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await write(inviteCode());
    } catch (err) {
      if (!isDuplicate(err) || attempt >= 4) throw err;
    }
  }
}

export async function createCohort(userId: string, body: unknown): Promise<{ id: string }> {
  const name = parseName((body as Record<string, unknown> | null)?.["name"]);
  if ("error" in name) throw new CohortError(name.error, 400);
  if ((await openCount(userId)) >= COHORT_LIMITS.perAccount) throw new CohortError(`You are in ${COHORT_LIMITS.perAccount} cohorts already. Leave one to start another.`, 409);
  const row = await withFreshCode((code) =>
    prisma.cohort.create({ data: { name: name.ok, ownerId: userId, inviteCode: code, members: { create: { userId } } }, select: { id: true } }),
  );
  return row;
}

export interface InvitePreview {
  id: string;
  name: string;
  members: number;
  owner: string | null;
  isMember: boolean;
  /** The sentence the page shows instead of a Join button, or null. */
  refusal: string | null;
}

async function byCode(code: unknown) {
  const normal = normalizeInviteCode(code);
  if (!normal) throw new CohortError("That code is not a cohort invite. Check it and try again.", 404);
  const cohort = await prisma.cohort.findUnique({
    where: { inviteCode: normal },
    select: { id: true, name: true, ownerId: true, closedAt: true, owner: { select: { name: true, username: true } }, members: { select: { userId: true } } },
  });
  // A code that was regenerated is dead: the same answer as a mistyped one.
  if (!cohort) throw new CohortError("That code is not a cohort invite, or the owner has replaced it with a new one.", 404);
  return cohort;
}

/** What an invite link shows before joining: the name and size, and whether it would admit. */
export async function previewInvite(userId: string, code: unknown): Promise<InvitePreview> {
  const [cohort, count] = await Promise.all([byCode(code), openCount(userId)]);
  const isMember = cohort.members.some((m) => m.userId === userId);
  return {
    id: cohort.id,
    name: cohort.name,
    members: cohort.members.length,
    owner: cohort.owner.name ?? cohort.owner.username,
    isMember,
    refusal: joinRefusal({ closed: cohort.closedAt != null, members: cohort.members.length, isMember, accountCohorts: count }),
  };
}

/**
 * Join by code. The member cap is held under a row lock on the cohort, so two
 * people taking the eighth seat at once cannot both get it; a member joining
 * again is a no-op success. The owner gets one in-app note.
 */
export async function joinByCode(userId: string, code: unknown): Promise<{ id: string }> {
  const cohort = await byCode(code);
  const joined = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM Cohort WHERE id = ${cohort.id} FOR UPDATE`;
    const [current, members, mine] = await Promise.all([
      tx.cohort.findUniqueOrThrow({ where: { id: cohort.id }, select: { closedAt: true } }),
      tx.cohortMember.findMany({ where: { cohortId: cohort.id }, select: { userId: true } }),
      tx.cohortMember.count({ where: { userId, cohort: { closedAt: null } } }),
    ]);
    const isMember = members.some((m) => m.userId === userId);
    const refusal = joinRefusal({ closed: current.closedAt != null, members: members.length, isMember, accountCohorts: mine });
    if (refusal) throw new CohortError(refusal, 409);
    if (isMember) return false;
    await tx.cohortMember.create({ data: { cohortId: cohort.id, userId } });
    return true;
  });
  if (joined) {
    forgetCohort(cohort.id);
    const who = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, username: true } });
    void createNotification(cohort.ownerId, {
      type: "cohort_joined",
      title: `${who?.name ?? who?.username ?? "Someone"} joined ${cohort.name}`,
      body: "They used your invite code. Your cohort's page shows the week's goal and everyone's progress.",
      href: `/cohorts/${cohort.id}`,
    });
  }
  return { id: cohort.id };
}

async function ownerCore(userId: string, id: string): Promise<Core> {
  const core = await memberCore(userId, id);
  if (core.ownerId !== userId) throw OWNER_ONLY();
  return core;
}

const CLOSED = () => new CohortError("This cohort is closed.", 409);

export async function setGoal(userId: string, id: string, body: unknown): Promise<void> {
  const core = await ownerCore(userId, id);
  if (core.closedAt) throw CLOSED();
  const goal = parseGoal(body);
  if ("error" in goal) throw new CohortError(goal.error, 400);
  await prisma.cohort.update({ where: { id }, data: { goalSkills: goal.ok.skills, goalTarget: goal.ok.target, goalSetAt: new Date() } });
  forgetCohort(id);
}

export async function rename(userId: string, id: string, body: unknown): Promise<void> {
  const core = await ownerCore(userId, id);
  if (core.closedAt) throw CLOSED();
  const name = parseName((body as Record<string, unknown> | null)?.["name"]);
  if ("error" in name) throw new CohortError(name.error, 400);
  await prisma.cohort.update({ where: { id }, data: { name: name.ok } });
  forgetCohort(id);
}

/** A new invite code; the old one stops working at once. */
export async function regenerateCode(userId: string, id: string): Promise<{ inviteCode: string }> {
  const core = await ownerCore(userId, id);
  if (core.closedAt) throw CLOSED();
  const row = await withFreshCode((code) => prisma.cohort.update({ where: { id }, data: { inviteCode: code }, select: { inviteCode: true } }));
  forgetCohort(id);
  return row;
}

export async function removeMember(userId: string, id: string, memberId: string): Promise<void> {
  await ownerCore(userId, id);
  if (memberId === userId) throw new CohortError("To leave your own cohort, use Leave: ownership passes to the longest-standing member.", 400);
  const gone = await prisma.cohortMember.deleteMany({ where: { cohortId: id, userId: memberId } });
  if (!gone.count) throw new CohortError("They are not in this cohort.", 404);
  forgetCohort(id);
}

export async function closeCohort(userId: string, id: string): Promise<void> {
  const core = await ownerCore(userId, id);
  if (core.closedAt) return;
  await prisma.cohort.update({ where: { id }, data: { closedAt: new Date() } });
  forgetCohort(id);
}

/**
 * Leave a cohort. The owner leaving hands it to the member who joined
 * earliest (lib/cohorts successorOf); the last one out closes it, so a
 * cohort never sits ownerless.
 */
export async function leaveCohort(userId: string, id: string): Promise<void> {
  const core = await memberCore(userId, id);
  await departOne(userId, core.id);
}

async function departOne(userId: string, cohortId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM Cohort WHERE id = ${cohortId} FOR UPDATE`;
    const cohort = await tx.cohort.findUnique({ where: { id: cohortId }, select: { ownerId: true, members: { select: { userId: true, joinedAt: true } } } });
    if (!cohort) return;
    if (cohort.ownerId === userId) {
      const next = successorOf(cohort.members, userId);
      if (next) await tx.cohort.update({ where: { id: cohortId }, data: { ownerId: next } });
      // The last one out: nobody to hand it to. The row stays (its owner
      // column has to name someone), closed — and goes with the account.
      else await tx.cohort.update({ where: { id: cohortId }, data: { closedAt: new Date() } });
    }
    await tx.cohortMember.deleteMany({ where: { cohortId, userId } });
  });
  forgetCohort(cohortId);
}

/**
 * Before an account is deleted (services/account.ts): every cohort it owns
 * passes to its longest-standing member, as if the owner had left — the
 * owner relation cascades, and without this a deletion would take seven
 * other people's cohort with it.
 */
export async function departAllCohorts(userId: string): Promise<void> {
  const rows = await prisma.cohortMember.findMany({ where: { userId }, select: { cohortId: true } });
  for (const r of rows) await departOne(userId, r.cohortId);
}

// ── Sessions ──────────────────────────────────────────────────────

/** Start a session: a private four-seat pair room on a coding problem, kept out of the lobby, joined by membership. */
export async function startSession(userId: string, id: string, body: unknown): Promise<{ roomId: string }> {
  const core = await memberCore(userId, id);
  if (core.closedAt) throw CLOSED();
  const slug = (body as Record<string, unknown> | null)?.["slug"];
  if (typeof slug !== "string" || !slug) throw new CohortError("Pick the problem to solve together.", 400);
  const problem = await prisma.problem.findFirst({ where: { slug, isPublished: true }, select: { id: true } });
  if (!problem) throw new CohortError("A group session runs on a coding problem, and that one is not in the catalogue.", 404);
  const live = await liveSessions(id, userId, core.people);
  if (live.length >= COHORT_LIMITS.liveSessions) {
    throw new CohortError(`Your cohort already has ${COHORT_LIMITS.liveSessions} sessions running. Join one of them, or wait for one to end.`, 409);
  }
  try {
    const room = await openPairRoom(userId, { problemId: problem.id, mode: "private", seats: SESSION_SEATS, include: {} });
    await prisma.cohortSession.create({ data: { cohortId: id, roomId: room.id, startedBy: userId } });
    return { roomId: room.id };
  } catch (err) {
    if (err instanceof PairRoomError) throw new CohortError(err.message, err.status);
    throw err;
  }
}

/**
 * Take a seat in one of the cohort's live sessions. Membership is the
 * passcode; someone the host removed from the room needs the host's
 * recovery code, which the room's own join asks for.
 */
export async function joinSession(userId: string, id: string, sessionId: string): Promise<{ roomId: string }> {
  const core = await memberCore(userId, id);
  const session = await prisma.cohortSession.findFirst({
    where: { id: sessionId, cohortId: id },
    select: { roomId: true, room: { select: { status: true, startedAt: true, maxParticipants: true, kickedUserIds: true, recoveryCode: true } } },
  });
  if (!session || core.closedAt || !sessionLive(session.room, await socketsInRoom(session.roomId))) {
    throw new CohortError("That session has ended. Start another from the cohort's page.", 410);
  }
  if (kickedUserIdsOf(session.room.kickedUserIds).includes(userId) && decodeCode(session.room.recoveryCode)) {
    throw new CohortError("The host removed you from this session. Ask them for the room's recovery code.", 403);
  }
  const claim = await seatInRoom(session.roomId, userId, session.room.maxParticipants);
  if (claim === "full") throw new CohortError(`That session is full: a pair room seats ${SESSION_SEATS}. Start a second one for the rest of the cohort.`, 409);
  return { roomId: session.roomId };
}

// ── Read by the mission and the digest ────────────────────────────

export interface CohortMissionGoal {
  name: string;
  skillLabel: string;
  solved: number;
  target: number;
  /** The practice set's items this account has not solved, in the set's order. */
  items: Array<Pick<PracticeItem, "source" | "ref" | "slug" | "title" | "href" | "difficulty" | "skill">>;
}

/**
 * The week's cohort goal for today's mission (lib/mission.ts `cohort`): the
 * first open cohort with a goal this account has not met, and the practice
 * items it still has to do. Null otherwise — and cheap then: one indexed
 * count for an account in no cohort.
 */
export async function cohortGoalFor(userId: string): Promise<CohortMissionGoal | null> {
  const rows = await prisma.cohortMember.findMany({ where: { userId, cohort: { closedAt: null } }, orderBy: { joinedAt: "asc" }, select: { cohortId: true } });
  for (const r of rows) {
    const core = await coreOf(r.cohortId);
    const mine = core?.progress?.members.find((m) => m.userId === userId);
    if (!core?.goal || !mine || mine.met) continue;
    const items = core.practice.filter((p) => !p.solvers.includes(userId)).map(({ source, ref, slug, title, href, difficulty, skill }) => ({ source, ref, slug, title, href, difficulty, skill }));
    if (!items.length) continue;
    return { name: core.name, skillLabel: core.goal.skills.map((k) => skillOf(k).label).join(" & "), solved: mine.solved, target: mine.target, items };
  }
  return null;
}

/**
 * The digest's cohort line for a batch of recipients, in one query: the
 * week's goal of their first open cohort that has one. The goal, not the
 * progress — the digest goes to everyone at once, and progress is one click
 * away on the cohort's page.
 */
export async function cohortDigestLines(userIds: string[]): Promise<Map<string, { text: string; href: string }>> {
  const rows = await prisma.cohortMember.findMany({
    where: { userId: { in: userIds }, cohort: { closedAt: null } },
    orderBy: { joinedAt: "asc" },
    select: { userId: true, cohort: { select: { id: true, name: true, goalSkills: true, goalTarget: true } } },
  });
  const out = new Map<string, { text: string; href: string }>();
  for (const r of rows) {
    if (out.has(r.userId)) continue;
    const skills = readGoalSkills(r.cohort.goalSkills);
    if (!skills.length) continue;
    out.set(r.userId, {
      text: `Your cohort ${r.cohort.name} is on ${skills.map((k) => skillOf(k).label).join(" & ")} this week: ${r.cohort.goalTarget} ${r.cohort.goalTarget === 1 ? "solve" : "solves"} each.`,
      href: `/cohorts/${r.cohort.id}`,
    });
  }
  return out;
}

/**
 * Battles ICPC-style contests: the room a team works in, the attempts the
 * judge records for it, and the standings. The scoring rules are pure and
 * live in contest-rules.ts; this file loads rows and applies them.
 *
 * Attempts are ordinary /api/submit calls (routes/execution.ts): the judge,
 * the Submission row, XP, streak, roadmap and notifications are the same as
 * anywhere on CodeKairo — tournament solves count on the main profile by
 * decision — and `recordTournamentSubmission` is the one extra step, taken
 * before the response like the daily contest's, so the room's next read of
 * its submissions already has the verdict.
 */
import { prisma } from "../lib/prisma.js";
import { cached, invalidate } from "../lib/cache.js";
import { BattlesError } from "./battles-error.js";
import { computeStandings, contestState, endsAt, freezeAt, problemLetter, type ContestVerdict, type ContestWindow } from "./contest-rules.js";

/** The judge's verdicts in contest terms. Anything unlisted (an engine failure never gets this far) is not recorded. */
export const VERDICTS: Record<string, ContestVerdict> = {
  ACCEPTED: "accepted",
  WRONG_ANSWER: "wrong_answer",
  TIME_LIMIT_EXCEEDED: "time_limit",
  RUNTIME_ERROR: "runtime_error",
  COMPILATION_ERROR: "compile_error",
};

const MANAGER_ROLES = ["owner", "admin"];
/** Long enough that a room full of polling clients is one query every few seconds; short enough to feel live. */
const STANDINGS_TTL_MS = 5_000;
const standingsKey = (tournamentId: string) => `battles:standings:${tournamentId}`;

const windowOf = (t: { startsAt: Date; durationMinutes: number; freezeMinutes: number }): ContestWindow => ({
  startsAt: t.startsAt,
  durationMinutes: t.durationMinutes,
  freezeMinutes: t.freezeMinutes,
});

/**
 * Called by the judge for every submission (routes/execution.ts). One indexed
 * read for a user in no contest; otherwise a row per live ICPC contest the
 * user's team is entered in that has this problem, and that contest's
 * cached standings dropped. Returns the contests it counted for.
 */
export async function recordTournamentSubmission(
  userId: string,
  problemId: string,
  submissionId: string,
  judgeVerdict: string,
  at: Date,
): Promise<{ tournamentId: string; slug: string }[] | null> {
  const verdict = VERDICTS[judgeVerdict];
  if (!verdict) return null;
  const entries = await prisma.tournamentEntry.findMany({
    where: {
      userId,
      status: "approved",
      teamId: { not: null },
      tournament: { format: "icpc", status: "published", startsAt: { lte: at }, problems: { some: { problemId } } },
    },
    select: { teamId: true, tournament: { select: { id: true, slug: true, startsAt: true, durationMinutes: true, freezeMinutes: true } } },
  });
  const live = entries.filter((e) => at < endsAt(windowOf(e.tournament)));
  if (live.length === 0) return null;
  // One Submission belongs to one contest row (submissionId is unique): in
  // the rare case of two live contests sharing the problem, the first counts.
  const e = live[0]!;
  await prisma.tournamentSubmission.create({
    data: { tournamentId: e.tournament.id, teamId: e.teamId!, userId, problemId, submissionId, verdict, submittedAt: at },
  });
  invalidate(standingsKey(e.tournament.id));
  return [{ tournamentId: e.tournament.id, slug: e.tournament.slug }];
}

async function loadContest(tournamentId: string) {
  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      id: true,
      slug: true,
      title: true,
      format: true,
      status: true,
      orgId: true,
      startsAt: true,
      durationMinutes: true,
      freezeMinutes: true,
      resultsRevealedAt: true,
      org: { select: { name: true, verifiedAt: true } },
    },
  });
  if (!t || t.format !== "icpc") throw new BattlesError(404, "No such contest.");
  return t;
}

async function isManager(userId: string | null, orgId: string): Promise<boolean> {
  if (!userId) return false;
  const m = await prisma.battleOrgMember.findUnique({ where: { orgId_userId: { orgId, userId } }, select: { role: true } });
  return !!m && MANAGER_ROLES.includes(m.role);
}

function contestHeader(t: Awaited<ReturnType<typeof loadContest>>, now: Date) {
  const w = windowOf(t);
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    orgName: t.org.name,
    startsAt: t.startsAt,
    endsAt: endsAt(w),
    freezeAt: freezeAt(w),
    state: contestState(w, now),
    revealed: t.resultsRevealedAt !== null,
    serverNow: now,
  };
}

/**
 * The contest room: the problem set (only from the start), the caller's
 * team, and that team's attempts. Entered team members and the org's
 * organizers may open it; everyone else is refused.
 */
export async function contestRoom(userId: string, tournamentId: string) {
  const t = await loadContest(tournamentId);
  const [entry, manager] = await Promise.all([
    prisma.tournamentEntry.findUnique({
      where: { tournamentId_userId: { tournamentId: t.id, userId } },
      select: { status: true, team: { select: { id: true, name: true } } },
    }),
    isManager(userId, t.orgId),
  ]);
  if (!manager && (t.status === "draft" || !t.org.verifiedAt)) throw new BattlesError(404, "No such contest.");
  const team = entry?.status === "approved" ? entry.team : null;
  if (!team && !manager) throw new BattlesError(403, "Only teams entered in this contest can open its room.");
  if (t.status === "cancelled") throw new BattlesError(409, "This contest was cancelled.");

  const now = new Date();
  const header = contestHeader(t, now);
  const started = header.state !== "before";
  const [problems, submissions] = await Promise.all([
    started
      ? prisma.tournamentProblem.findMany({
          where: { tournamentId: t.id },
          orderBy: { position: "asc" },
          select: { position: true, problem: { select: { id: true, slug: true, title: true, difficulty: true } } },
        })
      : Promise.resolve([]),
    team
      ? prisma.tournamentSubmission.findMany({
          where: { teamId: team.id },
          orderBy: { submittedAt: "desc" },
          take: 300,
          select: { id: true, problemId: true, verdict: true, submittedAt: true, user: { select: { username: true, name: true } } },
        })
      : Promise.resolve([]),
  ]);
  const letterOf = new Map(problems.map((p) => [p.problem.id, problemLetter(p.position)]));
  return {
    contest: header,
    team,
    canManage: manager,
    problems: problems.map((p) => ({ letter: problemLetter(p.position), ...p.problem })),
    submissions: submissions.map((s) => ({
      id: s.id,
      letter: letterOf.get(s.problemId) ?? "?",
      problemId: s.problemId,
      verdict: s.verdict,
      submittedAt: s.submittedAt,
      by: s.user.username || s.user.name || "Teammate",
    })),
  };
}

/**
 * The scoreboard, from the start on, to anyone who may read the tournament
 * (organizers before it is public too). Computed from every attempt and
 * cached for a few seconds — the same board for every reader, so a room of
 * pollers costs one computation per interval.
 */
export async function contestStandings(tournamentId: string, viewerId: string | null) {
  const t = await loadContest(tournamentId);
  const manager = await isManager(viewerId, t.orgId);
  if (!manager && (t.status === "draft" || !t.org.verifiedAt)) throw new BattlesError(404, "No such contest.");
  const now = new Date();
  const header = contestHeader(t, now);
  if (header.state === "before") throw new BattlesError(409, "The scoreboard opens when the contest starts.");

  const board = await cached(standingsKey(t.id), STANDINGS_TTL_MS, async () => {
    const [teams, problems, submissions] = await Promise.all([
      prisma.tournamentTeam.findMany({ where: { tournamentId: t.id }, select: { id: true, name: true } }),
      prisma.tournamentProblem.findMany({
        where: { tournamentId: t.id },
        orderBy: { position: "asc" },
        select: { position: true, problem: { select: { id: true, title: true } } },
      }),
      prisma.tournamentSubmission.findMany({
        where: { tournamentId: t.id, teamId: { not: null } },
        select: { teamId: true, problemId: true, verdict: true, submittedAt: true },
      }),
    ]);
    const rows = computeStandings({
      window: windowOf(t),
      teams,
      problemIds: problems.map((p) => p.problem.id),
      submissions: submissions.map((s) => ({ teamId: s.teamId!, problemId: s.problemId, verdict: s.verdict as ContestVerdict, at: s.submittedAt })),
      revealed: t.resultsRevealedAt !== null,
    });
    return { problems: problems.map((p) => ({ id: p.problem.id, letter: problemLetter(p.position), title: p.problem.title })), rows, computedAt: new Date() };
  });
  return { contest: header, ...board };
}

/** Lift the freeze and publish the final standings. Organizers only, once the contest has ended. */
export async function revealResults(userId: string, tournamentId: string) {
  const t = await loadContest(tournamentId);
  if (!(await isManager(userId, t.orgId))) throw new BattlesError(404, "No such contest.");
  if (contestState(windowOf(t), new Date()) !== "ended") throw new BattlesError(409, "Results can be revealed once the contest has ended.");
  if (!t.resultsRevealedAt) await prisma.tournament.update({ where: { id: t.id }, data: { resultsRevealedAt: new Date() } });
  invalidate(standingsKey(t.id));
  return { ok: true };
}

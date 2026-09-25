/**
 * A player's Battles record, for the main CodeKairo site: which problems they
 * solved in a tournament (the catalogue's and the problem page's trophy
 * mark) and the tournaments they played, with where they finished (the
 * profile's Tournaments section, on the dashboard payload).
 *
 * Both formats record their attempts as TournamentSubmission rows — ICPC
 * with the team, a knockout match with none — so one table answers "solved
 * in a tournament" for either.
 */
import { prisma } from "../lib/prisma.js";
import { cached } from "../lib/cache.js";
import { computeStandings, contestState, endsAt, type ContestVerdict, type ContestWindow } from "./contest-rules.js";
import { placementLabel, roundName } from "./knockout-rules.js";

/** The first tournament this user solved `problemId` in, for the problem page's chip, or null. */
export async function tournamentSolveFor(userId: string, problemId: string) {
  const row = await prisma.tournamentSubmission.findFirst({
    where: { userId, problemId, verdict: "accepted" },
    orderBy: { submittedAt: "asc" },
    select: { submittedAt: true, tournament: { select: { slug: true, title: true, format: true, org: { select: { name: true } } } } },
  });
  return row
    ? { slug: row.tournament.slug, title: row.tournament.title, format: row.tournament.format, orgName: row.tournament.org.name, solvedAt: row.submittedAt }
    : null;
}

/**
 * An ICPC contest's final ranks by team, once they are final: the contest
 * has ended and its board is not frozen (revealed, or never froze). Cached a
 * while — final standings do not change.
 */
async function finalRanks(t: { id: string; startsAt: Date; durationMinutes: number; freezeMinutes: number; resultsRevealedAt: Date | null }) {
  const w: ContestWindow = { startsAt: t.startsAt, durationMinutes: t.durationMinutes, freezeMinutes: t.freezeMinutes };
  if (contestState(w, new Date()) !== "ended") return null;
  if (t.freezeMinutes > 0 && !t.resultsRevealedAt) return null;
  return cached(`battles:final:${t.id}`, 10 * 60_000, async () => {
    const [teams, problems, subs] = await Promise.all([
      prisma.tournamentTeam.findMany({ where: { tournamentId: t.id }, select: { id: true, name: true } }),
      prisma.tournamentProblem.findMany({ where: { tournamentId: t.id }, select: { problemId: true } }),
      prisma.tournamentSubmission.findMany({ where: { tournamentId: t.id, teamId: { not: null } }, select: { teamId: true, problemId: true, verdict: true, submittedAt: true } }),
    ]);
    const rows = computeStandings({
      window: w,
      teams,
      problemIds: problems.map((p) => p.problemId),
      submissions: subs.map((s) => ({ teamId: s.teamId!, problemId: s.problemId, verdict: s.verdict as ContestVerdict, at: s.submittedAt })),
      revealed: true,
    });
    return { of: rows.length, byTeam: Object.fromEntries(rows.map((r) => [r.teamId, { rank: r.rank, solved: r.solved }])) };
  });
}

export interface TournamentRecordRow {
  slug: string;
  title: string;
  orgName: string;
  format: string;
  startsAt: Date;
  team: string | null;
  /** upcoming | live | finished */
  state: "upcoming" | "live" | "finished";
  /** "Champion", "Semifinalist", "Rank 3 of 40" — or null while it is not known yet. */
  placement: string | null;
  /** A top-three finish, for the trophy styling. */
  podium: boolean;
}

/** The tournaments a player took part in, newest first, with where they finished. */
export async function tournamentsFor(userId: string): Promise<TournamentRecordRow[]> {
  const entries = await prisma.tournamentEntry.findMany({
    where: { userId, status: "approved", tournament: { status: "published" } },
    orderBy: { tournament: { startsAt: "desc" } },
    take: 20,
    select: {
      teamId: true,
      checkedInAt: true,
      team: { select: { name: true } },
      tournament: {
        select: {
          id: true,
          slug: true,
          title: true,
          format: true,
          startsAt: true,
          durationMinutes: true,
          freezeMinutes: true,
          resultsRevealedAt: true,
          bracketAt: true,
          finishedAt: true,
          championId: true,
          org: { select: { name: true } },
        },
      },
    },
  });
  const now = new Date();

  return Promise.all(
    entries.map(async (e): Promise<TournamentRecordRow> => {
      const t = e.tournament;
      const base = { slug: t.slug, title: t.title, orgName: t.org.name, format: t.format, startsAt: t.startsAt, team: e.team?.name ?? null };
      if (t.startsAt > now) return { ...base, state: "upcoming", placement: null, podium: false };

      if (t.format === "icpc") {
        const ended = now >= endsAt({ startsAt: t.startsAt, durationMinutes: t.durationMinutes, freezeMinutes: t.freezeMinutes });
        const ranks = e.teamId ? await finalRanks(t) : null;
        const mine = ranks && e.teamId ? ranks.byTeam[e.teamId] : undefined;
        return {
          ...base,
          state: ended ? "finished" : "live",
          placement: mine ? `Rank ${mine.rank} of ${ranks!.of} · ${mine.solved} solved` : ended ? "Results pending" : null,
          podium: !!mine && mine.rank <= 3,
        };
      }

      // Knockout: how far this player got.
      if (!e.checkedInAt && t.bracketAt) return { ...base, state: t.finishedAt ? "finished" : "live", placement: "Did not check in", podium: false };
      const matches = await prisma.tournamentMatch.findMany({
        where: { tournamentId: t.id, OR: [{ playerAId: userId }, { playerBId: userId }] },
        orderBy: { round: "desc" },
        select: { round: true, status: true, winnerId: true },
      });
      const rounds = t.bracketAt ? ((await prisma.tournamentMatch.aggregate({ where: { tournamentId: t.id }, _max: { round: true } }))._max.round ?? 0) : 0;
      const last = matches[0];
      if (t.championId === userId) return { ...base, state: "finished", placement: "Champion", podium: true };
      if (!last || rounds === 0) return { ...base, state: t.finishedAt ? "finished" : "live", placement: null, podium: false };
      const out = last.status === "done" && last.winnerId !== userId;
      if (!out) return { ...base, state: "live", placement: `In the ${roundName(last.round, rounds)}`, podium: false };
      const label = placementLabel(last.round, false, rounds);
      return { ...base, state: t.finishedAt ? "finished" : "live", placement: label, podium: last.round >= rounds - 1 };
    }),
  );
}

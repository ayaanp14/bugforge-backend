import { prisma } from "../lib/prisma.js";
import { cached } from "../lib/cache.js";
import { COMPANY_TAGS } from "../lib/companies.js";
import { wrappedOf, yearBounds, type Wrapped, type WrappedProblem } from "../lib/wrapped.js";
import { SAT_ROUND } from "./entitlements.js";

/**
 * CodeKairo Wrapped (lib/wrapped.ts has the rules): one parallel round of
 * narrow reads over the account's year — never a submission's code — then
 * one read of the problems it touched. Cached ten minutes per account and
 * year: until 31 December the slides say "so far", and a solve showing up a
 * few minutes late on a recap is fine.
 *
 * The one cross-account read, every account's first-solve count for the
 * year (for "top N%"), is a single GROUP BY on ProblemSolve shared by every
 * caller and held ten minutes.
 */

const TTL_MS = 10 * 60_000;
/** A year of a very busy account is a few thousand rows; past this the recap is no less true. */
const ROW_CAP = 20_000;
const COMPANY_SET: ReadonlySet<string> = new Set(COMPANY_TAGS);
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

function solverCounts(year: number): Promise<number[]> {
  return cached(`wrapped:solvers:${year}`, TTL_MS, async () => {
    const rows = await prisma.problemSolve.groupBy({ by: ["userId"], where: { submittedAt: yearBounds(year) }, _count: { _all: true } });
    return rows.map((r) => r._count._all);
  });
}

export function wrappedFor(userId: string, year: number): Promise<Wrapped> {
  return cached(`wrapped:v1:${userId}:${year}`, TTL_MS, async () => {
    const range = yearBounds(year);
    const [submissions, solves, sqlRows, bugRows, sqlSolved, huntsFixed, duelRows, interviewsSat, counts] = await Promise.all([
      prisma.submission.findMany({
        where: { userId, submittedAt: range },
        orderBy: { submittedAt: "asc" },
        take: ROW_CAP,
        select: { problemId: true, verdict: true, language: true, submittedAt: true },
      }),
      prisma.problemSolve.findMany({ where: { userId, submittedAt: range }, take: ROW_CAP, select: { problemId: true, submittedAt: true } }),
      prisma.sqlSubmission.findMany({ where: { userId, submittedAt: range }, take: ROW_CAP, select: { verdict: true, submittedAt: true } }),
      prisma.bugSubmission.findMany({ where: { userId, submittedAt: range }, take: ROW_CAP, select: { verdict: true, submittedAt: true } }),
      prisma.sqlSolve.count({ where: { userId, submittedAt: range } }),
      prisma.bugSubmission.findMany({ where: { userId, verdict: "ACCEPTED", submittedAt: range }, distinct: ["challengeId"], select: { challengeId: true } }).then((r) => r.length),
      prisma.duelParticipant.findMany({
        where: { userId, duel: { status: "finished", endedAt: range } },
        select: { team: true, duel: { select: { winnerTeam: true } } },
      }),
      prisma.mockInterviewSession.count({ where: { userId, createdAt: range, ...SAT_ROUND } }),
      solverCounts(year),
    ]);

    const ids = [...new Set([...submissions.map((s) => s.problemId), ...solves.map((s) => s.problemId)])];
    const problems = ids.length
      ? await prisma.problem.findMany({ where: { id: { in: ids } }, select: { id: true, title: true, slug: true, difficulty: true, tags: true } })
      : [];
    const byId = new Map<string, WrappedProblem>(
      // The catalogue stores "EASY"; the rules and the slides speak "Easy".
      problems.map((p) => [p.id, { title: p.title, slug: p.slug, difficulty: titleCase(p.difficulty), tags: Array.isArray(p.tags) ? (p.tags as string[]) : [] }]),
    );

    return wrappedOf({
      year,
      now: new Date(),
      submissions: submissions.map((s) => ({ problemId: s.problemId, verdict: s.verdict, language: s.language, at: s.submittedAt })),
      otherActivity: [
        ...sqlRows.map((r) => ({ at: r.submittedAt, accepted: r.verdict === "ACCEPTED" })),
        ...bugRows.map((r) => ({ at: r.submittedAt, accepted: r.verdict === "ACCEPTED" })),
      ],
      firstSolves: solves.map((s) => ({ problemId: s.problemId, at: s.submittedAt })),
      problems: byId,
      companyTags: COMPANY_SET,
      sqlSolved,
      huntsFixed,
      duels: { played: duelRows.length, won: duelRows.filter((d) => d.duel.winnerTeam != null && d.duel.winnerTeam === d.team).length },
      interviewsSat,
      solverCounts: counts,
    });
  });
}

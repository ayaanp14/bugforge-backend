import { prisma } from "../lib/prisma.js";

/**
 * What one account has solved, for the admin panel's user detail: every
 * problem with an accepted submission and every bug hunt fixed, newest solve
 * first, each with how many submissions the account made to it.
 *
 * "Solved" is the product's one definition — an ACCEPTED submission
 * (services/dashboard.ts, countSolved) — read from the submissions rather than
 * the UserStats counters, which only follow it. Unlike the dashboard this
 * also lists problems that have since been unpublished, flagged, because the
 * admin is asking what the person did, not what the catalogue shows today.
 */

/** Accepted rows read per list. A ceiling for a pathological history, far above any real one. */
const ACCEPTED_ROW_CAP = 5_000;

export interface SolvedProblem {
  slug: string;
  title: string;
  difficulty: string;
  published: boolean;
  /** The first accepted submission. */
  solvedAt: Date;
  /** Every language it was accepted in, in the order they were first used. */
  languages: string[];
  /** All of the account's submissions to it, any verdict, before or after the solve. */
  submissions: number;
}

export interface FixedBug {
  id: string;
  /** Null only on a database that predates the slug backfill; the hunt is then linked by id. */
  slug: string | null;
  title: string;
  difficulty: string;
  language: string;
  category: string;
  /** The first accepted fix. */
  fixedAt: Date;
  /** How long that first fix took, as the workspace timed it. */
  timeTakenSecs: number | null;
  submissions: number;
}

export interface FirstSolve<R> {
  first: R;
  languages: string[];
  submissions: number;
}

/**
 * Accepted rows, oldest first, folded to one entry per key: the first row is
 * the solve, later ones only add a language. Returned newest solve first.
 * `submissions` comes from a separate all-verdict count and falls back to the
 * accepted rows seen, so it can never read lower than the solves themselves.
 */
export function firstSolves<R extends { submittedAt: Date }>(
  acceptedOldestFirst: R[],
  keyOf: (row: R) => string,
  languageOf: (row: R) => string,
  submissionCounts: Map<string, number>,
): FirstSolve<R>[] {
  const byKey = new Map<string, FirstSolve<R> & { accepted: number }>();
  for (const row of acceptedOldestFirst) {
    const key = keyOf(row);
    const seen = byKey.get(key);
    const language = languageOf(row);
    if (seen) {
      seen.accepted++;
      if (!seen.languages.includes(language)) seen.languages.push(language);
      continue;
    }
    byKey.set(key, { first: row, languages: [language], submissions: 0, accepted: 1 });
  }
  return [...byKey.entries()]
    .map(([key, s]) => ({ first: s.first, languages: s.languages, submissions: Math.max(submissionCounts.get(key) ?? 0, s.accepted) }))
    .sort((a, b) => b.first.submittedAt.getTime() - a.first.submittedAt.getTime());
}

/**
 * Four reads in parallel, each on an index the tables already carry:
 * accepted rows on (userId, verdict, submittedAt), the per-item counts on
 * (userId, problemId|challengeId, submittedAt). The titles come with the
 * accepted rows (Prisma batches them into one IN query per relation).
 */
export async function solvedBy(userId: string): Promise<{ problems: SolvedProblem[]; bugs: FixedBug[] }> {
  const [accepted, problemCounts, fixed, bugCounts] = await Promise.all([
    prisma.submission.findMany({
      where: { userId, verdict: "ACCEPTED" },
      orderBy: { submittedAt: "asc" },
      take: ACCEPTED_ROW_CAP,
      select: {
        problemId: true,
        language: true,
        submittedAt: true,
        problem: { select: { slug: true, title: true, difficulty: true, isPublished: true } },
      },
    }),
    prisma.submission.groupBy({ by: ["problemId"], where: { userId }, _count: { _all: true } }),
    prisma.bugSubmission.findMany({
      where: { userId, verdict: "ACCEPTED" },
      orderBy: { submittedAt: "asc" },
      take: ACCEPTED_ROW_CAP,
      select: {
        challengeId: true,
        submittedAt: true,
        timeTakenSecs: true,
        challenge: { select: { slug: true, title: true, difficulty: true, language: true, category: true } },
      },
    }),
    prisma.bugSubmission.groupBy({ by: ["challengeId"], where: { userId }, _count: { _all: true } }),
  ]);

  const problems = firstSolves(
    accepted,
    (s) => s.problemId,
    (s) => s.language,
    new Map(problemCounts.map((r) => [r.problemId, r._count._all])),
  ).map(({ first, languages, submissions }) => ({
    slug: first.problem.slug,
    title: first.problem.title,
    difficulty: first.problem.difficulty,
    published: first.problem.isPublished,
    solvedAt: first.submittedAt,
    languages,
    submissions,
  }));

  const bugs = firstSolves(
    fixed,
    (b) => b.challengeId,
    (b) => b.challenge.language,
    new Map(bugCounts.map((r) => [r.challengeId, r._count._all])),
  ).map(({ first, submissions }) => ({
    id: first.challengeId,
    slug: first.challenge.slug,
    title: first.challenge.title,
    difficulty: first.challenge.difficulty,
    language: first.challenge.language,
    category: first.challenge.category,
    fixedAt: first.submittedAt,
    timeTakenSecs: first.timeTakenSecs,
    submissions,
  }));

  return { problems, bugs };
}

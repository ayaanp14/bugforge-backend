import { prisma } from "./prisma.js";
import { isDuplicateKey, withLockRetry } from "./seat-claim.js";
import type { SolveStreak } from "./activity.js";

export type { SolveStreak } from "./activity.js";

/**
 * Paying a solver for a problem, exactly once.
 *
 * "Has this account solved this problem before" is not a question
 * `Submission` can answer atomically — it holds every attempt, so two accepted
 * submissions arriving together (two tabs, a double-click that beat the
 * button) both saw no prior accept and both were paid. The payout therefore
 * used to lock the solver's `User` row with `SELECT ... FOR UPDATE` and ask
 * again underneath it: correct, but a per-user mutex held across a read and
 * three writes, which every other write to that account queued behind —
 * a duel payout, a roadmap chest, a profile save.
 *
 * `ProblemSolve` makes the claim itself the invariant. Its unique
 * (userId, problemId) means the first insert wins and every later one is a
 * duplicate-key error, so the database decides who is paid and no row is
 * locked in advance. The claim and the money live in one transaction, so a
 * failure anywhere takes both back: there is no state in which an account is
 * recorded as paid without being paid, or paid without being recorded.
 *
 * The insert is deliberately not preceded by a check. Reading first and
 * inserting if absent would rebuild exactly the race this replaces — the
 * duplicate key has to be the signal, which is why it is classified rather
 * than caught blindly (`isDuplicateKey` walks the whole error, because a
 * duplicate raised through raw SQL arrives as P2010, not P2002).
 *
 * Two accounts claiming different problems at the same moment, or the same
 * account racing itself, can collide on the unique index and be broken apart
 * by the engine as a deadlock rather than a duplicate — measured, not
 * assumed: concurrent claims surface as P2034 / errno 1213 a good deal of the
 * time. A deadlocked transaction wrote nothing, so retrying it is safe and
 * settles into the ordinary answer: whoever gets there second finds the claim
 * taken and is not paid. The retry is bounded and only covers genuinely
 * transient lock failures — never a duplicate key, never an application error.
 *
 * SQL problems (routes/sql.ts) are paid through the same transaction since
 * 2026-10-05, claiming `SqlSolve` (unique userId, slug) instead: before, they
 * paid XP in a copy of it that only stamped `lastActive`, which also made the
 * day read as already counted to a coding solve later that day. Both now move
 * the solving streak the same way — only in the transaction that won its
 * claim, so a second accept of the same problem never touches it, and as the
 * absolute values `nextStreak` (lib/activity.ts) computed, so two solves of
 * different problems on one day write the same number rather than adding
 * twice. Only a coding solve moves `problemsSolved`; the SQL count is derived
 * from `SqlSolve` (lib/activity.ts sqlSolveTally).
 *
 * Returns true when this call is the one that paid.
 */
export type SolveClaim = { problemId: string } | { sqlSlug: string };

export async function claimFirstSolve(
  userId: string,
  claim: SolveClaim,
  submittedAt: Date,
  prize: number,
  streak: SolveStreak,
): Promise<boolean> {
  const coding = "problemId" in claim;
  return withLockRetry(coding ? "claimFirstSolve" : "claimSqlSolve", async () => {
    try {
      await prisma.$transaction(async (tx) => {
        if ("problemId" in claim) {
          await tx.problemSolve.create({
            data: { userId, problemId: claim.problemId, submittedAt },
            select: { id: true },
          });
        } else {
          await tx.sqlSolve.create({
            data: { userId, slug: claim.sqlSlug, submittedAt },
            select: { id: true },
          });
        }
        await tx.userStats.upsert({
          where: { userId },
          update: {
            ...(coding ? { problemsSolved: { increment: 1 } } : {}),
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            lastActive: new Date(),
          },
          create: {
            userId,
            problemsSolved: coding ? 1 : 0,
            currentStreak: 1,
            longestStreak: 1,
            lastActive: new Date(),
          },
        });
        // The `User` row goes last on purpose. An exclusive row lock is taken
        // when the row is written and held until COMMIT, so anything else
        // landing on this account — a duel payout, a roadmap chest, a profile
        // save — waits for whatever still follows inside the transaction.
        // Writing it immediately before the commit is the shortest that hold
        // can be without giving up atomicity.
        await tx.user.update({
          where: { id: userId },
          data: {
            xp: { increment: prize },
            questionsXp: { increment: prize },
            // Rating climbs with every first solve — powers the tier bar.
            rating: { increment: prize },
          },
        });
      });
      return true;
    } catch (err) {
      // Someone — possibly this account a moment ago — already holds the
      // claim. Solving again is not an error, it just does not pay.
      if (!isDuplicateKey(err)) throw err;
      return false;
    }
  });
}

import { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";

/**
 * Problem numbers ("1. Two Sum"), held in ProblemNumber (schema.prisma says
 * why that is a table of its own).
 *
 * Every problem without a number gets the next one, oldest first — createdAt,
 * then id, so problems seeded in the same millisecond still number the same
 * way on every database — after the highest number ever given. A number is
 * therefore never changed and never reused: a problem added later always goes
 * on the end, and an unpublished one keeps its number (the published list
 * simply skips it, as LeetCode's does).
 *
 * One statement assigns all of them, so it is all or nothing; two runs at
 * once (two instances booting, a seed beside the API) read the same highest
 * number, and the second one's insert then collides on the primary key and
 * changes nothing. It is retried, and by then the first has committed.
 *
 * Called at API boot (src/index.ts) — which is how an existing database gets
 * its numbers: the deploy that creates the table restarts the API, and the
 * boot numbers the catalogue — after the admin create route, and at the end
 * of scripts/seed-catalog.ts. With nothing to number it is one indexed read.
 */
export async function assignProblemNumbers(db: Pick<typeof prisma, "$executeRaw"> = prisma): Promise<number> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await db.$executeRaw(Prisma.sql`
        INSERT INTO ProblemNumber (number, problemId)
        SELECT base.n + ROW_NUMBER() OVER (ORDER BY p.createdAt, p.id), p.id
        FROM Problem p
        CROSS JOIN (SELECT COALESCE(MAX(number), 0) AS n FROM ProblemNumber) base
        LEFT JOIN ProblemNumber pn ON pn.problemId = p.id
        WHERE pn.problemId IS NULL`);
    } catch (err) {
      // P2010/1062: another run took the same numbers first. Anything else
      // (the table not created yet, the database away) is the caller's.
      const duplicate = /1062|Duplicate entry|P2002|Unique constraint/i.test(String((err as Error)?.message ?? err));
      if (!duplicate || attempt >= 3) throw err;
    }
  }
}

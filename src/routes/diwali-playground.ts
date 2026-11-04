import { Router } from "express";
import { cachedShared } from "../lib/cache.js";
import { FESTIVAL_WINDOW } from "../lib/festival.js";
import { browserCache } from "../lib/http-cache.js";
import { prisma } from "../lib/prisma.js";

/**
 * /api/diwali-playground: the one thing the playground asks the server, how
 * many solves have lit the Diya City. Temporary, like the page; removal steps
 * are in frontend/src/components/diwali-playground/README.md.
 *
 * A count and nothing else, so no account or name is involved. It counts what
 * lights a diya (lib/festival.ts): accepted coding submissions outside pair
 * rooms, and accepted SQL ones, inside the fest. SqlSubmission has no index
 * leading on the verdict, so this scans the table; two minutes in the shared
 * cache keeps that to a statement every two minutes on a small table.
 */
const router = Router();

async function solvesSoFar(): Promise<number> {
  const where = { verdict: "ACCEPTED", submittedAt: { gte: FESTIVAL_WINDOW.from, lt: FESTIVAL_WINDOW.until } };
  const [coding, sql] = await Promise.all([
    prisma.submission.count({ where: { ...where, roomId: null } }),
    prisma.sqlSubmission.count({ where }),
  ]);
  return coding + sql;
}

router.get("/city", browserCache(60, { shared: true }), async (_req, res) => {
  res.json({ solves: await cachedShared("diwali:city:v1", 120, solvesSoFar) });
});

export default router;

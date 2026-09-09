import { prisma } from "../lib/prisma.js";
import { cachedShared } from "../lib/cache.js";
import type { DrawableQuestion } from "../lib/mock-tests.js";

/**
 * Cached readers for the aptitude bank.
 *
 * Every row here is seeded content: it changes when someone runs
 * scripts/seed-aptitude.ts and at no other time. Three separate places used to
 * read it straight from the database on every request — the syllabus, one
 * question's neighbours, and the draw that builds a placement paper — and two
 * of those read all 1,169 rows to do it.
 *
 * They share one cache entry rather than one each, so the syllabus warming the
 * index also warms the paper draw.
 *
 * Nothing here is per-user. Progress, attempts and answer reveals stay live and
 * are laid over these by the caller.
 */

/** Every question's identity and classification — no prose, no answer key. */
export function questionIndex(): Promise<DrawableQuestion[]> {
  return cachedShared("aptitude:index:v1", 900, () =>
    prisma.aptitudeQuestion.findMany({ select: { id: true, topic: true, category: true, difficulty: true } }),
  );
}

/** The slugs of one topic in order — what "previous" and "next" are read from. */
export function topicOrder(topic: string): Promise<Array<{ slug: string }>> {
  return cachedShared(`aptitude:order:v1:${topic}`, 900, () =>
    prisma.aptitudeQuestion.findMany({ where: { topic }, orderBy: { orderIndex: "asc" }, select: { slug: true } }),
  );
}

/**
 * One question in full, answer key included.
 *
 * Caching the key is safe: what is cached and what is sent are different
 * things. Every caller still gates `answer`, `solution` and `approach` on an
 * attempt existing — the route does it for practice, and a sitting withholds
 * them until the paper is closed.
 */
export function questionBySlug(slug: string) {
  return cachedShared(`aptitude:q:v1:${slug}`, 900, () =>
    prisma.aptitudeQuestion.findUnique({ where: { slug } }),
  );
}

/**
 * The published problem catalogue, shaped for the paper draw.
 *
 * Read once per sitting started, and identical between them.
 */
export function codingPool(): Promise<DrawableQuestion[]> {
  return cachedShared("problems:draw-pool:v1", 600, async () => {
    const rows = await prisma.problem.findMany({
      where: { isPublished: true },
      select: { id: true, difficulty: true, tags: true },
    });
    return rows.map((row) => ({
      id: row.id,
      topic: "",
      category: "coding",
      difficulty: String(row.difficulty).toLowerCase(),
      tags: ((row.tags as string[]) ?? []).map(String),
    }));
  });
}

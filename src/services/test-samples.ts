import { prisma } from "../lib/prisma.js";
import { cached } from "../lib/cache.js";
import { APTITUDE_CANONICAL } from "../lib/aptitude-topics.js";
import type { DrawRule } from "../lib/mock-tests.js";

/**
 * Sample questions for a placement pattern's page (/tests/<slug>).
 *
 * Why: every result for "tcs nqt aptitude questions" lists questions with
 * their answers, and the pattern page showed none — a sitting summary, a
 * section table, a guide and a sign-in button (2026-10-01 SXO audit). The
 * samples are drawn from the public aptitude bank by each section's own
 * draw rules (its topics, or its category), so they are the kind of
 * question the paper asks, in roughly the paper's proportions. Nothing new
 * is disclosed: every question in the bank already has a public page with
 * its answer (/aptitude/q/<slug>), and the sample links to it. A sitting
 * still draws its own paper; a sample may come up in one, as any of the
 * bank's 1,100 questions may.
 *
 * Deterministic (a hash of the test and question slugs orders the pool),
 * so the page and its prerendered HTML show the same questions, and a
 * pattern keeps its samples between visits. Coding sections have none —
 * their questions are catalogue problems, linked from the guide.
 */

export interface SampleQuestion {
  slug: string;
  title: string;
  topic: string;
  /** Markdown, as the question's own page renders it. */
  prompt: string;
  options: string[];
  answer: number;
}

/** About a dozen: enough to show the paper's mix, short enough to scan. */
const SAMPLE_COUNT = 12;
const SAMPLE_TTL_MS = 60 * 60 * 1000;

/** FNV-1a: a stable order that differs per test. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function testSamples(slug: string): Promise<SampleQuestion[]> {
  return cached(`tests:samples:v1:${slug}`, SAMPLE_TTL_MS, async () => {
    const test = await prisma.mockTest.findFirst({
      where: { slug, published: true },
      select: { sections: { orderBy: { orderIndex: "asc" }, select: { kind: true, questionCount: true, blueprint: true } } },
    });
    const sections = (test?.sections ?? []).filter((s) => s.kind !== "coding" && s.questionCount > 0);
    const total = sections.reduce((n, s) => n + s.questionCount, 0);
    if (!total) return [];
    const picked: SampleQuestion[] = [];
    const seen = new Set<string>();
    for (const section of sections) {
      const rules = (section.blueprint ?? []) as unknown as DrawRule[];
      const topics = [...new Set(rules.flatMap((r) => r.topics ?? []))];
      const categories = [...new Set(rules.map((r) => r.category).filter((c): c is string => Boolean(c)))];
      if (!topics.length && !categories.length) continue;
      const pool = await prisma.aptitudeQuestion.findMany({
        where: topics.length ? { topic: { in: topics } } : { category: { in: categories } },
        select: { slug: true, title: true, topic: true, prompt: true, options: true, answer: true },
      });
      // Spread across the section's topics: one from each in turn, each
      // topic's questions in this test's hash order.
      const byTopic = new Map<string, typeof pool>();
      for (const q of pool) {
        if (q.slug in APTITUDE_CANONICAL || seen.has(q.slug)) continue;
        byTopic.set(q.topic, [...(byTopic.get(q.topic) ?? []), q]);
      }
      for (const list of byTopic.values()) list.sort((a, b) => hash(`${slug}:${a.slug}`) - hash(`${slug}:${b.slug}`));
      const queues = [...byTopic.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, list]) => list);
      const want = Math.max(1, Math.round((SAMPLE_COUNT * section.questionCount) / total));
      let taken = 0;
      while (taken < want && queues.some((q) => q.length)) {
        for (const queue of queues) {
          const q = queue.shift();
          if (!q || taken >= want) continue;
          seen.add(q.slug);
          picked.push({ slug: q.slug, title: q.title, topic: q.topic, prompt: q.prompt, options: Array.isArray(q.options) ? (q.options as unknown[]).map(String) : [], answer: q.answer });
          taken += 1;
        }
      }
    }
    return picked.slice(0, SAMPLE_COUNT + 3);
  });
}

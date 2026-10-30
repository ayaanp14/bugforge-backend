import { prisma } from "../lib/prisma.js";
import { cached } from "../lib/cache.js";
import type { DrawRule } from "../lib/mock-tests.js";
import { patternsByTopic, type PatternRef } from "../lib/pattern-syllabus.js";

/**
 * Which published placement patterns ask each aptitude topic (lib/pattern-syllabus):
 * an aptitude topic's page and its edge HTML list them, so "percentages" links to
 * the TCS NQT, Infosys and AMCAT patterns that draw it. Patterns change only with a
 * seed, so ten minutes in process is plenty.
 */
const TTL_MS = 10 * 60 * 1000;

export function patternsAskingTopics(): Promise<Map<string, PatternRef[]>> {
  return cached("tests:by-aptitude-topic:v1", TTL_MS, async () => {
    const tests = await prisma.mockTest.findMany({
      where: { published: true },
      select: { slug: true, name: true, company: true, sections: { select: { kind: true, blueprint: true } } },
      orderBy: { orderIndex: "asc" },
    });
    return patternsByTopic(tests.map((t) => ({ ...t, sections: t.sections.map((s) => ({ kind: s.kind, blueprint: (s.blueprint ?? []) as unknown as DrawRule[] })) })));
  });
}

/** The patterns that ask one topic; [] when none does or the read fails (a page never fails over a link list). */
export async function patternsAskingTopic(topicId: string): Promise<PatternRef[]> {
  try {
    return (await patternsAskingTopics()).get(topicId) ?? [];
  } catch {
    return [];
  }
}

/**
 * Aptitude question bank.
 *
 *   npx tsx scripts/seed-aptitude.ts --validate          # check the data, print coverage
 *   npx tsx scripts/seed-aptitude.ts --seed [--prune]    # upsert by slug; --prune deletes rows no longer in the data
 *
 * Rows are the catalogue, keyed by slug, so re-running is safe: an edited
 * question is updated in place and keeps its attempts.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { APTITUDE_TOPICS, aptitudeTopic } from "../src/lib/aptitude-topics.js";
import { APTITUDE_QUESTIONS } from "./aptitude-data/index.js";
import { uncoveredTopics, validateAptitudeSeed } from "./aptitude-data/types.js";

const args = process.argv.slice(2);
const wants = (flag: string) => args.includes(flag);

function report() {
  const problems = validateAptitudeSeed(APTITUDE_QUESTIONS);
  for (const p of problems) console.error(`  ✗ ${p.slug}: ${p.problem}`);
  const perTopic = new Map<string, { easy: number; medium: number; hard: number }>();
  for (const q of APTITUDE_QUESTIONS) {
    const row = perTopic.get(q.topic) ?? { easy: 0, medium: 0, hard: 0 };
    row[q.difficulty] += 1;
    perTopic.set(q.topic, row);
  }
  console.log(`${APTITUDE_QUESTIONS.length} questions across ${perTopic.size} of ${APTITUDE_TOPICS.length} topics`);
  for (const topic of APTITUDE_TOPICS) {
    const row = perTopic.get(topic.id);
    console.log(`  ${topic.id.padEnd(28)} ${row ? `${row.easy + row.medium + row.hard}  (e${row.easy} m${row.medium} h${row.hard})` : "—"}`);
  }
  const missing = uncoveredTopics(APTITUDE_QUESTIONS);
  if (missing.length) console.log(`uncovered: ${missing.join(", ")}`);
  return problems.length === 0;
}

async function seed() {
  const order = new Map<string, number>();
  let written = 0;
  for (const q of APTITUDE_QUESTIONS) {
    const index = order.get(q.topic) ?? 0;
    order.set(q.topic, index + 1);
    const category = aptitudeTopic(q.topic)!.category;
    const data = {
      category,
      topic: q.topic,
      title: q.title,
      prompt: q.prompt.trim(),
      options: q.options,
      answer: q.answer,
      difficulty: q.difficulty,
      hints: q.hints,
      solution: q.solution.trim(),
      approach: q.approach.trim(),
      tags: q.tags ?? [],
      timeTargetSec: q.timeTargetSec ?? 90,
      orderIndex: index,
    };
    await prisma.aptitudeQuestion.upsert({ where: { slug: q.slug }, update: data, create: { slug: q.slug, ...data } });
    written += 1;
  }
  console.log(`upserted ${written} questions`);

  if (wants("--prune")) {
    const keep = APTITUDE_QUESTIONS.map((q) => q.slug);
    const gone = await prisma.aptitudeQuestion.deleteMany({ where: { slug: { notIn: keep } } });
    console.log(`pruned ${gone.count} questions no longer in the data`);
  }
}

(async () => {
  const ok = report();
  if (!ok) {
    console.error("fix the problems above before seeding");
    process.exit(1);
  }
  if (wants("--seed")) await seed();
  await prisma.$disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Seeds the placement test patterns.
 *
 *   npx tsx scripts/seed-mock-tests.ts --validate
 *   npx tsx scripts/seed-mock-tests.ts --seed
 *
 * --validate checks the blueprints against the question bank and reports any
 * section the bank cannot fill, which is the failure that would otherwise only
 * show up as a short paper in front of a candidate.
 *
 * --seed upserts by slug and replaces each test's sections, so editing a
 * pattern and re-running is safe. Sittings already taken keep their own copy
 * of the paper and are unaffected.
 */
import { prisma } from "../src/lib/prisma.js";
import { MOCK_TESTS, totalDuration, totalQuestions, validateMockTests, type MockTestSeed } from "./mock-test-data/index.js";
import { aptitudeCategory, aptitudeTopic } from "../src/lib/aptitude-topics.js";
import { drawPaper, formatDuration, type DrawableQuestion } from "../src/lib/mock-tests.js";

const mode = process.argv.includes("--seed") ? "seed" : "validate";

const plansOf = (test: MockTestSeed) =>
  test.sections.map((section, index) => ({
    key: section.key,
    name: section.name,
    orderIndex: index,
    durationSec: section.durationSec,
    questionCount: section.questionCount,
    instructions: section.instructions ?? null,
    kind: (section.kind ?? "mcq") as "mcq" | "coding",
    marksPerQuestion: section.marksPerQuestion ?? 1,
    blueprint: section.blueprint,
  }));

async function main() {
  const problems = validateMockTests(MOCK_TESTS);

  const [pool, problemRows] = await Promise.all([
    prisma.aptitudeQuestion.findMany({ select: { id: true, topic: true, category: true, difficulty: true } }),
    prisma.problem.findMany({ where: { isPublished: true }, select: { id: true, difficulty: true, tags: true } }),
  ]);
  const codingPool: DrawableQuestion[] = problemRows.map((row) => ({
    id: row.id,
    topic: "",
    category: "coding",
    difficulty: String(row.difficulty).toLowerCase(),
    tags: ((row.tags as string[]) ?? []).map(String),
  }));

  console.log(`${MOCK_TESTS.length} patterns, ${pool.length} questions in the bank, ${codingPool.length} coding problems\n`);

  // Every rule must name something the pools actually know about, and every
  // section must be fillable. A draw is the honest test of both.
  for (const test of MOCK_TESTS) {
    for (const section of test.sections) {
      if (section.kind === "coding") continue;
      for (const rule of section.blueprint) {
        for (const topic of rule.topics ?? []) {
          if (!aptitudeTopic(topic)) problems.push(`${test.slug}/${section.key}: unknown topic "${topic}"`);
        }
        if (rule.category && !aptitudeCategory(rule.category)) {
          problems.push(`${test.slug}/${section.key}: unknown category "${rule.category}"`);
        }
      }
    }

    const { shortfalls } = drawPaper(plansOf(test), pool, Math.random, codingPool);
    for (const short of shortfalls) {
      problems.push(`${test.slug}/${short.key}: the pool is ${short.missing} question(s) short`);
    }

    const q = totalQuestions(test);
    const d = totalDuration(test);
    const coding = test.sections.filter((s) => s.kind === "coding").reduce((n, s) => n + s.questionCount, 0);
    const flags = [
      test.sectionalTiming === false ? "shared clock" : "sectional",
      test.negativeMark ? `−${test.negativeMark} per wrong` : "no negative marking",
      coding ? `${coding} coding` : "",
    ].filter(Boolean);
    console.log(
      `  ${test.slug.padEnd(32)} ${String(q).padStart(3)} Q  ${formatDuration(d).padStart(9)}  ${test.sections.length} sections  (${flags.join(", ")})`
    );
  }

  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    for (const p of problems) console.log(`  ✗ ${p}`);
    // --allow-short exists for the window while a topic's questions are still
    // being written: the patterns are correct, the bank has not caught up. It
    // seeds anyway and says so. Never use it to ship a pattern.
    if (!process.argv.includes("--allow-short")) process.exit(1);
    console.log("\n--allow-short: seeding anyway. Sections above will draw short papers.");
  } else {
    console.log("\nno problems found");
  }

  if (mode !== "seed") {
    await prisma.$disconnect();
    return;
  }

  for (const test of MOCK_TESTS) {
    const data = {
      company: test.company,
      name: test.name,
      family: test.family,
      blurb: test.blurb,
      instructions: test.instructions,
      durationSec: totalDuration(test),
      totalQuestions: totalQuestions(test),
      negativeMark: test.negativeMark ?? 0,
      sectionalTiming: test.sectionalTiming ?? true,
      isAdaptive: test.isAdaptive ?? false,
      highlights: test.highlights,
      sourceNote: test.sourceNote,
      difficulty: test.difficulty,
      orderIndex: test.orderIndex,
      published: true,
    };
    const row = await prisma.mockTest.upsert({
      where: { slug: test.slug },
      create: { slug: test.slug, ...data },
      update: data,
    });
    // Sections are content, not history: replace them wholesale so a renamed
    // or reordered section never leaves a stale row behind.
    await prisma.mockTestSection.deleteMany({ where: { testId: row.id } });
    await prisma.mockTestSection.createMany({
      data: plansOf(test).map((plan) => ({ ...plan, testId: row.id, blueprint: plan.blueprint as any })),
    });
  }

  console.log(`\nseeded ${MOCK_TESTS.length} patterns`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

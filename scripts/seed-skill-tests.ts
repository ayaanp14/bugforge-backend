/**
 * Seeds the skill tests and their private question bank.
 *
 *   npx tsx scripts/seed-skill-tests.ts --validate [--only java-basic,sql-basic]
 *   npx tsx scripts/seed-skill-tests.ts --run      [--only java-basic] [--file java-basic-2.md]
 *   npx tsx scripts/seed-skill-tests.ts --seed     [--prune]
 *
 * --validate parses scripts/skill-test-data/bank/*.md, checks every question
 * against the rules in bank.ts, and checks every test can be filled: an MCQ
 * section needs a pool at least twice its length (three times is the
 * target — fewer, and two sittings share most of a paper), and a coding
 * section needs published problems at its difficulty. `--only` narrows the
 * report to those "<skill>-<level>" pools.
 *
 * --run executes every output-prediction (`run:`) question on the study
 * judge (STUDY_EXECUTOR, Paiza by default — ~1 s a question) and fails on any
 * whose program does not print its keyed option. It is the gate for a pool.
 *
 * Both also take each test's written guide (content/skill-tests/<slug>.md,
 * lib/skill-test-guides.ts): --validate holds it to its rules, checks its
 * links resolve and that its public sample question is not one of the
 * bank's; --run runs a `run:` sample on the judge like a bank question.
 * The guides ship with the API image, so --seed does not touch them.
 *
 * --seed upserts the tests (sections replaced wholesale, as content) and the
 * questions by key. A question that has left the files is deactivated with
 * --prune, never deleted: a sitting in progress may still hold its id.
 */
import { prisma } from "../src/lib/prisma.js";
import { normalizeOutput, runProgram } from "../src/lib/program-judge.js";
import { skillDef } from "../src/lib/skill-catalog.js";
import { BREACH_LIMIT } from "../src/lib/skill-tests.js";
import { expectedOutput, loadBank, programOf, validateBank, type BankQuestion } from "./skill-test-data/bank.js";
import { readGuides, siteLinkChecker, validateGuide, type SkillTestGuide } from "../src/lib/skill-test-guides.js";
import { TOPIC_HUBS } from "../src/lib/problem-topics.js";
import { APTITUDE_CATEGORIES, APTITUDE_TOPICS } from "../src/lib/aptitude-topics.js";
import { fileURLToPath } from "node:url";

// The roadmap lessons a guide may link to, by file name. Read here rather
// than imported from lib/roadmap-lessons, which pulls in every lesson
// figure: the bank's gate should not depend on the road's code compiling.
const LESSONS_DIR = fileURLToPath(new URL("../content/roadmap/", import.meta.url));
import { readdirSync } from "node:fs";
import { SKILL_TESTS, testDuration, testMaxMarks, testQuestions, type SkillSectionSeed, type SkillTestSeed } from "./skill-test-data/tests.js";
import { flushContentCaches } from "./content-caches.js";

const args = process.argv.slice(2);
const mode = args.includes("--seed") ? "seed" : args.includes("--run") ? "run" : "validate";
const prune = args.includes("--prune");
const onlyArg = args[args.indexOf("--only") + 1];
const only = args.includes("--only") && onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim())) : null;

const poolKey = (skill: string, level: string) => `${skill}-${level}`;
const fingerprint = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

const guideRead = readGuides();
const GUIDES = new Map(guideRead.guides.map((g) => [g.slug, g]));

/** The sample as a bank question, so --run treats both alike. */
const sampleQuestion = (g: SkillTestGuide): BankQuestion => ({
  key: `${g.slug} sample`,
  skill: g.skill,
  level: g.level,
  topic: g.sample.topic,
  kind: g.sample.multi ? "multi" : "single",
  prompt: g.sample.prompt,
  options: g.sample.options,
  answer: g.sample.answer,
  explanation: g.sample.explanation,
  run: g.sample.run,
  file: `content/skill-tests/${g.slug}.md`,
  line: 0,
});

/**
 * An MCQ section's draw rules: the section's length shared across every
 * topic the pool holds, the larger topics taking the remainder. Each rule is
 * pinned to the pool's category, and lib/mock-tests' fallback tops a short
 * topic up from the rest of the same pool.
 */
export function balancedBlueprint(pool: BankQuestion[], questionCount: number, category: string) {
  const byTopic = new Map<string, number>();
  for (const q of pool) byTopic.set(q.topic, (byTopic.get(q.topic) ?? 0) + 1);
  const topics = [...byTopic.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (topics.length === 0) return [{ category, count: questionCount }];
  const base = Math.floor(questionCount / topics.length);
  let extra = questionCount - base * topics.length;
  return topics
    .map(([topic]) => {
      const count = base + (extra > 0 ? 1 : 0);
      if (extra > 0) extra -= 1;
      return { topics: [topic], category, count };
    })
    .filter((rule) => rule.count > 0);
}

function sectionRow(test: SkillTestSeed, section: SkillSectionSeed, index: number, pool: BankQuestion[]) {
  const blueprint =
    section.kind === "coding"
      ? (section.draw ?? []).map((rule) => ({ difficulty: rule.difficulty, count: rule.count }))
      : balancedBlueprint(pool, section.questionCount, `${test.skill}:${test.level}`);
  return {
    key: section.key,
    name: section.name,
    orderIndex: index,
    durationSec: section.durationSec,
    questionCount: section.questionCount,
    instructions: section.instructions ?? null,
    kind: section.kind,
    marksPerQuestion: section.marksPerQuestion,
    blueprint,
  };
}

function instructionsFor(test: SkillTestSeed): string {
  const def = skillDef(test.skill)!;
  const coding = test.sections.find((s) => s.kind === "coding");
  const lines = [
    `This is a certification test. Pass with **${test.passPercent}%** and you earn a verifiable CodeKairo credential — **${test.distinctionPercent}%** earns it with distinction. It is valid for ${test.validityMonths / 12} years.`,
    "",
    "- The sections are timed separately and taken in order. A section you leave cannot be reopened.",
    "- The server keeps the clock. Closing the tab or reloading does not pause it.",
    "- Your answers save as you go and survive a refresh.",
    coding
      ? def.codingLanguages.length
        ? `- The coding section must be answered in ${def.label}. Run checks the visible cases; Submit runs every hidden case.`
        : "- The coding section takes any language. Run checks the visible cases; Submit runs every hidden case."
      : null,
    `- You may sit this test again ${test.cooldownDays} days after a sitting ends. Your best result stands.`,
    "",
    `**Integrity.** Work alone and from what you know, on a laptop or desktop with a webcam — phones and tablets cannot sit a skill test. The test runs full screen and must stay in front the whole time, and the webcam must see you, alone: leaving full screen, switching to another tab or window, minimising, or the camera seeing no one, someone else, a phone or you looking away blurs the paper and counts against you — the first ${BREACH_LIMIT - 1 === 1 ? "is a warning" : `${BREACH_LIMIT - 1} are warnings`}, and the ${BREACH_LIMIT === 3 ? "third" : `${BREACH_LIMIT}th`} ends the sitting, graded as not passed. The camera check runs in your browser; nothing is recorded or uploaded. Pasting into the editor is switched off. A sitting that looks assisted can be reviewed, and a credential earned that way is revoked.`,
    "",
    "The answers are never shown — not during the test and not after it. Your result breaks the score down by topic and points you to what to practise.",
  ];
  return lines.filter((line) => line !== null).join("\n");
}

async function codingSupply(): Promise<Map<string, number> | null> {
  try {
    const rows = await prisma.problem.groupBy({ by: ["difficulty"], where: { isPublished: true }, _count: { _all: true } });
    return new Map(rows.map((row) => [String(row.difficulty).toLowerCase(), row._count._all]));
  } catch (err) {
    console.warn(`  (database unreachable — coding sections not checked: ${(err as Error).message.split("\n")[0]})`);
    return null;
  }
}

async function validate(questions: BankQuestion[], parseProblems: string[]): Promise<{ problems: string[]; warnings: string[] }> {
  const problems = [...parseProblems, ...validateBank(questions), ...guideRead.problems];
  const warnings: string[] = [];
  const lessons = readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".md") && !f.startsWith("_")).map((f) => f.replace(/\.md$/, ""));
  const knownPath = siteLinkChecker(
    SKILL_TESTS.map((t) => t.slug),
    TOPIC_HUBS.map((h) => h.slug),
    [...APTITUDE_CATEGORIES.map((c) => c.id), ...APTITUDE_TOPICS.map((t) => t.id)],
    lessons,
  );
  for (const slug of GUIDES.keys()) if (!SKILL_TESTS.some((t) => t.slug === slug)) problems.push(`content/skill-tests/${slug}.md names no skill test`);
  // A pool still being written is short by design; --run must still check
  // what is there, so under --run a shortfall is a warning, not a stop.
  const shortfall = (message: string) => (mode === "run" ? warnings : problems).push(message);
  const supply = await codingSupply();

  for (const test of SKILL_TESTS) {
    const key = poolKey(test.skill, test.level);
    if (only && !only.has(key)) continue;
    const pool = questions.filter((q) => q.skill === test.skill && q.level === test.level);
    const runCount = pool.filter((q) => q.run).length;
    const mcqLength = test.sections.filter((s) => s.kind === "mcq").reduce((n, s) => n + s.questionCount, 0);

    console.log(
      `  ${test.slug.padEnd(24)} ${String(testQuestions(test)).padStart(3)} Q  ${String(testDuration(test) / 60).padStart(3)} min  ${String(testMaxMarks(test)).padStart(5)} marks   pool ${String(pool.length).padStart(3)} (${runCount} judge-checked)`,
    );

    if (mcqLength > 0) {
      if (pool.length < mcqLength * 2) shortfall(`${test.slug}: the pool holds ${pool.length} questions; a ${mcqLength}-question section needs at least ${mcqLength * 2}`);
      else if (pool.length < mcqLength * 3) warnings.push(`${test.slug}: the pool holds ${pool.length}; ${mcqLength * 3} (3×) is the target`);
    }

    // The written guide: its rules, and a sample that is nobody's bank question.
    const guide = GUIDES.get(test.slug);
    if (!guide) warnings.push(`${test.slug}: no written guide (content/skill-tests/${test.slug}.md)`);
    else {
      problems.push(...validateGuide(guide, knownPath));
      const sample = fingerprint(guide.sample.prompt);
      const program = programOf(sampleQuestion(guide));
      const twin = questions.find((q) => fingerprint(q.prompt) === sample || (program && programOf(q) === program));
      if (twin) problems.push(`content/skill-tests/${test.slug}.md: the sample question is the bank's ${twin.key} — a sample must be written for the page`);
    }

    const def = skillDef(test.skill)!;
    const topicCounts = new Map<string, number>();
    for (const q of pool) topicCounts.set(q.topic, (topicCounts.get(q.topic) ?? 0) + 1);
    if (pool.length) {
      console.log(`      topics: ${[...topicCounts.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t} ${n}`).join(", ")}`);
      const letters = new Map<number, number>();
      for (const q of pool) if (q.kind === "single") letters.set(q.answer[0]!, (letters.get(q.answer[0]!) ?? 0) + 1);
      const singles = pool.filter((q) => q.kind === "single").length;
      for (const [index, count] of letters) {
        if (singles >= 20 && count / singles > 0.4) warnings.push(`${test.slug}: ${"ABCDEF"[index]} is the key for ${count} of ${singles} single-answer questions`);
      }
      if (def.codingLanguages.length && runCount / pool.length < 0.4) {
        warnings.push(`${test.slug}: ${runCount} of ${pool.length} questions are judge-checked; 40% is the target`);
      }
    }

    if (supply) {
      for (const section of test.sections.filter((s) => s.kind === "coding")) {
        for (const rule of section.draw ?? []) {
          const have = supply.get(rule.difficulty) ?? 0;
          if (have < rule.count * 20) problems.push(`${test.slug}/${section.key}: only ${have} published ${rule.difficulty} problems`);
        }
      }
    }
  }

  return { problems, warnings };
}

async function runChecks(questions: BankQuestion[]): Promise<number> {
  // `--file java-basic-2.md` re-runs one part file: the judge is a shared,
  // paced queue, and an author fixing one file should not re-run the pool.
  const fileArg = args.includes("--file") ? args[args.indexOf("--file") + 1] : null;
  const samples = [...GUIDES.values()].filter((g) => !only || only.has(g.slug)).map(sampleQuestion);
  const runnable = [...questions, ...samples].filter((q) => q.run && (!fileArg || q.file.endsWith(fileArg)));
  console.log(`\nrunning ${runnable.length} output-prediction programs on the judge…`);
  let failures = 0;
  for (const q of runnable) {
    const program = programOf(q);
    const expected = expectedOutput(q);
    if (!program || expected == null) continue;
    const result = await runProgram(program, q.run!, "");
    const actual = normalizeOutput(result.stdout);
    if (result.status === "ENGINE_ERROR") {
      console.log(`  ! ${q.key}: the judge is unavailable — stopping`);
      return failures + 1;
    }
    if (result.status !== "ACCEPTED" || actual !== normalizeOutput(expected)) {
      failures += 1;
      const why = result.status !== "ACCEPTED" ? `${result.status}: ${(result.compileOutput ?? result.stderr ?? "").split("\n")[0]}` : `printed "${actual}"`;
      console.log(`  ✗ ${q.key} (${q.file}:${q.line}) keyed "${expected}", ${why}`);
    } else {
      process.stdout.write(".");
    }
  }
  console.log(`\n${runnable.length - failures} of ${runnable.length} programs print their keyed answer`);
  return failures;
}

async function seed(questions: BankQuestion[]) {
  for (const test of SKILL_TESTS) {
    const pool = questions.filter((q) => q.skill === test.skill && q.level === test.level);
    const data = {
      skill: test.skill,
      level: test.level,
      title: test.title,
      blurb: test.blurb,
      instructions: instructionsFor(test),
      languages: skillDef(test.skill)!.codingLanguages,
      durationSec: testDuration(test),
      totalQuestions: testQuestions(test),
      passPercent: test.passPercent,
      distinctionPercent: test.distinctionPercent,
      cooldownDays: test.cooldownDays,
      validityMonths: test.validityMonths,
      orderIndex: test.orderIndex,
      // A test whose pool cannot fill its paper stays out of the catalogue.
      published: pool.length >= test.sections.filter((s) => s.kind === "mcq").reduce((n, s) => n + s.questionCount, 0) * 2,
    };
    const row = await prisma.skillTest.upsert({ where: { slug: test.slug }, create: { slug: test.slug, ...data }, update: data });
    await prisma.skillTestSection.deleteMany({ where: { testId: row.id } });
    await prisma.skillTestSection.createMany({
      data: test.sections.map((section, index) => ({ ...sectionRow(test, section, index, pool), testId: row.id, blueprint: sectionRow(test, section, index, pool).blueprint as any })),
    });
    console.log(`  ${test.slug.padEnd(24)} ${data.published ? "published" : "UNPUBLISHED (pool too small)"}`);
  }

  let written = 0;
  for (const q of questions) {
    const data = {
      skill: q.skill,
      level: q.level,
      topic: q.topic,
      kind: q.kind,
      prompt: q.prompt,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      checked: Boolean(q.run),
      active: true,
    };
    await prisma.skillQuestion.upsert({ where: { key: q.key }, create: { key: q.key, ...data }, update: data });
    written += 1;
  }
  console.log(`\n${written} questions upserted`);

  if (prune) {
    const keys = questions.map((q) => q.key);
    const pools = only ? [...only] : null;
    const gone = await prisma.skillQuestion.updateMany({
      where: {
        key: { notIn: keys },
        active: true,
        ...(pools ? { OR: pools.map((p) => ({ skill: p.split("-")[0]!, level: p.split("-").slice(1).join("-") })) } : {}),
      },
      data: { active: false },
    });
    console.log(`${gone.count} questions deactivated (no longer in the bank)`);
  }
}

async function main() {
  const { questions, problems: parseProblems } = loadBank(only);
  console.log(`${questions.length} questions in the bank${only ? ` (${[...only].join(", ")})` : ""}, ${SKILL_TESTS.length} tests\n`);

  const { problems, warnings } = await validate(questions, parseProblems);
  for (const w of warnings) console.log(`  ~ ${w}`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):`);
    for (const p of problems) console.log(`  ✗ ${p}`);
    if (mode !== "seed" || !args.includes("--allow-short")) process.exit(1);
  } else {
    console.log("\nno problems found");
  }

  if (mode === "run") {
    const failures = await runChecks(questions);
    await prisma.$disconnect();
    process.exit(failures ? 1 : 0);
  }

  if (mode === "seed") {
    if (only) {
      console.error("--seed takes the whole bank (the tests' blueprints depend on every pool); drop --only");
      process.exit(2);
    }
    await seed(questions);
    await flushContentCaches("skill-tests");
  }
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

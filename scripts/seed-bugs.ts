/**
 * Seeds + validates the hand-authored bug-hunt challenges (scripts/bugs-data.ts).
 *
 *   npx tsx scripts/seed-bugs.ts --seed [--only "<title>"]
 *   npx tsx scripts/seed-bugs.ts --validate [--only "<title>"]
 *
 * --validate proves each challenge end-to-end through the real engine
 * (judge0 local / wandbox prod): the shipped BUGGY files must fail at least
 * one test, and the known-correct fixedFiles must pass every test.
 */

import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { judgeBugProject } from "../src/lib/bug-judge.js";
import { type BugSpec } from "./bugs-data.js";
import { ALL_BUGS } from "./bugs-catalog.js";
import { ORIGINS } from "./bugs-origins.js";

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};
const ONLY = opt("only");
const RANGE = opt("range"); // e.g. --range 9-20 (inclusive indexes into the catalog)

const specs = () => {
  let list = ALL_BUGS;
  if (RANGE) {
    const [a, b] = RANGE.split("-").map((n) => parseInt(n, 10));
    list = list.slice(a, (isNaN(b) ? a : b) + 1);
  }
  return list.filter((b) => !ONLY || b.title === ONLY);
};

async function seed() {
  const list = specs();
  console.log(`Seeding ${list.length} bug challenges…`);
  for (const spec of list) {
    const existing = await prisma.bugChallenge.findFirst({ where: { title: spec.title }, select: { id: true } });
    const data = {
      title: spec.title,
      difficulty: spec.difficulty,
      category: spec.category,
      language: spec.language ?? "javascript",
      tags: spec.tags ?? [],
      origin: ORIGINS[spec.title] ?? null,
      description: spec.description,
      bugReport: spec.bugReport,
      logs: spec.logs,
      isPublished: true,
    };
    const challenge = existing
      ? await prisma.bugChallenge.update({ where: { id: existing.id }, data })
      : await prisma.bugChallenge.create({ data });

    await prisma.challengeFile.deleteMany({ where: { challengeId: challenge.id } });
    await prisma.challengeTest.deleteMany({ where: { challengeId: challenge.id } });

    await prisma.challengeFile.createMany({
      data: spec.files.map((f) => ({
        challengeId: challenge.id,
        filePath: f.filePath,
        content: f.content,
        isEditable: f.isEditable,
        language: f.language,
      })),
    });
    await prisma.challengeTest.createMany({
      data: spec.tests.map((t) => ({
        challengeId: challenge.id,
        name: t.name,
        runCommand: t.source,
        expectedOutput: "PASS",
        isHidden: t.isHidden,
      })),
    });
    console.log(`  seeded: ${spec.title} (${spec.files.length} files, ${spec.tests.length} tests)`);
  }
  console.log("Done.");
}

async function validate() {
  const list = specs();
  let pass = 0, fail = 0;

  for (const spec of list) {
    const tests = spec.tests.map((t) => ({ name: t.name, source: t.source }));

    // 1. Buggy version must fail at least one test (otherwise there's no bug!)
    const buggy = await judgeBugProject(spec.files, tests, spec.language ?? "javascript");
    const buggyOk = buggy.verdict === "FAILED" && buggy.passedTests < buggy.totalTests;

    // 2. Fixed version must pass everything
    const fixedFiles = spec.files.map((f) => ({
      filePath: f.filePath,
      content: spec.fixedFiles[f.filePath] ?? f.content,
    }));
    const fixed = await judgeBugProject(fixedFiles, tests, spec.language ?? "javascript");
    const fixedOk = fixed.verdict === "ACCEPTED";

    if (buggyOk && fixedOk) {
      pass++;
      console.log(`PASS ${spec.title} (buggy: ${buggy.passedTests}/${buggy.totalTests} · fixed: ${fixed.passedTests}/${fixed.totalTests}, ${fixed.runtimeMs}ms)`);
    } else {
      fail++;
      console.log(`FAIL ${spec.title} — buggy verdict=${buggy.verdict} (${buggy.passedTests}/${buggy.totalTests}), fixed verdict=${fixed.verdict} (${fixed.passedTests}/${fixed.totalTests})`);
      const badFixed = fixed.results.filter((r) => !r.passed);
      for (const b of badFixed.slice(0, 3)) console.log(`    fixed still failing: [${b.name}] ${b.detail}`);
      const buggyAllPass = buggy.results.every((r) => r.passed);
      if (buggyAllPass) console.log("    (the buggy version passes everything — the tests don't catch the bug)");
    }
  }

  console.log(`\n== ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
}

(async () => {
  const seen = new Set<string>();
  for (const b of ALL_BUGS) {
    if (seen.has(b.title)) throw new Error(`duplicate bug title: ${b.title}`);
    seen.add(b.title);
  }
  if (flag("seed")) await seed();
  if (flag("validate")) await validate();
  if (!flag("seed") && !flag("validate")) {
    console.log('usage: tsx scripts/seed-bugs.ts --seed | --validate [--only "<title>"]');
  }
  await prisma.$disconnect();
})();

/**
 * Upgrades the problem catalogue to professional quality and proves every
 * language runs.
 *
 *   npx tsx scripts/upgrade-problems.ts --seed
 *       Writes description, hints, starter code for all 13 languages, and a
 *       Python reference solution to each problem (matched by slug).
 *
 *   npx tsx scripts/upgrade-problems.ts --validate [--only <slug>] [--lang <lang>]
 *       For every problem × language, renders the solution file and runs it
 *       against ALL of that problem's test cases through the configured
 *       executor (local Judge0 by default; EXECUTOR=wandbox works too).
 */

import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { runBatch } from "../src/lib/batch-judge.js";
import { ALL_LANGUAGES, renderFile, renderStub, type Language } from "./problem-codegen.js";
import { PROBLEMS } from "./problems-data.js";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
};

async function seed() {
  for (const p of PROBLEMS) {
    // Editor starter = stub only; the driver is applied server-side at run time
    const starterCode = Object.fromEntries(
      ALL_LANGUAGES.map((lang) => [lang, renderStub(lang, p.signature)])
    );
    const result = await prisma.problem.updateMany({
      where: { slug: p.slug },
      data: {
        description: p.description,
        hints: p.hints,
        starterCode,
        signature: p.signature,
        referenceSolution: p.solutions.python,
        referenceLanguage: "python",
      },
    });
    console.log(`${result.count ? "updated" : "MISSING"}: ${p.slug}`);
  }
}

async function validate() {
  const onlySlug = opt("only");
  const onlyLang = opt("lang") as Language | null;
  let pass = 0, fail = 0;
  const failures: string[] = [];

  for (const p of PROBLEMS) {
    if (onlySlug && p.slug !== onlySlug) continue;
    const problem = await prisma.problem.findUnique({
      where: { slug: p.slug },
      include: { testCases: { orderBy: { orderIndex: "asc" } } },
    });
    if (!problem || problem.testCases.length === 0) {
      console.log(`SKIP ${p.slug}: no problem/test cases in DB`);
      continue;
    }

    for (const lang of ALL_LANGUAGES) {
      if (onlyLang && lang !== onlyLang) continue;
      const source = renderFile(lang, p.signature, p.solutions[lang]);
      try {
        const batch = await runBatch(
          source,
          lang,
          problem.testCases.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput })),
          { timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb }
        );
        const bad = batch.perCase
          .map((r, i) => ({ r, i }))
          .filter(({ r }) => !r.passed);
        if (bad.length === 0) {
          pass++;
          console.log(`PASS ${p.slug} [${lang}] (${batch.perCase.length} cases, ${batch.runtimeMs}ms total)`);
        } else {
          fail++;
          const { r, i } = bad[0];
          const detail = (r.compile_output || r.stderr || "").trim().split("\n").slice(0, 3).join(" | ");
          const msg = `FAIL ${p.slug} [${lang}] case ${i + 1}: ${r.status}${detail ? ` — ${detail}` : ""} — got ${JSON.stringify(r.actualOutput?.slice(0, 60))}`;
          failures.push(msg);
          console.log(msg);
        }
      } catch (err) {
        fail++;
        const msg = `FAIL ${p.slug} [${lang}] threw: ${(err as Error).message}`;
        failures.push(msg);
        console.log(msg);
      }
    }
  }

  console.log(`\n== ${pass} passed, ${fail} failed`);
  if (failures.length) {
    console.log(failures.join("\n"));
    process.exitCode = 1;
  }
}

(async () => {
  if (flag("seed")) await seed();
  if (flag("validate")) await validate();
  if (!flag("seed") && !flag("validate")) {
    console.log("usage: tsx scripts/upgrade-problems.ts --seed | --validate [--only <slug>] [--lang <lang>]");
  }
  await prisma.$disconnect();
})();

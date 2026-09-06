/**
 * Backfills editorial prose + reference solutions onto problems that exist in
 * the database but not in scripts/catalog (the original hand-seeded starters:
 * two-sum, fizz-buzz, …). Those rows already carry a signature and a full test
 * suite, so nothing about the problem itself is touched — only `editorial` and
 * `solutions` are written, and only after every authored language has been run
 * against the problem's own cases through the real execution path.
 *
 *   npx tsx scripts/backfill-editorials.ts <payload.json> [--write]
 *
 * The payload is { slug: { editorial: <explain() options>, solutions: { lang: code } } }.
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma.js";
import { runBatch } from "../src/lib/batch-judge.js";
import { ALL_LANGUAGES, applyDriver, type Language, type Signature } from "../src/lib/driver-codegen.js";
import { explain, solutionsJson, type Solutions } from "./catalog/types.js";

type Payload = Record<string, { editorial: Parameters<typeof explain>[0]; solutions: Solutions }>;

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const WRITE = args.includes("--write");
if (!file) {
  console.log("usage: tsx scripts/backfill-editorials.ts <payload.json> [--write]");
  process.exit(1);
}

const payload = JSON.parse(readFileSync(file, "utf8")) as Payload;

let pass = 0;
let fail = 0;

for (const [slug, entry] of Object.entries(payload)) {
  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: { testCases: { orderBy: { orderIndex: "asc" } } },
  });
  if (!problem) {
    console.log(`MISS ${slug} (no such problem)`);
    fail++;
    continue;
  }
  const signature = problem.signature as unknown as Signature;
  const cases = problem.testCases.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput }));
  const authored = ALL_LANGUAGES.filter((l) => typeof entry.solutions[l] === "string" && entry.solutions[l]!.length > 0);
  let allOk = true;
  for (const lang of authored) {
    const code = entry.solutions[lang]!;
    try {
      const r = await runBatch(applyDriver(lang as Language, signature, code), lang as Language, cases, {
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
      });
      const ok = r.perCase.filter((x) => x.passed).length;
      if (ok === cases.length) {
        pass++;
        console.log(`PASS ${slug} [${lang}] (${ok} cases, ${r.runtimeMs}ms)`);
      } else {
        fail++;
        allOk = false;
        const bad = r.perCase.map((x, i) => ({ x, i })).find(({ x }) => !x.passed)!;
        const tc = problem.testCases[bad.i];
        console.log(
          `FAIL ${slug} [${lang}] case ${bad.i + 1}: ${bad.x.status} — in=${tc.input.slice(0, 60)} want=${tc.expectedOutput.slice(0, 40)} got=${(bad.x.actualOutput ?? bad.x.stderr ?? bad.x.compile_output ?? "").slice(0, 120)}`
        );
      }
    } catch (e) {
      fail++;
      allOk = false;
      console.log(`FAIL ${slug} [${lang}] threw: ${(e as Error).message}`);
    }
  }
  if (WRITE && allOk) {
    await prisma.problem.update({
      where: { slug },
      data: { editorial: explain(entry.editorial), solutions: solutionsJson(entry.solutions) },
    });
    console.log(`WROTE ${slug} (${authored.length} languages)`);
  } else if (WRITE) {
    console.log(`SKIP WRITE ${slug} (validation failed)`);
  }
}

console.log(`\n== ${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
await prisma.$disconnect();

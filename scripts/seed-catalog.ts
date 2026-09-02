/**
 * Seeds the hand-authored classic-problem catalog (scripts/catalog/*).
 *
 *   npx tsx scripts/seed-catalog.ts --seed [--count 5000] [--only <slug>]
 *   npx tsx scripts/seed-catalog.ts --validate [--only <slug>] [--lang js|py|all13:<slug>]
 *
 * Each problem gets: description/hints/signature, stub-only starter code for
 * all 13 languages, Python reference solution, visible example cases, and
 * `--count` deterministic hidden cases. Validation runs the authored
 * Python + JavaScript solutions against every DB case through the real
 * execution path (applyDriver → runBatch).
 */

import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";
import { runBatch } from "../src/lib/batch-judge.js";
import { ALL_LANGUAGES, applyDriver, renderStub, type Language } from "../src/lib/driver-codegen.js";
import { CATALOG } from "./catalog/index.js";
import { makeRng, type CatalogProblem } from "./catalog/types.js";

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};
const HIDDEN = parseInt(opt("count") ?? "5000", 10);
const ONLY = opt("only");

function specs(): CatalogProblem[] {
  const seen = new Set<string>();
  const out: CatalogProblem[] = [];
  for (const p of CATALOG) {
    if (seen.has(p.slug)) throw new Error(`duplicate slug in catalog: ${p.slug}`);
    seen.add(p.slug);
    if (!ONLY || p.slug === ONLY) out.push(p);
  }
  return out;
}

async function seedOne(spec: CatalogProblem) {
  const starterCode = Object.fromEntries(ALL_LANGUAGES.map((lang) => [lang, renderStub(lang, spec.signature)]));
  const problem = await prisma.problem.upsert({
    where: { slug: spec.slug },
    update: {
      title: spec.title, description: spec.description, difficulty: spec.difficulty,
      tags: spec.tags, hints: spec.hints, starterCode, signature: spec.signature as object,
      referenceSolution: spec.solutions.python, referenceLanguage: "python", isPublished: true,
    },
    create: {
      slug: spec.slug, title: spec.title, description: spec.description, difficulty: spec.difficulty,
      tags: spec.tags, hints: spec.hints, starterCode, signature: spec.signature as object,
      referenceSolution: spec.solutions.python, referenceLanguage: "python", isPublished: true,
      timeLimitMs: 2000, memoryLimitMb: 256,
    },
  });

  await prisma.testCase.deleteMany({ where: { problemId: problem.id } });
  const rows: Array<{ problemId: string; input: string; expectedOutput: string; isHidden: boolean; orderIndex: number }> = [];
  spec.examples.forEach((ex, i) =>
    rows.push({ problemId: problem.id, input: ex.input, expectedOutput: ex.expectedOutput, isHidden: false, orderIndex: i }));
  const rng = makeRng(spec.slug);
  for (let i = 0; i < HIDDEN; i++) {
    const c = spec.gen(rng);
    rows.push({ problemId: problem.id, input: c.input, expectedOutput: c.expectedOutput, isHidden: true, orderIndex: spec.examples.length + i });
  }
  for (let i = 0; i < rows.length; i += 2000) {
    await prisma.testCase.createMany({ data: rows.slice(i, i + 2000) });
  }
}

async function seed() {
  const list = specs();
  const resume = flag("resume");
  console.log(`Seeding ${list.length} catalog problems × (${HIDDEN} hidden)…${resume ? " [resume]" : ""}`);
  let done = 0;
  for (const spec of list) {
    // --resume: skip problems that already carry the full expected suite
    // (lets a run continue after a dropped connection without redoing work).
    if (resume) {
      const existing = await prisma.problem.findUnique({
        where: { slug: spec.slug },
        select: { _count: { select: { testCases: true } } },
      });
      if (existing && existing._count.testCases === spec.examples.length + HIDDEN) {
        done++;
        if (done % 10 === 0 || done === list.length) console.log(`  ${done}/${list.length} (skip: ${spec.slug})`);
        continue;
      }
    }
    // Shared hosts kill long-lived connections; retry each problem a few
    // times — deleteMany+createMany makes a retry safe after partial writes.
    for (let attempt = 1; ; attempt++) {
      try {
        await seedOne(spec);
        break;
      } catch (e) {
        if (attempt >= 4) throw e;
        console.log(`  retry ${attempt} for ${spec.slug}: ${(e as Error).message.slice(0, 100)}`);
        await new Promise((r) => setTimeout(r, 3000 * attempt));
      }
    }
    done++;
    if (done % 10 === 0 || done === list.length) console.log(`  ${done}/${list.length} (latest: ${spec.slug})`);
  }
  console.log(`Done: ${done} problems.`);
}

async function validate() {
  const list = specs();
  const langArg = opt("lang");
  let pass = 0, fail = 0;
  const failures: string[] = [];

  async function check(spec: CatalogProblem, lang: Language, code: string) {
    const problem = await prisma.problem.findUnique({
      where: { slug: spec.slug },
      include: { testCases: { orderBy: { orderIndex: "asc" } } },
    });
    if (!problem || problem.testCases.length === 0) { console.log(`SKIP ${spec.slug} (not seeded)`); return; }
    try {
      const r = await runBatch(
        applyDriver(lang, spec.signature, code), lang,
        problem.testCases.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput })),
        { timeLimitMs: problem.timeLimitMs, memoryLimitMb: problem.memoryLimitMb }
      );
      const ok = r.perCase.filter((x) => x.passed).length;
      if (ok === problem.testCases.length) {
        pass++;
        console.log(`PASS ${spec.slug} [${lang}] (${ok} cases, ${r.runtimeMs}ms)`);
      } else {
        fail++;
        const bad = r.perCase.map((x, i) => ({ x, i })).find(({ x }) => !x.passed)!;
        const tc = problem.testCases[bad.i];
        const msg = `FAIL ${spec.slug} [${lang}] case ${bad.i + 1}: ${bad.x.status} — in=${tc.input.slice(0, 60)} want=${tc.expectedOutput.slice(0, 40)} got=${(bad.x.actualOutput ?? bad.x.stderr ?? bad.x.compile_output ?? "").slice(0, 80)}`;
        failures.push(msg);
        console.log(msg);
      }
    } catch (e) {
      fail++;
      const msg = `FAIL ${spec.slug} [${lang}] threw: ${(e as Error).message}`;
      failures.push(msg);
      console.log(msg);
    }
  }

  for (const spec of list) {
    if (!langArg || langArg === "py" || langArg === "all") await check(spec, "python", spec.solutions.python);
    if (!langArg || langArg === "js" || langArg === "all") await check(spec, "javascript", spec.solutions.javascript);
  }
  console.log(`\n== ${pass} passed, ${fail} failed`);
  if (failures.length) process.exitCode = 1;
}

(async () => {
  console.log(`Catalog size: ${CATALOG.length} problems.`);
  if (flag("seed")) await seed();
  if (flag("validate")) await validate();
  if (!flag("seed") && !flag("validate")) {
    console.log("usage: tsx scripts/seed-catalog.ts --seed [--count N] [--only slug] | --validate [--only slug]");
  }
  await prisma.$disconnect();
})();

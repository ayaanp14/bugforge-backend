/**
 * Seeds the study plans.
 *
 *   npx tsx scripts/seed-study-plans.ts --validate [--track cpp] [--only jvm,types] [--run]
 *   npx tsx scripts/seed-study-plans.ts --seed [--track cpp] [--only jvm] [--prune]
 *   node scripts/run-prod.mjs scripts/seed-study-plans.ts --seed   # against production
 *
 * --validate checks every track on its own terms (scripts/study-plans/dsl.ts:
 * slugs, one test per module, quiz answers in range, cases present). With
 * --run it also sends every exercise's reference solution through the real
 * program judge (src/lib/program-judge.ts, on STUDY_EXECUTOR — Paiza by
 * default) and requires ACCEPTED on every case: the one proof that the
 * content compiles on the runtime a learner gets and that the expected
 * outputs are right. Slow (a free engine, ~1 s a case) — run it on the
 * modules you touched with --only, and on one track with --track: three
 * tracks share module slugs (every track ends in interview-idioms), and a
 * --run over all of them is several hundred programs.
 *
 * --seed upserts tracks, modules and lessons by key and renumbers positions
 * from the file order. Progress rows are keyed by lesson key and never
 * touched, so re-seeding a lesson's text is safe. --prune removes modules
 * and lessons the files no longer name.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma.js";
import { judgeProgram } from "../src/lib/program-judge.js";
import { validateTrack, summarize, type TrackSeed } from "./study-plans/dsl.js";
import { javaTrack } from "./study-plans/java/track.js";
import { javascriptTrack } from "./study-plans/javascript/track.js";
import { cppTrack } from "./study-plans/cpp/track.js";

const ALL_TRACKS: TrackSeed[] = [javaTrack, javascriptTrack, cppTrack];

const args = process.argv.slice(2);
const trackArg = args[args.indexOf("--track") + 1];
const trackKeys = args.includes("--track") && trackArg ? new Set(trackArg.split(",").map((s) => s.trim())) : null;
if (trackKeys) {
  for (const key of trackKeys) {
    if (!ALL_TRACKS.some((t) => t.key === key)) {
      console.error(`unknown track "${key}" — known: ${ALL_TRACKS.map((t) => t.key).join(", ")}`);
      process.exit(2);
    }
  }
}
// A track's position in the list page is its index in ALL_TRACKS, so a
// --track run seeds the same position the full run would.
const TRACKS: Array<{ track: TrackSeed; position: number }> = ALL_TRACKS.map((track, position) => ({ track, position })).filter(({ track }) => !trackKeys || trackKeys.has(track.key));
const mode = args.includes("--seed") ? "seed" : "validate";
const run = args.includes("--run");
const prune = args.includes("--prune");
const onlyArg = args[args.indexOf("--only") + 1];
const only = args.includes("--only") && onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim())) : null;

const moduleKey = (track: TrackSeed, slug: string) => `${track.key}:${slug}`;
const lessonKey = (track: TrackSeed, slug: string) => `${track.key}:${slug}`;

async function runSolutions(track: TrackSeed): Promise<number> {
  let failures = 0;
  for (const module of track.modules) {
    if (only && !only.has(module.slug)) continue;
    for (const lesson of module.lessons) {
      for (const [i, exercise] of lesson.exercises.entries()) {
        const label = `${module.slug}/${lesson.slug} #${i + 1} ${exercise.title}`;
        const started = Date.now();
        // Hidden cases are hidden from learners, not from the author: show every case here.
        const result = await judgeProgram(exercise.solution, track.language, exercise.cases.map((c) => ({ ...c, hidden: false })));
        const ms = Date.now() - started;
        if (result.verdict === "ACCEPTED") {
          console.log(`  ok   ${label} (${result.total} cases, ${ms} ms)`);
          continue;
        }
        failures += 1;
        console.error(`  FAIL ${label}: ${result.verdict} ${result.passed}/${result.total}`);
        if (result.compileOutput) console.error(result.compileOutput.split("\n").slice(0, 12).map((l) => `       ${l}`).join("\n"));
        for (const c of result.cases) {
          if (c.passed) continue;
          console.error(`       case ${c.index + 1}: ${c.status}`);
          if (c.expected !== null) console.error(`         expected: ${JSON.stringify(c.expected)}`);
          if (c.actual !== null) console.error(`         actual:   ${JSON.stringify(c.actual)}`);
          if (c.stderr) console.error(`         stderr:   ${c.stderr.split("\n")[0]}`);
        }
      }
    }
  }
  return failures;
}

async function seedTrack(track: TrackSeed, position: number): Promise<void> {
  const trackRow = await prisma.studyTrack.upsert({
    where: { key: track.key },
    create: { key: track.key, title: track.title, blurb: track.blurb, language: track.language, runtime: track.runtime, position },
    update: { title: track.title, blurb: track.blurb, language: track.language, runtime: track.runtime, position },
    select: { id: true },
  });

  for (const [modulePosition, module] of track.modules.entries()) {
    if (only && !only.has(module.slug)) continue;
    const moduleRow = await prisma.studyModule.upsert({
      where: { key: moduleKey(track, module.slug) },
      create: {
        key: moduleKey(track, module.slug),
        slug: module.slug,
        trackId: trackRow.id,
        title: module.title,
        blurb: module.blurb,
        icon: module.icon,
        overview: module.overview,
        position: modulePosition,
      },
      update: { slug: module.slug, title: module.title, blurb: module.blurb, icon: module.icon, overview: module.overview, position: modulePosition },
      select: { id: true },
    });

    for (const [lessonPosition, lesson] of module.lessons.entries()) {
      const data = {
        slug: lesson.slug,
        moduleId: moduleRow.id,
        title: lesson.title,
        kind: lesson.kind,
        position: lessonPosition,
        minutes: lesson.minutes,
        body: lesson.body,
        // Interfaces have no index signature, so Prisma's Json input type needs the cast.
        exercises: lesson.exercises as unknown as Prisma.InputJsonValue,
        quiz: lesson.quiz as unknown as Prisma.InputJsonValue,
        passMark: lesson.passMark,
        xp: lesson.xp,
      };
      await prisma.studyLesson.upsert({
        where: { key: lessonKey(track, lesson.slug) },
        create: { key: lessonKey(track, lesson.slug), ...data },
        update: data,
      });
    }
    if (prune) {
      const gone = await prisma.studyLesson.deleteMany({
        where: { moduleId: moduleRow.id, key: { notIn: module.lessons.map((l) => lessonKey(track, l.slug)) } },
      });
      if (gone.count) console.log(`  pruned ${gone.count} lesson(s) from ${module.slug}`);
    }
    console.log(`  ${module.slug.padEnd(18)} ${module.lessons.length} lessons`);
  }

  if (prune && !only) {
    const gone = await prisma.studyModule.deleteMany({
      where: { trackId: trackRow.id, key: { notIn: track.modules.map((m) => moduleKey(track, m.slug)) } },
    });
    if (gone.count) console.log(`  pruned ${gone.count} module(s)`);
  }
}

async function main() {
  let bad = 0;
  for (const { track } of TRACKS) {
    console.log(summarize(track));
    const problems = validateTrack(track);
    for (const p of problems) console.error(`  ✗ ${p}`);
    bad += problems.length;
  }
  if (bad) {
    console.error(`\n${bad} problem(s). Nothing written.`);
    process.exitCode = 1;
    return;
  }
  console.log("Structure is sound.");

  if (run) {
    let failures = 0;
    for (const { track } of TRACKS) {
      console.log(`\nRunning reference solutions for ${track.key} on the study judge…`);
      failures += await runSolutions(track);
    }
    if (failures) {
      console.error(`\n${failures} exercise(s) do not pass their own cases. Nothing written.`);
      process.exitCode = 1;
      return;
    }
    console.log("\nEvery reference solution is ACCEPTED.");
  }

  if (mode !== "seed") return;
  for (const { track, position } of TRACKS) {
    console.log(`\nSeeding ${track.key}…`);
    await seedTrack(track, position);
  }
  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

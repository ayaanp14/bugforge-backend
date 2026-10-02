/**
 * The roadmap lessons' gate (content/roadmap/*.md; rules in
 * src/lib/roadmap-lessons.ts).
 *
 *   npx tsx scripts/roadmap-lessons.ts --validate [--only two-pointers,greedy-algorithms]
 *       Every file parses; every lesson meets the bar (answer length, word
 *       count, sections, four-language code groups with an output); titles
 *       and descriptions are unique; each stage key is on the road
 *       (scripts/roadmap-data.ts); every practice slug and /problems/ link
 *       is a catalogue problem (scripts/catalog) that is not a second copy
 *       (PROBLEM_CANONICAL); every /challenges/ link and `hub` is a topic
 *       hub, and "@walkthrough" names a hub that has one. Offline.
 *
 *   npx tsx scripts/roadmap-lessons.ts --run [--only two-pointers] [--workers 4]
 *       Runs every code group's four programs on the study judge
 *       (STUDY_EXECUTOR, Paiza by default: g++/clang, OpenJDK, CPython,
 *       Node) with empty stdin and requires each to print the group's
 *       `output` fence exactly (after normalizeOutput: trailing spaces and
 *       blank lines). The gate — a lesson never ships code that does not
 *       compile or prints something else. About a second a program.
 *
 *   npx tsx scripts/roadmap-lessons.ts --problems "Two Pointers"
 *       The catalogue's problems carrying a tag, easiest first — what a
 *       lesson's `practice` line is picked from.
 *
 *   npx tsx scripts/roadmap-lessons.ts --syllabus
 *       The road with each stage's lessons, as the sidebar will draw it.
 */
import { readdirSync, readFileSync } from "node:fs";
import { CATALOG } from "./catalog/index.js";
import { ROADMAP, ROADMAP_TIERS } from "./roadmap-data.js";
import { LESSONS_DIR, LESSON_LANGUAGES, lessonBlocks, lessonLinks, parseLesson, proseWords, validateLessons, type RoadmapLesson } from "../src/lib/roadmap-lessons.js";
import { PROBLEM_CANONICAL } from "../src/lib/problem-canonical.js";
import { TOPIC_HUBS } from "../src/lib/problem-topics.js";
import { COMPANY_TAGS } from "../src/lib/companies.js";
import { slugify } from "../src/lib/slug.js";
import { walkthroughFor } from "../src/lib/walkthroughs/index.js";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const value = (name: string) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const only = value("--only")?.split(",").map((s) => s.trim()).filter(Boolean);

function load(): { lessons: RoadmapLesson[]; errors: string[] } {
  const errors: string[] = [];
  const lessons: RoadmapLesson[] = [];
  let files: string[] = [];
  try {
    files = readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".md") && !f.startsWith("_")).sort();
  } catch {
    errors.push(`no lessons directory at ${LESSONS_DIR}`);
  }
  for (const file of files) {
    try {
      lessons.push(parseLesson(readFileSync(`${LESSONS_DIR}${file}`, "utf8"), file));
    } catch (err) {
      errors.push((err as Error).message);
    }
  }
  return { lessons, errors };
}

const catalogue = new Map(CATALOG.map((p) => [p.slug, p]));
const topicSlugs = new Set(TOPIC_HUBS.map((t) => t.slug));
const companySlugs = new Set([...COMPANY_TAGS].map((t) => slugify(t)));

/** Links and references only the catalogue and the hub table can settle. */
function referenceProblems(l: RoadmapLesson): string[] {
  const out: string[] = [];
  const at = `${l.slug}.md`;
  const problem = (slug: string, where: string) => {
    if (!catalogue.has(slug)) out.push(`${at}: ${where} "${slug}" is not a catalogue problem`);
    else if (slug in PROBLEM_CANONICAL) out.push(`${at}: ${where} "${slug}" is a second copy — use "${PROBLEM_CANONICAL[slug]}"`);
  };
  for (const s of l.practice) problem(s, "practice problem");
  for (const link of lessonLinks(l)) {
    let m: RegExpExecArray | null;
    if ((m = /^\/problems\/([a-z0-9-]+)$/.exec(link))) problem(m[1], "link to");
    else if ((m = /^\/challenges\/company\/([a-z0-9-]+)$/.exec(link))) {
      if (!companySlugs.has(m[1])) out.push(`${at}: links to company hub "${m[1]}", which does not exist`);
    } else if ((m = /^\/challenges\/([a-z0-9-]+)$/.exec(link))) {
      if (!topicSlugs.has(m[1])) out.push(`${at}: links to topic hub "${m[1]}", which does not exist`);
    }
  }
  if (l.hub && !topicSlugs.has(l.hub)) out.push(`${at}: hub "${l.hub}" is not a topic hub (lib/problem-topics TOPIC_HUBS)`);
  if (l.hub && lessonBlocks(l.body).some((b) => b.kind === "walkthrough") && !walkthroughFor(l.hub)) out.push(`${at}: "@walkthrough" but hub "${l.hub}" has no walkthrough`);
  return out;
}

async function validate(): Promise<number> {
  const { lessons, errors } = load();
  const stageKeys = ROADMAP.map((s) => s.key);
  const problems = [...errors, ...validateLessons(lessons, stageKeys), ...lessons.flatMap(referenceProblems)];
  const shown = only ? problems.filter((p) => only.some((s) => p.startsWith(`${s}.md`))) : problems;
  for (const l of lessons.filter((x) => !only || only.includes(x.slug))) {
    const groups = lessonBlocks(l.body).filter((b) => b.kind === "code").length;
    console.log(`  ${l.slug.padEnd(30)} ${String(proseWords(l.body)).padStart(5)} words · ${groups} code group${groups === 1 ? "" : "s"} · ${l.faq.length} q/a · ${l.practice.length} practice`);
  }
  if (shown.length) {
    console.error(`\n${shown.length} problem${shown.length === 1 ? "" : "s"}:`);
    for (const p of shown) console.error(`  ✗ ${p}`);
    return 1;
  }
  console.log(`\n✓ ${only ? only.length : lessons.length} lesson${(only?.length ?? lessons.length) === 1 ? "" : "s"} valid`);
  return 0;
}

async function run(): Promise<number> {
  const { runProgram, normalizeOutput } = await import("../src/lib/program-judge.js");
  const { lessons, errors } = load();
  if (errors.length) {
    for (const e of errors) console.error(`  ✗ ${e}`);
    return 1;
  }
  const picked = lessons.filter((l) => !only || only.includes(l.slug));
  const jobs: Array<{ lesson: string; line: number; language: string; code: string; expected: string }> = [];
  for (const l of picked)
    for (const b of lessonBlocks(l.body))
      if (b.kind === "code") for (const s of b.samples) jobs.push({ lesson: l.slug, line: b.line, language: s.language, code: s.code, expected: b.output ?? "" });
  console.log(`Running ${jobs.length} programs from ${picked.length} lesson${picked.length === 1 ? "" : "s"}…`);
  const failures: string[] = [];
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      const where = `${job.lesson}.md:${job.line} ${job.language}`;
      let attempt = 0;
      for (;;) {
        const r = await runProgram(job.code, job.language, "");
        if (r.status === "ENGINE_ERROR" && attempt++ < 2) continue;
        if (r.status !== "ACCEPTED") {
          failures.push(`${where}: ${r.status}\n${(r.compileOutput ?? r.stderr ?? "").split("\n").slice(0, 12).map((x) => `      ${x}`).join("\n")}`);
        } else if (normalizeOutput(r.stdout) !== normalizeOutput(job.expected)) {
          failures.push(`${where}: printed something else\n      expected: ${JSON.stringify(normalizeOutput(job.expected)).slice(0, 400)}\n      got:      ${JSON.stringify(normalizeOutput(r.stdout)).slice(0, 400)}`);
        } else {
          process.stdout.write(".");
        }
        break;
      }
    }
  };
  const workers = Math.max(1, Math.min(8, Number(value("--workers") ?? 4) || 4));
  await Promise.all(Array.from({ length: workers }, worker));
  console.log("");
  if (failures.length) {
    console.error(`\n${failures.length} program${failures.length === 1 ? "" : "s"} failed:`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    return 1;
  }
  console.log(`✓ ${jobs.length} programs print what their lessons say (${LESSON_LANGUAGES.join(", ")})`);
  return 0;
}

function problemsTagged(tag: string): number {
  const rank = { EASY: 0, MEDIUM: 1, HARD: 2 } as const;
  const rows = CATALOG.filter((p) => p.tags.some((t) => t.toLowerCase() === tag.toLowerCase()) && !(p.slug in PROBLEM_CANONICAL)).sort((a, b) => rank[a.difficulty] - rank[b.difficulty] || a.title.localeCompare(b.title));
  for (const p of rows) console.log(`${p.difficulty.padEnd(7)} ${p.slug.padEnd(52)} ${p.title}  [${p.tags.join(", ")}]`);
  console.log(`\n${rows.length} problems tagged "${tag}"`);
  return 0;
}

function syllabus(): number {
  const { lessons } = load();
  for (const tier of ROADMAP_TIERS) {
    console.log(`\n${tier.title}`);
    for (const s of ROADMAP.filter((x) => x.tier === tier.key)) {
      console.log(`  ${s.key.padEnd(18)} ${s.title}`);
      for (const l of lessons.filter((x) => x.stage === s.key).sort((a, b) => a.order - b.order)) console.log(`      ${l.order}. ${l.slug} — ${l.title} (${l.minutes} min)`);
    }
  }
  return 0;
}

const code = flag("--run") ? await run() : flag("--problems") ? problemsTagged(value("--problems") ?? "") : flag("--syllabus") ? syllabus() : await validate();
process.exit(code);

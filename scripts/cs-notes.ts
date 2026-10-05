/**
 * The CS notes' gate (content/notes/<subject>/*.md; rules in
 * src/lib/cs-notes.ts, the authoring guide in content/notes/_AUTHORING.md).
 *
 *   npx tsx scripts/cs-notes.ts --validate [--subject dbms] [--only normalization,er-model]
 *       Every file parses; every note meets the bar (answer and q/a
 *       lengths, words of prose, five "##" sections and an "Interview
 *       questions" one, code groups in order with an output, fence
 *       languages, figures that build within the page's limits); slugs,
 *       titles, search titles and descriptions are unique; every
 *       /notes/, /skill-tests/, /problems/, /roadmap/ and /sql/ link
 *       resolves. Offline.
 *
 *   npx tsx scripts/cs-notes.ts --run [--subject oop] [--only inheritance] [--workers 4]
 *       Runs every code group's programs on the study judge
 *       (STUDY_EXECUTOR, Paiza by default) with empty stdin and requires
 *       each to print the group's `output` fence exactly (after
 *       normalizeOutput). The gate for code — a note never ships a program
 *       that does not compile or prints something else.
 *
 *   npx tsx scripts/cs-notes.ts --list
 *       The notes per subject in order, with words and figures.
 */
import { CATALOG } from "./catalog/index.js";
import { PROBLEM_CANONICAL } from "../src/lib/problem-canonical.js";
import { NOTE_SUBJECTS, NOTE_SUBJECT_KEYS, noteBlocks, noteLinks, noteProseWords, readNotes, validateNotes, type CsNote } from "../src/lib/cs-notes.js";
import { allLessons } from "../src/lib/roadmap-lessons.js";
import { SKILL_TESTS } from "./skill-test-data/tests.js";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const value = (name: string) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const only = value("--only")?.split(",").map((s) => s.trim()).filter(Boolean);
const subject = value("--subject");

function picked(notes: CsNote[]): CsNote[] {
  return notes.filter((n) => (!subject || n.subject === subject) && (!only || only.includes(n.slug)));
}

/** Links outside /notes that must resolve: problems, roadmap lessons, skill tests, SQL problems. */
async function externalLinkProblems(notes: CsNote[]): Promise<string[]> {
  const out: string[] = [];
  const problems = new Set(CATALOG.map((p) => p.slug).filter((s) => !(s in PROBLEM_CANONICAL)));
  const lessons = new Set(allLessons().map((l) => l.slug));
  const tests = new Set(SKILL_TESTS.map((t) => t.slug));
  let sqlSlugs: Set<string> | null = null;
  try {
    const { SQL_PROBLEMS } = await import("../src/lib/sql-problems/index.js");
    sqlSlugs = new Set(SQL_PROBLEMS.map((p: { slug: string }) => p.slug));
  } catch {
    sqlSlugs = null;
  }
  for (const n of notes) {
    for (const link of noteLinks(n)) {
      const at = `${n.subject}/${n.slug}.md`;
      let m: RegExpExecArray | null;
      if ((m = /^\/problems\/([a-z0-9-]+)$/.exec(link)) && !problems.has(m[1]!)) out.push(`${at}: links to ${link}, which is no catalogue problem`);
      else if ((m = /^\/roadmap\/([a-z0-9-]+)$/.exec(link)) && !lessons.has(m[1]!)) out.push(`${at}: links to ${link}, which is no roadmap lesson`);
      else if ((m = /^\/skill-tests\/([a-z0-9-]+)$/.exec(link)) && !tests.has(m[1]!)) out.push(`${at}: links to ${link}, which is no skill test`);
      else if ((m = /^\/sql\/([a-z0-9-]+)$/.exec(link)) && sqlSlugs && !sqlSlugs.has(m[1]!)) out.push(`${at}: links to ${link}, which is no SQL problem`);
      else if (link.startsWith("/notes/") && link.split("/").length === 3 && !NOTE_SUBJECT_KEYS.has(link.split("/")[2]!)) out.push(`${at}: links to ${link}, which is no subject`);
    }
  }
  return out;
}

async function validate(): Promise<number> {
  const { notes, errors } = readNotes();
  const problems = [...errors, ...validateNotes(notes), ...(await externalLinkProblems(notes))];
  const mine = picked(notes);
  const scoped = subject || only
    ? problems.filter((p) => mine.some((n) => p.startsWith(`${n.subject}/${n.slug}.md`)) || errors.includes(p))
    : problems;
  if (scoped.length) {
    for (const p of scoped) console.error(`  ✗ ${p}`);
    console.error(`\n${scoped.length} problem${scoped.length === 1 ? "" : "s"}`);
    return 1;
  }
  console.log(`✓ ${mine.length} note${mine.length === 1 ? "" : "s"} valid`);
  return 0;
}

async function run(): Promise<number> {
  const { runProgram, normalizeOutput } = await import("../src/lib/program-judge.js");
  const { notes, errors } = readNotes();
  if (errors.length) {
    for (const e of errors) console.error(`  ✗ ${e}`);
    return 1;
  }
  const jobs: Array<{ where: string; language: string; code: string; expected: string }> = [];
  for (const n of picked(notes))
    for (const b of noteBlocks(n.body))
      if (b.kind === "code") for (const s of b.samples) jobs.push({ where: `${n.subject}/${n.slug}.md:${b.line} ${s.language}`, language: s.language, code: s.code, expected: b.output ?? "" });
  console.log(`Running ${jobs.length} programs…`);
  const failures: string[] = [];
  let next = 0;
  const worker = async () => {
    while (next < jobs.length) {
      const job = jobs[next++]!;
      let attempt = 0;
      for (;;) {
        const r = await runProgram(job.code, job.language, "");
        if (r.status === "ENGINE_ERROR" && attempt++ < 2) continue;
        if (r.status !== "ACCEPTED") {
          failures.push(`${job.where}: ${r.status}\n${(r.compileOutput ?? r.stderr ?? "").split("\n").slice(0, 12).map((x) => `      ${x}`).join("\n")}`);
        } else if (normalizeOutput(r.stdout) !== normalizeOutput(job.expected)) {
          failures.push(`${job.where}: printed something else\n      expected: ${JSON.stringify(normalizeOutput(job.expected)).slice(0, 400)}\n      got:      ${JSON.stringify(normalizeOutput(r.stdout)).slice(0, 400)}`);
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
  console.log(`✓ ${jobs.length} programs print what their notes say`);
  return 0;
}

function list(): number {
  const { notes, errors } = readNotes();
  for (const e of errors) console.error(`  ✗ ${e}`);
  for (const s of NOTE_SUBJECTS) {
    const mine = notes.filter((n) => n.subject === s.key).sort((a, b) => a.order - b.order);
    console.log(`\n${s.title} (${mine.length})`);
    for (const n of mine) {
      const figs = noteBlocks(n.body).filter((b) => b.kind === "figure").length;
      console.log(`  ${String(n.order).padStart(2)}. ${n.slug.padEnd(44)} ${String(noteProseWords(n.body)).padStart(5)} words  ${figs} fig  ${n.minutes} min`);
    }
  }
  return 0;
}

const code = flag("--validate") ? await validate() : flag("--run") ? await run() : flag("--list") ? list() : (console.error("usage: --validate | --run | --list"), 2);
process.exit(code);

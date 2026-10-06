import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { lessonBlocks, FIGURE_LINE, type LessonBlock } from "./roadmap-lessons.js";
import { noteFigureProblems } from "./note-figures/index.js";

/**
 * CS fundamentals notes: Operating Systems, Computer Networks, DBMS and OOP,
 * the four subjects every placement round and technical interview in India
 * asks after the coding round (2026-10-05). Each subject already had a skill
 * test (os-*, networks-*, sql-*, oop-*) and nothing to read before it; these
 * are the reading — one page per topic at /notes/<subject>/<slug>, a page
 * per subject at /notes/<subject>, and /notes for all four.
 *
 * Content is Markdown in content/notes/<subject>/<slug>.md, shipped in the
 * API image and read once per process (like the roadmap lessons — a note
 * goes live with a deploy; no seed). The authoring guide and the bar are in
 * content/notes/_AUTHORING.md; `npx tsx scripts/cs-notes.ts --validate` is
 * the offline gate and `--run` sends every code group through the study
 * judge.
 *
 * The body is the roadmap lessons' grammar — `##` sections, GFM tables,
 * code groups (consecutive cpp/java/python/javascript fences then an
 * `output` fence, every program run by the gate) and `@figure <name>` lines
 * (figures in lib/note-figures/<slug>.ts) — so the page reuses the lesson
 * renderer (lessonBlocks here, components/roadmap/lesson on the SPA). What
 * differs is the bar: a note is reference reading for an interview, so it
 * is allowed more words, may show display-only code (a `c` fork() example
 * the judge cannot run, a `sql` query, a `text` packet layout) and does not
 * have to carry code at all.
 */

export interface NoteSubject {
  /** URL segment: /notes/<key>. */
  key: string;
  title: string;
  /** Short name for chips and crumbs. */
  short: string;
  /** One sentence for the subject card and the index. */
  blurb: string;
  /** The subject page's own search title and description. */
  seoTitle: string;
  description: string;
  /** The skill tests that examine this subject (lib/skill-catalog test slugs). */
  tests: string[];
}

export const NOTE_SUBJECTS: readonly NoteSubject[] = [
  {
    key: "operating-systems",
    title: "Operating Systems",
    short: "OS",
    blurb: "Processes, threads, CPU scheduling, synchronization, deadlocks, memory, virtual memory, file systems and disk scheduling.",
    seoTitle: "Operating System Notes for Placements and Interviews",
    description: "Operating system notes for placement interviews: processes, threads, CPU scheduling, deadlocks, paging, virtual memory and file systems, with worked examples.",
    tests: ["os-basic", "os-intermediate"],
  },
  {
    key: "computer-networks",
    title: "Computer Networks",
    short: "CN",
    blurb: "The OSI and TCP/IP models, IP addressing and subnetting, TCP and UDP, DNS, HTTP, routing and what happens when you type a URL.",
    seoTitle: "Computer Networks Notes for Placements and Interviews",
    description: "Computer networks notes for placement interviews: OSI and TCP/IP models, subnetting, TCP vs UDP, DNS, HTTP and HTTPS, routing, with worked examples.",
    tests: ["networks-basic", "networks-intermediate"],
  },
  {
    key: "dbms",
    title: "Database Management Systems",
    short: "DBMS",
    blurb: "ER models, keys, normalization, SQL joins and aggregation, transactions and ACID, concurrency control and indexing.",
    seoTitle: "DBMS Notes for Placements and Interviews",
    description: "DBMS notes for placement interviews: ER model, keys, normalization up to BCNF, SQL joins, transactions and ACID, concurrency control and B+ tree indexing.",
    tests: ["sql-basic", "sql-intermediate"],
  },
  {
    key: "oop",
    title: "Object-Oriented Programming",
    short: "OOP",
    blurb: "Classes and objects, encapsulation, inheritance, polymorphism, abstraction, SOLID and the design patterns interviews ask for.",
    seoTitle: "OOP Notes for Placements and Interviews",
    description: "Object-oriented programming notes for placement interviews: classes, encapsulation, inheritance, polymorphism, abstraction, SOLID and design patterns, with code.",
    tests: ["oop-basic", "oop-intermediate"],
  },
];

export const NOTE_SUBJECT_KEYS = new Set(NOTE_SUBJECTS.map((s) => s.key));
export const subjectByKey = (key: string): NoteSubject | undefined => NOTE_SUBJECTS.find((s) => s.key === key);

export const NOTE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type NoteLevel = (typeof NOTE_LEVELS)[number];

/** Languages a note's code group may carry — the roadmap lessons' four, run by the gate. */
export const NOTE_CODE_LANGUAGES = ["cpp", "java", "python", "javascript"] as const;

export interface NoteFaq {
  q: string;
  a: string;
}

export interface CsNote {
  subject: string;
  slug: string;
  title: string;
  order: number;
  minutes: number;
  level: NoteLevel;
  updated: string;
  seoTitle: string;
  description: string;
  question: string;
  answer: string;
  faq: NoteFaq[];
  body: string;
}

export interface NoteSummary {
  subject: string;
  slug: string;
  title: string;
  order: number;
  minutes: number;
  level: NoteLevel;
  description: string;
}

export const noteSummary = (n: CsNote): NoteSummary => ({
  subject: n.subject,
  slug: n.slug,
  title: n.title,
  order: n.order,
  minutes: n.minutes,
  level: n.level,
  description: n.description,
});

export const notePath = (n: { subject: string; slug: string }): string => `/notes/${n.subject}/${n.slug}`;

/* ── Parsing ─────────────────────────────────────────────────────── */

const KEYS = new Set(["title", "order", "minutes", "level", "updated", "seo-title", "description", "question", "answer", "q", "a"]);
export const NOTE_SLUG = /^[a-z0-9][a-z0-9-]*$/;

/** One note file, parsed; throws with the file name on anything malformed. */
export function parseNote(text: string, subject: string, file: string): CsNote {
  const slug = file.replace(/^.*[\\/]/, "").replace(/\.md$/, "");
  const at = `${subject}/${slug}.md`;
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
  if (!match) throw new Error(`${at}: missing frontmatter`);
  const meta: Record<string, string> = {};
  const faq: NoteFaq[] = [];
  let pendingQ: string | null = null;
  for (const raw of match[1]!.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const colon = line.indexOf(":");
    if (colon === -1) throw new Error(`${at}: frontmatter line without a key: ${line.slice(0, 60)}`);
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (!KEYS.has(key)) throw new Error(`${at}: unknown frontmatter key "${key}"`);
    if (key === "q") {
      if (pendingQ !== null) throw new Error(`${at}: "q:" without its "a:" — ${pendingQ.slice(0, 50)}`);
      pendingQ = value;
      continue;
    }
    if (key === "a") {
      if (pendingQ === null) throw new Error(`${at}: "a:" without a "q:" before it`);
      faq.push({ q: pendingQ, a: value });
      pendingQ = null;
      continue;
    }
    if (key in meta) throw new Error(`${at}: frontmatter key "${key}" appears twice`);
    meta[key] = value;
  }
  if (pendingQ !== null) throw new Error(`${at}: the last "q:" has no "a:"`);
  const need = (key: string): string => {
    const v = meta[key];
    if (!v) throw new Error(`${at}: frontmatter needs "${key}"`);
    return v;
  };
  const level = need("level").toLowerCase() as NoteLevel;
  if (!NOTE_LEVELS.includes(level)) throw new Error(`${at}: level must be one of ${NOTE_LEVELS.join(", ")}`);
  const order = Number(need("order"));
  const minutes = Number(need("minutes"));
  if (!Number.isInteger(order) || order < 1) throw new Error(`${at}: order must be a whole number from 1`);
  if (!Number.isInteger(minutes) || minutes < 1) throw new Error(`${at}: minutes must be a whole number`);
  const updated = need("updated");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) throw new Error(`${at}: updated must be YYYY-MM-DD`);
  return {
    subject,
    slug,
    title: need("title"),
    order,
    minutes,
    level,
    updated,
    seoTitle: need("seo-title"),
    description: need("description"),
    question: need("question"),
    answer: need("answer"),
    faq,
    body: match[2]!.replace(/\r\n?/g, "\n").trim(),
  };
}

/** The body's blocks — the roadmap lessons' walk, so the SPA's lesson renderer draws a note unchanged. */
export const noteBlocks = (body: string): LessonBlock[] => lessonBlocks(body);

/* ── The bar ─────────────────────────────────────────────────────── */

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Prose in words: code, tables' pipes, link targets and `@figure` lines are not words read. */
export function noteProseWords(body: string): number {
  return words(
    body
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/^@figure\s.*$/gm, " ")
      .replace(/\]\([^)\s]*\)/g, "]")
      .replace(/`[^`]*`/g, " x ")
      .replace(/[#*|>_-]/g, " "),
  );
}

/**
 * Words of prose a note carries: enough to answer what an interviewer asks
 * about the topic — the definition, how it works, a worked example, the
 * comparisons and the traps — and not a textbook chapter.
 *
 * Lowered from 900–2,600 when the figures arrived (2026-10-05, the owner's
 * standing "show less content and describe more through graphics"): a
 * figure now carries the Gantt chart, the handshake, the class diagram, and
 * the paragraphs that narrated them went. Less of a drop than the roadmap
 * lessons' (lib/roadmap-lessons PROSE_WORDS, 700–1,800), because what a note
 * is for — the definition to say out loud, the worked example to redo on
 * paper, the comparisons and the interview answers — is text no picture
 * replaces.
 */
export const NOTE_WORDS = { min: 800, max: 2200 } as const;
/** Figures a note places at the least (aim for three to six): where a picture explains better than prose, it explains. */
export const NOTE_FIGURES_MIN = 3;
/** Display-only fences a note may show (no output, not run): anything the judge cannot execute. */
export const DISPLAY_FENCES = new Set(["c", "sql", "text", "bash", "http", "json", "plaintext"]);

/** Everything wrong with one note on its own. Empty when it is fine. */
export function validateNote(n: CsNote): string[] {
  const out: string[] = [];
  const at = `${n.subject}/${n.slug}.md`;
  if (!NOTE_SUBJECT_KEYS.has(n.subject)) out.push(`${at}: "${n.subject}" is not a notes subject`);
  if (!NOTE_SLUG.test(n.slug)) out.push(`${at}: the file name must be a lower-case slug`);
  if (n.title.length > 70) out.push(`${at}: title is ${n.title.length} characters; keep it under 70`);
  if (n.seoTitle.length > 60) out.push(`${at}: seo-title is ${n.seoTitle.length} characters — results cut at about 60`);
  if (n.seoTitle.length < 25) out.push(`${at}: seo-title is too short to say what the page teaches`);
  if (n.description.length < 110 || n.description.length > 158) out.push(`${at}: description is ${n.description.length} characters; keep it 110–158`);
  if (!n.question.endsWith("?")) out.push(`${at}: question should be a question (end with "?")`);
  const answerWords = words(n.answer);
  if (answerWords < 25 || answerWords > 80) out.push(`${at}: the answer is ${answerWords} words; a quotable answer is 25–80`);
  if (n.faq.length < 4 || n.faq.length > 8) out.push(`${at}: ${n.faq.length} q/a pairs; write four to eight`);
  for (const f of n.faq) {
    if (!f.q.endsWith("?")) out.push(`${at}: q "${f.q.slice(0, 40)}" should end with "?"`);
    if (words(f.a) < 12 || words(f.a) > 90) out.push(`${at}: the answer to "${f.q.slice(0, 40)}" is ${words(f.a)} words; keep each 12–90`);
  }
  if (n.minutes < 3 || n.minutes > 30) out.push(`${at}: minutes ${n.minutes} — reading time is 3–30`);
  const outsideFences = n.body.replace(/```[\s\S]*?```/g, "");
  if (/^#\s/m.test(outsideFences)) out.push(`${at}: the body has a "# " heading — the page owns the H1; start at "##"`);
  if (/__CODEKAIRO_/.test(n.body)) out.push(`${at}: the body names a judge sentinel`);
  if (/<\/?[a-z][^>]*>/i.test(outsideFences.replace(/`[^`]*`/g, ""))) out.push(`${at}: the body has raw HTML — write Markdown`);
  const prose = noteProseWords(n.body);
  if (prose < NOTE_WORDS.min) out.push(`${at}: ${prose} words of prose; a note needs at least ${NOTE_WORDS.min}`);
  if (prose > NOTE_WORDS.max) out.push(`${at}: ${prose} words of prose; keep it to ${NOTE_WORDS.max}`);
  const sections = (outsideFences.match(/^##\s/gm) ?? []).length;
  if (sections < 5) out.push(`${at}: ${sections} "##" sections; a note needs at least five`);
  if (!/^##\s+Interview questions\s*$/m.test(outsideFences)) out.push(`${at}: needs a "## Interview questions" section`);
  const blocks = noteBlocks(n.body);
  for (const b of blocks) {
    if (b.kind === "walkthrough") out.push(`${at}:${b.line}: "@walkthrough" is a roadmap lesson marker; a note places figures with "@figure <name>"`);
    if (b.kind !== "code") continue;
    const langs = b.samples.map((s) => s.language);
    const order = NOTE_CODE_LANGUAGES.filter((l) => langs.includes(l));
    if (langs.join(",") !== order.join(",")) out.push(`${at}:${b.line}: a code group's fences go ${NOTE_CODE_LANGUAGES.join(", ")} in that order, each once (found ${langs.join(",")})`);
    if (b.output === null || !b.output.trim()) out.push(`${at}:${b.line}: a code group needs an "output" fence with exactly what it prints`);
    for (const s of b.samples) {
      if (s.language === "java" && !/\bclass\s+Main\b/.test(s.code)) out.push(`${at}:${b.line}: the Java program's public class must be Main`);
      if (s.code.split("\n").length > 80) out.push(`${at}:${b.line}: the ${s.language} program is over 80 lines`);
    }
  }
  // Fences that are neither a code group nor a display language would render as plain text with no label.
  for (const m of n.body.matchAll(/^\s*```\s*([\w+#.-]*)\s*$/gm)) {
    const lang = m[1]!.toLowerCase();
    if (!lang) continue;
    if (!DISPLAY_FENCES.has(lang) && !(NOTE_CODE_LANGUAGES as readonly string[]).includes(lang) && lang !== "output") {
      out.push(`${at}: fence language "${lang}" — use one of ${[...NOTE_CODE_LANGUAGES, ...DISPLAY_FENCES].join(", ")}`);
    }
  }
  const figures = blocks.flatMap((b) => (b.kind === "figure" ? [b.name] : []));
  if (figures.length < NOTE_FIGURES_MIN) out.push(`${at}: ${figures.length} figures; a note needs at least ${NOTE_FIGURES_MIN} — draw it rather than describe it`);
  const placed = new Set<string>();
  for (const name of figures) {
    if (placed.has(name)) out.push(`${at}: figure "${name}" is placed twice`);
    else out.push(...noteFigureProblems(n.slug, name));
    placed.add(name);
  }
  const lines = n.body.split("\n");
  lines.forEach((line, i) => {
    const t = line.trim();
    if (/^@figure\b/.test(t) && !FIGURE_LINE.test(t)) out.push(`${at}:${i + 1}: write "@figure <name>" with a lower-case name (found "${t}")`);
    if (!FIGURE_LINE.test(t)) return;
    if ((i > 0 && lines[i - 1]!.trim()) || (i < lines.length - 1 && lines[i + 1]!.trim())) out.push(`${at}:${i + 1}: "${t}" needs a blank line before and after it`);
  });
  return out;
}

/** Internal links in a note (body and answers): the paths to check exist. */
export function noteLinks(n: CsNote): string[] {
  const text = [n.body.replace(/```[\s\S]*?```/g, " "), n.answer, ...n.faq.map((f) => f.a)].join("\n");
  return [...text.matchAll(/\]\((\/[^)\s#]*)(?:#[^)\s]*)?\)/g)].map((m) => m[1]!);
}

/**
 * The checks across notes: unique slugs (a slug names its figures module,
 * so it is unique across subjects too), titles, search titles and
 * descriptions; one note per order within a subject; links to another note
 * resolve.
 */
export function validateNotes(notes: CsNote[]): string[] {
  const out = notes.flatMap(validateNote);
  const seen = new Map<string, string>();
  const same = (kind: string, value: string, n: CsNote) => {
    const key = `${kind}:${value.toLowerCase()}`;
    const other = seen.get(key);
    if (other) out.push(`${n.subject}/${n.slug}.md: the same ${kind} as ${other}`);
    else seen.set(key, `${n.subject}/${n.slug}.md`);
  };
  const places = new Set<string>();
  for (const n of notes) {
    same("slug", n.slug, n);
    same("title", n.title, n);
    same("seo-title", n.seoTitle, n);
    same("description", n.description, n);
    const place = `${n.subject}#${n.order}`;
    if (places.has(place)) out.push(`${n.subject}/${n.slug}.md: another note is order ${n.order} of ${n.subject}`);
    places.add(place);
  }
  const paths = new Set(notes.map(notePath));
  for (const n of notes) {
    for (const link of noteLinks(n)) {
      if (link.startsWith("/notes/") && link.split("/").length === 4 && !paths.has(link)) out.push(`${n.subject}/${n.slug}.md: links to ${link}, which is no note`);
      if (link.startsWith("/notes/") && link.split("/").length === 3 && !NOTE_SUBJECT_KEYS.has(link.split("/")[2]!)) out.push(`${n.subject}/${n.slug}.md: links to ${link}, which is no subject`);
    }
  }
  return out;
}

/* ── Loading ─────────────────────────────────────────────────────── */

/** content/notes, beside src/ and dist/ alike (the image copies content/). */
export const NOTES_DIR = fileURLToPath(new URL("../../content/notes/", import.meta.url));

/** Every note file, parsed — errors collected rather than thrown (the gate script reports them). */
export function readNotes(): { notes: CsNote[]; errors: string[] } {
  const notes: CsNote[] = [];
  const errors: string[] = [];
  for (const subject of NOTE_SUBJECTS) {
    const dir = `${NOTES_DIR}${subject.key}/`;
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_")).sort();
    for (const file of files) {
      try {
        notes.push(parseNote(readFileSync(`${dir}${file}`, "utf8"), subject.key, file));
      } catch (err) {
        errors.push((err as Error).message);
      }
    }
  }
  return { notes, errors };
}

let loaded: CsNote[] | null = null;

/** Every note, read once per process; a malformed file is logged and left out rather than taking the section down. */
export function allNotes(): CsNote[] {
  if (loaded) return loaded;
  const { notes, errors } = readNotes();
  for (const e of errors) console.error(`[cs-notes] ${e}`);
  const order = new Map(NOTE_SUBJECTS.map((s, i) => [s.key, i]));
  loaded = notes.sort((a, b) => (order.get(a.subject)! - order.get(b.subject)!) || a.order - b.order);
  return loaded;
}

export const notesFor = (subject: string): CsNote[] => allNotes().filter((n) => n.subject === subject);
export const noteBy = (subject: string, slug: string): CsNote | undefined => allNotes().find((n) => n.subject === subject && n.slug === slug);

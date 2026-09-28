/**
 * The study plans' authoring format.
 *
 * A track is a directory (scripts/study-plans/<track>/) holding a track.ts
 * and one directory per module. Each module directory has a module.ts —
 * the module's metadata and, per lesson, its exercises and quiz — and one
 * Markdown file per lesson holding the prose. Prose lives in .md files
 * rather than template literals because a language lesson is mostly code
 * fences and inline code, and escaping every backtick made the earlier
 * drafts unreadable; exercises and quizzes stay in TypeScript because they
 * are structured data tsc can check (an answer index past the options, a
 * case without an expected output) before the validator ever runs.
 *
 * `defineModule` reads the lesson files next to the module.ts that calls it
 * and returns the assembled seed; `validateTrack` is the offline gate
 * (`seed-study-plans.ts --validate`), and the reference solutions are run
 * through the real judge by `--validate --run`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface ExerciseCase {
  stdin: string;
  expected: string;
  /** Shown as pass/fail only. At least one visible case per exercise. */
  hidden?: boolean;
}

export interface ExerciseSeed {
  title: string;
  /** Markdown: what to write, the input format, the output format. */
  prompt: string;
  /** What the editor opens with. */
  starter: string;
  /** Must pass every case on the track's runtime — `--validate --run` proves it. */
  solution: string;
  /** Progressive, weakest first. */
  hints: string[];
  cases: ExerciseCase[];
}

/**
 * An exercise as authored. Code may be inline or in a file beside module.ts
 * (`code/<name>.js`): Java sits happily in a String.raw template, but a
 * JavaScript solution is full of backticks and ${} and would need every
 * one escaped — a file keeps it readable and lets the editor highlight it.
 */
export interface ExerciseSource extends Omit<ExerciseSeed, "starter" | "solution"> {
  starter?: string;
  /** Path relative to the module directory; used when `starter` is absent. */
  starterFile?: string;
  solution?: string;
  solutionFile?: string;
}

export interface QuizSeed {
  /** Markdown; a "predict the output" question carries its code here. */
  prompt: string;
  options: string[];
  /** Index into options. */
  answer: number;
  /** Markdown: why, and why the tempting wrong answers are wrong. */
  explanation: string;
}

/**
 * What a search engine is told about a lesson, and the questions the page
 * answers in so many words. Authored in the lesson's frontmatter, beside
 * the title, because it is about that text and nothing else:
 *
 *   seo-title:   What Is the JVM? JDK vs JRE vs JVM Explained
 *   description: The JVM runs Java bytecode, the JRE adds the class library…
 *   question:    What is the JVM?
 *   answer:      The Java Virtual Machine (JVM) is the program that runs…
 *   q:           What is the difference between JDK, JRE and JVM?
 *   a:           They are nested layers. The JVM executes bytecode; …
 *   q: …         (three to six pairs, in the order the page prints them)
 *
 * The lesson's own title stays the page's heading — it is written for a
 * reader who is already there. `seo-title` is written for one who is not:
 * the words they would type ("what is the jvm", "java hashmap vs
 * treemap"), answered. `question`/`answer` is printed under the heading as
 * a direct answer in forty-odd words — the paragraph a search result
 * quotes — and the `q`/`a` pairs after the text as "Common questions",
 * marked up as an FAQ (services/seo.ts, the SPA's structured-data). Both
 * are on the page for every reader, so the markup never claims text the
 * page does not show. One line per value; inline Markdown (`code`) is fine
 * in the questions and answers, not in the title or description, which a
 * results page prints as plain text.
 */
export interface LessonSeo {
  title: string;
  description: string;
  /** The lesson's main question and its direct answer; required on a lesson, optional on a checkpoint. */
  question: string | null;
  answer: string | null;
  faq: Array<{ q: string; a: string }>;
}

export interface LessonSource {
  /** URL segment, unique within the track. */
  slug: string;
  /** The Markdown file beside module.ts. Frontmatter: title, minutes, and the search fields (LessonSeo). */
  file: string;
  kind?: "lesson" | "test";
  exercises?: ExerciseSource[];
  quiz?: QuizSeed[];
  /** Tests only: percent of the quiz to clear. */
  passMark?: number;
  /** Paid once, when the lesson is complete. Lessons 10, tests 25 by default. */
  xp?: number;
}

export interface ModuleSource {
  /** URL segment, unique within the track ("jvm"). */
  slug: string;
  title: string;
  blurb: string;
  /** A glyph key the client maps to an icon. */
  icon: string;
  /** Markdown: what the module covers and why it matters — the module page and the PDF cover. */
  overview: string;
  lessons: LessonSource[];
}

export interface LessonSeed {
  slug: string;
  title: string;
  kind: "lesson" | "test";
  minutes: number;
  body: string;
  exercises: ExerciseSeed[];
  quiz: QuizSeed[];
  passMark: number | null;
  xp: number;
  /** Null only while a lesson has no search fields yet — which validateTrack refuses. */
  seo: LessonSeo | null;
}

export interface ModuleSeed extends Omit<ModuleSource, "lessons"> {
  lessons: LessonSeed[];
}

export interface TrackSeed {
  key: string;
  title: string;
  blurb: string;
  /** The judge language id the exercises run as. */
  language: string;
  /** What the exercises compile on; shown beside the editor. */
  runtime: string;
  modules: ModuleSeed[];
}

const FRONTMATTER_KEYS = new Set(["title", "minutes", "seo-title", "description", "question", "answer", "q", "a"]);

/**
 * `--- title: … / minutes: … / the search fields ---` then the body. One
 * `key: value` per line; `q` and `a` repeat and pair up in order. A key the
 * format does not know is refused rather than dropped, so a typo
 * (`seo_title`) cannot quietly leave a lesson with no search title.
 */
function parseLessonFile(text: string, file: string): { title: string; minutes: number; body: string; seo: LessonSeo | null } {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing frontmatter`);
  const meta: Record<string, string> = {};
  const faq: Array<{ q: string; a: string }> = [];
  for (const line of match[1]!.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const at = line.indexOf(":");
    if (at === -1) throw new Error(`${file}: frontmatter line without a key: ${line.slice(0, 60)}`);
    const key = line.slice(0, at).trim();
    const value = line.slice(at + 1).trim();
    if (!FRONTMATTER_KEYS.has(key)) throw new Error(`${file}: unknown frontmatter key "${key}"`);
    if (key === "q") faq.push({ q: value, a: "" });
    else if (key === "a") {
      const last = faq[faq.length - 1];
      if (!last || last.a) throw new Error(`${file}: an "a:" line with no "q:" before it`);
      last.a = value;
    } else {
      if (key in meta) throw new Error(`${file}: frontmatter key "${key}" appears twice`);
      meta[key] = value;
    }
  }
  const title = meta["title"];
  const minutes = parseInt(meta["minutes"] ?? "", 10);
  if (!title) throw new Error(`${file}: frontmatter needs a title`);
  if (!Number.isFinite(minutes) || minutes <= 0) throw new Error(`${file}: frontmatter needs minutes`);
  const unanswered = faq.find((f) => !f.a);
  if (unanswered) throw new Error(`${file}: "q: ${unanswered.q.slice(0, 50)}" has no "a:" line after it`);
  const seo: LessonSeo | null =
    meta["seo-title"] || meta["description"] || meta["question"] || meta["answer"] || faq.length
      ? { title: meta["seo-title"] ?? "", description: meta["description"] ?? "", question: meta["question"] || null, answer: meta["answer"] || null, faq }
      : null;
  return { title, minutes, body: match[2]!.replace(/\r\n/g, "\n").trim() + "\n", seo };
}

/**
 * The anchor a body heading gets on the page — the SPA's
 * components/study/lesson-anchors and the API's lib/markdown-html compute
 * the same one, so "#the-jvm-an-abstract-machine-made-real" lands in the
 * same place in the prerendered HTML and the running page. Here only to
 * refuse a heading whose anchor would collide with the page's own.
 */
const headingAnchor = (text: string) =>
  text
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
/** Ids the lesson page gives its own sections (the answer, the questions, the exercises, the quiz, the module list). */
const PAGE_ANCHORS = new Set(["answer", "questions", "lesson", "exercises", "quiz", "module", "contents"]);

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** The search fields' rules, as messages. */
function seoProblems(at: string, lesson: LessonSeed): string[] {
  const problems: string[] = [];
  const seo = lesson.seo;
  if (!seo) return [`${at}: no search fields — add seo-title, description${lesson.kind === "lesson" ? ", question, answer and three to six q/a pairs" : ""} to the frontmatter`];
  const plain = (field: string, value: string) => {
    if (/[`*_[\]<>]/.test(value)) problems.push(`${at}: ${field} is printed as plain text — no Markdown or angle brackets`);
  };
  if (seo.title.length < 20 || seo.title.length > 62) problems.push(`${at}: seo-title is ${seo.title.length} characters; keep it 20–62 (the brand is added after it)`);
  plain("seo-title", seo.title);
  if (seo.description.length < 110 || seo.description.length > 160) problems.push(`${at}: description is ${seo.description.length} characters; keep it 110–160`);
  plain("description", seo.description);
  if (Boolean(seo.question) !== Boolean(seo.answer)) problems.push(`${at}: question and answer come as a pair`);
  if (lesson.kind === "lesson" && !seo.question) problems.push(`${at}: a lesson needs its question and answer`);
  if (seo.question && !seo.question.endsWith("?")) problems.push(`${at}: question should end with "?"`);
  if (seo.answer && (words(seo.answer) < 30 || words(seo.answer) > 80)) problems.push(`${at}: answer is ${words(seo.answer)} words; a direct answer is 30–80`);
  const [min, max] = lesson.kind === "lesson" ? [3, 6] : [0, 6];
  if (seo.faq.length < min || seo.faq.length > max) problems.push(`${at}: ${seo.faq.length} q/a pairs; needs ${min}–${max}`);
  const seen = new Set(seo.question ? [seo.question.toLowerCase()] : []);
  seo.faq.forEach(({ q, a }, i) => {
    const q_ = `${at} q #${i + 1}`;
    if (!q.endsWith("?")) problems.push(`${q_}: should end with "?"`);
    if (q.length < 10 || q.length > 120) problems.push(`${q_}: question is ${q.length} characters; keep it 10–120`);
    if (words(a) < 12 || words(a) > 90) problems.push(`${q_}: answer is ${words(a)} words; keep it 12–90`);
    if (seen.has(q.toLowerCase())) problems.push(`${q_}: asked twice`);
    seen.add(q.toLowerCase());
  });
  const text = [seo.title, seo.description, seo.question ?? "", seo.answer ?? "", ...seo.faq.flatMap((f) => [f.q, f.a])].join("\n");
  if (text.includes(RESERVED)) problems.push(`${at}: search fields contain the reserved marker`);
  return problems;
}

/** Search titles and descriptions must be unique across every track: two pages with one title compete with each other. */
export function validateAcrossTracks(tracks: TrackSeed[]): string[] {
  const problems: string[] = [];
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  for (const track of tracks) {
    for (const module of track.modules) {
      for (const lesson of module.lessons) {
        if (!lesson.seo) continue;
        const where = `${track.key}/${lesson.slug}`;
        const t = lesson.seo.title.toLowerCase();
        const d = lesson.seo.description.toLowerCase();
        if (titles.has(t)) problems.push(`${where}: seo-title is also ${titles.get(t)}'s`);
        else titles.set(t, where);
        if (descriptions.has(d)) problems.push(`${where}: description is also ${descriptions.get(d)}'s`);
        else descriptions.set(d, where);
      }
    }
  }
  return problems;
}

/**
 * Assemble a module from its module.ts (`importMetaUrl` locates the lesson
 * files). `extras` is a second batch of exercises keyed by lesson slug —
 * the modules written before every lesson carried two programs keep their
 * original module.ts and add a more-exercises.ts beside it, which is easier
 * to review than a 1 000-line file that changed in ninety places. A key that
 * names no lesson is an authoring mistake and fails loudly.
 */
export function defineModule(importMetaUrl: string, source: ModuleSource, extras: Record<string, ExerciseSource[]> = {}): ModuleSeed {
  const dir = path.dirname(fileURLToPath(importMetaUrl));
  const unused = new Set(Object.keys(extras));
  const code = (inline: string | undefined, file: string | undefined, what: string): string => {
    if (inline !== undefined) return inline;
    if (!file) throw new Error(`${source.slug}: exercise "${what}" has neither inline code nor a file`);
    return fs.readFileSync(path.join(dir, file), "utf8").replace(/\r\n/g, "\n");
  };
  const resolve = (e: ExerciseSource): ExerciseSeed => ({
    title: e.title,
    prompt: e.prompt,
    starter: code(e.starter, e.starterFile, e.title),
    solution: code(e.solution, e.solutionFile, e.title),
    hints: e.hints,
    cases: e.cases,
  });
  const assembled: ModuleSeed = {
    ...source,
    lessons: source.lessons.map((lesson) => {
      unused.delete(lesson.slug);
      const file = path.join(dir, lesson.file);
      const { title, minutes, body, seo } = parseLessonFile(fs.readFileSync(file, "utf8"), lesson.file);
      const kind = lesson.kind ?? "lesson";
      return {
        slug: lesson.slug,
        title,
        kind,
        minutes,
        body,
        exercises: [...(lesson.exercises ?? []), ...(extras[lesson.slug] ?? [])].map(resolve),
        quiz: lesson.quiz ?? [],
        passMark: kind === "test" ? lesson.passMark ?? 70 : null,
        xp: lesson.xp ?? (kind === "test" ? 25 : 10),
        seo,
      };
    }),
  };
  if (unused.size > 0) throw new Error(`${source.slug}: extra exercises for unknown lesson(s) ${[...unused].join(", ")}`);
  return assembled;
}

/** Java source code the runtime would refuse or the judge cannot see through. */
const RESERVED = "__CODEXA_";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Every problem with the track, as messages; empty means it is sound. */
export function validateTrack(track: TrackSeed): string[] {
  const problems: string[] = [];
  const moduleSlugs = new Set<string>();
  const lessonSlugs = new Set<string>();

  if (!SLUG.test(track.key)) problems.push(`track key "${track.key}" is not a slug`);
  if (track.modules.length === 0) problems.push("track has no modules");

  for (const module of track.modules) {
    const where = `module ${module.slug}`;
    if (!SLUG.test(module.slug)) problems.push(`${where}: slug is not a slug`);
    if (moduleSlugs.has(module.slug)) problems.push(`${where}: duplicate module slug`);
    moduleSlugs.add(module.slug);
    if (!module.overview.trim()) problems.push(`${where}: empty overview`);
    if (module.lessons.length === 0) problems.push(`${where}: no lessons`);
    const tests = module.lessons.filter((l) => l.kind === "test");
    if (tests.length !== 1) problems.push(`${where}: needs exactly one test lesson, has ${tests.length}`);
    if (module.lessons[module.lessons.length - 1]?.kind !== "test") problems.push(`${where}: the test must be the last lesson`);

    for (const lesson of module.lessons) {
      const at = `${where} / ${lesson.slug}`;
      if (!SLUG.test(lesson.slug)) problems.push(`${at}: slug is not a slug`);
      if (lessonSlugs.has(lesson.slug)) problems.push(`${at}: duplicate lesson slug in the track`);
      lessonSlugs.add(lesson.slug);
      if (lesson.body.trim().length < 400) problems.push(`${at}: body is too short to be a lesson (${lesson.body.trim().length} chars)`);
      if (lesson.body.includes(RESERVED)) problems.push(`${at}: body contains the reserved marker`);
      problems.push(...seoProblems(at, lesson));
      let fenced = false;
      for (const line of lesson.body.split("\n")) {
        if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
        const heading = fenced ? null : /^#{2,3}\s+(.+?)\s*#*\s*$/.exec(line);
        if (heading && PAGE_ANCHORS.has(headingAnchor(heading[1]!))) problems.push(`${at}: heading "${heading[1]}" would take the page's own #${headingAnchor(heading[1]!)} anchor — reword it`);
      }
      if (lesson.kind === "test") {
        if (lesson.quiz.length < 10) problems.push(`${at}: a test needs at least 10 questions, has ${lesson.quiz.length}`);
        if (lesson.exercises.length < 1) problems.push(`${at}: a test needs at least one exercise`);
        if (lesson.passMark === null || lesson.passMark < 50 || lesson.passMark > 100) problems.push(`${at}: passMark must be 50–100`);
      } else {
        if (lesson.quiz.length < 3) problems.push(`${at}: a lesson needs at least 3 quiz questions, has ${lesson.quiz.length}`);
      }
      lesson.quiz.forEach((q, i) => {
        const q_ = `${at} quiz #${i + 1}`;
        if (!q.prompt.trim()) problems.push(`${q_}: empty prompt`);
        if (q.options.length < 2 || q.options.length > 6) problems.push(`${q_}: needs 2–6 options`);
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) problems.push(`${q_}: answer index out of range`);
        if (new Set(q.options.map((o) => o.trim())).size !== q.options.length) problems.push(`${q_}: duplicate options`);
        if (!q.explanation.trim()) problems.push(`${q_}: empty explanation`);
      });
      lesson.exercises.forEach((e, i) => {
        const e_ = `${at} exercise #${i + 1}`;
        if (!e.title.trim() || !e.prompt.trim()) problems.push(`${e_}: needs a title and a prompt`);
        if (!e.starter.trim() || !e.solution.trim()) problems.push(`${e_}: needs starter and solution code`);
        if (e.solution.includes(RESERVED) || e.starter.includes(RESERVED)) problems.push(`${e_}: code contains the reserved marker`);
        if (e.cases.length < 1 || e.cases.length > 6) problems.push(`${e_}: needs 1–6 cases, has ${e.cases.length}`);
        if (!e.cases.some((c) => !c.hidden)) problems.push(`${e_}: every case is hidden`);
        e.cases.forEach((c, j) => {
          if (typeof c.stdin !== "string" || typeof c.expected !== "string") problems.push(`${e_} case #${j + 1}: stdin and expected must be strings`);
          if (!c.expected.trim()) problems.push(`${e_} case #${j + 1}: expected output is empty`);
        });
      });
    }
  }
  return problems;
}

/** Counts for the console. */
export function summarize(track: TrackSeed): string {
  const lessons = track.modules.reduce((n, m) => n + m.lessons.length, 0);
  const exercises = track.modules.reduce((n, m) => n + m.lessons.reduce((k, l) => k + l.exercises.length, 0), 0);
  const questions = track.modules.reduce((n, m) => n + m.lessons.reduce((k, l) => k + l.quiz.length, 0), 0);
  const words = track.modules.reduce((n, m) => n + m.lessons.reduce((k, l) => k + l.body.split(/\s+/).length, 0), 0);
  return `${track.title}: ${track.modules.length} modules · ${lessons} lessons · ${exercises} exercises · ${questions} questions · ~${Math.round(words / 1000)}k words`;
}

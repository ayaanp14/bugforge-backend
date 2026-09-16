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

export interface LessonSource {
  /** URL segment, unique within the track. */
  slug: string;
  /** The Markdown file beside module.ts. Frontmatter: title, minutes. */
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

/** `--- title: … / minutes: … ---` then the body. */
function parseLessonFile(text: string, file: string): { title: string; minutes: number; body: string } {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing frontmatter`);
  const meta: Record<string, string> = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    const at = line.indexOf(":");
    if (at === -1) continue;
    meta[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  const title = meta["title"];
  const minutes = parseInt(meta["minutes"] ?? "", 10);
  if (!title) throw new Error(`${file}: frontmatter needs a title`);
  if (!Number.isFinite(minutes) || minutes <= 0) throw new Error(`${file}: frontmatter needs minutes`);
  return { title, minutes, body: match[2]!.replace(/\r\n/g, "\n").trim() + "\n" };
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
      const { title, minutes, body } = parseLessonFile(fs.readFileSync(file, "utf8"), lesson.file);
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

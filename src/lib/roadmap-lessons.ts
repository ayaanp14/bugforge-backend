import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * The DSA roadmap's lessons: the tutorial text behind each stage.
 *
 * The road (scripts/roadmap-data.ts → RoadmapStage) says what to practise
 * and in what order; a lesson says how the technique works — the long-form
 * article a search for "two pointers technique" or "what is a greedy
 * algorithm" should land on. Each stage carries one to four of them, so the
 * road is the syllabus: the lesson page's sidebar is the road itself (tiers
 * → stages → lessons), and the stage panel on the map lists its lessons
 * above its problems (user, 2026-10-02 — one syllabus rather than a
 * separate tutorial section beside the roadmap that would drift from it).
 *
 * Lessons are Markdown files in content/roadmap/<slug>.md, shipped with the
 * API image like the assistant's handbook — no seed, no table: a lesson is
 * read once per process and served from memory. The URL is
 * /roadmap/<slug>, public to everyone and indexed; the stage's lock guides
 * the problems only, never the reading.
 *
 * File shape — frontmatter between `---` lines, one `key: value` per line
 * (the study plans' format, scripts/study-plans/dsl.ts), then the body:
 *
 *   title, stage (a road stage key), order (within the stage), minutes,
 *   level (Beginner | Intermediate | Advanced), hub (a /challenges topic
 *   slug — the practice hub and the walkthrough), practice (comma-separated
 *   catalogue slugs, easiest first), updated (YYYY-MM-DD, the sitemap's
 *   lastmod), seo-title, description, question, answer, then q:/a: pairs.
 *
 * Body conventions, which both renderers know (the SPA's
 * components/roadmap/lesson and lib/markdown-html at the edge):
 *
 *  - `##` sections and `###` subsections; never a `#` — the page owns the H1.
 *  - Code comes in groups: the same program in C++, Java, Python and
 *    JavaScript as four consecutive fences in that order, then an `output`
 *    fence with exactly what it prints. The SPA draws a group as language
 *    tabs over its output; the edge prints the blocks in order. Every group
 *    is a whole program and is run on the judge before it ships
 *    (scripts/roadmap-lessons.ts --run), so a lesson never teaches code that
 *    does not compile. Pseudocode and diagrams go in `text` fences.
 *  - A line holding only `@walkthrough` places the hub's step-by-step
 *    figure (lib/walkthroughs) — animated on the page, its last frame and
 *    captions in the HTML.
 */

export const LESSON_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
export type LessonLevel = (typeof LESSON_LEVELS)[number];

/** The languages every code group carries, in tab order. */
export const LESSON_LANGUAGES = ["cpp", "java", "python", "javascript"] as const;
export type LessonLanguage = (typeof LESSON_LANGUAGES)[number];

/** Segments of /roadmap/ that are pages of their own, never a lesson. */
export const RESERVED_LESSON_SLUGS = new Set(["certificate", "lessons"]);

export interface LessonFaq {
  q: string;
  a: string;
}

export interface RoadmapLesson {
  slug: string;
  title: string;
  stage: string;
  order: number;
  minutes: number;
  level: LessonLevel;
  hub: string | null;
  practice: string[];
  updated: string;
  seoTitle: string;
  description: string;
  question: string;
  answer: string;
  faq: LessonFaq[];
  body: string;
}

/** What a stage panel, the sidebar and the road's payload list per lesson. */
export interface LessonSummary {
  slug: string;
  title: string;
  minutes: number;
  level: LessonLevel;
}

export const summaryOf = (l: RoadmapLesson): LessonSummary => ({ slug: l.slug, title: l.title, minutes: l.minutes, level: l.level });

/* ── Parsing ─────────────────────────────────────────────────────── */

const KEYS = new Set(["title", "stage", "order", "minutes", "level", "hub", "practice", "updated", "seo-title", "description", "question", "answer", "q", "a"]);
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

/** One lesson file, parsed; throws with the file name on anything malformed. */
export function parseLesson(text: string, file: string): RoadmapLesson {
  const slug = file.replace(/^.*[\\/]/, "").replace(/\.md$/, "");
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
  if (!match) throw new Error(`${file}: missing frontmatter`);
  const meta: Record<string, string> = {};
  const faq: LessonFaq[] = [];
  let pendingQ: string | null = null;
  for (const raw of match[1].split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const at = line.indexOf(":");
    if (at === -1) throw new Error(`${file}: frontmatter line without a key: ${line.slice(0, 60)}`);
    const key = line.slice(0, at).trim();
    const value = line.slice(at + 1).trim();
    if (!KEYS.has(key)) throw new Error(`${file}: unknown frontmatter key "${key}"`);
    if (key === "q") {
      if (pendingQ !== null) throw new Error(`${file}: "q:" without its "a:" — ${pendingQ.slice(0, 50)}`);
      pendingQ = value;
      continue;
    }
    if (key === "a") {
      if (pendingQ === null) throw new Error(`${file}: "a:" without a "q:" before it`);
      faq.push({ q: pendingQ, a: value });
      pendingQ = null;
      continue;
    }
    if (key in meta) throw new Error(`${file}: frontmatter key "${key}" appears twice`);
    meta[key] = value;
  }
  if (pendingQ !== null) throw new Error(`${file}: the last "q:" has no "a:"`);
  const need = (key: string): string => {
    const v = meta[key];
    if (!v) throw new Error(`${file}: frontmatter needs "${key}"`);
    return v;
  };
  const level = need("level") as LessonLevel;
  if (!LESSON_LEVELS.includes(level)) throw new Error(`${file}: level must be one of ${LESSON_LEVELS.join(", ")}`);
  const order = Number(need("order"));
  const minutes = Number(need("minutes"));
  if (!Number.isInteger(order) || order < 1) throw new Error(`${file}: order must be a whole number from 1`);
  if (!Number.isInteger(minutes) || minutes < 1) throw new Error(`${file}: minutes must be a whole number`);
  const updated = need("updated");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) throw new Error(`${file}: updated must be YYYY-MM-DD`);
  return {
    slug,
    title: need("title"),
    stage: need("stage"),
    order,
    minutes,
    level,
    hub: meta["hub"] || null,
    practice: (meta["practice"] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    updated,
    seoTitle: need("seo-title"),
    description: need("description"),
    question: need("question"),
    answer: need("answer"),
    faq,
    body: match[2].replace(/\r\n?/g, "\n").trim(),
  };
}

/* ── The body's blocks ───────────────────────────────────────────── */

export type LessonBlock =
  | { kind: "text"; markdown: string; line: number }
  | { kind: "code"; samples: Array<{ language: string; code: string }>; output: string | null; line: number }
  | { kind: "walkthrough"; line: number };

const FENCE_OPEN = /^\s*(```|~~~)\s*([\w+#.-]*)\s*$/;
const CODE_LANGS = new Set<string>(LESSON_LANGUAGES);

/**
 * The body cut into prose, code groups and the walkthrough marker, each
 * with its first line (1-based, in the body) so heading anchors computed
 * over the whole body still land. The SPA's components/roadmap/lesson
 * lesson-blocks.ts is the same walk, line for line.
 */
export function lessonBlocks(body: string): LessonBlock[] {
  const lines = body.split("\n");
  const blocks: LessonBlock[] = [];
  let text: string[] = [];
  let textStart = 1;
  const flush = () => {
    if (text.some((l) => l.trim())) blocks.push({ kind: "text", markdown: text.join("\n"), line: textStart });
    text = [];
  };
  /** A fenced block at line i: its language, code and the line after it. */
  const fenceAt = (i: number): { lang: string; code: string; end: number; marker: string } | null => {
    const open = FENCE_OPEN.exec(lines[i] ?? "");
    if (!open) return null;
    const close = new RegExp(`^\\s*${open[1]}\\s*$`);
    const code: string[] = [];
    let j = i + 1;
    while (j < lines.length && !close.test(lines[j])) code.push(lines[j++]);
    return { lang: open[2].toLowerCase(), code: code.join("\n"), end: j + 1, marker: open[1] };
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "@walkthrough") {
      flush();
      blocks.push({ kind: "walkthrough", line: i + 1 });
      i++;
      textStart = i + 1;
      continue;
    }
    const fence = fenceAt(i);
    if (fence && CODE_LANGS.has(fence.lang)) {
      flush();
      const start = i + 1;
      const samples: Array<{ language: string; code: string }> = [];
      let output: string | null = null;
      let at: number = i;
      // Consecutive fences, blank lines between allowed.
      for (;;) {
        let k = at;
        while (k < lines.length && !lines[k].trim()) k++;
        const next = k < lines.length ? fenceAt(k) : null;
        if (!next) break;
        if (CODE_LANGS.has(next.lang) && output === null) {
          samples.push({ language: next.lang, code: next.code });
          at = next.end;
          continue;
        }
        if (next.lang === "output" && samples.length && output === null) {
          output = next.code;
          at = next.end;
        }
        break;
      }
      blocks.push({ kind: "code", samples, output, line: start });
      i = at;
      textStart = i + 1;
      continue;
    }
    if (fence) {
      // Any other fence is prose (a `text` diagram, pseudocode): kept whole
      // so a "##" inside it is never read as a heading.
      if (!text.length) textStart = i + 1;
      text.push(...lines.slice(i, fence.end));
      i = fence.end;
      continue;
    }
    if (!text.length) textStart = i + 1;
    text.push(line);
    i++;
  }
  flush();
  return blocks;
}

/** The body as one Markdown document for the edge: the walkthrough marker left as its own paragraph for the caller to replace. */
export const WALKTHROUGH_MARKER = "@walkthrough";

/* ── Validation ──────────────────────────────────────────────────── */

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
/** Prose only: code, tables' pipes and markup do not count as words read. */
export function proseWords(body: string): number {
  return words(
    body
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`[^`]*`/g, " x ")
      .replace(/[#*|>_-]/g, " "),
  );
}

/**
 * Everything wrong with one lesson on its own (the cross-lesson checks —
 * unique titles, stage order, links — are in validateLessons). Empty when
 * it is fine. The bar is the page's job: a search landing that answers the
 * question in the first screen, then teaches it properly.
 */
export function validateLesson(l: RoadmapLesson): string[] {
  const out: string[] = [];
  const at = `${l.slug}.md`;
  if (!SLUG.test(l.slug)) out.push(`${at}: the file name must be a lower-case slug`);
  if (RESERVED_LESSON_SLUGS.has(l.slug)) out.push(`${at}: "${l.slug}" is a page of its own under /roadmap/`);
  if (l.seoTitle.length > 60) out.push(`${at}: seo-title is ${l.seoTitle.length} characters — results cut at about 60`);
  if (l.seoTitle.length < 25) out.push(`${at}: seo-title is too short to say what the page teaches`);
  if (l.description.length < 110 || l.description.length > 158) out.push(`${at}: description is ${l.description.length} characters; keep it 110–158`);
  const answerWords = words(l.answer);
  if (answerWords < 25 || answerWords > 80) out.push(`${at}: the answer is ${answerWords} words; a quotable answer is 25–80`);
  if (l.faq.length < 4 || l.faq.length > 8) out.push(`${at}: ${l.faq.length} q/a pairs; write four to eight`);
  if (l.practice.length < 3 || l.practice.length > 10) out.push(`${at}: ${l.practice.length} practice problems; list three to ten`);
  if (new Set(l.practice).size !== l.practice.length) out.push(`${at}: a practice problem is listed twice`);
  if (/^#\s/m.test(l.body.replace(/```[\s\S]*?```/g, ""))) out.push(`${at}: the body has a "# " heading — the page owns the H1; start at "##"`);
  if (/__CODEXA_/.test(l.body)) out.push(`${at}: the body names a judge sentinel`);
  const prose = proseWords(l.body);
  if (prose < 1200) out.push(`${at}: ${prose} words of prose; a lesson needs at least 1,200`);
  const sections = (l.body.replace(/```[\s\S]*?```/g, "").match(/^##\s/gm) ?? []).length;
  if (sections < 6) out.push(`${at}: ${sections} "##" sections; a lesson needs at least six`);
  const blocks = lessonBlocks(l.body);
  const groups = blocks.filter((b): b is Extract<LessonBlock, { kind: "code" }> => b.kind === "code");
  if (!groups.length) out.push(`${at}: no code group — every lesson shows the technique in all four languages`);
  for (const g of groups) {
    const langs = g.samples.map((s) => s.language).join(",");
    if (langs !== LESSON_LANGUAGES.join(",")) out.push(`${at}:${g.line}: a code group must be ${LESSON_LANGUAGES.join(", ")} in that order (found ${langs})`);
    if (g.output === null || !g.output.trim()) out.push(`${at}:${g.line}: a code group needs an "output" fence with what it prints`);
    for (const s of g.samples) {
      if (s.language === "java" && !/\bclass\s+Main\b/.test(s.code)) out.push(`${at}:${g.line}: the Java program's class must be Main`);
      if (s.code.split("\n").length > 90) out.push(`${at}:${g.line}: the ${s.language} program is over 90 lines — a lesson's example should fit a screen or two`);
    }
  }
  const walks = blocks.filter((b) => b.kind === "walkthrough").length;
  if (walks > 1) out.push(`${at}: "@walkthrough" appears ${walks} times`);
  if (walks && !l.hub) out.push(`${at}: "@walkthrough" needs a hub`);
  return out;
}

/** Internal links in a body (and its answers): the paths to check exist. */
export function lessonLinks(l: RoadmapLesson): string[] {
  const text = [l.body.replace(/```[\s\S]*?```/g, " "), l.answer, ...l.faq.map((f) => f.a)].join("\n");
  return [...text.matchAll(/\]\((\/[^)\s#]*)(?:#[^)\s]*)?\)/g)].map((m) => m[1]);
}

/**
 * The checks across lessons: unique slugs, titles and descriptions, one
 * order per place in a stage, and every link to another lesson resolving.
 * `stages` is the road's stage keys in order (scripts/roadmap-data ROADMAP).
 */
export function validateLessons(lessons: RoadmapLesson[], stages: readonly string[]): string[] {
  const out = lessons.flatMap(validateLesson);
  const known = new Set(stages);
  const seen = new Map<string, string>();
  const same = (kind: string, value: string, slug: string) => {
    const key = `${kind}:${value.toLowerCase()}`;
    const other = seen.get(key);
    if (other) out.push(`${slug}.md: the same ${kind} as ${other}.md`);
    else seen.set(key, slug);
  };
  const places = new Set<string>();
  for (const l of lessons) {
    if (!known.has(l.stage)) out.push(`${l.slug}.md: stage "${l.stage}" is not on the road`);
    same("title", l.title, l.slug);
    same("seo-title", l.seoTitle, l.slug);
    same("description", l.description, l.slug);
    const place = `${l.stage}#${l.order}`;
    if (places.has(place)) out.push(`${l.slug}.md: another lesson is order ${l.order} of stage "${l.stage}"`);
    places.add(place);
  }
  const slugs = new Set(lessons.map((l) => l.slug));
  for (const l of lessons) {
    for (const link of lessonLinks(l)) {
      const m = /^\/roadmap\/([a-z0-9-]+)$/.exec(link);
      if (m && !slugs.has(m[1]) && !RESERVED_LESSON_SLUGS.has(m[1])) out.push(`${l.slug}.md: links to /roadmap/${m[1]}, which is no lesson`);
    }
  }
  return out;
}

/* ── Loading ─────────────────────────────────────────────────────── */

/** content/roadmap, beside src/ and dist/ alike (the image copies content/). */
export const LESSONS_DIR = fileURLToPath(new URL("../../content/roadmap/", import.meta.url));

let loaded: RoadmapLesson[] | null = null;

/**
 * Every lesson, read once per process, in no particular order. A file that
 * does not parse is logged and left out rather than taking the API down —
 * the test and the validator keep the shipped files clean.
 */
export function allLessons(): RoadmapLesson[] {
  if (loaded) return loaded;
  let files: string[] = [];
  try {
    files = readdirSync(LESSONS_DIR).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  } catch {
    files = [];
  }
  const lessons: RoadmapLesson[] = [];
  for (const file of files.sort()) {
    try {
      lessons.push(parseLesson(readFileSync(`${LESSONS_DIR}${file}`, "utf8"), file));
    } catch (err) {
      console.error(`roadmap lessons: ${(err as Error).message}`);
    }
  }
  loaded = lessons;
  return lessons;
}

const bySlug = () => new Map(allLessons().map((l) => [l.slug, l]));
let slugIndex: Map<string, RoadmapLesson> | null = null;

export function lessonBySlug(slug: string): RoadmapLesson | undefined {
  slugIndex ??= bySlug();
  return slugIndex.get(slug);
}

/** A stage's lessons in reading order. */
export function lessonsForStage(stage: string): RoadmapLesson[] {
  return allLessons()
    .filter((l) => l.stage === stage)
    .sort((a, b) => a.order - b.order);
}

/** The lesson that teaches a /challenges topic, if one names it as its hub (the first by road order wins). */
export function lessonForHub(hubSlug: string, stageOrder: readonly string[]): RoadmapLesson | undefined {
  const rank = new Map(stageOrder.map((s, i) => [s, i]));
  return allLessons()
    .filter((l) => l.hub === hubSlug)
    .sort((a, b) => (rank.get(a.stage) ?? 99) - (rank.get(b.stage) ?? 99) || a.order - b.order)[0];
}

/**
 * A study lesson page's first screen as data, for the static-first view the
 * Worker draws from it (frontend lib/seo/views/api/study-lesson.ts; the
 * registry and the reasons are in lib/seo-views/index.ts).
 *
 * What StudyLessonPage shows a visitor, in its order: the module eyebrow,
 * the title, the mono meta line, the three steps (inline below 1200 px, in
 * the rail above it), the quick answer, then the text — and the rail's
 * contents list, module and "Up next". Built by services/seo.ts lessonHead
 * from the track definition it has already loaded; no query of its own.
 * Drawn 2026-10-13.
 *
 * The text is the backend's own Markdown rendering at the page's heading
 * levels (`##` stays an h2, as LessonMarkdown renders it) with the anchors
 * the rail's contents list links to — the same ids the SPA's lesson-anchors
 * computes. The answer and the questions carry the inline Markdown the
 * page's InlineText draws (code, bold, a link to a page here) and nothing
 * else, so a stray `*` reads the same on both.
 *
 * Fenced code is tokenised with Prism, the same 1.30 grammars LessonMarkdown
 * runs in the browser (2026-10-14): a census of the 499 lessons found seven
 * whose first fence starts within 350 characters of text — inside
 * PageSpeed's 1350 × 940 first viewport (java/compile-and-run at 280,
 * anatomy-of-a-program 326, comparing-strings 338 …) — and the page sets
 * keywords at weight 600, strings and comments italic, so a fence printed
 * plain was 33 text runs the view lacked and `public static void main(…)`
 * 63 px narrower. The frontend's CodeBlock and this call the same
 * `Prism.highlight(code, grammar, lang)` on the same string (the fence's
 * body without its trailing newline), so the spans are identical; the
 * grammars loaded here are exactly LessonMarkdown's imports — the sql, bash
 * and http fences it also names come with the CS notes' chunk, so on a
 * lesson page loaded cold they print plain, and here too.
 */
import Prism from "prismjs";
// Each component registers itself on the Prism the core put on `global`
// (prism-core's "hack for components to work correctly in node.js"), so the
// import order is the dependency order: prism-cpp extends prism-c, which
// extends the clike grammar in the core; typescript extends javascript.
import "prismjs/components/prism-java.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-c.js";
import "prismjs/components/prism-cpp.js";
import "prismjs/components/prism-python.js";
import { escapeHtml, markdownHeadings, markdownOutline, markdownToHtml } from "../markdown-html.js";
import type { LessonDefinition, ModuleDefinition, TrackDefinition } from "../../services/study-plans.js";

/** Fence language → Prism grammar, as LessonMarkdown's GRAMMARS maps the ones whose grammar a lesson page has loaded. */
const GRAMMARS: Record<string, string> = {
  java: "java",
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  json: "json",
  html: "markup",
  cpp: "cpp",
  "c++": "cpp",
  c: "c",
  python: "python",
  py: "python",
};

/** What markdownToHtml wrote for a fence with a language (its body escaped by escapeHtml). */
const FENCE_HTML = /<pre><code class="language-([^"]+)">([\s\S]*?)<\/code><\/pre>/g;

const unescapeHtml = (s: string): string => s.replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");

/**
 * markdownToHtml's fences with Prism's token spans inside, where the page
 * highlights them; a fence whose language has no grammar here (text, bash,
 * jsonc …) is left as it was, which is how LessonMarkdown prints it too.
 * Prism escapes `&` and `<` itself, so the output stays safe HTML.
 */
export function highlightFences(html: string): string {
  return html.replace(FENCE_HTML, (whole, lang: string, escaped: string) => {
    const name = GRAMMARS[lang.toLowerCase()];
    const grammar = name ? Prism.languages[name] : undefined;
    if (!grammar) return whole;
    const code = unescapeHtml(escaped).replace(/\n$/, "");
    return `<pre><code class="language-${lang}">${Prism.highlight(code, grammar, name)}</code></pre>`;
  });
}

export interface StudyLessonView {
  kind: "study-lesson";
  track: { key: string; title: string };
  /** `lessons` is the module's count including its checkpoint — the page prints "Lesson n of lessons − 1", as the SPA does. */
  module: { slug: string; number: number; title: string; lessons: number };
  lesson: { title: string; number: number; checkpoint: boolean; minutes: number; xp: number; passMark: number | null; exercises: number; quiz: number };
  /** The direct answer under the heading as inline-rendered safe HTML, or null for a lesson without one. */
  answer: { question: string; answer: string } | null;
  /** The `##` sections with their anchors — the rail's "On this page". */
  outline: Array<{ id: string; text: string }>;
  /** The lesson text as safe HTML, headings at the page's levels with their anchors. */
  body: string;
  /** The common questions after the text, inline-rendered. */
  faq: Array<{ q: string; a: string }>;
  next: { slug: string; title: string; module: string } | null;
}

/** The inline Markdown the page's InlineText (components/study/LessonQuestions) draws: `code`, **bold**, a link to a page on the site. */
const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\(\/[^)\s]*\))/g;
const LINK = /^\[([^\]]+)\]\((\/[^)\s]*)\)$/;
export function inlineAnswer(text: string): string {
  return text
    .split(INLINE)
    .map((part, i) => {
      if (i % 2 === 0) return escapeHtml(part);
      if (part.startsWith("`")) return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
      if (part.startsWith("**")) return `<strong>${escapeHtml(part.slice(2, -2))}</strong>`;
      const link = LINK.exec(part);
      return link ? `<a href="${escapeHtml(link[2])}">${escapeHtml(link[1])}</a>` : escapeHtml(part);
    })
    .join("");
}

export function studyLessonView(track: TrackDefinition, mod: ModuleDefinition, lesson: LessonDefinition): StudyLessonView {
  const flat = track.modules.flatMap((m) => m.lessons.map((l) => ({ slug: l.slug, title: l.title, module: m.title })));
  const at = flat.findIndex((l) => l.slug === lesson.slug);
  const next = flat[at + 1];
  // markdownToHtml shifts headings one level down for the crawler's article
  // (the page already has its h1); the SPA renders `##` as an h2, so the
  // shift is cancelled: `under` names the level the shallowest heading sits
  // beneath, and the shallowest comes out one below it.
  const levels = markdownHeadings(lesson.body).map((h) => h.level);
  const shallowest = levels.length ? Math.min(...levels) : 2;
  const seo = lesson.seo;
  return {
    kind: "study-lesson",
    track: { key: track.key, title: track.title },
    module: { slug: mod.slug, number: track.modules.indexOf(mod) + 1, title: mod.title, lessons: mod.lessons.length },
    lesson: {
      title: lesson.title,
      number: mod.lessons.indexOf(lesson) + 1,
      checkpoint: lesson.kind === "test",
      minutes: lesson.minutes,
      xp: lesson.xp,
      passMark: lesson.passMark,
      exercises: lesson.exercises.length,
      quiz: lesson.quiz.length,
    },
    answer: seo?.question && seo.answer ? { question: inlineAnswer(seo.question), answer: inlineAnswer(seo.answer) } : null,
    outline: markdownOutline(lesson.body),
    body: highlightFences(markdownToHtml(lesson.body, 24_000, { anchors: true, under: Math.max(1, shallowest - 1) })),
    faq: (seo?.faq ?? []).map((f) => ({ q: inlineAnswer(f.q), a: inlineAnswer(f.a) })),
    next: next ? { slug: next.slug, title: next.title, module: next.module } : null,
  };
}

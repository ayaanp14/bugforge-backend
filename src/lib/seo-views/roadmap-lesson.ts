/**
 * The first screen of a roadmap lesson page (/roadmap/<slug>) as data, for
 * the static-first view the Worker draws from it (frontend
 * lib/seo/views/api/roadmap-lesson.ts; the registry and the reasons are in
 * lib/seo-views/index.ts). Built by services/seo.ts roadmapLessonHead from
 * the LessonPage it has already loaded — no query of its own. Drawn
 * 2026-10-13/14.
 *
 * What RoadmapLessonPage shows a visitor, in its order: the road as a
 * reading list in the left rail (lg+; LessonSyllabus — tiers, stages, the
 * current stage open), the breadcrumb, the stage eyebrow, the h1, the mono
 * meta line, the quick answer, "On this page" (folded below xl, its own
 * column at xl), then the article — and the article only as the page holds
 * it: in parts (services/roadmap-lessons lessonParts). The page mounts with
 * the first part alone, and its sentinel asks for the second at once when
 * the first ends within 800 px of the viewport (big-o-notation's first part
 * is its opening and one short section — the second part's heading is
 * inside the 1350 × 940 first viewport); main.tsx's wait (frontend
 * lib/view-data) loads that second part with the head, so it is drawn here
 * too and arrives from the cache. Parts after the second are left out: the
 * page never has them before the reader scrolls to them.
 *
 * Each part is cut the way the page's LessonBody cuts it (lib/roadmap-
 * lessons lessonBlocks): prose blocks as HTML at the page's heading levels
 * (`##` stays an h2) with the anchors the page computes, a code group as
 * the C++ program — the visitor's default tab — tokenised with the same
 * Prism grammars as the page (study-lesson highlightFences), and each
 * figure or walkthrough as the numbers its box is sized from (the svg's
 * viewBox) plus the words around it — the drawing itself
 * mounts only near the viewport, after the first frame.
 */
import { lessonBlocks, lessonParts, LESSON_LANGUAGES } from "../roadmap-lessons.js";
import { escapeHtml, markdownToHtml } from "../markdown-html.js";
import { highlightFences, inlineAnswer } from "./study-lesson.js";
import type { LessonPage } from "../../services/roadmap-lessons.js";
import type { Walkthrough } from "../walkthroughs/index.js";

/** A figure (LessonFigure) or the hub's walkthrough (TopicWalkthrough): what sizes its box and the words around it, at its first step. */
export interface RoadmapLessonFigure {
  title: string;
  input: string;
  width: number;
  height: number;
  /** Every step's sentence, in order: the first is shown under the box, all of them in the folded "All N steps in words" list. */
  captions: string[];
}

export type RoadmapLessonBlock =
  | { kind: "text"; html: string }
  /** `languages` in the tab order; `code` the C++ (or first) program as Prism-highlighted HTML. */
  | { kind: "code"; languages: string[]; current: string; code: string; output: string | null }
  | ({ kind: "figure" } & RoadmapLessonFigure)
  | ({ kind: "walkthrough" } & RoadmapLessonFigure);

export interface RoadmapLessonView {
  kind: "roadmap-lesson";
  slug: string;
  title: string;
  level: string;
  minutes: number;
  /** ISO day, "2026-10-02"; the page prints it long. */
  updated: string;
  stage: { id: string; number: number; title: string };
  position: { inStage: number; stageLessons: number };
  /** The quick answer, inline-rendered as the page's InlineText draws it. */
  answer: { question: string; answer: string };
  /** "On this page": the `##` sections, then Practice problems / Common questions when the lesson has them. */
  outline: Array<{ id: string; text: string }>;
  /** The road as the sidebar lists it. */
  syllabus: Array<{ title: string; stages: Array<{ id: string; number: number; title: string; lessons: Array<{ slug: string; title: string }> }> }>;
  /** The article's first two parts, block by block. */
  blocks: RoadmapLessonBlock[];
}

const figureOf = (w: Walkthrough): RoadmapLessonFigure => ({ title: w.title, input: w.input, width: w.width, height: w.height, captions: w.frames.map((f) => f.caption) });

/**
 * One prose block as LessonMarkdown renders it: markdownToHtml shifts every
 * heading one level down (the crawler's article sits under the page's h1),
 * so the shift is undone here — a `##` is an h2 on the page — and each
 * heading takes the id the page gives it (the part's anchors, numbered over
 * the whole body), in source order.
 */
function proseHtml(markdown: string, ids: string[]): string {
  let n = 0;
  const html = markdownToHtml(markdown, 120_000).replace(/<(\/?)h([2-7])>/g, (_m, close: string, level: string) => `<${close}h${Number(level) - 1}>`);
  return highlightFences(html.replace(/<h([1-6])>/g, (m, level: string) => (n < ids.length ? `<h${level} id="${escapeHtml(ids[n++])}">` : m)));
}

export function roadmapLessonView(page: LessonPage): RoadmapLessonView {
  const { lesson: l, stage } = page;
  const { parts, outline } = lessonParts(l.body);
  const blocks: RoadmapLessonBlock[] = [];
  for (const part of parts.slice(0, 2)) {
    for (const b of lessonBlocks(part.body)) {
      if (b.kind === "text") {
        const span = b.markdown.split("\n").length;
        const ids = part.anchors.filter(([line]) => line >= b.line && line < b.line + span).map(([, id]) => id);
        blocks.push({ kind: "text", html: proseHtml(b.markdown, ids) });
      } else if (b.kind === "code") {
        // CodeTabs: the languages it knows, in the body's order; the visitor's tab is C++ (or the first there is).
        const available = b.samples.filter((s) => (LESSON_LANGUAGES as readonly string[]).includes(s.language));
        const current = available.find((s) => s.language === "cpp") ?? available[0];
        if (!current) continue;
        blocks.push({
          kind: "code",
          languages: available.map((s) => s.language),
          current: current.language,
          code: highlightFences(`<pre><code class="language-${current.language}">${escapeHtml(current.code)}</code></pre>`),
          output: b.output,
        });
      } else if (b.kind === "figure") {
        const w = page.figures[b.name];
        if (w) blocks.push({ kind: "figure", ...figureOf(w) });
      } else if (page.walkthrough) {
        blocks.push({ kind: "walkthrough", ...figureOf(page.walkthrough) });
      }
    }
  }
  return {
    kind: "roadmap-lesson",
    slug: l.slug,
    title: l.title,
    level: l.level,
    minutes: l.minutes,
    updated: l.updated,
    stage: { id: stage.id, number: stage.number, title: stage.title },
    position: { inStage: page.position.inStage, stageLessons: page.position.stageLessons },
    answer: { question: inlineAnswer(l.seo.question), answer: inlineAnswer(l.seo.answer) },
    outline: [
      ...outline.map((o) => ({ id: o.id, text: o.text })),
      ...(page.practice.length ? [{ id: "practice", text: "Practice problems" }] : []),
      ...(l.seo.faq.length ? [{ id: "questions", text: "Common questions" }] : []),
    ],
    syllabus: page.syllabus.tiers.map((t) => ({
      title: t.title,
      stages: t.stages.map((s) => ({ id: s.id, number: s.number, title: s.title, lessons: s.lessons.map((x) => ({ slug: x.slug, title: x.title })) })),
    })),
    blocks,
  };
}

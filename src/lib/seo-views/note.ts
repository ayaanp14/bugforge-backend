/**
 * The first screen of a CS note (/notes/<subject>/<slug>) as data, for the
 * static-first view the Worker draws from it (frontend
 * lib/seo/views/api/note.ts; the registry and the reasons are in
 * lib/seo-views/index.ts). Built by services/seo.ts noteHead from the
 * NotePage it has already loaded and the syllabus (a pure read of the
 * shipped files, like the page) — no query of its own. Drawn 2026-10-14.
 *
 * What NotePage shows a visitor, in its order: the subject's notes as a
 * reading list in the left rail (lg+; NoteSyllabus — the current one
 * marked, the other subjects under it), the breadcrumb, the "OS notes"
 * drawer button (below lg), the subject eyebrow with the note's place, the
 * h1, the mono meta line, the quick answer, "On this page" (folded below
 * xl, its own column at xl), then the article — a note comes whole (one
 * read), so the whole body is here — and the common questions.
 *
 * The body is cut the way the page's NoteBody cuts it (frontend
 * components/notes/note-blocks: the lessons' walk — lib/roadmap-lessons
 * lessonBlocks — plus the display-only fences lifted out of the prose):
 * prose as HTML at the page's heading levels (`##` stays an h2) with the
 * anchors the page computes over the whole body, a code group as its C++
 * program (the visitor's default tab), a display fence (C, SQL, a shell
 * session, an HTTP message) as its label and code, and each figure as the
 * numbers its box is sized from plus the words around it — the drawing
 * itself mounts only near the viewport, after the first frame.
 */
import Prism from "prismjs";
import { figureOf, highlightFences, inlineAnswer } from "./study-lesson.js";
// After study-lesson's grammars (json is there; http highlights a JSON body
// through whatever JSON grammar is registered when it is defined): the
// three the notes' own chunk adds on the page (frontend
// components/notes/note-grammars), so a SQL query reads as the page draws it.
// They register on the one global Prism, so once this module is loaded
// Prism.languages holds sql/bash/http for every module in the process.
// study-lesson.ts is unaffected only because its own GRAMMARS map names no
// sql/bash/http entry and a fence it does not name prints plain. A lesson view
// that ever looks a grammar up in Prism.languages directly would start
// highlighting those fences, depending on whether a note head was built
// first in the process. Keep lesson lookups behind their own map
// (2026-10-14, raised in review).
import "prismjs/components/prism-sql.js";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-http.js";
import { lessonBlocks, LESSON_LANGUAGES } from "../roadmap-lessons.js";
import { escapeHtml, markdownHeadings, markdownOutline, markdownToHtml } from "../markdown-html.js";
import type { NotePage, SubjectCard } from "../../services/cs-notes.js";
import type { Walkthrough } from "../walkthroughs/index.js";

/** A figure (LessonFigure): what sizes its box and the words around it, at its first step. */
export interface NoteFigure {
  title: string;
  input: string;
  width: number;
  height: number;
  frames: number;
  /** Every step's sentence: the first is the caption under the box, all of them the closed "All n steps in words" list an animation carries (Chrome lays it out, and at 1920 px it can reach the first viewport). */
  captions: string[];
}

export type NoteBlock =
  | { kind: "text"; html: string }
  /** `languages` in the tab order; `code` the C++ (or first) program as Prism-highlighted HTML. */
  | { kind: "code"; languages: string[]; current: string; code: string; output: string | null }
  /** A display-only fence (NoteFence): its label and its code as highlighted HTML. */
  | { kind: "fence"; label: string; code: string }
  | ({ kind: "figure" } & NoteFigure);

export interface NoteView {
  kind: "note";
  subject: { key: string; title: string; short: string };
  position: number;
  count: number;
  title: string;
  /** As authored, lower case ("beginner"); the page prints it as a word. */
  level: string;
  minutes: number;
  /** ISO day, "2026-10-05"; the page prints it long. */
  updated: string;
  /** The quick answer, inline-rendered as the page's InlineText draws it. */
  answer: { question: string; answer: string };
  /** "On this page": the `##` sections, then Common questions / Test yourself when the note has them. */
  outline: Array<{ id: string; text: string }>;
  /** The sidebar: the subject's notes in reading order, then the other subjects that have notes, with their counts. */
  syllabus: { notes: Array<{ slug: string; title: string }>; others: Array<{ key: string; title: string; count: number }> };
  blocks: NoteBlock[];
  /** The common questions, inline-rendered. */
  faq: Array<{ q: string; a: string }>;
}

/** The display fences a note labels (frontend components/notes/note-blocks FENCE_LABELS). */
const FENCE_LABELS: Record<string, string> = { c: "C", sql: "SQL", bash: "Bash", sh: "Shell", shell: "Shell", http: "HTTP", json: "JSON" };

/** The note grammars beyond study-lesson's (which already maps c and json). */
const NOTE_GRAMMARS: Record<string, string> = { sql: "sql", bash: "bash", sh: "bash", shell: "bash", http: "http" };

// lesson-blocks' own fence rule, so a fence is a fence to both walks.
const FENCE_OPEN = /^\s*(```|~~~)\s*([\w+#.-]*)\s*$/;

/** One fence's code as the page's LessonMarkdown highlights it (its body without the trailing newline). */
function fenceHtml(language: string, code: string): string {
  const name = NOTE_GRAMMARS[language];
  const grammar = name ? Prism.languages[name] : undefined;
  if (grammar) return `<pre><code class="language-${language}">${Prism.highlight(code.replace(/\n$/, ""), grammar, name!)}</code></pre>`;
  return highlightFences(`<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`);
}

/**
 * One prose block as LessonMarkdown renders it: markdownToHtml shifts every
 * heading one level down (the crawler's article sits under the page's h1),
 * so the shift is undone here — a `##` is an h2 on the page — and each
 * heading takes the id the page gives it (numbered over the whole body), in
 * source order. A `text` fence stays prose, as on the page.
 */
function proseHtml(markdown: string, ids: string[]): string {
  let n = 0;
  const html = markdownToHtml(markdown, 200_000).replace(/<(\/?)h([2-7])>/g, (_m, close: string, level: string) => `<${close}h${Number(level) - 1}>`);
  return highlightFences(html.replace(/<h([1-6])>/g, (m, level: string) => (n < ids.length ? `<h${level} id="${escapeHtml(ids[n++])}">` : m)));
}

/** A prose block cut at its labelled fences, as note-blocks splitProse cuts it; each piece keeps its first line in the body. */
function splitProse(markdown: string, line: number): Array<{ kind: "text"; markdown: string; line: number } | { kind: "fence"; language: string; code: string }> {
  const lines = markdown.split("\n");
  const out: Array<{ kind: "text"; markdown: string; line: number } | { kind: "fence"; language: string; code: string }> = [];
  let text: string[] = [];
  let start = line;
  const flush = () => {
    if (text.some((l) => l.trim())) out.push({ kind: "text", markdown: text.join("\n"), line: start });
    text = [];
  };
  let i = 0;
  while (i < lines.length) {
    const open = FENCE_OPEN.exec(lines[i]);
    if (!open) {
      if (!text.length) start = line + i;
      text.push(lines[i]);
      i++;
      continue;
    }
    const close = new RegExp(`^\\s*${open[1]}\\s*$`);
    let j = i + 1;
    while (j < lines.length && !close.test(lines[j])) j++;
    const language = open[2].toLowerCase();
    if (language in FENCE_LABELS) {
      flush();
      out.push({ kind: "fence", language, code: lines.slice(i + 1, j).join("\n") });
    } else {
      if (!text.length) start = line + i;
      text.push(...lines.slice(i, j + 1));
    }
    i = j + 1;
  }
  flush();
  return out;
}


export function noteView(page: NotePage, syllabus: { subjects: SubjectCard[] }): NoteView {
  const { note: n, subject } = page;
  const headings = markdownHeadings(n.body);
  const blocks: NoteBlock[] = [];
  for (const b of lessonBlocks(n.body)) {
    if (b.kind === "text") {
      for (const piece of splitProse(b.markdown, b.line)) {
        if (piece.kind === "fence") {
          blocks.push({ kind: "fence", label: FENCE_LABELS[piece.language] ?? piece.language.toUpperCase(), code: fenceHtml(piece.language, piece.code) });
          continue;
        }
        const span = piece.markdown.split("\n").length;
        const ids = headings.filter((h) => h.line >= piece.line && h.line < piece.line + span).map((h) => h.id);
        blocks.push({ kind: "text", html: proseHtml(piece.markdown, ids) });
      }
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
    }
    // A note has no topic walkthrough to place (NoteBody draws none).
  }
  const card = syllabus.subjects.find((s) => s.key === subject.key);
  return {
    kind: "note",
    subject: { key: subject.key, title: subject.title, short: subject.short },
    position: page.position,
    count: page.count,
    title: n.title,
    level: n.level,
    minutes: n.minutes,
    updated: n.updated,
    answer: { question: inlineAnswer(n.seo.question), answer: inlineAnswer(n.seo.answer) },
    outline: [
      ...markdownOutline(n.body),
      ...(n.seo.faq.length ? [{ id: "questions", text: "Common questions" }] : []),
      ...(page.tests.length ? [{ id: "tests", text: "Test yourself" }] : []),
    ],
    syllabus: {
      notes: (card?.notes ?? []).map((x) => ({ slug: x.slug, title: x.title })),
      others: syllabus.subjects.filter((s) => s.key !== subject.key && s.notes.length > 0).map((s) => ({ key: s.key, title: s.title, count: s.notes.length })),
    },
    blocks,
    faq: n.seo.faq.map((f) => ({ q: inlineAnswer(f.q), a: inlineAnswer(f.a) })),
  };
}

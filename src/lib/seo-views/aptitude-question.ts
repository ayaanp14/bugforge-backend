import { markdownToHtml } from "../markdown-html.js";

/**
 * The first screen of an aptitude question page — /aptitude/q/<slug>,
 * AptitudeQuestionPage as a visitor sees it — as data, for the static-first
 * view the Worker draws from it (frontend lib/seo/views/api/aptitude-question.ts;
 * the registry and the reasons are in lib/seo-views/index.ts).
 *
 * Everything here is what GET /api/aptitude/questions/:slug sends a visitor,
 * in the shape the page draws it: the chip row (difficulty, tags, target
 * time), the h1, the prompt and the four options as the safe HTML
 * markdownToHtml writes (AptitudeMarkdown renders the same Markdown with
 * react-markdown: paragraphs, bold, lists, GFM tables), whether "Show a hint"
 * is offered, the answer's disclosure (closed, but its contents are laid out
 * — a visitor's reveal comes with the question), and the rail: position in
 * the topic, the neighbours and the six related questions. Built in
 * services/seo.ts aptitudeQuestionHead from what it has already loaded
 * (its select gained `tags` and `hints`; topicOrder is the same cached read
 * the route makes): no query of its own.
 */
export interface AptitudeQuestionView {
  kind: "aptitude-question";
  slug: string;
  title: string;
  /** As stored (lower case); the page's DifficultyLabel capitalises it. */
  difficulty: string;
  tags: string[];
  timeTargetSec: number;
  topic: string;
  topicLabel: string;
  /** The prompt as safe HTML. */
  prompt: string;
  /** Each option as safe HTML. */
  options: string[];
  /** Whether the question has a hint ("Show a hint" is drawn only then). */
  hasHints: boolean;
  /** The visitor's reveal: the answer's index, the worked solution and the idea as safe HTML. */
  answer: number;
  solution: string;
  approach: string;
  position: { index: number; total: number };
  prev: string | null;
  next: string | null;
  related: Array<{ slug: string; title: string; difficulty: string }>;
}

export interface AptitudeQuestionSource {
  slug: string;
  title: string;
  difficulty: string;
  tags: string[];
  hints: string[];
  timeTargetSec: number;
  topic: string;
  topicLabel: string;
  prompt: string;
  options: string[];
  answer: number;
  solution: string;
  approach: string;
}

/** The view from the head's question row and the topic's order (the route's own neighbours and related six). */
export function aptitudeQuestionView(q: AptitudeQuestionSource, order: Array<{ slug: string; title: string; difficulty: string }>, related: Array<{ slug: string; title: string; difficulty: string }>): AptitudeQuestionView {
  const at = order.findIndex((s) => s.slug === q.slug);
  return {
    kind: "aptitude-question",
    slug: q.slug,
    title: q.title,
    difficulty: q.difficulty,
    tags: q.tags,
    timeTargetSec: q.timeTargetSec,
    topic: q.topic,
    topicLabel: q.topicLabel,
    prompt: markdownToHtml(q.prompt, 6_000),
    options: q.options.map((o) => markdownToHtml(o, 2_000)),
    hasHints: q.hints.length > 0,
    answer: q.answer,
    solution: markdownToHtml(q.solution, 6_000),
    approach: markdownToHtml(q.approach, 3_000),
    position: { index: at + 1, total: order.length },
    prev: order[at - 1]?.slug ?? null,
    next: order[at + 1]?.slug ?? null,
    related: related.map((r) => ({ slug: r.slug, title: r.title, difficulty: r.difficulty })),
  };
}

import { APTITUDE_CATEGORIES, APTITUDE_TOPICS, type AptitudeCategory, type AptitudeTopic } from "../aptitude-topics.js";

/**
 * The first screen of an aptitude section or topic page — /aptitude/quantitative,
 * /aptitude/percentages (one route, AptitudeTopicPage, which hands a section
 * id to AptitudeCategoryPage) — as data, for the static-first view the
 * Worker draws from it (frontend lib/seo/views/api/aptitude-section.ts; the
 * registry and the reasons are in lib/seo-views/index.ts).
 *
 * Built by aptitudeCategoryView / aptitudeTopicView below, which
 * services/seo.ts aptitudeCategoryHead / aptitudeTopicHead call with what
 * they have already loaded (the grouped counts, the topic's question rows,
 * the authored guide or essentials): no query of its own. The one read the
 * topic head gained for it is `aptitudeCounts()` — the "More …" strip's
 * counts — and that is the cached grouped read the section heads, the
 * index head and the sitemaps already share (an L1 hit but for a cold
 * process, then one groupBy for all of them; 2026-10-14). Both
 * Markdown bodies go as the safe HTML markdownToHtml writes (`###` → h3),
 * which the frontend draws the way AptitudeMarkdown draws the source.
 */
export interface AptitudeSectionView {
  kind: "aptitude-category" | "aptitude-topic";
  /** The section's or the topic's own label and blurb. */
  label: string;
  blurb: string;
  /** Category: every section with its question count, in syllabus order (the "Sections" strip). */
  sections?: Array<{ id: string; label: string; count: number }>;
  /** Category: its topics in order, each with its count. */
  topics?: Array<{ id: string; label: string; blurb: string; total: number }>;
  /** Category: the "<label> in placement papers" guide as safe HTML, or null. */
  guide?: string | null;
  /** Topic: the section it belongs to. */
  category?: { id: string; label: string } | null;
  /** Topic: the formula sheet as safe HTML, or null. */
  essentials?: string | null;
  /** Topic: how many questions it holds. */
  total?: number;
  /** Topic: the first rows a visitor's list holds (the API's MAX_PAGE_SIZE, 50), in order. */
  questions?: Array<{ slug: string; title: string; stem: string; difficulty: string; tags: string[]; timeTargetSec: number }>;
  /** Topic: the section's other topics with their counts (the "More …" strip). */
  siblings?: Array<{ id: string; label: string; total: number }>;
}

/** What a visitor's first page of a topic holds (routes/aptitude MAX_PAGE_SIZE; the SPA's APTITUDE_MAX_PAGE_SIZE). */
export const VISITOR_PAGE = 50;

/** One question row as the view carries it (the stem cut by services/seo questionStem, the tags as strings). */
export type AptitudeViewQuestion = NonNullable<AptitudeSectionView["questions"]>[number];

/** Question counts per topic, as services/seo aptitudeCounts groups them. */
type TopicCounts = ReadonlyMap<string, { total: number }>;

/**
 * A section's view, from what aptitudeCategoryHead has loaded: the section,
 * the grouped counts and the guide it already renders for the article.
 */
export function aptitudeCategoryView(category: AptitudeCategory, counts: TopicCounts, guideHtml: string | null): AptitudeSectionView {
  const totalOf = (topicId: string) => counts.get(topicId)?.total ?? 0;
  return {
    kind: "aptitude-category",
    label: category.label,
    blurb: category.blurb,
    sections: APTITUDE_CATEGORIES.map((c) => ({ id: c.id, label: c.label, count: APTITUDE_TOPICS.filter((t) => t.category === c.id).reduce((n, t) => n + totalOf(t.id), 0) })),
    topics: APTITUDE_TOPICS.filter((t) => t.category === category.id).map((t) => ({ id: t.id, label: t.label, blurb: t.blurb, total: totalOf(t.id) })),
    guide: guideHtml,
  };
}

/**
 * A topic's view, from what aptitudeTopicHead has loaded: the topic, its
 * section, the essentials it already renders, every row of the topic (the
 * view keeps a visitor's first page of them) and the grouped counts — the
 * cached read the section heads share — for the "More …" strip.
 */
export function aptitudeTopicView(topic: AptitudeTopic, category: AptitudeCategory | undefined, essentialsHtml: string | null, rows: AptitudeViewQuestion[], counts: TopicCounts): AptitudeSectionView {
  return {
    kind: "aptitude-topic",
    label: topic.label,
    blurb: topic.blurb,
    category: category ? { id: category.id, label: category.label } : null,
    essentials: essentialsHtml,
    total: rows.length,
    questions: rows.slice(0, VISITOR_PAGE),
    siblings: APTITUDE_TOPICS.filter((t) => t.category === topic.category && t.id !== topic.id).map((t) => ({ id: t.id, label: t.label, total: counts.get(t.id)?.total ?? 0 })),
  };
}

import { cached, invalidate } from "../lib/cache.js";
import { allLessons, lessonBySlug, lessonForHub, lessonsForStage, summaryOf, type LessonFaq, type LessonLevel, type LessonSummary, type RoadmapLesson } from "../lib/roadmap-lessons.js";
import { walkthroughFor, type Walkthrough } from "../lib/walkthroughs/index.js";
import { getCatalogue } from "./dashboard.js";
import { hubIndex } from "./problem-hubs.js";
import { roadDefinition, type RoadDefinition } from "./roadmap.js";

/**
 * The roadmap's lessons as pages (lib/roadmap-lessons holds the files and
 * their rules): the syllabus every lesson's sidebar draws — the road's
 * tiers and stages with each stage's lessons — and one lesson's page,
 * which places it on that road (its stage, the lessons before and after
 * it across stage boundaries) and resolves what it links to (the practice
 * problems from the catalogue, the hub's size, the walkthrough).
 *
 * Nothing here reads the caller: a page is the same bytes for everyone, so
 * it is cached here and in the browser. A reader's standing on the road —
 * which stages are cleared — is the road's own read (GET /api/roadmap),
 * which the page asks for separately when someone is signed in.
 */

export interface SyllabusStage {
  id: string;
  title: string;
  /** 1-based place on the road. */
  number: number;
  lessons: LessonSummary[];
}

export interface SyllabusTier {
  id: string;
  title: string;
  stages: SyllabusStage[];
}

export interface Syllabus {
  tiers: SyllabusTier[];
  /** Lessons in the syllabus and their total reading time. */
  lessons: number;
  minutes: number;
}

export interface LessonPage {
  lesson: {
    slug: string;
    title: string;
    minutes: number;
    level: LessonLevel;
    updated: string;
    body: string;
    seo: { title: string; description: string; question: string; answer: string; faq: LessonFaq[] };
  };
  /** The stage the lesson sits in, and its place there. */
  stage: { id: string; title: string; blurb: string; number: number; tier: string; tierTitle: string; required: number; total: number };
  /** 1-based, across the whole syllabus. */
  position: { index: number; total: number; inStage: number; stageLessons: number };
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string; stage: string } | null;
  /** The lesson's practice problems, easiest first as authored; unpublished ones drop out. */
  practice: Array<{ slug: string; title: string; difficulty: string }>;
  /** The /challenges topic the lesson practises on, with its size. */
  hub: { slug: string; label: string; count: number } | null;
  walkthrough: Walkthrough | null;
  syllabus: Syllabus;
}

const TTL_MS = 5 * 60 * 1000;

/** The syllabus from a road: every stage, each with its lessons (a stage may have none yet). */
export function syllabusOf(road: RoadDefinition): Syllabus {
  const tiers = road.tiers.map((tier) => ({
    id: tier.id,
    title: tier.title,
    stages: road.stages
      .map((s, i) => ({ s, number: i + 1 }))
      .filter(({ s }) => s.tier === tier.id)
      .map(({ s, number }) => ({ id: s.id, title: s.title, number, lessons: lessonsForStage(s.id).map(summaryOf) })),
  }));
  const flat = tiers.flatMap((t) => t.stages.flatMap((s) => s.lessons));
  return { tiers, lessons: flat.length, minutes: flat.reduce((n, l) => n + l.minutes, 0) };
}

/** Every lesson in road order: stage by stage, each stage's in its own order. */
export function lessonsInOrder(road: RoadDefinition): RoadmapLesson[] {
  return road.stages.flatMap((s) => lessonsForStage(s.id));
}

export function lessonSyllabus(): Promise<Syllabus> {
  return cached("roadmap:lessons:syllabus", TTL_MS, async () => syllabusOf(await roadDefinition()));
}

export async function lessonPage(slug: string): Promise<LessonPage | null> {
  const lesson = lessonBySlug(slug);
  if (!lesson) return null;
  const key = `roadmap:lessons:page:${slug}`;
  const page = await cached(key, TTL_MS, () => buildPage(lesson));
  // Not served for want of a road (a process up before the seed): asked again next time, not kept.
  if (!page) invalidate(key);
  return page;
}

async function buildPage(lesson: RoadmapLesson): Promise<LessonPage | null> {
  const road = await roadDefinition();
  const stageIndex = road.stages.findIndex((s) => s.id === lesson.stage);
  // A lesson whose stage is not on the road (unpublished, or a database not
  // yet seeded) has no place to stand and is not served.
  if (stageIndex === -1) return null;
  const stage = road.stages[stageIndex];
  const [catalogue, hubs] = await Promise.all([getCatalogue(), hubIndex()]);
  const bySlug = new Map(catalogue.map((p) => [p.slug, p]));
  const ordered = lessonsInOrder(road);
  const at = ordered.findIndex((l) => l.slug === lesson.slug);
  const prev = ordered[at - 1];
  const next = ordered[at + 1];
  const siblings = lessonsForStage(stage.id);
  const hub = lesson.hub ? hubs.topics.find((t) => t.slug === lesson.hub) : undefined;
  return {
    lesson: {
      slug: lesson.slug,
      title: lesson.title,
      minutes: lesson.minutes,
      level: lesson.level,
      updated: lesson.updated,
      body: lesson.body,
      seo: { title: lesson.seoTitle, description: lesson.description, question: lesson.question, answer: lesson.answer, faq: lesson.faq },
    },
    stage: {
      id: stage.id,
      title: stage.title,
      blurb: stage.blurb,
      number: stageIndex + 1,
      tier: stage.tier,
      tierTitle: road.tiers.find((t) => t.id === stage.tier)?.title ?? "",
      required: Math.min(stage.required, stage.problems.length),
      total: stage.problems.length,
    },
    position: { index: at + 1, total: ordered.length, inStage: siblings.findIndex((l) => l.slug === lesson.slug) + 1, stageLessons: siblings.length },
    prev: prev ? { slug: prev.slug, title: prev.title } : null,
    next: next ? { slug: next.slug, title: next.title, stage: road.stages.find((s) => s.id === next.stage)?.title ?? "" } : null,
    practice: lesson.practice.flatMap((s) => {
      const p = bySlug.get(s);
      return p ? [{ slug: p.slug, title: p.title, difficulty: p.difficulty }] : [];
    }),
    hub: hub ? { slug: hub.slug, label: hub.label, count: hub.count } : null,
    walkthrough: lesson.hub ? walkthroughFor(lesson.hub) : null,
    syllabus: syllabusOf(road),
  };
}

/** The sitemap's entries: every lesson whose stage is on the road, with the date it was last revised. */
export async function lessonSitemapEntries(): Promise<Array<{ path: string; lastmod: Date }>> {
  const road = await roadDefinition();
  return lessonsInOrder(road).map((l) => ({ path: `/roadmap/${l.slug}`, lastmod: new Date(`${l.updated}T00:00:00Z`) }));
}

/**
 * The lessons that teach a problem's topics — each topic hub's lesson
 * (lib/roadmap-lessons lessonForHub), the problem's first topic first, at
 * most two: the "Learn the technique" line on a problem page, and the
 * links from every problem into the tutorials.
 */
export async function lessonsForTopics(topicSlugs: readonly string[]): Promise<Array<{ slug: string; title: string }>> {
  const road = await roadDefinition().catch(() => null);
  const order = road?.stages.map((s) => s.id) ?? [];
  const out: Array<{ slug: string; title: string }> = [];
  for (const slug of topicSlugs) {
    const l = lessonForHub(slug, order);
    if (l && !out.some((x) => x.slug === l.slug)) out.push({ slug: l.slug, title: l.title });
    if (out.length === 2) break;
  }
  return out;
}

/** How many lessons ship, for the boot log. */
export function lessonCount(): number {
  return allLessons().length;
}

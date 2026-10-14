import type { HubPage } from "../../services/problem-hubs.js";
import { duration } from "../hub-plans.js";
import { itemSvg } from "../walkthroughs/svg.js";

/**
 * The first screen of a hub page as data, for the static-first view the
 * Worker draws from it (frontend lib/seo/views/api/hub.ts; the registry and
 * the reasons are in lib/seo-views/index.ts): the words ChallengeHubPage
 * draws above its problem table — the h1's subject, the blurb its lead
 * sentence comes from, the roadmap lesson, the counts and split, a company's
 * test patterns, the glance card's plan line, the walkthrough's first frame
 * and the study plan — plus which sections the page's contents list names.
 *
 * Built in services/seo.ts hubHead from the `hubPage` it has already loaded:
 * no query of its own. The problem table is not here — the page reads it
 * with a second request and draws it loading on its first frame, and it is
 * below the first viewport at every width measured (2026-10-13).
 */
export interface HubView {
  kind: "topic-hub" | "company-hub";
  label: string;
  /** The whole blurb; the page keeps its first sentence under the h1 (a topic only) — frontend lib/seo/summary firstSentence. */
  blurb: string;
  lesson: { slug: string; title: string } | null;
  count: number;
  byDifficulty: { EASY: number; MEDIUM: number; HARD: number };
  patterns: Array<{ slug: string; name: string }>;
  /**
   * A topic's walkthrough: its first frame as SVG items (lib/walkthroughs/svg,
   * the edge's copy of the page's renderer), the frame count and every
   * frame's sentence — the first is the caption under the figure, all of
   * them the closed "All N steps in words" list, which the browser still
   * lays out (2026-10-14: at 1920 px its first two rows sit inside the first
   * viewport, and a view without them was two text runs short).
   */
  walkthrough: { title: string; input: string; width: number; height: number; frames: number; captions: string[]; items: string } | null;
  plan: {
    summary: string;
    picked: number;
    /** "about 8 h 10 min" as the page says it (lib/hub-plans duration, the SPA's copy is HubStudyPlan's). */
    duration: string;
    stages: Array<{
      title: string;
      note: string;
      duration: string | null;
      topics: Array<{ slug: string; label: string }>;
      problems: Array<{ slug: string; title: string; difficulty: string }>;
      link: { href: string; label: string } | null;
    }>;
  };
  /** Which optional sections the contents list names (ChallengeHubPage `sections`). */
  hasEssentials: boolean;
  hasLinks: boolean;
  hasRelated: boolean;
  next: { href: string; label: string; count: number } | null;
}

const hubHref = (h: { kind: "topic" | "company"; slug: string }) => (h.kind === "topic" ? `/challenges/${h.slug}` : `/challenges/company/${h.slug}`);

export function hubView(page: HubPage): HubView {
  const w = page.walkthrough;
  const first = w?.frames[0];
  return {
    kind: page.kind === "topic" ? "topic-hub" : "company-hub",
    label: page.label,
    blurb: page.blurb,
    lesson: page.lesson,
    count: page.count,
    byDifficulty: page.byDifficulty,
    patterns: page.patterns,
    walkthrough: w && first ? { title: w.title, input: w.input ?? "", width: w.width, height: w.height, frames: w.frames.length, captions: w.frames.map((f) => f.caption), items: first.items.map(itemSvg).join("") } : null,
    plan: {
      summary: page.plan.summary,
      picked: page.plan.picked,
      duration: duration(page.plan.minutes),
      stages: page.plan.stages.map((s) => ({
        title: s.title,
        note: s.note,
        duration: s.minutes > 0 ? duration(s.minutes) : null,
        topics: s.topics ?? [],
        problems: s.problems.map((p) => ({ slug: p.slug, title: p.title, difficulty: p.difficulty })),
        link: s.link ?? null,
      })),
    },
    hasEssentials: Boolean(page.essentials),
    hasLinks: page.links.length > 0,
    hasRelated: page.related.length > 0,
    next: page.next ? { href: hubHref(page.next), label: page.next.label, count: page.next.count } : null,
  };
}

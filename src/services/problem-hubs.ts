import { getCatalogue, loadProblemState, type CatalogueRow } from "./dashboard.js";
import { roadDefinition } from "./roadmap.js";
import { isCompanyTag } from "../lib/companies.js";
import {
  MIN_COMPANY_PROBLEMS,
  MIN_HUB_PROBLEMS,
  MIN_INDEXED_COMPANY_PROBLEMS,
  TOPIC_HUBS,
  TOPIC_ORDER,
  companyBlurb,
  companyHub,
  topicHubBySlug,
  topicHubByTag,
  topicRank,
  type TopicHub,
} from "../lib/problem-topics.js";
import { companyPlan, topicPlan, type CompanyPlanProblem, type StudyPlan } from "../lib/hub-plans.js";
import { TEST_GUIDES } from "../lib/test-guides.js";
import { TOPIC_ESSENTIALS } from "../lib/topic-essentials.js";
import { walkthroughFor, type Walkthrough } from "../lib/walkthroughs/index.js";
import { lessonForHub } from "../lib/roadmap-lessons.js";
import { prisma } from "../lib/prisma.js";
import { cached } from "../lib/cache.js";

/**
 * The catalogue's hub pages, computed from the cached catalogue.
 *
 * Every list here is a walk over the ~1,100 rows already held in memory for
 * the dashboard (services/dashboard getCatalogue, refreshed every two
 * minutes) — no query, no second cache. A hub's problems are the rows
 * carrying its tag (or one of its aliases) in the catalogue's own order
 * (newest first, as the catalogue page lists them), and its difficulty
 * split is counted on the way. The same functions feed the API the hub
 * pages read at runtime and the SEO service that prerenders them, so the
 * two cannot disagree.
 *
 * Since 2026-10-01 a hub page is more than its list: a topic carries its
 * walkthrough (lib/walkthroughs) and a study plan, a company its own plan,
 * and each names the other kind — the companies whose problems use a
 * technique, the techniques a company's problems use — so the two sets of
 * pages link into each other rather than only into the catalogue.
 */

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type DifficultyCounts = Record<Difficulty, number>;

export interface HubSummary {
  kind: "topic" | "company";
  slug: string;
  label: string;
  tag: string;
  count: number;
  byDifficulty: DifficultyCounts;
  /** False for a company page too small to index (MIN_INDEXED_COMPANY_PROBLEMS): served, linked, kept out of the sitemap. */
  indexed: boolean;
  /** Other tags this hub lists (a topic's aliases), so a catalogue chip for one of them links here. */
  aliases?: string[];
}

export interface HubProblem {
  slug: string;
  title: string;
  difficulty: string;
  /** The problem's topic tags only — companies are not topics. */
  topics: string[];
}

/** A hub of the other kind, with how many of this hub's problems it shares. */
export interface HubLink {
  kind: "topic" | "company";
  slug: string;
  label: string;
  /** Problems on both pages. */
  count: number;
}

export interface HubPage extends HubSummary {
  blurb: string;
  problems: HubProblem[];
  /** A topic hub: its essentials sheet (lib/topic-essentials), Markdown; null for a company. */
  essentials: string | null;
  /** A topic hub: the technique working on one example, frame by frame (lib/walkthroughs); null for a company. */
  walkthrough: Walkthrough | null;
  /** Which problems to do first, and in what order (lib/hub-plans). */
  plan: StudyPlan;
  /** A topic: the companies whose problems use it; a company: the topics its problems use — most shared first. */
  links: HubLink[];
  /** A topic: the next one in learning order (TOPIC_ORDER) that has a page; null for a company or the last topic. */
  next: HubSummary | null;
  /** A company hub: its placement patterns on /tests (none for a topic, or a company without one). */
  patterns: Array<{ slug: string; name: string }>;
  /**
   * A topic: the roadmap lesson that teaches it (lib/roadmap-lessons, a
   * lesson naming this hub), linked from the top of the page — the hub is
   * where a technique is practised, the lesson where it is learnt. Null for
   * a company or a topic no lesson teaches yet.
   */
  lesson: { slug: string; title: string } | null;
  /** Other hubs of the same kind, most populous first. */
  related: HubSummary[];
}

const tagsOf = (row: CatalogueRow): string[] => (Array.isArray(row.tags) ? (row.tags as string[]) : []);

const emptyCounts = (): DifficultyCounts => ({ EASY: 0, MEDIUM: 0, HARD: 0 });

function countByDifficulty(rows: CatalogueRow[]): DifficultyCounts {
  const counts = emptyCounts();
  for (const r of rows) {
    const d = r.difficulty.toUpperCase() as Difficulty;
    if (d in counts) counts[d] += 1;
  }
  return counts;
}

/**
 * Every tag's rows, grouped once per catalogue instance: the catalogue is
 * replaced (not mutated) every two minutes, so a WeakMap keyed on the array
 * — the same trick services/dashboard plays for the slug index — keeps the
 * grouping alive exactly as long as the rows it was built from.
 */
const groupsOf = new WeakMap<CatalogueRow[], Map<string, CatalogueRow[]>>();
function groupByTag(catalogue: CatalogueRow[]): Map<string, CatalogueRow[]> {
  let groups = groupsOf.get(catalogue);
  if (groups) return groups;
  groups = new Map<string, CatalogueRow[]>();
  for (const row of catalogue) {
    for (const tag of tagsOf(row)) {
      let list = groups.get(tag);
      if (!list) groups.set(tag, (list = []));
      list.push(row);
    }
  }
  groupsOf.set(catalogue, groups);
  return groups;
}

/**
 * A topic hub's rows: its tag's and its aliases', once each, in catalogue
 * order. Without aliases that is the tag's own group; with them, the
 * catalogue filtered to the union (a problem tagged both "Heap" and "Heap
 * (Priority Queue)" is one row, not two).
 */
function topicRows(hub: TopicHub, groups: Map<string, CatalogueRow[]>, catalogue: CatalogueRow[]): CatalogueRow[] {
  const own = groups.get(hub.tag) ?? [];
  const extra = (hub.aliases ?? []).flatMap((a) => groups.get(a) ?? []);
  if (extra.length === 0) return own;
  const ids = new Set([...own, ...extra].map((r) => r.id));
  return catalogue.filter((r) => ids.has(r.id));
}

function topicSummary(hub: TopicHub, rows: CatalogueRow[]): HubSummary {
  return { kind: "topic", slug: hub.slug, label: hub.label, tag: hub.tag, count: rows.length, byDifficulty: countByDifficulty(rows), indexed: true, ...(hub.aliases?.length ? { aliases: [...hub.aliases] } : {}) };
}

function companySummary(tag: string, rows: CatalogueRow[]): HubSummary | null {
  const hub = companyHub(tag);
  if (!hub) return null;
  return { kind: "company", slug: hub.slug, label: hub.label, tag, count: rows.length, byDifficulty: countByDifficulty(rows), indexed: rows.length >= MIN_INDEXED_COMPANY_PROBLEMS };
}

export interface HubIndex {
  topics: HubSummary[];
  companies: HubSummary[];
  /** Topic tags in use that no hub covers yet (neither a TOPIC_HUBS tag nor an alias). */
  uncovered: Array<{ tag: string; count: number }>;
}

/**
 * Every hub with its counts: the catalogue page's chip strips, the sitemap
 * and the cross-links. Built once per catalogue instance (the WeakMap rule
 * above): every hub page and problem page asks for it.
 */
const indexOf = new WeakMap<CatalogueRow[], HubIndex>();
export async function hubIndex(): Promise<HubIndex> {
  const catalogue = await getCatalogue();
  const known = indexOf.get(catalogue);
  if (known) return known;
  const groups = groupByTag(catalogue);
  const topics: HubSummary[] = [];
  for (const hub of TOPIC_HUBS) {
    const rows = topicRows(hub, groups, catalogue);
    if (rows.length >= MIN_HUB_PROBLEMS) topics.push(topicSummary(hub, rows));
  }
  const companies: HubSummary[] = [];
  const uncovered: Array<{ tag: string; count: number }> = [];
  for (const [tag, rows] of groups) {
    if (isCompanyTag(tag)) {
      if (rows.length < MIN_COMPANY_PROBLEMS) continue;
      const s = companySummary(tag, rows);
      if (s) companies.push(s);
    } else if (!topicHubByTag(tag)) uncovered.push({ tag, count: rows.length });
  }
  const byCount = (a: HubSummary, b: HubSummary) => b.count - a.count || a.label.localeCompare(b.label);
  topics.sort(byCount);
  companies.sort(byCount);
  uncovered.sort((a, b) => b.count - a.count);
  const index = { topics, companies, uncovered };
  indexOf.set(catalogue, index);
  return index;
}

/** The topic hubs a row's tags point at, aliases folded, each once. */
function topicHubsOf(row: CatalogueRow): TopicHub[] {
  const seen = new Set<string>();
  const out: TopicHub[] = [];
  for (const tag of tagsOf(row)) {
    const hub = isCompanyTag(tag) ? undefined : topicHubByTag(tag);
    if (hub && !seen.has(hub.slug)) {
      seen.add(hub.slug);
      out.push(hub);
    }
  }
  return out;
}

/** A company hub's three most common topics with a page of their own, most frequent first — its intro's middle sentence. */
function commonTopics(links: HubLink[]): Array<{ label: string; count: number }> {
  return links.slice(0, 3).map((l) => ({ label: l.label, count: l.count }));
}

/**
 * The placement patterns (/tests) per company, from the published tests —
 * a company hub links its own, and its intro quotes the pattern guide's
 * opening line (lib/test-guides). A tag and a test name the company the
 * same way except HCL, whose tests say "HCLTech": matched by prefix.
 */
function patternsByCompany(): Promise<Array<{ slug: string; name: string; company: string }>> {
  // A failed read degrades the page to "no patterns" for this request only.
  // The catch used to sit inside the loader, so one database hiccup was
  // cached as an empty list and every company hub lost its /tests links for
  // the hour.
  return cached("hubs:patterns:v1", 60 * 60 * 1000, () =>
    prisma.mockTest.findMany({ where: { published: true }, select: { slug: true, name: true, company: true }, orderBy: { orderIndex: "asc" } }),
  ).catch(() => []);
}

/** A guide's first sentence without its "A guide to": the noun phrase the company intro quotes. */
function guideLead(slug: string): string | undefined {
  const first = TEST_GUIDES[slug]?.split("\n")[0]?.trim();
  return first ? first.replace(/^A guide to /, "") : undefined;
}

const toHubProblem = (row: CatalogueRow): HubProblem => ({
  slug: row.slug,
  title: row.title,
  difficulty: row.difficulty,
  topics: tagsOf(row).filter((t) => !isCompanyTag(t)),
});

/** The slugs an essentials sheet starts with ("### Start with" links), in its order. */
function startWith(topicSlug: string): string[] {
  const sheet = TOPIC_ESSENTIALS[topicSlug];
  if (!sheet) return [];
  const at = sheet.indexOf("### Start with");
  return at < 0 ? [] : [...sheet.slice(at).matchAll(/\]\(\/problems\/([a-z0-9-]+)\)/g)].map((m) => m[1]);
}

/**
 * Where each problem stands in the roadmap (stage order, then position),
 * the hand-made ordering of ~150 well-known problems. Missing when the road
 * is not seeded; a plan then leans on the sheets and the catalogue's age.
 */
async function roadPositions(): Promise<Map<string, number>> {
  const road = await roadDefinition().catch(() => ({ stages: [] as Array<{ problems: Array<{ slug: string }> }> }));
  const at = new Map<string, number>();
  for (const stage of road.stages) for (const p of stage.problems) if (!at.has(p.slug)) at.set(p.slug, at.size);
  return at;
}

/**
 * A hub's rows in the order a plan should consider them: the roadmap's
 * picks first (in road order), then the essentials sheet's "Start with"
 * problems, then the rest oldest first — the catalogue began with the
 * classics, and a new wave's problems are rarer interview material.
 */
function prioritise(rows: CatalogueRow[], road: Map<string, number>, starts: string[]): CatalogueRow[] {
  const start = new Map(starts.map((s, i) => [s, i]));
  const key = (r: CatalogueRow): [number, number, number] => [road.get(r.slug) ?? Number.MAX_SAFE_INTEGER, start.get(r.slug) ?? Number.MAX_SAFE_INTEGER, r.createdAt.getTime()];
  return rows
    .map((r) => [r, key(r)] as const)
    .sort(([, a], [, b]) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])
    .map(([r]) => r);
}

const hubHref = (h: { kind: "topic" | "company"; slug: string }) => (h.kind === "topic" ? `/challenges/${h.slug}` : `/challenges/company/${h.slug}`);

/**
 * One hub's page, or null when there is no such hub — an unknown slug, or
 * a tag no problem carries (the URL is then a 404, not an empty list).
 */
export async function hubPage(kind: "topic" | "company", slug: string): Promise<HubPage | null> {
  const index = await hubIndex();
  const pool = kind === "topic" ? index.topics : index.companies;
  const summary = pool.find((h) => h.slug === slug);
  if (!summary) return null;
  const [catalogue, road] = await Promise.all([getCatalogue(), roadPositions()]);
  const groups = groupByTag(catalogue);
  const related = pool.filter((h) => h.slug !== slug).slice(0, 12);

  if (kind === "topic") {
    const hub = topicHubBySlug(slug)!;
    const rows = topicRows(hub, groups, catalogue);
    // The companies whose problems carry this topic, by how many.
    const counts = new Map<string, number>();
    for (const r of rows) for (const t of tagsOf(r)) if (isCompanyTag(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
    const companyBySlugTag = new Map(index.companies.map((c) => [c.tag, c]));
    const links: HubLink[] = [...counts.entries()]
      .flatMap(([tag, count]) => {
        const c = companyBySlugTag.get(tag);
        return c ? [{ kind: "company" as const, slug: c.slug, label: c.label, count }] : [];
      })
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 12);
    const topicsBySlug = new Map(index.topics.map((t) => [t.slug, t]));
    const nextSlug = TOPIC_ORDER.slice(TOPIC_ORDER.indexOf(slug) + 1).find((s) => topicsBySlug.has(s));
    const next = nextSlug ? topicsBySlug.get(nextSlug)! : null;
    const ordered = prioritise(rows, road, startWith(slug));
    const stageOrder = (await roadDefinition().catch(() => ({ stages: [] as Array<{ id: string }> }))).stages.map((st) => st.id);
    const lesson = lessonForHub(slug, stageOrder);
    return {
      ...summary,
      blurb: hub.blurb,
      essentials: TOPIC_ESSENTIALS[slug] ?? null,
      walkthrough: walkthroughFor(slug),
      plan: topicPlan({ label: hub.label, problems: ordered.map(toHubProblem), next: next ? { label: next.label, href: hubHref(next) } : null }),
      links,
      next,
      problems: rows.map(toHubProblem),
      patterns: [],
      lesson: lesson ? { slug: lesson.slug, title: lesson.title } : null,
      related,
    };
  }

  const rows = groups.get(summary.tag) ?? [];
  const topicCounts = new Map<string, { hub: TopicHub; count: number }>();
  for (const r of rows)
    for (const hub of topicHubsOf(r)) {
      const e = topicCounts.get(hub.slug);
      if (e) e.count++;
      else topicCounts.set(hub.slug, { hub, count: 1 });
    }
  const topicSize = new Map(index.topics.map((t) => [t.slug, t.count]));
  const links: HubLink[] = [...topicCounts.values()]
    .filter((e) => topicSize.has(e.hub.slug))
    .sort((a, b) => b.count - a.count || topicRank(a.hub.slug) - topicRank(b.hub.slug))
    .slice(0, 12)
    .map((e) => ({ kind: "topic", slug: e.hub.slug, label: e.hub.label, count: e.count }));
  const patterns = (await patternsByCompany()).filter((t) => t.company === summary.label || t.company.startsWith(summary.label));
  // Problems no other company is tagged on: the part of the list that is this company's alone.
  const ownProblems = rows.filter((r) => tagsOf(r).filter(isCompanyTag).length === 1).slice(0, 3).map((r) => r.title);
  const blurb = companyBlurb(summary.label, summary.count, commonTopics(links), {
    byDifficulty: summary.byDifficulty,
    catalogue: catalogue.length,
    ownProblems,
    patterns: patterns.map((p) => ({ name: p.name, lead: guideLead(p.slug) })),
  });
  // Each problem's most specific topic: its topic with the fewest problems
  // in the whole catalogue ("Sliding Window" over "Array"), so a plan's
  // groups are techniques rather than everything filed under Arrays.
  const planRows: CompanyPlanProblem[] = prioritise(rows, road, []).map((r) => {
    const hubs = topicHubsOf(r).filter((h) => topicSize.has(h.slug));
    const primary = hubs.sort((a, b) => topicSize.get(a.slug)! - topicSize.get(b.slug)! || topicRank(a.slug) - topicRank(b.slug))[0];
    return { ...toHubProblem(r), primary: primary ? { slug: primary.slug, label: primary.label, rank: topicRank(primary.slug) } : null };
  });
  const companyPatterns = patterns.map(({ slug: s, name }) => ({ slug: s, name }));
  return {
    ...summary,
    blurb,
    essentials: null,
    walkthrough: null,
    plan: companyPlan({ label: summary.label, problems: planRows, patterns: companyPatterns }),
    links,
    next: null,
    problems: rows.map(toHubProblem),
    patterns: companyPatterns,
    lesson: null,
    related,
  };
}

/**
 * Which of a hub's problems this account has solved or only tried, by slug
 * — the page's progress line and its ticks. The hub itself is public and
 * shared-cached, so this is its own small read off the per-user problem
 * state every judge already invalidates.
 */
export async function hubProgress(kind: "topic" | "company", slug: string, userId: string): Promise<{ solved: string[]; attempted: string[] } | null> {
  const [rows, state] = await Promise.all([hubRows(kind, slug), loadProblemState(userId)]);
  if (!rows) return null;
  return {
    solved: rows.filter((r) => state.solved.has(r.id)).map((r) => r.slug),
    attempted: rows.filter((r) => state.attempted.has(r.id)).map((r) => r.slug),
  };
}

/** One hub's rows in catalogue order, or null when there is no such hub. */
async function hubRows(kind: "topic" | "company", slug: string): Promise<CatalogueRow[] | null> {
  const index = await hubIndex();
  const summary = (kind === "topic" ? index.topics : index.companies).find((h) => h.slug === slug);
  if (!summary) return null;
  const catalogue = await getCatalogue();
  const groups = groupByTag(catalogue);
  return kind === "topic" ? topicRows(topicHubBySlug(slug)!, groups, catalogue) : (groups.get(summary.tag) ?? []);
}

const LEVEL_RANK: Record<string, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };

/** The page's order: easy, then medium, then hard — the catalogue's order within a level. Stable, so pages never overlap. */
function inPageOrder(rows: CatalogueRow[]): CatalogueRow[] {
  return rows
    .map((r, i) => [r, i] as const)
    .sort(([a, i], [b, j]) => (LEVEL_RANK[a.difficulty.toUpperCase()] ?? 1) - (LEVEL_RANK[b.difficulty.toUpperCase()] ?? 1) || i - j)
    .map(([r]) => r);
}

/** How many problems one page of a hub's list holds. */
export const HUB_PAGE_SIZE = 100;

export interface HubProblemsPage {
  problems: HubProblem[];
  /** Problems in the whole list (at this difficulty, when one is asked for). */
  total: number;
  /** The offset of the next page, or null after the last. */
  next: number | null;
}

/**
 * One page of a hub's problem list, for the page's infinite scroll. The
 * hub payload used to carry every problem — 667 for Arrays, 914 for Amazon,
 * ~80 KB of JSON and as many rows mounted at once (2026-10-02) — while a
 * reader looks at the first screenful; the list now arrives 100 at a time
 * as it is scrolled. `difficulty` narrows it to one level (the list's
 * Easy/Medium/Hard chips), so the hard problems are one click away rather
 * than behind every easy one. The edge HTML still lists every problem
 * (services/seo.ts reads hubPage), so a crawler loses nothing.
 */
export async function hubProblems(kind: "topic" | "company", slug: string, o: HubProblemsQuery): Promise<HubProblemsPage | null> {
  const rows = await hubRows(kind, slug);
  return rows ? pageOfHub(rows, o) : null;
}

export interface HubProblemsQuery {
  offset: number;
  limit: number;
  difficulty?: Difficulty;
  q?: string;
}

/** The pure half of hubProblems: order, narrow, search and slice a hub's rows (hub-problems.test.ts). */
export function pageOfHub(rows: CatalogueRow[], o: HubProblemsQuery): HubProblemsPage {
  let list = inPageOrder(rows);
  if (o.difficulty) list = list.filter((r) => r.difficulty.toUpperCase() === o.difficulty);
  // The list's search box, answered here so it covers the whole hub and not
  // only the pages already loaded: every word must appear in the title or
  // in one of the problem's topics ("window max", "dp grid").
  const words = (o.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length) {
    list = list.filter((r) => {
      const text = `${r.title} ${tagsOf(r).filter((t) => !isCompanyTag(t)).join(" ")}`.toLowerCase();
      return words.every((w) => text.includes(w));
    });
  }
  const page = list.slice(o.offset, o.offset + o.limit);
  const end = o.offset + page.length;
  return { problems: page.map(toHubProblem), total: list.length, next: end < list.length ? end : null };
}

/** The hubs a problem's tags link to: its topics first, then its companies. */
export async function hubsForTags(tags: string[]): Promise<{ topics: HubSummary[]; companies: HubSummary[] }> {
  const index = await hubIndex();
  const topicSlugs = new Set(tags.flatMap((t) => (isCompanyTag(t) ? [] : [topicHubByTag(t)?.slug ?? ""])).filter(Boolean));
  const topics = index.topics.filter((h) => topicSlugs.has(h.slug));
  const companies = index.companies.filter((h) => tags.includes(h.tag));
  return { topics, companies };
}

/**
 * Up to `limit` problems a reader of this one would want next: the same
 * primary topic (its first topic tag) at the same difficulty first, then
 * the same topic at any difficulty, in the catalogue's order. Deterministic,
 * so the page and its prerendered HTML list the same ones.
 */
export async function relatedProblems(slug: string, tags: string[], difficulty: string, limit = 6): Promise<HubProblem[]> {
  const topics = tags.filter((t) => !isCompanyTag(t));
  const primaryHub = topics.map((t) => topicHubByTag(t)).find(Boolean);
  const catalogue = await getCatalogue();
  const groups = groupByTag(catalogue);
  const pool =(primaryHub ? topicRows(primaryHub, groups, catalogue) : (groups.get(topics[0] ?? "") ?? [])).filter((r) => r.slug !== slug);
  if (pool.length === 0) return [];
  const same = pool.filter((r) => r.difficulty === difficulty);
  const rest = pool.filter((r) => r.difficulty !== difficulty);
  return [...same, ...rest].slice(0, limit).map(toHubProblem);
}

/** Every topic hub that has copy, for tests and the sitemap. */
export const TOPIC_HUB_SLUGS: readonly string[] = TOPIC_HUBS.map((t) => t.slug);

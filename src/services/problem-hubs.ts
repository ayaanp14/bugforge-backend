import { getCatalogue, type CatalogueRow } from "./dashboard.js";
import { isCompanyTag } from "../lib/companies.js";
import { MIN_COMPANY_PROBLEMS, MIN_HUB_PROBLEMS, TOPIC_HUBS, companyBlurb, companyHub, topicHubBySlug, topicHubByTag, type TopicHub } from "../lib/problem-topics.js";

/**
 * The catalogue's hub pages, computed from the cached catalogue.
 *
 * Every list here is a walk over the 600 rows already held in memory for
 * the dashboard (services/dashboard getCatalogue, refreshed every two
 * minutes) — no query, no second cache. A hub's problems are the rows
 * carrying its tag in the catalogue's own order (newest first, as the
 * catalogue page lists them), and its difficulty split is counted on the
 * way. The same functions feed the API the hub pages read at runtime and
 * the SEO service that prerenders them, so the two cannot disagree.
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
}

export interface HubProblem {
  slug: string;
  title: string;
  difficulty: string;
  /** The problem's topic tags only — companies are not topics. */
  topics: string[];
}

export interface HubPage extends HubSummary {
  blurb: string;
  problems: HubProblem[];
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

function topicSummary(hub: TopicHub, rows: CatalogueRow[]): HubSummary {
  return { kind: "topic", slug: hub.slug, label: hub.label, tag: hub.tag, count: rows.length, byDifficulty: countByDifficulty(rows) };
}

function companySummary(tag: string, rows: CatalogueRow[]): HubSummary | null {
  const hub = companyHub(tag);
  if (!hub) return null;
  return { kind: "company", slug: hub.slug, label: hub.label, tag, count: rows.length, byDifficulty: countByDifficulty(rows) };
}

export interface HubIndex {
  topics: HubSummary[];
  companies: HubSummary[];
  /** Topic tags with enough problems for a hub but no entry in TOPIC_HUBS yet. */
  uncovered: Array<{ tag: string; count: number }>;
}

/** Every hub with its counts: the catalogue page's "browse by" strips and the sitemap. */
export async function hubIndex(): Promise<HubIndex> {
  const groups = groupByTag(await getCatalogue());
  const topics: HubSummary[] = [];
  const companies: HubSummary[] = [];
  const uncovered: Array<{ tag: string; count: number }> = [];
  for (const [tag, rows] of groups) {
    if (isCompanyTag(tag)) {
      if (rows.length < MIN_COMPANY_PROBLEMS) continue;
      const s = companySummary(tag, rows);
      if (s) companies.push(s);
      continue;
    }
    if (rows.length < MIN_HUB_PROBLEMS) continue;
    const hub = topicHubByTag(tag);
    if (hub) topics.push(topicSummary(hub, rows));
    else uncovered.push({ tag, count: rows.length });
  }
  const byCount = (a: HubSummary, b: HubSummary) => b.count - a.count || a.label.localeCompare(b.label);
  topics.sort(byCount);
  companies.sort(byCount);
  uncovered.sort((a, b) => b.count - a.count);
  return { topics, companies, uncovered };
}

const toHubProblem = (row: CatalogueRow): HubProblem => ({
  slug: row.slug,
  title: row.title,
  difficulty: row.difficulty,
  topics: tagsOf(row).filter((t) => !isCompanyTag(t)),
});

/**
 * One hub's page, or null when there is no such hub — an unknown slug, or
 * a tag with too few problems for a page (the URL is then a 404, not a
 * thin list).
 */
export async function hubPage(kind: "topic" | "company", slug: string): Promise<HubPage | null> {
  const index = await hubIndex();
  const pool = kind === "topic" ? index.topics : index.companies;
  const summary = pool.find((h) => h.slug === slug);
  if (!summary) return null;
  const groups = groupByTag(await getCatalogue());
  const rows = groups.get(summary.tag) ?? [];
  const blurb = kind === "topic" ? (topicHubBySlug(slug)?.blurb ?? "") : companyBlurb(summary.label, summary.count);
  const related = pool.filter((h) => h.slug !== slug).slice(0, 12);
  return { ...summary, blurb, problems: rows.map(toHubProblem), related };
}

/** The hubs a problem's tags link to: its topics first, then its companies. */
export async function hubsForTags(tags: string[]): Promise<{ topics: HubSummary[]; companies: HubSummary[] }> {
  const index = await hubIndex();
  const topics = index.topics.filter((h) => tags.includes(h.tag));
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
  const primary = topics.find((t) => topicHubByTag(t)) ?? topics[0];
  if (!primary) return [];
  const groups = groupByTag(await getCatalogue());
  const pool = (groups.get(primary) ?? []).filter((r) => r.slug !== slug);
  const same = pool.filter((r) => r.difficulty === difficulty);
  const rest = pool.filter((r) => r.difficulty !== difficulty);
  return [...same, ...rest].slice(0, limit).map(toHubProblem);
}

/** Every topic hub that has copy, for tests and the sitemap. */
export const TOPIC_HUB_SLUGS: readonly string[] = TOPIC_HUBS.map((t) => t.slug);

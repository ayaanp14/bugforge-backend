import { cached } from "../lib/cache.js";
import { topicHubByTag } from "../lib/problem-topics.js";
import { acceptanceRates } from "./problem-acceptance.js";
import { companyDirectory } from "./company-directory.js";
import { getCatalogue } from "./dashboard.js";
import { hubPage } from "./problem-hubs.js";
import { SITE_ORIGIN } from "./seo.js";

/**
 * Every company's coding questions as one JSON document, for the public
 * GitHub repository that republishes them as Markdown each night
 * (ayaanp14/company-wise-coding-questions, its own workflow reads
 * GET /api/seo/company-questions.json).
 *
 * The owner's ask (2026-11-17): "company wise coding questions" repositories
 * collect stars and rank, and every row there links back to the problem
 * here. Nothing in it is new: the company hubs, their blurbs, the test
 * patterns, the simulations and the experiences counts are what
 * /companies and /challenges/company/<slug> already show anyone. Paths only —
 * the repository's script puts the origin and its utm tags in front.
 *
 * One hour in process: the catalogue moves by seeding, and the reader is
 * one nightly job. ~5,000 rows of ~150 bytes, compressed on the way out.
 */

export type ExportDifficulty = "Easy" | "Medium" | "Hard";

export interface ExportProblem {
  /** The catalogue number shown beside the title ("1. Two Sum"); null until the next numbering pass. */
  number: number | null;
  title: string;
  path: string;
  difficulty: ExportDifficulty;
  /** Topic names (never companies); `topics` at the top maps each to its hub page. */
  topics: string[];
  /** Accepted ÷ all submissions, percent; null under 20 submissions. */
  acceptance: number | null;
}

export interface ExportCompany {
  name: string;
  slug: string;
  family: "service" | "product" | null;
  /** The hub page's own opening paragraph (lib/problem-topics companyBlurb). */
  blurb: string;
  path: string;
  counts: { total: number; easy: number; medium: number; hard: number };
  tests: Array<{ name: string; path: string }>;
  simulation: { path: string; rounds: number } | null;
  experiences: { path: string; count: number } | null;
  problems: ExportProblem[];
}

export interface CompanyQuestionsExport {
  generatedAt: string;
  site: string;
  /** Topic name → its hub page, once for the whole document rather than on every row. */
  topics: Record<string, string>;
  companies: ExportCompany[];
}

const TTL_MS = 60 * 60 * 1000;

const difficultyOf = (raw: string): ExportDifficulty => {
  const d = raw.toUpperCase();
  return d === "HARD" ? "Hard" : d === "MEDIUM" ? "Medium" : "Easy";
};

export function companyQuestionsExport(): Promise<CompanyQuestionsExport> {
  return cached("company-questions:export:v1", TTL_MS, async () => {
    const [directory, catalogue, rates] = await Promise.all([companyDirectory(), getCatalogue(), acceptanceRates()]);
    const bySlug = new Map(catalogue.map((r) => [r.slug, r]));
    const topics: Record<string, string> = {};
    const companies: ExportCompany[] = [];
    for (const entry of directory) {
      if (!entry.hub) continue; // A company with tests but no tagged problems is not a question list.
      const page = await hubPage("company", entry.hub.slug);
      if (!page) continue;
      companies.push({
        name: entry.name,
        slug: entry.hub.slug,
        family: entry.family,
        blurb: page.blurb,
        path: `/challenges/company/${entry.hub.slug}`,
        counts: { total: entry.hub.count, easy: entry.hub.easy, medium: entry.hub.medium, hard: entry.hub.hard },
        tests: entry.tests.map((t) => ({ name: t.name, path: `/tests/${t.slug}` })),
        simulation: entry.simulation ? { path: `/simulations/${entry.simulation.slug}`, rounds: entry.simulation.rounds } : null,
        experiences: entry.experiences ? { path: `/interview-experiences?company=${encodeURIComponent(entry.experiences.key)}`, count: entry.experiences.count } : null,
        problems: page.problems.map((p) => {
          const row = bySlug.get(p.slug);
          return {
            number: row?.number ?? null,
            title: p.title,
            path: `/problems/${p.slug}`,
            difficulty: difficultyOf(p.difficulty),
            topics: p.topics.map((tag) => {
              const hub = topicHubByTag(tag);
              if (!hub) return tag;
              topics[hub.label] = `/challenges/${hub.slug}`;
              return hub.label;
            }),
            acceptance: row ? (rates.get(row.id) ?? null) : null,
          };
        }),
      });
    }
    return { generatedAt: new Date().toISOString(), site: SITE_ORIGIN, topics, companies };
  });
}

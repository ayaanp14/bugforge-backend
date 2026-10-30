import { prisma } from "../lib/prisma.js";
import { cached } from "../lib/cache.js";
import { companyKey } from "../lib/readiness.js";
import { SIMULATIONS } from "../lib/simulations/index.js";
import { hubIndex } from "./problem-hubs.js";
import { experienceCompanies } from "./interview-experiences.js";

/**
 * The company directory (/companies, since 2026-10-30): every company the
 * site has something for, with what it has — its tagged coding problems
 * (the company hub), its placement test patterns, its process round by
 * round (lib/simulations) and members' interview experiences. Before it a
 * company page was reached only from a catalogue chip; the owner asked for a
 * way in from the bar, and "company wise coding questions" is a search of its
 * own. Every fact is one the linked page already states — nothing here adds a
 * claim about a company. Companies are matched by readiness's `companyKey`, so HCLTech's
 * pattern and the HCL tag land on one row.
 */

export interface CompanyEntry {
  key: string;
  name: string;
  /** "service" | "product" from its process or its test patterns; null when neither says. */
  family: "service" | "product" | null;
  hub: { slug: string; count: number; easy: number; medium: number; hard: number; indexed: boolean } | null;
  tests: Array<{ slug: string; name: string }>;
  simulation: { slug: string; rounds: number } | null;
  /** Members' accounts, and the key /interview-experiences?company= filters them by (that module's own companyKey). */
  experiences: { count: number; key: string } | null;
}

const TTL_MS = 10 * 60 * 1000;

export function companyDirectory(): Promise<CompanyEntry[]> {
  return cached("companies:directory:v1", TTL_MS, async () => {
    const [hubs, tests, experiences] = await Promise.all([
      hubIndex(),
      prisma.mockTest.findMany({ where: { published: true }, select: { slug: true, name: true, company: true, family: true }, orderBy: { orderIndex: "asc" } }),
      experienceCompanies().catch(() => []),
    ]);
    const rows = new Map<string, CompanyEntry>();
    const row = (name: string) => {
      const key = companyKey(name);
      let r = rows.get(key);
      if (!r) {
        r = { key, name, family: null, hub: null, tests: [], simulation: null, experiences: null };
        rows.set(key, r);
      }
      return r;
    };
    // The hub's label is the catalogue's spelling (CRED, MathWorks), so it names the row when there is one.
    for (const h of hubs.companies) {
      const r = row(h.label);
      r.name = h.label;
      r.hub = { slug: h.slug, count: h.count, easy: h.byDifficulty.EASY, medium: h.byDifficulty.MEDIUM, hard: h.byDifficulty.HARD, indexed: h.indexed };
    }
    for (const sim of SIMULATIONS) {
      const r = row(sim.company);
      r.simulation = { slug: sim.slug, rounds: sim.rounds.length };
      r.family = sim.family;
    }
    for (const t of tests) {
      // "generic" patterns (AMCAT, eLitmus) are not a company's own test.
      if (t.family !== "service" && t.family !== "product") continue;
      const r = row(t.company);
      r.tests.push({ slug: t.slug, name: t.name });
      r.family ??= t.family;
    }
    for (const e of experiences) {
      const r = rows.get(companyKey(e.company));
      // Only companies that have a page of ours; an experience alone is listed on its own page.
      if (r) r.experiences = { count: e.count, key: e.key };
    }
    // Most to practise first: a process and a test outweigh a long problem list, then problems, then name.
    const weight = (r: CompanyEntry) => (r.simulation ? 2 : 0) + (r.tests.length ? 1 : 0);
    return [...rows.values()].sort((a, b) => weight(b) - weight(a) || (b.hub?.count ?? 0) - (a.hub?.count ?? 0) || a.name.localeCompare(b.name));
  });
}

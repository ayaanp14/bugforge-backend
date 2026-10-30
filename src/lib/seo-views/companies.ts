/**
 * The company directory's first screen (/companies) as data, for the
 * static-first view the Worker draws from it (frontend
 * lib/seo/views/api/companies.ts; the registry and the reasons are in
 * lib/seo-views/index.ts).
 *
 * CompaniesPage shows a visitor the breadcrumb, the masthead (words fixed in
 * the SPA's content/companies.ts), the "Find a company" box, then the three
 * groups — service, product, more — each company a row of its name, its
 * counts line and a link per thing it has. Everything per row is the
 * directory's (services/company-directory), which the page reads through
 * `GET /api/companies`; this is that list with the two fields the rows never
 * show (`key`, `hub.indexed`) left out, in the directory's own order. All 65
 * rows (2026-10-30), not a first screen's worth: the view is the page a
 * visitor scrolls during the load too, and a list that stopped after six
 * rows would read as the whole directory.
 *
 * Built in services/seo.ts companiesIndex from the directory it has already
 * loaded — no read of its own (2026-10-30: Lighthouse mobile scored the page
 * 54, LCP 11.0 s, 7.8 s of it render delay waiting for the app and the API).
 */
export interface CompaniesView {
  kind: "companies";
  companies: Array<{
    name: string;
    family: "service" | "product" | null;
    hub: { slug: string; count: number; easy: number; medium: number; hard: number } | null;
    tests: Array<{ slug: string; name: string }>;
    simulation: { slug: string; rounds: number } | null;
    experiences: { count: number; key: string } | null;
  }>;
}

interface EntryLike {
  name: string;
  family: "service" | "product" | null;
  hub: { slug: string; count: number; easy: number; medium: number; hard: number } | null;
  tests: Array<{ slug: string; name: string }>;
  simulation: { slug: string; rounds: number } | null;
  experiences: { count: number; key: string } | null;
}

export function companiesView(all: readonly EntryLike[]): CompaniesView {
  return {
    kind: "companies",
    companies: all.map((c) => ({
      name: c.name,
      family: c.family,
      hub: c.hub ? { slug: c.hub.slug, count: c.hub.count, easy: c.hub.easy, medium: c.hub.medium, hard: c.hub.hard } : null,
      tests: c.tests.map((t) => ({ slug: t.slug, name: t.name })),
      simulation: c.simulation ? { slug: c.simulation.slug, rounds: c.simulation.rounds } : null,
      experiences: c.experiences ? { count: c.experiences.count, key: c.experiences.key } : null,
    })),
  };
}

/**
 * The first screen of /simulations as data, for the static-first view the
 * Worker draws from it (frontend lib/seo/views/api/simulations.ts; the
 * registry and the reasons are in lib/seo-views/index.ts).
 *
 * SimulationsPage for a visitor: every company's row in catalogue order —
 * name, role and how firm the structure is, its rounds as a chain — grouped
 * service then product. A visitor has no runs, so no row's standing is sent.
 * Built in services/seo.ts simulationsIndex from the catalogue (code), no query.
 */
import type { Simulation } from "../simulations/index.js";

export interface SimulationsView {
  kind: "simulations";
  items: Array<{ slug: string; company: string; family: "service" | "product"; role: string; firmness: "official" | "consistent" | "varies"; kinds: string[] }>;
}

export function simulationsView(list: readonly Simulation[]): SimulationsView {
  return {
    kind: "simulations",
    items: list.map((s) => ({ slug: s.slug, company: s.company, family: s.family, role: s.role, firmness: s.firmness, kinds: s.rounds.map((r) => r.kind) })),
  };
}

/**
 * The first screen of one company simulation (/simulations/<slug>) as data,
 * for the static-first view the Worker draws from it (frontend
 * lib/seo/views/api/simulation.ts; the registry and the reasons are in
 * lib/seo-views/index.ts).
 *
 * What SimulationPage shows a visitor (GET /api/simulations/:slug with no
 * account: `run: null`, `past: []`): the masthead, the start panel with the
 * HR-mode choice when a round is a conversation, the rounds in order with
 * the online test's length, then the rail — the firmness, the source note,
 * the sources, "Practise for …" with the company's hub, and how a run works.
 * Never a member's run: the page's run state is read after the view is gone.
 *
 * Built in services/seo.ts simulationHead from the catalogue entry, the hub
 * and the pattern row it has already loaded (2026-10-30) — its test select
 * gained the sections' length and question count for the online test's
 * "75 min · 65 questions", as services/simulations simulationPage counts them.
 */
import type { Simulation } from "../simulations/index.js";

export interface SimulationView {
  kind: "simulation";
  slug: string;
  company: string;
  family: "service" | "product";
  role: string;
  firmness: "official" | "consistent" | "varies";
  sourceNote: string;
  sources: Array<{ label: string; url: string }>;
  rounds: Array<{ key: string; kind: string; name: string; covers: string; test: string | null }>;
  /** The online test's pattern as the page's payload words it (`assessment`), or null when it has none published. */
  assessment: { slug: string; name: string; minutes: number; questions: number } | null;
  /** The company's catalogue hub ("TCS coding questions · 127 problems"), or null when it tags none. */
  hub: { slug: string; label: string; count: number } | null;
}

export function simulationView(
  sim: Simulation,
  assessment: SimulationView["assessment"],
  hub: SimulationView["hub"],
): SimulationView {
  return {
    kind: "simulation",
    slug: sim.slug,
    company: sim.company,
    family: sim.family,
    role: sim.role,
    firmness: sim.firmness,
    sourceNote: sim.sourceNote,
    sources: sim.sources.map((s) => ({ label: s.label, url: s.url })),
    rounds: sim.rounds.map((r) => ({ key: r.key, kind: r.kind, name: r.name, covers: r.covers, test: r.test ?? null })),
    assessment,
    hub,
  };
}

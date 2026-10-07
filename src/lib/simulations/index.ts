import { companyKey } from "../readiness.js";
import { ROUND_SKILL } from "../interview-skills.js";
import { SIMULATIONS } from "./catalog.js";
import { BUILDER_ROUND, INTERVIEW_KINDS, type SimRound, type SimRoundKind, type Simulation } from "./types.js";

export * from "./types.js";
export { SIMULATIONS };

const BY_SLUG = new Map(SIMULATIONS.map((s) => [s.slug, s]));

export const simulationBySlug = (slug: string): Simulation | undefined => BY_SLUG.get(slug);

/** A company's simulation, matched loosely like readiness matches names ("HCLTech" is "HCL"). */
export const simulationForCompany = (company: string): Simulation | undefined => SIMULATIONS.find((s) => companyKey(s.company) === companyKey(company));

/** The builder round an interview round is held as. */
export const builderRoundOf = (r: SimRound): string => r.builderRound ?? BUILDER_ROUND[r.kind as Exclude<SimRoundKind, "assessment">];

/**
 * The interview skills a simulation's rounds ask for, each weighted by how
 * many of its rounds ask it — what readiness's interview area reads for the
 * company (lib/readiness), from the sourced rounds rather than a family guess.
 */
export function interviewSkillWeights(sim: Simulation): Array<{ key: string; weight: number }> {
  const weights = new Map<string, number>();
  // The same rule a question is filed by (lib/interview-skills): the round decides. A case study is no interview skill.
  for (const r of sim.rounds) {
    if (r.kind === "assessment") continue;
    const skill = ROUND_SKILL[builderRoundOf(r)];
    if (skill) weights.set(skill, (weights.get(skill) ?? 0) + 1);
  }
  return [...weights].map(([key, weight]) => ({ key, weight }));
}

/** The builder's focus areas for a round that names none: what that kind of round is about. */
export const DEFAULT_FOCUS: Readonly<Record<Exclude<SimRoundKind, "assessment">, readonly string[]>> = {
  technical: ["oop", "database", "os-networks"],
  coding: ["dsa"],
  "system-design": ["system-design"],
  managerial: ["behavioral", "communication"],
  hr: ["behavioral", "communication"],
  behavioral: ["behavioral", "communication"],
  case: ["communication"],
};

/** The builder's focus ids (frontend interview-options focusOptions). */
export const FOCUS_IDS: ReadonlySet<string> = new Set([
  "dsa", "debugging", "system-design", "behavioral", "frontend", "backend", "database", "testing", "api-design",
  "communication", "oop", "low-level-design", "os-networks", "sql", "cloud", "security", "aptitude",
]);

/**
 * What is wrong with the templates, as sentences (empty = nothing): every
 * slug and round key unique, the company's seeded pattern as the first
 * round, at least one interview round after it, focus ids the builder
 * knows, and a source note and at least one https source on every entry.
 * `patterns` maps each seeded pattern slug to its company.
 */
export function simulationProblems(sims: readonly Simulation[], patterns: ReadonlyMap<string, string>): string[] {
  const out: string[] = [];
  const slugs = new Set<string>();
  for (const s of sims) {
    const at = `simulation ${s.slug}`;
    if (slugs.has(s.slug)) out.push(`${at}: duplicate slug`);
    slugs.add(s.slug);
    if (!/^[a-z0-9-]+$/.test(s.slug)) out.push(`${at}: the slug must be lowercase words joined by hyphens`);
    const keys = new Set<string>();
    for (const r of s.rounds) {
      if (keys.has(r.key)) out.push(`${at}: duplicate round key ${r.key}`);
      keys.add(r.key);
      if (!r.name.trim() || !r.covers.trim()) out.push(`${at}: round ${r.key} needs a name and what it covers`);
      for (const f of r.focus ?? []) if (!FOCUS_IDS.has(f)) out.push(`${at}: round ${r.key} names focus "${f}", which the builder does not know`);
      if (r.builderRound && !(r.builderRound in ROUND_SKILL)) out.push(`${at}: round ${r.key} names builder round "${r.builderRound}", which the builder does not know`);
      if (r.kind === "assessment") {
        if (!r.test || !patterns.has(r.test)) out.push(`${at}: round ${r.key} names test "${r.test}", which is not a seeded pattern`);
        else if (companyKey(patterns.get(r.test)!) !== companyKey(s.company)) out.push(`${at}: round ${r.key} uses ${patterns.get(r.test)}'s pattern, not ${s.company}'s`);
      } else if (r.test) out.push(`${at}: interview round ${r.key} names a test`);
    }
    if (s.rounds[0]?.kind !== "assessment") out.push(`${at}: the first round must be the company's online assessment`);
    if (s.rounds.filter((r) => r.kind === "assessment").length !== 1) out.push(`${at}: exactly one assessment round`);
    if (!s.rounds.some((r) => INTERVIEW_KINDS.includes(r.kind))) out.push(`${at}: at least one interview round after the assessment`);
    if (s.sourceNote.trim().length < 40) out.push(`${at}: the source note must say how firm the structure is`);
    if (!s.sources.length || s.sources.some((x) => !/^https:\/\//.test(x.url) || !x.label.trim())) out.push(`${at}: every source needs a label and an https URL`);
  }
  return out;
}

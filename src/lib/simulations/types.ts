/**
 * Company simulations (Phase 7 of ADAPTIVE_COACH.md): a company's online
 * assessment and its interview rounds, in the published order, as one run.
 *
 * Content as code, like the SQL problems: the templates in catalog.ts ship
 * with the API and go live with a deploy — no seed. Each is held to the test
 * patterns' standard (scripts/mock-test-data): the round structure comes from
 * the company's own careers pages where it publishes one, otherwise from
 * prep-portal breakdowns that agree with each other, and `sourceNote` says
 * how firm that is and what varies. Nothing here claims more about how a
 * company hires than its sources say (simulations.test.ts holds every
 * template to its sources and to a seeded pattern).
 */

export type SimFamily = "service" | "product";

/** What a round practises. "assessment" is the company's seeded test pattern; the rest are interview rounds. */
export type SimRoundKind = "assessment" | "technical" | "coding" | "system-design" | "managerial" | "hr" | "behavioral" | "case";

export const INTERVIEW_KINDS: readonly SimRoundKind[] = ["technical", "coding", "system-design", "managerial", "hr", "behavioral", "case"];

/**
 * The interview builder's round id for each kind (frontend
 * components/mock-interview/interview-options.ts), so a simulation round is
 * an ordinary mock interview — counted, reported and scored like any other.
 */
export const BUILDER_ROUND: Readonly<Record<Exclude<SimRoundKind, "assessment">, string>> = {
  technical: "technical-interview",
  coding: "coding-interview",
  "system-design": "system-design-interview",
  managerial: "managerial-round",
  hr: "hr-round",
  behavioral: "behavioral-round",
  case: "case-study",
};

/** The conversation rounds, held the way the candidate chose at the start (written or voice); the rest need the editor. */
export const CONVERSATION_KINDS: ReadonlySet<SimRoundKind> = new Set(["managerial", "hr", "behavioral"]);

export interface SimRound {
  /** Unique within the simulation: "oa", "technical", "hr". */
  key: string;
  kind: SimRoundKind;
  /** As the sources name it: "TCS NQT", "Technical Interview", "Bar raiser". */
  name: string;
  /** What it covers, in one line, per the sources. */
  covers: string;
  /** assessment: the seeded test pattern's slug. */
  test?: string;
  /** Interview rounds: the builder's focus areas (focusOptions ids). */
  focus?: readonly string[];
  /**
   * The builder's round id when one names the round exactly ("machine-coding",
   * "low-level-design") rather than its kind's (BUILDER_ROUND).
   */
  builderRound?: string;
}

export interface SimSource {
  label: string;
  url: string;
}

export interface Simulation {
  slug: string;
  /** As the site spells it (COMPANY_TAGS or the pattern's company). */
  company: string;
  family: SimFamily;
  /** The role the run practises for, as the candidate would say it: "campus fresher", "SDE new grad". */
  role: string;
  /** The interviews' depth: the builder's difficulty. */
  difficulty: "beginner" | "intermediate" | "advanced";
  rounds: readonly SimRound[];
  /** official: the company's own page; consistent: two or more prep sources agree; varies: they differ (sourceNote says how). */
  firmness: "official" | "consistent" | "varies";
  /** How firm the structure is and what varies between drives, shown on the page. */
  sourceNote: string;
  sources: readonly SimSource[];
}

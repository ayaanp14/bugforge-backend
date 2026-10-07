/**
 * Readiness for a target company (Phase 5 of ADAPTIVE_COACH.md), pure: how
 * much of what that target asks has the account *shown here*, area by area.
 * It is an estimate of evidence, not a prediction of an offer — the page and
 * the handbook say so — and every number carries its confidence.
 *
 * The one company-specific input is a sourced fact the site already holds:
 * the company's online-assessment pattern (scripts/mock-test-data, each with
 * its `sourceNote`), whose sections name aptitude categories and coding
 * topics. Each section is read against the skill profile's mastery of
 * exactly those skills, and a recent sitting of the pattern itself counts as
 * direct evidence. The coding area reads the topics the company's tagged
 * problems use. Nothing here claims how a company hires beyond those.
 *
 * The area weights are judgement, like the skill scorer's (lib/skill-score.ts):
 * an online assessment decides more of a service company's process, coding
 * rounds more of a product company's. Change them with evidence and bump
 * READINESS_VERSION.
 */

export const READINESS_VERSION = 1;

export type ReadinessFamily = "service" | "product";
export type AreaKey = "assessment" | "coding" | "fundamentals" | "interview" | "resume";
export type ReadinessStatus = "ready" | "close" | "not-yet" | "unknown";

export const AREA_WEIGHTS: Record<ReadinessFamily, Record<AreaKey, number>> = {
  service: { assessment: 0.45, coding: 0.15, fundamentals: 0.15, interview: 0.15, resume: 0.1 },
  product: { assessment: 0.25, coding: 0.35, fundamentals: 0.15, interview: 0.15, resume: 0.1 },
};

/** A recent sitting of the company's pattern weighs as much as the skills behind it. */
const SITTING_WEIGHT = 0.5;
const SITTING_WINDOW_DAYS = 90;
const INTERVIEW_WINDOW_DAYS = 120;
const INTERVIEWS_COUNTED = 3;
const RESUME_WINDOW_DAYS = 180;
/** Below this an area's number is shown, but its status says there is too little to go on. */
const KNOWN_CONFIDENCE = 0.3;
const READY_AT = 75;
const CLOSE_AT = 50;

const DAY = 86_400_000;

export interface SkillReading {
  /** The skill graph's key (lib/skill-graph), e.g. "apt:quantitative". */
  key: string;
  mastery: number;
  confidence: number;
  label: string;
  href: string;
}

export interface BlueprintDraw {
  topics?: string[];
  category?: string;
  difficulty?: string;
  count: number;
}

export interface PatternSection {
  key: string;
  name: string;
  kind: "mcq" | "coding";
  questionCount: number;
  marksPerQuestion: number;
  blueprint: BlueprintDraw[];
}

export interface TargetPattern {
  slug: string;
  name: string;
  sourceNote: string | null;
  sections: PatternSection[];
}

export interface ReadinessInput {
  company: string;
  family: ReadinessFamily;
  /** The company's online-assessment patterns; none for a company the site has no pattern for. */
  patterns: TargetPattern[];
  /** The profile's reading of a skill, or null when the graph has no such skill. */
  skill: (key: string) => SkillReading | null;
  /** An aptitude topic id → its category id (lib/aptitude-topics). */
  categoryOfTopic: (topic: string) => string | null;
  /** Problem tags → DSA skill keys (lib/skill-graph skillsForProblemTags). */
  skillsForTags: (tags: string[]) => string[];
  /** DSA skills the company's tagged problems use, with how many problems each — the catalogue's top skills when it has none. */
  codingSkills: Array<{ key: string; problems: number }>;
  /** A link to the company's problems (its hub), when it has one. */
  companyHref: string | null;
  /** Graded sittings of the patterns: percentage and when (terminated ones never reach here). */
  sittings: Array<{ slug: string; pct: number; at: number }>;
  /** Sat mock interviews with an overall score (0–100), newest first. */
  interviews: Array<{ score: number; at: number }>;
  /** The newest finished resume analysis, and whether it was aimed at this company. */
  resume: { score: number; at: number; forCompany: boolean } | null;
  targetDate: number | null;
  dailyMinutes: number | null;
  asOf: number;
}

export interface ReadinessAction {
  label: string;
  href: string;
}

export interface ReadinessPart {
  label: string;
  score: number;
  confidence: number;
  href?: string;
}

export interface ReadinessArea {
  key: AreaKey;
  label: string;
  weight: number;
  score: number;
  confidence: number;
  status: ReadinessStatus;
  summary: string;
  parts: ReadinessPart[];
  next: ReadinessAction[];
  /**
   * The skills behind the area that are below ready, the one with most to
   * gain first — what today's mission (lib/mission.ts) works when this area
   * is the one to lean on. Empty for the areas no skill measures.
   */
  gaps: Array<{ skill: string; mastery: number }>;
}

export interface Readiness {
  version: number;
  company: string;
  family: ReadinessFamily;
  areas: ReadinessArea[];
  overall: { score: number; confidence: number; status: ReadinessStatus };
  /** The three things that would move the estimate most, in order. */
  focus: ReadinessAction[];
  target: { date: string; daysLeft: number; hoursLeft: number | null } | null;
  patterns: Array<{ slug: string; name: string; sourceNote: string | null }>;
}

const round = (n: number) => Math.round(n);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function statusOf(score: number, confidence: number): ReadinessStatus {
  if (confidence < KNOWN_CONFIDENCE) return "unknown";
  return score >= READY_AT ? "ready" : score >= CLOSE_AT ? "close" : "not-yet";
}

/** Count-weighted mean of readings; null when none of the keys is measured. */
function meanOf(entries: Array<{ reading: SkillReading | null; weight: number }>): { score: number; confidence: number } | null {
  let w = 0;
  let s = 0;
  let c = 0;
  for (const e of entries) {
    if (!e.reading || e.weight <= 0) continue;
    w += e.weight;
    s += e.weight * e.reading.mastery;
    c += e.weight * e.reading.confidence;
  }
  return w > 0 ? { score: s / w, confidence: c / w } : null;
}

/** The skills one blueprint draw tests, read off the profile. */
function drawReadings(draw: BlueprintDraw, kind: PatternSection["kind"], input: ReadinessInput): SkillReading[] {
  if (kind === "coding") {
    const keys = draw.topics?.length ? input.skillsForTags(draw.topics) : [];
    const pool = keys.length ? keys : input.codingSkills.map((s) => s.key);
    return pool.map((k) => input.skill(k)).filter((r): r is SkillReading => r != null);
  }
  const categories = draw.category ? [draw.category] : (draw.topics ?? []).map((t) => input.categoryOfTopic(t)).filter((c): c is string => Boolean(c));
  return [...new Set(categories)].map((c) => input.skill(`apt:${c}`)).filter((r): r is SkillReading => r != null);
}

function assessmentArea(input: ReadinessInput, weight: number): ReadinessArea | null {
  if (!input.patterns.length) return null;
  const parts: ReadinessPart[] = [];
  const weakest: Array<{ reading: SkillReading; gap: number }> = [];
  for (const pattern of input.patterns) {
    const sections: Array<{ reading: SkillReading | null; weight: number }> = [];
    for (const section of pattern.sections) {
      const draws: Array<{ reading: SkillReading | null; weight: number }> = [];
      for (const d of section.blueprint) {
        const readings = drawReadings(d, section.kind, input);
        const m = meanOf(readings.map((r) => ({ reading: r, weight: 1 })));
        draws.push({ reading: m ? { key: "", mastery: m.score, confidence: m.confidence, label: "", href: "" } : null, weight: d.count });
        for (const r of readings) weakest.push({ reading: r, gap: (100 - r.mastery) * d.count * section.marksPerQuestion });
      }
      const m = meanOf(draws);
      sections.push({ reading: m ? { key: "", mastery: m.score, confidence: m.confidence, label: section.name, href: "" } : null, weight: section.questionCount * section.marksPerQuestion });
    }
    const estimate = meanOf(sections) ?? { score: 0, confidence: 0 };
    const recent = input.sittings.filter((s) => s.slug === pattern.slug && input.asOf - s.at <= SITTING_WINDOW_DAYS * DAY).sort((a, b) => b.at - a.at);
    // The best of the latest three: one bad morning should not erase two good ones.
    const sat = recent.length ? Math.max(...recent.slice(0, 3).map((s) => s.pct)) : null;
    const score = sat == null ? estimate.score : (1 - SITTING_WEIGHT) * estimate.score + SITTING_WEIGHT * sat;
    const confidence = sat == null ? estimate.confidence : Math.max(estimate.confidence, 0.8);
    parts.push({ label: pattern.name, score: round(score), confidence, href: `/tests/${pattern.slug}` });
  }
  const score = parts.reduce((a, p) => a + p.score, 0) / parts.length;
  const confidence = parts.reduce((a, p) => a + p.confidence, 0) / parts.length;
  const next: ReadinessAction[] = [];
  const lowest = [...parts].sort((a, b) => a.score - b.score)[0]!;
  const unsat = input.patterns.find((p) => !input.sittings.some((s) => s.slug === p.slug));
  const toSit = unsat ? { name: unsat.name, href: `/tests/${unsat.slug}` } : { name: lowest.label, href: lowest.href! };
  next.push({ label: `Sit the ${toSit.name} mock`, href: toSit.href });
  // Marks at stake per skill, summed over every draw that tests it: where the paper has most to give.
  const gaps = new Map<string, { reading: SkillReading; gap: number }>();
  for (const w of weakest) {
    const g = gaps.get(w.reading.key);
    gaps.set(w.reading.key, { reading: w.reading, gap: (g?.gap ?? 0) + w.gap });
  }
  const byGap = [...gaps.values()].filter((g) => g.reading.mastery < READY_AT).sort((a, b) => b.gap - a.gap);
  const top = byGap[0];
  if (top) next.push({ label: `Practise ${top.reading.label}`, href: top.reading.href });
  const satRecently = input.sittings.some((s) => input.patterns.some((p) => p.slug === s.slug) && input.asOf - s.at <= SITTING_WINDOW_DAYS * DAY);
  return {
    key: "assessment",
    label: "Online assessment",
    weight,
    score: round(score),
    confidence,
    status: statusOf(score, confidence),
    summary: satRecently
      ? `${input.company}'s test pattern, read from your skills in each section and your recent mock sittings.`
      : `${input.company}'s test pattern, read from your skills in each of its sections. A mock sitting would make this firmer.`,
    parts,
    next,
    gaps: byGap.map((g) => ({ skill: g.reading.key, mastery: round(g.reading.mastery) })),
  };
}

function codingArea(input: ReadinessInput, weight: number): ReadinessArea {
  const top = [...input.codingSkills].sort((a, b) => b.problems - a.problems).slice(0, 6);
  const readings = top.map((s) => ({ key: s.key, reading: input.skill(s.key), weight: s.problems }));
  const m = meanOf(readings) ?? { score: 0, confidence: 0 };
  const parts = readings
    .filter((r): r is { key: string; reading: SkillReading; weight: number } => r.reading != null)
    .map((r) => ({ label: r.reading.label, score: round(r.reading.mastery), confidence: r.reading.confidence, href: r.reading.href }));
  const weakest = [...parts].sort((a, b) => a.score - b.score)[0];
  const next: ReadinessAction[] = [];
  if (weakest && weakest.score < READY_AT) next.push({ label: `Practise ${weakest.label}`, href: weakest.href! });
  if (input.companyHref) next.push({ label: `Work through ${input.company}'s problems`, href: input.companyHref });
  // Most to gain: room left × how many of the company's problems use the topic.
  const gaps = readings
    .filter((r): r is { key: string; reading: SkillReading; weight: number } => r.reading != null && r.reading.mastery < READY_AT)
    .sort((a, b) => (100 - b.reading.mastery) * b.weight - (100 - a.reading.mastery) * a.weight)
    .map((r) => ({ skill: r.key, mastery: round(r.reading.mastery) }));
  return {
    key: "coding",
    label: "Coding rounds",
    weight,
    score: round(m.score),
    confidence: m.confidence,
    status: statusOf(m.score, m.confidence),
    summary: input.companyHref ? `The topics ${input.company}'s tagged problems use most, by your mastery of each.` : "The most common interview topics, by your mastery of each.",
    parts,
    next,
    gaps,
  };
}

const FUNDAMENTALS = ["cs:os", "cs:networks", "cs:oop", "cs:dbms"];

function fundamentalsArea(input: ReadinessInput, weight: number): ReadinessArea {
  const readings = FUNDAMENTALS.map((k) => input.skill(k)).filter((r): r is SkillReading => r != null);
  const m = meanOf(readings.map((r) => ({ reading: r, weight: 1 }))) ?? { score: 0, confidence: 0 };
  const parts = readings.map((r) => ({ label: r.label, score: round(r.mastery), confidence: r.confidence, href: r.href }));
  const weakest = [...parts].sort((a, b) => a.score - b.score || a.confidence - b.confidence)[0];
  return {
    key: "fundamentals",
    label: "CS fundamentals",
    weight,
    score: round(m.score),
    confidence: m.confidence,
    status: statusOf(m.score, m.confidence),
    summary: "Operating systems, networks, OOP and DBMS — measured only by skill-test sittings.",
    parts,
    next: weakest && weakest.score < READY_AT ? [{ label: `Read and test ${weakest.label}`, href: weakest.href! }] : [],
    gaps: readings
      .filter((r) => r.mastery < READY_AT)
      .sort((a, b) => a.mastery - b.mastery || a.confidence - b.confidence)
      .map((r) => ({ skill: r.key, mastery: round(r.mastery) })),
  };
}

function interviewArea(input: ReadinessInput, weight: number): ReadinessArea {
  const recent = input.interviews.filter((i) => input.asOf - i.at <= INTERVIEW_WINDOW_DAYS * DAY).slice(0, INTERVIEWS_COUNTED);
  const score = recent.length ? recent.reduce((a, i) => a + i.score, 0) / recent.length : 0;
  const confidence = clamp01(recent.length / INTERVIEWS_COUNTED);
  return {
    key: "interview",
    label: "Interview practice",
    weight,
    score: round(score),
    confidence,
    status: statusOf(score, confidence),
    summary: recent.length
      ? `Your last ${recent.length === 1 ? "mock interview" : `${recent.length} mock interviews`}, scored by the interviewer.`
      : "No mock interview in the last four months.",
    parts: recent.map((i, n) => ({ label: n === 0 ? "Latest" : `${n + 1} back`, score: round(i.score), confidence: 1 })),
    next: [{ label: recent.length ? "Sit another mock interview" : "Sit a mock interview", href: "/mock-interview" }],
    gaps: [],
  };
}

function resumeArea(input: ReadinessInput, weight: number): ReadinessArea {
  const r = input.resume && input.asOf - input.resume.at <= RESUME_WINDOW_DAYS * DAY ? input.resume : null;
  const confidence = r ? (r.forCompany ? 1 : 0.7) : 0;
  const score = r?.score ?? 0;
  return {
    key: "resume",
    label: "Resume",
    weight,
    score: round(score),
    confidence,
    status: statusOf(score, confidence),
    summary: r ? (r.forCompany ? `Your latest resume analysis, aimed at ${input.company}.` : "Your latest resume analysis (aimed at another role).") : "No resume analysed in the last six months.",
    parts: [],
    next: [{ label: r?.forCompany ? "Improve your resume" : `Analyse your resume against ${/^[AEIOU]/i.test(input.company) ? "an" : "a"} ${input.company} role`, href: "/resume" }],
    gaps: [],
  };
}

/**
 * The areas still below ready, the one whose progress would move the
 * estimate most first: weight × room left. The page's "Do these next" and
 * today's mission (lib/mission.ts) both read the areas in this order.
 */
export function areasByGain(areas: readonly ReadinessArea[]): ReadinessArea[] {
  return areas.filter((a) => a.score < READY_AT).sort((a, b) => b.weight * (100 - b.score) - a.weight * (100 - a.score));
}

export function readinessOf(input: ReadinessInput): Readiness {
  const base = AREA_WEIGHTS[input.family];
  // A company with no pattern: the assessment's share goes to the rest, in proportion.
  const scale = input.patterns.length ? 1 : 1 / (1 - base.assessment);
  const w = (k: AreaKey) => (k === "assessment" && !input.patterns.length ? 0 : base[k] * scale);
  const areas = [
    assessmentArea(input, w("assessment")),
    codingArea(input, w("coding")),
    fundamentalsArea(input, w("fundamentals")),
    interviewArea(input, w("interview")),
    resumeArea(input, w("resume")),
  ].filter((a): a is ReadinessArea => a != null);

  const score = areas.reduce((a, x) => a + x.weight * x.score, 0);
  const confidence = areas.reduce((a, x) => a + x.weight * x.confidence, 0);
  // What would move the estimate most: weight × room left, one action an area.
  const focus = areasByGain(areas)
    .filter((a) => a.next.length)
    .slice(0, 3)
    .map((a) => a.next[0]!);

  let target: Readiness["target"] = null;
  if (input.targetDate != null && input.targetDate >= input.asOf - DAY) {
    const daysLeft = Math.max(0, Math.ceil((input.targetDate - input.asOf) / DAY));
    target = {
      date: new Date(input.targetDate).toISOString().slice(0, 10),
      daysLeft,
      hoursLeft: input.dailyMinutes ? Math.round((daysLeft * input.dailyMinutes) / 60) : null,
    };
  }

  return {
    version: READINESS_VERSION,
    company: input.company,
    family: input.family,
    areas,
    overall: { score: round(score), confidence, status: statusOf(score, confidence) },
    focus,
    target,
    patterns: input.patterns.map((p) => ({ slug: p.slug, name: p.name, sourceNote: p.sourceNote })),
  };
}

/** Company names as the patterns and the tags spell them, compared loosely ("HCLTech" is the "HCL" tag). */
const COMPANY_ALIASES: Readonly<Record<string, string>> = { hcltech: "hcl", facebook: "meta" };
export const companyKey = (name: string): string => {
  const k = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return COMPANY_ALIASES[k] ?? k;
};

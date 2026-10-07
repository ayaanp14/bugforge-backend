import { SKILLS, SKILL_AREAS, SKILL_DOMAINS, dependentsOf, learningRank, type SkillDomain, type SkillNode } from "./skill-graph.js";
import {
  DIFFICULTIES,
  MISTAKE_CLASSES,
  SCORING_VERSION,
  confidenceLabel,
  dayOf,
  mistakeOf,
  scoreSkill,
  summarizeItem,
  type AssessmentRecord,
  type ConfidenceLabel,
  type Difficulty,
  type EvidenceSource,
  type Indicator,
  type ItemHistory,
  type ItemSummary,
  type MistakeClass,
  type SkillCatalogue,
  type SkillScore,
  type SkillStatus,
} from "./skill-score.js";

/**
 * The skill profile: every skill scored (lib/skill-score.ts), rolled up into
 * areas and domains, read against the graph's prerequisites, and turned into
 * the answers the page leads with — what is weakest, what to start next,
 * what is due for review, what moved this week and why.
 *
 * Pure like the engine: services/skill-profile.ts gathers the evidence and
 * hands it in with the clock. Nothing here is stored; a week-ago profile is
 * the same function called with `asOf` a week earlier, so "+8 Trees: you
 * solved two medium tree problems without hints" is computed, not logged.
 * skill-profile.test.ts pins the roll-ups and the explanations.
 *
 * Activity, skill and readiness are kept apart on purpose. `activity` is
 * what was done (attempts, days), `skills` is what it showed; a week of 40
 * submissions on problems already solved moves the first and not the second,
 * and the page says so. Readiness for an interview is a later layer that
 * will read these skills — it is not computed here.
 */

/** A skill's prerequisite below this is a gap worth naming. */
export const PREREQ_WEAK = 30;
/** Below this a started skill can be a weak spot; at or above it, a strength. Never both. */
export const WEAK_BELOW = 50;
/** The window "this week" compares across. */
export const CHANGE_WINDOW_DAYS = 7;
/** The window the mistake mix reads, besides all time. */
export const MISTAKE_WINDOW_DAYS = 30;

const DAY_MS = 86_400_000;

export interface ProblemCandidate {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  number: number | null;
  skills: readonly string[];
}

export interface ProfileInput {
  items: readonly ItemHistory[];
  assessments: readonly AssessmentRecord[];
  /** Per skill key: what the catalogue holds for it. A skill missing here (or with count 0) cannot be measured and is left out. */
  catalogue: ReadonlyMap<string, SkillCatalogue>;
  /** Published coding problems, for recommendations. */
  problems: readonly ProblemCandidate[];
  asOf: number;
  /**
   * Recent "Why it failed" reviews (services/submission-analysis.ts): the
   * cause each one named, by problem. Optional — a profile reads the same
   * without them, it just has no causes to report.
   */
  analyses?: ReadonlyArray<{ problemId: string; category: string; at: number }>;
}

export const sourceOf = (node: SkillNode): EvidenceSource | null =>
  node.match.problemTags ? "problem" : node.match.bugTags || node.match.bugCategory ? "bug" : node.match.sqlTopic ? "sql" : node.match.aptitudeCategory ? "aptitude" : null;

interface Scored {
  node: SkillNode;
  score: SkillScore;
  summaries: ItemSummary[];
  /** Skill keys among `requires` below PREREQ_WEAK. */
  blockedBy: string[];
}

/** The skills the catalogue can evidence today. */
export function measurableSkills(catalogue: ReadonlyMap<string, SkillCatalogue>): SkillNode[] {
  return SKILLS.filter((s) => (catalogue.get(s.key)?.count ?? 0) > 0);
}

/** Every measurable skill scored at `asOf`, with prerequisite gaps applied. */
export function scoreAll(input: Pick<ProfileInput, "items" | "assessments" | "catalogue" | "analyses">, asOf: number): Map<string, Scored> {
  const nodes = measurableSkills(input.catalogue);
  const bySkill = new Map<string, ItemSummary[]>();
  for (const item of input.items) {
    const summary = summarizeItem(item, asOf);
    if (!summary) continue;
    for (const key of item.skills) {
      const list = bySkill.get(key);
      if (list) list.push(summary);
      else bySkill.set(key, [summary]);
    }
  }
  const assessed = new Map<string, AssessmentRecord[]>();
  for (const a of input.assessments) {
    for (const key of a.skills) {
      const list = assessed.get(key);
      if (list) list.push(a);
      else assessed.set(key, [a]);
    }
  }

  const out = new Map<string, Scored>();
  for (const node of nodes) {
    const summaries = bySkill.get(node.key) ?? [];
    const score = scoreSkill(node.key, sourceOf(node), summaries, assessed.get(node.key) ?? [], input.catalogue.get(node.key), asOf);
    out.set(node.key, { node, score, summaries, blockedBy: [] });
  }

  // Prerequisites: name the weak ones. A skill already strong keeps no
  // complaint about its foundations — the evidence says they held.
  for (const s of out.values()) {
    s.blockedBy = s.node.requires.filter((r) => {
      const req = out.get(r);
      return req != null && req.score.mastery < PREREQ_WEAK;
    });
    if (s.score.status !== "unstarted" && s.score.mastery < 40 && s.blockedBy.length) {
      const names = s.blockedBy.map((r) => `${out.get(r)!.node.label} (${out.get(r)!.score.mastery}%)`);
      const gap: Indicator = {
        code: "prerequisite_gap",
        severity: 2,
        message: `Leans on ${names.join(" and ")}. Strengthening ${s.blockedBy.length === 1 ? "it" : "them"} first will make this easier.`,
      };
      s.score.indicators = [...s.score.indicators, gap].sort((a, b) => b.severity - a.severity);
    }
  }

  // The same cause found by the reviews again and again in one skill's
  // problems is a weak spot of its own: "missed edge cases in 3 Two Pointers
  // problems this month" says more than any one verdict.
  const recent = (input.analyses ?? []).filter((a) => a.at <= asOf && a.at > asOf - MISTAKE_WINDOW_DAYS * DAY_MS);
  if (recent.length) {
    const skillsOf = new Map(input.items.filter((i) => i.source === "problem").map((i) => [i.id, i.skills]));
    const bySkill = new Map<string, Map<string, Set<string>>>();
    for (const a of recent) {
      for (const key of skillsOf.get(a.problemId) ?? []) {
        const causes = bySkill.get(key) ?? new Map<string, Set<string>>();
        causes.set(a.category, (causes.get(a.category) ?? new Set()).add(a.problemId));
        bySkill.set(key, causes);
      }
    }
    for (const [key, causes] of bySkill) {
      const s = out.get(key);
      if (!s) continue;
      const [category, problems] = [...causes.entries()].sort((a, b) => b[1].size - a[1].size)[0]!;
      if (problems.size < REPEAT_MISTAKE_PROBLEMS) continue;
      const repeat: Indicator = {
        code: "repeat_mistake",
        severity: 2,
        message: `Your recent reviews found ${CAUSE_PHRASE[category] ?? "the same mistake"} in ${problems.size} ${s.node.label} problems.`,
        ...((MISTAKE_CLASSES as readonly string[]).includes(category) ? { mistake: category as MistakeClass } : {}),
      };
      s.score.indicators = [...s.score.indicators, repeat].sort((a, b) => b.severity - a.severity);
    }
  }
  return out;
}

/** Different problems in one skill whose reviews named the same cause, before it is a weak spot. */
export const REPEAT_MISTAKE_PROBLEMS = 2;

/** A review category as a phrase in a sentence ("found … in 3 problems"). */
export const CAUSE_PHRASE: Readonly<Record<string, string>> = {
  EDGE_CASE: "missed edge cases",
  CONCEPTUAL: "a wrong approach",
  COMPLEXITY: "solutions too slow for the inputs",
  IMPLEMENTATION: "code that did something other than the idea",
  SYNTAX: "code that did not compile",
  MISREAD_PROBLEM: "a misread statement",
  DATA_STRUCTURE_SELECTION: "the wrong data structure",
  ALGORITHM_SELECTION: "the wrong technique",
  PREMATURE_OPTIMIZATION: "an optimisation that broke correctness",
};

/** The reviews' causes over the window, most common first. */
export function causesOf(analyses: ProfileInput["analyses"], from: number, to: number): Array<{ category: string; count: number; share: number }> {
  const counts = new Map<string, number>();
  let total = 0;
  for (const a of analyses ?? []) {
    if (a.at <= from || a.at > to) continue;
    counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
    total++;
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count, share: Math.round((count / total) * 100) / 100 }))
    .sort((a, b) => b.count - a.count);
}

// ── Views ─────────────────────────────────────────────────────────

export interface SkillView {
  key: string;
  label: string;
  area: string;
  domain: SkillDomain;
  href: string;
  mastery: number;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  status: SkillStatus;
  requires: string[];
  blockedBy: string[];
  /** Items the catalogue holds for it. */
  available: number;
  attempted: number;
  solved: number;
  sittings: number;
  due: boolean;
  nextReviewAt: string | null;
  lastActivityAt: string | null;
  /** The two most pressing weak spots. */
  indicators: Array<Pick<Indicator, "code" | "severity" | "message">>;
}

export interface RollupView {
  key: string;
  label: string;
  mastery: number;
  confidence: number;
  started: number;
  strong: number;
  total: number;
}

export interface AreaView extends RollupView {
  domain: SkillDomain;
  skills: string[];
}

export interface DomainView extends RollupView {
  evidence: string;
  areas: string[];
}

export interface ChangeView {
  key: string;
  label: string;
  domain: SkillDomain;
  from: number;
  to: number;
  delta: number;
  reasons: string[];
}

export interface MistakeMix {
  /** Failed attempts on coding problems, SQL problems and hunts in the window. */
  total: number;
  classes: Array<{ class: MistakeClass; count: number; share: number }>;
}

export interface Recommendation {
  slug: string;
  title: string;
  href: string;
  difficulty: Difficulty;
  number: number | null;
  reason: string;
}

export interface SkillProfileView {
  version: number;
  asOf: string;
  domains: DomainView[];
  areas: AreaView[];
  skills: SkillView[];
  focus: {
    /** Started skills holding the most back: low mastery weighted by how much depends on them. */
    weakest: string[];
    /**
     * Started skills still in the learning band that are not yet weak
     * spots — too little evidence to call them that. Without this list a
     * beginner with one solve had nothing to do: no weakness proven yet,
     * and every next topic waiting on the one just begun.
     */
    building: string[];
    /** Unstarted skills whose prerequisites are in place, in learning order. */
    ready: string[];
    /** Skills whose review is due, most overdue first. */
    due: string[];
    strongest: string[];
  };
  /** Skill recommendations for the weakest skills, so the page needs no second request to act on them. */
  recommendations: Record<string, Recommendation[]>;
  changes: ChangeView[];
  mistakes: {
    recent: MistakeMix;
    allTime: MistakeMix;
    /** What the "Why it failed" reviews found over the last MISTAKE_WINDOW_DAYS, most common first. */
    causes: Array<{ category: string; count: number; share: number }>;
  };
  activity: {
    attempts7d: number;
    solved7d: number;
    activeDays28: number;
    /** Net mastery points gained across every skill this week. */
    skillPoints7d: number;
  };
}

const iso = (ms: number | null) => (ms == null ? null : new Date(ms).toISOString());

const weightOf = (catalogue: ReadonlyMap<string, SkillCatalogue>, key: string) => Math.log(1 + (catalogue.get(key)?.count ?? 0));

function rollup(key: string, label: string, scored: Scored[], catalogue: ReadonlyMap<string, SkillCatalogue>): RollupView {
  let w = 0;
  let m = 0;
  let c = 0;
  for (const s of scored) {
    const wk = weightOf(catalogue, s.node.key);
    w += wk;
    m += wk * s.score.mastery;
    c += wk * s.score.confidence;
  }
  return {
    key,
    label,
    mastery: w ? Math.round(m / w) : 0,
    confidence: w ? Math.round((c / w) * 100) / 100 : 0,
    started: scored.filter((s) => s.score.status !== "unstarted").length,
    strong: scored.filter((s) => s.score.status === "strong").length,
    total: scored.length,
  };
}

function skillView(s: Scored, catalogue: ReadonlyMap<string, SkillCatalogue>): SkillView {
  const { node, score } = s;
  return {
    key: node.key,
    label: node.label,
    area: node.area,
    domain: node.domain,
    href: node.href,
    mastery: score.mastery,
    confidence: score.confidence,
    confidenceLabel: confidenceLabel(score.confidence),
    status: score.status,
    requires: [...node.requires],
    blockedBy: s.blockedBy,
    available: catalogue.get(node.key)?.count ?? 0,
    attempted: score.counts.attempted,
    solved: score.counts.solved,
    sittings: score.counts.sittings,
    due: Boolean(score.review?.due),
    nextReviewAt: iso(score.review?.nextReviewAt ?? null),
    lastActivityAt: iso(score.lastActivityAt),
    indicators: score.indicators.slice(0, 2).map(({ code, severity, message }) => ({ code, severity, message })),
  };
}

/** How much a skill holds back: what depends on it, how big it is, how far it has to go. */
const priorityOf = (s: Scored, catalogue: ReadonlyMap<string, SkillCatalogue>) =>
  weightOf(catalogue, s.node.key) * (1 + 0.25 * dependentsOf(s.node.key).length) * (100 - s.score.mastery);

// ── Mistakes ──────────────────────────────────────────────────────

const JUDGED: ReadonlySet<EvidenceSource> = new Set(["problem", "sql", "bug"]);

export function mistakeMix(items: readonly ItemHistory[], from: number, to: number): MistakeMix {
  const counts = new Map<MistakeClass, number>();
  let total = 0;
  for (const item of items) {
    if (!JUDGED.has(item.source)) continue;
    for (const a of item.attempts) {
      if (a.at < from || a.at > to) continue;
      const cls = mistakeOf(a);
      if (!cls) continue;
      counts.set(cls, (counts.get(cls) ?? 0) + 1);
      total++;
    }
  }
  return {
    total,
    classes: MISTAKE_CLASSES.map((cls) => ({ class: cls, count: counts.get(cls) ?? 0, share: total ? Math.round(((counts.get(cls) ?? 0) / total) * 100) / 100 : 0 }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count),
  };
}

// ── Changes ───────────────────────────────────────────────────────

const DIFF_WORD: Record<Difficulty, string> = { easy: "easy", medium: "medium", hard: "hard" };

/** Why a skill moved between `from` and `to`, in the evidence's own words. */
export function changeReasons(summaries: readonly ItemSummary[], from: number, to: number, delta: number, nouns: [string, string]): string[] {
  const firstSolves = summaries.filter((s) => s.solvedAt != null && s.solvedAt > from && s.solvedAt <= to);
  const reviews = summaries.filter((s) => s.solvedAt != null && s.solvedAt <= from && s.item.attempts.some((a) => a.outcome === "accepted" && a.at > from && a.at <= to));
  const failedOnly = summaries.filter((s) => !s.item.attempts.some((a) => a.outcome === "accepted" && a.at > from && a.at <= to) && s.item.attempts.some((a) => a.at > from && a.at <= to));
  const reasons: string[] = [];
  if (firstSolves.length) {
    const by = DIFFICULTIES.map((d) => [d, firstSolves.filter((s) => s.item.difficulty === d).length] as const).filter(([, n]) => n > 0);
    const words = by.map(([d, n]) => `${n} ${DIFF_WORD[d]}`).join(" and ");
    const helped = firstSolves.filter((s) => s.assist !== "none").length;
    const first = firstSolves.filter((s) => s.firstTry).length;
    const tail = helped === 0 ? " without hints" : helped === firstSolves.length ? " with the hints or editorial open" : `, ${helped} with help`;
    reasons.push(`Solved ${words} ${firstSolves.length === 1 ? nouns[0] : nouns[1]}${tail}${first ? `, ${first} on the first try` : ""}.`);
  }
  if (reviews.length) reasons.push(`Solved ${reviews.length} again after a gap, which counts as a review.`);
  if (failedOnly.length) reasons.push(`${failedOnly.length} ${failedOnly.length === 1 ? nouns[0] : nouns[1]} attempted but not yet accepted.`);
  if (!firstSolves.length && !reviews.length && delta < 0) {
    const last = Math.max(...summaries.filter((s) => s.solvedAt != null && s.solvedAt <= to).map((s) => s.lastAt), -Infinity);
    const days = Number.isFinite(last) ? Math.max(1, dayOf(to) - dayOf(last)) : null;
    reasons.push(days ? `No practice for ${days} days, so retention fell.` : "Retention fell without practice.");
  }
  return reasons;
}

const NOUNS: Record<EvidenceSource | "assessment", [string, string]> = {
  problem: ["problem", "problems"],
  bug: ["hunt", "hunts"],
  sql: ["SQL problem", "SQL problems"],
  aptitude: ["question", "questions"],
  assessment: ["sitting", "sittings"],
};

// ── Recommendations ───────────────────────────────────────────────

const RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
const LABEL: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

/** The difficulty that moves a skill most at its current mastery. */
export const targetDifficulty = (mastery: number): Difficulty => (mastery < 30 ? "easy" : mastery < 65 ? "medium" : "hard");

/**
 * The next problems for one DSA skill, from the catalogue: unfinished ones
 * first (finishing what was started is the cheapest gain), then unsolved
 * ones at the difficulty the skill's mastery calls for, preferring problems
 * whose other tags lean on nothing the learner has not started — a first
 * graph problem should not also be the first heap problem.
 */
export function recommendFor(key: string, scored: ReadonlyMap<string, Scored>, input: Pick<ProfileInput, "items" | "problems">, limit = 3): Recommendation[] {
  const skill = scored.get(key);
  if (!skill || sourceOf(skill.node) !== "problem") return [];
  const solved = new Set<string>();
  const started = new Set<string>();
  for (const item of input.items) {
    if (item.source !== "problem") continue;
    if (item.attempts.some((a) => a.outcome === "accepted")) solved.add(item.id);
    else if (item.attempts.length) started.add(item.id);
  }
  const mastery = skill.score.mastery;
  const want = RANK[targetDifficulty(mastery)];
  const unready = (other: string) => other !== key && (scored.get(other)?.score.status ?? "unstarted") === "unstarted" && (scored.get(other)?.blockedBy.length ?? 0) > 0;
  const candidates = input.problems
    .filter((p) => p.skills.includes(key) && !solved.has(p.id))
    .map((p) => ({
      p,
      unfinished: started.has(p.id) && RANK[p.difficulty] <= want + 1,
      distance: Math.abs(RANK[p.difficulty] - want),
      confounds: p.skills.filter(unready).length,
    }))
    .sort(
      (a, b) =>
        Number(b.unfinished) - Number(a.unfinished) ||
        a.distance - b.distance ||
        a.confounds - b.confounds ||
        (a.p.number ?? Number.MAX_SAFE_INTEGER) - (b.p.number ?? Number.MAX_SAFE_INTEGER),
    )
    .slice(0, limit);
  return candidates.map(({ p, unfinished }) => ({
    slug: p.slug,
    title: p.title,
    href: `/problems/${p.slug}`,
    difficulty: p.difficulty,
    number: p.number,
    reason: unfinished
      ? "You started this one and have not had it accepted yet."
      : mastery === 0
        ? `A first ${LABEL[p.difficulty]} to start ${skill.node.label} on.`
        : `${LABEL[p.difficulty]}: at ${mastery}%, ${skill.node.label} grows fastest at this level${skill.score.counts.hints + skill.score.counts.solution ? "; try it before opening the hints" : ""}.`,
  }));
}

// ── The profile ───────────────────────────────────────────────────

export interface SkillProfile {
  view: SkillProfileView;
  scored: Map<string, Scored>;
  input: ProfileInput;
  /** Every skill that moved this week (the view carries the largest few). */
  changes: ChangeView[];
}

export function buildSkillProfile(input: ProfileInput): SkillProfile {
  const { asOf, catalogue } = input;
  const now = scoreAll(input, asOf);
  const weekAgo = asOf - CHANGE_WINDOW_DAYS * DAY_MS;
  const before = scoreAll(input, weekAgo);

  const all = [...now.values()];
  const areas: AreaView[] = SKILL_AREAS.map((a) => {
    const members = all.filter((s) => s.node.area === a.key);
    return { ...rollup(a.key, a.label, members, catalogue), domain: a.domain, skills: members.map((s) => s.node.key) };
  }).filter((a) => a.total > 0);
  const domains: DomainView[] = SKILL_DOMAINS.map((d) => {
    const members = all.filter((s) => s.node.domain === d.key);
    return { ...rollup(d.key, d.label, members, catalogue), evidence: d.evidence, areas: areas.filter((a) => a.domain === d.key).map((a) => a.key) };
  }).filter((d) => d.total > 0);

  const started = all.filter((s) => s.score.status !== "unstarted");
  const weakest = started
    .filter((s) => s.score.mastery < WEAK_BELOW && (s.score.counts.attempted >= 2 || s.score.counts.sittings >= 1))
    .sort((a, b) => priorityOf(b, catalogue) - priorityOf(a, catalogue))
    .slice(0, 5)
    .map((s) => s.node.key);
  const building = started
    .filter((s) => s.score.status === "learning" && !weakest.includes(s.node.key))
    .sort((a, b) => learningRank(a.node.key) - learningRank(b.node.key))
    .slice(0, 5)
    .map((s) => s.node.key);
  const ready = all
    .filter((s) => s.score.status === "unstarted" && s.blockedBy.length === 0 && sourceOf(s.node) === "problem")
    .sort((a, b) => learningRank(a.node.key) - learningRank(b.node.key))
    .slice(0, 5)
    .map((s) => s.node.key);
  const due = all
    .filter((s) => s.score.review?.due)
    .sort((a, b) => (b.score.review!.overdueDays - a.score.review!.overdueDays) || b.score.mastery - a.score.mastery)
    .slice(0, 6)
    .map((s) => s.node.key);
  // Strong means something: a skill at 6% was this list's top entry for an
  // account with little else started, which praised it for nothing.
  const strongest = started
    .filter((s) => s.score.mastery >= WEAK_BELOW && s.score.confidence >= 0.35)
    .sort((a, b) => b.score.mastery - a.score.mastery)
    .slice(0, 5)
    .map((s) => s.node.key);

  const recommendations: Record<string, Recommendation[]> = {};
  for (const key of new Set([...weakest, ...building.slice(0, 2), ...ready.slice(0, 2)])) {
    const recs = recommendFor(key, now, input);
    if (recs.length) recommendations[key] = recs;
  }

  const changes: ChangeView[] = [];
  let skillPoints7d = 0;
  for (const s of all) {
    const from = before.get(s.node.key)?.score.mastery ?? 0;
    const delta = s.score.mastery - from;
    skillPoints7d += delta;
    if (delta === 0) continue;
    const source = sourceOf(s.node);
    const reasons = source
      ? changeReasons(s.summaries, weekAgo, asOf, delta, NOUNS[source])
      : [delta > 0 ? "A new skill-test sitting." : "Your last sitting counts for less as it ages."];
    changes.push({ key: s.node.key, label: s.node.label, domain: s.node.domain, from, to: s.score.mastery, delta, reasons });
  }
  changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  let attempts7d = 0;
  let solved7d = 0;
  const activeDays = new Set<number>();
  const since28 = asOf - 28 * DAY_MS;
  for (const item of input.items) {
    const firstAccept = item.attempts.find((a) => a.outcome === "accepted");
    if (firstAccept && firstAccept.at > weekAgo && firstAccept.at <= asOf) solved7d++;
    for (const a of item.attempts) {
      if (a.at > asOf) continue;
      if (a.at > weekAgo) attempts7d++;
      if (a.at > since28) activeDays.add(dayOf(a.at));
    }
  }

  return {
    scored: now,
    input,
    changes,
    view: {
      version: SCORING_VERSION,
      asOf: new Date(asOf).toISOString(),
      domains,
      areas,
      skills: all.map((s) => skillView(s, catalogue)),
      focus: { weakest, building, ready, due, strongest },
      recommendations,
      changes: changes.slice(0, 12),
      mistakes: {
        recent: mistakeMix(input.items, asOf - MISTAKE_WINDOW_DAYS * DAY_MS, asOf),
        allTime: mistakeMix(input.items, 0, asOf),
        causes: causesOf(input.analyses, asOf - MISTAKE_WINDOW_DAYS * DAY_MS, asOf),
      },
      activity: { attempts7d, solved7d, activeDays28: activeDays.size, skillPoints7d },
    },
  };
}

// ── One skill, in full ────────────────────────────────────────────

export interface EvidenceItemView {
  source: EvidenceSource;
  title: string;
  href: string;
  difficulty: Difficulty;
  solved: boolean;
  solvedAt: string | null;
  lastAt: string;
  attempts: number;
  firstTry: boolean;
  assist: "none" | "hints" | "solution";
  paired: boolean;
  solveSecs: number | null;
}

export interface SkillDetailView {
  skill: SkillView;
  components: SkillScore["components"];
  ceiling: SkillScore["ceiling"];
  counts: SkillScore["counts"];
  review: { stage: number; lastPracticedAt: string; nextReviewAt: string; due: boolean; overdueDays: number; retention: number } | null;
  indicators: Array<Pick<Indicator, "code" | "severity" | "message" | "mistake">>;
  prerequisites: Array<{ key: string; label: string; mastery: number; status: SkillStatus; weak: boolean }>;
  unlocks: Array<{ key: string; label: string; mastery: number; status: SkillStatus }>;
  evidence: EvidenceItemView[];
  /** How many items the evidence list was cut from. */
  evidenceTotal: number;
  recommendations: Recommendation[];
  change: ChangeView | null;
}

export const EVIDENCE_SHOWN = 30;

export function skillDetail(profile: SkillProfile, key: string): SkillDetailView | null {
  const s = profile.scored.get(key);
  if (!s) return null;
  const { score } = s;
  const evidence = [...s.summaries]
    .sort((a, b) => b.lastAt - a.lastAt)
    .slice(0, EVIDENCE_SHOWN)
    .map((sum) => ({
      source: sum.item.source,
      title: sum.item.title,
      href: sum.item.href,
      difficulty: sum.item.difficulty,
      solved: sum.solved,
      solvedAt: iso(sum.solvedAt),
      lastAt: iso(sum.lastAt)!,
      attempts: sum.attempts,
      firstTry: sum.firstTry,
      assist: sum.assist,
      paired: sum.paired,
      solveSecs: sum.solveSecs,
    }));
  const related = (k: string) => profile.scored.get(k);
  return {
    skill: skillView(s, profile.input.catalogue),
    components: score.components,
    ceiling: score.ceiling,
    counts: score.counts,
    review: score.review
      ? {
          stage: score.review.stage,
          lastPracticedAt: iso(score.review.lastPracticedAt)!,
          nextReviewAt: iso(score.review.nextReviewAt)!,
          due: score.review.due,
          overdueDays: score.review.overdueDays,
          retention: Math.round(score.review.retention * 100) / 100,
        }
      : null,
    indicators: score.indicators.map(({ code, severity, message, mistake }) => ({ code, severity, message, ...(mistake ? { mistake } : {}) })),
    prerequisites: s.node.requires
      .map(related)
      .filter((r): r is Scored => r != null)
      .map((r) => ({ key: r.node.key, label: r.node.label, mastery: r.score.mastery, status: r.score.status, weak: r.score.mastery < PREREQ_WEAK })),
    unlocks: dependentsOf(key)
      .map(related)
      .filter((r): r is Scored => r != null)
      .map((r) => ({ key: r.node.key, label: r.node.label, mastery: r.score.mastery, status: r.score.status })),
    evidence,
    evidenceTotal: s.summaries.length,
    recommendations: recommendFor(key, profile.scored, profile.input, 5),
    change: profile.changes.find((c) => c.key === key) ?? null,
  };
}

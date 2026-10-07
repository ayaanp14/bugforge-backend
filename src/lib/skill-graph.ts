import { TOPIC_HUBS, TOPIC_ORDER } from "./problem-topics.js";
import { SQL_TOPICS } from "./sql-problems/index.js";
import { APTITUDE_CATEGORIES } from "./aptitude-topics.js";
import { slugify } from "./slug.js";

/**
 * The skill graph: what CodeKairo measures a learner on, which skills lean
 * on which, and which evidence counts towards each one.
 *
 * Every skill here is one the site can *measure* — it is defined by the
 * evidence that feeds it, never by a wish list. The DSA skills are the
 * catalogue's own topic tags (lib/problem-topics TOPIC_HUBS), so a problem
 * evidences exactly the skills its tags name and a tag added to the
 * catalogue is a skill the moment it has a hub (skill-graph.test.ts holds
 * the two lists to each other). Linked lists are the obvious absence: the
 * judge's signature types are int / int[] / int[][] / string / string[], so
 * the catalogue has no linked-list problem and the skill could only ever
 * read 0% — it is left out rather than shown unmeasurable.
 *
 * Code rather than seeded rows, like the topic hubs it is built on. The
 * graph changes when the catalogue's vocabulary changes, which is a code
 * change already; holding it here keeps it reviewable, versioned with the
 * scoring that reads it, and checked by a test that every prerequisite is a
 * real skill learned earlier (TOPIC_ORDER) — a cycle cannot be written. If
 * administrators ever need to edit it without a deploy, the roadmap's shape
 * is the path: this file becomes the seed of a SkillNode table.
 *
 * Prerequisites are the dependencies a learner actually meets, not a
 * taxonomy: a tree problem here is recursion over an array encoding, so
 * Trees needs Recursion; Dijkstra is BFS with a heap, so Shortest Path needs
 * both. They gate *recommendations* (lib/skill-profile.ts) — a skill whose
 * prerequisites are weak is suggested later — and never lower a measured
 * score: a learner who demonstrably solves graph problems keeps the credit
 * whatever the profile thinks of their queues.
 */

export type SkillDomain = "dsa" | "debugging" | "sql" | "fundamentals" | "aptitude" | "interview";

export interface SkillDomainDef {
  key: SkillDomain;
  label: string;
  /** What the domain's numbers are computed from, in one line for the page. */
  evidence: string;
}

export const SKILL_DOMAINS: readonly SkillDomainDef[] = [
  { key: "dsa", label: "Data structures & algorithms", evidence: "Your coding-problem submissions: what you solved, how hard, how many tries, and whether you opened the hints or editorial first." },
  { key: "debugging", label: "Debugging", evidence: "Your bug-hunt fixes: which hunts you fixed, how many tries they took and how long." },
  { key: "sql", label: "SQL", evidence: "Your SQL-problem submissions, by topic." },
  { key: "fundamentals", label: "CS fundamentals", evidence: "Your skill-test sittings in Operating Systems, Computer Networks, OOP and SQL theory." },
  { key: "aptitude", label: "Aptitude", evidence: "Your answers in the aptitude bank: correct on the first try, with or without hints, and how fast." },
  { key: "interview", label: "Interviews", evidence: "Your mock-interview answers, as the interviewer scored them, by the kind of question asked." },
];

export interface SkillArea {
  key: string;
  domain: SkillDomain;
  label: string;
}

/** Which evidence counts for a skill. A skill reads from exactly one source. */
export interface SkillMatch {
  /** A coding problem carrying any of these tags. */
  problemTags?: readonly string[];
  /** A bug hunt carrying any of these tags… */
  bugTags?: readonly string[];
  /** …or filed under this category (frontend | backend | database). */
  bugCategory?: string;
  /** A SQL problem listing this topic (lib/sql-problems SQL_TOPICS). */
  sqlTopic?: string;
  /** An aptitude question in this category (lib/aptitude-topics). */
  aptitudeCategory?: string;
  /** A sitting of a skill test for this skill (lib/skill-catalog SkillId). */
  skillTest?: string;
  /** A scored mock-interview question of this kind (lib/interview-skills interviewSkillOf). */
  interviewQuestions?: true;
}

export interface SkillNode {
  /** "<domain>:<id>" — "dsa:two-pointers", "debug:security", "sql:joins". */
  key: string;
  label: string;
  area: string;
  domain: SkillDomain;
  /** Skill keys this one leans on. */
  requires: readonly string[];
  match: SkillMatch;
  /** Where to learn and practise it. */
  href: string;
}

// ── Data structures & algorithms ──────────────────────────────────

/**
 * The DSA areas, each a set of topic hubs (by hub slug). Every hub is in
 * exactly one area — the test checks.
 */
const DSA_AREAS: ReadonlyArray<{ key: string; label: string; hubs: readonly string[] }> = [
  { key: "dsa.foundations", label: "Arrays & strings", hubs: ["arrays", "strings", "matrix", "simulation", "enumeration"] },
  { key: "dsa.hashing", label: "Hashing", hubs: ["hash-table", "counting"] },
  { key: "dsa.pointers", label: "Two pointers & windows", hubs: ["two-pointers", "sliding-window", "prefix-sum"] },
  { key: "dsa.sorting", label: "Sorting & searching", hubs: ["sorting", "counting-sort", "bucket-sort", "merge-sort", "quickselect", "binary-search", "divide-and-conquer"] },
  { key: "dsa.stacks", label: "Stacks & queues", hubs: ["stack", "queue", "monotonic-stack", "monotonic-queue"] },
  { key: "dsa.recursion", label: "Recursion & backtracking", hubs: ["recursion", "backtracking"] },
  { key: "dsa.trees", label: "Trees & heaps", hubs: ["trees", "trie", "heap", "ordered-set", "segment-tree", "binary-indexed-tree"] },
  {
    key: "dsa.graphs",
    label: "Graphs",
    hubs: ["graph", "breadth-first-search", "depth-first-search", "topological-sort", "union-find", "shortest-path", "minimum-spanning-tree", "biconnected-component"],
  },
  { key: "dsa.dp", label: "Dynamic programming", hubs: ["dynamic-programming", "memoization", "digit-dp", "bitmask", "game-theory"] },
  { key: "dsa.greedy", label: "Greedy & intervals", hubs: ["greedy", "intervals"] },
  { key: "dsa.math", label: "Math & bits", hubs: ["math", "bit-manipulation", "number-theory", "sieve-of-eratosthenes", "combinatorics", "geometry", "brainteaser"] },
  { key: "dsa.string-algorithms", label: "String algorithms", hubs: ["string-matching", "kmp", "rolling-hash", "suffix-array"] },
];

/**
 * Each hub's prerequisites, by hub slug. Every prerequisite comes earlier
 * in TOPIC_ORDER (the test checks), which is what makes the graph acyclic.
 */
const DSA_REQUIRES: Readonly<Record<string, readonly string[]>> = {
  arrays: [],
  strings: [],
  math: [],
  "hash-table": ["arrays"],
  counting: ["hash-table"],
  "two-pointers": ["arrays"],
  "sliding-window": ["two-pointers", "hash-table"],
  "prefix-sum": ["arrays"],
  sorting: ["arrays"],
  "counting-sort": ["sorting", "counting"],
  "bucket-sort": ["sorting", "hash-table"],
  "binary-search": ["sorting"],
  stack: ["arrays"],
  queue: ["arrays"],
  "monotonic-stack": ["stack"],
  "monotonic-queue": ["queue", "sliding-window"],
  matrix: ["arrays"],
  simulation: ["arrays"],
  enumeration: ["arrays"],
  intervals: ["sorting"],
  greedy: ["sorting"],
  recursion: ["arrays"],
  "merge-sort": ["sorting", "recursion"],
  "divide-and-conquer": ["recursion"],
  quickselect: ["sorting"],
  heap: ["arrays"],
  "ordered-set": ["binary-search", "heap"],
  "bit-manipulation": ["math"],
  bitmask: ["bit-manipulation"],
  "number-theory": ["math"],
  "sieve-of-eratosthenes": ["number-theory"],
  combinatorics: ["math"],
  trees: ["recursion"],
  trie: ["trees", "strings"],
  backtracking: ["recursion"],
  graph: ["hash-table", "queue"],
  "breadth-first-search": ["graph", "queue"],
  "depth-first-search": ["graph", "recursion"],
  "topological-sort": ["breadth-first-search"],
  "union-find": ["graph"],
  "shortest-path": ["breadth-first-search", "heap"],
  "minimum-spanning-tree": ["union-find", "sorting"],
  "biconnected-component": ["depth-first-search"],
  "dynamic-programming": ["recursion"],
  memoization: ["recursion", "hash-table"],
  "digit-dp": ["dynamic-programming"],
  "game-theory": ["dynamic-programming"],
  geometry: ["math"],
  brainteaser: ["math"],
  "string-matching": ["strings"],
  kmp: ["string-matching"],
  "rolling-hash": ["string-matching", "hash-table"],
  "suffix-array": ["string-matching", "sorting"],
  "segment-tree": ["trees", "prefix-sum"],
  "binary-indexed-tree": ["prefix-sum", "bit-manipulation"],
};

export const dsaKey = (hubSlug: string): string => `dsa:${hubSlug}`;

const DSA_SKILLS: SkillNode[] = DSA_AREAS.flatMap((area) =>
  area.hubs.map((slug) => {
    const hub = TOPIC_HUBS.find((h) => h.slug === slug);
    if (!hub) throw new Error(`skill-graph: no topic hub "${slug}" (lib/problem-topics TOPIC_HUBS)`);
    return {
      key: dsaKey(slug),
      label: hub.label,
      area: area.key,
      domain: "dsa" as const,
      requires: (DSA_REQUIRES[slug] ?? []).map(dsaKey),
      match: { problemTags: [hub.tag, ...(hub.aliases ?? [])] },
      href: `/challenges/${slug}`,
    };
  }),
);

// ── Debugging ─────────────────────────────────────────────────────

/**
 * Two views of the same hunts: what kind of bug it was (from the hunt's
 * tags — "Security", "Validation", "Overflow" …, grouped into families)
 * and which layer it lived in (the hunt's category). A hunt always evidences
 * its layer and any families its tags name. Tags outside every family
 * ("netctl", a project's own name) simply evidence nothing beyond the layer.
 */
const DEBUG_CLASSES: ReadonlyArray<{ id: string; label: string; tags: readonly string[] }> = [
  { id: "security", label: "Security & auth bugs", tags: ["Security", "Auth", "Privacy"] },
  { id: "validation", label: "Input validation & parsing", tags: ["Validation", "Parsing", "Unicode", "Strings", "Bounds", "Limits", "Resource Limits"] },
  { id: "state", label: "State, caching & concurrency", tags: ["State", "Caching", "Concurrency", "Consistency", "Dedupe", "Idempotency"] },
  { id: "time", label: "Dates & time", tags: ["Time", "Dates", "Timezones", "Leap Years"] },
  { id: "numeric", label: "Numbers & money", tags: ["Overflow", "Math", "Money", "Rounding", "Floating Point", "Units", "Pricing"] },
  { id: "integration", label: "Config, networking & errors", tags: ["Config", "Networking", "Retries", "Error Handling", "Logging", "Versioning", "Performance"] },
];

const DEBUG_LAYERS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "frontend", label: "Frontend bugs" },
  { id: "backend", label: "Backend bugs" },
  { id: "database", label: "Database bugs" },
];

const DEBUG_SKILLS: SkillNode[] = [
  ...DEBUG_CLASSES.map((c) => ({
    key: `debug:${c.id}`,
    label: c.label,
    area: "debug.kinds",
    domain: "debugging" as const,
    requires: [],
    match: { bugTags: c.tags },
    href: "/bug-hunts",
  })),
  ...DEBUG_LAYERS.map((l) => ({
    key: `debug:${l.id}`,
    label: l.label,
    area: "debug.layers",
    domain: "debugging" as const,
    requires: [],
    match: { bugCategory: l.id },
    href: `/bug-hunts/${l.id}`,
  })),
];

// ── SQL ───────────────────────────────────────────────────────────

const SQL_REQUIRES: Readonly<Record<string, readonly string[]>> = {
  Basics: [],
  Joins: ["Basics"],
  Aggregation: ["Basics"],
  Subqueries: ["Joins", "Aggregation"],
  "Window Functions": ["Aggregation"],
  Strings: ["Basics"],
  Dates: ["Basics"],
  "Conditional Logic": ["Basics"],
};

const sqlKey = (topic: string) => `sql:${slugify(topic)}`;

const SQL_SKILLS: SkillNode[] = SQL_TOPICS.map((topic) => ({
  key: sqlKey(topic),
  label: topic,
  area: "sql.queries",
  domain: "sql" as const,
  requires: (SQL_REQUIRES[topic] ?? []).map(sqlKey),
  match: { sqlTopic: topic },
  href: "/sql",
}));

// ── CS fundamentals ───────────────────────────────────────────────

/**
 * Measured by the skill tests alone for now: they are the one place the
 * site checks this knowledge under supervision. Reading the CS notes is not
 * evidence of anything, and the aptitude bank's core-CS questions carry no
 * subject field to file them under OS, networks or DBMS.
 */
const CS_SKILLS: SkillNode[] = [
  { key: "cs:os", label: "Operating systems", skillTest: "os", href: "/notes/operating-systems" },
  { key: "cs:networks", label: "Computer networks", skillTest: "networks", href: "/notes/computer-networks" },
  { key: "cs:oop", label: "Object-oriented programming", skillTest: "oop", href: "/notes/oop" },
  { key: "cs:dbms", label: "DBMS & SQL theory", skillTest: "sql", href: "/notes/dbms" },
].map(({ skillTest, ...s }) => ({ ...s, area: "cs.core", domain: "fundamentals" as const, requires: [], match: { skillTest } }));

// ── Aptitude ──────────────────────────────────────────────────────

const APTITUDE_SKILLS: SkillNode[] = APTITUDE_CATEGORIES.map((c) => ({
  key: `apt:${c.id}`,
  label: c.label,
  area: "apt.sections",
  domain: "aptitude" as const,
  requires: [],
  match: { aptitudeCategory: c.id },
  href: `/aptitude/${c.id}`,
}));

// ── Interviews ────────────────────────────────────────────────────

/**
 * The four kinds of answer a mock interview scores (lib/interview-skills,
 * which says how a question is filed under one). Measured like the CS
 * fundamentals — each sat round is a sitting, scored from its questions —
 * because an interview answer is judged, not solved.
 */
const INTERVIEW_SKILL_NODES: SkillNode[] = [
  { key: "int:coding", label: "Coding interviews", href: "/mock-interview" },
  { key: "int:technical", label: "Technical questions", href: "/mock-interview" },
  { key: "int:design", label: "System design", href: "/mock-interview" },
  { key: "int:behavioural", label: "Behavioural & HR", href: "/mock-interview" },
].map((s) => ({ ...s, area: "int.answers", domain: "interview" as const, requires: [], match: { interviewQuestions: true as const } }));

// ── The graph ─────────────────────────────────────────────────────

export const SKILL_AREAS: readonly SkillArea[] = [
  ...DSA_AREAS.map((a) => ({ key: a.key, domain: "dsa" as const, label: a.label })),
  { key: "debug.kinds", domain: "debugging", label: "Kinds of bug" },
  { key: "debug.layers", domain: "debugging", label: "Layers" },
  { key: "sql.queries", domain: "sql", label: "Querying" },
  { key: "cs.core", domain: "fundamentals", label: "Core subjects" },
  { key: "apt.sections", domain: "aptitude", label: "Placement-paper sections" },
  { key: "int.answers", domain: "interview", label: "Kinds of question" },
];

export const SKILLS: readonly SkillNode[] = [...DSA_SKILLS, ...DEBUG_SKILLS, ...SQL_SKILLS, ...CS_SKILLS, ...APTITUDE_SKILLS, ...INTERVIEW_SKILL_NODES];

const BY_KEY = new Map(SKILLS.map((s) => [s.key, s]));
export const skillNode = (key: string): SkillNode | undefined => BY_KEY.get(key);

/** The skills that list `key` as a prerequisite. */
const DEPENDENTS = new Map<string, string[]>();
for (const s of SKILLS) for (const r of s.requires) DEPENDENTS.set(r, [...(DEPENDENTS.get(r) ?? []), s.key]);
export const dependentsOf = (key: string): readonly string[] => DEPENDENTS.get(key) ?? [];

/** A DSA skill's place in TOPIC_ORDER — the order the profile suggests unstarted skills in. */
const DSA_ORDER = new Map(TOPIC_ORDER.map((slug, i) => [dsaKey(slug), i]));
export const learningRank = (key: string): number => DSA_ORDER.get(key) ?? SKILLS.findIndex((s) => s.key === key) + TOPIC_ORDER.length;

// ── Matching evidence to skills ───────────────────────────────────

const PROBLEM_TAG_INDEX = new Map<string, string[]>();
const BUG_TAG_INDEX = new Map<string, string[]>();
for (const s of SKILLS) {
  for (const t of s.match.problemTags ?? []) PROBLEM_TAG_INDEX.set(t, [...(PROBLEM_TAG_INDEX.get(t) ?? []), s.key]);
  for (const t of s.match.bugTags ?? []) BUG_TAG_INDEX.set(t.toLowerCase(), [...(BUG_TAG_INDEX.get(t.toLowerCase()) ?? []), s.key]);
}

const unique = (keys: string[]) => [...new Set(keys)];

/** The skills a coding problem evidences, from its tags (companies and sources match nothing). */
export function skillsForProblemTags(tags: readonly string[]): string[] {
  return unique(tags.flatMap((t) => PROBLEM_TAG_INDEX.get(t) ?? []));
}

/** The skills a bug hunt evidences: its layer, and any bug family its tags name. */
export function skillsForBugHunt(category: string, tags: readonly string[]): string[] {
  const layer = SKILLS.find((s) => s.match.bugCategory === category)?.key;
  return unique([...(layer ? [layer] : []), ...tags.flatMap((t) => BUG_TAG_INDEX.get(t.toLowerCase()) ?? [])]);
}

export function skillsForSqlTopics(topics: readonly string[]): string[] {
  return unique(topics.map(sqlKey).filter((k) => BY_KEY.has(k)));
}

export function skillsForAptitudeCategory(category: string): string[] {
  const key = `apt:${category}`;
  return BY_KEY.has(key) ? [key] : [];
}

export function skillsForSkillTest(skill: string): string[] {
  return SKILLS.filter((s) => s.match.skillTest === skill).map((s) => s.key);
}

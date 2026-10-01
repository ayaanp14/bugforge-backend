/**
 * The skills a skill test can certify, and the topics each is examined on.
 *
 * This is the one list both the question bank (scripts/skill-test-data —
 * every question names a topic from here, and the seeder refuses one that
 * does not exist) and the result (a sitting is broken down by these topics,
 * each with somewhere to practise it) are read against. A test row in the
 * database names a skill by id; the labels live here so a renamed topic is
 * one edit, not a re-seed.
 *
 * Practice links point at what the site already teaches: a language at its
 * study plan, a DSA topic at its catalogue hub, SQL at the core-CS aptitude
 * topic. They are what a failed sitting turns into — "drill these" — so a
 * topic with nowhere to send the candidate goes to the skill's own page.
 */

export type SkillId = "java" | "python" | "javascript" | "cpp" | "sql" | "dsa";
export type SkillLevel = "basic" | "intermediate" | "advanced";

export const SKILL_LEVELS: readonly SkillLevel[] = ["basic", "intermediate", "advanced"];

export const LEVEL_LABEL: Record<SkillLevel, string> = {
  basic: "Basic",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export interface SkillTopic {
  id: string;
  label: string;
  /** Where a candidate weak on this topic should go next. */
  practice?: { label: string; href: string };
}

export interface SkillDef {
  id: SkillId;
  label: string;
  /**
   * What the avatar seal says when the frame is too small for the label:
   * three characters at most, so it fits a 14 px disc.
   */
  short: string;
  blurb: string;
  /**
   * The judge languages its coding round accepts. Empty means any — the DSA
   * test certifies problem solving, not a language.
   */
  codingLanguages: string[];
  topics: SkillTopic[];
}

const studyPlan = (track: string, label: string) => ({ label: `${label} study plan`, href: `/study-plans/${track}` });
const hub = (slug: string, label: string) => ({ label: `${label} problems`, href: `/challenges/${slug}` });

const JAVA_PLAN = studyPlan("java", "Java");
const PYTHON_PLAN = studyPlan("python", "Python");
const JS_PLAN = studyPlan("javascript", "JavaScript");
const CPP_PLAN = studyPlan("cpp", "C++");
const CORE_CS = { label: "OS, DBMS & Networks MCQs", href: "/aptitude/os-dbms-networks" };

export const SKILLS: readonly SkillDef[] = [
  {
    id: "java",
    label: "Java",
    short: "JV",
    blurb: "The language, the object model, the collections and the JVM — read code, predict it, and write a working solution in Java.",
    codingLanguages: ["java"],
    topics: [
      { id: "syntax-types", label: "Syntax & types", practice: JAVA_PLAN },
      { id: "operators-control", label: "Operators & control flow", practice: JAVA_PLAN },
      { id: "strings", label: "Strings", practice: JAVA_PLAN },
      { id: "arrays", label: "Arrays", practice: JAVA_PLAN },
      { id: "oop", label: "Classes & objects", practice: JAVA_PLAN },
      { id: "inheritance", label: "Inheritance & polymorphism", practice: JAVA_PLAN },
      { id: "exceptions", label: "Exceptions", practice: JAVA_PLAN },
      { id: "collections", label: "Collections", practice: JAVA_PLAN },
      { id: "generics", label: "Generics", practice: JAVA_PLAN },
      { id: "functional", label: "Lambdas & streams", practice: JAVA_PLAN },
      { id: "memory", label: "Memory & the JVM", practice: JAVA_PLAN },
      { id: "concurrency", label: "Concurrency", practice: JAVA_PLAN },
      { id: "modern", label: "Modern Java", practice: JAVA_PLAN },
    ],
  },
  {
    id: "python",
    label: "Python",
    short: "PY",
    blurb: "Types, the data structures, functions and closures, classes and the standard library — read Python, predict it, and solve a problem in it.",
    codingLanguages: ["python"],
    topics: [
      { id: "types-operators", label: "Types & operators", practice: PYTHON_PLAN },
      { id: "control-flow", label: "Control flow", practice: PYTHON_PLAN },
      { id: "strings", label: "Strings", practice: PYTHON_PLAN },
      { id: "lists-tuples", label: "Lists & tuples", practice: PYTHON_PLAN },
      { id: "dicts-sets", label: "Dictionaries & sets", practice: PYTHON_PLAN },
      { id: "functions", label: "Functions & arguments", practice: PYTHON_PLAN },
      { id: "scope-closures", label: "Scope & closures", practice: PYTHON_PLAN },
      { id: "oop", label: "Classes & objects", practice: PYTHON_PLAN },
      { id: "exceptions", label: "Exceptions", practice: PYTHON_PLAN },
      { id: "comprehensions", label: "Comprehensions & generators", practice: PYTHON_PLAN },
      { id: "iterators", label: "Iterators & the data model", practice: PYTHON_PLAN },
      { id: "decorators", label: "Decorators & context managers", practice: PYTHON_PLAN },
      { id: "stdlib", label: "Standard library", practice: PYTHON_PLAN },
    ],
  },
  {
    id: "javascript",
    label: "JavaScript",
    short: "JS",
    blurb: "Coercion, scope, closures, this, prototypes and the event loop — the parts of JavaScript interviews probe, and a problem solved in it.",
    codingLanguages: ["javascript"],
    topics: [
      { id: "types-coercion", label: "Types & coercion", practice: JS_PLAN },
      { id: "scope-hoisting", label: "Scope & hoisting", practice: JS_PLAN },
      { id: "functions-closures", label: "Functions & closures", practice: JS_PLAN },
      { id: "this-binding", label: "this & binding", practice: JS_PLAN },
      { id: "objects-prototypes", label: "Objects & prototypes", practice: JS_PLAN },
      { id: "arrays", label: "Arrays", practice: JS_PLAN },
      { id: "strings-numbers", label: "Strings & numbers", practice: JS_PLAN },
      { id: "async", label: "Promises & async/await", practice: JS_PLAN },
      { id: "event-loop", label: "The event loop", practice: JS_PLAN },
      { id: "modern", label: "Modern syntax", practice: JS_PLAN },
      { id: "errors", label: "Errors", practice: JS_PLAN },
    ],
  },
  {
    id: "cpp",
    label: "C++",
    short: "C++",
    blurb: "Pointers and references, object lifetime, the STL and templates — read C++, predict it, and write a correct solution in it.",
    codingLanguages: ["cpp"],
    topics: [
      { id: "basics", label: "Types & basics", practice: CPP_PLAN },
      { id: "pointers-references", label: "Pointers & references", practice: CPP_PLAN },
      { id: "memory", label: "Memory & RAII", practice: CPP_PLAN },
      { id: "classes", label: "Classes & constructors", practice: CPP_PLAN },
      { id: "inheritance", label: "Inheritance & virtual functions", practice: CPP_PLAN },
      { id: "stl-containers", label: "STL containers", practice: CPP_PLAN },
      { id: "stl-algorithms", label: "STL algorithms & iterators", practice: CPP_PLAN },
      { id: "templates", label: "Templates", practice: CPP_PLAN },
      { id: "const-correctness", label: "const & references", practice: CPP_PLAN },
      { id: "move-semantics", label: "Move semantics", practice: CPP_PLAN },
      { id: "undefined-behaviour", label: "Undefined behaviour", practice: CPP_PLAN },
      { id: "modern", label: "Modern C++", practice: CPP_PLAN },
    ],
  },
  {
    id: "sql",
    label: "SQL",
    short: "SQL",
    blurb: "Querying, joining, grouping and windowing data, and the design underneath it — read a query and say exactly what it returns.",
    codingLanguages: [],
    topics: [
      { id: "select-filter", label: "SELECT & filtering", practice: CORE_CS },
      { id: "joins", label: "Joins", practice: CORE_CS },
      { id: "aggregation", label: "Aggregation & GROUP BY", practice: CORE_CS },
      { id: "subqueries", label: "Subqueries & CTEs", practice: CORE_CS },
      { id: "set-operations", label: "Set operations", practice: CORE_CS },
      { id: "nulls", label: "NULL handling", practice: CORE_CS },
      { id: "window-functions", label: "Window functions", practice: CORE_CS },
      { id: "ddl-constraints", label: "Tables & constraints", practice: CORE_CS },
      { id: "indexes", label: "Indexes & performance", practice: CORE_CS },
      { id: "normalization", label: "Normalization", practice: CORE_CS },
      { id: "transactions", label: "Transactions & isolation", practice: CORE_CS },
    ],
  },
  {
    id: "dsa",
    label: "Problem Solving (DSA)",
    short: "DSA",
    blurb: "Data structures, algorithms and complexity — reason about them on paper, then solve timed problems in the language of your choice.",
    codingLanguages: [],
    topics: [
      { id: "complexity", label: "Complexity analysis", practice: { label: "Data structures MCQs", href: "/aptitude/data-structures-mcq" } },
      { id: "arrays-strings", label: "Arrays & strings", practice: hub("arrays", "Array") },
      { id: "hashing", label: "Hashing", practice: hub("hash-table", "Hash table") },
      { id: "linked-lists", label: "Linked lists", practice: { label: "Data structures MCQs", href: "/aptitude/data-structures-mcq" } },
      { id: "stacks-queues", label: "Stacks & queues", practice: hub("stack", "Stack") },
      { id: "trees", label: "Trees & BSTs", practice: hub("depth-first-search", "Depth-first search") },
      { id: "heaps", label: "Heaps", practice: hub("heap", "Heap") },
      { id: "graphs", label: "Graphs", practice: hub("graph", "Graph") },
      { id: "sorting-searching", label: "Sorting & searching", practice: hub("binary-search", "Binary search") },
      { id: "recursion-dp", label: "Recursion & DP", practice: hub("dynamic-programming", "Dynamic programming") },
      { id: "greedy", label: "Greedy", practice: hub("greedy", "Greedy") },
    ],
  },
];

const BY_ID = new Map(SKILLS.map((skill) => [skill.id, skill]));

export const skillDef = (id: string): SkillDef | undefined => BY_ID.get(id as SkillId);

export const isSkillLevel = (value: unknown): value is SkillLevel =>
  typeof value === "string" && (SKILL_LEVELS as readonly string[]).includes(value);

export function skillTopic(skill: string, topic: string): SkillTopic | undefined {
  return skillDef(skill)?.topics.find((t) => t.id === topic);
}

/** "Java · Intermediate" — the credential's name everywhere it is printed. */
export function credentialName(skill: string, level: string): string {
  const def = skillDef(skill);
  const levelLabel = isSkillLevel(level) ? LEVEL_LABEL[level] : level;
  return `${def?.label ?? skill} · ${levelLabel}`;
}

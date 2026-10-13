/**
 * The features a product-spotlight day may be about, and what the posts may
 * claim about each.
 *
 * Worded after the SPA's own list (frontend src/content/site-facts.ts
 * CAPABILITIES — another repository, so it cannot be imported) but without
 * its counts: a count written here would go stale, so the live ones come
 * from the database at build time (services/social-knowledge.ts
 * `siteCounts`) and the model is told to use only those. Change a feature's
 * words in both places.
 */

export interface Feature {
  key: string;
  name: string;
  /** The page a post links to. */
  path: string;
  summary: string;
}

export const FEATURES: readonly Feature[] = [
  { key: "challenges", name: "Coding challenges", path: "/challenges", summary: "DSA problems with hidden tests, hints and editorials, solvable in 13 languages in a workbench with custom test cases and a timer that pauses when you leave." },
  { key: "roadmap", name: "DSA roadmap", path: "/roadmap", summary: "A guided path of stages in four tiers over curated problems, each stage with tutorials in four languages; a stage opens when the one before it is cleared." },
  { key: "contests", name: "Daily contest", path: "/contests", summary: "One problem a day for everyone, ranked by time to Accepted plus penalties, with monthly and all-time standings and a contest streak." },
  { key: "study-plans", name: "Study plans", path: "/study-plans", summary: "A programming language taught in full — modules of lessons, whole-program exercises judged on a real runtime, quizzes, checkpoints, a chosen pace and a certificate." },
  { key: "bug-hunts", name: "Bug hunts", path: "/bug-hunts", summary: "Debugging challenges on real JavaScript, Python and Java projects: a bug report, the code as shipped, and hidden tests that decide whether the fix is complete." },
  { key: "mock-interviews", name: "Mock interviews", path: "/mock-interview", summary: "AI-led, timed interviews built from the role, round, depth and focus you choose — written or spoken — with a report on what you were shaky on." },
  { key: "aptitude", name: "Aptitude practice", path: "/aptitude", summary: "Quantitative, logical, verbal, data-interpretation and programming questions with time targets, hints, worked solutions and per-topic progress." },
  { key: "tests", name: "Placement mock tests", path: "/tests", summary: "Full-length timed mocks modelled on company hiring patterns such as TCS NQT, Infosys, Wipro, Accenture and Amazon, with sectional timing and a fresh paper every sitting." },
  { key: "skill-tests", name: "Skill tests and certification", path: "/skill-tests", summary: "Timed certification tests in languages, problem solving, SQL and CS fundamentals at Basic and Intermediate level that issue a verifiable credential and a certificate on a pass." },
  { key: "resume", name: "Resume ATS analyzer", path: "/resume", summary: "Scores a resume out of 100 against a job description with the reason behind every point, flags layout risks that break parsers and rewrites bullets without inventing facts." },
  { key: "sql", name: "SQL problems", path: "/sql", summary: "Interview-style database problems written in MySQL, judged against hidden datasets, with hints and editorials." },
  { key: "notes", name: "CS notes", path: "/notes", summary: "Reading for the fundamentals round — operating systems, computer networks, DBMS and OOP — with figures, code and interview questions." },
  { key: "duels", name: "Coding duels", path: "/duels", summary: "1v1 and 2v2 duels on a problem or a bug hunt, matched by rating or played with friends; the first accepted submission wins." },
  { key: "pair-rooms", name: "Pair rooms", path: "/pair-mode", summary: "Live sessions of up to four people in one editor with shared runs and verdicts, chat and audio." },
  { key: "simulations", name: "Company simulations", path: "/simulations", summary: "A company's online assessment and its interview rounds, in the published order, rehearsed as one run." },
];

/**
 * The DSA roadmap's authored content: four tiers, nineteen stages, each a
 * handful of catalogue problems, walked in order.
 *
 *   npx tsx scripts/seed-roadmap.ts --validate   # every slug exists and is published
 *   npx tsx scripts/seed-roadmap.ts --seed       # upsert tiers + stages, replace each stage's problems
 *   node scripts/run-prod.mjs scripts/seed-roadmap.ts --seed   # the same against production
 *
 * This file is the source the tables are seeded from — the same pattern as
 * the problem catalogue (scripts/catalog), the bug hunts and the mock
 * tests: authored and reviewed here, served from RoadmapTier /
 * RoadmapStage / RoadmapStageProblem at run time (services/roadmap.ts reads
 * only the tables). Progress is never stored: a stage is "cleared" when the
 * account has an ACCEPTED submission on at least `required` of its
 * problems, so a solve made anywhere in the product counts on the road.
 *
 * Locking: a stage opens only once the one before it (by position) is
 * cleared. The roadmap UI enforces it — a locked stage shows nothing of its
 * problems — while the problems themselves stay reachable from the
 * catalogue: the lock guides, it does not gate the product.
 *
 * Curated against the catalogue as of 2026-09 (598 problems; no linked-list
 * or tree problems exist because the judge's signatures are arrays, strings
 * and ints, so those classic topics are not stages).
 */

export type RoadmapTier = "foundations" | "core" | "advanced" | "mastery";

export interface RoadmapStageSeed {
  /** Stable key: notification types and the client's node keys use it. Never rename. */
  key: string;
  title: string;
  /** One sentence on what the stage teaches. */
  blurb: string;
  tier: RoadmapTier;
  /** A glyph key the client maps to an icon. */
  icon: string;
  /** Problem slugs, easiest first; the last one or two are the stretch. */
  problems: string[];
  /** How many of `problems` must be ACCEPTED to clear the stage. */
  required: number;
}

/**
 * The tiers, in the order the road is drawn.
 *
 * What the chest at the tier's end holds, once, when every stage of the
 * tier is cleared (services/roadmap.ts): `rewardXp` is paid to the
 * account's XP and its rating alike — rising with the tier so the last
 * chest is worth the walk, and small next to what the solves themselves pay
 * (10–30 each), since the road is the guide, not the prize; `interviewCredits`
 * are bonus mock-interview sessions, spent only after the plan's weekly
 * allowance is used up, which on the free plan (two a week) is the one thing
 * here worth money. Opening a chest also lifts the fog one tier further down
 * the road — that part is the map's rule, not content.
 */
export const ROADMAP_TIERS: Array<{ key: RoadmapTier; title: string; blurb: string; rewardXp: number; interviewCredits: number }> = [
  { key: "foundations", title: "Foundations", blurb: "Arrays, hashing, strings and the two-pointer family. Everything after this assumes them.", rewardXp: 30, interviewCredits: 1 },
  { key: "core", title: "Core techniques", blurb: "The data structures and search patterns most interview rounds are built on.", rewardXp: 50, interviewCredits: 1 },
  { key: "advanced", title: "Advanced", blurb: "Bits, recursion and graphs — where the harder rounds start.", rewardXp: 80, interviewCredits: 2 },
  { key: "mastery", title: "Mastery", blurb: "Dynamic programming and the capstone: the problems that decide the final round.", rewardXp: 100, interviewCredits: 3 },
];

/** The stages, in road order. */
export const ROADMAP: RoadmapStageSeed[] = [
  /* ── Foundations ─────────────────────────────────────────────── */
  {
    key: "arrays",
    title: "Arrays 101",
    blurb: "Indexing, running totals, single passes — the habits every later stage relies on.",
    tier: "foundations",
    icon: "layers",
    problems: [
      "running-sum-of-1d-array",
      "concatenation-of-array",
      "build-array-from-permutation",
      "richest-customer-wealth",
      "contains-duplicate",
      "best-time-to-buy-and-sell-stock",
      "maximum-subarray",
      "product-of-array-except-self",
    ],
    required: 6,
  },
  {
    key: "hashing",
    title: "Hashing",
    blurb: "Trade memory for time: counting, lookups and the one-pass two-sum.",
    tier: "foundations",
    icon: "hash",
    problems: [
      "two-sum",
      "jewels-and-stones",
      "first-unique-character-in-a-string",
      "majority-element",
      "isomorphic-strings",
      "find-all-numbers-disappeared",
      "longest-consecutive-sequence",
      "top-k-frequent-elements",
    ],
    required: 6,
  },
  {
    key: "strings",
    title: "Strings",
    blurb: "Scanning, building and comparing text without allocating your way out of it.",
    tier: "foundations",
    icon: "text",
    problems: [
      "reverse-string",
      "valid-palindrome",
      "longest-common-prefix",
      "length-of-last-word",
      "is-subsequence",
      "merge-strings-alternately",
      "string-compression",
      "longest-palindromic-substring",
    ],
    required: 6,
  },
  {
    key: "two-pointers",
    title: "Two Pointers",
    blurb: "Two indices, one pass: the technique behind most sorted-array problems.",
    tier: "foundations",
    icon: "pointers",
    problems: [
      "move-zeroes",
      "squares-of-a-sorted-array",
      "remove-duplicates-from-sorted-array",
      "merge-sorted-array",
      "two-sum-ii-input-array-is-sorted",
      "3sum",
      "container-with-most-water",
      "trapping-rain-water",
    ],
    required: 6,
  },
  {
    key: "sliding-window",
    title: "Sliding Window",
    blurb: "Grow and shrink a window over the input instead of restarting the scan.",
    tier: "foundations",
    icon: "window",
    problems: [
      "minimum-difference-between-highest-and-lowest-of-k-scores",
      "contains-duplicate-ii",
      "longest-substring-without-repeating-characters",
      "max-consecutive-ones-iii",
      "minimum-size-subarray-sum",
      "permutation-in-string",
      "longest-repeating-character-replacement",
      "minimum-window-substring",
    ],
    required: 6,
  },
  {
    key: "prefix-sums",
    title: "Prefix Sums",
    blurb: "Precompute once, answer range questions in constant time.",
    tier: "foundations",
    icon: "sigma",
    problems: [
      "find-pivot-index",
      "find-the-highest-altitude",
      "left-and-right-sum-differences",
      "sum-of-all-odd-length-subarrays",
      "subarray-sum-equals-k",
      "contiguous-array",
      "continuous-subarray-sum",
      "car-pooling",
    ],
    required: 6,
  },

  /* ── Core ─────────────────────────────────────────────────────── */
  {
    key: "stacks",
    title: "Stacks",
    blurb: "Last in, first out — matching, evaluating and the monotonic stack.",
    tier: "core",
    icon: "stack",
    problems: [
      "valid-parentheses",
      "baseball-game",
      "remove-all-adjacent-duplicates",
      "next-greater-element-i",
      "evaluate-reverse-polish-notation",
      "daily-temperatures",
      "decode-string",
      "largest-rectangle-in-histogram",
    ],
    required: 6,
  },
  {
    key: "binary-search",
    title: "Binary Search",
    blurb: "Halve the space every step — on arrays, on answers, on rotated inputs.",
    tier: "core",
    icon: "search",
    problems: [
      "binary-search",
      "search-insert-position",
      "sqrt-x",
      "find-first-and-last-position",
      "search-in-rotated-sorted-array",
      "find-minimum-in-rotated-sorted-array",
      "koko-eating-bananas",
      "capacity-to-ship-packages",
    ],
    required: 6,
  },
  {
    key: "greedy",
    title: "Sorting & Greedy",
    blurb: "Order the input, then take the locally best step and prove it holds.",
    tier: "core",
    icon: "sort",
    problems: [
      "assign-cookies",
      "lemonade-change",
      "largest-perimeter-triangle",
      "sort-colors",
      "jump-game",
      "gas-station",
      "partition-labels",
      "task-scheduler",
    ],
    required: 6,
  },
  {
    key: "intervals",
    title: "Intervals",
    blurb: "Sort by start, sweep, merge — the pattern behind every scheduling question.",
    tier: "core",
    icon: "intervals",
    problems: [
      "meeting-rooms",
      "merge-intervals",
      "insert-interval",
      "non-overlapping-intervals",
      "minimum-number-of-arrows",
      "interval-list-intersections",
      "meeting-rooms-ii",
      "minimum-number-of-platforms",
    ],
    required: 6,
  },
  {
    key: "heaps",
    title: "Heaps",
    blurb: "Keep the k best in reach: priority queues for top-k, scheduling and streams.",
    tier: "core",
    icon: "heap",
    problems: [
      "last-stone-weight",
      "relative-ranks",
      "kth-largest-element-in-an-array",
      "k-closest-points-to-origin",
      "sort-characters-by-frequency",
      "ugly-number-ii",
      "furthest-building-you-can-reach",
      "sliding-window-maximum",
    ],
    required: 6,
  },
  {
    key: "matrix",
    title: "Matrix & Grids",
    blurb: "Two-dimensional indexing, in-place transforms and the first grid walks.",
    tier: "core",
    icon: "grid",
    problems: [
      "transpose-matrix",
      "matrix-diagonal-sum",
      "flood-fill",
      "spiral-matrix",
      "rotate-image",
      "set-matrix-zeroes",
      "search-a-2d-matrix",
      "game-of-life",
    ],
    required: 6,
  },

  /* ── Advanced ─────────────────────────────────────────────────── */
  {
    key: "bits",
    title: "Bit Manipulation",
    blurb: "Masks, shifts and XOR tricks — small problems with elegant answers.",
    tier: "advanced",
    icon: "bits",
    problems: [
      "number-of-1-bits",
      "single-number",
      "missing-number",
      "counting-bits",
      "power-of-two",
      "hamming-distance",
      "sum-of-two-integers",
      "single-number-ii",
    ],
    required: 6,
  },
  {
    key: "backtracking",
    title: "Recursion & Backtracking",
    blurb: "Build the answer one choice at a time and undo the ones that fail.",
    tier: "advanced",
    icon: "branch",
    problems: [
      "subsets",
      "permutations",
      "combinations",
      "combination-sum",
      "generate-parentheses",
      "letter-combinations-of-a-phone-number",
      "word-search",
      "target-sum",
    ],
    required: 6,
  },
  {
    key: "graphs",
    title: "Graphs: BFS & DFS",
    blurb: "Islands, rooms and reachability — the two traversals every graph question starts from.",
    tier: "advanced",
    icon: "graph",
    problems: [
      "find-if-path-exists-in-graph",
      "number-of-islands",
      "max-area-of-island",
      "rotting-oranges",
      "keys-and-rooms",
      "number-of-provinces",
      "pacific-atlantic-water-flow",
      "surrounded-regions",
    ],
    required: 6,
  },
  {
    key: "graphs-advanced",
    title: "Graphs: Advanced",
    blurb: "Topological order, union-find, shortest paths and spanning trees.",
    tier: "advanced",
    icon: "network",
    problems: [
      "course-schedule",
      "course-schedule-ii",
      "redundant-connection",
      "number-of-connected-components-in-an-undirected-graph",
      "network-delay-time",
      "min-cost-to-connect-all-points",
      "cheapest-flights-within-k-stops",
      "word-ladder",
    ],
    required: 6,
  },

  /* ── Mastery ──────────────────────────────────────────────────── */
  {
    key: "dp-1d",
    title: "Dynamic Programming I",
    blurb: "One-dimensional state: stairs, robbers, coins and the longest increasing run.",
    tier: "mastery",
    icon: "dp",
    problems: [
      "climbing-stairs",
      "min-cost-climbing-stairs",
      "fibonacci-number",
      "house-robber",
      "house-robber-ii",
      "coin-change",
      "longest-increasing-subsequence",
      "decode-ways",
    ],
    required: 6,
  },
  {
    key: "dp-2d",
    title: "Dynamic Programming II",
    blurb: "Grids and two strings: paths, edit distance, subsequences and palindromes.",
    tier: "mastery",
    icon: "dp2",
    problems: [
      "unique-paths-ii",
      "minimum-path-sum",
      "longest-common-subsequence",
      "edit-distance",
      "maximal-square",
      "partition-equal-subset-sum",
      "palindromic-substrings",
      "regular-expression-matching",
    ],
    required: 6,
  },
  {
    key: "capstone",
    title: "Capstone",
    blurb: "Hard problems only. Clear four of these and the road is yours.",
    tier: "mastery",
    icon: "trophy",
    problems: [
      "best-time-to-buy-and-sell-stock-iii",
      "longest-valid-parentheses",
      "first-missing-positive",
      "swim-in-rising-water",
      "distinct-subsequences",
      "palindrome-partitioning-ii",
      "stone-game-iii",
      "number-of-visible-people-in-a-queue",
    ],
    required: 4,
  },
];

/** Every slug the roadmap references, once. */
export const ROADMAP_SLUGS: string[] = [...new Set(ROADMAP.flatMap((s) => s.problems))];

/**
 * Author-time sanity, before anything touches the database: unique keys, a
 * `required` the stage can meet, every tier known, no slug in two stages.
 * Returns the problems, or throws with the first thing wrong.
 */
export function validateRoadmap(): string[] {
  const tiers = new Set(ROADMAP_TIERS.map((t) => t.key));
  for (const tier of ROADMAP_TIERS) {
    if (!Number.isInteger(tier.rewardXp) || tier.rewardXp <= 0) {
      throw new Error(`roadmap: tier "${tier.key}" pays ${tier.rewardXp} XP — a chest must be worth something`);
    }
    if (!Number.isInteger(tier.interviewCredits) || tier.interviewCredits < 0) {
      throw new Error(`roadmap: tier "${tier.key}" grants ${tier.interviewCredits} interview credits`);
    }
  }
  const keys = new Set<string>();
  const seen = new Map<string, string>();
  for (const stage of ROADMAP) {
    if (keys.has(stage.key)) throw new Error(`roadmap: duplicate stage key "${stage.key}"`);
    keys.add(stage.key);
    if (!tiers.has(stage.tier)) throw new Error(`roadmap: stage "${stage.key}" names unknown tier "${stage.tier}"`);
    if (stage.required < 1 || stage.required > stage.problems.length) {
      throw new Error(`roadmap: stage "${stage.key}" requires ${stage.required} of ${stage.problems.length}`);
    }
    for (const slug of stage.problems) {
      const other = seen.get(slug);
      if (other) throw new Error(`roadmap: "${slug}" is in both "${other}" and "${stage.key}"`);
      seen.set(slug, stage.key);
    }
  }
  return ROADMAP_SLUGS;
}

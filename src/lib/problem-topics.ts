import { isCompanyTag } from "./companies.js";
import { slugify } from "./slug.js";

/**
 * The catalogue's hub pages: one per topic tag and one per hiring company,
 * at /challenges/<topic> and /challenges/company/<company>.
 *
 * A problem carries several tags ("Array", "Hash Table", "Amazon"), so no
 * single one can be its parent in the URL — /problems/<slug> stays flat —
 * but each tag is a list worth its own page: the crawl path from the
 * catalogue index to every problem, and the page a search for "sliding
 * window problems" or "two pointers practice" should land on. A hub exists
 * only for a tag with enough problems to be a list (MIN_HUB_PROBLEMS); the
 * rest stay filter chips on the catalogue page.
 *
 * The topic copy describes the technique, not the site; it is what a
 * reader who has never heard the term needs before the list. The company
 * copy says exactly what the tag is — the catalogue's note that a problem
 * is commonly asked in that company's rounds — and nothing more.
 */

/** Fewer problems than this and a tag has no page of its own. */
export const MIN_HUB_PROBLEMS = 5;

export interface TopicHub {
  /** The tag as stored on the problem ("Hash Table"). */
  tag: string;
  /** The URL segment ("hash-table"). */
  slug: string;
  /** The page's name ("Hash Table"). */
  label: string;
  blurb: string;
}

/**
 * Every topic tag the catalogue uses that qualifies for a hub, with its
 * introduction. A tag missing here still filters on the catalogue page and
 * still appears on a problem; it just has no hub until an entry is added
 * (the API tells you: GET /api/problems/hubs lists the qualifying tags
 * that have no copy yet).
 */
export const TOPIC_HUBS: TopicHub[] = [
  {
    tag: "Array",
    slug: "arrays",
    label: "Arrays",
    blurb:
      "The array is the first data structure every other one is built on: a block of values addressed by index in constant time. Array problems practise the moves that recur everywhere else — scanning once, keeping a running best, working from both ends, sorting first to make a hard question easy, and reasoning about indices without going off either end. Most of the catalogue touches an array somewhere; the problems here are the ones where the array itself is the point.",
  },
  {
    tag: "String",
    slug: "strings",
    label: "Strings",
    blurb:
      "A string is an array of characters with its own habits: counting letters, comparing prefixes, reversing, checking palindromes, building an answer character by character. String problems reward knowing the cheap operations (index, compare, count in a fixed alphabet) from the expensive ones (repeated concatenation, substring scans) and choosing the representation — a character count, a two-pointer walk, a stack — that fits the question.",
  },
  {
    tag: "Math",
    slug: "math",
    label: "Math",
    blurb:
      "Problems whose solution is a fact about numbers rather than a data structure: digit sums, divisibility, parity, arithmetic sequences, geometry on a grid, and the integer overflow and truncating division that trip a correct idea. The habit these build is to look for a closed form or an invariant before reaching for a loop.",
  },
  {
    tag: "Hash Table",
    slug: "hash-table",
    label: "Hash Table",
    blurb:
      "A hash map turns \"have I seen this before?\" into a constant-time question. The problems here are the classic exchanges of memory for time: counting occurrences, pairing complements (Two Sum), grouping anagrams, detecting duplicates, remembering the index of a value so a second pass can look back. Knowing when a map is the right tool — and when a fixed-size array or a set does the same job for less — is what they practise.",
  },
  {
    tag: "Dynamic Programming",
    slug: "dynamic-programming",
    label: "Dynamic Programming",
    blurb:
      "Dynamic programming solves a problem by solving its smaller versions once each and remembering the answers. The problems here run from the one-dimensional cases (climbing stairs, house robber, the best subarray) to two-dimensional tables over strings and grids, and the skill is the same each time: name the state, write the recurrence, decide the order that makes every dependency ready before it is needed, then shrink the table to what the recurrence actually reads.",
  },
  {
    tag: "Sorting",
    slug: "sorting",
    label: "Sorting",
    blurb:
      "Sorting is often the first step that makes a problem tractable — once the input is in order, duplicates sit together, the closest pair sits adjacent, intervals can be merged in one pass, and a two-pointer walk replaces a nested loop. These problems practise choosing a sort key, sorting by several keys, using a custom comparator, and knowing when a counting sort or a partial sort beats the general O(n log n).",
  },
  {
    tag: "Greedy",
    slug: "greedy",
    label: "Greedy",
    blurb:
      "A greedy algorithm makes the locally best choice at each step and never revisits it. It is fast and simple when it is right — scheduling by earliest finish, jumping as far as possible, taking the largest coin — and quietly wrong when it is not. The problems here practise both halves: spotting the exchange argument that proves the greedy choice safe, and recognising the cases where only dynamic programming or search will do.",
  },
  {
    tag: "Two Pointers",
    slug: "two-pointers",
    label: "Two Pointers",
    blurb:
      "Two indices walking through an array — from both ends towards the middle, or one fast and one slow in the same direction — turn many quadratic scans into linear ones. Pair sums in a sorted array, removing duplicates in place, partitioning by a rule, comparing a string with its reverse, and the tortoise-and-hare cycle check are all the same move; these problems make it a reflex.",
  },
  {
    tag: "Matrix",
    slug: "matrix",
    label: "Matrix",
    blurb:
      "A two-dimensional grid: walk it in spiral order, rotate it in place, search a sorted one, count islands, mark rows and columns. Matrix problems are index bookkeeping with a purpose — keeping (row, column) straight, staying inside the bounds, and choosing between visiting every cell and exploiting the grid's structure.",
  },
  {
    tag: "Stack",
    slug: "stack",
    label: "Stack",
    blurb:
      "A stack remembers things in the order they can be undone: the last item pushed is the first one back. Matching brackets, evaluating expressions, simplifying a path, finding the next greater element and undoing a sequence of operations all fall out of one push-and-pop loop. The problems here practise seeing the stack in a question that never mentions one.",
  },
  {
    tag: "Simulation",
    slug: "simulation",
    label: "Simulation",
    blurb:
      "Some problems are solved by doing exactly what the statement says, carefully: move the robot, apply the operations in order, deal the cards, run the game. The difficulty is not the idea but the state — keeping every variable right through every step — and the discipline of writing the loop so that each rule is applied once and in the right order.",
  },
  {
    tag: "Bit Manipulation",
    slug: "bit-manipulation",
    label: "Bit Manipulation",
    blurb:
      "Integers are strings of bits, and AND, OR, XOR and shifts read and write them directly. Counting set bits, finding the one number that appears once (XOR cancels pairs), testing a power of two, building subsets from a bitmask and reversing bits are the standard moves; the problems here practise them and the operator precedence and sign rules that make them go wrong.",
  },
  {
    tag: "Breadth-First Search",
    slug: "breadth-first-search",
    label: "Breadth-First Search",
    blurb:
      "Breadth-first search explores a graph or grid one layer at a time from a start, so the first time it reaches a node is along a shortest path in edges. Shortest paths in an unweighted maze, level-order traversal, the minimum number of moves, and \"rotting oranges\"-style spreading processes are all BFS with a queue and a visited set; these problems practise setting that up cleanly.",
  },
  {
    tag: "Binary Search",
    slug: "binary-search",
    label: "Binary Search",
    blurb:
      "Binary search halves a sorted range every step, finding a value — or the boundary where a condition flips — in logarithmic time. Beyond searching a sorted array it answers \"what is the smallest x for which this is possible?\" over any monotone predicate. The problems here practise the search over indices, the search over answers, and the off-by-one care the boundaries demand.",
  },
  {
    tag: "Depth-First Search",
    slug: "depth-first-search",
    label: "Depth-First Search",
    blurb:
      "Depth-first search follows one path as far as it goes before backing up: recursion over a tree, flood fill over a grid, connected components over a graph, and the explicit stack that replaces recursion when depth is a concern. The problems here practise the visited bookkeeping, the base cases, and the choice between returning a value up the recursion and accumulating one in place.",
  },
  {
    tag: "Graph",
    slug: "graph",
    label: "Graph",
    blurb:
      "Nodes and edges: build the adjacency list, then traverse it. These problems cover the representation choices (list, matrix, edge list), reachability and components, cycle detection in directed and undirected graphs, and the traversals that everything else is built on. Shortest paths and topological order have their own pages.",
  },
  {
    tag: "Counting",
    slug: "counting",
    label: "Counting",
    blurb:
      "Problems answered by tallying: how many of each value, how many pairs satisfy a rule, how many ways to reach a total. A frequency array or map is usually the whole solution; the skill is choosing what to count and noticing when the count can be updated incrementally instead of recomputed.",
  },
  {
    tag: "Heap",
    slug: "heap",
    label: "Heap",
    blurb:
      "A heap (priority queue) hands back the smallest — or largest — element in logarithmic time while new ones keep arriving. The k largest elements, merging sorted streams, scheduling by earliest deadline and running medians are its home ground; these problems practise choosing the heap's key, keeping it bounded at k, and pairing two heaps when the question needs both ends.",
  },
  {
    tag: "Prefix Sum",
    slug: "prefix-sum",
    label: "Prefix Sum",
    blurb:
      "A prefix-sum array stores the running total, so the sum of any range is one subtraction. Range-sum queries, subarrays with a target sum (with a hash map of prefixes seen), balanced pivots and two-dimensional grid sums all rest on it; the problems here practise building the prefix once and reading it many times.",
  },
  {
    tag: "Sliding Window",
    slug: "sliding-window",
    label: "Sliding Window",
    blurb:
      "A window over a contiguous range that grows from the right and shrinks from the left keeps a running answer in linear time: the longest substring without repeats, the smallest subarray reaching a sum, the maximum of every window of size k. The problems here practise the invariant that decides when the window must shrink and the counters that make the check constant time.",
  },
  {
    tag: "Union Find",
    slug: "union-find",
    label: "Union Find",
    blurb:
      "A disjoint-set structure answers \"are these two in the same group?\" and merges groups in near-constant time. Counting components as edges arrive, detecting the edge that closes a cycle, and grouping accounts or islands by shared links are its uses; the problems here practise the find-with-path-compression and union-by-size that keep it fast.",
  },
  {
    tag: "Monotonic Stack",
    slug: "monotonic-stack",
    label: "Monotonic Stack",
    blurb:
      "A stack kept in sorted order — popping every element the new one beats — finds the next greater or next smaller element for every position in one pass. Daily temperatures, the largest rectangle in a histogram and trapping rain water are the classic cases; these problems practise deciding what the stack holds and what each pop means.",
  },
  {
    tag: "Backtracking",
    slug: "backtracking",
    label: "Backtracking",
    blurb:
      "Backtracking builds a solution one choice at a time and undoes the last choice the moment it cannot lead anywhere. Permutations, subsets, combinations that sum to a target, N-Queens and word search are its standard problems; the skill is in the ordering of choices and the pruning that keeps the search from visiting what a rule already forbids.",
  },
  {
    tag: "Intervals",
    slug: "intervals",
    label: "Intervals",
    blurb:
      "Ranges on a line: merge the ones that overlap, insert a new one, count how many rooms a set of meetings needs, find the gaps. Sort by start and sweep is the recurring idea; the problems here practise the boundary cases — touching ends, containment, an interval that swallows several.",
  },
  {
    tag: "Number Theory",
    slug: "number-theory",
    label: "Number Theory",
    blurb:
      "Primes, divisors, greatest common divisors and modular arithmetic. Sieving primes, reducing fractions, computing powers modulo a number and reasoning about remainders are the moves; these problems practise them along with the integer limits that make a naive product overflow.",
  },
  {
    tag: "Counting Sort",
    slug: "counting-sort",
    label: "Counting Sort",
    blurb:
      "When the values live in a small known range, counting how many of each and writing them back out sorts in linear time. The problems here are the ones where that range is given — digits, letters, bounded scores — and a comparison sort would be doing more work than the input deserves.",
  },
  {
    tag: "Divide and Conquer",
    slug: "divide-and-conquer",
    label: "Divide and Conquer",
    blurb:
      "Split the input, solve each half, combine the answers: merge sort, counting inversions, the closest pair, building a balanced tree from a sorted array. The problems here practise writing the recursion so the combine step is cheap and the recursion depth stays logarithmic.",
  },
  {
    tag: "Game Theory",
    slug: "game-theory",
    label: "Game Theory",
    blurb:
      "Two players alternate moves and both play perfectly: who wins? The answer is usually a pattern in the small cases (a position is losing when every move leads to a winning one) or a parity argument. These problems practise finding that pattern by hand before writing code, and recognising when a dynamic-programming table over positions is needed instead.",
  },
  {
    tag: "Queue",
    slug: "queue",
    label: "Queue",
    blurb:
      "First in, first out: the structure behind breadth-first search, task scheduling, sliding-window maximums (as a deque) and any process where things are served in arrival order. The problems here practise the queue's own operations and the circular buffer that implements it in fixed space.",
  },
  {
    tag: "Recursion",
    slug: "recursion",
    label: "Recursion",
    blurb:
      "A function that calls itself on a smaller input. The problems here isolate the two things that make recursion work — a base case that stops it and a step that gets closer to it — on inputs where the recursive statement is the clearest solution, and show where an explicit stack or a loop should replace it.",
  },
  {
    tag: "Topological Sort",
    slug: "topological-sort",
    label: "Topological Sort",
    blurb:
      "An ordering of a directed acyclic graph in which every edge points forward: course prerequisites, build dependencies, task ordering. Kahn's algorithm (repeatedly take a node with no remaining incoming edges) and the DFS post-order both produce one and both detect a cycle when they cannot; these problems practise both.",
  },
  {
    tag: "Enumeration",
    slug: "enumeration",
    label: "Enumeration",
    blurb:
      "Sometimes the right answer is to try every candidate — every pair, every substring, every subset — because the bounds are small enough and a cleverer idea would cost more than it saves. The problems here practise generating the candidates without repetition and stopping the enumeration as soon as the bounds allow.",
  },
];

export interface CompanyHub {
  tag: string;
  slug: string;
  label: string;
}

/** Companies with enough tagged problems for a list of their own. */
export const MIN_COMPANY_PROBLEMS = 10;

const TOPIC_BY_TAG = new Map(TOPIC_HUBS.map((t) => [t.tag, t]));
const TOPIC_BY_SLUG = new Map(TOPIC_HUBS.map((t) => [t.slug, t]));

export const topicHubByTag = (tag: string): TopicHub | undefined => TOPIC_BY_TAG.get(tag);
export const topicHubBySlug = (slug: string): TopicHub | undefined => TOPIC_BY_SLUG.get(slug);

/** A company's hub, from its tag: the slug is derived, the label is the tag. */
export function companyHub(tag: string): CompanyHub | undefined {
  if (!isCompanyTag(tag)) return undefined;
  return { tag, slug: slugify(tag), label: tag };
}

/**
 * What a company hub says about itself. One sentence of fact — the tag is
 * the catalogue's — and one of what the list is for.
 */
export function companyBlurb(label: string, count: number): string {
  return `${count} problems the CodeKairo catalogue tags as commonly asked in ${label}'s coding rounds, from easy warm-ups to the harder questions, each judged by hidden tests in 13 languages. The tag is the catalogue's own annotation of where a problem tends to come up — not a list published by ${label}, which CodeKairo is not affiliated with.`;
}

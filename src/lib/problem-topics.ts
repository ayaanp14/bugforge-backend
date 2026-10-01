import { COMPANY_RENAMED, isCompanyTag } from "./companies.js";
import { slugify } from "./slug.js";

/**
 * The catalogue's hub pages: one per topic tag and one per hiring company,
 * at /challenges/<topic> and /challenges/company/<company>.
 *
 * A problem carries several tags ("Array", "Hash Table", "Amazon"), so no
 * single one can be its parent in the URL — /problems/<slug> stays flat —
 * but each tag is a list worth its own page: the crawl path from the
 * catalogue index to every problem, and the page a search for "sliding
 * window problems" or "two pointers practice" should land on.
 *
 * Every topic tag and every company tag has a page (since 2026-10-01). A
 * hub once needed five problems (ten for a company) and a topic its copy
 * here, so 23 topics — Trie, Segment Tree, KMP — and 46 companies were
 * chips with nowhere to go. A topic page is never thin whatever its count:
 * the blurb, the essentials sheet (topic-essentials.ts) and the step-by-
 * step walkthrough (walkthroughs/) are the page; the list is one section of
 * it. A company page is only its list and what can be counted from it, so
 * one below MIN_INDEXED_COMPANY_PROBLEMS is served but kept out of the
 * index and the sitemap — a page naming one problem is what search engines
 * call thin, and a few hundred of those weigh on the whole site.
 *
 * The topic copy describes the technique, not the site; it is what a
 * reader who has never heard the term needs before the list. The company
 * copy says exactly what the tag is — the catalogue's note that a problem
 * is commonly asked in that company's rounds — and nothing more.
 */

/** A topic with copy here gets a page from its first problem. */
export const MIN_HUB_PROBLEMS = 1;

export interface TopicHub {
  /** The tag as stored on the problem ("Hash Table"). */
  tag: string;
  /**
   * Other tags the catalogue uses for the same thing ("Heap (Priority
   * Queue)" beside "Heap"): their problems are listed here too, and the tag
   * has no page of its own.
   */
  aliases?: readonly string[];
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
    // Two catalog waves named it two ways: 31 and 30 problems, two chips, one idea.
    aliases: ["Heap (Priority Queue)"],
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
  {
    tag: "Combinatorics",
    slug: "combinatorics",
    label: "Combinatorics",
    blurb:
      "Combinatorics counts arrangements without listing them: paths through a grid, orderings of letters with repeats, ways to split a number or to schedule a set of tasks. The tools are few — the product rule, binomial coefficients, factorials divided by the repeats they overcount, and recurrences that build the count for n from smaller counts. The problems here practise turning a story into one of those forms, and computing a result that runs to hundreds of digits modulo a large prime.",
  },
  {
    tag: "Brainteaser",
    slug: "brainteaser",
    label: "Brainteaser",
    blurb:
      "A brainteaser looks as if it needs a simulation or a search and turns out to need one observation: a bulb toggled once per divisor stays lit only at a perfect square; the XOR over every pairing keeps a list's XOR only when the other list has odd length; a game is decided by n modulo 4. The code is often a line or two. The problems here practise finding that observation — working small cases by hand, asking what an operation cannot change — and checking it before trusting it.",
  },
  {
    tag: "Geometry",
    slug: "geometry",
    label: "Geometry",
    blurb:
      "Geometry problems put points, lines and shapes on a plane, usually with integer coordinates: are these points on one line, which are closest to the origin, how many lie on the best line, what is the smallest rectangle their corners make. The ideas are short — slopes, cross products, squared distances, the diagonal moves of a king — and the difficulty is exactness. The problems here practise keeping every comparison in integers, so that no rounding decides what the coordinates settle exactly.",
  },
  {
    tag: "Rolling Hash",
    slug: "rolling-hash",
    label: "Rolling Hash",
    blurb:
      "A rolling hash gives every window of a string or array a number that is updated in constant time as the window slides by one: take out the outgoing element's share, shift, add the incoming one. Equal windows always get equal numbers, so comparing two substrings becomes comparing two integers. The problems here practise Rabin–Karp pattern search, finding the longest repeated or common piece, matching prefixes against suffixes, and the habit of confirming a match before trusting the hash.",
  },
  {
    tag: "Quickselect",
    slug: "quickselect",
    label: "Quickselect",
    blurb:
      "Quickselect finds the k-th smallest value without sorting everything. It partitions the array around a pivot, as quicksort does, then continues into only the side that holds position k, so the work shrinks geometrically — n, about n/2, about n/4 — for linear time on average. The problems here practise the partition step, choosing the pivot at random so that no input forces the quadratic worst case, and turning \"k-th largest\" or \"k closest\" into the right position.",
  },
  {
    tag: "String Matching",
    slug: "string-matching",
    label: "String Matching",
    blurb:
      "String matching asks where a pattern occurs inside a text. Trying every start position letter by letter costs the text's length times the pattern's; the classic algorithms — Knuth–Morris–Pratt, the Z-function, Rabin–Karp — bring that down to linear time by never comparing the same text character twice, or by comparing hashes instead of letters. The problems here practise those searches and the reductions that turn other questions into one: a rotation of a string is a substring of the string written twice.",
  },
  {
    tag: "Bucket Sort",
    slug: "bucket-sort",
    label: "Bucket Sort",
    blurb:
      "Bucket sort drops each value into a bucket chosen by its key, then reads the buckets back in key order. When the key is bounded — a frequency can never exceed the array's length — the buckets are just an array indexed by the key, and sorting by it takes linear time instead of n log n. The problems here practise the form that comes up in interviews: count occurrences, bucket the values by their count, and read the buckets from the top to get the most frequent first.",
  },
  {
    tag: "KMP",
    slug: "kmp",
    label: "KMP Algorithm",
    blurb:
      "The Knuth–Morris–Pratt algorithm finds a pattern in a text in linear time by never stepping backwards in the text. Before searching it computes, for every prefix of the pattern, the length of its longest proper prefix that is also a suffix — the prefix function, or failure table — so after a mismatch the pattern shifts straight to the next alignment that could still match. The problems here use that table directly: the longest prefix that is also a suffix, and the shortest palindrome made by adding characters in front.",
  },
  {
    tag: "Merge Sort",
    slug: "merge-sort",
    label: "Merge Sort",
    blurb:
      "Merge sort splits an array in half, sorts each half recursively and merges the two sorted halves in one linear pass, for O(n log n) on every input and a stable result. In interviews the merge step matters as much for what it can count as for the sorting: while two sorted halves meet, every element can see how many on the other side are smaller or larger. The problems here use that to count pairs across positions in O(n log n) where comparing every pair would be O(n²).",
  },
  {
    tag: "Sieve of Eratosthenes",
    slug: "sieve-of-eratosthenes",
    label: "Sieve of Eratosthenes",
    blurb:
      "The sieve of Eratosthenes finds every prime up to n in one pass: start with every number marked prime and, for each prime p, cross out its multiples from p² onwards; whatever survives is prime. It replaces n separate primality tests with crossing-out that costs O(n log log n), close to linear. The problems here practise the sieve and the variants built on the same loop, such as counting the primes below n or recording each number's smallest prime factor so any number up to n factorises in a few divisions.",
  },
  {
    tag: "Suffix Array",
    slug: "suffix-array",
    label: "Suffix Array",
    blurb:
      "A suffix array lists the starting positions of a string's suffixes in sorted order. Sorting the suffixes puts every repeated substring beside its other occurrences, and the companion LCP array — the length of the common prefix of each pair of neighbours — turns questions about repeats, distinct substrings and substring order into lookups. The problems here practise the structure's core use: comparing two substrings of one string in constant time after preprocessing, inside a larger algorithm that compares them many times.",
  },
  {
    tag: "Trie",
    slug: "trie",
    label: "Trie",
    blurb:
      "A trie, or prefix tree, stores a set of words one character per level, so words that share a prefix share the path that spells it. Asking whether any stored word starts with a given prefix, or which stored word is the shortest prefix of another, then costs the length of the word rather than the size of the dictionary. The same tree built over the bits of integers, highest bit first, answers maximum-XOR questions greedily. The problems here practise building the tree, marking where words end, and walking it alongside a second string.",
  },
  {
    tag: "Tree",
    slug: "trees",
    label: "Trees",
    blurb:
      "A tree is a connected graph with no cycles: n nodes joined by exactly n − 1 edges, with one path between any two of them. Pick a root and every other node gets a parent, a depth and a subtree of its own — the shape of an organisation chart, a road network leading to a capital, a directory listing. The problems here give the tree as an edge list or a parent array rather than as linked nodes, and practise rooting it, walking it without stepping back to the parent, and building each node's answer from its children's.",
  },
  {
    tag: "Segment Tree",
    slug: "segment-tree",
    label: "Segment Tree",
    blurb:
      "A segment tree splits an array into halves, quarters and so on down to single elements, and stores an aggregate — a sum, a minimum, a bitwise OR — for every piece. Any range is covered by a logarithmic number of stored pieces, so a range query and a single-element update both take O(log n) time, where a plain array makes one of them linear. It works for any operation that combines two neighbouring answers into one. The problems here practise building the tree, querying a range, and indexing it by value to count what has been inserted so far.",
  },
  {
    tag: "Binary Indexed Tree",
    slug: "binary-indexed-tree",
    label: "Binary Indexed Tree",
    blurb:
      "A binary indexed tree, also called a Fenwick tree, keeps partial sums of an array in a second array of the same length, arranged by the lowest set bit of each index, so that a prefix sum and a single-element update both take O(log n) time. It is shorter to write than a segment tree and covers the common case: counting, while an array is scanned, how many earlier values are smaller, larger or inside a range. The problems here practise that counting, the coordinate compression it usually needs, and the one-based indexing the bit tricks depend on.",
    aliases: ["Fenwick Tree"],
  },
  {
    tag: "Ordered Set",
    slug: "ordered-set",
    label: "Ordered Set",
    blurb:
      "An ordered set keeps its elements sorted while they are inserted and removed, and answers what a hash set cannot: the smallest, the largest, the first value at least x, the last value at most x. Java's TreeSet and TreeMap and C++'s set and map are balanced search trees that do each of these in logarithmic time; Python has no built-in equivalent, so solutions use a heap, a list kept sorted with bisect, or a third-party sorted list. The problems here practise choosing between those and the successor and predecessor lookups they serve.",
  },
  {
    tag: "Monotonic Queue",
    slug: "monotonic-queue",
    label: "Monotonic Queue",
    blurb:
      "A monotonic queue is a double-ended queue kept in sorted order: each new element first removes every element at the back that it beats, and elements leave from the front once they fall out of the window. The front is then always the best value in the current window — its maximum, its minimum, the best earlier dynamic-programming value — at amortised constant cost per step. The problems here practise the sliding-window maximum and its use inside dynamic programming and prefix-sum searches, where a heap would cost an extra logarithm.",
  },
  {
    tag: "Memoization",
    slug: "memoization",
    label: "Memoization",
    blurb:
      "Memoisation (memoization in American spelling) stores a function's result for each set of arguments, so a recursion that would solve the same subproblem many times solves it once. It is the top-down form of dynamic programming: write the natural recursive definition, add a cache keyed by the arguments, and an exponential tree of calls collapses to one call per distinct state. The problems here practise spotting the repeated states, deciding what belongs in the key, and the cases where a cache is simpler than working out the order a table must be filled in.",
  },
  {
    tag: "Bitmask",
    slug: "bitmask",
    label: "Bitmask",
    blurb:
      "A bitmask uses the bits of one integer as a set of small items: bit i is on when item i is chosen, used or visited. With at most 15 or 20 items every subset is a number below 2ⁿ, so it can index an array, and dynamic programming over subsets — which tasks are done, which nodes have been visited, which primes a product already contains — becomes a table of 2ⁿ entries. The problems here practise that table, the bit operations that move from one subset to the next, and spotting the small bound that makes it affordable.",
  },
  {
    tag: "Digit DP",
    slug: "digit-dp",
    label: "Digit DP",
    blurb:
      "Digit DP counts the integers in a range that have some property of their digits — how many contain a 1, how many have no repeated digit, how many have a digit sum divisible by k — without visiting them one by one. It chooses the digits from the most significant end, remembering whether the number so far still matches the upper bound digit for digit, plus whatever the property needs; ranges up to 10¹⁸ then come down to a few thousand states. The problems here practise that state and the counting it supports.",
  },
  {
    tag: "Shortest Path",
    slug: "shortest-path",
    label: "Shortest Path",
    blurb:
      "A shortest-path algorithm finds the cheapest route between nodes when edges carry costs — travel times, prices, obstacles to remove. Breadth-first search already solves it when every edge costs the same; with different non-negative weights, Dijkstra's algorithm settles nodes in order of distance using a priority queue; with negative weights or a limit on the number of edges, Bellman–Ford relaxes every edge round by round. The problems here practise choosing between them, running them on grids as well as edge lists, and counting or constraining the shortest routes as well as measuring them.",
  },
  {
    tag: "Minimum Spanning Tree",
    slug: "minimum-spanning-tree",
    label: "Minimum Spanning Tree",
    blurb:
      "A minimum spanning tree connects every node of a weighted, undirected graph using the cheapest possible set of edges — n − 1 of them, with no cycle. Kruskal's algorithm sorts the edges and keeps each one that joins two parts not yet connected; Prim's algorithm grows a single tree from a start node, always adding the cheapest edge that leaves it. Laying cable between sites, joining points on a plane and clustering by distance are all spanning-tree questions. The problems here practise both algorithms and the choice between them on edge lists and on dense, implicit graphs.",
  },
  {
    tag: "Biconnected Component",
    slug: "biconnected-component",
    label: "Biconnected Component",
    blurb:
      "A graph is biconnected when removing any one node leaves it connected. Its biconnected components are the largest pieces with that property; they meet at articulation points, the nodes whose removal splits the graph, and a bridge — an edge whose removal splits it — forms a component of its own. Tarjan's depth-first search finds every articulation point and bridge in one pass by comparing when each node was discovered with the earliest node its subtree can reach. The problems here practise finding these single points of failure in networks and grids.",
  },
];

export interface CompanyHub {
  tag: string;
  slug: string;
  label: string;
}

/** Every company tag in use has a page. */
export const MIN_COMPANY_PROBLEMS = 1;

/** Fewer than this and a company's page is served `noindex` and left out of the sitemap (see the header). */
export const MIN_INDEXED_COMPANY_PROBLEMS = 3;

const TOPIC_BY_TAG = new Map(TOPIC_HUBS.flatMap((t) => [[t.tag, t] as const, ...(t.aliases ?? []).map((a) => [a, t] as const)]));
const TOPIC_BY_SLUG = new Map(TOPIC_HUBS.map((t) => [t.slug, t]));

/** The hub a tag belongs to — its own, or the one it is an alias of. */
export const topicHubByTag = (tag: string): TopicHub | undefined => TOPIC_BY_TAG.get(tag);
export const topicHubBySlug = (slug: string): TopicHub | undefined => TOPIC_BY_SLUG.get(slug);

/**
 * The order the topics are best learned in: each leans only on ones before
 * it (a sliding window is two pointers with a condition; Dijkstra is BFS
 * with a heap). A company's study plan takes its topics in this order, and
 * a topic's plan ends by pointing at the next one. problem-topics.test.ts
 * holds it to naming every hub exactly once.
 */
export const TOPIC_ORDER: readonly string[] = [
  "arrays", "strings", "hash-table", "counting", "math", "two-pointers", "sliding-window", "prefix-sum",
  "sorting", "counting-sort", "bucket-sort", "binary-search", "stack", "queue", "monotonic-stack",
  "monotonic-queue", "matrix", "simulation", "enumeration", "intervals", "greedy", "recursion",
  "merge-sort", "divide-and-conquer", "quickselect", "heap", "ordered-set", "bit-manipulation",
  "bitmask", "number-theory", "sieve-of-eratosthenes", "combinatorics", "trees", "trie",
  "backtracking", "graph", "breadth-first-search", "depth-first-search", "topological-sort",
  "union-find", "shortest-path", "minimum-spanning-tree", "biconnected-component",
  "dynamic-programming", "memoization", "digit-dp", "game-theory", "geometry", "brainteaser",
  "string-matching", "kmp", "rolling-hash", "suffix-array", "segment-tree", "binary-indexed-tree",
];
const ORDER_INDEX = new Map(TOPIC_ORDER.map((slug, i) => [slug, i]));
/** A topic's place in TOPIC_ORDER (unknown slugs last). */
export const topicRank = (slug: string): number => ORDER_INDEX.get(slug) ?? TOPIC_ORDER.length;

/** A company's hub, from its tag: the slug is derived, the label is the tag. */
export function companyHub(tag: string): CompanyHub | undefined {
  if (!isCompanyTag(tag)) return undefined;
  return { tag, slug: slugify(tag), label: tag };
}

/** Where a renamed company's old hub address now lives (COMPANY_RENAMED): "facebook" → "meta". */
export function renamedCompanyHubSlug(slug: string): string | undefined {
  for (const [from, to] of Object.entries(COMPANY_RENAMED)) if (slugify(from) === slug) return slugify(to);
  return undefined;
}

/**
 * What a company hub says about itself. One sentence of fact — the tag is
 * the catalogue's — one of what the list holds, and one of what the list is
 * for. The middle one is counted from the hub's own problems (its most
 * common topics), so no two company hubs open with the same paragraph: they
 * did, word for word but the name, until 2026-09-30. Nothing about how the
 * company interviews is claimed — the site has no source for that.
 */
export function companyBlurb(
  label: string,
  count: number,
  topTopics: ReadonlyArray<{ label: string; count: number }> = [],
  more: {
    /** The hub's difficulty split. */
    byDifficulty?: { EASY: number; MEDIUM: number; HARD: number };
    /** The catalogue's size, to say when a tag covers most of it. */
    catalogue?: number;
    /** A few problems tagged for this company and no other, in list order. */
    ownProblems?: readonly string[];
    /** The company's placement patterns on /tests: name, and its guide's opening line when it has one. */
    patterns?: ReadonlyArray<{ name: string; lead?: string }>;
  } = {},
): string {
  const and = (xs: readonly string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : (xs[0] ?? ""));
  const topics = topTopics.map((t) => `${t.label} (${t.count})`);
  const common = topics.length ? ` The most common topics among them are ${and(topics)}.` : "";
  // Counted, not assumed: "from easy warm-ups to the harder questions" was
  // every hub's line, and TCS and Zoho have no hard problem at all (2026-10-01).
  const d = more.byDifficulty;
  const split = d ? and((["EASY", "MEDIUM", "HARD"] as const).filter((k) => d[k] > 0).map((k) => `${d[k]} ${k.toLowerCase()}`)) : "";
  const levels = split ? ` — ${split}${d && d.HARD === 0 ? ", no hard ones" : ""} —` : ",";
  const share = more.catalogue ? Math.round((count / more.catalogue) * 100) : 0;
  const broad = share >= 50 ? ` At ${share}% of the catalogue the tag is a broad net rather than a shortlist${more.patterns?.length ? "; the pattern below is the narrower place to start" : ""}.` : "";
  const own = more.ownProblems?.length ? ` Tagged for ${label} and no other company: ${and(more.ownProblems)}.` : "";
  // The pattern's guide (lib/test-guides) opens with one sourced sentence on
  // the test itself — the one company-specific fact the site can back.
  // `lead` is that sentence without its "A guide to": "the Google online
  // assessment pattern for university candidates: two coding problems, …".
  const pattern = more.patterns?.find((p) => p.lead);
  const format = pattern?.lead ? ` CodeKairo's ${pattern.name} mock covers ${pattern.lead}` : "";
  return `${count} problems the CodeKairo catalogue tags as commonly asked in ${label}'s coding rounds${levels} each judged by hidden tests in 13 languages.${common}${own}${broad}${format} The tag is the catalogue's own annotation of where a problem tends to come up — not a list published by ${label}, which CodeKairo is not affiliated with.`;
}

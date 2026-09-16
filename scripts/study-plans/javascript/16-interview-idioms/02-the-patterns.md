---
title: The patterns — the dozen algorithm shapes behind most JavaScript rounds
minutes: 14
---
Coding questions are not infinite. Behind the thousands of published problems sit a dozen patterns, and recognising which one a problem belongs to is most of solving it. This lesson names the patterns, gives the tell-tale signs that identify each, the JavaScript shape of its solution, and the mistakes specific to writing it in this language. Depth on any one of them is a data-structures course; the goal here is the recognition step — "this is a sliding window" — that turns a blank page into a template to fill.

## 1. Hash map counting

**Signs**: "how many times", "first unique", "anagram", "two numbers that sum to", "group by". **Shape**: one pass building a `Map` (value → count, value → index, key → group), a second pass reading it. O(n) time, O(n) space. **JS notes**: `Map` keeps key types; `freq.get(x) ?? 0`; anagram keys are the sorted characters (`[...w].sort().join("")`) or a 26-count array joined — say which alphabet you assume.

## 2. Two pointers

**Signs**: a sorted array, "pair with sum", "remove duplicates in place", "reverse", "palindrome", "merge two sorted". **Shape**: `lo`/`hi` moving inward, or a slow/fast pair moving the same way (`write`/`read` for in-place compaction). O(n), O(1). **JS notes**: destructuring swap `[a[i], a[j]] = [a[j], a[i]]`; for palindromes over Unicode use `[...s]` first.

## 3. Sliding window

**Signs**: "longest/shortest substring or subarray with…", "at most k distinct", "maximum sum of size k". **Shape**: `right` expands, a `while` loop moves `left` until the window is valid again, best is recorded each step; state is a count `Map` or a running sum. O(n). **JS notes**: delete a key when its count drops to 0 so `map.size` is the number of distinct elements; fixed-size windows add `s[right]` and remove `s[right - k]`.

## 4. Stack

**Signs**: "valid parentheses", "nearest greater/smaller element", "evaluate an expression", "simplify a path", "undo", nesting of any kind. **Shape**: an array with `push`/`pop`; for **monotonic stacks** pop while the top violates the order and record the popped element's answer. O(n). **JS notes**: `stack.at(-1)` for peek; an empty-stack pop returns `undefined`, so check `length` first.

## 5. Queue and BFS

**Signs**: "shortest path in an unweighted graph/grid", "minimum number of steps", "level order", "nearest". **Shape**: a queue seeded with the start, a `seen` set, expand level by level; the first time you reach the target is the shortest. O(V + E). **JS notes**: index-pointer queue (`for (let i = 0; i < queue.length; i++)`) — never `shift()`; grid keys as `` `${r},${c}` `` or `r * cols + c`; the four directions as `[[1,0],[-1,0],[0,1],[0,-1]]`.

## 6. DFS, recursion and backtracking

**Signs**: "all combinations/permutations/subsets", "number of islands", "path exists", "generate parentheses", "N-queens", tree traversals. **Shape**: a recursive function that chooses, recurses, and **undoes** the choice (`path.push(x); go(); path.pop()`). Exponential in the output size for enumeration problems — say so. **JS notes**: recursion depth ~10⁴ — an iterative stack for deep graphs; copy the path when recording an answer (`result.push([...path])`), not the live array; mark visited cells before recursing and unmark after if paths must be re-explorable.

## 7. Binary search

**Signs**: a sorted array, "minimum x such that", "first/last position", "square root", "peak", any monotonic predicate over a range. **Shape**: `lo`/`hi` bounds, `mid = lo + ((hi - lo) >> 1)`, shrink toward the side where the predicate flips. O(log n). **JS notes**: `>> 1` is fine below 2³¹; use `Math.floor((lo + hi) / 2)` otherwise; get the boundary convention right (half-open `[lo, hi)` and return `lo`) and trace it on a two-element array.

## 8. Prefix sums and difference arrays

**Signs**: "sum of a range many times", "subarray sum equals k", "count of subarrays with…". **Shape**: `prefix[i + 1] = prefix[i] + a[i]`, range sum = `prefix[r + 1] − prefix[l]`; for "subarray sum equals k" combine with a hash map of prefix counts. O(n). **JS notes**: sums beyond 2⁵³ need `BigInt`; the map is keyed by number, so `0` must be seeded (`map.set(0, 1)`).

## 9. Sorting and greedy

**Signs**: "intervals" (merge, overlap, minimum rooms), "schedule", "assign", "minimum number of…" where a local choice is provably safe. **Shape**: sort by the right key (start, end, or ratio), then one linear pass making the greedy choice. O(n log n). **JS notes**: `sort((a, b) => a[0] - b[0])`; multi-key `a[0] - b[0] || a[1] - b[1]`; `sort` is stable since 2019, so a previous order survives ties.

## 10. Heaps and top-k

**Signs**: "k largest/smallest", "k most frequent", "merge k sorted", "median of a stream". **Shape**: a min-heap of size k; JavaScript has no built-in heap — implement a small binary heap (push: append and sift up; pop: swap root with last, sift down) or, for one-shot top-k, sort and slice with an O(n log n) note. **JS notes**: interviewers accept `sort().slice(0, k)` for small inputs when you say what the heap would change; a heap class is ~30 lines and worth having practised once.

## 11. Dynamic programming

**Signs**: "number of ways", "minimum cost", "longest … subsequence", "can it be partitioned", overlapping subproblems and optimal substructure. **Shape**: write the recursive relation first, memoise it (a `Map` or an array), then optionally convert to a bottom-up table and compress rows. **JS notes**: `Array(n + 1).fill(0)` for 1-D tables, `Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))` for 2-D; memo keys for two parameters as `` `${i},${j}` `` or `i * (n + 1) + j`; the recursive version may exceed the stack for n ≈ 10⁴ — mention the iterative conversion.

## 12. Linked lists, trees and graphs as objects

**Signs**: anything about nodes. **Shape**: `{ val, next }`, `{ val, left, right }`, adjacency lists as `Map<node, node[]>` or arrays of arrays. Common moves: dummy head for list edits, slow/fast pointers for the middle or a cycle, recursion mirroring tree structure, `seen` sets for graphs. **JS notes**: build adjacency with `(adj.get(u) ?? adj.set(u, []).get(u)).push(v)`; a tree's height recursion is fine, a list's recursion is not (lists are deep).

## Complexity you should know cold

| Structure / operation | Cost |
| --- | --- |
| Array index, `push`/`pop` | O(1) |
| Array `shift`/`unshift`/`splice`/`includes`/`indexOf` | O(n) |
| `Map`/`Set` get/set/has/delete | O(1) average |
| `sort` | O(n log n) |
| String concatenation in a loop | fine (ropes), but build arrays for clarity |
| Binary search | O(log n) |
| BFS/DFS | O(V + E) |
| Enumerating subsets / permutations | O(2ⁿ) / O(n!) |

State the complexity of the *whole* solution — the sort you did before the linear pass counts.

## Common mistakes

- Reaching for DFS when BFS is asked for (shortest path needs BFS on unweighted graphs).
- Sliding windows that never shrink; monotonic stacks that pop the wrong way; binary searches with an off-by-one boundary.
- Recording the live `path` array instead of a copy in backtracking.
- `shift()` queues, `includes` inside loops, recomputing what a prefix sum would give.
- Not naming the pattern — the interviewer cannot tell whether you recognised the problem or guessed.

## What the interviewer is listening for

- The recognition step: "this looks like a sliding window because…".
- Correct complexity for the whole solution, including sorting and the data structures.
- Handling the pattern's standard edge cases: empty input, k larger than n, a single node, disconnected graphs.
- Knowing which JavaScript structure implements the pattern well — and that a heap has to be written.

## Key takeaways

- Twelve patterns cover most rounds: counting, two pointers, sliding window, stack, BFS, DFS/backtracking, binary search, prefix sums, sort + greedy, heaps/top-k, DP, node structures.
- Recognise by the signs, then fill the template; say the pattern's name and complexity out loud.
- JavaScript specifics: `Map`/`Set`, index-pointer queues, `at(-1)` peeks, copies of paths, `Array.from` tables, `BigInt` for big sums, no built-in heap.
- Know the complexity table cold, and count the sort.

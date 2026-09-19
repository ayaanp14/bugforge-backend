---
title: The idiom sheet — the shapes interview problems take and the Python for each
minutes: 16
---
Most interview problems are one of about twenty shapes wearing a story, and each shape has a two-to-six-line Python idiom that a fluent candidate types without thinking. Recognising the shape is the skill; the idiom is the reward. This lesson is the sheet: counting and grouping, sorting by key, two pointers and sliding windows, prefix sums, stacks, heaps, BFS with a deque, binary search with `bisect`, set arithmetic, string building, and the `itertools` and `math` helpers — each named, each with its idiom and its complexity, so that in the round you say "this is a frequency count, then a heap" and write it.

## Counting and grouping

```python
from collections import Counter, defaultdict
counts = Counter(words)                       # O(n)
counts.most_common(3)                         # top three (ties in insertion order — sort if it matters)
groups = defaultdict(list)
for word in words:
    groups["".join(sorted(word))].append(word)    # anagram groups
by_first = {}
for name in names:
    by_first.setdefault(name[0], []).append(name)
```

"How many of each", "group by", "find duplicates", "first unique" are all a `Counter` or a `defaultdict`. `Counter` supports `+`, `-`, `&` and `|` between counters, and `counts[x]` is 0 for a missing key.

## Sorting by key

```python
sorted(items, key=lambda p: (-p.score, p.name))     # descending score, then name
sorted(words, key=len)                               # stable: equal lengths keep input order
max(items, key=lambda p: p.score)                    # first maximum
sorted(pairs)                                        # tuples compare lexicographically
```

Negate numbers for descending inside a tuple key; `reverse=True` reverses the whole order. Stability means two sorts compose: sort by the secondary key first, then by the primary.

## Two pointers and sliding windows

```python
# longest substring without a repeated character: O(n)
last = {}
start = best = 0
for i, ch in enumerate(s):
    if ch in last and last[ch] >= start:
        start = last[ch] + 1
    last[ch] = i
    best = max(best, i - start + 1)

# pair with a target sum in a sorted list
lo, hi = 0, len(xs) - 1
while lo < hi:
    total = xs[lo] + xs[hi]
    if total == target: break
    if total < target: lo += 1
    else: hi -= 1
```

A window is a start index that only moves forward and a state (a count, a set, a sum) updated as elements enter and leave. "Longest/shortest subarray with property P", "at most k distinct" are windows. Two pointers walk a sorted array from both ends, or two arrays in step (merging).

## Prefix sums and differences

```python
prefix = [0]
for x in xs: prefix.append(prefix[-1] + x)
range_sum = prefix[j + 1] - prefix[i]              # O(1) per query
from itertools import accumulate
prefix = [0, *accumulate(xs)]                      # the same in one line
```

"Sum of a range", "count of something in a range", "subarray with sum k" (prefix sums plus a dict of seen prefixes) are prefix problems.

## Stacks

```python
stack = []
for ch in s:                                        # balanced brackets
    if ch in "([{": stack.append(ch)
    elif not stack or PAIRS[stack.pop()] != ch: return False
return not stack

for i, h in enumerate(heights):                     # next greater element / monotonic stack
    while stack and heights[stack[-1]] < h:
        result[stack.pop()] = h
    stack.append(i)
```

Brackets, "next greater", "largest rectangle", expression evaluation, undo, DFS without recursion — a list used with `append` and `pop`.

## Heaps

```python
import heapq
heapq.nlargest(k, xs)                               # O(n log k)
heapq.nsmallest(k, words, key=lambda w: (counts[w], w))
heap = []; heapq.heappush(heap, (dist, node)); dist, node = heapq.heappop(heap)   # min at [0]
heapq.heappush(heap, (-value, item))                # a max-heap by negation
heapq.merge(a, b, c)                                # k sorted iterables, lazily
```

"Top k", "k-th largest", "merge k sorted", Dijkstra, "schedule by earliest" are heaps. `heapify(xs)` is O(n).

## BFS, DFS and graphs

```python
from collections import deque
graph = defaultdict(list)
for a, b in edges: graph[a].append(b); graph[b].append(a)

dist = {start: 0}
queue = deque([start])
while queue:                                        # BFS: shortest path in edges
    node = queue.popleft()
    for nxt in graph[node]:
        if nxt not in dist:
            dist[nxt] = dist[node] + 1
            queue.append(nxt)

for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):   # grid neighbours
    r, c = row + dr, col + dc
    if 0 <= r < rows and 0 <= c < cols and grid[r][c] == "#" and (r, c) not in seen: ...
```

"Shortest path in an unweighted graph or grid", "count islands", "is it connected" are BFS with a deque and a `seen` set; DFS is the same with a stack (or recursion with the limit raised).

## Binary search

```python
from bisect import bisect_left, bisect_right, insort
i = bisect_left(sorted_xs, x)                        # first index with xs[i] >= x
count_less = bisect_left(sorted_xs, x); count_le = bisect_right(sorted_xs, x)
lo, hi = 0, n                                        # search on the answer: smallest ok(mid)
while lo < hi:
    mid = (lo + hi) // 2
    if ok(mid): hi = mid
    else: lo = mid + 1
```

"First element not below x", "how many are less than x", and "the smallest value for which a predicate holds" (capacity, speed, days — the answer is monotonic).

## Sets, strings, itertools, math

```python
a & b, a | b, a - b, a ^ b                            # intersection, union, difference, symmetric
"".join(reversed(s)); s[::-1]; s.split(); " ".join(words)
ord(ch) - ord("a"); chr(ord("a") + k)
s.translate(str.maketrans("", "", ".,!?"))            # strip punctuation in C
from itertools import combinations, permutations, product, groupby, accumulate, pairwise
for key, run in groupby(sorted(xs)): ...              # runs of equal values
for a, b in pairwise(xs): ...                         # adjacent pairs
from math import gcd, lcm, isqrt, comb, inf
list(zip(*grid))                                      # transpose
divmod(seconds, 60); n.bit_count(); f"{x:.2f}"
```

## The sheet, in one table

| Words in the problem | Shape | Idiom |
| --- | --- | --- |
| how many, duplicates, group | count | `Counter`, `defaultdict` |
| top k, k-th, merge sorted | heap | `nlargest`, `heappush` |
| longest/shortest subarray with | window | start index + state |
| pair sums, sorted arrays | two pointers | `lo`/`hi` |
| range sum, subarray sum k | prefix | `accumulate`, dict of prefixes |
| brackets, next greater | stack | list `append`/`pop` |
| shortest path, islands, reachable | BFS/DFS | `deque`, `seen` set |
| first ≥, count <, smallest that works | binary search | `bisect`, search on answer |
| by score then name | sort by key | tuple key |
| common, distinct, either | sets | `&`, `\|`, `-` |

## Key takeaways

- Name the shape first; the idiom follows. Counting, sorting by key, windows, prefixes, stacks, heaps, BFS, bisect and sets cover most rounds.
- `Counter`/`defaultdict` for counting and grouping; tuple keys with negation for multi-key sorts.
- Windows and two pointers make O(n²) scans O(n); prefix sums make range queries O(1).
- `heapq` for top-k and scheduling, `deque` for BFS, `bisect` for sorted queries and "search on the answer".
- `itertools` and `math` have the helper you were about to write.

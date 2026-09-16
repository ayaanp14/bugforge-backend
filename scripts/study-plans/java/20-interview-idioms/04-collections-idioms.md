---
title: The collections idiom sheet
minutes: 15
---
Interview problems repeat. Under the surface of "find the k most frequent", "longest substring without repeats", "merge intervals" and "next greater element" are perhaps fifteen shapes, and each has a two-to-six-line Java idiom that experienced candidates type without thinking. This lesson is the sheet: the idiom, the structure it uses, the complexity, and the trap. Learn them as vocabulary — you should be able to say "frequency map, then a min-heap of size k" as one phrase.

## Counting and grouping

```java
Map<String, Integer> freq = new HashMap<>();
for (String w : words) freq.merge(w, 1, Integer::sum);                       // O(n); the frequency map
Map<Integer, List<String>> byLen = new HashMap<>();
for (String w : words) byLen.computeIfAbsent(w.length(), k -> new ArrayList<>()).add(w);   // grouping
int[] count = new int[26]; for (char c : s.toCharArray()) count[c - 'a']++;  // bounded alphabet: an array beats a map
```

**Trap:** boxed `==` when comparing counts; an alphabet array is both faster and immune.

## Top-k and ordering by a key

```java
PriorityQueue<Map.Entry<String, Integer>> heap =                             // min-heap on count, size k
    new PriorityQueue<>(Map.Entry.comparingByValue());
for (var e : freq.entrySet()) { heap.offer(e); if (heap.size() > k) heap.poll(); }   // O(n log k)
// heap now holds the k largest; poll to list them ascending, reverse for descending
```

Use a **min**-heap to keep the *largest* k (evict the smallest). For ties, put the secondary key in the comparator (`comparingByValue().thenComparing(Map.Entry.comparingByKey(Comparator.reverseOrder()))` so that alphabetically earlier words survive). For k close to n, sorting is simpler and just as fast. `PriorityQueue` has no `decreaseKey`: for Dijkstra, push duplicates and skip stale entries on poll.

## Stacks, queues, deques

```java
Deque<Integer> stack = new ArrayDeque<>(); stack.push(x); stack.pop(); stack.peek();
Deque<Integer> queue = new ArrayDeque<>(); queue.offer(x); queue.poll(); queue.peek();
```

Never `Stack` (synchronised, a `Vector`) or `LinkedList` (slow, allocation-heavy). `ArrayDeque` rejects `null` — use a sentinel or `Integer` box carefully. **Monotonic stack** for "next greater element" / histogram problems:

```java
Deque<Integer> idx = new ArrayDeque<>();                  // indexes with decreasing values
for (int i = 0; i < n; i++) {
    while (!idx.isEmpty() && a[idx.peek()] < a[i]) next[idx.pop()] = i;   // a[i] is the next greater for those
    idx.push(i);
}
```

**Sliding-window maximum** is the same idea with a deque that also drops indexes that left the window from the front — O(n).

## Sorted structures: `TreeMap` navigation

```java
TreeMap<Integer, String> tm = …;
tm.floorKey(x); tm.ceilingKey(x); tm.lowerKey(x); tm.higherKey(x);    // nearest keys, O(log n)
tm.firstKey(); tm.lastKey(); tm.headMap(x); tm.tailMap(x, true); tm.subMap(lo, hi);
tm.pollFirstEntry();                                                    // sorted queue with removal by key
```

Interval scheduling ("is this slot free?"), nearest-value queries, "count of elements ≤ x" (via `headMap(x, true).size()` — O(n), so use a Fenwick tree if it is hot), and an ordered multiset via `TreeMap<Integer, Integer>` counts.

## Two pointers and sliding windows

```java
int lo = 0; Map<Character, Integer> last = new HashMap<>(); int best = 0;
for (int hi = 0; hi < s.length(); hi++) {
    char c = s.charAt(hi);
    if (last.containsKey(c) && last.get(c) >= lo) lo = last.get(c) + 1;     // shrink past the repeat
    last.put(c, hi);
    best = Math.max(best, hi - lo + 1);                                       // longest substring without repeats
}
```

Windows are for contiguous subarrays with a monotone condition; two pointers from both ends for sorted arrays (pair sums). Both O(n). **Trap:** shrinking with `while` when the condition is not monotone — check that moving `lo` right can only help.

## Prefix sums and hashing for subarrays

```java
long[] pre = new long[n + 1]; for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + a[i];   // sum(i..j) = pre[j+1] - pre[i]
Map<Long, Integer> seen = new HashMap<>(); seen.put(0L, 1); long run = 0; int count = 0;
for (int x : a) { run += x; count += seen.getOrDefault(run - target, 0); seen.merge(run, 1, Integer::sum); }   // subarrays summing to target, O(n)
```

`long` prefixes always. 2-D prefix sums for grid rectangles; XOR prefixes for XOR subarrays.

## Hash-set tricks

```java
Set<Integer> seen = new HashSet<>();
for (int x : a) { if (seen.contains(target - x)) return true; seen.add(x); }    // two-sum, O(n)
new HashSet<>(list).size() == list.size();                                      // all distinct?
Set<Integer> common = new HashSet<>(aList); common.retainAll(bList);            // intersection
```

**Anagram grouping**: key = sorted characters (`new String(sortedChars)`) or a count signature; `groupingBy` on that key.

## Graph skeletons

```java
List<List<Integer>> adj = new ArrayList<>(); for (int i = 0; i < n; i++) adj.add(new ArrayList<>());   // adjacency list
// BFS
Deque<Integer> q = new ArrayDeque<>(); int[] dist = new int[n]; Arrays.fill(dist, -1);
dist[src] = 0; q.offer(src);
while (!q.isEmpty()) { int u = q.poll(); for (int v : adj.get(u)) if (dist[v] < 0) { dist[v] = dist[u] + 1; q.offer(v); } }
// DFS, iterative (no stack overflow)
Deque<Integer> st = new ArrayDeque<>(); boolean[] seen = new boolean[n]; st.push(src);
while (!st.isEmpty()) { int u = st.pop(); if (seen[u]) continue; seen[u] = true; for (int v : adj.get(u)) if (!seen[v]) st.push(v); }
// Dijkstra
PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(x -> x[0]));   // {dist, node}
```

Grid graphs: `int[] dr = {1, -1, 0, 0}, dc = {0, 0, 1, -1}` and a bounds check. `int[][]` for the grid, `boolean[][]` for visited — not sets of strings.

## Memoisation and DP tables

```java
Map<Long, Long> memo = new HashMap<>();                     // key: encode (i, j) as i * M + j — cheaper than a String or a List key
long[][] dp = new long[n + 1][m + 1];  Arrays.fill(dp[0], INF);                  // INF = Long.MAX_VALUE / 4 so INF + INF does not overflow
```

Prefer arrays to maps for DP over small integer states; encode multi-dimensional keys into one `long`; choose an `INF` that survives addition.

## Bits

```java
Integer.bitCount(x); Integer.highestOneBit(x); Integer.numberOfTrailingZeros(x);
(mask >> i & 1) == 1;  mask | (1 << i);  mask & ~(1 << i);  mask & (mask - 1);   // test, set, clear, drop lowest set bit
for (int sub = mask; sub > 0; sub = (sub - 1) & mask) { … }                      // enumerate submasks
```

`1 << i` is an `int` — `1L << i` for `i ≥ 31`. `>>>` for unsigned shifts.

## String building and manipulation

```java
new StringBuilder(s).reverse().toString();
sb.setLength(sb.length() - 1);                              // drop the trailing separator
sb.insert(0, c); sb.deleteCharAt(i); sb.setCharAt(i, c);
String.join(",", list); String.valueOf(chars); new String(chars, from, len);
Character.isLetterOrDigit(c); Character.toLowerCase(c); Character.getNumericValue(c);
```

## The sheet, as sentences

| Problem shape | Say | Structure | Complexity |
| --- | --- | --- | --- |
| count things | frequency map / alphabet array | `HashMap.merge`, `int[26]` | O(n) |
| k largest / most frequent | min-heap of size k | `PriorityQueue` | O(n log k) |
| next greater / histogram | monotonic stack | `ArrayDeque` | O(n) |
| window max/min | monotonic deque | `ArrayDeque` | O(n) |
| nearest / range queries on sorted keys | tree map navigation | `TreeMap.floorKey` | O(log n) |
| contiguous subarray with monotone predicate | sliding window | two indexes | O(n) |
| subarray sums | prefix sums + hash map | `long[]`, `HashMap` | O(n) |
| pair with property | hash set / two pointers | `HashSet` / sorted array | O(n) / O(n log n) |
| shortest path unweighted / weighted | BFS / Dijkstra | `ArrayDeque` / `PriorityQueue` | O(V + E) / O(E log V) |
| overlapping subproblems | memo / DP table | `long[][]`, encoded `long` keys | states × transitions |
| subsets of ≤ 20 | bitmask | `int` masks | O(2ⁿ · n) |

## Interview angle

- *"k most frequent words?"* Frequency map, min-heap of size k keyed on count (ties by word), poll and reverse — O(n log k).
- *"Longest substring without repeating characters?"* Sliding window with last-seen indexes — O(n).
- *"Count subarrays summing to k?"* Running prefix sum and a map of prefix counts — O(n).
- *"Why `ArrayDeque` and not `Stack`?"* `Stack` is a synchronised `Vector` with the wrong API; `ArrayDeque` is faster and idiomatic.
- *"Deep DFS in Java?"* Iterative with an explicit stack to avoid `StackOverflowError`.

## Key takeaways

- Fifteen shapes; name the shape, then the structure, then the complexity — before writing code.
- `merge`/`computeIfAbsent` for counting and grouping; `int[26]` when the alphabet is small.
- Min-heap of size k for top-k; monotonic stack/deque for next-greater and window extremes; `TreeMap` navigation for sorted queries.
- Prefix sums in `long`; hash sets for pairs; two pointers for sorted input; iterative BFS/DFS on adjacency lists.
- Encode DP keys as `long`; pick `INF` that survives addition; `1L << i` past 31.

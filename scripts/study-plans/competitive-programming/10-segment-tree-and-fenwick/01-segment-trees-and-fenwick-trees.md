---
title: Segment trees and Fenwick trees
minutes: 15
seo-title: Segment Tree vs Fenwick Tree in C++: Fast Range Queries
description: A segment tree answers range sum or minimum queries with point updates in O(log n); a Fenwick tree does prefix sums in ten lines with i & -i. Both in C++.
question: What is a segment tree?
answer: A segment tree is a binary tree over an array in which every node stores the answer for one contiguous range — a sum, minimum or maximum — with the root covering the whole array and the leaves single elements. A point update rewrites one leaf and its O(log n) ancestors, and a range query combines at most about 2 log n nodes, so both run in O(log n).
q: What is the difference between a segment tree and a Fenwick tree?
a: A Fenwick tree (binary indexed tree) keeps prefix sums in one array of n + 1 values and takes about ten lines; it works for operations that can be undone, such as sums, counts and XOR. A segment tree uses up to 4n nodes and also handles minimum, maximum, GCD and lazy range updates. Both answer in O(log n).
q: What does i & -i do in a Fenwick tree?
a: In two's complement, `i & -i` keeps only the lowest set bit of `i`. Fenwick cell `i` stores the sum of the `i & -i` elements ending at position `i`, so an update climbs with `i += i & -i` and a prefix query descends with `i -= i & -i`, each touching at most about log2 n cells.
q: How do you count inversions with a Fenwick tree?
a: Compress the values to ranks 1..m, then scan the array from left to right. Before recording element x, the number of earlier elements greater than x is the count seen so far minus the Fenwick prefix sum up to rank(x). Add that to the answer, then add 1 at rank(x). The whole scan is O(n log n).
q: When is a prefix-sum array enough instead of a segment tree?
a: When the array never changes. A prefix-sum array answers each range sum in O(1) after O(n) preparation, but a single point update costs O(n) to rebuild it. Once updates and queries interleave, use an O(log n) structure: at n = q = 2 × 10^5, rebuilding after every update is 4 × 10^10 steps.
---
Prefix sums answer a range sum in O(1) — until the array changes. One update rebuilds O(n) of the prefix array, so 2 × 10⁵ updates and queries cost 4 × 10¹⁰ steps. The fix is a structure in which an update and a query are both O(log n).

## A segment tree: one node per range

- The root covers the whole array; each node splits its range in half between two children; the leaves are single elements.
- Every node stores the answer for its range — a sum here, but minimum, maximum and GCD work the same way (any associative operation).
- One array holds it: node `v` has children `2v` and `2v + 1`, and `4n` slots is always enough.

@figure segment-tree

- **Update:** change the leaf, then recompute each ancestor from its two children — one node per level, O(log n).
- **Query `[l, r]`:** start at the root. A node fully inside the range gives its value, one fully outside gives the identity (0 for a sum, +∞ for a minimum), and a partial one asks both children. At most four nodes per level are visited.

```cpp
void update(int v, int lo, int hi, int pos, ll val) {
    if (lo == hi) { t[v] = val; return; }
    int mid = (lo + hi) / 2;
    if (pos <= mid) update(2 * v, lo, mid, pos, val);
    else update(2 * v + 1, mid + 1, hi, pos, val);
    t[v] = t[2 * v] + t[2 * v + 1];
}
ll query(int v, int lo, int hi, int l, int r) {
    if (r < lo || hi < l) return 0;            // outside: the identity
    if (l <= lo && hi <= r) return t[v];       // inside: the whole node
    int mid = (lo + hi) / 2;
    return query(2 * v, lo, mid, l, r) + query(2 * v + 1, mid + 1, hi, l, r);
}
```

## A Fenwick tree: prefix sums in ten lines

When the operation can be undone — sums, counts, XOR — a Fenwick (binary indexed) tree is shorter and faster.

- Cell `i` (1-indexed) holds the sum of the `i & -i` elements ending at `i`. `i & -i` is the lowest set bit: 6 = 110₂ gives 2, 8 gives 8.
- `add(i, x)` climbs `i += i & -i`, touching every cell whose range covers `i`.
- `sum(i)` descends `i -= i & -i`, collecting disjoint ranges that tile 1..i. A range is `sum(r) − sum(l − 1)`.

@figure fenwick

```cpp
struct BIT {
    int n; vector<ll> f;
    BIT(int n) : n(n), f(n + 1, 0) {}
    void add(int i, ll x) { for (; i <= n; i += i & -i) f[i] += x; }
    ll sum(int i) { ll s = 0; for (; i > 0; i -= i & -i) s += f[i]; return s; }
};
```

The classic trick is to index the tree by **value** instead of position. Scanning left to right, "how many earlier elements are greater than x" is `seen − sum(rank(x))`, which counts inversions in O(n log n). Compress values to ranks 1..m first with sort, `unique` and `lower_bound`.

```game
type: pick
title: Which structure fits the problem?
prompt: Pick the cheapest structure that meets the budget at n, q = 2 × 10^5.
? The array never changes; 2 × 10^5 range-sum queries.
* Prefix sums
- Segment tree
- Fenwick tree
> No updates: O(n) once, then O(1) a query beats any O(log n) structure.
? Point updates interleaved with range-minimum queries.
* Segment tree
- Fenwick tree
- Prefix sums
> A minimum cannot be undone, so sum(r) − sum(l − 1) has no analogue; a segment tree combines children with min.
? Count inversions in 2 × 10^5 values up to 10^9.
* Fenwick tree over compressed values
- Prefix sums over the raw values
- Two nested loops
> Earlier elements greater than x is a prefix count by rank; 10^9 values need compressing first.
? Point updates and range XOR queries.
* Fenwick tree
- Prefix sums rebuilt after each update
> XOR undoes itself, so prefix(r) XOR prefix(l − 1) gives any range.
? Add v to all of [l, r], then read one element.
* Fenwick tree over the difference array
- A segment tree of minimums
- Prefix sums rebuilt after each update
> A range add is two point updates to the differences, and an element is their prefix sum.
```

## More practice

- [Range Sum Query - Mutable](/problems/range-sum-query-mutable)
- [Count of Smaller Numbers After Self](/problems/count-of-smaller-numbers-after-self)
- [Reverse Pairs](/problems/reverse-pairs)
- [Count of Range Sum](/problems/count-of-range-sum)
- [Create Sorted Array Through Instructions](/problems/create-sorted-array-through-instructions)

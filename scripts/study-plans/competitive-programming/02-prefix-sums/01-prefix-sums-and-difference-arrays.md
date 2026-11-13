---
title: Prefix sums and difference arrays
minutes: 15
seo-title: Prefix Sums and Difference Arrays for Competitive Programming
description: Build a prefix array in O(n) to answer range-sum queries in O(1), and use a difference array to apply many range updates with two writes each, in C++.
question: What is a prefix sum array used for?
answer: A prefix sum array stores p[i] = a[1] + … + a[i], with p[0] = 0. Built once in O(n), it answers any range sum a[l..r] as p[r] − p[l − 1] in O(1), so q queries cost O(n + q) instead of O(n · q). Its inverse, the difference array, applies range updates in O(1) each.
q: What is a difference array?
a: The inverse of a prefix array. To add v to every element of [l, r], write d[l] += v and d[r + 1] −= v; after all updates, one running sum over d gives the final array. m updates cost O(n + m) instead of O(n · m).
q: Why does the prefix array start with p[0] = 0?
a: It is the sum of no elements, and it makes a range starting at index 1 the same formula as every other range: a[1..r] = p[r] − p[0]. Without it, every query with l = 1 needs a special case.
q: When can't I use prefix sums?
a: When updates and queries are interleaved. One changed element shifts every later prefix, so each update costs O(n). A Fenwick tree or a segment tree supports both operations in O(log n).
q: How do 2D prefix sums work?
a: P[i][j] holds the sum of the block above and left of (i, j). A rectangle is the big block minus the strip above, minus the strip to the left, plus the corner both strips removed: four lookups, O(1).
---
Two problems, one idea. **Many range-sum queries** on a fixed array, and **many range updates** followed by one read. Done element by element both are O(n · q) — 10¹⁰ at the limits.

## Prefix sums: precompute, then subtract

```cpp
vector<ll> p(n + 1, 0);              // p[0] = 0
for (int i = 1; i <= n; ++i) p[i] = p[i - 1] + a[i];
// sum of a[l..r]
ll s = p[r] - p[l - 1];
```

- p[i] is the sum of the first i elements. Building it is one pass, O(n).
- A range is "everything up to r" minus "everything before l".
- `p[0] = 0` means l = 1 needs no special case.
- `long long`: a prefix of 2·10⁵ values of 10⁹ is 2·10¹⁴.

@figure fill

## Difference arrays: update now, sum later

Run the idea backwards. To add v to a[l..r], mark only where the change **starts** and where it **stops**:

```cpp
vector<ll> d(n + 2, 0);
d[l] += v;                           // the change starts at l
d[r + 1] -= v;                       // and stops after r
// after every update:
ll run = 0;
for (int i = 1; i <= n; ++i) { run += d[i]; a[i] = run; }
```

- Two writes per update, however long the range.
- One running sum rebuilds the whole array: O(n + m) in total.
- `d` has n + 2 slots so an update ending at n still has somewhere to stop.

@figure difference

## Which one, when?

- Many queries, no updates → **prefix sums**.
- Many updates, then one read → **difference array**.
- Updates and queries mixed → neither; a Fenwick or segment tree (later in this track).
- Rectangles of a grid → 2D prefix sums: big block − top strip − left strip + corner.

```game
type: pick
title: Prefix array, difference array, or neither?
prompt: Pick the tool that makes the problem fit the time limit.
? 2·10^5 queries "sum of a[l..r]" on an array that never changes.
* Prefix sums
- Difference array
- Sum each range directly
> Build once in O(n), answer each query with one subtraction: O(n + q).
? 2·10^5 updates "add v to a[l..r]", then print the array once.
- Prefix sums
* Difference array
- Apply each update element by element
> Two writes per update and one running sum at the end: O(n + m).
? Updates and sum queries interleave, each update visible to the next query.
- Prefix sums
- Difference array
* Neither — a Fenwick or segment tree
> A changed element shifts O(n) prefixes. A tree handles both operations in O(log n).
? Many queries for the sum of a rectangle in a fixed grid.
* 2D prefix sums
- Difference array
- Sum each rectangle directly
> Four lookups per rectangle: big block, minus two strips, plus the corner.
? Count subarrays whose sum is exactly k; values may be negative.
* Prefix sums with a hash map of earlier prefixes
- Sliding window
- Difference array
> p[r] − p[l − 1] = k means looking up p[r] − k among the earlier prefixes. A window needs non-negative values.
```

## More practice

- [Range Sum Query - Immutable](/problems/range-sum-query-immutable) — the prefix array itself.
- [Find Pivot Index](/problems/find-pivot-index) — left sum against right sum.
- [Subarray Sum Equals K](/problems/subarray-sum-equals-k) — prefixes in a hash map.
- [Corporate Flight Bookings](/problems/corporate-flight-bookings) — a difference array.
- [Car Pooling](/problems/car-pooling) — range updates, then a scan.

---
title: Array patterns — reverse, rotate, count, prefix sums
minutes: 15
---
A handful of array manipulations appear in an outsized share of interview problems and real code: reversing in place, rotating, counting frequencies with an index-as-key array, prefix sums for range queries, two-pointer partitioning, and matrix walks. Each has a canonical, boundary-safe form. This lesson gives you those forms so you write them without thinking — and recognise them inside bigger problems.

## Swap and reverse in place

```java
static void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }

static void reverse(int[] a) {
    for (int i = 0, j = a.length - 1; i < j; i++, j--) swap(a, i, j);
}
```

Two indices walking inward; the loop ends when they meet or cross (`i < j`). Works for odd and even lengths and for empty arrays. Reversing a *range* `[from, to)` is the same with `i = from, j = to - 1` — the building block of rotation.

## Rotate by k

Rotating right by `k` (the last `k` elements move to the front) in O(n) time and O(1) space is the three-reversal trick:

```java
static void rotateRight(int[] a, int k) {
    int n = a.length;
    if (n == 0) return;
    k = ((k % n) + n) % n;           // normalise: handles k > n and negative k
    reverse(a, 0, n);                // whole
    reverse(a, 0, k);                // first k
    reverse(a, k, n);                // rest
}
```

`[1,2,3,4,5]` right by 2: reverse all → `[5,4,3,2,1]`, reverse first 2 → `[4,5,3,2,1]`, reverse rest → `[4,5,1,2,3]`. The alternative — a temporary array and `a[(i + k) % n] = old[i]` — is O(n) space and often clearer; know both.

## Counting with an index-as-key array

When the values are small integers or characters, an array indexed by value is the fastest frequency table:

```java
int[] freq = new int[26];
for (char c : word.toCharArray()) freq[c - 'a']++;      // lowercase letters only

int[] counts = new int[101];
for (int score : scores) counts[score]++;               // scores 0..100
```

Anagram checks, "first non-repeating character", counting sort, histogram — all this pattern. Guard the index range: `c - 'a'` for an uppercase letter is negative and throws. For arbitrary values use a `HashMap` (Module 14).

## Prefix sums

Precompute running totals once; then any range sum is one subtraction:

```java
long[] prefix = new long[n + 1];                 // prefix[0] = 0
for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + a[i];

long sum(int from, int to) {                     // sum of a[from..to), O(1)
    return prefix[to] - prefix[from];
}
```

The extra leading zero is what makes `from = 0` work without a special case. Use `long` — sums overflow before individual values do. Prefix sums answer many range queries in O(1) after O(n) setup, and the 2D version (`P[r][c]` = sum of the rectangle above-left) answers rectangle sums the same way. Difference arrays are the inverse trick for range *updates*.

## Two-pointer partition

Move elements matching a condition to the front, keeping order, in one pass:

```java
int write = 0;
for (int read = 0; read < a.length; read++) {
    if (a[read] != 0) a[write++] = a[read];     // keep non-zeros
}
while (write < a.length) a[write++] = 0;        // fill the tail
```

"Remove duplicates from a sorted array", "move zeros to the end", and "filter in place" are all this read/write two-pointer. The write index is also the new logical length.

## Max / min / second max in one pass

```java
int max = Integer.MIN_VALUE, second = Integer.MIN_VALUE;
for (int v : a) {
    if (v > max) { second = max; max = v; }
    else if (v > second && v != max) second = v;
}
```

Seeded from the extreme; "second largest distinct" needs the `v != max` guard. For the index of the max, track it alongside (Module 4's best-so-far).

## Kadane: maximum subarray sum

```java
long best = a[0], current = a[0];
for (int i = 1; i < a.length; i++) {
    current = Math.max(a[i], current + a[i]);    // extend the run or start fresh here
    best = Math.max(best, current);
}
```

Linear time, constant space, and the canonical "dynamic programming in one variable" example. Seeded from `a[0]` so all-negative arrays give the largest single element rather than 0.

## Matrix walks

```java
// transpose (square, in place): swap above the diagonal
for (int r = 0; r < n; r++)
    for (int c = r + 1; c < n; c++) swap(m, r, c);   // m[r][c] <-> m[c][r]

// rotate 90° clockwise: transpose, then reverse each row
// spiral: four bounds (top, bottom, left, right) shrinking inward
// neighbours: dr/dc direction arrays with a bounds check
```

`c = r + 1` in the transpose is the pairs pattern from Module 4 — each pair swapped once.

## Searching a sorted array

```java
int lo = 0, hi = a.length - 1;
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;
    if (a[mid] == target) return mid;
    if (a[mid] < target) lo = mid + 1; else hi = mid - 1;
}
return -1;                      // or: lo is the insertion point
```

The iterative form of Module 5's recursive search; `lo` after the loop is where the target would be inserted — the basis of "first element ≥ x" (lower bound) variants. `Arrays.binarySearch` does this for you when a plain "is it there" suffices.

## Boundary checklist for array code

- Empty array: does the code handle `length == 0` (seeding from `a[0]` throws)?
- One element: two-pointer loops with `i < j` should do nothing.
- All equal, all negative, already sorted, reversed: the usual edge inputs.
- `k` larger than `n` or negative in rotations: normalise with `((k % n) + n) % n`.
- Sums: `long`.

## Interview angle

- *"Rotate an array in place in O(1) extra space?"* Three reversals.
- *"Count character frequencies without a map?"* `int[26]` indexed by `c - 'a'`.
- *"Range sum queries fast?"* Prefix sums with a leading zero.
- *"Move zeros to the end preserving order?"* Read/write two pointers.

## Key takeaways

- Reverse with two indices (`i < j`); rotate with three reversals after normalising `k`.
- Small-integer values → index-as-key counting arrays.
- Prefix sums (`long`, size `n + 1`) turn range sums into subtractions.
- Read/write pointers filter in place; Kadane runs in one variable.
- Test empty, single, all-equal and all-negative inputs.

---
title: Loop patterns every program is made of
minutes: 14
---
Most loops are one of a dozen patterns: accumulate, count, find, check all or any, track a best, walk two things at once, generate pairs, read until a sentinel. Recognising the pattern lets you write the loop without thinking about it — and lets an interviewer see that you have. This lesson names them, shows the canonical form of each, and points out the boundary and initial-value traps in each.

## Accumulate

```java
long sum = 0;
for (int v : values) sum += v;

double product = 1.0;
for (double f : factors) product *= f;

StringBuilder sb = new StringBuilder();
for (String s : parts) sb.append(s);
```

The trap is the **identity** value: `0` for sums, `1` for products, an empty builder for concatenation. And the type: a sum of `int`s needs a `long` accumulator when it can overflow (Module 2).

## Count

```java
int evens = 0;
for (int v : values) if (v % 2 == 0) evens++;
```

A count is an accumulate of `1`s under a condition. A count over characters, words, or matches is the same shape.

## Find (first match)

```java
int index = -1;
for (int i = 0; i < arr.length; i++) {
    if (arr[i] == target) { index = i; break; }
}
```

Or, better, as a method with `return i;` and `return -1;` after the loop. The "not found" value must be one that cannot be a real answer: `-1` for indices, `null` for objects (or `Optional`, Module 15).

## All / any / none

```java
boolean allPositive = true;
for (int v : values) if (v <= 0) { allPositive = false; break; }

boolean anyNegative = false;
for (int v : values) if (v < 0) { anyNegative = true; break; }
```

Note the initial values: **all** starts `true` and looks for a counterexample; **any** starts `false` and looks for a witness. Both stop early. On an empty input, `all` is vacuously true and `any` is false — the mathematically right answers, and sometimes a surprise. As methods, these are `return false;` inside the loop and `return true;` after (for all), and the reverse for any.

## Best so far (max / min / argmax)

```java
int max = Integer.MIN_VALUE;
int maxIndex = -1;
for (int i = 0; i < arr.length; i++) {
    if (arr[i] > max) { max = arr[i]; maxIndex = i; }
}
```

Two ways to seed: with the type's extreme (`Integer.MIN_VALUE` for a max) or with the **first element** (`max = arr[0]`, loop from 1 — but then an empty array must be handled first). Seeding with `0` is the classic bug: an all-negative array reports a max of 0. `>` versus `>=` decides whether ties keep the first or the last occurrence — say which you want.

## Two pointers

```java
int lo = 0, hi = arr.length - 1;
while (lo < hi) {
    if (arr[lo] + arr[hi] == target) return true;
    if (arr[lo] + arr[hi] < target) lo++; else hi--;
}
```

Two indices moving toward each other (palindromes, pair sums in a sorted array, reversing in place) or in the same direction at different speeds (removing duplicates, sliding windows). The loop condition is `lo < hi` for "distinct pair", `lo <= hi` for "may meet".

## Sliding window

```java
int best = 0, windowSum = 0;
for (int i = 0; i < arr.length; i++) {
    windowSum += arr[i];
    if (i >= k) windowSum -= arr[i - k];       // drop the element that left the window
    if (i >= k - 1) best = Math.max(best, windowSum);
}
```

A fixed-size window over an array in one pass: add the incoming element, subtract the outgoing one. The two `if`s handle the warm-up while the window is still filling.

## Pairs and combinations

```java
for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++)     // j starts at i + 1: each unordered pair once, no (i, i)
        …
```

`j = 0` gives ordered pairs including self-pairs; `j = i` includes `(i, i)`; `j = i + 1` gives each pair once. Getting this bound wrong double-counts or misses the diagonal.

## Sentinel and end-of-input

```java
String line;
while ((line = br.readLine()) != null) { … }         // stream ends with null

int x;
while ((x = in.nextInt()) != 0) { … }                 // input ends with a 0 sentinel

while (in.hasNextInt()) { process(in.nextInt()); }    // no sentinel: test availability
```

The assignment-in-condition idiom `(x = read()) != END` reads and tests in one step; the parentheses around the assignment are mandatory because `!=` binds tighter than `=`.

## Parallel iteration

```java
for (int i = 0; i < Math.min(a.length, b.length); i++) {
    use(a[i], b[i]);
}
```

Two sequences in step: index both with one variable, and decide what happens when the lengths differ (stop at the shorter, or check they match up front).

## Running state

```java
int prev = arr[0];
for (int i = 1; i < arr.length; i++) {
    if (arr[i] < prev) return false;     // not sorted
    prev = arr[i];
}
```

Comparing each element with the previous one — sortedness, run detection, deltas. Start at index 1 and seed `prev` from index 0, after handling the empty case.

## Do-something-n-times

```java
for (int i = 0; i < n; i++) sb.append('*');
```

When the index is unused, some codebases write `for (int i = 0; i < n; i++)` anyway; `"*".repeat(n)` and `IntStream.range(0, n)` are the modern alternatives for the common cases.

## Choosing the shape

| Need | Shape |
| --- | --- |
| A total, a product, a concatenation | accumulate with the right identity |
| How many satisfy X | count |
| The first that satisfies X | find with early exit, return -1/null |
| Do all / does any satisfy X | all (start true) / any (start false), early exit |
| The largest/smallest and where | best-so-far seeded from the first element or the extreme |
| A pair with a property in sorted data | two pointers |
| Best fixed-length run | sliding window |
| Every pair | nested with `j = i + 1` |
| Read until done | sentinel / `null` / `hasNext` |

Almost every "medium" interview problem is two of these composed. Streams (Module 15) give one-line versions of accumulate, count, find, all/any and max — knowing the loop forms is what lets you read and debug the stream ones.

## Key takeaways

- Seed accumulators with the identity, maxima from the first element or the extreme — never 0.
- `all` starts true and hunts for a counterexample; `any` starts false and hunts for a witness; both exit early.
- Pairs: `j = i + 1`. Neighbours: start at 1 with `prev`. Windows: add incoming, drop outgoing.
- `(x = read()) != END` needs its parentheses.

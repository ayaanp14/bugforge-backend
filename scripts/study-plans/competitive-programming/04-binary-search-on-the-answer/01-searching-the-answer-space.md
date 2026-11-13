---
title: Binary search on the answer — guess, check, halve
minutes: 14
seo-title: Binary Search on the Answer: Monotone Predicates in C++
description: Binary search on the answer turns "find the least X that works" into a yes/no check and about 60 halvings. The template, monotonicity and C++ overflow traps.
question: What is binary search on the answer?
answer: Binary search on the answer is a technique for optimisation problems whose feasibility is monotone: if a value X works, every larger X works too. Instead of computing the best X directly, you write a check `ok(X)` and binary search the range of possible answers for the first X where it says yes. The cost is the check times about log2 of the range, roughly 30 to 60 checks.
q: How do I know if binary search on the answer applies?
a: Look for "minimise the maximum" or "maximise the minimum" in the statement, and ask whether a bigger (or smaller) answer only makes the check easier. If raising the limit can never turn a yes into a no, the predicate is monotone and the search works. If you cannot write a fast yes/no check for a fixed guess, it does not help.
q: What should lo and hi be in binary search on the answer?
a: `lo` must be a value that is certainly feasible or certainly the boundary from below, and `hi` one you can prove is feasible. For splitting an array, `lo` is the largest element and `hi` the total sum. A wrong bound silently returns a wrong answer, so derive both from the statement's limits.
q: Why does my binary search loop forever?
a: Usually because `mid` rounds the wrong way for the update. With `hi = mid` and `lo = mid + 1` use `mid = lo + (hi - lo) / 2`; with `lo = mid` and `hi = mid - 1` use `mid = lo + (hi - lo + 1) / 2`. Otherwise a two-element range never shrinks.
q: How many iterations does binary search on the answer take?
a: About log2 of the range's width. A range up to 10^9 needs 30 checks and one up to 10^18 needs 60, so even an O(n) check over 10^5 elements costs only a few million operations in total.
---
Some problems ask for the best value directly — "the smallest largest part", "the largest smallest gap" — and computing it is hard. Checking a *guess* is easy. Binary search on the answer turns the hard question into about sixty easy ones.

## The shape to look for

- The statement says **minimise the maximum** or **maximise the minimum**.
- For a fixed guess `X` you can answer **"is X achievable?"** quickly, usually greedily in O(n).
- The answers are **monotone**: once `X` works, every bigger `X` works too (or every smaller one, for a maximum). The row of answers reads no, no, …, no, yes, yes, …, yes.

That row is a sorted array of booleans, and binary search finds its first yes in log₂(range) steps.

## Watch it halve

Split `[7, 2, 5, 10, 8]` into `k = 2` contiguous parts so the largest part sum is as small as possible. The check for a limit `X`: walk left to right, start a new part whenever the next number would push the current one past `X`, and count the parts.

@figure halving

The answer can never be below the largest element (10) or above the total (32), so those are the bounds. Every check throws away half of what is left.

## The template

```cpp
ll lo = *max_element(a.begin(), a.end());       // certainly the floor
ll hi = accumulate(a.begin(), a.end(), 0LL);    // certainly feasible
while (lo < hi) {
    ll mid = lo + (hi - lo) / 2;                // rounds down
    if (ok(mid)) hi = mid;                      // mid works: the answer is mid or left of it
    else lo = mid + 1;                          // mid fails: the answer is right of it
}
// lo == hi == the first X with ok(X)
```

- **Minimise** (first yes): `hi = mid` / `lo = mid + 1`, `mid` rounds down.
- **Maximise** (last yes): `lo = mid` / `hi = mid - 1`, `mid = lo + (hi - lo + 1) / 2` rounds *up* — or the loop sticks on a two-value range.
- `lo + (hi - lo) / 2` never overflows; `(lo + hi) / 2` can when both are near 10^18.

## The traps

- **Sums in `int`.** A part sum of 10^5 values up to 10^9 is 10^14. Use `long long` for the range and the check.
- **A check that overflows.** Counting "products made by time T" adds up to n values of `T / t`, each up to 10^18. Stop as soon as the count reaches the target.
- **Wrong bounds.** If `hi` might be infeasible, the search returns `hi` anyway. Prove both bounds from the constraints.

```game
type: pick
title: Which way does the range move?
prompt: For each check result, pick the update that keeps the answer inside [lo, hi].
? Minimise the largest part. ok(mid) is true.
* hi = mid
- lo = mid + 1
- hi = mid - 1
> mid works, so the first yes is mid itself or to its left. Dropping mid would lose it.
? Minimise the largest part. ok(mid) is false.
* lo = mid + 1
- hi = mid
- lo = mid
> mid fails and so does everything below it, so the answer is strictly right of mid.
? Maximise the smallest gap. ok(mid) is true.
* lo = mid
- hi = mid
- lo = mid + 1
> A gap of mid is achievable, so the largest achievable gap is mid or more.
? With lo = mid as the update, how must mid be computed?
* lo + (hi - lo + 1) / 2
- lo + (hi - lo) / 2
- (lo + hi) / 2
> Rounding down with lo = mid leaves a two-value range unchanged forever. Round up.
? n = 10^5, values up to 10^9. How many checks does the search make?
- About 17
* About 47
- About 10^5
> The range is up to 10^14 wide, and log2 of 10^14 is about 47. Each check is O(n).
```

## More practice

- [Koko Eating Bananas](/problems/koko-eating-bananas) — minimise a speed.
- [Capacity To Ship Packages Within D Days](/problems/capacity-to-ship-packages-within-d-days) — the lesson's check, by days.
- [Split Array Largest Sum](/problems/split-array-largest-sum) — the figure's problem.
- [Magnetic Force Between Two Balls](/problems/magnetic-force-between-two-balls) — maximise the minimum.
- [Minimum Number of Days to Make m Bouquets](/problems/minimum-number-of-days-to-make-m-bouquets) — search over days.

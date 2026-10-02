---
title: Binary Search on the Answer
stage: binary-search
order: 2
minutes: 12
level: Intermediate
hub: binary-search
practice: sqrt-x, find-nth-root-of-m, koko-eating-bananas, find-the-smallest-divisor-given-a-threshold, capacity-to-ship-packages, minimum-number-of-days-to-make-m-bouquets, magnetic-force-between-two-balls, split-array-largest-sum
updated: 2026-10-03
seo-title: Binary Search on Answer: Feasibility Template & Examples
description: Learn binary search on the answer: monotone feasibility checks, ship capacity, Koko and square roots, with code in C++, Java, Python and JavaScript.
question: What is binary search on the answer?
answer: Binary search on the answer finds the smallest (or largest) value that satisfies a condition by searching the range of possible answers instead of an array. It works when the condition is monotone — if x works, every larger x works too — so checking the middle value discards half the range. With a check that costs O(n), the whole search costs O(n log R) for a range of size R.
q: When can I use binary search on the answer?
a: When the answer is a number in a known range and you can write a yes-or-no check, feasible(x), that is monotone: once it is true it stays true for every larger x, or for every smaller x when you maximise. Phrases such as "minimise the maximum", "maximise the minimum" and "the smallest speed or capacity such that" are the usual signs.
q: How do I choose lo and hi?
a: lo must be no larger than any possible answer — often the smallest value that could work at all, such as the heaviest package for a ship's capacity. hi must be a value you know is feasible, such as the total weight, which ships everything in one day. If no value in the range is guaranteed to work, check hi first and report that no answer exists.
q: What is the time complexity of binary search on the answer?
a: O(C × log R), where R is the size of the range of answers and C is the cost of one feasibility check — usually O(n), giving O(n log R). Because log₂ of a billion is about 30, even a range up to 10⁹ needs only about 30 checks.
q: How do I prove the feasibility check is monotone?
a: Show that any solution that works for x also works for x + 1 unchanged. A loading plan that never exceeds a capacity of c never exceeds c + 1; an eating schedule that finishes at speed k also finishes at speed k + 1. If you cannot make that argument, the search may skip the real answer.
q: How is it different from ordinary binary search?
a: Ordinary binary search looks for a position in a sorted array. Binary search on the answer looks for a value in a range of candidates, and the sorted array is the row of results of a feasibility check — false, false, then true from some point on. The loop is the same; only the test at mid changes.
---
Some problems do not ask you to find something in an array. They ask for a number: the smallest ship capacity that delivers every package within five days, the slowest eating speed that finishes the bananas in time, the largest distance at which three balls can be placed apart. There is no sorted array to search, yet these are binary search problems. The trick is to stop searching the input and search the **answer**. It builds directly on the template from the [binary search lesson](/roadmap/binary-search); read that first if `lo`, `hi` and `ans` are new to you.

## Why trying every answer is too slow

Take [Capacity To Ship Packages Within D Days](/problems/capacity-to-ship-packages). Packages with weights `[1, 2, ..., 10]` must be shipped **in the given order**, one trip a day, and each day's load may not exceed the ship's capacity. What is the least capacity that ships everything within 5 days?

Trying capacities one by one, simulating the loading for each, is far too slow at the real limits: up to 5 × 10⁴ packages weighing up to 500 put the capacity anywhere up to 2.5 × 10⁷, about 10¹² steps in all. Binary search over the same range needs about 25 simulations.

## The idea: search over answers, not indices

Ask of every candidate capacity, "does it ship everything within 5 days?", and the answers line up in a very particular way.

@figure answer-row

That row is exactly the shape the binary search template is built for. You never build it: you write **`feasible(x)`**, which computes one entry — "with capacity `x`, does the loading take at most 5 days?" — and binary search asks it about the middle of the range. `lo` and `hi` are no longer indices but the smallest and largest answers worth considering, and the search costs about log₂ R calls for a range of R answers. Everything hard is in writing `feasible` and proving its row switches only once.

## Why it works: the answers are monotone

Binary search on a row is correct only if the row is **monotone**: once `feasible` says yes, it says yes for every larger value. A row like "no, yes, no, yes" would make the middle meaningless. So prove it before coding, with one sentence: *a plan that works for x still works for x + 1*.

@figure greedy-days

The check must also be **correct**. Here it is a small [greedy algorithm](/roadmap/greedy-algorithms), and the proof is the standard "stays ahead" argument: after each day, greedy has shipped at least as many packages as any other valid loading, because it kept loading while anything fitted. So if any loading finishes within D days, greedy does.

## The feasible(x) template

The loop is the binary search template with `feasible(mid)` as its condition, in two mirror-image versions. **Minimise** problems ("the least capacity") want the first yes; **maximise** problems ("the largest square root", "the maximum minimum distance") want the last.

@figure two-templates

### Choosing lo and hi

A generous range costs only a logarithm, so prefer bounds that are obviously right over bounds that are tight:

- **`lo`**: no larger than any possible answer. For the ship, the heaviest package; for an eating speed, 1.
- **`hi`**: a value that certainly works. For the ship, the total weight, which ships everything in one day.
- **Starting `ans`**: `hi` when `hi` is known to work; −1 when the problem allows "impossible".
- **Types**: sums and products pass 2,147,483,647 easily; use 64-bit integers when the limits allow it.

## Example: capacity to ship packages

`daysNeeded(weights, capacity)` is the greedy loading; `feasible(capacity)` is `daysNeeded(...) <= days`. The search runs from the heaviest package to the total weight.

@figure search

### The code

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

// Days needed to ship the packages in order with this capacity (greedy loading).
int daysNeeded(const vector<int>& weights, int capacity) {
    int days = 1, load = 0;
    for (int w : weights) {
        if (load + w > capacity) {      // does not fit today: start a new day
            days++;
            load = 0;
        }
        load += w;
    }
    return days;
}

// Least capacity that ships everything within `days` days.
int shipWithinDays(const vector<int>& weights, int days) {
    int lo = 0, hi = 0;
    for (int w : weights) {
        lo = max(lo, w);                // must carry the heaviest package
        hi += w;                        // the total ships everything in one day
    }
    int ans = hi;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (daysNeeded(weights, mid) <= days) {   // feasible(mid)
            ans = mid;                  // mid works: try a smaller capacity
            hi = mid - 1;
        } else {
            lo = mid + 1;               // mid fails, and so does everything below it
        }
    }
    return ans;
}

int main() {
    vector<int> weights = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    cout << "weights:";
    for (int w : weights) cout << " " << w;
    cout << "\n";
    cout << "capacity 14 takes " << daysNeeded(weights, 14) << " days, capacity 15 takes "
         << daysNeeded(weights, 15) << " days\n";
    for (int days : {5, 1, 10}) {
        cout << "days = " << days << ": least capacity " << shipWithinDays(weights, days) << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // Days needed to ship the packages in order with this capacity (greedy loading).
    static int daysNeeded(int[] weights, int capacity) {
        int days = 1, load = 0;
        for (int w : weights) {
            if (load + w > capacity) {      // does not fit today: start a new day
                days++;
                load = 0;
            }
            load += w;
        }
        return days;
    }

    // Least capacity that ships everything within `days` days.
    static int shipWithinDays(int[] weights, int days) {
        int lo = 0, hi = 0;
        for (int w : weights) {
            lo = Math.max(lo, w);           // must carry the heaviest package
            hi += w;                        // the total ships everything in one day
        }
        int ans = hi;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (daysNeeded(weights, mid) <= days) {   // feasible(mid)
                ans = mid;                  // mid works: try a smaller capacity
                hi = mid - 1;
            } else {
                lo = mid + 1;               // mid fails, and so does everything below it
            }
        }
        return ans;
    }

    public static void main(String[] args) {
        int[] weights = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
        StringBuilder line = new StringBuilder("weights:");
        for (int w : weights) line.append(" ").append(w);
        System.out.println(line);
        System.out.println("capacity 14 takes " + daysNeeded(weights, 14) + " days, capacity 15 takes "
                + daysNeeded(weights, 15) + " days");
        for (int days : new int[] {5, 1, 10}) {
            System.out.println("days = " + days + ": least capacity " + shipWithinDays(weights, days));
        }
    }
}
```

```python
def days_needed(weights, capacity):
    """Days needed to ship the packages in order with this capacity (greedy loading)."""
    days, load = 1, 0
    for w in weights:
        if load + w > capacity:         # does not fit today: start a new day
            days += 1
            load = 0
        load += w
    return days


def ship_within_days(weights, days):
    """Least capacity that ships everything within `days` days."""
    lo = max(weights)                   # must carry the heaviest package
    hi = sum(weights)                   # the total ships everything in one day
    ans = hi
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if days_needed(weights, mid) <= days:   # feasible(mid)
            ans = mid                   # mid works: try a smaller capacity
            hi = mid - 1
        else:
            lo = mid + 1                # mid fails, and so does everything below it
    return ans


weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
print("weights:", *weights)
print(f"capacity 14 takes {days_needed(weights, 14)} days, "
      f"capacity 15 takes {days_needed(weights, 15)} days")
for days in (5, 1, 10):
    print(f"days = {days}: least capacity {ship_within_days(weights, days)}")
```

```javascript
// Days needed to ship the packages in order with this capacity (greedy loading).
function daysNeeded(weights, capacity) {
  let days = 1;
  let load = 0;
  for (const w of weights) {
    if (load + w > capacity) {
      // does not fit today: start a new day
      days++;
      load = 0;
    }
    load += w;
  }
  return days;
}

// Least capacity that ships everything within `days` days.
function shipWithinDays(weights, days) {
  let lo = 0;
  let hi = 0;
  for (const w of weights) {
    lo = Math.max(lo, w); // must carry the heaviest package
    hi += w; // the total ships everything in one day
  }
  let ans = hi;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (daysNeeded(weights, mid) <= days) {
      // feasible(mid)
      ans = mid; // mid works: try a smaller capacity
      hi = mid - 1;
    } else {
      lo = mid + 1; // mid fails, and so does everything below it
    }
  }
  return ans;
}

const weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
console.log(`weights: ${weights.join(" ")}`);
console.log(
  `capacity 14 takes ${daysNeeded(weights, 14)} days, capacity 15 takes ${daysNeeded(weights, 15)} days`
);
for (const days of [5, 1, 10]) {
  console.log(`days = ${days}: least capacity ${shipWithinDays(weights, days)}`);
}
```

```output
weights: 1 2 3 4 5 6 7 8 9 10
capacity 14 takes 6 days, capacity 15 takes 5 days
days = 5: least capacity 15
days = 1: least capacity 55
days = 10: least capacity 10
```

The `int` totals are safe here because the problem keeps the sum of weights below 2.5 × 10⁷. With larger limits, switch `hi`, `mid` and `load` to 64-bit integers.

## Example: integer square root

[Sqrt(x)](/problems/sqrt-x) asks for the square root of a non-negative integer rounded down: the **largest** `x` with `x × x <= n`. That is a maximise problem, and it is monotone because squaring a larger non-negative number gives a larger result. The range is `1..n`, with `ans = 0` covering `n = 0`.

The trap is the check: with `n` near 2³¹, `mid × mid` reaches about 10¹⁸, past the `int` limit and past 2⁵³, where JavaScript numbers stop being exact. Comparing `mid <= n / mid` with integer division gives the same answer for a positive `mid` and never overflows.

```cpp
#include <iostream>
using namespace std;

// Largest x with x * x <= n, for n >= 0.
int isqrt(int n) {
    int lo = 1, hi = n;
    int ans = 0;                       // covers n = 0, where the loop never runs
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (mid <= n / mid) {          // feasible: same as mid * mid <= n, no overflow
            ans = mid;                 // mid is small enough: try a larger one
            lo = mid + 1;
        } else {
            hi = mid - 1;              // mid is too big, and so is everything above it
        }
    }
    return ans;
}

int main() {
    for (int n : {0, 1, 8, 16, 2147483647}) {
        cout << "isqrt(" << n << ") = " << isqrt(n) << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // Largest x with x * x <= n, for n >= 0.
    static int isqrt(int n) {
        int lo = 1, hi = n;
        int ans = 0;                       // covers n = 0, where the loop never runs
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (mid <= n / mid) {          // feasible: same as mid * mid <= n, no overflow
                ans = mid;                 // mid is small enough: try a larger one
                lo = mid + 1;
            } else {
                hi = mid - 1;              // mid is too big, and so is everything above it
            }
        }
        return ans;
    }

    public static void main(String[] args) {
        for (int n : new int[] {0, 1, 8, 16, 2147483647}) {
            System.out.println("isqrt(" + n + ") = " + isqrt(n));
        }
    }
}
```

```python
def isqrt(n):
    """Largest x with x * x <= n, for n >= 0."""
    lo, hi = 1, n
    ans = 0                            # covers n = 0, where the loop never runs
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if mid <= n // mid:            # feasible: same as mid * mid <= n
            ans = mid                  # mid is small enough: try a larger one
            lo = mid + 1
        else:
            hi = mid - 1               # mid is too big, and so is everything above it
    return ans


for n in (0, 1, 8, 16, 2147483647):
    print(f"isqrt({n}) = {isqrt(n)}")
```

```javascript
// Largest x with x * x <= n, for n >= 0.
function isqrt(n) {
  let lo = 1;
  let hi = n;
  let ans = 0; // covers n = 0, where the loop never runs
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (mid <= Math.floor(n / mid)) {
      // feasible: same as mid * mid <= n, without the huge product
      ans = mid; // mid is small enough: try a larger one
      lo = mid + 1;
    } else {
      hi = mid - 1; // mid is too big, and so is everything above it
    }
  }
  return ans;
}

for (const n of [0, 1, 8, 16, 2147483647]) {
  console.log(`isqrt(${n}) = ${isqrt(n)}`);
}
```

```output
isqrt(0) = 0
isqrt(1) = 1
isqrt(8) = 2
isqrt(16) = 4
isqrt(2147483647) = 46340
```

The last line is the overflow test: 46,340² = 2,147,395,600 fits under the limit and 46,341² does not. With "`mid` to the power `k` is at most `m`" and an early exit once the product passes `m`, the same search solves [Find Nth Root of M](/problems/find-nth-root-of-m).

## The same pattern in other problems

Each new problem is a new `feasible` and a new range; the loop never changes.

- **[Koko Eating Bananas](/problems/koko-eating-bananas)**: a pile of `p` at speed `k` takes `(p + k - 1) / k` hours; feasible if the total is at most `h`. Minimise over `1` to the largest pile.
- **[Find the Smallest Divisor Given a Threshold](/problems/find-the-smallest-divisor-given-a-threshold)**: Koko with the numbers renamed.
- **[Minimum Number of Days to Make m Bouquets](/problems/minimum-number-of-days-to-make-m-bouquets)**: count runs of flowers bloomed by a given day; waiting longer only blooms more.
- **[Split Array Largest Sum](/problems/split-array-largest-sum)**: the ship problem exactly, with parts for days. "Minimise the maximum" is the phrase to remember.
- **[Magnetic Force Between Two Balls](/problems/magnetic-force-between-two-balls)**: "maximise the minimum" gap, the classic aggressive-cows problem, with a greedy placement as the check.

@figure magnetic

## Time and space complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| Try every answer in the range | O(R × C) | O(1) |
| Binary search on the answer | O(log R × C) | O(1) |
| Ship capacity / split array (C = n) | O(n log(sum of weights)) | O(1) |
| Koko eating bananas (C = n) | O(n log(largest pile)) | O(1) |
| Integer square root (C = 1) | O(log n) | O(1) |

R is the number of candidate answers and C the cost of one check. A range of 10⁹ takes about 30 checks, which is why these problems pair values up to 10⁹ with only 10⁵ elements. Sorting the input first, as for the magnetic balls, adds O(n log n) — see [sorting algorithms](/roadmap/sorting-algorithms).

## How to recognise binary search on the answer

- The question asks for a **minimum or maximum value** — a capacity, speed, time or distance — not a position.
- The phrases **"minimise the maximum"** or **"maximise the minimum"** appear, in words or in disguise.
- **Checking** a candidate is easy even though finding the answer directly is not: "if someone told me the speed, I could verify it in one pass".
- A more generous answer can only make the task **easier**. That is monotonicity.

## Common mistakes

- **Not proving monotonicity.** A row with two switches makes the search silently wrong.
- **A `lo` that is too small.** Starting the ship's capacity at 1 lets greedy "ship" a package that does not fit by giving it a day of its own.
- **Overflow inside the check**: `mid × mid` and sums of large weights; use 64 bits or divide.
- **Rounding the division down**: hours for a pile are `(p + k - 1) / k`, not `p / k`.
- **Assuming an answer exists**: if even `hi` might fail, check it first and return −1.

## Practice in this order

1. [Sqrt(x)](/problems/sqrt-x): the maximise template with an overflow-safe check.
2. [Find Nth Root of M](/problems/find-nth-root-of-m): the same with a power and an early exit.
3. [Koko Eating Bananas](/problems/koko-eating-bananas): minimise a speed; ceiling division.
4. [Find the Smallest Divisor Given a Threshold](/problems/find-the-smallest-divisor-given-a-threshold): Koko in disguise.
5. [Capacity To Ship Packages Within D Days](/problems/capacity-to-ship-packages): the first program above.
6. [Minimum Number of Days to Make m Bouquets](/problems/minimum-number-of-days-to-make-m-bouquets): a check that counts runs.
7. [Magnetic Force Between Two Balls](/problems/magnetic-force-between-two-balls): maximise the minimum, with a greedy placement.
8. [Split Array Largest Sum](/problems/split-array-largest-sum): minimise the maximum — the ship problem renamed.

The [binary search problem list](/challenges/binary-search) has many more. Next on the road, [sorting](/roadmap/sorting-algorithms) and [greedy algorithms](/roadmap/greedy-algorithms) take the greedy checks you have been writing and make them the whole solution.

---
title: Binary Search on the Answer
stage: binary-search
order: 2
minutes: 20
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
Some problems do not ask you to find something in an array. They ask for a number: the smallest ship capacity that delivers every package within five days, the slowest eating speed that finishes the bananas before the guard returns, the largest distance at which three balls can be placed apart. There is no sorted array to search, yet these are binary search problems — some of the most common medium-level questions in placement rounds.

The trick is to stop searching the input and search the **answer**. If you can check quickly whether a candidate answer works, and if every candidate above a working one also works, then the answers form a sorted row of "no, no, no, yes, yes, yes", and binary search finds where it switches. This lesson shows how to spot that shape, how to prove it is there, how to write the check, and how to pick the range. It builds directly on the template from the [binary search lesson](/roadmap/binary-search); read that first if `lo`, `hi` and `ans` are new to you. Every example is shown in C++, Java, Python and JavaScript.

## Why trying every answer is too slow

Take [Capacity To Ship Packages Within D Days](/problems/capacity-to-ship-packages). Packages with weights `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]` must be shipped **in the given order**, one ship trip a day, and the ship can carry at most its capacity each day. What is the least capacity that ships everything within 5 days?

The obvious approach tries capacities one by one, starting at the heaviest package (anything less cannot carry it), and simulates the loading for each until one works. With the real limits — up to 5 × 10⁴ packages each weighing up to 500 — the capacity can range up to 2.5 × 10⁷, and each simulation reads every package. Trying them all costs up to 2.5 × 10⁷ × 5 × 10⁴ ≈ 10¹² steps. Binary search over the same range needs about 25 simulations: roughly 1.25 million steps.

## The idea: search over answers, not indices

Write down, for every candidate capacity, whether it ships everything within 5 days:

```text
 capacity:   10  11  12  13  14  15  16  17  ...  54  55
 works?:      no  no  no  no  no yes yes yes  ... yes yes
                                  ^
                     the answer: the first "yes"
```

That row is exactly the shape the binary search template is built for: false for a while, then true for the rest. You do not need to build the row. You only need a function that computes one entry when asked:

- **`feasible(x)`** answers "does the answer `x` work?" — here, "with capacity `x`, does the loading take at most 5 days?".
- Binary search asks it about the middle of the range, keeps the half that still contains the switch, and repeats.
- `lo` and `hi` are not indices any more. They are the smallest and largest answers worth considering.

The search costs about log₂ R calls of `feasible`, where R is the size of the range. Everything hard about these problems is in writing `feasible` and proving its row has a single switch.

## Why it works: the answers are monotone

Binary search on any row is correct only if the row is **monotone**: once `feasible` says yes, it says yes for every larger value. If the row went "no, yes, no, yes", looking at the middle would tell you nothing about either side. So before writing any code, prove monotonicity. The proof is usually one sentence of the form *a plan that works for x still works for x + 1*.

For the ship: suppose some way of loading the packages fits within 5 days at capacity `c`. Every day's load is at most `c`, so it is certainly at most `c + 1`. The same loading works at the larger capacity. Hence `feasible(c)` implies `feasible(c + 1)`, and by repeating, every larger capacity works too. The row is "no … no, yes … yes", and binary search is safe.

The feasibility check must also be **correct**, not just fast, and here it is a small [greedy algorithm](/roadmap/greedy-algorithms): load packages onto today's trip until the next one would exceed the capacity, then start a new day. Why is filling each day as full as possible never worse? Compare the greedy loading with any other valid loading. After the first day, greedy has shipped at least as many packages, because it kept loading as long as anything fitted. If greedy is ahead (or level) after some day, then the next day starts with greedy at or beyond the other plan's position, and the same reasoning keeps it ahead after that day too. So if any loading finishes within D days, greedy does. This "stays ahead" argument is the standard proof for feasibility checks of this kind.

## The feasible(x) template

The loop is the template from the binary search lesson, with `condition(mid)` replaced by `feasible(mid)`. There are two mirror-image versions, depending on whether you want the smallest or the largest value that works:

```text
# smallest x with feasible(x)          # largest x with feasible(x)
# row: no no no yes yes yes            # row: yes yes yes no no no
lo, hi = lowest, highest               lo, hi = lowest, highest
ans = highest                          ans = lowest
while lo <= hi:                        while lo <= hi:
    mid = lo + (hi - lo) / 2               mid = lo + (hi - lo) / 2
    if feasible(mid):                      if feasible(mid):
        ans = mid                              ans = mid
        hi = mid - 1   # try smaller           lo = mid + 1   # try larger
    else:                                  else:
        lo = mid + 1                           hi = mid - 1
return ans                             return ans
```

The range is inclusive, every update drops `mid`, and the loop must end — the same guarantees as before. **Minimise** problems ("the least capacity", "the minimum speed", "the smallest divisor") use the left version. **Maximise** problems ("the largest square root", "the maximum minimum distance") use the right one; there `feasible` is "x is small enough", which is true and then false.

### Choosing lo and hi

The range must contain the answer, and it costs only a logarithm to make it generous, so prefer bounds that are obviously right over bounds that are tight:

- **`lo`**: a value no larger than any possible answer. For the ship it is the heaviest package: a smaller capacity cannot carry that package at all. For eating speed it is 1.
- **`hi`**: a value that certainly works. For the ship it is the total weight, which ships everything in one day. For eating speed it is the largest pile, which finishes one pile an hour.
- **Starting `ans`**: the value to return if the loop never finds anything better. With `hi` known to work, set `ans = hi`. If the problem allows "impossible", start `ans` at −1 and let the caller check.
- **Types**: the range is often far larger than any array index. Sums of weights, products and times can pass 2,147,483,647, so use `long` (or `long long`) for `lo`, `hi`, `mid` and the running totals inside `feasible` whenever the limits allow it.

## Example: capacity to ship packages

`daysNeeded(weights, capacity)` is the greedy loading from above; `feasible(capacity)` is `daysNeeded(...) <= days`. The search runs from the heaviest package to the total weight.

### Dry run

Weights `1..10`, days 5. The range starts at `lo = 10` (heaviest) and `hi = 55` (total):

| Step | lo | hi | mid | Days with capacity mid | Feasible? | Action |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 10 | 55 | 32 | 2 | yes | ans = 32, hi = 31 |
| 2 | 10 | 31 | 20 | 4 | yes | ans = 20, hi = 19 |
| 3 | 10 | 19 | 14 | 6 | no | lo = 15 |
| 4 | 15 | 19 | 17 | 4 | yes | ans = 17, hi = 16 |
| 5 | 15 | 16 | 15 | 5 | yes | ans = 15, hi = 14 |
| end | 15 | 14 | | | | answer 15 |

At capacity 15 the trips are `1+2+3+4+5`, `6+7`, `8`, `9`, `10`: exactly five days. At 14 the first trip can only take `1+2+3+4`, and the loading spills into a sixth day. Five simulations replaced up to forty-six.

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

The `int` totals are safe here because the problem's limits keep the sum of weights below 2.5 × 10⁷. When the limits are larger, switch `hi`, `mid` and `load` to 64-bit integers.

## Example: integer square root

[Sqrt(x)](/problems/sqrt-x) asks for the square root of a non-negative integer rounded down, without a library call: the **largest** `x` with `x × x <= n`. That is a maximise problem. `feasible(x)` is "`x × x` is at most `n`", which is true for small `x` and false from some point on, and the answer is the last true value. It is monotone because squaring a larger non-negative number gives a larger result.

The range is `1..n` (with `ans = 0` covering `n = 0`). The trap is the check itself. With `n` up to 2,147,483,647, `mid` starts near a billion, and `mid × mid` is about 10¹⁸ — far past the `int` limit in C++ and Java, and past 2⁵³, where JavaScript numbers stop being exact. There are two clean fixes: compute the product in 64 bits (`(long long)mid * mid` in C++, `(long) mid * mid` in Java), or avoid the product altogether by comparing `mid <= n / mid` with integer division. For a positive integer `mid` the two tests agree exactly, and the division never overflows in any language, so the code below uses it.

### The code

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

The last line is the overflow test: 46,340² = 2,147,395,600 fits under the limit and 46,341² = 2,147,488,281 does not. The same search, with the check "`mid` raised to the power `k` is at most `m`" and an early exit once the running product passes `m`, solves [Find Nth Root of M](/problems/find-nth-root-of-m).

## The same pattern in other problems

Once you have the template, each new problem is a new `feasible` and a new range. The loop never changes.

- **[Koko Eating Bananas](/problems/koko-eating-bananas).** Koko eats at most `k` bananas an hour from one pile and must finish within `h` hours. A pile of `p` takes `ceil(p / k)` hours, written `(p + k - 1) / k` in integer arithmetic. `feasible(k)` is "the total hours are at most `h`"; the range is `1` to the largest pile; minimise. A faster speed never takes longer, so the row is monotone.
- **[Find the Smallest Divisor Given a Threshold](/problems/find-the-smallest-divisor-given-a-threshold).** The same check with a different story: the sum of `ceil(x / d)` must stay within the threshold. Koko with the numbers renamed.
- **[Minimum Number of Days to Make m Bouquets](/problems/minimum-number-of-days-to-make-m-bouquets).** `feasible(day)` counts runs of adjacent flowers already bloomed by that day. Waiting longer only blooms more flowers, so it is monotone; the range is the earliest to the latest bloom day.
- **[Split Array Largest Sum](/problems/split-array-largest-sum).** Split an array into `k` contiguous parts so that the largest part sum is as small as possible. This is the ship problem exactly: a part is a day, `k` is the number of days, and the answer is the least capacity. "Minimise the maximum" is the phrase to remember, and the book-allocation and painter's-partition problems are the same question again.
- **[Magnetic Force Between Two Balls](/problems/magnetic-force-between-two-balls).** Place `m` balls in sorted positions so that the smallest gap is as large as possible — the classic "aggressive cows" problem. `feasible(d)` places balls greedily from the left, each at the first position at least `d` past the previous one, and checks that `m` fit. A smaller required gap is always easier, so the row is "yes … yes, no … no": maximise.

## Time and space complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| Try every answer in the range | O(R × C) | O(1) |
| Binary search on the answer | O(log R × C) | O(1) |
| Ship capacity / split array (C = n) | O(n log(sum of weights)) | O(1) |
| Koko eating bananas (C = n) | O(n log(largest pile)) | O(1) |
| Integer square root (C = 1) | O(log n) | O(1) |

Here R is the number of candidate answers and C the cost of one feasibility check. The logarithm is what makes huge ranges harmless: a range of 10⁹ values takes about 30 checks, and a range of 10¹⁸ about 60. That is why these problems often have values up to 10⁹ in the constraints but only 10⁵ elements: the statement is telling you that O(n log R) is the intended cost. If the input must be sorted first, as for the magnetic balls, add O(n log n) — see [sorting algorithms](/roadmap/sorting-algorithms).

## How to recognise binary search on the answer

- The question asks for a **minimum or maximum value** — a capacity, speed, time, distance or size — rather than a position or a list.
- The phrases **"minimise the maximum"** or **"maximise the minimum"** appear, in words or in disguise ("the largest sum among the parts should be as small as possible").
- **Checking** a candidate answer is easy, even though finding the answer directly is not. If you catch yourself thinking "if someone told me the speed, I could verify it in one pass", that is the signal.
- Making the answer more generous (more capacity, more time, a smaller required gap) can only make the task **easier**. That is monotonicity.
- The answer's range is enormous (up to 10⁹ or more) compared with the input size.

## Common mistakes

- **Not proving monotonicity.** If the feasibility row has more than one switch, the search silently returns a wrong value. Say the "works for x, so works for x + 1" sentence before coding.
- **A `lo` that is too small.** Starting the ship's capacity at 1 instead of the heaviest package makes `feasible` lie: the greedy loop happily "ships" a package that does not fit by giving it a day of its own. Either start at the largest weight or make `feasible` reject packages heavier than the capacity.
- **Using the wrong half of the template.** Minimising keeps `ans` and moves `hi` down on success; maximising moves `lo` up. Swap them and the search converges on the wrong end.
- **Overflow inside the check.** `mid × mid`, sums of large weights and counts of hours all overflow 32-bit integers. Use 64-bit totals, or compare with division as in the square root.
- **Rounding the division the wrong way.** Hours for a pile are `ceil(p / k)`, not `p / k`. In integer arithmetic write `(p + k - 1) / k`; in JavaScript use `Math.ceil`.
- **Searching for a value that need not exist.** If even `hi` might be infeasible, check it first, and return −1 when it fails rather than a meaningless `ans`.

## Practice in this order

Start where the check is one line, then move to checks that need a greedy proof of their own:

1. [Sqrt(x)](/problems/sqrt-x): the maximise template with an overflow-safe check.
2. [Find Nth Root of M](/problems/find-nth-root-of-m): the same with a power, and an early exit.
3. [Koko Eating Bananas](/problems/koko-eating-bananas): minimise a speed; ceiling division.
4. [Find the Smallest Divisor Given a Threshold](/problems/find-the-smallest-divisor-given-a-threshold): Koko in disguise — recognise it.
5. [Capacity To Ship Packages Within D Days](/problems/capacity-to-ship-packages): the first program above.
6. [Minimum Number of Days to Make m Bouquets](/problems/minimum-number-of-days-to-make-m-bouquets): a check that counts runs.
7. [Magnetic Force Between Two Balls](/problems/magnetic-force-between-two-balls): maximise the minimum, with a greedy placement check.
8. [Split Array Largest Sum](/problems/split-array-largest-sum): minimise the maximum — the ship problem under another name.

The [binary search problem list](/challenges/binary-search) has many more, from easy to hard. Once these feel routine, the next stage of the roadmap takes the greedy checks you have been writing and makes them the whole solution: [sorting](/roadmap/sorting-algorithms) and [greedy algorithms](/roadmap/greedy-algorithms).

---
title: Kadane's Algorithm (Maximum Subarray Sum)
stage: prefix-sums
order: 2
minutes: 18
level: Intermediate
hub: arrays
practice: best-time-to-buy-and-sell-stock, maximum-subarray, maximum-absolute-sum-of-any-subarray, best-sightseeing-pair, maximum-sum-circular-subarray, maximum-product-subarray, maximum-subarray-sum-with-one-deletion, k-concatenation-maximum-sum
updated: 2026-10-03
seo-title: Kadane's Algorithm: Maximum Subarray Sum in O(n)
description: Learn Kadane's algorithm for the maximum subarray sum: why it works, all-negative arrays, circular and product variants, in C++, Java, Python and JavaScript.
question: What is Kadane's algorithm?
answer: Kadane's algorithm finds the largest sum of any contiguous subarray in one pass. At each element it keeps the best sum of a subarray that ends there: either the element on its own, or the element added to the best sum ending just before it, whichever is larger. The answer is the largest of those values. It runs in O(n) time with O(1) extra space.
q: Does Kadane's algorithm work when every number is negative?
a: Yes, as long as the running values start at the first element rather than at 0. The answer is then the largest single element, the least negative one. The common shortcut that starts the best sum at 0 returns 0 — the empty subarray — which is wrong whenever the subarray must contain at least one element.
q: Is Kadane's algorithm dynamic programming?
a: Yes. It is a one-dimensional dynamic programme: the state is the best sum of a subarray ending at index i, the recurrence is best(i) = max(nums[i], best(i − 1) + nums[i]), and since each state needs only the one before it, the table shrinks to a single variable. For many people it is the first dynamic programming problem they solve.
q: How do you find where the maximum subarray starts and ends?
a: Remember where the current run began. Whenever the running sum restarts at the current element, record that index as the run's start; whenever the running sum beats the best so far, copy the run's start and the current index as the answer's bounds. The extra cost is two integers.
q: How does Kadane's algorithm handle a circular array?
a: A best subarray in a circular array either does not wrap, which ordinary Kadane finds, or wraps around the end, in which case the elements it leaves out form an ordinary subarray with the smallest possible sum. So the answer is the larger of the normal maximum and the total minus the minimum subarray sum — unless every number is negative, when only the normal maximum is valid.
q: What is the time complexity of Kadane's algorithm?
a: O(n) time, with constant work per element, and O(1) extra space. Checking every subarray is O(n²) with running sums and O(n³) without them, and the divide-and-conquer solution is O(n log n), so Kadane's single pass is the best possible: any algorithm must at least read every element.
---
Given an array of numbers, some positive and some negative, which contiguous stretch has the largest sum? This is the **maximum subarray problem**. It is asked directly in interviews as [Maximum Subarray](/problems/maximum-subarray), and it hides inside many other questions: the best time to buy and sell a stock, the most profitable run of days for a shop, the strongest stretch of a signal. **Kadane's algorithm** solves it in a single pass with two variables, and the reasoning behind it is the gentlest possible introduction to [dynamic programming](/roadmap/dynamic-programming).

This lesson states the problem, shows why the brute force is too slow, builds the algorithm from one question — *what is the best sum of a subarray that ends here?* — and proves that the answer is right. It then covers the all-negative case that trips up the popular version, how to return the subarray itself, how the algorithm is really a [prefix sum](/roadmap/prefix-sum) argument in disguise, and two variations interviewers love: the circular array and the maximum product. Every example is in C++, Java, Python and JavaScript.

## The maximum subarray problem

A **subarray** is a contiguous, non-empty part of an array: you may cut elements off either end, but not out of the middle. For

```text
 index:    0   1   2   3   4   5   6   7   8
 nums:  [ -2,  1, -3,  4, -1,  2,  1, -5,  4 ]
                       |-------------|
                       4 - 1 + 2 + 1 = 6
```

the answer is 6, from index 3 to index 6. Notice what makes the problem interesting. The best subarray contains a negative number, −1, because the elements on either side of it more than pay for it. And it stops before −5, because nothing after −5 earns enough to make up for it. A rule such as "take the positive numbers" fails, because the result must be contiguous; and the [sliding window](/roadmap/sliding-window) fails, because with negative numbers there is no rule for when shrinking the window is safe.

## Why checking every subarray is too slow

The brute force tries every start and every end. Keeping a running sum as the end moves avoids re-adding, but there are still about n²/2 pairs of ends:

```text
best = nums[0]
for start in 0 .. n-1:
    sum = 0
    for end in start .. n-1:
        sum = sum + nums[end]
        best = max(best, sum)
```

With n = 100,000 that is about 5 × 10⁹ additions, roughly fifty times what a judge allows in a second. Without the running sum, re-adding each subarray from scratch, it is O(n³). A divide-and-conquer solution — best in the left half, best in the right half, best crossing the middle — brings it to O(n log n). Kadane's algorithm does it in O(n), which cannot be beaten: any algorithm has to look at every element at least once.

## The idea: the best sum ending here

Instead of asking "what is the best subarray?", ask a narrower question at every index i: *what is the best sum of a subarray that ends exactly at i?* Call that value `cur`. A subarray that ends at i has only two possible shapes:

- **Restart:** it is `nums[i]` on its own.
- **Extend:** it is some subarray ending at i − 1, with `nums[i]` added on the end. The best of these is the best sum ending at i − 1, plus `nums[i]`.

So the new `cur` is whichever is larger:

```text
cur  = max(nums[i], cur + nums[i])      best sum of a subarray ending at i
best = max(best, cur)                   best sum of any subarray seen so far
```

Start both at `nums[0]` and walk once from left to right. The comparison has a plain reading: `cur + nums[i]` is smaller than `nums[i]` exactly when `cur` is negative. **A run with a negative sum is a debt**: anything you attach to it would be better off without it. So the rule becomes "extend the current run while its sum is not negative; when it goes negative, start again at the next element".

## Why it works

Two claims make the algorithm correct, and both are short.

First, the update really does compute the best sum ending at i. Every subarray ending at i is either `nums[i]` alone or a subarray ending at i − 1 with `nums[i]` added. Adding the same `nums[i]` to every candidate of the second kind does not change which candidate is largest, so the best of them is the best sum ending at i − 1 plus `nums[i]`. Comparing that with `nums[i]` alone covers every subarray that ends at i, and nothing else.

Second, the best of those values is the answer. Every subarray ends at some index, so the best subarray overall is the best subarray ending at the right index, and `best` takes the maximum over all of them.

That is dynamic programming in its smallest form: a **state** (the best sum ending at i), a **recurrence** built from the previous state, and an answer read off the states. A general DP keeps a table of states; here each state needs only the one before it, so the table collapses into the single variable `cur`. The restart rule is the recurrence spelled out: when the best sum ending at i − 1 is negative, no subarray ending at i should include it, and the best one starts afresh at i.

### Dry run

The example array, with `start` marking where the current run began:

| i | nums[i] | cur before | Decision | cur | start | best (range) |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | −2 | — | first element | −2 | 0 | −2 (0 to 0) |
| 1 | 1 | −2 | negative: restart | 1 | 1 | 1 (1 to 1) |
| 2 | −3 | 1 | extend | −2 | 1 | 1 (1 to 1) |
| 3 | 4 | −2 | negative: restart | 4 | 3 | 4 (3 to 3) |
| 4 | −1 | 4 | extend | 3 | 3 | 4 (3 to 3) |
| 5 | 2 | 3 | extend | 5 | 3 | 5 (3 to 5) |
| 6 | 1 | 5 | extend | 6 | 3 | 6 (3 to 6) |
| 7 | −5 | 6 | extend | 1 | 3 | 6 (3 to 6) |
| 8 | 4 | 1 | extend | 5 | 3 | 6 (3 to 6) |

Row 4 shows the run paying for a negative element: 4 − 1 = 3 is still worth carrying. Row 8 shows a run that has shrunk but stayed positive: 1 + 4 = 5 beats 4 alone, so the run continues, but it never catches the best.

### The code

To return the subarray as well as its sum, keep `start`, the index where the current run began. Each restart moves `start` to i; each new best copies `start` and i as the answer's bounds. The test `cur < 0` is the same as `nums[i] > cur + nums[i]`; when `cur` is exactly 0 both choices give the same sum, and the code extends.

```cpp
#include <iostream>
#include <vector>
using namespace std;

struct Best { int sum, start, end; };

// Largest sum of a non-empty contiguous subarray, with where it starts and ends.
Best maxSubarray(const vector<int>& nums) {
    int cur = nums[0], start = 0;        // best sum of a subarray ending here, and where it starts
    Best best = {nums[0], 0, 0};
    for (int i = 1; i < (int)nums.size(); i++) {
        if (cur < 0) {                   // a negative run only drags nums[i] down:
            cur = nums[i];               // restart at i
            start = i;
        } else {
            cur += nums[i];              // extend the run to i
        }
        if (cur > best.sum) best = {cur, start, i};
    }
    return best;
}

int main() {
    vector<vector<int>> tests = {{-2, 1, -3, 4, -1, 2, 1, -5, 4}, {-3, -1, -2}};
    for (const vector<int>& nums : tests) {
        Best b = maxSubarray(nums);
        cout << "Maximum sum " << b.sum << " from index " << b.start << " to " << b.end << ":";
        for (int i = b.start; i <= b.end; i++) cout << " " << nums[i];
        cout << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // Largest sum of a non-empty contiguous subarray, as {sum, start, end}.
    static int[] maxSubarray(int[] nums) {
        int cur = nums[0], start = 0;        // best sum of a subarray ending here, and where it starts
        int[] best = {nums[0], 0, 0};
        for (int i = 1; i < nums.length; i++) {
            if (cur < 0) {                   // a negative run only drags nums[i] down:
                cur = nums[i];               // restart at i
                start = i;
            } else {
                cur += nums[i];              // extend the run to i
            }
            if (cur > best[0]) best = new int[] {cur, start, i};
        }
        return best;
    }

    public static void main(String[] args) {
        int[][] tests = {{-2, 1, -3, 4, -1, 2, 1, -5, 4}, {-3, -1, -2}};
        for (int[] nums : tests) {
            int[] b = maxSubarray(nums);
            StringBuilder line = new StringBuilder("Maximum sum " + b[0] + " from index " + b[1] + " to " + b[2] + ":");
            for (int i = b[1]; i <= b[2]; i++) line.append(" ").append(nums[i]);
            System.out.println(line);
        }
    }
}
```

```python
def max_subarray(nums):
    """Largest sum of a non-empty contiguous subarray, as (sum, start, end)."""
    cur, start = nums[0], 0         # best sum of a subarray ending here, and where it starts
    best = (nums[0], 0, 0)
    for i in range(1, len(nums)):
        if cur < 0:                 # a negative run only drags nums[i] down:
            cur = nums[i]           # restart at i
            start = i
        else:
            cur += nums[i]          # extend the run to i
        if cur > best[0]:
            best = (cur, start, i)
    return best


tests = [[-2, 1, -3, 4, -1, 2, 1, -5, 4], [-3, -1, -2]]
for nums in tests:
    total, lo, hi = max_subarray(nums)
    print(f"Maximum sum {total} from index {lo} to {hi}:", *nums[lo:hi + 1])
```

```javascript
// Largest sum of a non-empty contiguous subarray, as [sum, start, end].
function maxSubarray(nums) {
  let cur = nums[0]; // best sum of a subarray ending here
  let start = 0; // and where it starts
  let best = [nums[0], 0, 0];
  for (let i = 1; i < nums.length; i++) {
    if (cur < 0) {
      // a negative run only drags nums[i] down: restart at i
      cur = nums[i];
      start = i;
    } else {
      cur += nums[i]; // extend the run to i
    }
    if (cur > best[0]) best = [cur, start, i];
  }
  return best;
}

const tests = [[-2, 1, -3, 4, -1, 2, 1, -5, 4], [-3, -1, -2]];
for (const nums of tests) {
  const [sum, lo, hi] = maxSubarray(nums);
  console.log(`Maximum sum ${sum} from index ${lo} to ${hi}: ${nums.slice(lo, hi + 1).join(" ")}`);
}
```

```output
Maximum sum 6 from index 3 to 6: 4 -1 2 1
Maximum sum -1 from index 1 to 1: -1
```

## The all-negative case

The second test above is the one that catches people out. Many tutorials teach a shorter version:

```text
cur = 0, best = 0
for x in nums:
    cur  = max(0, cur + x)      # never let the run go below zero
    best = max(best, cur)
```

On `[-3, -1, -2]` it returns 0. That 0 is the sum of the **empty** subarray, which the problem does not allow: a subarray must contain at least one element, so the right answer is −1, the least negative number. The shortcut is correct only when an empty choice is genuinely allowed — "buy and sell at most once, or not at all" in [Best Time to Buy and Sell Stock](/problems/best-time-to-buy-and-sell-stock), or the empty subarray that [K-Concatenation Maximum Sum](/problems/k-concatenation-maximum-sum) permits.

The fix is to start both values at `nums[0]`, as the code above does. Starting `best` at the smallest integer instead also works for `best`, but starting `cur` there is dangerous: `cur + nums[i]` can overflow before the comparison throws it away.

## The prefix-sum view

Kadane's algorithm sits in the prefix-sums stage for a reason. With the prefix array `P`, where `P[k]` is the sum of the first k numbers, the sum of `nums[i..j]` is `P[j + 1] - P[i]`. For a fixed end j that is largest when `P[i]` is as small as possible, so

```text
best sum ending at j = P[j + 1] - (smallest of P[0], P[1], ..., P[j])
```

Keep a running minimum of the prefixes and the problem becomes "the largest rise from an earlier low point" — which is exactly [Best Time to Buy and Sell Stock](/problems/best-time-to-buy-and-sell-stock), with prices in place of prefix sums. For the example array the numbers match Kadane's `cur` column one for one:

| j | nums[j] | P[j + 1] | smallest P so far | P[j + 1] − smallest | Kadane's cur |
| --- | --- | --- | --- | --- | --- |
| 0 | −2 | −2 | 0 | −2 | −2 |
| 1 | 1 | −1 | −2 | 1 | 1 |
| 2 | −3 | −4 | −2 | −2 | −2 |
| 3 | 4 | 0 | −4 | 4 | 4 |
| 4 | −1 | −1 | −4 | 3 | 3 |
| 5 | 2 | 1 | −4 | 5 | 5 |
| 6 | 1 | 2 | −4 | 6 | 6 |
| 7 | −5 | −3 | −4 | 1 | 1 |
| 8 | 4 | 1 | −4 | 5 | 5 |

The two views are the same algorithm. Kadane restarts exactly when `cur` goes negative, and `cur` is negative exactly when the current prefix has dropped below every earlier one — when the "smallest prefix so far" changes. The restart index is the new low point. Seeing both helps: Kadane is easier to extend to products and deletions, while the prefix view is the one that generalises to "best sum ending at j with some constraint on the start".

## Variations: the circular array and the maximum product

### Maximum circular subarray

In [Maximum Sum Circular Subarray](/problems/maximum-sum-circular-subarray) the array wraps around: a subarray may run off the end and continue from the start. Split the possibilities in two:

```text
 not wrapping:   [ .  .  #  #  #  .  . ]     ordinary Kadane finds it
 wrapping:       [ #  #  .  .  .  #  # ]     the part left out is an ordinary subarray
```

A wrapping subarray keeps both ends and leaves out a contiguous middle. Its sum is the total minus that middle, so the best wrapping subarray leaves out the middle with the **smallest** sum — which Kadane with `min` in place of `max` finds in the same pass. The answer is the larger of the two cases, with one exception: when every number is negative, the smallest "middle" is the whole array and "total minus everything" describes an empty subarray. That case is detected by the ordinary maximum being negative, and the answer is then the ordinary maximum.

### Maximum product subarray

[Maximum Product Subarray](/problems/maximum-product-subarray) asks for the largest product instead of the largest sum. The extend-or-restart idea survives, but one number is no longer enough to carry, because a negative factor turns the most negative product into the largest one. So keep two values: `hi`, the largest product of a subarray ending here, and `lo`, the smallest. When the new element is negative, swap them before extending. A zero sets both to 0, and the next element restarts naturally through the `max(x, …)` comparison.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// Largest sum of a subarray that may wrap around the end of the array.
int maxCircular(const vector<int>& nums) {
    int curMax = nums[0], bestMax = nums[0];   // Kadane for the largest sum
    int curMin = nums[0], bestMin = nums[0];   // the same for the smallest sum
    int total = nums[0];
    for (size_t i = 1; i < nums.size(); i++) {
        int x = nums[i];
        curMax = max(x, curMax + x);
        bestMax = max(bestMax, curMax);
        curMin = min(x, curMin + x);
        bestMin = min(bestMin, curMin);
        total += x;
    }
    if (bestMax < 0) return bestMax;           // all negative: a wrap would leave nothing
    return max(bestMax, total - bestMin);      // wrapping = everything but the smallest middle
}

// Largest product of a subarray: the largest and the smallest product ending here.
long long maxProduct(const vector<int>& nums) {
    long long hi = nums[0], lo = nums[0], best = nums[0];
    for (size_t i = 1; i < nums.size(); i++) {
        long long x = nums[i];
        if (x < 0) swap(hi, lo);               // a negative factor turns the smallest into the largest
        hi = max(x, hi * x);
        lo = min(x, lo * x);
        best = max(best, hi);
    }
    return best;
}

string show(const vector<int>& nums) {
    string s = "[";
    for (size_t i = 0; i < nums.size(); i++) s += (i ? ", " : "") + to_string(nums[i]);
    return s + "]";
}

int main() {
    vector<vector<int>> circular = {{5, -3, 5}, {1, -2, 3, -2}, {-3, -2, -3}};
    for (const auto& nums : circular) cout << "circular " << show(nums) << ": " << maxCircular(nums) << "\n";
    vector<vector<int>> products = {{2, 3, -2, 4}, {-2, 3, -4}, {-2, 0, -1}};
    for (const auto& nums : products) cout << "product " << show(nums) << ": " << maxProduct(nums) << "\n";
    return 0;
}
```

```java
import java.util.Arrays;

public class Main {
    // Largest sum of a subarray that may wrap around the end of the array.
    static int maxCircular(int[] nums) {
        int curMax = nums[0], bestMax = nums[0];   // Kadane for the largest sum
        int curMin = nums[0], bestMin = nums[0];   // the same for the smallest sum
        int total = nums[0];
        for (int i = 1; i < nums.length; i++) {
            int x = nums[i];
            curMax = Math.max(x, curMax + x);
            bestMax = Math.max(bestMax, curMax);
            curMin = Math.min(x, curMin + x);
            bestMin = Math.min(bestMin, curMin);
            total += x;
        }
        if (bestMax < 0) return bestMax;           // all negative: a wrap would leave nothing
        return Math.max(bestMax, total - bestMin); // wrapping = everything but the smallest middle
    }

    // Largest product of a subarray: the largest and the smallest product ending here.
    static long maxProduct(int[] nums) {
        long hi = nums[0], lo = nums[0], best = nums[0];
        for (int i = 1; i < nums.length; i++) {
            long x = nums[i];
            if (x < 0) {                           // a negative factor turns the smallest into the largest
                long t = hi;
                hi = lo;
                lo = t;
            }
            hi = Math.max(x, hi * x);
            lo = Math.min(x, lo * x);
            best = Math.max(best, hi);
        }
        return best;
    }

    public static void main(String[] args) {
        int[][] circular = {{5, -3, 5}, {1, -2, 3, -2}, {-3, -2, -3}};
        for (int[] nums : circular) System.out.println("circular " + Arrays.toString(nums) + ": " + maxCircular(nums));
        int[][] products = {{2, 3, -2, 4}, {-2, 3, -4}, {-2, 0, -1}};
        for (int[] nums : products) System.out.println("product " + Arrays.toString(nums) + ": " + maxProduct(nums));
    }
}
```

```python
def max_circular(nums):
    """Largest sum of a subarray that may wrap around the end of the list."""
    cur_max = best_max = nums[0]    # Kadane for the largest sum
    cur_min = best_min = nums[0]    # the same for the smallest sum
    total = nums[0]
    for x in nums[1:]:
        cur_max = max(x, cur_max + x)
        best_max = max(best_max, cur_max)
        cur_min = min(x, cur_min + x)
        best_min = min(best_min, cur_min)
        total += x
    if best_max < 0:                # all negative: a wrap would leave nothing
        return best_max
    return max(best_max, total - best_min)   # wrapping = everything but the smallest middle


def max_product(nums):
    """Largest product of a subarray: the largest and the smallest product ending here."""
    hi = lo = best = nums[0]
    for x in nums[1:]:
        if x < 0:                   # a negative factor turns the smallest into the largest
            hi, lo = lo, hi
        hi = max(x, hi * x)
        lo = min(x, lo * x)
        best = max(best, hi)
    return best


for nums in ([5, -3, 5], [1, -2, 3, -2], [-3, -2, -3]):
    print(f"circular {nums}: {max_circular(nums)}")
for nums in ([2, 3, -2, 4], [-2, 3, -4], [-2, 0, -1]):
    print(f"product {nums}: {max_product(nums)}")
```

```javascript
// Largest sum of a subarray that may wrap around the end of the array.
function maxCircular(nums) {
  let curMax = nums[0]; // Kadane for the largest sum
  let bestMax = nums[0];
  let curMin = nums[0]; // the same for the smallest sum
  let bestMin = nums[0];
  let total = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const x = nums[i];
    curMax = Math.max(x, curMax + x);
    bestMax = Math.max(bestMax, curMax);
    curMin = Math.min(x, curMin + x);
    bestMin = Math.min(bestMin, curMin);
    total += x;
  }
  if (bestMax < 0) return bestMax; // all negative: a wrap would leave nothing
  return Math.max(bestMax, total - bestMin); // wrapping = everything but the smallest middle
}

// Largest product of a subarray: the largest and the smallest product ending here.
function maxProduct(nums) {
  let hi = nums[0];
  let lo = nums[0];
  let best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const x = nums[i];
    if (x < 0) [hi, lo] = [lo, hi]; // a negative factor turns the smallest into the largest
    hi = Math.max(x, hi * x);
    lo = Math.min(x, lo * x);
    best = Math.max(best, hi);
  }
  return best;
}

const show = (nums) => `[${nums.join(", ")}]`;
for (const nums of [[5, -3, 5], [1, -2, 3, -2], [-3, -2, -3]]) console.log(`circular ${show(nums)}: ${maxCircular(nums)}`);
for (const nums of [[2, 3, -2, 4], [-2, 3, -4], [-2, 0, -1]]) console.log(`product ${show(nums)}: ${maxProduct(nums)}`);
```

```output
circular [5, -3, 5]: 10
circular [1, -2, 3, -2]: 3
circular [-3, -2, -3]: -2
product [2, 3, -2, 4]: 6
product [-2, 3, -4]: 24
product [-2, 0, -1]: 0
```

In `[5, -3, 5]` the wrap pays: leaving out the −3 keeps 5 + 5 = 10, more than the 7 of the whole array read straight. In `[-2, 3, -4]` the two negatives cancel, and only the swap lets `hi` see 24.

Other problems bend the same recurrence:

- [Maximum Absolute Sum of Any Subarray](/problems/maximum-absolute-sum-of-any-subarray) runs Kadane for the maximum and for the minimum and returns the larger of the maximum and minus the minimum.
- [Best Sightseeing Pair](/problems/best-sightseeing-pair) keeps the best "start" seen so far, `values[i] + i`, the same running-best idea as the prefix view.
- [Maximum Subarray Sum with One Deletion](/problems/maximum-subarray-sum-with-one-deletion) carries two states per index: the best sum ending here with no deletion, and with one deletion already used.
- The **maximum-sum rectangle** in a grid fixes a pair of rows, adds each column between them into one array, and runs Kadane on that array: O(rows² × columns).

## Time and space complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| Every subarray, summed from scratch | O(n³) | O(1) |
| Every subarray, with a running sum | O(n²) | O(1) |
| Divide and conquer | O(n log n) | O(log n) for the recursion |
| Prefix sums with a running minimum | O(n) | O(1) |
| Kadane's algorithm | O(n) | O(1) |

The circular and product variants keep the same bounds: each carries a fixed number of extra values through the one pass.

## How to recognise a Kadane problem

- The question asks for the **largest or smallest sum** — or product — of a **contiguous** subarray, and the numbers can be negative.
- It asks for the **best stretch** of something over time: profit across days, gain across a route, score across a sequence.
- A decision at each element is "**carry on or start again**": the best answer ending here is built from the best answer ending one step earlier.
- It asks for the **largest difference** `a[j] - a[i]` with i before j: that is the prefix view, a running minimum.

If the question says **subsequence** rather than subarray, Kadane is the wrong tool: the best-sum subsequence is simply the sum of the positive numbers (or the largest number, if none is positive). If the numbers are all positive and the question bounds the sum ("the longest subarray with sum at most k"), it is a sliding window question.

## Common mistakes

- **Starting `best` at 0.** It returns 0 for an all-negative array, the sum of an empty subarray the problem does not allow. Start from `nums[0]`.
- **Starting `cur` at the smallest integer.** `cur + nums[i]` then overflows in C++ and Java before `max` can discard it. Start from `nums[0]` and loop from index 1.
- **Updating `best` before `cur`.** `best` must see the new `cur`, or the last element's run is never counted.
- **Forgetting the all-negative case in the circular variant.** Total minus minimum is 0 there, which describes an empty subarray; return the ordinary maximum instead.
- **Overwriting `hi` before computing `lo`.** In the product variant `lo` must use the old `hi`, which is why the code swaps first and computes each from values that are not yet updated. Use 64-bit integers if the products can grow large.
- **Mixing up subarray and subsequence.** Kadane is for contiguous stretches only.

## Practice in this order

1. [Best Time to Buy and Sell Stock](/problems/best-time-to-buy-and-sell-stock): the prefix view, with a running minimum price.
2. [Maximum Subarray](/problems/maximum-subarray): the algorithm exactly as above.
3. [Maximum Absolute Sum of Any Subarray](/problems/maximum-absolute-sum-of-any-subarray): Kadane for the maximum and the minimum in one pass.
4. [Best Sightseeing Pair](/problems/best-sightseeing-pair): carry the best start so far.
5. [Maximum Sum Circular Subarray](/problems/maximum-sum-circular-subarray): total minus the minimum subarray, with its exception.
6. [Maximum Product Subarray](/problems/maximum-product-subarray): two running values and a swap.
7. [Maximum Subarray Sum with One Deletion](/problems/maximum-subarray-sum-with-one-deletion): two states per index.
8. [K-Concatenation Maximum Sum](/problems/k-concatenation-maximum-sum): Kadane over two copies, plus k − 2 more copies of the total when the total is positive.

The [arrays problem list](/challenges/arrays) and the [prefix sum problem list](/challenges/prefix-sum) have more single-pass array problems. When the extend-or-restart idea feels natural, it is worth reading the [dynamic programming](/roadmap/dynamic-programming) lesson, which builds the same kind of recurrence for harder problems.

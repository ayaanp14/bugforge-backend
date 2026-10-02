---
title: Kadane's Algorithm (Maximum Subarray Sum)
stage: prefix-sums
order: 2
minutes: 12
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
Given an array of numbers, some positive and some negative, which contiguous stretch has the largest sum? This is the **maximum subarray problem**. It is asked directly as [Maximum Subarray](/problems/maximum-subarray), and it hides inside many other questions: the best time to buy and sell a stock, the most profitable run of days. **Kadane's algorithm** solves it in one pass with two variables, and the reasoning behind it is the gentlest possible introduction to [dynamic programming](/roadmap/dynamic-programming).

## The maximum subarray problem

A **subarray** is a contiguous, non-empty part of an array: you may cut elements off either end, but not out of the middle. What makes the problem interesting is that the best stretch can contain negative numbers, and must stop before others.

@figure problem

"Take the positive numbers" fails because the result must be contiguous, and a [sliding window](/roadmap/sliding-window) fails because, with negative numbers, there is no rule for when shrinking is safe.

## Why checking every subarray is too slow

The brute force tries every start and every end. Even with a running sum that is about n²/2 pairs: 5 × 10⁹ additions for n = 100,000, fifty times what a judge allows in a second. Divide and conquer brings it to O(n log n). Kadane's algorithm is O(n), which cannot be beaten: any algorithm must read every element.

## The idea: the best sum ending here

Instead of asking "what is the best subarray?", ask a narrower question at every index i: *what is the best sum of a subarray that ends exactly at i?* Call it `cur`. A subarray ending at i has only two possible shapes:

- **Restart:** `nums[i]` on its own.
- **Extend:** the best subarray ending at i − 1, with `nums[i]` added on the end.

So `cur = max(nums[i], cur + nums[i])`, and `best = max(best, cur)`. Start both at `nums[0]` and walk once from left to right. The comparison has a plain reading: extending loses exactly when `cur` is negative. **A run with a negative sum is a debt** — anything attached to it would be better off without it — so extend while the run's sum is not negative, and start again when it is.

## Why it works

Every subarray ending at i is either `nums[i]` alone or a subarray ending at i − 1 with `nums[i]` added. Adding the same number to every candidate does not change which one is largest, so the best of them is the best sum ending at i − 1 plus `nums[i]`. That is the update — and since every subarray ends somewhere, the largest of these values is the answer.

@figure columns

That is dynamic programming in its smallest form: a **state** (the best sum ending at i), a **recurrence** built from the previous state, and an answer read off the states. Each state needs only the one before it, so the table collapses into the single variable `cur`.

### The code

To return the subarray as well as its sum, keep `start`, the index where the current run began: each restart moves it to i, and each new best copies `start` and i. The test `cur < 0` is the same as `nums[i] > cur + nums[i]`; when `cur` is exactly 0 both choices give the same sum, and the code extends.

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

The second test is the one that catches people out. A popular shorter version starts `cur` and `best` at 0 and never lets the run fall below zero. On an array of negative numbers it returns 0 — the sum of the **empty** subarray, which the problem does not allow.

@figure all-negative

The shortcut is right only when an empty choice is allowed, as in [Best Time to Buy and Sell Stock](/problems/best-time-to-buy-and-sell-stock) ("or not at all") and [K-Concatenation Maximum Sum](/problems/k-concatenation-maximum-sum). Otherwise start from `nums[0]`, as the code does.

## The prefix-sum view

Kadane's algorithm sits in the [prefix sum](/roadmap/prefix-sum) stage for a reason. With `P[k]` the sum of the first k numbers, the sum of `nums[i..j]` is `P[j + 1] - P[i]`. For a fixed end j that is largest when `P[i]` is as small as possible — so the best sum ending at j is `P[j + 1]` minus the smallest earlier prefix.

@figure prefix-view

The two views are one algorithm: `cur` goes negative exactly when the prefix line sets a new low, and the restart index is that low. Kadane is easier to extend to products and deletions; the prefix view generalises to "best sum ending at j with a constraint on the start".

## Variations: the circular array and the maximum product

In [Maximum Sum Circular Subarray](/problems/maximum-sum-circular-subarray) a subarray may run off the end and continue from the start. A wrapping subarray keeps both ends and leaves out a contiguous middle, so its sum is the total minus that middle — and the best one leaves out the middle with the **smallest** sum, which Kadane with `min` finds in the same pass.

@figure circular

[Maximum Product Subarray](/problems/maximum-product-subarray) asks for the largest product. Extend-or-restart survives, but one number is no longer enough to carry: a negative factor turns the most negative product into the largest. So keep `hi`, the largest product ending here, and `lo`, the smallest, and swap them before multiplying by a negative. A zero sets both to 0, and the next element restarts through `max(x, …)`.

@figure product

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

Other problems bend the same recurrence:

- [Maximum Absolute Sum of Any Subarray](/problems/maximum-absolute-sum-of-any-subarray) runs Kadane for the maximum and the minimum and returns the larger in size.
- [Best Sightseeing Pair](/problems/best-sightseeing-pair) carries the best "start" seen so far, `values[i] + i`, like the running low of the prefix view.
- [Maximum Subarray Sum with One Deletion](/problems/maximum-subarray-sum-with-one-deletion) carries two states per index: no deletion yet, and one deletion used.
- The **maximum-sum rectangle** in a grid runs Kadane on the column sums between each pair of rows.

## Time and space complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| Every subarray, summed from scratch | O(n³) | O(1) |
| Every subarray, with a running sum | O(n²) | O(1) |
| Divide and conquer | O(n log n) | O(log n) |
| Prefix sums with a running minimum | O(n) | O(1) |
| Kadane's algorithm | O(n) | O(1) |

The circular and product variants keep these bounds.

## How to recognise a Kadane problem

- It asks for the **largest or smallest sum** — or product — of a **contiguous** subarray, with negative numbers allowed.
- It asks for the **best stretch** of something over time: profit across days, gain across a route.
- The decision at each element is "**carry on or start again**".
- It asks for the **largest difference** `a[j] - a[i]` with i before j: the prefix view, a running minimum.

If it says **subsequence**, the answer is the sum of the positive numbers, or the largest number if none is positive. If every number is positive and the sum is bounded, use a sliding window.

## Common mistakes

- **Starting `best` at 0**, which returns the empty subarray on an all-negative array.
- **Starting `cur` at the smallest integer**, which overflows `cur + nums[i]` in C++ and Java.
- **Updating `best` before `cur`**, so the last element's run is never counted.
- **Forgetting the all-negative case in the circular variant**: total minus minimum is then an empty subarray.
- **Overwriting `hi` before computing `lo`** in the product variant; swap first, and use 64-bit integers.

## Practice in this order

1. [Best Time to Buy and Sell Stock](/problems/best-time-to-buy-and-sell-stock): the prefix view, with a running minimum price.
2. [Maximum Subarray](/problems/maximum-subarray): the algorithm exactly as above.
3. [Maximum Absolute Sum of Any Subarray](/problems/maximum-absolute-sum-of-any-subarray): the maximum and the minimum in one pass.
4. [Best Sightseeing Pair](/problems/best-sightseeing-pair): carry the best start so far.
5. [Maximum Sum Circular Subarray](/problems/maximum-sum-circular-subarray): total minus the smallest middle, with its exception.
6. [Maximum Product Subarray](/problems/maximum-product-subarray): two running values and a swap.
7. [Maximum Subarray Sum with One Deletion](/problems/maximum-subarray-sum-with-one-deletion): two states per index.
8. [K-Concatenation Maximum Sum](/problems/k-concatenation-maximum-sum): Kadane over two copies, plus k − 2 totals when the total is positive.

The [arrays problem list](/challenges/arrays) and the [prefix sum problem list](/challenges/prefix-sum) have more single-pass array problems. When extend-or-restart feels natural, read the [dynamic programming](/roadmap/dynamic-programming) lesson, which builds the same kind of recurrence for harder problems.

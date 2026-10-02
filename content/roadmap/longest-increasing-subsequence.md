---
title: Longest Increasing Subsequence (LIS)
stage: dp-1d
order: 2
minutes: 12
level: Intermediate
hub: dynamic-programming
practice: increasing-triplet-subsequence, longest-increasing-subsequence, maximum-length-of-pair-chain, longest-string-chain, number-of-longest-increasing-subsequence, russian-doll-envelopes, delete-columns-to-make-sorted-iii, minimum-operations-to-make-the-array-k-increasing
updated: 2026-10-03
seo-title: Longest Increasing Subsequence: O(n²) DP and O(n log n)
description: Learn the longest increasing subsequence: the O(n²) DP, the O(n log n) tails method, rebuilding the sequence, with code in C++, Java, Python and JavaScript.
question: What is the longest increasing subsequence?
answer: The longest increasing subsequence (LIS) of an array is the longest selection of its elements, kept in their original order but not necessarily next to each other, in which every element is larger than the one before. A dynamic programming table of the longest subsequence ending at each index finds it in O(n²) time; keeping the smallest possible tail for every length and placing each element by binary search finds it in O(n log n).
q: What is the difference between a subsequence and a subarray?
a: A subarray is a contiguous block of the array, so it has no gaps. A subsequence keeps the elements in their original order but may skip any of them. An array of n elements has about n²/2 subarrays but 2ⁿ subsequences, which is why the longest increasing subarray is a single scan while the longest increasing subsequence needs dynamic programming.
q: Is the tails array the longest increasing subsequence?
a: No. tails[k] is the smallest value that can end an increasing subsequence of length k + 1, and different positions can come from different subsequences. In [5, 2, 8, 6, 3, 6, 9, 7, 1] the final tails are 1, 3, 6, 7, but the 1 comes last in the array. Only the length of tails is the answer; rebuilding a real subsequence needs parent links.
q: How do you find the LIS in O(n log n)?
a: Keep an array tails where tails[k] is the smallest value ending any increasing subsequence of length k + 1 seen so far. The array is always sorted, so for each new value binary search finds the first tail that is not smaller than it: replace that tail, or append when there is none. The length of tails at the end is the LIS length.
q: Can there be more than one longest increasing subsequence?
a: Yes. In [5, 2, 8, 6, 3, 6, 9, 7, 1] both 2, 3, 6, 9 and 2, 3, 6, 7 have length 4. Problems usually ask only for the length, or accept any one subsequence of that length. Counting all of them is its own problem, Number of Longest Increasing Subsequence, solved by keeping a count beside each dp value.
q: How do I find the longest non-decreasing subsequence?
a: Allow equal values to follow each other. In the O(n²) version compare with less than or equal instead of less than. In the O(n log n) version search for the first tail strictly greater than the new value (upper_bound in C++, bisect_right in Python) instead of the first tail greater than or equal to it.
---
Given an array of numbers, pick as many as you can, keeping their original order, so that each one is larger than the one before. That selection is an **increasing subsequence**, and the longest one is the **longest increasing subsequence**, or **LIS**. In `[5, 2, 8, 6, 3, 6, 9, 7, 1]` you can pick 2, 3, 6 and 9, and no five values work, so the LIS has length 4. It is the hidden core of many interview questions, and the first [dynamic programming](/roadmap/dynamic-programming) problem whose answer is not in the last cell.

## Why brute force and greedy both fail

A **subsequence** keeps the original order but may skip elements; a **subarray** is a contiguous block. An array of n elements has 2ⁿ subsequences, each element in or out, so trying them all is hopeless beyond about n = 25, and the usual limit here is n = 2,500. Neither a single scan nor a greedy rule finds it:

@figure picks

The right choice at each element depends on the rest of the array. That is the signal for dynamic programming.

## The O(n²) idea: the longest subsequence ending at each index

The state that works is narrower than the obvious one:

- **State:** dp[i] is the length of the longest increasing subsequence that **ends exactly at index i**.
- **Transition:** dp[i] = 1 + the largest dp[j] over every j < i with nums[j] < nums[i], or 1 if there is none.
- **Answer:** the **largest** dp[i] over all i, not dp[n − 1]. The LIS can end anywhere.

Why "ends at i"? To extend a subsequence you must know its last value; fixing where it ends puts that value in the state for free.

@figure quadratic-table

## Why it works

Take any increasing subsequence that ends at index i. Either it is nums[i] alone, or its second-to-last element sits at some j < i with nums[j] < nums[i]; everything up to j is an increasing subsequence ending at j, so it has at most dp[j] elements and the whole has at most dp[j] + 1. The transition tries every such j, so dp[i] is never too small. It is never too large either, because the longest subsequence ending at the chosen j, followed by nums[i], is real. By induction from left to right every cell is right, and since every subsequence ends somewhere, the LIS is the largest cell.

### The code

The function returns one longest strictly increasing subsequence, rebuilt from the parent links in the animation.

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// One longest strictly increasing subsequence of nums, in O(n²).
vector<int> longestIncreasing(const vector<int>& nums) {
    int n = nums.size();
    if (n == 0) return {};
    vector<int> dp(n, 1);       // dp[i] = longest increasing subsequence ending at i
    vector<int> parent(n, -1);  // the index before i in that subsequence
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) {  // nums[i] extends the subsequence ending at j
                dp[i] = dp[j] + 1;
                parent[i] = j;
            }
        }
    }
    int end = 0;  // the answer is the best cell, not the last one
    for (int i = 1; i < n; i++)
        if (dp[i] > dp[end]) end = i;
    vector<int> lis(dp[end]);
    for (int i = end, k = dp[end] - 1; i != -1; i = parent[i], k--) lis[k] = nums[i];  // walk back
    return lis;
}

string joined(const vector<int>& values) {
    string s;
    for (int v : values) s += (s.empty() ? "" : " ") + to_string(v);
    return s;
}

int main() {
    vector<vector<int>> examples = {{5, 2, 8, 6, 3, 6, 9, 7, 1}, {10, 9, 2, 5, 3, 7, 101, 18}};
    for (const vector<int>& nums : examples) {
        vector<int> lis = longestIncreasing(nums);
        cout << joined(nums) << ": length " << lis.size() << ", one LIS " << joined(lis) << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // One longest strictly increasing subsequence of nums, in O(n²).
    static int[] longestIncreasing(int[] nums) {
        int n = nums.length;
        if (n == 0) return new int[0];
        int[] dp = new int[n];      // dp[i] = longest increasing subsequence ending at i
        int[] parent = new int[n];  // the index before i in that subsequence
        for (int i = 0; i < n; i++) {
            dp[i] = 1;
            parent[i] = -1;
            for (int j = 0; j < i; j++) {
                if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) {  // nums[i] extends the subsequence ending at j
                    dp[i] = dp[j] + 1;
                    parent[i] = j;
                }
            }
        }
        int end = 0;  // the answer is the best cell, not the last one
        for (int i = 1; i < n; i++)
            if (dp[i] > dp[end]) end = i;
        int[] lis = new int[dp[end]];
        for (int i = end, k = dp[end] - 1; i != -1; i = parent[i], k--) lis[k] = nums[i];  // walk back
        return lis;
    }

    static String joined(int[] values) {
        StringBuilder s = new StringBuilder();
        for (int v : values) s.append(s.length() == 0 ? "" : " ").append(v);
        return s.toString();
    }

    public static void main(String[] args) {
        int[][] examples = {{5, 2, 8, 6, 3, 6, 9, 7, 1}, {10, 9, 2, 5, 3, 7, 101, 18}};
        for (int[] nums : examples) {
            int[] lis = longestIncreasing(nums);
            System.out.println(joined(nums) + ": length " + lis.length + ", one LIS " + joined(lis));
        }
    }
}
```

```python
def longest_increasing(nums):
    """One longest strictly increasing subsequence of nums, in O(n²)."""
    n = len(nums)
    if n == 0:
        return []
    dp = [1] * n        # dp[i] = longest increasing subsequence ending at i
    parent = [-1] * n   # the index before i in that subsequence
    for i in range(n):
        for j in range(i):
            if nums[j] < nums[i] and dp[j] + 1 > dp[i]:  # nums[i] extends the subsequence ending at j
                dp[i] = dp[j] + 1
                parent[i] = j
    end = 0  # the answer is the best cell, not the last one
    for i in range(1, n):
        if dp[i] > dp[end]:
            end = i
    lis = [0] * dp[end]
    i, k = end, dp[end] - 1
    while i != -1:  # walk back
        lis[k] = nums[i]
        i, k = parent[i], k - 1
    return lis


def joined(values):
    return " ".join(map(str, values))


examples = [[5, 2, 8, 6, 3, 6, 9, 7, 1], [10, 9, 2, 5, 3, 7, 101, 18]]
for nums in examples:
    lis = longest_increasing(nums)
    print(f"{joined(nums)}: length {len(lis)}, one LIS {joined(lis)}")
```

```javascript
// One longest strictly increasing subsequence of nums, in O(n²).
function longestIncreasing(nums) {
  const n = nums.length;
  if (n === 0) return [];
  const dp = new Array(n).fill(1); // dp[i] = longest increasing subsequence ending at i
  const parent = new Array(n).fill(-1); // the index before i in that subsequence
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) {
        // nums[i] extends the subsequence ending at j
        dp[i] = dp[j] + 1;
        parent[i] = j;
      }
    }
  }
  let end = 0; // the answer is the best cell, not the last one
  for (let i = 1; i < n; i++) if (dp[i] > dp[end]) end = i;
  const lis = new Array(dp[end]);
  for (let i = end, k = dp[end] - 1; i !== -1; i = parent[i], k--) lis[k] = nums[i]; // walk back
  return lis;
}

const joined = (values) => values.join(" ");

const examples = [
  [5, 2, 8, 6, 3, 6, 9, 7, 1],
  [10, 9, 2, 5, 3, 7, 101, 18],
];
for (const nums of examples) {
  const lis = longestIncreasing(nums);
  console.log(`${joined(nums)}: length ${lis.length}, one LIS ${joined(lis)}`);
}
```

```output
5 2 8 6 3 6 9 7 1: length 4, one LIS 2 3 6 9
10 9 2 5 3 7 101 18: length 4, one LIS 2 5 7 101
```

Two nested loops make this O(n²): about three million comparisons for n = 2,500, but 5 × 10⁹ for n = 10⁵, which is far too slow.

## The O(n log n) method: keep the smallest tails

The quadratic version scans every earlier element to find which subsequence to extend. The faster method keeps a summary that answers the same question with one [binary search](/roadmap/binary-search): **tails[k] is the smallest value that ends any increasing subsequence of length k + 1 seen so far.** Smaller is better, because a subsequence ending low is easier to extend. For each new value x, find the first tail not smaller than x: **replace** it with x, or **append** x if every tail is smaller. Dealing values onto piles like this is also called **patience sorting**.

@figure patience

## Why tails stays sorted

Binary search needs tails sorted, and it always is, strictly. Behind every tail is a real subsequence of its length, and cutting the last value off the one behind tails[k + 1] leaves a subsequence of length k + 1 ending below tails[k + 1]:

@figure why-sorted

The update is also exactly right. Slots before position k hold tails smaller than x, which x cannot improve; slots after it would need x to follow a tail at least as large as x. Position k is the one length x reaches with a better tail, so the number of slots is always the LIS length so far.

### The code

To rebuild a real LIS, the tails store indices and every value remembers the tail to its left when it lands, the arrows in the animation. The search is written by hand so one function handles both comparisons explained next.

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// One longest increasing subsequence in O(n log n): strictly increasing when
// strict is true, non-decreasing when it is false.
vector<int> longestIncreasing(const vector<int>& nums, bool strict) {
    vector<int> tails;                   // tails[k] = index of the smallest tail of length k + 1
    vector<int> parent(nums.size(), -1); // the index before i in the subsequence i ends
    for (int i = 0; i < (int)nums.size(); i++) {
        int lo = 0, hi = tails.size();   // binary search: first tail that x cannot follow
        while (lo < hi) {
            int mid = (lo + hi) / 2;
            int t = nums[tails[mid]];
            if (strict ? t < nums[i] : t <= nums[i]) lo = mid + 1;
            else hi = mid;
        }
        if (lo > 0) parent[i] = tails[lo - 1];            // extend the subsequence one shorter
        if (lo == (int)tails.size()) tails.push_back(i);  // longer than every subsequence so far
        else tails[lo] = i;                               // same length, smaller tail
    }
    int k = tails.size();
    vector<int> lis(k);
    for (int i = k > 0 ? tails[k - 1] : -1; i != -1; i = parent[i]) lis[--k] = nums[i];
    return lis;
}

string joined(const vector<int>& values) {
    string s;
    for (int v : values) s += (s.empty() ? "" : " ") + to_string(v);
    return s;
}

void show(const vector<int>& nums, bool strict) {
    vector<int> lis = longestIncreasing(nums, strict);
    cout << joined(nums) << (strict ? " (strict)" : " (non-decreasing)") << ": length "
         << lis.size() << ", one LIS " << joined(lis) << "\n";
}

int main() {
    show({5, 2, 8, 6, 3, 6, 9, 7, 1}, true);
    show({10, 9, 2, 5, 3, 7, 101, 18}, true);
    show({1, 2, 2, 2, 3}, true);
    show({1, 2, 2, 2, 3}, false);
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    // One longest increasing subsequence in O(n log n): strictly increasing when
    // strict is true, non-decreasing when it is false.
    static int[] longestIncreasing(int[] nums, boolean strict) {
        List<Integer> tails = new ArrayList<>();  // tails[k] = index of the smallest tail of length k + 1
        int[] parent = new int[nums.length];      // the index before i in the subsequence i ends
        for (int i = 0; i < nums.length; i++) {
            int lo = 0, hi = tails.size();        // binary search: first tail that x cannot follow
            while (lo < hi) {
                int mid = (lo + hi) / 2;
                int t = nums[tails.get(mid)];
                if (strict ? t < nums[i] : t <= nums[i]) lo = mid + 1;
                else hi = mid;
            }
            parent[i] = lo > 0 ? tails.get(lo - 1) : -1;   // extend the subsequence one shorter
            if (lo == tails.size()) tails.add(i);          // longer than every subsequence so far
            else tails.set(lo, i);                         // same length, smaller tail
        }
        int k = tails.size();
        int[] lis = new int[k];
        for (int i = k > 0 ? tails.get(k - 1) : -1; i != -1; i = parent[i]) lis[--k] = nums[i];
        return lis;
    }

    static String joined(int[] values) {
        StringBuilder s = new StringBuilder();
        for (int v : values) s.append(s.length() == 0 ? "" : " ").append(v);
        return s.toString();
    }

    static void show(int[] nums, boolean strict) {
        int[] lis = longestIncreasing(nums, strict);
        System.out.println(joined(nums) + (strict ? " (strict)" : " (non-decreasing)") + ": length "
                + lis.length + ", one LIS " + joined(lis));
    }

    public static void main(String[] args) {
        show(new int[] {5, 2, 8, 6, 3, 6, 9, 7, 1}, true);
        show(new int[] {10, 9, 2, 5, 3, 7, 101, 18}, true);
        show(new int[] {1, 2, 2, 2, 3}, true);
        show(new int[] {1, 2, 2, 2, 3}, false);
    }
}
```

```python
def longest_increasing(nums, strict):
    """One longest increasing subsequence in O(n log n): strictly increasing
    when strict is True, non-decreasing when it is False."""
    tails = []                  # tails[k] = index of the smallest tail of length k + 1
    parent = [-1] * len(nums)   # the index before i in the subsequence i ends
    for i, x in enumerate(nums):
        lo, hi = 0, len(tails)  # binary search: first tail that x cannot follow
        while lo < hi:
            mid = (lo + hi) // 2
            t = nums[tails[mid]]
            if (t < x) if strict else (t <= x):
                lo = mid + 1
            else:
                hi = mid
        if lo > 0:
            parent[i] = tails[lo - 1]   # extend the subsequence one shorter
        if lo == len(tails):
            tails.append(i)             # longer than every subsequence so far
        else:
            tails[lo] = i               # same length, smaller tail
    lis = []
    i = tails[-1] if tails else -1
    while i != -1:
        lis.append(nums[i])
        i = parent[i]
    return lis[::-1]


def joined(values):
    return " ".join(map(str, values))


def show(nums, strict):
    lis = longest_increasing(nums, strict)
    kind = "strict" if strict else "non-decreasing"
    print(f"{joined(nums)} ({kind}): length {len(lis)}, one LIS {joined(lis)}")


show([5, 2, 8, 6, 3, 6, 9, 7, 1], True)
show([10, 9, 2, 5, 3, 7, 101, 18], True)
show([1, 2, 2, 2, 3], True)
show([1, 2, 2, 2, 3], False)
```

```javascript
// One longest increasing subsequence in O(n log n): strictly increasing when
// strict is true, non-decreasing when it is false.
function longestIncreasing(nums, strict) {
  const tails = []; // tails[k] = index of the smallest tail of length k + 1
  const parent = new Array(nums.length).fill(-1); // the index before i in the subsequence i ends
  for (let i = 0; i < nums.length; i++) {
    let lo = 0;
    let hi = tails.length; // binary search: first tail that x cannot follow
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      const t = nums[tails[mid]];
      if (strict ? t < nums[i] : t <= nums[i]) lo = mid + 1;
      else hi = mid;
    }
    if (lo > 0) parent[i] = tails[lo - 1]; // extend the subsequence one shorter
    if (lo === tails.length) tails.push(i); // longer than every subsequence so far
    else tails[lo] = i; // same length, smaller tail
  }
  let k = tails.length;
  const lis = new Array(k);
  for (let i = k > 0 ? tails[k - 1] : -1; i !== -1; i = parent[i]) lis[--k] = nums[i];
  return lis;
}

const joined = (values) => values.join(" ");

function show(nums, strict) {
  const lis = longestIncreasing(nums, strict);
  const kind = strict ? "strict" : "non-decreasing";
  console.log(`${joined(nums)} (${kind}): length ${lis.length}, one LIS ${joined(lis)}`);
}

show([5, 2, 8, 6, 3, 6, 9, 7, 1], true);
show([10, 9, 2, 5, 3, 7, 101, 18], true);
show([1, 2, 2, 2, 3], true);
show([1, 2, 2, 2, 3], false);
```

```output
5 2 8 6 3 6 9 7 1 (strict): length 4, one LIS 2 3 6 7
10 9 2 5 3 7 101 18 (strict): length 4, one LIS 2 3 7 18
1 2 2 2 3 (strict): length 3, one LIS 1 2 3
1 2 2 2 3 (non-decreasing): length 5, one LIS 1 2 2 2 3
```

## Strictly increasing or non-decreasing?

The two versions differ in one decision: what happens when x **equals** a tail.

@figure equal-values

- **Strictly increasing:** search for the first tail **greater than or equal to** x: `lower_bound` in C++, `bisect_left` in Python.
- **Non-decreasing:** search for the first tail **strictly greater than** x: `upper_bound` in C++, `bisect_right` in Python.

In the O(n²) table the same switch is `<` against `<=`. Java's `Arrays.binarySearch` returns *some* matching index when values repeat, not the first, and JavaScript has no binary search, which is why the programs write the loop by hand.

## Variations on the LIS

The most famous disguise is two dimensions that must both increase. In [Russian Doll Envelopes](/problems/russian-doll-envelopes), sort by width, then take a strict LIS of the heights; the tie-break for equal widths decides whether the answer is right.

@figure envelopes

- **Counting the longest subsequences.** Keep count[i] beside dp[i]: copy count[j] when dp[j] + 1 beats dp[i], add it on a tie. See [Number of Longest Increasing Subsequence](/problems/number-of-longest-increasing-subsequence).
- **Chains with a custom rule.** [Maximum Length of Pair Chain](/problems/maximum-length-of-pair-chain) and [Longest String Chain](/problems/longest-string-chain): sort so a follower always comes later, then run the O(n²) table with the rule in place of `<`.
- **An order that is not total.** In [Delete Columns to Make Sorted III](/problems/delete-columns-to-make-sorted-iii) two columns can each fail to come before the other, so tails cannot be sorted; the O(n²) table still works.
- **Fewest changes to make an array sorted.** The elements kept form an increasing subsequence, so the answer is n minus the LIS, as in [Minimum Operations to Make the Array K-Increasing](/problems/minimum-operations-to-make-the-array-k-increasing) (non-decreasing, k times).
- **A triplet is enough.** [Increasing Triplet Subsequence](/problems/increasing-triplet-subsequence) needs only two tails: O(n) time, O(1) space.

The strict LIS also equals the [longest common subsequence](/roadmap/longest-common-subsequence) of the array and its sorted, de-duplicated copy.

## Time and space complexity

| Approach | Time | Extra space | Gives |
| --- | --- | --- | --- |
| Try every subsequence | O(2ⁿ × n) | O(n) | Everything, slowly |
| dp[i] = longest ending at i | O(n²) | O(n) | Length, one LIS, counts, custom comparisons |
| Tails with binary search | O(n log n) | O(n) | Length, and one LIS with parent links |

At n = 10⁵ the tails method takes under two million steps. Prefer the O(n²) table when n is a few thousand at most, or when the problem needs counts or a comparison that is not a total order.

## How to recognise an LIS problem

- The **longest** selection that keeps the **original order**, each element bigger than (or compatible with) the one before.
- Items with **two dimensions** that must both increase: sort by one, run an LIS on the other.
- The **fewest deletions** or changes that make a sequence sorted.
- The word **subsequence** with an ordering condition; "subarray" or "substring" usually means a scan or a [sliding window](/roadmap/sliding-window) instead.

## Common mistakes

- **Returning dp[n − 1].** The answer is the largest dp[i]; in the example dp[8] is 1.
- **Printing tails as the answer.** Only its length is right; its values are generally not a subsequence.
- **Mixing up the two searches.** `upper_bound` or `bisect_right` for a strict LIS lets equal values chain and overcounts.
- **The wrong envelope tie-break.** Equal widths sorted by ascending height let two of one width nest.
- **Java's `binarySearch` as a lower bound.** With repeated values it may return any match.

## Practice in this order

1. [Increasing Triplet Subsequence](/problems/increasing-triplet-subsequence): two tails.
2. [Longest Increasing Subsequence](/problems/longest-increasing-subsequence): write both versions.
3. [Maximum Length of Pair Chain](/problems/maximum-length-of-pair-chain): sort, then a custom rule.
4. [Longest String Chain](/problems/longest-string-chain): "can follow" means one letter added.
5. [Number of Longest Increasing Subsequence](/problems/number-of-longest-increasing-subsequence): a count beside every dp value.
6. [Russian Doll Envelopes](/problems/russian-doll-envelopes): the sort and the fast method.
7. [Delete Columns to Make Sorted III](/problems/delete-columns-to-make-sorted-iii): an order that is not total.
8. [Minimum Operations to Make the Array K-Increasing](/problems/minimum-operations-to-make-the-array-k-increasing): n minus an LIS, k times.

The [dynamic programming problem list](/challenges/dynamic-programming) has the rest. Next on the road: two-dimensional tables, starting with the [0/1 knapsack problem](/roadmap/knapsack-problem).

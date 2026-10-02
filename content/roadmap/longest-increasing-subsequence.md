---
title: Longest Increasing Subsequence (LIS)
stage: dp-1d
order: 2
minutes: 19
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
Given an array of numbers, pick as many as you can, keeping their original order, so that each one you pick is larger than the one before. That selection is an **increasing subsequence**, and the longest one is the **longest increasing subsequence**, usually shortened to **LIS**. In `[5, 2, 8, 6, 3, 6, 9, 7, 1]` you can pick 2, 3, 6 and 9 (at indices 1, 4, 5 and 6), and no selection of five works, so the LIS has length 4.

The LIS is a classic interview question in its own right and the hidden core of many others: nesting envelopes, stacking boxes, the fewest deletions that leave an array sorted. It is also the best example of a dynamic programming problem whose answer is *not* in the last cell, and of a DP that binary search can make faster. This lesson covers the O(n²) table, how to rebuild the subsequence itself, the O(n log n) method and why it is correct, and the strict and non-strict versions, with every program in C++, Java, Python and JavaScript.

## Subsequence or subarray?

The two words are easy to mix up, and they lead to very different problems.

- A **subarray** is a contiguous block: `[6, 3, 6]` is a subarray of the example, starting at index 3.
- A **subsequence** keeps the original order but may skip elements: `[2, 3, 6, 9]` skips the 8, the first 6 and more.

Every subarray is a subsequence, but not the other way round. The longest increasing *subarray* of the example is `[3, 6, 9]`, length 3, and one pass finds it: extend the current run while the next value is larger, start a new run otherwise. The longest increasing *subsequence* is 4, and no single left-to-right rule finds it, because whether to take an element depends on what comes later.

## Why brute force and greedy both fail

An array of n elements has 2ⁿ subsequences: each element is either in or out. Checking all of them is hopeless beyond about n = 25; the usual limit in this problem is n = 2,500, where 2ⁿ has more than 750 digits.

The greedy idea "take the next element whenever it is larger than the last one taken" does not work either. Starting from the 5, it takes 5, 8 and 9 and stops at length 3, because taking the 8 blocked the 6 and the 7. Starting from the smallest element does not help: the 1 is smallest and comes last. The right choice at each element depends on the rest of the array, and that is the signal for [dynamic programming](/roadmap/dynamic-programming).

## The O(n²) idea: the longest subsequence ending at each index

The state that works is narrower than the obvious one:

- **State:** dp[i] is the length of the longest increasing subsequence that **ends exactly at index i**.
- **Transition:** nums[i] can be placed after any earlier, smaller element. dp[i] = 1 + the largest dp[j] over all j < i with nums[j] < nums[i], or 1 if there is no such j (nums[i] on its own).
- **Base case:** every dp[i] starts at 1.
- **Order:** left to right, since dp[i] reads only smaller indices.
- **Answer:** the **largest** dp[i] over all i, not dp[n − 1]. The LIS can end anywhere.

Why "ends at i" instead of "the longest within the first i elements"? To decide whether nums[i] can extend a subsequence, you must know that subsequence's last value. "The longest within the first i elements" forgets it, so it cannot be extended reliably. Fixing where the subsequence ends puts the last value in the state for free: it is nums[i].

```text
 index:   0   1   2   3   4   5   6   7   8
 nums:  [ 5,  2,  8,  6,  3,  6,  9,  7,  1 ]
 dp:      1   1   2   2   2   3   4   4   1
                          ^   ^   ^
          dp[6] = 1 + max(dp of every earlier value below 9) = 1 + dp[5] = 4
```

## Why it works

Take any increasing subsequence that ends at index i. Either it is just nums[i], with length 1, or it has a second-to-last element at some index j < i with nums[j] < nums[i]. In the second case, everything up to j is an increasing subsequence ending at j, so it has at most dp[j] elements, and the whole thing has at most dp[j] + 1. The transition looks at every such j, so dp[i] is at least as large as any increasing subsequence ending at i.

It is also never too large: for the j it picks, the longest subsequence ending at j followed by nums[i] is a real increasing subsequence of length dp[j] + 1. So dp[i] is exactly right, provided every dp[j] before it is right, and filling left to right guarantees that by induction. Since every increasing subsequence ends somewhere, the longest one is the maximum over all dp[i].

### Dry run

For each i, the transition scans the earlier values smaller than nums[i] and extends the best. The value in brackets is that element's dp; "from" records which index was extended, for rebuilding the subsequence later.

| i | nums[i] | Earlier smaller values (their dp) | dp[i] | From |
| --- | --- | --- | --- | --- |
| 0 | 5 | none | 1 | — |
| 1 | 2 | none | 1 | — |
| 2 | 8 | 5 (1), 2 (1) | 2 | 0 |
| 3 | 6 | 5 (1), 2 (1) | 2 | 0 |
| 4 | 3 | 2 (1) | 2 | 1 |
| 5 | 6 | 5 (1), 2 (1), 3 (2) | 3 | 4 |
| 6 | 9 | 5 (1), 2 (1), 8 (2), 6 (2), 3 (2), 6 (3) | 4 | 5 |
| 7 | 7 | 5 (1), 2 (1), 6 (2), 3 (2), 6 (3) | 4 | 5 |
| 8 | 1 | none | 1 | — |

The largest dp is 4, first reached at index 6. Note that at index 5 the earlier 6 is *not* in the list: it is equal, not smaller, and a strictly increasing subsequence cannot repeat a value.

### Rebuilding one LIS

The table gives the length. To get the elements, store a **parent** for every index: the j whose subsequence nums[i] extended, the "From" column above. Then start at the index where the best length ends and follow the parents backwards: 6 → 5 → 4 → 1, which reads 9, 6, 3, 2. Reversed, that is 2, 3, 6, 9. The parent links cost one extra array and no extra time; rebuilding from the dp values alone is also possible, but the links make it a straight walk.

### The code

The function returns one longest strictly increasing subsequence; its length is the LIS length. The program runs it on the example and on the well-known `[10, 9, 2, 5, 3, 7, 101, 18]`.

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

Two nested loops over n elements make this O(n²) time and O(n) space. For n = 2,500 that is about three million comparisons, comfortably fast. For n = 10⁵ it is 5 × 10⁹, too slow, and that is where the next method comes in.

## The O(n log n) method: keep the smallest tails

The quadratic version asks, for every element, "which earlier subsequence can I extend?" and scans everything to answer. The faster method keeps a summary that answers the same question with one [binary search](/roadmap/binary-search).

The summary is an array called **tails**: **tails[k] is the smallest value that ends any increasing subsequence of length k + 1 seen so far.** Smaller is better, because a subsequence ending in a small value is easier to extend than one of the same length ending in a large value. For each new value x:

- Find the first position k where tails[k] ≥ x.
- If there is none, x is larger than every tail: it extends the longest subsequence, so **append** it. The LIS just grew by one.
- Otherwise **replace** tails[k] with x. The subsequence of length k that ends at tails[k − 1] (smaller than x) followed by x is an increasing subsequence of length k + 1 with a smaller tail than before.

```text
 tails before x = 7:   [ 2, 3, 6, 9 ]      first tail >= 7 is the 9, at position 3
 tails after:          [ 2, 3, 6, 7 ]      a length-4 subsequence can now end in 7 instead of 9
```

This method is also known as **patience sorting**: deal the values onto piles, each card going onto the leftmost pile whose top card is not smaller. The top cards are the tails, and the number of piles is the LIS length.

### Why tails stays sorted

Binary search needs tails sorted, and it always is, strictly. Take an increasing subsequence of length k + 2 that ends in tails[k + 1]. Its element just before the end is smaller than tails[k + 1], and the elements up to and including it form one of length k + 1. So some increasing subsequence of length k + 1 ends in a value smaller than tails[k + 1], and tails[k], the smallest such ending, is smaller still. Hence tails[k] < tails[k + 1] for every k.

The update also changes only the one position it should. Positions before k hold tails smaller than x, and x does not improve them. A position after k would need x to extend a subsequence of length k + 1 or more, whose tails are all at least tails[k] ≥ x, so x cannot follow them. Position k is exactly the length x can reach with a better tail. The length of tails is therefore the length of the longest increasing subsequence so far, which at the end is the LIS.

### Dry run

The same array, one value at a time:

| i | x | First tail ≥ x | Action | tails after |
| --- | --- | --- | --- | --- |
| 0 | 5 | none | append | 5 |
| 1 | 2 | position 0 (5) | replace 5 | 2 |
| 2 | 8 | none | append | 2, 8 |
| 3 | 6 | position 1 (8) | replace 8 | 2, 6 |
| 4 | 3 | position 1 (6) | replace 6 | 2, 3 |
| 5 | 6 | none | append | 2, 3, 6 |
| 6 | 9 | none | append | 2, 3, 6, 9 |
| 7 | 7 | position 3 (9) | replace 9 | 2, 3, 6, 7 |
| 8 | 1 | position 0 (2) | replace 2 | 1, 3, 6, 7 |

Four tails, so the LIS has length 4. Now look at the final tails: 1, 3, 6, 7. That is **not** an increasing subsequence of the array, because the 1 is the last element and cannot come before the 3. Each position is the best tail for its own length, and those tails come from different subsequences. The length of tails is right; its contents are not an answer.

### Rebuilding the subsequence

To get a real LIS, store **indices** in tails instead of values, and give every element a parent: when x lands at position k, its parent is the index then stored at position k − 1, the end of the subsequence it extends. At the end, start from the index in the last position of tails and follow parents. For the example that is index 7 → 5 → 4 → 1: values 7, 6, 3, 2, so the subsequence 2, 3, 6, 7. It differs from the O(n²) answer, 2, 3, 6, 9, and both are correct: an array can have many longest increasing subsequences.

### The code

The search is written out by hand so that the same function handles strictly increasing and non-decreasing subsequences; the next section explains the one comparison that changes.

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

When only the length is needed, the parents disappear and the loop is three lines. In Python, for example:

```text
tails = []
for x in nums:
    k = bisect_left(tails, x)          # first tail >= x
    if k == len(tails): tails.append(x)
    else: tails[k] = x
return len(tails)
```

## Strictly increasing or non-decreasing?

The two versions differ in one decision: what happens when x **equals** an existing tail.

- **Strictly increasing:** an equal value cannot follow, so it should *replace* the equal tail, not extend past it. Search for the first tail **greater than or equal to** x. That is `lower_bound` in C++ and `bisect_left` in Python.
- **Non-decreasing:** an equal value can follow, so it should land *after* the equal tails. Search for the first tail **strictly greater than** x. That is `upper_bound` in C++ and `bisect_right` in Python.

The last two lines of the program show the difference on `[1, 2, 2, 2, 3]`: 3 strictly, 5 non-decreasing. In the O(n²) version the same switch is `<` against `<=` when comparing nums[j] with nums[i]. Java has no lower-bound search on a list: `Arrays.binarySearch` returns *some* matching index when values repeat, not the first, which is why the Java program writes the loop by hand. JavaScript has no built-in binary search at all.

## Variations on the LIS

Once the basic version is familiar, many problems turn out to be an LIS in disguise:

- **Counting the longest subsequences.** Keep count[i], the number of longest increasing subsequences ending at i, beside dp[i]. When dp[j] + 1 beats dp[i], copy count[j]; when it ties, add count[j]. The answer sums count[i] over every i whose dp[i] is the maximum. See [Number of Longest Increasing Subsequence](/problems/number-of-longest-increasing-subsequence).
- **Nesting envelopes.** An envelope fits inside another when both its width and height are smaller. Sort by width ascending and, for equal widths, by height **descending**, then take the strict LIS of the heights. The descending tie-break stops two envelopes of the same width from both being chosen, because their heights then never increase. See [Russian Doll Envelopes](/problems/russian-doll-envelopes).
- **Longest bitonic subsequence.** A subsequence that rises and then falls. Compute the LIS ending at each index from the left and the longest decreasing subsequence starting at each index from the right; the answer is the largest left[i] + right[i] − 1, since the peak is counted in both.
- **Chains with a custom rule.** [Maximum Length of Pair Chain](/problems/maximum-length-of-pair-chain) and [Longest String Chain](/problems/longest-string-chain) ask for the longest sequence where each item may follow the previous one under some rule. After sorting so that a follower always comes later, the O(n²) LIS works with that rule in place of `<`. The pair chain also has a greedy solution, covered in [greedy algorithms](/roadmap/greedy-algorithms).
- **When only the O(n²) version applies.** The tails method needs a total order: any two values compare. In [Delete Columns to Make Sorted III](/problems/delete-columns-to-make-sorted-iii), column j may come before column i only if *every* row agrees, and two columns can each fail to come before the other. The quadratic DP still works, with that check as its comparison; binary search does not.
- **Fewest changes to make an array sorted.** The elements you keep form an increasing subsequence, so the fewest removals is n minus the LIS. [Minimum Operations to Make the Array K-Increasing](/problems/minimum-operations-to-make-the-array-k-increasing) applies it to k interleaved chains with the non-decreasing version.
- **A triplet is enough.** [Increasing Triplet Subsequence](/problems/increasing-triplet-subsequence) asks only whether the LIS reaches 3, so the tails array shrinks to two variables, the smallest tail of length 1 and of length 2, in O(n) time and O(1) space.

The LIS is also a special case of the [longest common subsequence](/roadmap/longest-common-subsequence): the strict LIS of an array is its LCS with the sorted array of its distinct values. That costs O(n²), so it is a curiosity rather than a method, but it shows how the two DPs are related.

## Time and space complexity

| Approach | Time | Extra space | Gives |
| --- | --- | --- | --- |
| Try every subsequence | O(2ⁿ × n) | O(n) | Everything, slowly |
| dp[i] = longest run ending at i | O(n²) | O(n) | Length, one LIS, counts, custom comparisons |
| Tails with binary search | O(n log n) | O(n) | Length, and one LIS with parent links |

Each of the n elements costs one binary search over at most n tails, which is O(log n), hence O(n log n). At n = 10⁵ that is under two million steps, against five billion for the quadratic table. Prefer the O(n²) table when n is a few thousand at most, or when the problem needs counts or a comparison that is not a total order.

## How to recognise an LIS problem

- The question asks for the **longest** selection that keeps the **original order** and where each element must be bigger, or compatible in some way, than the one before.
- Items have **two dimensions** that must both increase: envelopes, boxes, people's heights and weights. Sort by one, run an LIS on the other.
- It asks for the **fewest deletions** or changes to make a sequence sorted: the elements kept form an increasing subsequence.
- The word **subsequence** with an ordering condition, as opposed to "subarray" or "substring", which usually means a sliding window or a single scan instead.
- n up to 10⁵ with an order condition suggests the O(n log n) tails method; n up to a few thousand allows the O(n²) table.

## Common mistakes

- **Returning dp[n − 1].** The LIS can end anywhere; the answer is the maximum over all dp[i]. In `[5, 2, 8, 6, 3, 6, 9, 7, 1]`, dp[8] is 1.
- **Printing tails as the answer.** The final tails is generally not a subsequence of the input. Only its length is the LIS length.
- **Mixing up the two searches.** Using `upper_bound` or `bisect_right` for a strictly increasing subsequence lets equal values chain together and overcounts.
- **The wrong tie-break for envelopes.** Sorting equal widths by height ascending lets two envelopes of the same width nest in the LIS, which is not allowed.
- **Using Java's `binarySearch` for a lower bound.** With repeated values it returns any matching index, so equal tails can be placed in the wrong slot.
- **Confusing subsequence with subarray.** The longest increasing subarray needs one scan; applying LIS logic to it, or the scan to an LIS problem, gives the wrong answer.

## Practice in this order

1. [Increasing Triplet Subsequence](/problems/increasing-triplet-subsequence): the tails idea with only two tails.
2. [Longest Increasing Subsequence](/problems/longest-increasing-subsequence): write both versions from this lesson.
3. [Maximum Length of Pair Chain](/problems/maximum-length-of-pair-chain): sort first, then an LIS with a custom rule.
4. [Longest String Chain](/problems/longest-string-chain): the O(n²) shape where "can follow" means one letter added.
5. [Number of Longest Increasing Subsequence](/problems/number-of-longest-increasing-subsequence): a count beside every dp value.
6. [Russian Doll Envelopes](/problems/russian-doll-envelopes): two dimensions, the sorting trick and the fast method.
7. [Delete Columns to Make Sorted III](/problems/delete-columns-to-make-sorted-iii): an order that is not total, so the O(n²) table.
8. [Minimum Operations to Make the Array K-Increasing](/problems/minimum-operations-to-make-the-array-k-increasing): n minus a non-decreasing LIS, k times.

The [dynamic programming problem list](/challenges/dynamic-programming) has the rest of the catalogue's DP problems. The next stage of the road moves to two-dimensional tables, starting with the [0/1 knapsack problem](/roadmap/knapsack-problem).

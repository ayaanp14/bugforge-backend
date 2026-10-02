---
title: Prefix Sum
stage: prefix-sums
order: 1
minutes: 21
level: Beginner
hub: prefix-sum
practice: running-sum-of-1d-array, find-pivot-index, left-and-right-sum-differences, subarray-sum-equals-k, contiguous-array, continuous-subarray-sum, product-of-array-except-self, car-pooling, matrix-block-sum
updated: 2026-10-03
seo-title: Prefix Sum Explained: Range Sums, Subarray Sums & 2D Grids
description: Learn prefix sums: O(1) range sums, subarray sum equals k with a hash map, 2D sums and difference arrays, with code in C++, Java, Python and JavaScript.
question: What is a prefix sum?
answer: A prefix sum array stores at position i the total of the first i elements of an array, with prefix[0] = 0. Building it takes one O(n) pass; afterwards the sum of any range from l to r is prefix[r + 1] − prefix[l], a single subtraction. With a hash map it counts subarrays with a given sum, and the same idea extends to 2D grids and to difference arrays for range updates.
q: Why is the prefix sum array one longer than the input?
a: So that prefix[0] = 0 can stand for the empty sum. Then every range, including one that starts at index 0, is prefix[r + 1] − prefix[l] with no special case. With a prefix array of length n, ranges that start at 0 need their own branch, and that branch is where off-by-one bugs live.
q: What is the difference between prefix sums and the sliding window?
a: A sliding window needs a rule that stays true when the window shrinks, which for sums means the numbers must be non-negative. Prefix sums work with negative numbers, answer any range in O(1), and with a hash map count the subarrays with an exact sum. Use a window for the longest or shortest stretch under a limit on positive numbers, and prefix sums for the rest.
q: How does "subarray sum equals k" work with a hash map?
a: The sum of the subarray from i to j is prefix[j + 1] − prefix[i], so it equals k exactly when some earlier prefix equals the current prefix minus k. Keep a map from each prefix value to how many times it has occurred, start it with {0: 1}, and at each step add the count stored for current − k before recording the current prefix.
q: What is a difference array?
a: It is a prefix sum run backwards. To add v to every element from l to r, add v at diff[l] and subtract v at diff[r + 1]; after all the updates, one prefix-sum pass over diff produces the final array. Each update costs O(1) instead of O(r − l + 1).
q: What is the time complexity of prefix sums?
a: Building the array is O(n) time and O(n) space, and each range query is O(1), so q queries cost O(n + q) instead of O(n × q). A 2D prefix array over an m × n grid takes O(m × n) to build and answers any rectangle sum in O(1).
---
Some questions ask for the sum of a range again and again: the total of `nums[2..7]`, then of `nums[0..3]`, then of `nums[5..9]`. Others ask how many stretches of an array add up to a target, or which index splits an array into two halves with equal sums. Adding up each range from scratch repeats the same additions over and over. A **prefix sum** array does every addition once, up front, and then answers any range with a single subtraction.

This lesson builds the prefix array and explains its one tricky detail, the extra slot at the front. Then it shows the technique's most important partner, a hash map, which counts subarrays with a given sum even when the array holds negative numbers, and two extensions: 2D prefix sums for grids and difference arrays for range updates. Every example is in C++, Java, Python and JavaScript.

## Why adding up every range is too slow

A range sum on its own is cheap: a loop from l to r, at most n additions. The trouble is repetition. Suppose a problem gives you an array of n = 100,000 numbers and q = 100,000 questions, each asking for the sum of some range. Answering each question with its own loop costs up to n additions per query, so the worst case is n × q = 10¹⁰ additions — a hundred times more than a judge allows in a second.

Questions about **all** subarrays are worse still. An array of n elements has n × (n + 1) / 2 subarrays, about 5 × 10⁹ when n = 100,000, and summing each one from scratch adds another factor of n. Both kinds of question waste work the same way: the sum of `nums[0..6]` and the sum of `nums[0..7]` differ by one element, yet the naive code adds the first seven again.

## The idea: running totals

Walk the array once and write down the running total before each position:

```text
 index:        0    1    2    3    4    5
 nums:      [  2,   4,   1,   3,   5,   2 ]

 prefix:   [ 0,   2,   6,   7,  10,  15,  17 ]
 i:          0    1    2    3    4    5    6

 prefix[i] = nums[0] + nums[1] + ... + nums[i-1]       (the first i numbers)
```

The rules are short:

- **The array has n + 1 entries.** `prefix[0] = 0` is the sum of no numbers at all, and `prefix[n]` is the sum of all of them.
- **Each entry is one addition.** `prefix[i + 1] = prefix[i] + nums[i]`, so building the whole row is O(n).
- **A range is one subtraction.** The sum of `nums[l..r]`, both ends included, is `prefix[r + 1] - prefix[l]`.

The figure below builds the row for this array and then answers the sum of `nums[1..4]`.

@walkthrough

## Why it works

`prefix[r + 1]` is the sum of the first r + 1 numbers: indices 0 to r. `prefix[l]` is the sum of the first l numbers: indices 0 to l − 1. Both totals contain indices 0 to l − 1, so subtracting one from the other cancels that shared part exactly and leaves indices l to r — the range you asked for. No addition is ever repeated, because every range sum is the difference of two totals that were each computed once.

The extra slot at the front is what keeps that formula free of special cases. If the prefix array had only n entries, with `prefix[i]` holding the sum *up to and including* index i, a range starting at index 0 would need `prefix[r]` alone while every other range needed `prefix[r] - prefix[l - 1]`, and `l - 1` would be −1 for the first one. The empty sum at `prefix[0]` makes the range starting at 0 an ordinary case: `prefix[r + 1] - prefix[0]`. Index arithmetic of this kind is where most prefix-sum bugs come from, so pick the n + 1 convention and use it every time.

### Dry run

With the prefix row above, each query is one subtraction:

| Query | prefix[r + 1] | prefix[l] | Sum | Check |
| --- | --- | --- | --- | --- |
| nums[1..4] | prefix[5] = 15 | prefix[1] = 2 | 13 | 4 + 1 + 3 + 5 |
| nums[0..5] | prefix[6] = 17 | prefix[0] = 0 | 17 | the whole array |
| nums[3..3] | prefix[4] = 10 | prefix[3] = 7 | 3 | nums[3] alone |

### The code

The prefix values are stored as 64-bit integers: 100,000 numbers of up to a billion each add up to far more than a 32-bit `int` holds.

```cpp
#include <iostream>
#include <vector>
using namespace std;

// prefix[i] is the sum of the first i numbers, so prefix has n + 1 entries.
vector<long long> buildPrefix(const vector<int>& nums) {
    vector<long long> prefix(nums.size() + 1, 0);   // prefix[0] = 0, the empty sum
    for (size_t i = 0; i < nums.size(); i++) prefix[i + 1] = prefix[i] + nums[i];
    return prefix;
}

// Sum of nums[l..r], both ends included, in O(1).
long long rangeSum(const vector<long long>& prefix, int l, int r) {
    return prefix[r + 1] - prefix[l];   // first r + 1 numbers minus first l numbers
}

int main() {
    vector<int> nums = {2, 4, 1, 3, 5, 2};
    vector<long long> prefix = buildPrefix(nums);
    cout << "prefix:";
    for (long long p : prefix) cout << " " << p;
    cout << "\n";
    int queries[3][2] = {{1, 4}, {0, 5}, {3, 3}};
    for (auto& q : queries) {
        cout << "sum(" << q[0] << ".." << q[1] << ") = " << rangeSum(prefix, q[0], q[1]) << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // prefix[i] is the sum of the first i numbers, so prefix has n + 1 entries.
    static long[] buildPrefix(int[] nums) {
        long[] prefix = new long[nums.length + 1];   // prefix[0] = 0, the empty sum
        for (int i = 0; i < nums.length; i++) prefix[i + 1] = prefix[i] + nums[i];
        return prefix;
    }

    // Sum of nums[l..r], both ends included, in O(1).
    static long rangeSum(long[] prefix, int l, int r) {
        return prefix[r + 1] - prefix[l];   // first r + 1 numbers minus first l numbers
    }

    public static void main(String[] args) {
        int[] nums = {2, 4, 1, 3, 5, 2};
        long[] prefix = buildPrefix(nums);
        StringBuilder row = new StringBuilder("prefix:");
        for (long p : prefix) row.append(" ").append(p);
        System.out.println(row);
        int[][] queries = {{1, 4}, {0, 5}, {3, 3}};
        for (int[] q : queries) {
            System.out.println("sum(" + q[0] + ".." + q[1] + ") = " + rangeSum(prefix, q[0], q[1]));
        }
    }
}
```

```python
def build_prefix(nums):
    """prefix[i] is the sum of the first i numbers, so prefix has n + 1 entries."""
    prefix = [0] * (len(nums) + 1)    # prefix[0] = 0, the empty sum
    for i, x in enumerate(nums):
        prefix[i + 1] = prefix[i] + x
    return prefix


def range_sum(prefix, l, r):
    """Sum of nums[l..r], both ends included, in O(1)."""
    return prefix[r + 1] - prefix[l]  # first r + 1 numbers minus first l numbers


nums = [2, 4, 1, 3, 5, 2]
prefix = build_prefix(nums)
print("prefix:", *prefix)
for l, r in ((1, 4), (0, 5), (3, 3)):
    print(f"sum({l}..{r}) = {range_sum(prefix, l, r)}")
```

```javascript
// prefix[i] is the sum of the first i numbers, so prefix has n + 1 entries.
function buildPrefix(nums) {
  const prefix = new Array(nums.length + 1).fill(0); // prefix[0] = 0, the empty sum
  for (let i = 0; i < nums.length; i++) prefix[i + 1] = prefix[i] + nums[i];
  return prefix;
}

// Sum of nums[l..r], both ends included, in O(1).
function rangeSum(prefix, l, r) {
  return prefix[r + 1] - prefix[l]; // first r + 1 numbers minus first l numbers
}

const nums = [2, 4, 1, 3, 5, 2];
const prefix = buildPrefix(nums);
console.log(`prefix: ${prefix.join(" ")}`);
for (const [l, r] of [[1, 4], [0, 5], [3, 3]]) {
  console.log(`sum(${l}..${r}) = ${rangeSum(prefix, l, r)}`);
}
```

```output
prefix: 0 2 6 7 10 15 17
sum(1..4) = 13
sum(0..5) = 17
sum(3..3) = 3
```

Two easy problems are this formula in disguise. [Running Sum of 1d Array](/problems/running-sum-of-1d-array) asks for the prefix row itself. [Find Pivot Index](/problems/find-pivot-index) asks for an index whose left side and right side add up to the same amount: the left side is `prefix[i]`, the right side is `total - prefix[i + 1]`, and one pass compares them.

## Subarray sum equals k: prefix sums meet a hash map

Now a question that is not about given ranges: *how many contiguous subarrays of nums add up to exactly k?* This is [Subarray Sum Equals K](/problems/subarray-sum-equals-k), one of the most asked prefix-sum problems, and the array may contain negative numbers.

Negative numbers rule out the [sliding window](/roadmap/sliding-window). A window shrinks when its sum is too big, on the assumption that dropping an element lowers the sum; drop a negative number and the sum goes up instead. Prefix sums need no such assumption.

Rewrite the condition with the formula. The subarray from i to j sums to k exactly when `prefix[j + 1] - prefix[i] = k`, that is, when

```text
prefix[i] = prefix[j + 1] - k
```

So as you walk the array keeping a running prefix, the question at each position becomes: *how many earlier prefixes were equal to the current prefix minus k?* Each one is the start of a subarray that ends here and sums to k. A **hash map** from prefix value to how many times it has occurred answers that in O(1). Two details make it correct:

- **Start the map with {0: 1}.** That is `prefix[0]`, the empty sum. Without it, a subarray that starts at index 0 has no earlier prefix to match and is never counted.
- **Look up before you record.** The current prefix is added to the map only after the lookup, so a subarray always has at least one element. If k were 0 and you recorded first, every position would match itself and count an empty subarray.

This is [hashing](/roadmap/hashing) doing for sums what it does in Two Sum: instead of searching for a partner value, you remember every value seen and look the partner up.

### Dry run

nums = `[2, -1, 2, 1, -2, 3]`, k = 3. The map starts as {0: 1}.

| Index | nums | prefix | prefix − k | Seen before | Count | Map gains |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 2 | 2 | −1 | 0 | 0 | 2 |
| 1 | −1 | 1 | −2 | 0 | 0 | 1 |
| 2 | 2 | 3 | 0 | 1 | 1 | 3 |
| 3 | 1 | 4 | 1 | 1 | 2 | 4 |
| 4 | −2 | 2 | −1 | 0 | 2 | 2 (now twice) |
| 5 | 3 | 5 | 2 | 2 | 4 | 5 |

At index 2 the match is the starting 0, so the subarray is indices 0 to 2: 2 − 1 + 2 = 3. At index 3 the match is the prefix 1 recorded at index 1, giving indices 2 to 3: 2 + 1. At index 5 the prefix 2 has been seen twice, after index 0 and after index 4, so two subarrays end here: indices 1 to 5 and index 5 alone. Four in all.

### The code

```cpp
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

// How many contiguous subarrays of nums add up to exactly k. Negative numbers are fine.
int subarraySum(const vector<int>& nums, int k) {
    unordered_map<long long, int> seen;   // prefix value -> how many times it has occurred
    seen[0] = 1;                          // the empty prefix, so subarrays starting at 0 count
    long long prefix = 0;
    int count = 0;
    for (int x : nums) {
        prefix += x;
        auto it = seen.find(prefix - k);  // earlier prefixes p with prefix - p == k
        if (it != seen.end()) count += it->second;
        seen[prefix]++;                   // record this prefix only after the lookup
    }
    return count;
}

int main() {
    vector<int> nums = {2, -1, 2, 1, -2, 3};
    for (int k : {3, 2}) {
        cout << "Subarrays summing to " << k << ": " << subarraySum(nums, k) << "\n";
    }
    return 0;
}
```

```java
import java.util.HashMap;
import java.util.Map;

public class Main {
    // How many contiguous subarrays of nums add up to exactly k. Negative numbers are fine.
    static int subarraySum(int[] nums, int k) {
        Map<Long, Integer> seen = new HashMap<>(); // prefix value -> how many times it has occurred
        seen.put(0L, 1);                           // the empty prefix, so subarrays starting at 0 count
        long prefix = 0;
        int count = 0;
        for (int x : nums) {
            prefix += x;
            count += seen.getOrDefault(prefix - k, 0); // earlier prefixes p with prefix - p == k
            seen.merge(prefix, 1, Integer::sum);       // record this prefix only after the lookup
        }
        return count;
    }

    public static void main(String[] args) {
        int[] nums = {2, -1, 2, 1, -2, 3};
        for (int k : new int[] {3, 2}) {
            System.out.println("Subarrays summing to " + k + ": " + subarraySum(nums, k));
        }
    }
}
```

```python
def subarray_sum(nums, k):
    """How many contiguous subarrays of nums add up to exactly k. Negative numbers are fine."""
    seen = {0: 1}        # prefix value -> how many times it has occurred; 0 is the empty prefix
    prefix = count = 0
    for x in nums:
        prefix += x
        count += seen.get(prefix - k, 0)       # earlier prefixes p with prefix - p == k
        seen[prefix] = seen.get(prefix, 0) + 1  # record this prefix only after the lookup
    return count


nums = [2, -1, 2, 1, -2, 3]
for k in (3, 2):
    print(f"Subarrays summing to {k}: {subarray_sum(nums, k)}")
```

```javascript
// How many contiguous subarrays of nums add up to exactly k. Negative numbers are fine.
function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]); // prefix value -> how many times it has occurred; 0 is the empty prefix
  let prefix = 0;
  let count = 0;
  for (const x of nums) {
    prefix += x;
    count += seen.get(prefix - k) || 0; // earlier prefixes p with prefix - p == k
    seen.set(prefix, (seen.get(prefix) || 0) + 1); // record this prefix only after the lookup
  }
  return count;
}

const nums = [2, -1, 2, 1, -2, 3];
for (const k of [3, 2]) {
  console.log(`Subarrays summing to ${k}: ${subarraySum(nums, k)}`);
}
```

```output
Subarrays summing to 3: 4
Subarrays summing to 2: 5
```

The same pattern, with a different key or a different thing stored, solves a family of problems:

- **Longest subarray with sum k.** Store the *first* index where each prefix value appeared instead of a count; the longest subarray ending at j starts just after the earliest matching prefix. [Contiguous Array](/problems/contiguous-array) is this with a twist: count each 0 as −1, and a subarray with as many 0s as 1s is one whose sum is 0.
- **Sums divisible by k.** Two prefixes with the same remainder modulo k differ by a multiple of k, so key the map on `prefix % k`. [Continuous Subarray Sum](/problems/continuous-subarray-sum) asks whether such a subarray of length at least 2 exists; [Subarray Sums Divisible by K](/problems/subarray-sums-divisible-by-k) asks how many.

## 2D prefix sums

The idea carries over to a grid. Let `P[i][j]` be the sum of the rectangle made of rows 0 to i − 1 and columns 0 to j − 1. It again has one extra row and one extra column of zeroes, for the same reason as before. Any rectangle's sum then follows by **inclusion–exclusion**: take the big rectangle up to its bottom-right corner, remove the strip above it and the strip to its left, and add back the corner block that was removed twice.

```text
             c1          c2
        +-----+-----------+
        |  A  |     B     |        rows above r1
   r1   +-----+-----------+
        |  C  |   want    |
   r2   +-----+-----------+

   P[r2+1][c2+1] = A + B + C + want
   P[r1][c2+1]   = A + B
   P[r2+1][c1]   = A + C
   P[r1][c1]     = A

   want = P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]
```

Building `P` uses the same picture in reverse: `P[i + 1][j + 1]` is the cell `grid[i][j]` plus the rectangle above it plus the rectangle to its left, minus their overlap, which both of them contain.

```cpp
#include <iostream>
#include <vector>
using namespace std;

// P[i][j] is the sum of rows 0..i-1 and columns 0..j-1: one extra row and column of zeroes.
vector<vector<int>> build2D(const vector<vector<int>>& grid) {
    int m = grid.size(), n = grid[0].size();
    vector<vector<int>> P(m + 1, vector<int>(n + 1, 0));
    for (int i = 0; i < m; i++)
        for (int j = 0; j < n; j++)
            P[i + 1][j + 1] = grid[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];  // overlap counted twice
    return P;
}

// Sum of rows r1..r2 and columns c1..c2, all ends included, in O(1).
int regionSum(const vector<vector<int>>& P, int r1, int c1, int r2, int c2) {
    return P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1];  // corner removed twice
}

int main() {
    vector<vector<int>> grid = {{3, 0, 1, 4}, {5, 6, 3, 2}, {1, 2, 0, 1}};
    vector<vector<int>> P = build2D(grid);
    int queries[3][4] = {{1, 1, 2, 2}, {0, 1, 1, 3}, {0, 0, 2, 3}};
    for (auto& q : queries) {
        cout << "rows " << q[0] << "-" << q[2] << ", columns " << q[1] << "-" << q[3] << ": "
             << regionSum(P, q[0], q[1], q[2], q[3]) << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // P[i][j] is the sum of rows 0..i-1 and columns 0..j-1: one extra row and column of zeroes.
    static int[][] build2D(int[][] grid) {
        int m = grid.length, n = grid[0].length;
        int[][] P = new int[m + 1][n + 1];
        for (int i = 0; i < m; i++)
            for (int j = 0; j < n; j++)
                P[i + 1][j + 1] = grid[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];  // overlap counted twice
        return P;
    }

    // Sum of rows r1..r2 and columns c1..c2, all ends included, in O(1).
    static int regionSum(int[][] P, int r1, int c1, int r2, int c2) {
        return P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1];  // corner removed twice
    }

    public static void main(String[] args) {
        int[][] grid = {{3, 0, 1, 4}, {5, 6, 3, 2}, {1, 2, 0, 1}};
        int[][] P = build2D(grid);
        int[][] queries = {{1, 1, 2, 2}, {0, 1, 1, 3}, {0, 0, 2, 3}};
        for (int[] q : queries) {
            System.out.println("rows " + q[0] + "-" + q[2] + ", columns " + q[1] + "-" + q[3] + ": "
                    + regionSum(P, q[0], q[1], q[2], q[3]));
        }
    }
}
```

```python
def build_2d(grid):
    """P[i][j] is the sum of rows 0..i-1 and columns 0..j-1: one extra row and column of zeroes."""
    m, n = len(grid), len(grid[0])
    P = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m):
        for j in range(n):
            P[i + 1][j + 1] = grid[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j]  # overlap counted twice
    return P


def region_sum(P, r1, c1, r2, c2):
    """Sum of rows r1..r2 and columns c1..c2, all ends included, in O(1)."""
    return P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1]  # corner removed twice


grid = [[3, 0, 1, 4], [5, 6, 3, 2], [1, 2, 0, 1]]
P = build_2d(grid)
for r1, c1, r2, c2 in ((1, 1, 2, 2), (0, 1, 1, 3), (0, 0, 2, 3)):
    print(f"rows {r1}-{r2}, columns {c1}-{c2}: {region_sum(P, r1, c1, r2, c2)}")
```

```javascript
// P[i][j] is the sum of rows 0..i-1 and columns 0..j-1: one extra row and column of zeroes.
function build2D(grid) {
  const m = grid.length;
  const n = grid[0].length;
  const P = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      P[i + 1][j + 1] = grid[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j]; // overlap counted twice
  return P;
}

// Sum of rows r1..r2 and columns c1..c2, all ends included, in O(1).
function regionSum(P, r1, c1, r2, c2) {
  return P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1]; // corner removed twice
}

const grid = [[3, 0, 1, 4], [5, 6, 3, 2], [1, 2, 0, 1]];
const P = build2D(grid);
for (const [r1, c1, r2, c2] of [[1, 1, 2, 2], [0, 1, 1, 3], [0, 0, 2, 3]]) {
  console.log(`rows ${r1}-${r2}, columns ${c1}-${c2}: ${regionSum(P, r1, c1, r2, c2)}`);
}
```

```output
rows 1-2, columns 1-2: 11
rows 0-1, columns 1-3: 16
rows 0-2, columns 0-3: 28
```

The first query is 6 + 3 + 2 + 0 = 11, worked out as 21 − 4 − 9 + 3 from the table. [Matrix Block Sum](/problems/matrix-block-sum) is this program with one query per cell, clamped at the grid's edges.

## Difference arrays: prefix sums in reverse

Prefix sums make range *queries* cheap. The reverse problem is range *updates*: "add 2 to every element from index 1 to 3", thousands of times, then report the final array. Updating every element in each range costs O(n) per update. A **difference array** makes each update O(1).

The trick is to record only where a change starts and where it stops. To add v to the range l to r, add v at `diff[l]` and subtract v at `diff[r + 1]`. After all the updates, a running sum over `diff` carries each v forward from l and cancels it just after r:

```text
 n = 6, every element starts at 0; diff has n + 1 = 7 slots

 add  2 to [1..3]:  diff[1] += 2, diff[4] -= 2     diff = [ 0,  2,  0,  0, -2,  0,  0 ]
 add  3 to [2..5]:  diff[2] += 3, diff[6] -= 3     diff = [ 0,  2,  3,  0, -2,  0, -3 ]
 add -1 to [0..1]:  diff[0] -= 1, diff[2] += 1     diff = [-1,  2,  4,  0, -2,  0, -3 ]

 running sum of diff[0..5]                          arr  = [-1,  1,  5,  5,  3,  3 ]
```

Check index 2: it is inside the second update and the first, so it should be 2 + 3 = 5, and it is. The extra slot `diff[n]` exists so that an update ending at the last index has somewhere to put its −v.

[Car Pooling](/problems/car-pooling) is this exactly: each trip adds passengers from its start stop and removes them at its end stop, and the car is over capacity if any running total exceeds the limit. [Corporate Flight Bookings](/problems/corporate-flight-bookings) is the same with seats on flights.

## Other prefix operations

Nothing in the idea is special to addition. It needs an operation whose effect on a shared part can be undone:

- **Prefix XOR.** XOR undoes itself (x XOR x = 0), so the XOR of `nums[l..r]` is `px[r + 1] XOR px[l]`. [XOR Queries of a Subarray](/problems/xor-queries-of-a-subarray) is the range-sum program with `^` in place of `+` and `-`.
- **Prefix and suffix products.** Products can be undone only by division, which fails on zeroes. [Product of Array Except Self](/problems/product-of-array-except-self) avoids division altogether: multiply the product of everything to the left of i (a prefix product) by the product of everything to its right (a suffix product).
- **Prefix counts.** A running count of vowels, of 1s or of a given letter answers "how many in this range" the same way. [Maximum Score After Splitting a String](/problems/maximum-score-after-splitting-a-string) counts the 0s to the left of each split and the 1s to its right.

A maximum or a minimum cannot be undone — knowing the largest value in `nums[0..r]` and in `nums[0..l-1]` says nothing about `nums[l..r]` — so range-maximum queries need a different structure, such as a sparse table or a segment tree.

## Time and space complexity

| Task | Naive | With prefix sums |
| --- | --- | --- |
| q range-sum queries | O(n × q) | O(n + q) |
| Count subarrays with sum k | O(n²) checking every pair of ends | O(n) time, O(n) space with a hash map |
| Rectangle sums in an m × n grid | O(m × n) per query | O(m × n) once, then O(1) per query |
| q range updates, then read the array | O(n × q) | O(n + q) with a difference array |

The prefix array costs O(n) extra space; when only one pass is needed, a single running variable is enough, as in the hash-map code above.

## How to recognise a prefix-sum problem

- The statement asks for **the sum of a range**, especially many times: "q queries", "for each i, the sum of everything before it".
- It asks **how many subarrays** have a sum equal to, or divisible by, some k — especially when the numbers can be **negative**, which rules out a sliding window.
- It compares **the left part and the right part** of an array around each index: pivot index, equal-sum splits, left and right differences.
- It applies **many updates to ranges** and only then asks for the result: a difference array.
- It asks for **rectangle sums** in a grid: a 2D prefix array.

If instead the question wants the largest sum of any subarray, a prefix array can do it, but the cleaner tool is [Kadane's algorithm](/roadmap/kadanes-algorithm), the next lesson in this stage.

## Common mistakes

- **Mixing up the two conventions.** With an n + 1 array the range l to r is `prefix[r + 1] - prefix[l]`. Writing `prefix[r] - prefix[l]` silently drops `nums[r]`.
- **Forgetting the {0: 1} seed.** Without the empty prefix in the map, subarrays that start at index 0 are never counted. For "longest subarray" variants the seed is index −1 instead.
- **Recording the prefix before the lookup.** With k = 0 every position then matches itself and counts an empty subarray.
- **Integer overflow.** Prefix values grow with the array. Use `long long` in C++ and `long` in Java when the input's sum can pass about two billion.
- **Negative remainders.** In C++, Java and JavaScript, `-7 % 3` is −1, not 2. When the array holds negative numbers and you key a map on `prefix % k`, normalise with `((prefix % k) + k) % k`, or two equal remainders will look different.
- **Off-by-one in a difference array.** The update for l to r ends at `diff[r + 1]`, so the array needs n + 1 slots.

## Practice in this order

1. [Running Sum of 1d Array](/problems/running-sum-of-1d-array): build the prefix row.
2. [Find Pivot Index](/problems/find-pivot-index): left sum against right sum, from one total.
3. [Left and Right Sum Differences](/problems/left-and-right-sum-differences): prefix and suffix sums side by side.
4. [Subarray Sum Equals K](/problems/subarray-sum-equals-k): the hash map of prefix counts.
5. [Contiguous Array](/problems/contiguous-array): turn 0s into −1s and store first indices for the longest subarray.
6. [Continuous Subarray Sum](/problems/continuous-subarray-sum): key the map on remainders.
7. [Product of Array Except Self](/problems/product-of-array-except-self): prefix and suffix products without division.
8. [Car Pooling](/problems/car-pooling): a difference array over the stops.
9. [Matrix Block Sum](/problems/matrix-block-sum): 2D prefix sums with clamped edges.

The [prefix sum problem list](/challenges/prefix-sum) has every problem in the catalogue that uses the technique. The next lesson in this stage, [Kadane's algorithm](/roadmap/kadanes-algorithm), solves the maximum subarray problem in one pass, and shows how it relates to prefix sums.

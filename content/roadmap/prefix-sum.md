---
title: Prefix Sum
stage: prefix-sums
order: 1
minutes: 12
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
Some questions ask for the sum of a range again and again: the total of `nums[2..7]`, then of `nums[0..3]`, then of `nums[5..9]`. Others ask how many stretches of an array add up to a target. A **prefix sum** array does every addition once, up front, and then answers any range with a single subtraction. With a hash map beside it, it also counts subarrays with a given sum, even when the array holds negative numbers.

## Why adding up every range is too slow

One range sum is cheap: a loop from l to r. The trouble is repetition. With n = 100,000 numbers and q = 100,000 queries, a loop per query costs up to n × q = 10¹⁰ additions, a hundred times what a judge allows in a second. Neighbouring ranges share almost all their numbers, and the naive code adds the shared part again every time.

@figure repeats

## The idea: running totals

Walk the array once and write down the running total before each position:

- **The array has n + 1 entries.** `prefix[0] = 0` is the sum of no numbers, and `prefix[n]` is the sum of all of them.
- **Each entry is one addition.** `prefix[i + 1] = prefix[i] + nums[i]`, so building the row is O(n).
- **A range is one subtraction.** The sum of `nums[l..r]`, both ends included, is `prefix[r + 1] - prefix[l]`.

@walkthrough

## Why it works

Think of the numbers as lengths laid end to end. Each prefix value is a mark on that ruler, and a range sum is the distance between two marks. `prefix[r + 1]` and `prefix[l]` both measure from the same start, so subtracting one cancels the shared part exactly. Every range is the difference of two totals that were each computed once, so nothing is added twice.

@figure ruler

The extra slot at the front keeps the formula free of special cases. With only n entries, a range starting at index 0 would need `prefix[r]` alone while every other range needed `prefix[r] - prefix[l - 1]`. Index arithmetic is where prefix-sum bugs live, so pick the n + 1 convention and use it every time.

### The code

The prefix values are 64-bit: 100,000 numbers of up to a billion each overflow a 32-bit `int`.

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

[Running Sum of 1d Array](/problems/running-sum-of-1d-array) asks for the prefix row itself. [Find Pivot Index](/problems/find-pivot-index) wants an index whose left side, `prefix[i]`, equals its right side, `total - prefix[i + 1]`.

## Subarray sum equals k: prefix sums meet a hash map

*How many contiguous subarrays add up to exactly k?* That is [Subarray Sum Equals K](/problems/subarray-sum-equals-k), and the array may hold negative numbers, which rules out the [sliding window](/roadmap/sliding-window): dropping a negative element raises a window's sum instead of lowering it.

The subarray from i to j sums to k exactly when `prefix[i] = prefix[j + 1] - k`. So walk the array with a running prefix and ask at each position: *how many earlier prefixes equal the current one minus k?* Each one starts a subarray that ends here. A **hash map** from prefix value to how often it has appeared answers that in O(1), with two details:

- **Start the map with {0: 1}**, the empty prefix, or subarrays that start at index 0 are never counted.
- **Look up before you record**, so every subarray found has at least one element.

This is [hashing](/roadmap/hashing) doing for sums what it does in Two Sum: remember every value seen and look the partner up.

@figure hash-count

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

Store something else and the same loop solves more. Keep the *first* index of each prefix and you get the longest subarray with sum k; [Contiguous Array](/problems/contiguous-array) is that, with each 0 counted as −1. Key the map on `prefix % k` and you get sums divisible by k, because two prefixes with equal remainders differ by a multiple of k: [Continuous Subarray Sum](/problems/continuous-subarray-sum) and [Subarray Sums Divisible by K](/problems/subarray-sums-divisible-by-k).

## 2D prefix sums

On a grid, let `P[i][j]` be the sum of rows 0 to i − 1 and columns 0 to j − 1, again with an extra row and column of zeroes. Any rectangle then takes four lookups, by **inclusion–exclusion**.

@figure rectangles

Building `P` is the same picture in reverse: `P[i + 1][j + 1] = grid[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j]`, since the block above and the block to the left share a corner. [Matrix Block Sum](/problems/matrix-block-sum) is one rectangle query per cell.

## Difference arrays: prefix sums in reverse

The reverse problem is range *updates*: "add 2 to every element from 1 to 3", thousands of times, then report the array. Writing every element costs O(n) per update. A **difference array** records only where each change starts and stops, and one running sum at the end applies them all.

@figure difference

[Car Pooling](/problems/car-pooling) is exactly this: a trip adds passengers at one stop and removes them at another, and the car is over capacity if any running total passes the limit. [Corporate Flight Bookings](/problems/corporate-flight-bookings) does the same with seats.

## Other prefix operations

The idea needs only an operation whose effect on a shared part can be undone. XOR undoes itself, so the XOR of `nums[l..r]` is `px[r + 1] ^ px[l]` ([XOR Queries of a Subarray](/problems/xor-queries-of-a-subarray)). Products cannot be divided out past a zero, so [Product of Array Except Self](/problems/product-of-array-except-self) multiplies a prefix product by a suffix product instead. Running counts of vowels or 1s work like sums, as in [Maximum Score After Splitting a String](/problems/maximum-score-after-splitting-a-string). A maximum cannot be undone, so range-maximum queries need a sparse table or a segment tree.

## Time and space complexity

| Task | Naive | With prefix sums |
| --- | --- | --- |
| q range-sum queries | O(n × q) | O(n + q) |
| Count subarrays with sum k | O(n²) | O(n) time, O(n) space |
| Rectangle sums in an m × n grid | O(m × n) per query | O(m × n) once, O(1) per query |
| q range updates, then read the array | O(n × q) | O(n + q) |

## How to recognise a prefix-sum problem

- It asks for **range sums**, especially many of them: "q queries", "the sum of everything before i".
- It asks **how many subarrays** have a sum equal to, or divisible by, k — especially with **negative** numbers.
- It compares the **left and right parts** of an array around each index.
- It applies **many range updates** and only then reads the result, or asks for **rectangle sums** in a grid.

If it wants the largest sum of any subarray, use [Kadane's algorithm](/roadmap/kadanes-algorithm), the next lesson.

## Common mistakes

- **`prefix[r] - prefix[l]`** silently drops `nums[r]`; with n + 1 entries it is `prefix[r + 1] - prefix[l]`.
- **Forgetting the {0: 1} seed**, so subarrays starting at index 0 are never counted.
- **Recording before the lookup**: with k = 0 every position matches itself.
- **Overflow**: use `long long` or `long` once sums can pass two billion.
- **Negative remainders**: `-7 % 3` is −1 in C++, Java and JavaScript; normalise with `((p % k) + k) % k`.

## Practice in this order

1. [Running Sum of 1d Array](/problems/running-sum-of-1d-array): build the prefix row.
2. [Find Pivot Index](/problems/find-pivot-index): left sum against right sum.
3. [Left and Right Sum Differences](/problems/left-and-right-sum-differences): prefix and suffix sums side by side.
4. [Subarray Sum Equals K](/problems/subarray-sum-equals-k): the hash map of prefix counts.
5. [Contiguous Array](/problems/contiguous-array): first indices for the longest subarray.
6. [Continuous Subarray Sum](/problems/continuous-subarray-sum): key the map on remainders.
7. [Product of Array Except Self](/problems/product-of-array-except-self): prefix and suffix products.
8. [Car Pooling](/problems/car-pooling): a difference array over the stops.
9. [Matrix Block Sum](/problems/matrix-block-sum): 2D prefix sums with clamped edges.

The [prefix sum problem list](/challenges/prefix-sum) has every problem in the catalogue that uses the technique. Next in this stage, [Kadane's algorithm](/roadmap/kadanes-algorithm) finds the maximum subarray in one pass — a prefix-sum argument in disguise.

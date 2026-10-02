---
title: Arrays
stage: arrays
order: 2
minutes: 13
level: Beginner
hub: arrays
practice: running-sum-of-1d-array, concatenation-of-array, build-array-from-permutation, richest-customer-wealth, contains-duplicate, best-time-to-buy-and-sell-stock, maximum-subarray, product-of-array-except-self
updated: 2026-10-03
seo-title: Arrays in Data Structures: Operations, Costs and Patterns
description: How arrays work: memory layout, O(1) indexing, insert and delete costs, dynamic arrays and one-pass patterns, in C++, Java, Python and JavaScript.
question: What is an array in data structures?
answer: An array stores elements of one type side by side in a single block of memory, so the address of element i is the start address plus i times the element size. That makes reading or writing any index O(1), while inserting or deleting in the middle is O(n) because later elements must shift. Dynamic arrays such as vector, ArrayList and Python's list add appends in amortised O(1).
q: Why is accessing an array element O(1)?
a: The elements sit next to each other and all have the same size, so the address of element i is the start address plus i times that size: one multiplication and one addition, whatever i is. Nothing is scanned. A linked list, by contrast, has to follow i links to reach its i-th node, which costs O(i).
q: Why is inserting into the middle of an array O(n)?
a: The elements must stay contiguous and in order, so inserting at index i shifts every element from i onwards one place to the right to open a gap, and deleting shifts them one place left to close it. In the worst case, at the front, that is all n elements. Appending at the end moves nothing, which is why it is cheap.
q: What is the difference between an array and a dynamic array?
a: A plain array, such as int[] in Java or a C array, has a fixed length chosen when it is created. A dynamic array such as std::vector, ArrayList, a Python list or a JavaScript array keeps spare capacity and, when it fills up, moves to a block about twice as big. That makes appending amortised O(1) while indexing stays O(1).
q: Are Python lists and JavaScript arrays real arrays?
a: Python's list is a dynamic array of references to objects: indexing is O(1), append is amortised O(1) and insert at the front is O(n). JavaScript engines such as V8 store dense arrays contiguously, but an array with holes or far-apart indexes can fall back to slower dictionary storage, so keep arrays dense and fill them in order.
q: How do I get better at array problems for interviews?
a: Learn a handful of patterns rather than individual problems: a single pass that carries state such as a running minimum, left and right passes, prefix sums, two pointers and a hash map of values seen. For each new problem, first write the brute force and its cost, then ask which of those patterns removes the repeated work.
---
An **array** is the data structure almost every coding problem hands you its input in. Knowing exactly what it makes cheap and what it makes expensive lets you reject a slow idea before you write it, and a few one-pass patterns over an array solve a surprising share of interview questions. If Big-O is new to you, read [Time and Space Complexity](/roadmap/big-o-notation) first.

## How an array is stored

An array keeps its elements **contiguously**: one unbroken block of memory, in index order, every element the same size. Everything else in this lesson follows from that one fact.

@figure memory-layout

The address formula is why indexing is **O(1)** and why indexes start at 0. Contiguity has a second benefit: memory reaches the processor in 64-byte cache lines, so a loop that walks an array in order beats one that jumps around memory, even when both are O(n). Step outside the block and C++ gives undefined behaviour, Java and Python throw, and JavaScript quietly returns `undefined`.

## The operations and their cost

| Operation | Cost | Why |
| --- | --- | --- |
| Read or write `arr[i]` | O(1) | the address is computed |
| Search an unsorted array | O(n) | any element might be the one |
| Search a sorted array | O(log n) | [binary search](/roadmap/binary-search) halves the range |
| Append (dynamic array) | O(1) amortised | spare capacity, an occasional resize |
| Remove the last element | O(1) | nothing else moves |
| Insert or delete at index i | O(n − i) | everything after i shifts |
| Insert or delete at the front | O(n) | every element shifts |

Inserting is the expensive one, because the block must stay unbroken and in order:

@figure insert-shift

When order does not matter, deleting has a shortcut: copy the last element into the gap and drop the last slot, O(1).

## Dynamic arrays in each language

Most of the time you use a **dynamic array** — `vector<int>` in C++, `ArrayList` in Java, Python's `list`, a JavaScript `Array` — which hides the fixed length. When an append finds the block full, it moves everything to a block about twice as big:

@figure dynamic-growth

Because the capacity grows by a factor, not a fixed amount, n appends cost O(n) in total: **amortised O(1)** each. The [Big-O lesson](/roadmap/big-o-notation) proves it in general. Two traps: Java's `ArrayList<Integer>` stores boxed objects, several times the memory of an `int[]`, and JavaScript's `shift` and `unshift` work at the front, so they are O(n).

## The single pass with state

Many problems that seem to need every pair of elements fall to one pass that carries the right **state**: a few variables summarising everything left of the current index. The classic is [Best Time to Buy and Sell Stock](/problems/best-time-to-buy-and-sell-stock): buy on one day, sell on a later one, and find the largest profit, or 0. Trying every pair of days is about 5 × 10⁹ checks when n = 10⁵. The pattern's rules:

- **Decide what you need to know about the prefix** — here, the cheapest price so far.
- **Keep exactly that in variables**, updated in O(1) per element.
- **Use the state before adding the current element to it**, when an element must not pair with itself.

@walkthrough

## Why the running minimum is enough

A shortcut is only safe if it never skips the best answer. Fix the sell day: every trade selling that day subtracts its buy price from the same sell price, so the cheapest earlier day beats all the others.

@figure cheapest-buy

As an **invariant**: after day i, `minPrice` is the cheapest price of days 0 to i and `best` the largest profit of any trade selling by day i. Both hold after day 0 and each step keeps them. It also shows why "highest minus lowest" is wrong: the highest price may come first.

The same shape gives a running total in [Running Sum of 1d Array](/problems/running-sum-of-1d-array) or a running maximum. [Maximum Subarray](/problems/maximum-subarray) carries a cleverer state, the best sum ending here: [Kadane's algorithm](/roadmap/kadanes-algorithm).

### The code

The program runs the pass on the example above and on a price list that only falls.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

// Best profit from one buy followed by one later sell; 0 if prices only fall.
int maxProfit(const vector<int>& prices) {
    int minPrice = prices[0];   // cheapest price seen so far
    int best = 0;               // best profit seen so far
    for (int i = 1; i < (int)prices.size(); i++) {
        best = max(best, prices[i] - minPrice);   // sell today, bought on the cheapest day before
        minPrice = min(minPrice, prices[i]);      // today may be the cheapest day for later sales
    }
    return best;
}

int main() {
    vector<vector<int>> examples = {{7, 1, 5, 3, 6, 4}, {7, 6, 4, 3, 1}};
    for (const vector<int>& prices : examples) {
        cout << "Prices";
        for (int p : prices) cout << " " << p;
        cout << ": best profit " << maxProfit(prices) << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // Best profit from one buy followed by one later sell; 0 if prices only fall.
    static int maxProfit(int[] prices) {
        int minPrice = prices[0];   // cheapest price seen so far
        int best = 0;               // best profit seen so far
        for (int i = 1; i < prices.length; i++) {
            best = Math.max(best, prices[i] - minPrice);   // sell today, bought on the cheapest day before
            minPrice = Math.min(minPrice, prices[i]);      // today may be the cheapest day for later sales
        }
        return best;
    }

    public static void main(String[] args) {
        int[][] examples = {{7, 1, 5, 3, 6, 4}, {7, 6, 4, 3, 1}};
        for (int[] prices : examples) {
            StringBuilder line = new StringBuilder("Prices");
            for (int p : prices) line.append(" ").append(p);
            line.append(": best profit ").append(maxProfit(prices));
            System.out.println(line);
        }
    }
}
```

```python
def max_profit(prices):
    """Best profit from one buy followed by one later sell; 0 if prices only fall."""
    min_price = prices[0]   # cheapest price seen so far
    best = 0                # best profit seen so far
    for i in range(1, len(prices)):
        best = max(best, prices[i] - min_price)   # sell today, bought on the cheapest day before
        min_price = min(min_price, prices[i])     # today may be the cheapest day for later sales
    return best


examples = [[7, 1, 5, 3, 6, 4], [7, 6, 4, 3, 1]]
for prices in examples:
    print("Prices", *prices, end="")
    print(f": best profit {max_profit(prices)}")
```

```javascript
// Best profit from one buy followed by one later sell; 0 if prices only fall.
function maxProfit(prices) {
  let minPrice = prices[0]; // cheapest price seen so far
  let best = 0; // best profit seen so far
  for (let i = 1; i < prices.length; i++) {
    best = Math.max(best, prices[i] - minPrice); // sell today, bought on the cheapest day before
    minPrice = Math.min(minPrice, prices[i]); // today may be the cheapest day for later sales
  }
  return best;
}

const examples = [
  [7, 1, 5, 3, 6, 4],
  [7, 6, 4, 3, 1],
];
for (const prices of examples) {
  console.log(`Prices ${prices.join(" ")}: best profit ${maxProfit(prices)}`);
}
```

```output
Prices 7 1 5 3 6 4: best profit 5
Prices 7 6 4 3 1: best profit 0
```

## Left and right passes

Some questions ask, for every index, about everything on **both** sides of it. [Product of Array Except Self](/problems/product-of-array-except-self) wants the product of every element except `nums[i]`, in O(n) and without division (which breaks on zeros anyway). Multiplying the other n − 1 values per index is O(n²); splitting the question in two is O(n):

@figure left-right

The output array does not count as extra space by convention, so this is O(1) extra. The same left and right passes find the tallest bar on each side in [Trapping Rain Water](/problems/trapping-rain-water) and the sums on either side in [Find Pivot Index](/problems/find-pivot-index).

### The code

```cpp
#include <iostream>
#include <vector>
using namespace std;

// answer[i] = product of every element except nums[i], without division.
vector<int> productExceptSelf(const vector<int>& nums) {
    int n = nums.size();
    vector<int> answer(n, 1);
    for (int i = 1; i < n; i++)
        answer[i] = answer[i - 1] * nums[i - 1];   // left pass: product of everything before i
    int right = 1;                                 // product of everything after i
    for (int i = n - 1; i >= 0; i--) {
        answer[i] *= right;                        // left product times right product
        right *= nums[i];
    }
    return answer;
}

int main() {
    vector<vector<int>> examples = {{1, 2, 3, 4}, {-1, 1, 0, -3, 3}};
    for (const vector<int>& nums : examples) {
        vector<int> answer = productExceptSelf(nums);
        cout << "Input:";
        for (int x : nums) cout << " " << x;
        cout << " -> output:";
        for (int x : answer) cout << " " << x;
        cout << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // answer[i] = product of every element except nums[i], without division.
    static int[] productExceptSelf(int[] nums) {
        int n = nums.length;
        int[] answer = new int[n];
        answer[0] = 1;
        for (int i = 1; i < n; i++)
            answer[i] = answer[i - 1] * nums[i - 1];   // left pass: product of everything before i
        int right = 1;                                 // product of everything after i
        for (int i = n - 1; i >= 0; i--) {
            answer[i] *= right;                        // left product times right product
            right *= nums[i];
        }
        return answer;
    }

    public static void main(String[] args) {
        int[][] examples = {{1, 2, 3, 4}, {-1, 1, 0, -3, 3}};
        for (int[] nums : examples) {
            int[] answer = productExceptSelf(nums);
            StringBuilder line = new StringBuilder("Input:");
            for (int x : nums) line.append(" ").append(x);
            line.append(" -> output:");
            for (int x : answer) line.append(" ").append(x);
            System.out.println(line);
        }
    }
}
```

```python
def product_except_self(nums):
    """answer[i] = product of every element except nums[i], without division."""
    n = len(nums)
    answer = [1] * n
    for i in range(1, n):
        answer[i] = answer[i - 1] * nums[i - 1]   # left pass: product of everything before i
    right = 1                                     # product of everything after i
    for i in range(n - 1, -1, -1):
        answer[i] *= right                        # left product times right product
        right *= nums[i]
    return answer


examples = [[1, 2, 3, 4], [-1, 1, 0, -3, 3]]
for nums in examples:
    print("Input:", *nums, "-> output:", *product_except_self(nums))
```

```javascript
// answer[i] = product of every element except nums[i], without division.
function productExceptSelf(nums) {
  const n = nums.length;
  const answer = new Array(n).fill(1);
  for (let i = 1; i < n; i++) {
    answer[i] = answer[i - 1] * nums[i - 1]; // left pass: product of everything before i
  }
  let right = 1; // product of everything after i
  for (let i = n - 1; i >= 0; i--) {
    answer[i] *= right; // left product times right product
    right *= nums[i];
  }
  return answer;
}

const examples = [
  [1, 2, 3, 4],
  [-1, 1, 0, -3, 3],
];
for (const nums of examples) {
  console.log(`Input: ${nums.join(" ")} -> output: ${productExceptSelf(nums).join(" ")}`);
}
```

```output
Input: 1 2 3 4 -> output: 24 12 8 6
Input: -1 1 0 -3 3 -> output: 0 0 9 0 0
```

## Editing in place

"In place" means changing the input instead of building a new array, so the extra space is O(1). The tools are **swaps** (reverse; rotate with three reversals, as in [Rotate Array](/problems/rotate-array)), a **write index** (the read-and-write [two pointers](/roadmap/two-pointers) behind [Move Zeroes](/problems/move-zeroes)) and **running updates** such as `nums[i] += nums[i - 1]`. The danger in all of them is **overwriting a value you still need to read**:

@figure overwrite-trap

The encoding works because every value is below n, so one slot holds the old value as the remainder and the new one as the quotient. Deleting while looping forwards fails the same way — the next element shifts into the current index and is skipped — so loop backwards, or use a write index.

## Two-dimensional arrays

A grid with m rows and n columns is an array of arrays, `grid[r][c]`. Java, Python and JavaScript store each row as its own array; a fixed C-style `int grid[m][n]` is one block:

@figure row-major

Rows outside, columns inside visits memory in order, O(m × n) — [Richest Customer Wealth](/problems/richest-customer-wealth) is one sum per row. In Python, never write `[[0] * n] * m`: it repeats one row object, so writing to one row writes to all; use `[[0] * n for _ in range(m)]`. Spirals and rotation are in the [matrix](/roadmap/matrix) lesson.

## Time and space complexity

| Problem | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Buy and Sell Stock | every pair of days | O(n²) | O(1) |
| Buy and Sell Stock | running minimum | O(n) | O(1) |
| Product Except Self | multiply the others per index | O(n²) | O(1) |
| Product Except Self | left products, right in one variable | O(n) | O(1) besides the output |
| Build Array from Permutation | two values in each slot | O(n) | O(1) |

The brute force recomputes something for every index; the fast version computes it once and carries it along. That is the point of this stage.

## How to recognise the pattern

- **"Before" and "after" in a pair**, such as buy before sell: a running minimum or maximum.
- **"For each element, everything else"**: left and right passes.
- **A range sum asked many times**: [prefix sums](/roadmap/prefix-sum).
- **"In place" or "O(1) extra space"**: a write index or swaps.
- **A contiguous subarray** with a best sum or a condition: Kadane's algorithm or a [sliding window](/roadmap/sliding-window).
- **"Have I seen this value before?"**: a hash map — [Hashing](/roadmap/hashing).

## Common mistakes

- **Off by one at the ends.** The last index is n − 1; a pass that reads `i - 1` starts at 1.
- **Empty input.** `prices[0]` on an empty array crashes; guard when n = 0 is allowed.
- **Front inserts inside a loop.** Each is O(n), so the loop becomes O(n²).
- **Overflow.** 10⁵ values up to 10⁹ need 64 bits: `long long` in C++, `long` in Java.
- **Aliasing.** `b = a` names one array twice in Java, Python and JavaScript; copy with `a.clone()`, `a[:]` or `a.slice()`.

## Practice in this order

1. [Running Sum of 1d Array](/problems/running-sum-of-1d-array): a running total, in place.
2. [Concatenation of Array](/problems/concatenation-of-array): indexing with an offset.
3. [Build Array from Permutation](/problems/build-array-from-permutation): the overwrite trap and its encoding.
4. [Richest Customer Wealth](/problems/richest-customer-wealth): one sum per row of a grid.
5. [Contains Duplicate](/problems/contains-duplicate): sort and compare neighbours, or a set.
6. [Best Time to Buy and Sell Stock](/problems/best-time-to-buy-and-sell-stock): the running minimum.
7. [Maximum Subarray](/problems/maximum-subarray): one pass with smarter state.
8. [Product of Array Except Self](/problems/product-of-array-except-self): left and right passes.

Every array problem in the catalogue is on the [array problem list](/challenges/arrays), easiest first. When the first six feel routine, move on to [Hashing](/roadmap/hashing).

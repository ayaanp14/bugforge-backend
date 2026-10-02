---
title: Arrays
stage: arrays
order: 2
minutes: 22
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
An **array** is the first data structure in every course and the one almost every coding problem hands you its input in. It looks too simple to need a lesson, but knowing exactly what an array makes cheap and what it makes expensive is what lets you reject a slow idea before you write it, and a few patterns built on a single pass over an array solve a surprising share of interview questions.

This lesson covers how an array sits in memory and why that makes indexing O(1), the real cost of inserting and deleting, how dynamic arrays grow, and three patterns you will use in every later stage: a single pass that carries state, left and right passes, and editing in place. It ends with two-dimensional arrays. If Big-O is new to you, read [Time and Space Complexity](/roadmap/big-o-notation) first. Every program is shown in C++, Java, Python and JavaScript.

## How an array is stored

An array keeps its elements **contiguously**: in one unbroken block of memory, in index order, each element taking the same number of bytes. Five 4-byte integers starting at address 1000 occupy addresses 1000 to 1019.

```text
 index:        0       1       2       3       4
 value:     [  7   |   1   |   5   |   3   |   6   ]
 address:    1000    1004    1008    1012    1016      (4-byte ints, block starts at 1000)

 address of arr[i] = 1000 + i × 4
```

That formula is the whole reason arrays are fast. To read `arr[3]` the machine does not look at elements 0, 1 and 2; it computes 1000 + 3 × 4 = 1012 and reads there. One multiplication and one addition, whatever the index and however long the array: **O(1) random access**. It is also why indexes start at 0 in C++, Java, Python and JavaScript. An index is an offset from the start, and the first element is zero steps away.

Contiguity has a second, less visible benefit. Memory reaches the processor in chunks called cache lines, usually 64 bytes, so reading one integer brings its fifteen neighbours along for free. A loop that walks an array in order is therefore much faster in practice than one that jumps around memory, even when both are O(n). Big-O does not show this, but it is why arrays are the default container in every language.

The price is that a plain array has a **fixed length**. The block was sized when the array was created, and the memory just after it may belong to something else, so the array cannot simply grow in place. Languages also differ on what happens if you step outside it: C++ does not check, and reading `arr[n]` is undefined behaviour that may print rubbish or crash; Java throws `ArrayIndexOutOfBoundsException`; Python raises `IndexError` (while a negative index counts from the end); JavaScript quietly returns `undefined`.

## The operations and their cost

| Operation | Cost | Why |
| --- | --- | --- |
| Read or write `arr[i]` | O(1) | the address is computed directly |
| Search for a value in an unsorted array | O(n) | any element might be the one |
| Search in a sorted array | O(log n) | [binary search](/roadmap/binary-search) halves the range each step |
| Append at the end of a dynamic array | O(1) amortised | spare capacity, with an occasional resize |
| Remove the last element | O(1) | nothing else moves |
| Insert at index i | O(n − i) | everything from i onwards shifts right |
| Delete at index i | O(n − i) | everything after i shifts left |
| Insert or delete at the front | O(n) | every element shifts |

Inserting is expensive because the block must stay contiguous and in order. To put 9 at index 1, every element from index 1 onwards moves one place right, starting from the back so that nothing is overwritten before it has been copied:

```text
 insert 9 at index 1
 before:   [ 7, 1, 5, 3, 6, _ ]
 shift:          1→  5→  3→  6→        move 6, then 3, then 5, then 1 one place right
 after:    [ 7, 9, 1, 5, 3, 6 ]
```

Deleting is the mirror image: everything after the gap moves one place left. When the order of the elements does not matter, there is a well-known shortcut: copy the last element into the slot you are deleting and remove the last element, which is O(1).

## Dynamic arrays in each language

Most of the time you will not use fixed arrays but **dynamic arrays**, which hide the fixed length. A dynamic array keeps a size (how many elements are in use) and a capacity (how many fit in the current block). When an append finds the block full, it allocates a block about one and a half to two times bigger, copies everything across and carries on. A single resize costs O(n), but because the capacity grows by a factor the resizes are rare, and n appends cost O(n) in total: **amortised O(1)** per append. The [Big-O lesson](/roadmap/big-o-notation) counts the copies to show why.

| Task | C++ | Java | Python | JavaScript |
| --- | --- | --- | --- | --- |
| Type | `vector<int>` | `int[]` (fixed) or `ArrayList<Integer>` | `list` | `Array` |
| Create n zeroes | `vector<int> a(n, 0)` | `new int[n]` | `[0] * n` | `new Array(n).fill(0)` |
| Append | `a.push_back(x)` | `list.add(x)` | `a.append(x)` | `a.push(x)` |
| Remove last | `a.pop_back()` | `list.remove(list.size() - 1)` | `a.pop()` | `a.pop()` |
| Insert at i | `a.insert(a.begin() + i, x)` | `list.add(i, x)` | `a.insert(i, x)` | `a.splice(i, 0, x)` |
| Delete at i | `a.erase(a.begin() + i)` | `list.remove(i)` | `del a[i]` | `a.splice(i, 1)` |
| Length | `a.size()` | `arr.length`, `list.size()` | `len(a)` | `a.length` |

A few details catch people out. Java's `ArrayList<Integer>` stores boxed `Integer` objects, which use several times the memory of an `int[]` and are slower to read, so prefer `int[]` when you know the size. On an `ArrayList<Integer>`, `list.remove(2)` removes the element at index 2, while `list.remove(Integer.valueOf(2))` removes the value 2. In C++, `a.reserve(n)` sets the capacity up front so no resize ever happens, and any pointer or iterator into a vector becomes invalid when it resizes. A Python list stores references to objects rather than the numbers themselves. JavaScript's `shift` and `unshift` work at the front, so treat them as O(n).

## The single pass with state

Most array problems that look like they need every pair of elements can be solved in one pass if you carry the right **state**: a few variables that summarise everything to the left of the current index. The classic example is [Best Time to Buy and Sell Stock](/problems/best-time-to-buy-and-sell-stock): `prices[i]` is a share's price on day i, and you may buy once and sell once on a later day. What is the largest profit, or 0 if no trade makes money?

The brute force tries every pair of buy day and later sell day: n(n − 1)/2 pairs, about 5 × 10⁹ when n = 10⁵. Far too slow. Now fix the sell day and ask which buy day is best. It is simply the **cheapest day before it**. So a single left-to-right pass only has to remember two numbers:

```text
 prices:            7    1    5    3    6    4
 cheapest so far:   7    1    1    1    1    1
 sell today:        -   -6    4    2    5    3      (price − cheapest before today)
 best so far:       0    0    4    4    5    5
```

The rules of the pattern are:

- **Decide what you need to know about the prefix** to answer for the current element. Here it is the minimum price so far.
- **Keep exactly that in variables** and update it in O(1) per element. The minimum of the first i + 1 prices is the smaller of the minimum of the first i and `prices[i]`.
- **Use the state before you add the current element to it**, when the element must not pair with itself. (For this problem either order works, since selling on the day you buy earns 0.)

@walkthrough

## Why the running minimum is enough

The worry with any shortcut is that it might skip the best answer, so it is worth seeing why this one never does. Take the best possible trade, buying on day b and selling on day s. The price on day b must be the cheapest price among days 0 to s − 1: if some earlier day were cheaper, buying then and selling on day s would earn more, contradicting the choice of best trade. So for every sell day only one buy day needs considering, the cheapest one before it, and that is exactly the `minPrice` the pass holds when it reaches day s.

Put as an **invariant**: after processing day i, `minPrice` is the cheapest price among days 0 to i, and `best` is the largest profit of any trade that sells on or before day i. Both are true after day 0, each step keeps them true, and after the last day `best` is the answer. Checking n candidates instead of n²/2 pairs loses nothing.

The same shape, one pass with a small summary of the past, solves a whole family of problems: a running total in [Running Sum of 1d Array](/problems/running-sum-of-1d-array), a running maximum, a count of elements seen so far, the last index where something happened. [Maximum Subarray](/problems/maximum-subarray) uses it with a cleverer piece of state, the best sum of a subarray ending at the current index; that is [Kadane's algorithm](/roadmap/kadanes-algorithm).

### Dry run

The search for `prices = [7, 1, 5, 3, 6, 4]`:

| Day | Price | Cheapest before today | Profit if sold today | Best so far | Cheapest after today |
| --- | --- | --- | --- | --- | --- |
| 0 | 7 | none | none | 0 | 7 |
| 1 | 1 | 7 | 1 − 7 = −6 | 0 | 1 |
| 2 | 5 | 1 | 5 − 1 = 4 | 4 | 1 |
| 3 | 3 | 1 | 3 − 1 = 2 | 4 | 1 |
| 4 | 6 | 1 | 6 − 1 = 5 | 5 | 1 |
| 5 | 4 | 1 | 4 − 1 = 3 | 5 | 1 |

The answer is 5: buy on day 1 at 1 and sell on day 4 at 6. Notice the trap the pass avoids: the highest price, 7, comes first and cannot be sold after anything, which is why "highest minus lowest" is wrong.

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

Some questions ask, for every index, about everything on **both** sides of it. [Product of Array Except Self](/problems/product-of-array-except-self) is the standard one: return an array where `answer[i]` is the product of every element except `nums[i]`, in O(n) time and without division.

Division would be the obvious trick, total product divided by `nums[i]`, but it breaks on zeros, and the problem forbids it anyway. Multiplying the other n − 1 values for each index is O(n²). The way out is to split the question in two. The product of everything except index i is the product of everything **left** of i multiplied by the product of everything **right** of i, and each of those is a running product that one pass can build:

```text
 nums:              1     2     3     4
 left product:      1     1     2     6      product of everything before i
 right product:    24    12     4     1      product of everything after i
 answer:           24    12     8     6      left × right
```

A left-to-right pass fills in the left products, each one the previous left product times the previous element. A right-to-left pass does the same from the other end. You do not even need a second array: store the left products in the answer array itself, then walk from the right with a single variable `right` that holds the product of everything after i, multiplying it in as you go. That uses O(1) extra space, because by convention the output array the problem asks for does not count.

Prefix and suffix passes appear far beyond products: the largest value to the left and right of each bar in [Trapping Rain Water](/problems/trapping-rain-water), sums on either side in [Find Pivot Index](/problems/find-pivot-index), and every range question in the [prefix sums](/roadmap/prefix-sum) stage.

### Dry run

The right-to-left pass for `nums = [1, 2, 3, 4]`, after the left pass has stored `[1, 1, 2, 6]` in `answer`:

| i | answer[i] before (left product) | right (product after i) | answer[i] after | right after |
| --- | --- | --- | --- | --- |
| 3 | 6 | 1 | 6 | 1 × 4 = 4 |
| 2 | 2 | 4 | 8 | 4 × 3 = 12 |
| 1 | 1 | 12 | 12 | 12 × 2 = 24 |
| 0 | 1 | 24 | 24 | 24 × 1 = 24 |

The result is `[24, 12, 8, 6]`: two passes of n steps each, no division, and a zero in the input needs no special case.

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

"In place" means changing the input array instead of building a new one, which brings the extra space down to O(1). Three tools cover most cases:

- **Swapping.** Reversing an array swaps the two ends and moves inwards. Rotating by k is three reversals: the whole array, then the first k elements, then the rest, as in [Rotate Array](/problems/rotate-array).
- **A write index.** Keep one index reading every element and another marking where the next element worth keeping goes. This is the read-and-write form of [two pointers](/roadmap/two-pointers), behind [Move Zeroes](/problems/move-zeroes) and removing duplicates.
- **Running updates.** [Running Sum of 1d Array](/problems/running-sum-of-1d-array) can be done with `nums[i] += nums[i - 1]` from left to right. It is safe because when you reach i, `nums[i - 1]` already holds the sum up to i − 1, which is exactly what you need.

The danger in every in-place edit is **overwriting a value you still need to read**. [Build Array from Permutation](/problems/build-array-from-permutation) asks for `ans[i] = nums[nums[i]]`. Writing the answers straight into `nums` destroys values that later indexes look up. The simple fix is a second array. The in-place fix stores two numbers in one slot: since every value is below n, `nums[i] += n * (nums[nums[i]] % n)` keeps the old value as the remainder modulo n and the new one as the quotient, and a final pass divides everything by n. The same caution applies to deleting from a list while looping over it forwards: each deletion shifts the next element into the current index and the loop skips it. Loop backwards, or use a write index.

## Two-dimensional arrays

A grid with m rows and n columns is an array of arrays: `grid[r][c]` is row r, column c. Java, Python and JavaScript store each row as its own array, so rows can even differ in length. A C++ `vector<vector<int>>` does the same, while a fixed C-style `int grid[m][n]` is one contiguous block in **row-major order**, row 0 then row 1 and so on, where cell (r, c) sits at position r × n + c. You can flatten any grid that way yourself.

Walking a grid row by row, the outer loop over rows and the inner over columns, visits memory in order and costs O(m × n). [Richest Customer Wealth](/problems/richest-customer-wealth) is exactly that: sum each row and keep the largest sum. For neighbours, keep two small direction arrays, row steps `{-1, 1, 0, 0}` and column steps `{0, 0, -1, 1}`, and check that each neighbour is inside the grid before touching it. In Python, never create a grid as `[[0] * n] * m`: that repeats one row object m times, so writing to one row writes to all of them. Use `[[0] * n for _ in range(m)]`. Spiral order, rotation and in-place marking each have their own tricks, covered in the [matrix](/roadmap/matrix) lesson.

## Time and space complexity

| Problem | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Best Time to Buy and Sell Stock | every pair of days | O(n²) | O(1) |
| Best Time to Buy and Sell Stock | one pass with a running minimum | O(n) | O(1) |
| Product of Array Except Self | multiply the others for each index | O(n²) | O(1) |
| Product of Array Except Self | separate left and right product arrays | O(n) | O(n) |
| Product of Array Except Self | left products in the answer, right as one variable | O(n) | O(1) besides the output |
| Build Array from Permutation | a second array | O(n) | O(n) |
| Build Array from Permutation | two values encoded in each slot | O(n) | O(1) |

The pattern in the table is the point of this stage: the brute force recomputes something for every index, and the fast version computes it once and carries it along.

## How to recognise the pattern

Read the statement for these signals:

- **"Before" and "after" in a pair**, such as buy before sell or i < j with the best difference: one pass carrying the running minimum or maximum.
- **"For each element, everything else"**, or everything to its left and right: left and right passes.
- **A sum over a range**, asked many times: [prefix sums](/roadmap/prefix-sum).
- **"In place" or "O(1) extra space"**: a write index or swaps.
- **A contiguous subarray** with a best sum or a condition: Kadane's algorithm or a [sliding window](/roadmap/sliding-window).
- **"Have I seen this value before?"** or a count per value: a hash map, the next stage, [Hashing](/roadmap/hashing).

## Common mistakes

- **Off by one at the ends.** The last index is n − 1, so loops run while `i < n`. A pass that looks back at `i - 1` must start at 1.
- **Not handling an empty or single-element array.** `prices[0]` on an empty input crashes. Check the constraints, and guard when they allow n = 0.
- **Inserting or deleting at the front inside a loop.** Each one is O(n), so the loop becomes O(n²). Build the result in order, or work from the back.
- **Overwriting values still needed.** In place, decide the loop direction from which values are read later, as in the running sum, or keep a copy.
- **Overflow.** A sum of 10⁵ values up to 10⁹ needs 64 bits: `long long` in C++, `long` in Java. Python's integers do not overflow, and JavaScript numbers are exact only up to about 9 × 10¹⁵.
- **Aliasing instead of copying.** In Java, Python and JavaScript, `b = a` makes two names for one array; copy with `a.clone()`, `a[:]` or `a.slice()`. In C++ the opposite trap: passing a `vector` by value copies it on every call, so pass `const vector<int>&`.

## Practice in this order

These are the stage's own problems, from plain indexing to the two patterns above:

1. [Running Sum of 1d Array](/problems/running-sum-of-1d-array): a running total, in place.
2. [Concatenation of Array](/problems/concatenation-of-array): indexing with an offset, `ans[i + n] = nums[i]`.
3. [Build Array from Permutation](/problems/build-array-from-permutation): indexing through values, and the in-place encoding.
4. [Richest Customer Wealth](/problems/richest-customer-wealth): a two-dimensional pass, one sum per row.
5. [Contains Duplicate](/problems/contains-duplicate): sort and compare neighbours, or a set of values seen.
6. [Best Time to Buy and Sell Stock](/problems/best-time-to-buy-and-sell-stock): the running minimum above.
7. [Maximum Subarray](/problems/maximum-subarray): one pass with smarter state.
8. [Product of Array Except Self](/problems/product-of-array-except-self): left and right passes.

The [array problem list](/challenges/arrays) has every array problem in the catalogue, easiest first. When the first six feel routine, move on to the next stage of the roadmap: [Hashing](/roadmap/hashing).

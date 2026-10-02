---
title: Time and Space Complexity (Big-O Notation)
stage: arrays
order: 1
minutes: 13
level: Beginner
practice: running-sum-of-1d-array, concatenation-of-array, contains-duplicate, missing-number, two-sum, find-pivot-index, best-time-to-buy-and-sell-stock, maximum-subarray
updated: 2026-10-03
seo-title: Big-O Notation: Time and Space Complexity Explained
description: Learn Big-O notation: time and space complexity, the common classes, analysing loops and recursion, amortised cost and reading constraints.
question: What is Big-O notation?
answer: Big-O notation describes how an algorithm's running time or memory grows as the input size n grows, ignoring constant factors and smaller terms. One pass over an array is O(n), a loop inside a loop is O(n²), and halving the range every step is O(log n). It tells you before you write code whether a solution fits the limits — roughly 10⁸ simple operations a second.
q: What is the difference between Big-O, Big-Omega and Big-Theta?
a: Big-O is an upper bound: the cost grows no faster than the given function. Big-Omega (Ω) is a lower bound: it grows at least that fast. Big-Theta (Θ) means both at once, a tight bound. In interviews people say "O" when they mean the tight bound, so "binary search is O(log n)" is understood as the best bound anyone can state.
q: How many operations can a program do in one second?
a: A working rule is about 10⁸ simple operations a second in C++, Java or JavaScript, and roughly ten times fewer in Python. With n = 10⁵, an O(n log n) solution needs about 1.7 × 10⁶ steps and is comfortable, while O(n²) needs 10¹⁰ and is far too slow. Treat it as an estimate that rules approaches in or out, not a promise.
q: Is O(n log n) faster than O(n)?
a: No. For large inputs O(n) grows more slowly, so it is faster. The gap is small, though: log₂ n is only about 20 when n is a million, which is why sorting first and then doing a linear pass is usually fine. Both are in a different league from O(n²), which at a million items is a trillion steps.
q: What is the time complexity of nested loops?
a: Multiply the iteration counts: two nested loops over n items run the inner body n × n times, which is O(n²). If the inner loop starts after the outer index it runs about half as often, still O(n²) once the constant is dropped. If the inner loop moves a pointer that never resets, as in two pointers, the total is O(n) despite the nesting.
q: What does amortised O(1) mean?
a: Amortised O(1) means any sequence of n operations costs O(n) in total, even though a single operation is occasionally expensive. Appending to a dynamic array is the classic case: most appends are one write, a resize copies everything, but because capacity doubles the copies add up to fewer than 2n. Unlike an average case, no luck is involved.
q: Does space complexity include the input?
a: Usually not. In interviews, space complexity means auxiliary space: the extra memory your algorithm allocates, such as new arrays, hash maps, strings and the call stack of recursion. The input is given to you, and the output the problem asks for is normally not counted either. Say which convention you are using when it matters.
---
Two programs can give the same correct answer and still differ by a factor of a million in how long they take. Before you write a solution you want to know whether it will finish inside the time limit — usually a second or two for inputs of up to 10⁵ or 10⁶ items. **Time complexity** is the tool for that judgement, and **Big-O notation** is the shorthand everyone uses to state it.

## Why count operations, not seconds

Seconds depend on the machine and the language; how the work **grows** with the input does not. So count **basic operations** — an addition, a comparison, reading one element — as a function of the input size n. Finding the largest value takes about 2n; comparing every pair for a duplicate takes n(n − 1)/2. At n = 10⁵ that is 2 × 10⁵ against 5 × 10⁹, and a judge does roughly 10⁸ simple operations a second: milliseconds against nearly a minute. No faster machine closes that gap. A better algorithm does.

## Big-O: an upper bound on growth

A cost f(n) is **O(g(n))** if there are constants c > 0 and n₀ with f(n) ≤ c × g(n) for every n ≥ n₀: beyond some size, f never grows faster than g times a constant.

@figure upper-bound

Two everyday rules follow from the definition:

- **Drop constant factors.** 5n, n/2 and 100n are all O(n); the constant depends on the language and the machine.
- **Drop lower-order terms.** 3n² + 5n + 20 is O(n²); the smaller terms fade as n grows.

State the smallest bound you can justify: a linear algorithm is technically O(n²) too. **Ω** is a lower bound and **Θ** both at once, though interviews use "O" for the tight bound. The **worst case** is the default, since a judge chooses its tests; the **average case** is the expected cost over random inputs, as with a hash lookup's O(1) — see [Hashing](/roadmap/hashing).

## The common complexity classes

Almost every algorithm falls into one of a handful of classes:

@figure classes

| Complexity | Name | Typical example | Largest n in about a second |
| --- | --- | --- | --- |
| O(1) | constant | reading `arr[i]`, a hash lookup on average | any |
| O(log n) | logarithmic | binary search | any |
| O(n) | linear | one pass | about 10⁸ |
| O(n log n) | linearithmic | sorting | about 10⁶ to 10⁷ |
| O(n²) | quadratic | every pair | about 10⁴ |
| O(n³) | cubic | every triple | about 500 |
| O(2ⁿ) | exponential | every subset | about 25 |
| O(n!) | factorial | every ordering | about 11 |

The last column is 10⁸ divided by the cost: rough (Python is about ten times slower) but enough to rule an approach in or out. The base of a logarithm does not matter, since log₂ n and log₁₀ n differ by a constant.

## How to work out the complexity of code

Five rules cover nearly all the code you will analyse:

- **Sequential blocks add.** A loop over n, then one over m, is O(n + m).
- **Nested loops multiply.** n steps around m steps is O(n × m).
- **An inner loop that depends on the outer index still counts fully** — see the triangle below.
- **A loop that halves or doubles is logarithmic.**
- **A call costs what it does.** n binary searches are O(n log n); n calls to `indexOf` or Python's `in` on a list are O(n²).

@figure pair-triangle

@figure halving

A loop that subtracts 2 each time is still linear; only a *factor* makes it logarithmic. And the `while` inside a [two pointers](/roadmap/two-pointers) or [sliding window](/roadmap/sliding-window) loop is not O(n²): its pointer never moves back, so it moves at most n times in the whole run. Count the total work, not the indentation.

### The code

The program counts how many times each loop body runs as n doubles. The halving loop divides with whole numbers — `//` in Python, `Math.floor` in JavaScript — because a plain `/` would produce fractions and keep going.

```cpp
#include <iomanip>
#include <iostream>
using namespace std;

// Each function runs one loop shape and counts how many times its body runs.
long long singleLoop(int n) {
    long long count = 0;
    for (int i = 0; i < n; i++) count++;              // n steps: O(n)
    return count;
}

long long nestedLoops(int n) {
    long long count = 0;
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++) count++;          // n * n steps: O(n^2)
    return count;
}

long long pairLoops(int n) {
    long long count = 0;
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) count++;      // n(n-1)/2 steps: still O(n^2)
    return count;
}

long long halvingLoop(int n) {
    long long count = 0;
    for (int i = n; i > 0; i /= 2) count++;           // about log2(n) + 1 steps: O(log n)
    return count;
}

int main() {
    cout << setw(6) << "n" << setw(9) << "single" << setw(9) << "nested"
         << setw(9) << "pairs" << setw(9) << "halving" << "\n";
    for (int n : {100, 200, 400, 800}) {
        cout << setw(6) << n << setw(9) << singleLoop(n) << setw(9) << nestedLoops(n)
             << setw(9) << pairLoops(n) << setw(9) << halvingLoop(n) << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // Each method runs one loop shape and counts how many times its body runs.
    static long singleLoop(int n) {
        long count = 0;
        for (int i = 0; i < n; i++) count++;              // n steps: O(n)
        return count;
    }

    static long nestedLoops(int n) {
        long count = 0;
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++) count++;          // n * n steps: O(n^2)
        return count;
    }

    static long pairLoops(int n) {
        long count = 0;
        for (int i = 0; i < n; i++)
            for (int j = i + 1; j < n; j++) count++;      // n(n-1)/2 steps: still O(n^2)
        return count;
    }

    static long halvingLoop(int n) {
        long count = 0;
        for (int i = n; i > 0; i /= 2) count++;           // about log2(n) + 1 steps: O(log n)
        return count;
    }

    public static void main(String[] args) {
        System.out.println(String.format("%6s%9s%9s%9s%9s", "n", "single", "nested", "pairs", "halving"));
        for (int n : new int[] {100, 200, 400, 800}) {
            System.out.println(String.format("%6d%9d%9d%9d%9d",
                    n, singleLoop(n), nestedLoops(n), pairLoops(n), halvingLoop(n)));
        }
    }
}
```

```python
# Each function runs one loop shape and counts how many times its body runs.
def single_loop(n):
    count = 0
    for i in range(n):
        count += 1                    # n steps: O(n)
    return count


def nested_loops(n):
    count = 0
    for i in range(n):
        for j in range(n):
            count += 1                # n * n steps: O(n^2)
    return count


def pair_loops(n):
    count = 0
    for i in range(n):
        for j in range(i + 1, n):
            count += 1                # n(n-1)/2 steps: still O(n^2)
    return count


def halving_loop(n):
    count = 0
    i = n
    while i > 0:
        count += 1                    # about log2(n) + 1 steps: O(log n)
        i //= 2
    return count


print(f"{'n':>6}{'single':>9}{'nested':>9}{'pairs':>9}{'halving':>9}")
for n in (100, 200, 400, 800):
    print(f"{n:>6}{single_loop(n):>9}{nested_loops(n):>9}{pair_loops(n):>9}{halving_loop(n):>9}")
```

```javascript
// Each function runs one loop shape and counts how many times its body runs.
function singleLoop(n) {
  let count = 0;
  for (let i = 0; i < n; i++) count++; // n steps: O(n)
  return count;
}

function nestedLoops(n) {
  let count = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) count++; // n * n steps: O(n^2)
  return count;
}

function pairLoops(n) {
  let count = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) count++; // n(n-1)/2 steps: still O(n^2)
  return count;
}

function halvingLoop(n) {
  let count = 0;
  for (let i = n; i > 0; i = Math.floor(i / 2)) count++; // about log2(n) + 1 steps: O(log n)
  return count;
}

const pad = (value, width) => String(value).padStart(width);
console.log(pad("n", 6) + pad("single", 9) + pad("nested", 9) + pad("pairs", 9) + pad("halving", 9));
for (const n of [100, 200, 400, 800]) {
  console.log(pad(n, 6) + pad(singleLoop(n), 9) + pad(nestedLoops(n), 9) + pad(pairLoops(n), 9) + pad(halvingLoop(n), 9));
}
```

```output
     n   single   nested    pairs  halving
   100      100    10000     4950        7
   200      200    40000    19900        8
   400      400   160000    79800        9
   800      800   640000   319600       10
```

As n doubles, the single loop doubles, both quadratic columns quadruple and the halving loop gains one.

## Recursion: count the calls

A recursive function costs the **number of calls** times the **work per call**. Draw the **recursion tree** to count them: a recursive sum is a chain of n calls; merge sort has log₂ n levels each handling all n elements, O(n log n). Naive Fibonacci branches twice at almost every call:

@figure fib-tree

Storing each answer the first time is the core of [dynamic programming](/roadmap/dynamic-programming); the [recursion](/roadmap/recursion) lesson draws these trees in more depth.

## Space complexity and the call stack

**Space complexity** counts the extra memory as n grows: a few variables are O(1), a copy or a hash set O(n), an n × n table O(n²) — at n = 10⁴ about 400 MB, over a judge's usual 256 MB even when the time is fine. The cost people forget is the **call stack**:

@figure call-stack

Memory and time are often traded: a hash set turns an O(n²) duplicate check into O(n), and [prefix sums](/roadmap/prefix-sum) store n totals so every range sum costs O(1).

## Amortised cost: why appending to an array is O(1)

A **dynamic array** appends with one write while it has spare room, and copies everything to a bigger block when it is full — one append can cost O(n). The [Arrays](/roadmap/arrays) lesson animates the resizes; judge a whole sequence instead:

@figure amortised

That is **amortised** O(1): a guarantee about the total of any sequence, not an average over random inputs. Any growth factor above 1 gives it — GCC doubles, Java's `ArrayList` grows by 1.5 — while a fixed increment never does.

### The code

The program simulates both growth rules and counts the copies.

```cpp
#include <iostream>
using namespace std;

// Appends n items to a simulated dynamic array and counts the element copies
// its resizes cost. Doubling starts from 1 slot; the other rule adds 10 slots.
long long copiesForAppends(int n, bool doubling) {
    long long capacity = doubling ? 1 : 10;
    long long size = 0, copies = 0;
    for (int i = 0; i < n; i++) {
        if (size == capacity) {                  // full: move everything to a bigger block
            copies += size;
            capacity = doubling ? capacity * 2 : capacity + 10;
        }
        size++;                                  // the append itself: one write
    }
    return copies;
}

int main() {
    for (int n : {1000, 10000, 100000}) {
        cout << n << " appends: doubling copies " << copiesForAppends(n, true)
             << " elements, adding 10 slots copies " << copiesForAppends(n, false) << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // Appends n items to a simulated dynamic array and counts the element copies
    // its resizes cost. Doubling starts from 1 slot; the other rule adds 10 slots.
    static long copiesForAppends(int n, boolean doubling) {
        long capacity = doubling ? 1 : 10;
        long size = 0, copies = 0;
        for (int i = 0; i < n; i++) {
            if (size == capacity) {                  // full: move everything to a bigger block
                copies += size;
                capacity = doubling ? capacity * 2 : capacity + 10;
            }
            size++;                                  // the append itself: one write
        }
        return copies;
    }

    public static void main(String[] args) {
        for (int n : new int[] {1000, 10000, 100000}) {
            System.out.println(n + " appends: doubling copies " + copiesForAppends(n, true)
                    + " elements, adding 10 slots copies " + copiesForAppends(n, false));
        }
    }
}
```

```python
def copies_for_appends(n, doubling):
    """Append n items to a simulated dynamic array and count the element copies
    its resizes cost. Doubling starts from 1 slot; the other rule adds 10 slots."""
    capacity = 1 if doubling else 10
    size = copies = 0
    for i in range(n):
        if size == capacity:                     # full: move everything to a bigger block
            copies += size
            capacity = capacity * 2 if doubling else capacity + 10
        size += 1                                # the append itself: one write
    return copies


for n in (1000, 10000, 100000):
    print(f"{n} appends: doubling copies {copies_for_appends(n, True)} elements, "
          f"adding 10 slots copies {copies_for_appends(n, False)}")
```

```javascript
// Appends n items to a simulated dynamic array and counts the element copies
// its resizes cost. Doubling starts from 1 slot; the other rule adds 10 slots.
function copiesForAppends(n, doubling) {
  let capacity = doubling ? 1 : 10;
  let size = 0;
  let copies = 0;
  for (let i = 0; i < n; i++) {
    if (size === capacity) {
      // full: move everything to a bigger block
      copies += size;
      capacity = doubling ? capacity * 2 : capacity + 10;
    }
    size++; // the append itself: one write
  }
  return copies;
}

for (const n of [1000, 10000, 100000]) {
  console.log(`${n} appends: doubling copies ${copiesForAppends(n, true)} elements, adding 10 slots copies ${copiesForAppends(n, false)}`);
}
```

```output
1000 appends: doubling copies 1023 elements, adding 10 slots copies 49500
10000 appends: doubling copies 16383 elements, adding 10 slots copies 4995000
100000 appends: doubling copies 131071 elements, adding 10 slots copies 499950000
```

With doubling the copies stay just above n, about one extra write per append. Adding ten slots multiplies the copies by a hundred each time n grows tenfold: quadratic growth.

## Read the constraints first

Problem setters choose the input limits so the intended solution passes and the next slower one does not. Before designing anything, look at the largest n and work back from about 10⁸ operations:

| Largest n | Complexity that fits | What it usually points to |
| --- | --- | --- |
| n ≤ 10 to 12 | O(n!) | try every ordering |
| n ≤ 20 | O(2ⁿ) | every subset, [backtracking](/roadmap/backtracking) |
| n ≤ 500 | O(n³) | three nested loops |
| n ≤ 5,000 | O(n²) | every pair, a 2-D table |
| n ≤ 10⁵ | O(n log n) | sorting, [binary search](/roadmap/binary-search), a heap |
| n ≤ 10⁶ | O(n) | one pass, hashing, prefix sums |
| n ≤ 10⁹ | O(log n) or O(1) | binary search on the answer, a formula |

So n ≤ 10⁵ says O(n²), 10¹⁰ steps, is meant to fail. Read the limits on the *values* too: values up to 10⁹ mean a sum of two can pass the 32-bit limit.

## Hidden costs in everyday code

| Operation | Cost |
| --- | --- |
| `x in list`, `indexOf`, `includes`, `contains` on a list | O(n) — a scan |
| inserting or removing at the front or middle (`insert`, `splice`, `shift`) | O(n) — later elements move |
| a slice or substring | O(length) — a copy |
| `s = s + c` in a loop | O(n²) in total — see [Strings](/roadmap/strings) |
| sorting | O(n log n) |
| the length of an array or string | O(1) — stored, not counted |
| hash map or set lookup and insert | O(1) on average |

## Common mistakes

- **A library call as one step.** `x in my_list` inside a loop over that list is O(n²).
- **Forgetting the sort.** "Sort, then one pass" is O(n log n).
- **One n for two inputs.** Sizes n and m give O(n + m) or O(n × m).
- **Every nested loop as O(n²).** A pointer that never moves back is O(n) in total.
- **Ignoring the call stack.** Deep recursion uses O(depth) memory, and can crash.
- **Big-O alone for small inputs.** At n = 100 a plain O(n²) loop can beat a hashing O(n) one.

## Practice in this order

Write down the slow and the fast complexity of each before you code:

1. [Running Sum of 1d Array](/problems/running-sum-of-1d-array): reuse the previous total.
2. [Concatenation of Array](/problems/concatenation-of-array): an output that is not extra space.
3. [Contains Duplicate](/problems/contains-duplicate): O(n²), O(n log n), then O(n).
4. [Missing Number](/problems/missing-number): O(1) space with the sum formula.
5. [Two Sum](/problems/two-sum): every pair against one hash map pass.
6. [Find Pivot Index](/problems/find-pivot-index): running totals instead of rescans.
7. [Best Time to Buy and Sell Stock](/problems/best-time-to-buy-and-sell-stock): a running minimum.
8. [Maximum Subarray](/problems/maximum-subarray): from O(n³) down to O(n).

The [array problem list](/challenges/arrays) has many more. The next lesson, [Arrays](/roadmap/arrays), puts these costs to work on the data structure every other stage is built on.

---
title: Time and Space Complexity (Big-O Notation)
stage: arrays
order: 1
minutes: 22
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
Two programs can give the same correct answer and still differ by a factor of a million in how long they take. Before you write a line of a solution you want to know whether it will finish inside the time limit, which for coding problems is usually one or two seconds for inputs of up to 10⁵ or 10⁶ items. **Time complexity** is the tool for that judgement, and **Big-O notation** is the shorthand everyone uses to state it.

This lesson explains what Big-O means and why it ignores constants, the complexity classes you will meet again and again, how to work out the cost of loops and recursive functions, how to count memory, and the habit that saves more time than any other: reading the constraints to decide which complexity the intended solution has. The programs are in C++, Java, Python and JavaScript, and they count operations so you can watch the growth rates instead of taking them on trust.

## Why count operations, not seconds

The same program takes a different number of seconds on your laptop and on a judge server, in C++ and in Python, on a quiet machine and a busy one. Seconds measure the machine as much as the algorithm. What does not change from one machine to the next is how the work **grows** when the input grows.

So instead of timing, count **basic operations**: an addition, a comparison, reading or writing one array element, a function call. Each takes roughly constant time on any machine. Then write the count as a function of the input size, which is almost always called n.

Finding the largest value in an array reads every element once and compares it with the best so far: about 2n operations. Checking whether an array has two equal values by comparing every pair takes n(n − 1)/2 comparisons. At n = 10⁵ the first is 2 × 10⁵ operations and the second about 5 × 10⁹. A judge performs roughly 10⁸ simple operations a second, so the first finishes in a couple of milliseconds and the second needs close to a minute. No faster machine closes that gap. A better algorithm does.

## Big-O: an upper bound on growth

The formal definition is short. A cost f(n) is **O(g(n))** if there are constants c > 0 and n₀ such that f(n) ≤ c × g(n) for every n ≥ n₀. In words: beyond some input size, f never grows faster than g multiplied by a constant. Two everyday rules follow straight from it.

- **Drop constant factors.** 5n, n/2 and 100n are all O(n). Constants depend on the language, the compiler and the machine, and the definition absorbs them into c.
- **Drop lower-order terms.** 3n² + 5n + 20 is O(n²). At n = 1,000 the n² term is 3,000,000 and the rest is 5,020, under 0.2 per cent, and the share keeps shrinking as n grows.

Because Big-O is an upper bound, a linear algorithm is technically also O(n²). That is true and useless, so always state the smallest bound you can justify. Two related symbols complete the picture:

- **Big-Omega, Ω(g(n)),** is a lower bound: the cost grows at least as fast as g. Any algorithm that must look at every element of its input is Ω(n).
- **Big-Theta, Θ(g(n)),** is a tight bound: O and Ω at the same time. Summing an array is Θ(n).

In interviews "O" is used loosely to mean the tight bound, and that is fine. A separate question is *which input* you are describing. The **worst case** is the input that makes the algorithm slowest, and it is the default unless someone says otherwise. The **average case** is the expected cost over random inputs: a hash map lookup is O(1) on average, see [Hashing](/roadmap/hashing), and quicksort is O(n log n) on average but O(n²) at worst. The best case is rarely worth quoting. A judge chooses its tests, often adversarially, so plan for the worst case.

## The common complexity classes

Almost every algorithm you will write falls into one of these classes. The last column divides about 10⁸ operations by the cost, which is the rough size of input each class can handle in one second.

| Complexity | Name | Typical example | Largest n in about a second |
| --- | --- | --- | --- |
| O(1) | constant | reading `arr[i]`, a hash map lookup on average | any |
| O(log n) | logarithmic | binary search, a loop that halves | any (log₂ of 10¹⁸ is about 60) |
| O(n) | linear | one pass: a sum, a maximum, a running minimum | about 10⁸ |
| O(n log n) | linearithmic | sorting, merge sort | about 10⁶ to 10⁷ |
| O(n²) | quadratic | every pair, two nested loops | about 10⁴ |
| O(n³) | cubic | every triple, three nested loops | about 500 |
| O(2ⁿ) | exponential | every subset | about 25 |
| O(n!) | factorial | every ordering of the input | about 11 |

The limits are rough on purpose: a loop body that does ten things instead of one moves each of them, and Python is roughly ten times slower than C++ for plain loops. They are still right to within a small factor, and that is enough to rule an approach in or out. 10⁴ squared is 10⁸; 500 cubed is 1.25 × 10⁸; 2²⁵ is about 3.4 × 10⁷; 11! is about 4 × 10⁷ and 12! already 4.8 × 10⁸.

Look at what happens when the input doubles. O(log n) does one more step. O(n) does twice the work and O(n log n) slightly more than twice. O(n²) does four times the work, O(n³) eight times, and O(2ⁿ) squares itself. The program below shows the first few of these with real counts.

The base of the logarithm does not matter in Big-O: log₂ n and log₁₀ n differ by the constant factor log₂ 10 ≈ 3.3, which the notation drops. When people say "log n" in algorithms they usually mean log₂ n, the number of times n can be halved before it reaches 1.

## How to work out the complexity of code

You rarely need algebra. Five rules cover nearly all the code you will analyse:

- **Sequential blocks add.** A loop over n followed by a loop over m costs O(n + m). Two loops over the same n are O(2n), which is O(n).
- **Nested loops multiply.** An outer loop of n steps around an inner loop of m steps is O(n × m), and O(n²) when both are n.
- **An inner loop that depends on the outer index still counts fully.** If `j` runs from `i + 1` to the end, the inner loop runs n − 1, then n − 2, down to 0 times: n(n − 1)/2 in total, which is O(n²). The half is a constant.
- **A loop that halves or doubles is logarithmic.** After k halvings, n has become n / 2ᵏ, which drops below 1 once 2ᵏ > n, so the loop runs about log₂ n + 1 times.
- **A call costs what it does.** A function or library call inside a loop costs its own complexity on every iteration. A loop of n binary searches is O(n log n); a loop of n calls to `indexOf` or Python's `in` on a list is O(n²).

```text
for i in 0 .. n-1:                 n times
    total += arr[i]                O(1) each              → O(n)

for i in 0 .. n-1:                 n times
    for j in 0 .. n-1:             n times each           → O(n²)

i = n
while i > 0:                       about log₂ n times
    i = i / 2                                             → O(log n)

for i in 0 .. n-1:                 n times
    binary search in a sorted array    O(log n) each      → O(n log n)
```

One warning about the fourth rule: the loop has to change its variable by a *factor*. A loop that subtracts 2 each time is still linear, just with a constant of one half. And the inner loop of a [two pointers](/roadmap/two-pointers) or [sliding window](/roadmap/sliding-window) solution, a `while` nested inside a `for`, is not O(n²): its pointer only moves forwards and never resets, so across the whole run it moves at most n times. Count the total work, not the indentation.

### Dry run

Here is the halving loop for n = 100, the case that surprises people most:

| Step | i before | i after halving (whole numbers) |
| --- | --- | --- |
| 1 | 100 | 50 |
| 2 | 50 | 25 |
| 3 | 25 | 12 |
| 4 | 12 | 6 |
| 5 | 6 | 3 |
| 6 | 3 | 1 |
| 7 | 1 | 0 |

Seven steps, and log₂ 100 ≈ 6.6. A million needs 20 steps and a billion only 30. That is why binary search over a billion values answers instantly, and why an O(log n) step inside an O(n) loop costs so little.

### The code

The program runs four loop shapes and counts how many times each body executes for n = 100, 200, 400 and 800. The halving loop divides with whole numbers: in Python that is `//`, and in JavaScript `Math.floor`, because a plain `/` would produce fractions and keep going for over a thousand steps.

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

Read the table down each column. Every time n doubles, the single loop doubles, both quadratic columns multiply by four, and the halving loop goes up by exactly one. The pairs column is always a little under half of the nested column, n(n − 1)/2 against n², yet it grows in exactly the same way. That is what "drop the constant" means: the half changes how long one run takes, never the shape of the growth.

## Recursion: count the calls

A recursive function's cost is the **number of calls** multiplied by the **work each call does** outside its own recursive calls. The easiest way to count calls is to draw the **recursion tree**: each call is a node and its children are the calls it makes.

- Summing an array recursively makes one call per element, a chain of n calls doing O(1) each: O(n).
- Binary search written recursively makes one call on half the range: about log₂ n calls, so O(log n).
- Merge sort makes two calls on halves and then merges in O(n). The tree has about log₂ n levels, and the calls on any one level together handle all n elements, so each level costs O(n): O(n log n) in total.
- Naive Fibonacci, `fib(n) = fib(n - 1) + fib(n - 2)`, makes two calls from almost every node, so the tree roughly doubles at every level.

```text
                    fib(5)
               /             \
           fib(4)            fib(3)
          /      \          /      \
      fib(3)    fib(2)   fib(2)   fib(1)
      /    \
  fib(2)  fib(1)          ... fib(3) and fib(2) are worked out again and again
```

The Fibonacci tree grows by a factor of about 1.6 per level, so the cost is exponential and usually quoted as O(2ⁿ), an upper bound. `fib(50)` this way makes about 4 × 10¹⁰ calls. Store each answer the first time it is computed and every value is worked out once: O(n). That one change is the core of [dynamic programming](/roadmap/dynamic-programming), and the [recursion](/roadmap/recursion) lesson covers drawing these trees in more depth.

## Space complexity and the call stack

**Space complexity** counts the extra memory an algorithm uses as n grows. Count what you allocate:

- A fixed number of variables is O(1), however large the input.
- A copy of the input, a hash set of values seen, or a result array of length n is O(n).
- An n × n table is O(n²). At n = 10⁴ that is 10⁸ cells, about 400 MB of 4-byte integers, well over the 256 MB a judge usually allows, even though 10⁸ operations would have been fine for time.

The cost people forget is the **call stack**. Every recursive call that has not returned yet keeps a frame holding its parameters, local variables and return address. A recursion that goes d calls deep uses O(d) memory even if each call allocates nothing: the recursive array sum uses O(n) stack, recursive binary search O(log n), and the loop versions of both O(1).

Depth is also a hard limit, not just a number in a table. Python refuses to go deeper than 1,000 calls by default and raises `RecursionError`. C++, Java and JavaScript run out of stack somewhere between a few thousand and a few hundred thousand frames, depending on the frame size and the platform. A recursion 10⁵ calls deep that is correct in theory can crash on the judge; rewrite it as a loop or with an explicit stack.

Memory and time are often traded. The most common move in this whole roadmap is to spend O(n) memory to save time: a hash set turns an O(n²) duplicate check into O(n), and [prefix sums](/roadmap/prefix-sum) store n running totals so that every range sum afterwards costs O(1).

## Amortised cost: why appending to an array is O(1)

A **dynamic array**, which is what `std::vector`, Java's `ArrayList`, Python's `list` and JavaScript's arrays are, keeps its elements in one block of memory with spare room at the end, called its **capacity**. Appending while there is room is a single write. When the block is full, the array allocates a bigger block, copies every element across and frees the old one, so that one append costs O(n).

Is append therefore O(n)? Look at a whole sequence instead of one call. If the capacity doubles each time, resizes happen when the size reaches 1, 2, 4, 8 and so on, and the copies add up to 1 + 2 + 4 + … up to the largest power of two below n. That sum is less than 2n. So n appends cost fewer than 3n writes in total, which is O(1) per append. This is called **amortised** O(1): a guarantee about the total of any sequence of operations. It is not an average over random inputs, and no luck is involved; some appends are slow, but the slow ones are rare enough to pay for themselves.

| Append | Size before | Capacity before | Resize? | Copies |
| --- | --- | --- | --- | --- |
| 1 | 0 | 1 | no | 0 |
| 2 | 1 | 1 | yes, to 2 | 1 |
| 3 | 2 | 2 | yes, to 4 | 2 |
| 4 | 3 | 4 | no | 0 |
| 5 | 4 | 4 | yes, to 8 | 4 |
| 6 to 8 | 5 to 7 | 8 | no | 0 |
| 9 | 8 | 8 | yes, to 16 | 8 |
| 10 | 9 | 16 | no | 0 |

Ten appends, fifteen copies. The growth has to be by a **factor**, though. An array that grows by a fixed ten slots at a time copies 10 + 20 + 30 + … elements, about n²/20 in total, which makes each append O(n) on average. Real libraries all grow by a factor: GCC's `std::vector` doubles, Microsoft's grows by 1.5, Java's `ArrayList` by 1.5 and CPython's list by about 1.125. Any factor above 1 gives amortised O(1); a larger factor trades wasted memory for fewer copies.

### The code

The program simulates both growth rules and counts the element copies for 1,000, 10,000 and 100,000 appends.

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

With doubling, the copies stay just above n: about one extra write per append, at every size. Adding ten slots at a time multiplies the copies by a hundred each time n grows tenfold, the signature of quadratic growth. At 100,000 appends that is half a billion copies, several seconds of wasted work.

## Read the constraints first

Problem setters choose the input limits so that the intended solution passes and the next slower one does not. That makes the constraints the best hint in the statement. Before designing anything, look at the largest n and work backwards from roughly 10⁸ operations:

| Largest n | Complexity that fits | What it usually points to |
| --- | --- | --- |
| n ≤ 10 to 12 | O(n!) | try every ordering |
| n ≤ 20 | O(2ⁿ) or O(2ⁿ × n) | every subset: bitmasks, [backtracking](/roadmap/backtracking) |
| n ≤ 500 | O(n³) | three nested loops, interval dynamic programming |
| n ≤ 5,000 | O(n²) | every pair, a two-dimensional table |
| n ≤ 10⁵ | O(n log n) | sorting, [binary search](/roadmap/binary-search), a heap |
| n ≤ 10⁶ | O(n) or O(n log n) | one or two passes, hashing, prefix sums, two pointers |
| n ≤ 10⁹ or more | O(log n) or O(1) | binary search on the answer, a formula |

So n ≤ 10⁵ is the setter telling you that O(n²), 10¹⁰ steps, is meant to fail. Two more details are worth reading. When a test file holds many test cases, the cost is summed over all of them, which is why statements often promise "the sum of n over all test cases does not exceed 2 × 10⁵". And the limits on the *values* matter too: values up to 10⁹ mean a sum of two can pass the 32-bit limit of about 2.1 × 10⁹, so you need 64-bit integers; values up to 10⁶ mean you can index an array by value instead of using a hash map.

## Hidden costs in everyday code

Many slow solutions are slow because a single line hides a loop. Learn these costs by heart:

| Operation | Cost | Why |
| --- | --- | --- |
| `x in list` (Python), `indexOf`, `includes`, `contains` on a list, `std::find` | O(n) | scans the elements one by one |
| inserting or removing at the front or middle of an array (`insert`, `erase`, `splice`, `shift`) | O(n) | every later element moves |
| slicing or taking a substring (`a[i:j]`, `slice`, `substr`, `substring`) | O(length) | makes a copy |
| building a string by `s = s + c` in a loop | O(n²) in total | each step copies the whole string, see [Strings](/roadmap/strings) |
| sorting | O(n log n) | no comparison sort does better |
| the length of an array or string | O(1) | it is stored, not counted |
| hash map or hash set lookup and insert | O(1) on average | see [Hashing](/roadmap/hashing) |

## Common mistakes

- **Treating a library call as one step.** `if x in my_list` inside a loop over the same list is O(n²). Use a set when you need membership tests.
- **Forgetting the sort.** "Sort, then one pass" is O(n log n), not O(n). It is usually fast enough, but say so.
- **Collapsing two inputs into one n.** Two arrays of sizes n and m give O(n + m) or O(n × m). Keep both letters unless one is bounded by the other.
- **Calling every nested loop O(n²).** A pointer that only moves forwards across the whole run makes the total O(n). Count total work, not indentation.
- **Ignoring the call stack.** A recursive solution with no arrays still uses O(depth) memory, and a deep recursion can crash outright.
- **Trusting Big-O alone for small inputs.** Big-O compares growth, not speed at one size. For n = 100, an O(n²) loop over a plain array can beat an O(n) solution that hashes every element. Pick by growth when n is large, and by simplicity when it is not.

## Practice in this order

Each of these problems has a slow and a fast solution. Write down both complexities before you code, then check your estimate against the constraints:

1. [Running Sum of 1d Array](/problems/running-sum-of-1d-array): reuse the previous total, O(n) instead of O(n²).
2. [Concatenation of Array](/problems/concatenation-of-array): O(n) time and an O(n) output, and why the output is not extra space.
3. [Contains Duplicate](/problems/contains-duplicate): O(n²) pairs, O(n log n) by sorting, O(n) with a hash set.
4. [Missing Number](/problems/missing-number): O(n) time with O(1) extra space, using the sum formula.
5. [Two Sum](/problems/two-sum): every pair against a one-pass hash map.
6. [Find Pivot Index](/problems/find-pivot-index): running totals turn O(n²) into O(n).
7. [Best Time to Buy and Sell Stock](/problems/best-time-to-buy-and-sell-stock): all pairs, or one pass with a running minimum.
8. [Maximum Subarray](/problems/maximum-subarray): the classic ladder from O(n³) to O(n²) to O(n).

The [array problem list](/challenges/arrays) has many more. The next lesson, [Arrays](/roadmap/arrays), puts these costs to work on the data structure every other stage is built on.

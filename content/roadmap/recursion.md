---
title: Recursion
stage: backtracking
order: 1
minutes: 12
level: Beginner
hub: recursion
practice: fibonacci-number, power-of-three, reverse-string, count-good-numbers, find-the-winner-of-the-circular-game, find-kth-bit-in-nth-binary-string, decode-string, different-ways-to-add-parentheses
updated: 2026-10-03
seo-title: Recursion Explained: Base Case, Call Stack and Examples
description: Learn recursion: base and recursive cases, the call stack, recursion trees, fast power and depth limits, with code in C++, Java, Python and JavaScript.
question: What is recursion in programming?
answer: Recursion is when a function solves a problem by calling itself on a smaller version of the same problem. It needs a base case, answered directly, and a recursive case that shrinks the input and builds on the smaller answer. Each unfinished call keeps a frame on the call stack, so memory grows with the depth; time is the number of calls times the work in each.
q: What is a base case in recursion?
a: The base case is an input small enough to answer without another call, such as 0! = 1 or an empty array whose sum is 0. It is what stops the recursion: without it, or if some input can never reach it, the function calls itself until the call stack runs out. Some functions need more than one base case, as Fibonacci needs both fib(0) and fib(1).
q: Is recursion slower than a loop?
a: For the same algorithm, slightly: each call pushes and pops a stack frame, which costs more than a loop iteration, and deep recursion uses memory a loop does not. The big slowdowns come from the algorithm, not the calls — naive recursive Fibonacci is exponential because it recomputes the same values, and memoising it makes it linear. Use recursion where it states the problem clearly and the depth is safe.
q: What is the maximum recursion depth in Python?
a: CPython stops at 1,000 nested calls by default (sys.getrecursionlimit()) and raises RecursionError beyond that. sys.setrecursionlimit raises the limit, but the interpreter's own stack can still run out and crash the process, so for depths in the tens of thousands a loop or an explicit stack is safer. Java, C++ and JavaScript have no fixed count; they fail when the thread's stack memory is exhausted.
q: What is tail recursion?
a: A call is a tail call when it is the last thing a function does, so its result is returned unchanged. A compiler can then reuse the current stack frame instead of pushing a new one, which turns the recursion into a loop. Scheme guarantees this and C++ compilers often do it when optimising, but Python, Java and the JavaScript engines in Chrome and Node do not, so deep tail recursion still overflows there.
q: What is the difference between recursion and backtracking?
a: Recursion is the mechanism: a function calling itself on a smaller input. Backtracking is an algorithm built on it: make one choice, recurse to explore what follows, then undo the choice and try the next, abandoning any branch that breaks a rule. Every backtracking solution is recursive or simulates recursion with a stack, but most recursive functions, such as factorial, do no backtracking at all.
---
Some problems contain smaller copies of themselves. The factorial of 5 is 5 times the factorial of 4; a folder holds other folders; the string `3[a2[c]]` contains `2[c]`, which must be decoded first. **Recursion** matches that shape: a function that solves a problem by calling itself on a smaller input, until the input is small enough to answer directly. Trees and graphs are walked with it, [backtracking](/roadmap/backtracking) is built on it, and [dynamic programming](/roadmap/dynamic-programming) usually starts as a recursive formula.

## Why recursion: when loops run out of shape

Nested loops go a fixed number of levels deep. To list every subset of n items you would need n nested loops, one per item — and n is not known until the program runs. Recursion gives each level its own function call, so the depth adapts to the input, as it must for the brackets of [Decode String](/problems/decode-string) or a tree of unknown height. Every call costs time and memory, though, and using recursion well means knowing when that cost is fine.

## The idea: a base case and a recursive case

The factorial says it in two lines: `factorial(0) = 1`, and `factorial(n) = n × factorial(n − 1)` for n > 0.

- **The base case** answers the smallest inputs directly, with no further call.
- **The recursive case** calls the function on a **smaller** input and builds its answer from the result.
- **Progress**: every call moves closer to a base case.

Write the recursive case with a **leap of faith**: do not trace what `factorial(n - 1)` does inside. Assume it is right and ask only how to get the factorial of n from it; then check the base case on its own.

## Why it works: recursion is induction

The leap of faith is proof by **mathematical induction**: the base case is right, and if the smaller call is right, one step makes this call right. Correctness climbs one level at a time.

@figure induction

The function must also **stop**: some measure must shrink with every call and be unable to jump past the base case. `factorial(-1)` counts down past 0 for ever.

## The call stack, frame by frame

Each call gets a **stack frame** holding its parameters, locals and the point to resume at. Frames are pushed on the **call stack** when a call starts and popped when it returns, so every call keeps its own n.

@figure call-stack

So the memory of a recursion is its **depth** — O(n) for factorial, though it stores no array — and the work happens on the way back up.

## Recursion trees: when one call makes several

A function that makes several calls per call forms a **recursion tree**, like Fibonacci's `fib(n) = fib(n − 1) + fib(n − 2)`. **Time** is the number of nodes times the work in each; **space** is the tree's height, since the stack holds one path from the root at a time.

@figure fib-tree

Naive fib(50) would make about 4 × 10¹⁰ calls for a number a loop finds in 49 additions. Storing each value the first time — **memoisation** — is the first step of [dynamic programming](/roadmap/dynamic-programming); try it on [Fibonacci Number](/problems/fibonacci-number).

## Fast exponentiation: xⁿ in O(log n)

Recursion can also make an algorithm faster by shrinking the input by more than one step. xⁿ is `(x^(n/2))²` when n is even and `(x^(n/2))² × x` when n is odd, with n/2 rounded down and x⁰ = 1. Each call halves n, so n = 10⁹ needs 31 calls instead of a billion multiplications.

@walkthrough

The line that makes it fast is `h = power(x, n / 2)` followed by `h * h`. Writing `power(x, n / 2) * power(x, n / 2)` looks the same but makes two calls per level.

@figure power-twice

Merge sort is the same **divide and conquer** idea with two halves that really are different: about log₂ n levels with n work each, O(n log n) — see [sorting algorithms](/roadmap/sorting-algorithms).

### The code

The program computes three factorials and three powers, counting the calls power makes. C++ and Java use 64-bit integers, because 13! overflows a 32-bit int.

```cpp
#include <iostream>
using namespace std;

long long calls = 0; // how many times power() has been entered

// n! for n >= 0.
long long factorial(int n) {
    if (n == 0) return 1;             // base case
    return n * factorial(n - 1);      // recursive case: trust the smaller call
}

// x^n for n >= 0, halving n at every call.
long long power(long long x, int n) {
    calls++;
    if (n == 0) return 1;             // base case
    long long h = power(x, n / 2);    // one call for the half, used twice
    if (n % 2 == 0) return h * h;
    return h * h * x;                 // odd n: one extra factor of x
}

int main() {
    for (int n : {0, 5, 15}) {
        cout << "factorial(" << n << ") = " << factorial(n) << "\n";
    }
    int tests[3][2] = {{2, 10}, {3, 13}, {2, 30}};
    for (auto& t : tests) {
        calls = 0;
        long long result = power(t[0], t[1]);
        cout << "power(" << t[0] << ", " << t[1] << ") = " << result << " in " << calls << " calls\n";
    }
    return 0;
}
```

```java
public class Main {
    static long calls = 0; // how many times power() has been entered

    // n! for n >= 0.
    static long factorial(int n) {
        if (n == 0) return 1;             // base case
        return n * factorial(n - 1);      // recursive case: trust the smaller call
    }

    // x^n for n >= 0, halving n at every call.
    static long power(long x, int n) {
        calls++;
        if (n == 0) return 1;             // base case
        long h = power(x, n / 2);         // one call for the half, used twice
        if (n % 2 == 0) return h * h;
        return h * h * x;                 // odd n: one extra factor of x
    }

    public static void main(String[] args) {
        for (int n : new int[] {0, 5, 15}) {
            System.out.println("factorial(" + n + ") = " + factorial(n));
        }
        int[][] tests = {{2, 10}, {3, 13}, {2, 30}};
        for (int[] t : tests) {
            calls = 0;
            long result = power(t[0], t[1]);
            System.out.println("power(" + t[0] + ", " + t[1] + ") = " + result + " in " + calls + " calls");
        }
    }
}
```

```python
calls = 0  # how many times power() has been entered


def factorial(n):
    """n! for n >= 0."""
    if n == 0:
        return 1                      # base case
    return n * factorial(n - 1)       # recursive case: trust the smaller call


def power(x, n):
    """x^n for n >= 0, halving n at every call."""
    global calls
    calls += 1
    if n == 0:
        return 1                      # base case
    h = power(x, n // 2)              # one call for the half, used twice
    if n % 2 == 0:
        return h * h
    return h * h * x                  # odd n: one extra factor of x


for n in (0, 5, 15):
    print(f"factorial({n}) = {factorial(n)}")
for x, n in ((2, 10), (3, 13), (2, 30)):
    calls = 0
    result = power(x, n)
    print(f"power({x}, {n}) = {result} in {calls} calls")
```

```javascript
let calls = 0; // how many times power() has been entered

// n! for n >= 0.
function factorial(n) {
  if (n === 0) return 1; // base case
  return n * factorial(n - 1); // recursive case: trust the smaller call
}

// x^n for n >= 0, halving n at every call.
function power(x, n) {
  calls++;
  if (n === 0) return 1; // base case
  const h = power(x, Math.floor(n / 2)); // one call for the half, used twice
  if (n % 2 === 0) return h * h;
  return h * h * x; // odd n: one extra factor of x
}

for (const n of [0, 5, 15]) {
  console.log(`factorial(${n}) = ${factorial(n)}`);
}
for (const [x, n] of [[2, 10], [3, 13], [2, 30]]) {
  calls = 0;
  const result = power(x, n);
  console.log(`power(${x}, ${n}) = ${result} in ${calls} calls`);
}
```

```output
factorial(0) = 1
factorial(5) = 120
factorial(15) = 1307674368000
power(2, 10) = 1024 in 5 calls
power(3, 13) = 1594323 in 5 calls
power(2, 30) = 1073741824 in 6 calls
```

[Count Good Numbers](/problems/count-good-numbers) raises powers near 10⁹ modulo 10⁹ + 7, taking the remainder after every multiplication.

## Recursion on arrays and strings

An array is its first element followed by a smaller array: `sum(arr, i)` is `arr[i] + sum(arr, i + 1)`. A string is its two ends around a shorter string: reversing swaps the ends and recurses on `lo + 1, hi − 1`. Pass **indices**, never slices — `arr[1:]` copies the rest at every call, O(n²) work for an O(n) task. These go n or n/2 calls deep, which matters below; [Reverse String](/problems/reverse-string) is the [two pointers](/roadmap/two-pointers) technique written this way.

## From recursion to backtracking: every subset

Back to the problem loops could not solve: each call decides about one element, out or in, and when nothing is left to decide, the choices on the way down form one subset.

@figure subsets-tree

### The code

One `current` list holds the subset being built: a push before the call and a pop after it leave `current` exactly as it was for the next branch.

```cpp
#include <iostream>
#include <vector>
using namespace std;

// Prints every subset of nums[i..] after the elements already in current.
// Returns how many subsets it printed.
int subsets(const vector<int>& nums, int i, vector<int>& current) {
    if (i == (int)nums.size()) {               // base case: every element decided
        cout << "[";
        for (size_t k = 0; k < current.size(); k++) cout << (k ? ", " : "") << current[k];
        cout << "]\n";
        return 1;
    }
    int found = subsets(nums, i + 1, current); // leave nums[i] out
    current.push_back(nums[i]);                // put nums[i] in ...
    found += subsets(nums, i + 1, current);
    current.pop_back();                        // ... and take it back out
    return found;
}

int main() {
    vector<int> nums = {1, 2, 3};
    vector<int> current;
    int total = subsets(nums, 0, current);
    cout << total << " subsets\n";
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    // Prints every subset of nums[i..] after the elements already in current.
    // Returns how many subsets it printed.
    static int subsets(int[] nums, int i, List<Integer> current) {
        if (i == nums.length) {                    // base case: every element decided
            System.out.println(current);
            return 1;
        }
        int found = subsets(nums, i + 1, current); // leave nums[i] out
        current.add(nums[i]);                      // put nums[i] in ...
        found += subsets(nums, i + 1, current);
        current.remove(current.size() - 1);        // ... and take it back out
        return found;
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3};
        int total = subsets(nums, 0, new ArrayList<>());
        System.out.println(total + " subsets");
    }
}
```

```python
def subsets(nums, i, current):
    """Print every subset of nums[i:] after the elements already in current.
    Return how many subsets were printed."""
    if i == len(nums):                       # base case: every element decided
        print(current)
        return 1
    found = subsets(nums, i + 1, current)    # leave nums[i] out
    current.append(nums[i])                  # put nums[i] in ...
    found += subsets(nums, i + 1, current)
    current.pop()                            # ... and take it back out
    return found


nums = [1, 2, 3]
total = subsets(nums, 0, [])
print(f"{total} subsets")
```

```javascript
// Prints every subset of nums[i..] after the elements already in current.
// Returns how many subsets it printed.
function subsets(nums, i, current) {
  if (i === nums.length) {
    // base case: every element decided
    console.log(`[${current.join(", ")}]`);
    return 1;
  }
  let found = subsets(nums, i + 1, current); // leave nums[i] out
  current.push(nums[i]); // put nums[i] in ...
  found += subsets(nums, i + 1, current);
  current.pop(); // ... and take it back out
  return found;
}

const nums = [1, 2, 3];
const total = subsets(nums, 0, []);
console.log(`${total} subsets`);
```

```output
[]
[3]
[2]
[2, 3]
[1]
[1, 3]
[1, 2]
[1, 2, 3]
8 subsets
```

The push, the call and the pop are **choose, explore, unchoose**. Add a rule that refuses some choices and the same skeleton becomes [backtracking](/roadmap/backtracking); [Subsets](/problems/subsets) asks for exactly this list.

## How deep can recursion go?

Every waiting call holds a frame, and the call stack is small:

| Language | Limit | Past it |
| --- | --- | --- |
| Python | 1,000 nested calls by default | `RecursionError` |
| Java | the thread's stack, 1 MB by default | `StackOverflowError` |
| C++ | the thread's stack, usually 1 to 8 MB | a crash |
| JavaScript (Node) | about 1 MB of stack | `RangeError` |

Depth **O(log n)** — fast power, a balanced tree — is always safe. Depth **O(n)** — a linked list, a tree that may be one long path — fails once n reaches thousands. Then convert: a call with nothing left to do after its recursive call is a loop in disguise, and one that must come back uses a loop with an **explicit stack**, as in [depth-first search](/roadmap/depth-first-search). **Tail calls** do not save you here: a compiler may reuse the frame when the call is the last thing a function does, but Python, Java and Node never do.

## Time and space complexity

| Function | Calls | Time | Stack space |
| --- | --- | --- | --- |
| factorial(n) | n + 1 | O(n) | O(n) |
| Naive fib(n) | about 1.6ⁿ | O(1.618ⁿ) | O(n) |
| Memoised fib(n) | 2n − 1 | O(n) | O(n) |
| power(x, n) by halving | ⌊log₂ n⌋ + 2 | O(log n) | O(log n) |
| Every subset of n items | 2ⁿ⁺¹ − 1 | O(n × 2ⁿ) | O(n) |

The last row cannot be beaten: an answer with 2ⁿ entries takes at least that long to list.

## How to recognise a recursive problem

- The definition **refers to itself**: a tree from its subtrees, `3[a2[c]]` from `2[c]`.
- The input is **nested** to an unknown depth.
- The answer for n follows from a smaller case, as in [Find the Winner of the Circular Game](/problems/find-the-winner-of-the-circular-game).
- You must **generate** every subset, arrangement or path.

## Common mistakes

- **A missing or unreachable base case**: fib with only `if n == 0` calls fib(−1).
- **Dropping the recursive result**: you get `None` or `undefined` further up.
- **Calling twice what you could call once**: O(log n) becomes O(n).
- **Copying the input at every call**: pass indices.
- **Overflow**: 13! overflows a 32-bit int.
- **Not undoing shared state**: forget the pop and later subsets inherit stale elements.

## Practice in this order

1. [Fibonacci Number](/problems/fibonacci-number): two base cases, then memoise.
2. [Power of Three](/problems/power-of-three): divide until a base case answers.
3. [Reverse String](/problems/reverse-string): two indices, one call at a time.
4. [Count Good Numbers](/problems/count-good-numbers): fast power with a modulus.
5. [Find the Winner of the Circular Game](/problems/find-the-winner-of-the-circular-game): from n − 1 players to n.
6. [Find Kth Bit in Nth Binary String](/problems/find-kth-bit-in-nth-binary-string): recurse into one half.
7. [Decode String](/problems/decode-string): one call per level of nesting.
8. [Different Ways to Add Parentheses](/problems/different-ways-to-add-parentheses): divide and conquer at every operator.

The [recursion problem list](/challenges/recursion) has every problem in the catalogue that practises it. When the first five feel natural, move on to [backtracking](/roadmap/backtracking), which turns the subsets recursion into a general way of searching.

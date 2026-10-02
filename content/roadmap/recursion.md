---
title: Recursion
stage: backtracking
order: 1
minutes: 24
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
Some problems contain smaller copies of themselves. The factorial of 5 is 5 times the factorial of 4. A folder holds files and other folders, and each of those folders is a smaller version of the same problem. The string `3[a2[c]]` contains `2[c]`, which has to be decoded first. **Recursion** is the technique that matches this shape: a function that solves a problem by calling itself on a smaller input, until the input is small enough to answer directly.

Recursion is the foundation of the harder half of the roadmap. Trees and graphs are walked with it, [backtracking](/roadmap/backtracking) is built on it, divide and conquer is a form of it, and [dynamic programming](/roadmap/dynamic-programming) usually starts life as a recursive formula. This lesson explains how a recursive function works, what the computer does when it runs one, how to work out what it costs, and when to replace it with a loop. Every example is shown in C++, Java, Python and JavaScript.

## Why recursion: when loops run out of shape

A loop repeats one step, and nested loops go a fixed number of levels deep. That covers most problems, but not the ones whose nesting depends on the input. Suppose you must list every subset of a set of n items. For three items you could write three nested loops, each deciding whether one item is in or out. For twenty items you would need twenty nested loops, and for n items you cannot write the code at all, because n is not known until the program runs. The output is large but finite — 2²⁰ = 1,048,576 subsets of twenty items — yet no fixed number of loops produces it.

Recursion solves this by giving each level of nesting its own function call. One call decides about item 0 and hands the rest to a call that decides about item 1, and so on until no items are left. The depth of the calls adapts to the input, which is exactly what fixed loops cannot do. The same happens with nested brackets in [Decode String](/problems/decode-string), with a tree whose height you do not know in advance, and with any problem whose definition mentions itself.

Recursion is not free — every call costs time and memory — and half of using it well is knowing when that cost is fine and when it is not.

## The idea: a base case and a recursive case

Take the factorial: n! = n × (n − 1) × … × 1, and 0! = 1. Written as a rule about itself:

```text
factorial(n) = 1                       if n == 0     <- base case
factorial(n) = n × factorial(n − 1)    if n > 0      <- recursive case

factorial(4) = 4 × factorial(3)
             = 4 × 3 × factorial(2)
             = 4 × 3 × 2 × factorial(1)
             = 4 × 3 × 2 × 1 × factorial(0)
             = 4 × 3 × 2 × 1 × 1  =  24
```

Every recursive function has the same two parts, and one rule ties them together:

- **The base case** answers the smallest inputs directly, with no further call. It is what stops the recursion.
- **The recursive case** calls the same function on a **smaller** input and builds this call's answer from the one that comes back.
- **Progress**: every recursive call must move closer to a base case. factorial(n) calls factorial(n − 1), so n falls by one each time and must reach 0.

The habit that makes recursion easy to write is called the **leap of faith**. When you write the recursive case, do not trace what factorial(n − 1) does inside. Assume it returns the right answer, and ask only one question: given the factorial of n − 1, how do I get the factorial of n? Multiply by n. Then check the base case separately. If both are right, the function is right for every n, and the next section shows why that is not wishful thinking.

## Why it works: recursion is induction

The leap of faith is proof by **mathematical induction**. To show that factorial(n) returns n! for every n ≥ 0:

- **Base:** factorial(0) returns 1, and 0! = 1.
- **Step:** suppose factorial(n − 1) returns (n − 1)!. Then factorial(n) returns n × (n − 1)!, which is n!.

So the function is right for 0, therefore for 1, therefore for 2, and so on for every n. You never need to hold all the calls in your head, because correctness climbs one level at a time. That is why the two questions to ask about any recursive function are "is the base case right?" and "is one step right, assuming the smaller call is right?".

Correctness is only half of it; the function must also **stop**. It stops when some measure — here n itself — gets strictly smaller with every call and cannot fall past the base case. When a recursive function runs for ever, one of those has failed: either some input jumps over the base case (factorial(−1) would count down without end), or a call does not shrink its input at all.

## The call stack, frame by frame

What does the computer actually do with a function that calls itself? Each call gets a **stack frame**: a small block of memory holding that call's parameters, its local variables and the point to resume at when the call it is waiting on returns. Frames are pushed on the **call stack** when a call starts and popped when it returns, last in, first out. While factorial(4) waits for factorial(3), its frame stays on the stack with n = 4 inside it. That is how every call keeps its own n even though they all run the same code.

```text
the stack at the deepest point of factorial(4):

  | factorial(0)   n = 0   returns 1 now     |  <- top: running
  | factorial(1)   n = 1   waiting for f(0)  |
  | factorial(2)   n = 2   waiting for f(1)  |
  | factorial(3)   n = 3   waiting for f(2)  |
  | factorial(4)   n = 4   waiting for f(3)  |
  | main                                     |  <- bottom
```

### Dry run

The first half of the run only goes down, pushing frames; nothing is multiplied until the base case answers. The second half comes back up, and each frame finishes its multiplication just before it is popped:

| Step | Event | Frames on the stack (bottom to top) | Result |
| --- | --- | --- | --- |
| 1 | factorial(4) starts | f(4) | |
| 2 | factorial(3) starts | f(4) f(3) | |
| 3 | factorial(2) starts | f(4) f(3) f(2) | |
| 4 | factorial(1) starts | f(4) f(3) f(2) f(1) | |
| 5 | factorial(0) starts: base case | f(4) f(3) f(2) f(1) f(0) | returns 1 |
| 6 | factorial(1) resumes | f(4) f(3) f(2) f(1) | returns 1 × 1 = 1 |
| 7 | factorial(2) resumes | f(4) f(3) f(2) | returns 2 × 1 = 2 |
| 8 | factorial(3) resumes | f(4) f(3) | returns 3 × 2 = 6 |
| 9 | factorial(4) resumes | f(4) | returns 4 × 6 = 24 |

Two facts fall out of the table. The stack is five frames tall at its highest, so factorial(n) needs O(n) memory even though it never stores an array: the memory of a recursion is its **depth**. And the real work happens on the way back up, after each recursive call returns, which is why a frame cannot be thrown away while it waits.

## Recursion trees: when one call makes several

Factorial makes one call per call, so its calls form a chain. Many recursive functions make two or more, and then the calls form a **recursion tree**. Fibonacci is the classic case: fib(0) = 0, fib(1) = 1 and fib(n) = fib(n − 1) + fib(n − 2). Written directly as recursion, fib(5) unfolds like this:

```text
                           fib(5)
                 /                      \
            fib(4)                      fib(3)
          /        \                  /        \
      fib(3)       fib(2)         fib(2)      fib(1)
      /    \       /    \         /    \
  fib(2) fib(1) fib(1) fib(0) fib(1) fib(0)
  /    \
fib(1) fib(0)
```

fib(5) makes 15 calls; fib(3) is computed twice and fib(2) three times. The waste compounds: every time n grows by one, the number of calls grows by a factor of about 1.6. fib(30) makes 2,692,537 calls, fib(40) makes 331,160,281, and fib(50) would make about 4 × 10¹⁰, well past any time limit, for a number a loop finds in 49 additions.

The tree gives the two costs of any recursive function at a glance:

- **Time** is the number of nodes in the tree times the work done in each node.
- **Space** is the height of the tree — the longest chain of calls waiting on each other — times the size of a frame. Naive fib(n) takes exponential time but only O(n) space, because the stack only ever holds one path from the root.

The fix for Fibonacci is not to give up recursion but to stop repeating it: store each fib(k) the first time it is computed and look it up after that. This is **memoisation**, and it turns the 2.7 million calls of fib(30) into 31 computations, one for each value from fib(0) to fib(30). It is the first step of [dynamic programming](/roadmap/dynamic-programming), and [Fibonacci Number](/problems/fibonacci-number) is the problem to try it on.

## Fast exponentiation: xⁿ in O(log n)

Recursion can also make an algorithm faster, by shrinking the input by more than one step at a time. Computing xⁿ by multiplying x by itself takes n − 1 multiplications. But a power splits into two equal halves:

```text
x^n = (x^(n/2))²        if n is even      2^10 = (2^5)²
x^n = (x^(n/2))² × x    if n is odd       2^5  = (2^2)² × 2      (n/2 rounded down)
x^0 = 1                                   base case
```

Each call halves n, so power(x, n) makes only ⌊log₂ n⌋ + 2 calls: 2¹⁰ needs calls for n = 10, 5, 2, 1 and 0. For n = 10⁹ that is 31 calls instead of a billion multiplications. The figure below plays power(2, 10) one call at a time: watch the calls go down to the base case, then the results square their way back up.

@walkthrough

The line that makes it fast is `h = power(x, n / 2)` followed by `h * h`. Writing `power(x, n / 2) * power(x, n / 2)` looks the same but makes **two** calls per level. The tree then doubles in width as it halves in depth, and the total grows back to O(n) calls, billions of them for n = 10⁹. It is a classic way to turn O(log n) into O(n) without noticing. Compute the half once and square it.

### Dry run

power(3, 13), halving n (rounding down) on the way down and building the result on the way up:

| Call | n | Even or odd | Half returned | Result |
| --- | --- | --- | --- | --- |
| 1 | 13 | odd | 729 | 729 × 729 × 3 = 1,594,323 |
| 2 | 6 | even | 27 | 27 × 27 = 729 |
| 3 | 3 | odd | 3 | 3 × 3 × 3 = 27 |
| 4 | 1 | odd | 1 | 1 × 1 × 3 = 3 |
| 5 | 0 | base case | | 1 |

Read the Result column from the bottom up: that is the order in which the values are actually computed. Five calls and seven multiplications replace the twelve multiplications of the plain loop, and the gap widens to a logarithm against n as n grows.

### The code

The program computes three factorials and three powers with the functions above, and counts the calls power makes so you can see the logarithm. C++ and Java use 64-bit integers, because 13! already overflows a 32-bit int; every value stays below 2⁵³ so that JavaScript, whose numbers are doubles, prints them exactly.

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

Real problems keep the numbers small with a modulus: [Count Good Numbers](/problems/count-good-numbers) raises 5 and 4 to powers near 10⁹ and wants the answer modulo 10⁹ + 7, so the same function takes the remainder after every multiplication. [Power of Three](/problems/power-of-three) runs the idea backwards, dividing by 3 until a base case answers.

## Recursion on arrays and strings

Arrays and strings are recursive too: an array is its first element followed by a smaller array, and a string is its two end characters around a shorter string. Three short examples show the pattern, each written with indices rather than copied pieces:

```text
sum(arr, i)            = 0                                if i == len(arr)
                       = arr[i] + sum(arr, i + 1)         otherwise

reverse(s, lo, hi)     = stop                             if lo >= hi
                       = swap s[lo] and s[hi], then reverse(s, lo + 1, hi − 1)

isPalindrome(s, lo, hi) = true                            if lo >= hi
                        = false                           if s[lo] != s[hi]
                        = isPalindrome(s, lo + 1, hi − 1) otherwise
```

The indices matter. Writing `sum(arr[1:])` in Python or `arr.slice(1)` in JavaScript copies the rest of the array at every call: n calls copying n − 1, n − 2, n − 3 … elements is O(n²) work for an O(n) task. Passing an index, or two, keeps every call O(1). reverse and isPalindrome are the [two pointers](/roadmap/two-pointers) technique written as recursion, with the pointers moving inwards one call at a time, and [Reverse String](/problems/reverse-string) accepts either form. Note how deep each of these goes: n calls for sum, n/2 for the other two. That number decides whether they are safe, as the depth section below explains.

## Divide and conquer

Fast power shrinks its input by half and makes one call. **Divide and conquer** splits the input into parts, solves each part with its own recursive call and combines the answers. Merge sort is the standard example: sort the left half, sort the right half, then merge the two sorted halves in linear time. Its recursion tree has about log₂ n levels, and the merges on each level touch all n elements between them, so the whole sort costs O(n log n). The full algorithm is in the [sorting algorithms](/roadmap/sorting-algorithms) lesson.

The cost of a divide-and-conquer recursion is usually written as a **recurrence**: T(n) = 2T(n/2) + O(n) for merge sort (two halves, a linear merge) and T(n) = T(n/2) + O(1) for fast power (one half, constant work). The recursion tree solves it: count the levels, multiply by the work per level. [Different Ways to Add Parentheses](/problems/different-ways-to-add-parentheses) splits an expression at every operator, solves both sides recursively and combines every pair of results — divide and conquer where the split point is itself a choice.

## From recursion to backtracking: every subset

Back to the problem that loops could not solve: list every subset of [1, 2, 3]. Recursively, each call decides about one element — leave it out or put it in — and hands the remaining elements to the next call. When no element is left to decide, the choices made on the way down form one complete subset.

```text
                             []                          decide 1
                 out /                \ in
                   []                  [1]               decide 2
              out /  \ in          out /  \ in
               []     [2]          [1]    [1,2]          decide 3
              /  \    /  \        /  \     /   \
            []  [3] [2] [2,3]  [1] [1,3] [1,2] [1,2,3]   <- leaves: the 8 subsets
```

The tree has 2ⁿ leaves, one per subset, and depth n, so listing every subset takes O(n × 2ⁿ) time (up to n steps to print each one) and O(n) stack space. Reading the leaves left to right gives the order the program prints them in, which is counting in binary: out-out-out is 000, out-out-in is 001, and so on up to in-in-in, 111.

### The code

The program keeps a single `current` list for the subset being built. Putting an element in is a push before the recursive call and a pop after it, so that when the call returns, `current` is exactly as it was and the next branch starts clean. The function returns how many subsets it printed, which is itself a small recursion: the count of a node is the sum of its two children's counts.

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

The push, the recursive call and the pop are a pattern called **choose, explore, unchoose**. Add a rule that refuses some choices — no subset whose sum passes a target, no two queens on one diagonal — and the same skeleton becomes [backtracking](/roadmap/backtracking), the next lesson. [Subsets](/problems/subsets) asks for exactly this list.

## How deep can recursion go?

Every waiting call holds a frame, and the call stack is a fixed and fairly small block of memory. Go too deep and the program dies:

| Language | What limits the depth | What happens past it |
| --- | --- | --- |
| Python | A counter: 1,000 nested calls by default (`sys.getrecursionlimit()`) | `RecursionError` |
| Java | The thread's stack, 1 MB by default on 64-bit systems: thousands to tens of thousands of frames | `StackOverflowError` |
| C++ | The thread's stack, usually 8 MB on Linux and 1 MB on Windows | The process crashes, usually with a segmentation fault |
| JavaScript (Node) | About 1 MB of stack: roughly ten thousand simple frames | `RangeError: Maximum call stack size exceeded` |

Raising Python's limit with `sys.setrecursionlimit` works up to a point, but on many versions the interpreter's own stack can still run out and kill the process, so it is a patch rather than a fix. The useful question is how the depth **grows** with the input:

- **Depth O(log n)** — fast power, merge sort, binary search, a balanced tree. Always safe: log₂ of a billion is 30.
- **Depth O(n)** — the array sum above, reversing a string, walking a linked list, a tree that may be one long path, a depth-first search on a large graph. Unsafe once n reaches the thousands in Python and the tens of thousands elsewhere.

When the depth is linear in a large n, convert the recursion. If a call has nothing left to do after its recursive call returns, it is a loop in disguise and can be written as one directly. If it must come back to finish work — a tree traversal visiting the left subtree and then the right — use a loop with an **explicit stack**: push what the recursion would have called, then pop and process until the stack is empty. That stack lives on the heap, which is far larger than the call stack. The [depth-first search](/roadmap/depth-first-search) lesson shows the conversion step by step.

## Tail recursion

A recursive call is a **tail call** when it is the very last thing the function does: its result is returned as it is, with no work waiting. The factorial above is not tail-recursive, because `n * factorial(n - 1)` still has a multiplication to do after the call returns. Carrying the partial product in a parameter makes it one:

```text
factorial(n, acc = 1):
    if n == 0: return acc
    return factorial(n − 1, acc × n)     <- tail call: nothing left to do after it

the same computation as a loop:
    acc = 1
    while n > 0: acc = acc × n;  n = n − 1
    return acc
```

Because nothing in the current frame is needed after a tail call, a compiler can reuse the frame instead of pushing a new one. This is **tail-call optimisation**, and with it the recursion runs in O(1) stack space, exactly like the loop. Scheme and several other functional languages guarantee it. GCC and Clang usually apply it to C++ when optimising, but the language does not promise it, so correct code must not depend on it. Python never does it, by design; the Java virtual machine does not; and although the JavaScript standard has required it in strict mode since ES2015, only Safari's engine implements it — Node and Chrome do not. In these four languages, treat tail recursion as a way of thinking, not a cure for depth: if the recursion is too deep, write the loop.

## Time and space complexity

Two rules cover every recursive function: time is the total work over all the calls in the tree, and space is the deepest chain of waiting calls times the size of a frame, plus whatever data the calls keep.

| Function | Number of calls | Time | Stack space |
| --- | --- | --- | --- |
| factorial(n) | n + 1 | O(n) | O(n) |
| Naive fib(n) | 2 × fib(n + 1) − 1, about 1.6ⁿ | O(2ⁿ), more exactly O(1.618ⁿ) | O(n) |
| Memoised fib(n) | 2n − 1 | O(n) | O(n) |
| power(x, n) by halving | ⌊log₂ n⌋ + 2 | O(log n) | O(log n) |
| Sum, reverse or palindrome with indices | about n, or n/2 | O(n) | O(n) |
| Merge sort | about 2n | O(n log n) | O(log n), plus an O(n) merge buffer |
| Every subset of n items | 2ⁿ⁺¹ − 1 | O(n × 2ⁿ) | O(n) |

The last row cannot be improved: when the answer itself has 2ⁿ entries, no algorithm lists it faster than its own length. That is the normal state of affairs in backtracking.

## How to recognise a recursive problem

Read the statement for these signals:

- The definition **refers to itself**: n! from (n − 1)!, a tree from its subtrees, an expression from smaller expressions, `3[a2[c]]` from `2[c]`.
- The input is **nested** to an unknown depth: brackets, folders, nested lists, a tree.
- The answer for n follows from the answer for a smaller case — n − 1, n / 2, or the same game with one player removed, as in [Find the Winner of the Circular Game](/problems/find-the-winner-of-the-circular-game).
- You must **generate** every subset, arrangement or path, so the number of nested choices depends on the input.
- The input splits into **independent parts** whose answers combine: divide and conquer.

If the recursion would call itself with the same arguments more than once, plan for memoisation from the start. If its depth grows with an n of 10⁵, plan the loop.

## Common mistakes

- **A missing or unreachable base case.** A Fibonacci with only `if n == 0` calls fib(−1) from fib(1) and never stops. Check that every chain of calls reaches a base case, including the smallest inputs the problem allows.
- **Dropping the recursive result.** In Python and JavaScript, calling `power(x, n // 2)` without storing or returning its value quietly gives `None` or `undefined` further up.
- **Calling twice what you could call once.** `power(x, n / 2) * power(x, n / 2)` is O(n), not O(log n), and naive Fibonacci is exponential for the same reason. Keep the result in a variable, or memoise.
- **Copying the input at every call.** Slices and substrings cost O(n) each; across n calls that is O(n²). Pass indices instead.
- **Integer overflow.** 13! overflows a 32-bit int and 21! a 64-bit one, and powers overflow even sooner. Use 64-bit types, or take the remainder after every multiplication when the problem gives a modulus.
- **Forgetting to undo shared state.** If the subsets code forgets the pop, every later subset inherits stale elements; if it stores `current` itself in a results list instead of a copy, every stored subset ends up as the same final list.

## Practice in this order

Start with problems where the recursive formula is the whole solution, then move to ones where you have to find the smaller problem yourself:

1. [Fibonacci Number](/problems/fibonacci-number): two base cases, then memoise the tree away.
2. [Power of Three](/problems/power-of-three): divide by three until a base case answers.
3. [Reverse String](/problems/reverse-string): two indices moving inwards, one call at a time.
4. [Count Good Numbers](/problems/count-good-numbers): fast power with a modulus, for a length up to 2 × 10⁹.
5. [Find the Winner of the Circular Game](/problems/find-the-winner-of-the-circular-game): a recurrence from n − 1 players to n.
6. [Find Kth Bit in Nth Binary String](/problems/find-kth-bit-in-nth-binary-string): recurse into the half that holds the answer instead of building the string.
7. [Decode String](/problems/decode-string): nested brackets, one call per level of nesting.
8. [Different Ways to Add Parentheses](/problems/different-ways-to-add-parentheses): divide and conquer at every operator.

The [recursion problem list](/challenges/recursion) has every problem in the catalogue that practises it. When the first five feel natural, move on to [backtracking](/roadmap/backtracking), which turns the subsets recursion into a general way of searching.

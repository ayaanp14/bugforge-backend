---
title: Recursion — methods that call themselves
minutes: 16
---
A recursive method solves a problem by solving a smaller version of the same problem and combining. It is the natural way to express anything tree-shaped, anything defined inductively, and most "try every possibility" searches. It is also the place where the call stack stops being an abstraction: every recursive call is a frame, and the JVM's default stack holds only a few thousand of them. This lesson gives you the discipline — base case, progress, trust — and the tools to keep recursion correct and fast.

## The shape

```java
static long factorial(int n) {
    if (n <= 1) return 1;                 // base case: answered directly
    return n * factorial(n - 1);          // recursive case: smaller problem, then combine
}
```

Every correct recursion has:

1. **A base case** — an input answered without recursing. Without one, the calls never stop.
2. **Progress** — every recursive call moves toward the base case (`n - 1`, a shorter string, a smaller subtree).
3. **Trust** — the recursive call is assumed to return the right answer for the smaller input; you only write the combining step. This is the mental leap: do not trace the whole recursion in your head; check the base case, check one step, and let induction do the rest.

## What happens on the stack

`factorial(4)` pushes a frame (`n = 4`), which calls `factorial(3)` (a second frame), … down to `factorial(1)`, which returns 1. Then each frame completes its multiplication and pops: 1 → 2 → 6 → 24. At the deepest point, five frames are live. The depth of recursion is the amount of stack used.

The default thread stack is around 512 KB–1 MB; a simple frame is tens of bytes, so roughly **10 000–20 000 nested calls** fit before:

```
Exception in thread "main" java.lang.StackOverflowError
```

This is an `Error`, not an `Exception`; catching it is not the fix. A recursion over a list of a million elements, or over `n` down to 0 with `n = 100 000`, will overflow. Recursion depth must be *logarithmic* (binary search, balanced trees: depth ~30) or *small* (a few thousand); linear-depth recursion over big inputs must become a loop.

## Classic examples

**Fibonacci, naive** — exponential time, since `fib(n - 2)` is computed twice at every level:

```java
static long fib(int n) {
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);       // ~2^n calls; fib(45) takes seconds
}
```

**Fibonacci with memoization** — remember answers; each is computed once:

```java
static long[] memo = new long[91];
static long fib(int n) {
    if (n < 2) return n;
    if (memo[n] != 0) return memo[n];
    return memo[n] = fib(n - 1) + fib(n - 2);    // O(n) calls
}
```

Memoization turns overlapping-subproblem recursions into linear work; it is the bridge to dynamic programming.

**Binary search** — logarithmic depth, safe:

```java
static int search(int[] a, int target, int lo, int hi) {
    if (lo > hi) return -1;
    int mid = lo + (hi - lo) / 2;
    if (a[mid] == target) return mid;
    return a[mid] < target ? search(a, target, mid + 1, hi) : search(a, target, lo, mid - 1);
}
```

**Reverse a string** — linear depth; fine for short strings, overflows for long ones:

```java
static String reverse(String s) {
    if (s.length() <= 1) return s;
    return reverse(s.substring(1)) + s.charAt(0);
}
```

**Power set / permutations / subsets** — the "choose or skip" pattern, where recursion is genuinely the clearest tool:

```java
static void subsets(int[] a, int i, List<Integer> current) {
    if (i == a.length) { System.out.println(current); return; }
    subsets(a, i + 1, current);                       // skip a[i]
    current.add(a[i]);
    subsets(a, i + 1, current);                       // take a[i]
    current.remove(current.size() - 1);               // undo — backtracking
}
```

## Helper methods and accumulators

Public API rarely wants the extra parameters recursion needs. Wrap:

```java
public static int search(int[] a, int target) { return search(a, target, 0, a.length - 1); }
private static int search(int[] a, int target, int lo, int hi) { … }
```

An **accumulator** parameter carries the result down instead of combining on the way up:

```java
static long factorial(int n, long acc) {
    if (n <= 1) return acc;
    return factorial(n - 1, acc * n);      // tail call: nothing to do after it returns
}
```

In languages with *tail-call optimisation* this runs in constant stack. **The JVM does not do tail-call optimisation** — a tail-recursive method still uses a frame per call. Write the loop.

## Recursion versus iteration

Every recursion can be rewritten as a loop with an explicit stack; every loop can be written recursively. Choose by clarity and depth:

| Prefer recursion | Prefer iteration |
| --- | --- |
| Trees, nested structures, divide and conquer | Linear scans, counting, accumulating |
| Backtracking / generate-all-combinations | Anything with depth ~n for large n |
| The recursive definition *is* the algorithm (GCD, Towers of Hanoi) | Performance-critical inner loops |

A recursive `sum(list)` over a million elements is a `StackOverflowError`; a recursive tree traversal over a million-node balanced tree is depth 20 and fine.

## Debugging recursion

- Print the arguments on entry, indented by depth, to see the call tree.
- Check the base case handles the smallest inputs *and* empty/zero.
- Make sure every recursive path makes progress — a call with the same arguments is an infinite loop.
- If the answer is wrong for `n = 2` but right for `n = 1`, the combining step is wrong.
- `-Xss` raises the stack size if you truly need a few more frames; it is a workaround, not a design.

## Mutual recursion and `static` context

Two methods can call each other (`isEven(n)` calls `isOdd(n - 1)`); the same base-case rules apply to the pair. Recursive methods are usually `static` (they depend on their arguments, not on an object) — an instance method can recurse too, on `this` or on other objects (a tree node calling `left.size()`).

## Interview angle

- *"What happens without a base case?"* `StackOverflowError`.
- *"Why is naive Fibonacci slow?"* Exponential re-computation; memoize or iterate.
- *"Does Java optimise tail recursion?"* No.
- *"When do you choose recursion?"* Trees, divide-and-conquer, backtracking; not linear scans of large inputs.
- *"How deep can you recurse?"* Thousands to low tens of thousands with the default stack.

## Key takeaways

- Base case, progress, trust — check the base case and one step; do not trace everything.
- Each call is a stack frame; depth must be small or logarithmic. Linear-depth recursion over big inputs overflows — use a loop.
- Memoize overlapping subproblems; the JVM has no tail-call optimisation.
- Wrap the recursive worker in a clean public method; use accumulators and backtracking (undo after the call) for searches.

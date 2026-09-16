---
title: Writing clean solutions under time pressure
minutes: 12
---
Two candidates solve the same problem correctly in the same time. One is hired. The difference is almost always what the interviewer could *see*: a solution structured so its correctness was obvious, names that said what things were, edge cases handled visibly, and a complexity stated without prompting. Clean code in an interview is not about style points — it is how you make forty minutes of thinking legible to someone who has to decide whether they trust you with a codebase. This lesson is the small set of habits that produce that legibility without slowing you down.

## Structure: parse, solve, print

```java
public static void main(String[] args) throws IOException {
    int n = nextInt();
    int[] a = readArray(n);
    out.println(solve(a));
    out.flush();
}

static long solve(int[] a) { … }          // pure: input in, answer out; no I/O, no globals
```

Three benefits: `solve` can be tested with a literal array in your head or in a scratch `main`; the interviewer can read the algorithm without wading through parsing; and when the question changes ("now what if the input is a stream?") only `main` changes. Keep helper methods **pure** where you can — a method that both computes and prints is twice as hard to reason about.

## Names that carry the invariant

`lo`/`hi` for a binary search, `left`/`right` for two pointers, `count`, `best`, `prefix`, `seen`, `dist` — the conventional names *are* documentation because every reader has met them. Beyond those, a name should tell the reader what is true: `firstUnsortedIndex`, `windowSum`, `remainingBudget`. Avoid `temp`, `data`, `result2`, `flag`, single letters outside loops and mathematics. If a variable needs a comment to explain what it holds, rename it.

## Small methods, one job each

`isValid(row, col)`, `swap(a, i, j)`, `charFrequency(s)`, `neighbours(node)` — extracting a five-line helper costs fifteen seconds and removes a nested block from the main logic. In an interview it also lets you *say* the plan: "I'll write a helper that checks whether a placement is valid, then the backtracking." A method longer than a screen is a method the interviewer has stopped following.

## Make the edge cases visible

```java
if (n == 0) return 0;                         // empty input
if (n == 1) return a[0];                      // single element
```

Guard clauses at the top, one per line, each a sentence. They show the interviewer you thought about the boundary *and* keep the main algorithm free of special cases. Then, while writing the loop, narrate the invariant once: "at the top of each iteration, `windowSum` is the sum of `a[lo..hi-1]`." A stated invariant is how you convince someone (including yourself) that the loop is correct without tracing it.

## Prefer the boring construct

- A `for` loop over a stream when there is an index or an early exit; a stream when it is a clean filter/map/collect.
- `ArrayList`, `HashMap`, `ArrayDeque` — the defaults — unless you can say why not.
- Arrays for fixed-size numeric data; `int[]` over `List<Integer>`.
- One return type: do not return `-1` from a method that also returns valid negative numbers; use `OptionalInt`, a boolean-and-out-parameter object, or `Long.MIN_VALUE` with a comment.
- No premature abstraction: an interface for one implementation, a factory for one class, generics for one type — each costs reading time and buys nothing in forty minutes.

## Comments: why, not what

`// shrink the window until the sum fits` explains the *what* of an obvious line and adds noise. `// a[] is sorted, so once a[i] > target no later pair can work` explains *why* the `break` is correct. Comment the non-obvious decision, the invariant, the reason a special case exists. Delete the debugging prints before you say "done"; a stray `System.out.println("here")` is a wrong-answer verdict.

## Say the complexity, then the trade-off

"This is O(n log n) for the sort, then O(n) for the sweep, O(n) extra memory for the map. We could get O(n) with counting sort since values are bounded by 10⁶, at the cost of a million-element array — worth it only if n is large." That sentence, unprompted, is the single highest-leverage thing you can say. It shows you know what you built and that you considered the alternative — which is the actual job.

## Test in your head, in order

1. The example from the statement — trace it, not "it looks right".
2. The smallest input: empty, one element.
3. One case that exercises the loop boundary: window of size exactly `k`, target equal to a single element, `n = k`.
4. One adversarial case: all equal, all negative, sorted descending.

Tracing a four-element array through your loop aloud finds most off-by-ones and takes under a minute. If the interviewer offers test input, take it; running their example is never a waste.

## When you are stuck

Say so, and say what you know: "I know I need sub-quadratic; sorting gives me order, but I don't yet see how to use it." Then simplify — solve for small n, for the sorted case, for one query — and grow the solution. A brute force written cleanly and *labelled* as the baseline earns partial credit and often reveals the optimisation. Silence earns nothing.

## The last thirty seconds

Run the pitfalls list from the previous lesson: overflow, `==`, `split`, sort worst case, recursion depth, `flush`. Remove debug output. Make sure the method signature matches what was asked. Then say "I believe this is complete; the complexity is …; edge cases handled are …" — and stop typing.

## Interview angle

- *"How do you approach a coding problem?"* Clarify constraints, state the brute force and its complexity, find the shape (from the idiom sheet), write parse/solve/print with helpers, trace the example and the edge cases, state the final complexity.
- *"What makes code readable to you?"* Names carrying invariants, small pure methods, guard clauses for edge cases, comments that say why.
- *"What would you do differently in production?"* Tests, input validation, error handling, no static state, perhaps the boring loop instead of the clever stream.
- *"Why separate I/O from logic?"* Testability, readability, and adaptability when the input source changes.

## Key takeaways

- Parse → `solve` (pure) → print; helpers with one job; conventional names, invariant-carrying names elsewhere.
- Guard clauses make edge cases visible; state the loop invariant once.
- Boring constructs, no speculative abstraction, comments for *why*.
- Say the complexity and the trade-off unprompted; trace the example and the smallest inputs aloud.
- Stuck: say what you know, write the labelled brute force, grow it. Finish with the pitfalls pass.

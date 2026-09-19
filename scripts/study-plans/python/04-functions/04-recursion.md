---
title: Recursion — base cases, the call stack and memoisation
minutes: 14
---
A recursive function calls itself on a smaller version of its input and stops at a case small enough to answer directly. Python supports it like any language, with one limit that matters more here than elsewhere: the interpreter refuses to nest calls more than about 1 000 deep by default, and the stack it uses is real memory. This lesson gives the two-part shape of every recursive function, shows what the call stack does on each call, explains `RecursionError` and `sys.setrecursionlimit`, and turns exponential recursion into linear with memoisation — by hand and with `functools.cache`.

## The shape

```python
def factorial(n):
    if n <= 1:                    # base case: answered directly
        return 1
    return n * factorial(n - 1)   # recursive case: a smaller problem, plus one step
```

Two questions design any recursive function. *What is the smallest input, and what is its answer?* — the base case, written first, because a recursion without one never ends. *If I had the answer for a smaller input, how would I get the answer for this one?* — the recursive case, which must move toward the base case on every path.

```python
def sum_digits(n):
    return n if n < 10 else n % 10 + sum_digits(n // 10)

def flatten(xs):                  # recursion over nested structure
    out = []
    for x in xs:
        if isinstance(x, list):
            out.extend(flatten(x))
        else:
            out.append(x)
    return out
```

Recursion over *structure* — nested lists, trees, JSON — is where it is clearly the right tool: the shape of the code follows the shape of the data. Recursion over *numbers* (`factorial`, `fib`) is usually a loop in disguise and is shown for teaching.

## The call stack

Each call creates a frame holding its parameters and locals; the frame lives until the call returns. `factorial(4)` stacks four frames — `n=4`, `n=3`, `n=2`, `n=1` — then unwinds, multiplying on the way back:

```text
factorial(4)
  factorial(3)
    factorial(2)
      factorial(1) -> 1
    -> 2 * 1 = 2
  -> 3 * 2 = 6
-> 4 * 6 = 24
```

Everything *after* the recursive call in the body runs during the unwind, in reverse order of the calls — which is why a function that prints before recursing prints top-down and one that prints after recursing prints bottom-up, and why reversing a list recursively is "the reverse of the rest, then the first element".

## The recursion limit

CPython caps the depth at `sys.getrecursionlimit()` — 1 000 by default — and raises `RecursionError: maximum recursion depth exceeded` when a call would exceed it. A recursion with no base case hits it immediately; a correct recursion over a long list (`sum_list(xs)` recursing once per element) hits it at a thousand elements. `sys.setrecursionlimit(200_000)` raises the cap and works on this track's judge for depths in the tens of thousands, but the cap exists because each Python frame costs real memory and a deep enough recursion crashes the interpreter rather than raising. The safer answers, in order: make the recursion shallow (divide in half rather than peeling one element — depth log n), or rewrite it as a loop with an explicit stack (a list you `append` to and `pop` from), which is what any recursive traversal becomes when the input is large.

Python does **not** optimise tail calls: `return f(n - 1)` still adds a frame. A tail-recursive function is exactly the one that converts to a `while` loop mechanically, so convert it.

## Memoisation

```python
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)      # fib(35) makes ~30 million calls
```

The naive version recomputes `fib(k)` exponentially many times. Remembering each result the first time it is computed makes every call after the first O(1):

```python
from functools import cache

@cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)      # fib(500) is instant
```

`@cache` (3.9; `@lru_cache(maxsize=None)` before it) wraps the function with a dictionary keyed by the arguments. The arguments must be hashable — ints, strings, tuples, not lists — and the function must be pure: same arguments, same result, no side effects. `fib.cache_info()` reports hits and misses; `fib.cache_clear()` empties it. The hand-written version is a dict parameter or a module-level dict checked at the top of the function:

```python
def fib(n, memo={}):        # a mutable default used on purpose — the cache should persist
    if n < 2:
        return n
    if n not in memo:
        memo[n] = fib(n - 1, memo) + fib(n - 2, memo)
    return memo[n]
```

Memoised recursion is *top-down dynamic programming*; the loop that fills a table from the base case up is *bottom-up*, uses no stack, and is what to reach for when the depth would be large.

## Generating combinations

Recursion is the natural way to enumerate choices — every subset, every permutation, every path — because each level of the recursion makes one decision:

```python
def subsets(xs):
    if not xs:
        return [[]]
    rest = subsets(xs[1:])
    return rest + [[xs[0]] + s for s in rest]

print(subsets([1, 2, 3]))
# [[], [3], [2], [2, 3], [1], [1, 3], [1, 2], [1, 2, 3]]
```

`itertools.permutations`, `combinations` and `product` (Module 11) do the standard ones; write the recursion when there is a constraint to prune on — the backtracking pattern.

## Pitfalls

- No base case, or a recursive case that does not shrink the input on some path.
- Recursing once per element over an input that can be long — `RecursionError` at ~1 000.
- Building a new list on every call (`xs[1:]`) — quadratic; pass an index instead.
- Memoising a function with side effects or unhashable arguments.
- Expecting tail-call elimination.
- Reading `RecursionError` as "recursion is too slow" — it is too *deep*.

## Key takeaways

- Base case first, then a recursive case that strictly shrinks the input.
- Each call is a frame; code after the recursive call runs during the unwind, in reverse.
- The default depth limit is 1 000; raise it with `sys.setrecursionlimit` for the judge, or recurse on halves, or use an explicit stack.
- `@functools.cache` memoises a pure function with hashable arguments — exponential to linear.
- Recursion fits nested data and choice enumeration; numeric recursion is usually a loop.

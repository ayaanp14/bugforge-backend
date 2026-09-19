---
title: The loop patterns
minutes: 14
---
Most loops are one of about eight patterns, and once you can name the pattern you can write the loop without thinking about it — and, more importantly, recognise when Python has already written it for you as a built-in. This lesson catalogues them: accumulate, count, extreme, search, running state, two pointers, prefix sums, and building output. Each comes with the built-in that replaces it when the body is simple, and the hand-written form for when it is not.

## Accumulate, count, extreme

```python
total = 0                      # accumulate
for x in xs:
    total += x
total = sum(xs)                # the built-in

count = 0                      # count with a condition
for x in xs:
    if x % 2 == 0:
        count += 1
count = sum(1 for x in xs if x % 2 == 0)   # or sum(x % 2 == 0 for x in xs)

best = None                    # extreme with a key
for word in words:
    if best is None or len(word) > len(best):
        best = word
best = max(words, key=len)     # the built-in; raises ValueError on an empty input
```

`sum`, `min`, `max`, `len`, `any`, `all` are the accumulations; write the loop only when the update is not a plain fold — when it depends on the previous element, or when two things are tracked at once. The `best = None` start is the general form when no sensible initial value exists; `float("inf")` and `float("-inf")` are the starts for numeric minimum and maximum.

## Search

```python
def find(xs, target):
    for i, x in enumerate(xs):
        if x == target:
            return i
    return -1
```

Return from inside the loop the moment the answer is known; the code after the loop is the "not found" branch. In a loop that is not in its own function, `for … else` plays the same role (Module 3 lesson 2). The built-ins: `x in xs` for existence, `xs.index(x)` for the position (raising `ValueError` when absent), `next((x for x in xs if pred(x)), None)` for "first element satisfying", `any(pred(x) for x in xs)` for "does one exist".

## Running state

A streak, a previous value, a state machine — the loop carries information from one iteration to the next:

```python
best_len = cur_len = 0
prev = None
for x in xs:
    cur_len = cur_len + 1 if x == prev else 1
    best_len = max(best_len, cur_len)
    prev = x
```

The shape is always: initialise the state before the loop, update it from the old state and the current element, read the answer after. The classic mistake is forgetting the update at the end of the body (`prev = x`), or updating it before it has been used. `itertools.pairwise(xs)` (3.10) gives `(prev, x)` pairs directly for the two-element case, and `itertools.accumulate` for running totals and running maxima.

## Two pointers

Two indices moving through one sorted sequence (or two sequences), each step advancing one of them by a rule:

```python
def pair_sum(xs, target):          # xs sorted ascending
    i, j = 0, len(xs) - 1
    while i < j:
        s = xs[i] + xs[j]
        if s == target:
            return i, j
        if s < target:
            i += 1
        else:
            j -= 1
    return None
```

This is a `while`, because which pointer moves depends on the data. The same shape merges two sorted lists, removes duplicates from a sorted list in place, and tests palindromes from both ends. The invariant worth writing as a comment is what has been ruled out: "no pair with an index below `i` or above `j` can sum to `target`".

## Prefix sums and running totals

```python
prefix = [0]
for x in xs:
    prefix.append(prefix[-1] + x)
# sum(xs[a:b]) == prefix[b] - prefix[a], in O(1) per query
```

`prefix[i]` is the sum of the first `i` elements; the extra leading zero makes the subtraction uniform. `itertools.accumulate(xs, initial=0)` builds the same list. The pattern turns a sequence of range-sum questions from O(n) each into O(1) each after O(n) preparation, and is the first "precompute then answer" idea in most interview loops.

## Building the output

Printing inside a loop is fine for a few lines. For many, collect and print once — it is faster (one write instead of thousands) and it keeps formatting in one place:

```python
out = []
for r in range(rows):
    out.append(" ".join(str(v) for v in grid[r]))
print("\n".join(out))
```

Strings should be joined, not concatenated in a loop: `s += piece` copies the growing string each time (Module 19), while `"".join(pieces)` is one allocation. When each element maps to one line of output, the whole loop is `print("\n".join(f(x) for x in xs))`.

## Nested loops and early exit

```python
def has_duplicate_pair(grid):
    for row in grid:
        for a, b in itertools.pairwise(row):
            if a == b:
                return True
    return False
```

A `return` leaves every enclosing loop at once; that is the reason to put a nested search in its own function. When the loops are not a search but a full traversal, the nesting is fine as written, and `itertools.product` flattens two ranges into one loop when a single `break` is wanted.

## Pitfalls

- Writing the loop for `sum`, `max` or `any` by hand and getting the initial value wrong (`best = 0` for a list of negatives).
- Forgetting `prev = x` at the end of a running-state body.
- A two-pointer loop where neither pointer moves in some branch — an infinite loop.
- An off-by-one in a prefix array without the leading zero.
- `s += line` in a loop over thousands of lines.
- Searching with a flag variable when `return` or `for … else` says it directly.

## Key takeaways

- Accumulate, count and extreme are `sum`, `sum(cond)`, `min`/`max` with `key`; write the loop only when the update is not a plain fold.
- Search returns from inside the loop; after the loop is "not found"; `in`, `index`, `next(gen, None)` and `any` are the built-ins.
- Running state: initialise, update from the previous state and the element, remember to advance the state.
- Two pointers are a `while` with an invariant; prefix sums turn range queries into subtraction.
- Collect output in a list and `join` once; never build a long string with `+=`.

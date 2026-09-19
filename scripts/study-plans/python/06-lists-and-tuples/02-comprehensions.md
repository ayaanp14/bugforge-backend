---
title: Comprehensions — building collections from expressions
minutes: 13
---
A list comprehension is a loop, a filter and a transform folded into one expression that *builds a list*: `[f(x) for x in xs if p(x)]`. It replaces the four-line pattern of creating an empty list, looping, testing and appending, and it says what the result *is* rather than how it is assembled. Python has the same shape for sets and dictionaries and a lazy version for generators. This lesson teaches the syntax, the nested forms, the readability limit past which a loop is better, the scoping rule, and where a comprehension is the wrong tool — when the loop body has side effects, or when the result is thrown away.

## The basic form

```python
squares = []                          # the loop
for x in range(6):
    if x % 2 == 0:
        squares.append(x * x)

squares = [x * x for x in range(6) if x % 2 == 0]     # the comprehension: [0, 4, 16]
```

Read it as: *the list of `x * x` for each `x` in `range(6)` such that `x` is even*. The expression comes first, the `for` supplies the elements, the optional `if` filters. The expression can be anything — a call, a tuple, a conditional expression:

```python
labels = ["even" if x % 2 == 0 else "odd" for x in xs]   # a conditional expression: always produces
pairs = [(x, x * x) for x in xs]
lengths = [len(w) for w in words]
cleaned = [w.strip().lower() for w in words if w.strip()]
```

Note the two positions of `if`: `if` *after* the `for` filters (produces fewer elements); a conditional expression *before* the `for` chooses a value (produces one per element).

## Nested loops

Several `for` clauses nest in reading order, left to right — the first `for` is the outer loop:

```python
pairs = [(a, b) for a in range(3) for b in range(2)]
# [(0, 0), (0, 1), (1, 0), (1, 1), (2, 0), (2, 1)]

flat = [x for row in grid for x in row]          # flatten one level: outer loop over rows, inner over elements
triangles = [(a, b) for a in range(1, 5) for b in range(a, 5)]   # the inner range may use the outer variable
```

A comprehension *inside* a comprehension builds nested output:

```python
grid = [[0] * cols for _ in range(rows)]          # a fresh row per iteration (Module 6 lesson 1)
table = [[r * c for c in range(1, 4)] for r in range(1, 4)]
transposed = [[row[i] for row in matrix] for i in range(len(matrix[0]))]
```

Two nested levels is the readable limit. Three `for` clauses, or a comprehension inside a comprehension inside a comprehension, is a loop written as a puzzle — expand it.

## Set, dict and generator forms

```python
unique_lengths = {len(w) for w in words}                  # a set: braces, one expression
index = {w: i for i, w in enumerate(words)}               # a dict: key: value
squares_by_x = {x: x * x for x in range(4)}
total = sum(x * x for x in xs)                            # a generator: no list is built
first_neg = next((x for x in xs if x < 0), None)
```

The dict comprehension is the idiom for inverting a mapping (`{v: k for k, v in d.items()}`) and for building lookups. The generator expression (Module 11) is the same syntax in parentheses and produces values lazily — the right form when the consumer (`sum`, `max`, `any`, `"".join`) only needs to see each value once, because no intermediate list is allocated. When a generator is the sole argument to a call, its parentheses double as the call's: `sum(x for x in xs)`.

## Comprehension versus map/filter versus loop

```python
[int(t) for t in tokens]         # comprehension
list(map(int, tokens))           # map — fine when the function already exists
[x for x in xs if x > 0]         # comprehension
list(filter(lambda x: x > 0, xs))   # filter with a lambda — the comprehension is clearer
```

Reach for `map` when the function exists (`int`, `str.strip`, a `def`); reach for the comprehension whenever a lambda would be needed or a filter and a transform combine. Write a plain `for` loop when the body does something *other* than produce a value — printing, updating several variables, breaking early — and never write a comprehension whose result you discard just to run its side effects (`[print(x) for x in xs]` is a loop wearing a costume).

## Scope

A comprehension has its own scope: the loop variable does not leak.

```python
x = "outer"
squares = [x * x for x in range(3)]
print(x)          # 'outer' — untouched (in Python 2 it would have been 2)
```

The comprehension can read enclosing names (`[x * factor for x in xs]`), and the walrus operator binds in the *enclosing* scope: `[y for x in xs if (y := f(x)) > 0]` leaves `y` defined afterwards — occasionally useful for "compute once, filter and keep".

## Performance

A comprehension is somewhat faster than the equivalent `append` loop because the interpreter uses a specialised instruction for the append, and it allocates the list once when it can predict the size. That is a constant-factor gain, not an algorithmic one; a comprehension containing `x in other_list` is still quadratic. The generator form uses O(1) memory where the list form uses O(n) — the difference that matters at scale.

## Pitfalls

- A comprehension for side effects (`[print(x) …]`).
- Three or more nested clauses; a conditional expression with an `if` filter and a nested comprehension on one line.
- Putting the filter `if` in front of the `for` (syntax error) or the conditional expression after it (also wrong).
- `[[0] * n] * m` instead of a comprehension for the rows.
- A list comprehension where a generator would do — `sum([x for x in xs])` builds a list for nothing.
- Expecting the loop variable to be visible after the comprehension.

## Key takeaways

- `[expr for x in iterable if cond]` — expression, loop, filter; a conditional expression in the `expr` position chooses a value per element.
- Several `for` clauses nest left to right; nested comprehensions build nested lists — a fresh inner list each time.
- `{…}` builds a set or a dict (`k: v`); `(…)` is a lazy generator, ideal as the argument to `sum`, `max`, `any`, `join`.
- Prefer `map` when the function exists, the comprehension when a lambda would be needed, a loop when there are side effects or early exit.
- Comprehensions have their own scope; keep them to two levels.

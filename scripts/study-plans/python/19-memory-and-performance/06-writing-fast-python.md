---
title: Writing fast Python — the checklist, from algorithm to micro-optimisation
minutes: 14
---
Making Python fast is a sequence of questions asked in a fixed order, because each level dwarfs the next: is the algorithm right, is the data structure right, is the work happening in C, is the hot loop lean, and only then the micro-optimisations that shave constants. A change at the first level turns hours into seconds; a change at the last turns a second into 0.8 of one. This lesson is the checklist, with the idioms at each level — precomputation and memoisation, the right container, built-ins and comprehensions, fast I/O, local binding, `__slots__`, early exit — and the judgement about when to stop.

## 1. The algorithm

Count the operations as a function of n before writing code. A nested loop over the same data is n²; a sort is n log n; a single pass is n. Most "Python is slow" problems are quadratic algorithms that would be slow in C too. The classic fixes: **precompute** what is asked repeatedly (prefix sums answer any range sum in O(1) after an O(n) pass; a dict from key to row replaces a search per query), **memoise** overlapping subproblems (`@functools.cache` on a recursive function turns exponential into polynomial, or write the table iteratively), **sort once** and binary-search, **hash** for membership and grouping, **early exit** when the answer is known.

```python
prefix = [0]
for x in xs:
    prefix.append(prefix[-1] + x)
range_sum = lambda i, j: prefix[j] - prefix[i]     # O(1) per query

@functools.cache
def paths(r, c):
    if blocked[r][c]: return 0
    if r == c == 0: return 1
    return (paths(r - 1, c) if r else 0) + (paths(r, c - 1) if c else 0)
```

## 2. The data structure

From the cost model: `set`/`dict` for membership and lookup, `deque` for a queue, `heapq` for repeated minimum, `bisect` for sorted queries, `Counter` for tallies, `defaultdict(list)` for grouping, tuples for fixed records, `array`/NumPy for numbers. Choosing the structure is choosing the complexity of every operation the rest of the program performs.

## 3. Do the work in C

Built-ins and C-implemented methods run the whole loop without the interpreter: `sum`, `min`, `max`, `any`, `all`, `sorted` with a key, `str.join`, `str.split`, `str.count`, `list.sort`, `map`/`filter` with a built-in or C function, `set` operations, `dict.update`, `itertools`, `Counter`, `bytes` methods, `re` on a whole string. A comprehension is faster than an explicit loop with `append` (its own code object, no method lookup per iteration), and a generator expression inside `sum` avoids the intermediate list. The general form: express the computation as a pipeline of built-ins over whole collections rather than as element-by-element statements.

## 4. Fast I/O

```python
import sys
data = sys.stdin.buffer.read().split()       # one read, one split: bytes tokens
n = int(data[0]); xs = list(map(int, data[1:n + 1]))

out = []
for row in rows:
    out.append(f"{row.name} {row.total}")
sys.stdout.write("\n".join(out) + "\n")      # one write, or print("\n".join(out))
```

`input()` per line and `print` per line each cost a system call and a decode/encode; for a hundred thousand lines that is most of the run time. Read everything once, split, convert with `map(int, …)`; build output in a list and write it once. `sys.stdin.readline` is the middle ground when lines must be processed as they arrive.

## 5. The hot loop

Once the profiler names the loop that matters:

- **Hoist** everything loop-invariant out of it: attribute lookups (`append = out.append`), global and built-in names (`_len = len`), constant expressions, a `re.compile`.
- **Avoid** allocations per iteration — slicing, `str` concatenation, tuple packing where not needed, creating a small object that is immediately discarded.
- **Keep types stable** so 3.11's specialiser stays specialised.
- **Use `try/except`** for the rare case instead of a check per iteration.
- **Replace** a Python-level function call per element with an inline expression, or the whole loop with a comprehension or C-level call.
- **`__slots__`** on classes instantiated in the millions: less memory and faster attribute access.

```python
def count_matches(words, vocab):
    contains = vocab.__contains__          # hoisted bound method
    return sum(1 for w in words if contains(w))
```

Each of these is worth 10–40 % on a loop that is already the bottleneck, and nothing on a loop that is not.

## 6. The escape hatches

When the algorithm is optimal and the loop is lean and it is still too slow: NumPy for numeric arrays; `multiprocessing` for CPU-bound work that splits; `functools.lru_cache` for repeated calls; a C extension, Cython, Numba or Rust via PyO3 for the innermost kernel; PyPy for a whole program that is pure Python. Each is a real project decision, not a first resort.

## When to stop

The target is a number — under a second, under 256 MB, ten thousand requests a second — and the checklist runs until it is met, no further. Every optimisation trades readability, and the readable version is what gets maintained. Profile, apply the highest-level fix that applies, measure, and if the target is met, leave the rest alone. The `-O` flag, `.pyc` files and "avoid function calls" folklore are not on the list because their effect is negligible next to the algorithm and the data structure.

## A worked pass

A script that reads 200 000 records, finds duplicates and prints summaries takes 40 s. Profile: 38 s in `if record in seen_list`. Level 2: `seen` becomes a set — 1.2 s. Profile again: 0.8 s in `print` per line. Level 4: collect and write once — 0.5 s. Target was 2 s; stop. The two changes were four lines; no loop was hand-tuned.

## Pitfalls

- Micro-optimising before profiling.
- Tuning a loop that is 3 % of the run time.
- `input()`/`print()` per line at scale.
- A memoised recursive function without `sys.setrecursionlimit` on deep inputs.
- Rewriting readable code into a comprehension nobody can read for 5 %.
- Reaching for C before checking the algorithm.

## Key takeaways

- Order of attack: algorithm, data structure, work in C, I/O, the hot loop, escape hatches — each level dwarfs the next.
- Precompute, memoise, sort-and-bisect, hash, early-exit are the algorithmic moves; prefix sums and `@cache` are the two to know cold.
- Built-ins, comprehensions and `join` keep loops in C; read input once and write output once.
- In the hot loop only: hoist lookups, avoid allocations, keep types stable, `try/except` for the rare case, `__slots__` for many instances.
- Stop when the target is met; readability is the default.

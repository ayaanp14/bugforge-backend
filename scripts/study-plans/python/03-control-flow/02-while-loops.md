---
title: While loops — repeat until a condition changes
minutes: 12
---
A `while` loop runs its body as long as its condition is true, and that is the whole statement — Python has no `do … while` and no C-style `for (init; test; step)`. The consequence is that `while` is reserved for the loops where you *do not know in advance how many times* you will go round: reading until a sentinel, iterating a numerical process to convergence, walking a linked structure, retrying until success. Everything with a known count or a known collection is a `for` (next lesson). This lesson covers the statement, `break` and `continue`, the `else` clause that only `while` and `for` have, and the three loop shapes that come up again and again.

## The statement

```python
n = 27
steps = 0
while n != 1:
    n = n // 2 if n % 2 == 0 else 3 * n + 1
    steps += 1
print(steps)          # 111
```

The condition is tested *before* each iteration, including the first — a `while` whose condition is false at the start runs zero times. Something in the body must change what the condition depends on, or the loop never ends; on the judge that is a time-limit verdict, and locally it is Ctrl-C.

## break, continue and the infinite loop

`break` leaves the loop immediately; `continue` skips to the next test. With `while True:` and `break` you get the loop whose exit is in the middle, which is the Python spelling of `do … while`:

```python
while True:
    line = input()
    if line == "END":
        break
    process(line)
```

The body runs at least once, the exit condition is tested after reading, and the reading is written only once — the alternative, priming the loop with a read before it and repeating the read at the bottom, is longer and error-prone. The walrus operator collapses the common case (Module 2): `while (line := input()) != "END":`.

`continue` is the loop's guard clause: reject this iteration and move on, leaving the rest of the body flat.

```python
while queue:
    item = queue.pop()
    if item.done:
        continue
    handle(item)
```

## The else clause

`while … else` runs the `else` block when the loop ends *because the condition became false* — not when it was left by `break`. It is the natural place for "we searched and did not find":

```python
i = 0
while i < len(xs):
    if xs[i] == target:
        print(f"found at {i}")
        break
    i += 1
else:
    print("not found")
```

Without `else` you would need a `found` flag set inside the loop and tested after it. The clause is rarely seen, which is the main argument against it; readers who know it find it clearer than the flag.

## Reading until a sentinel or EOF

A **sentinel** is a value that marks the end — `0`, `-1`, `END`, an empty line. **EOF** is the end of the stream itself, signalled by `EOFError` from `input()` or by `sys.stdin` running out:

```python
total = 0
while True:                          # sentinel 0
    n = int(input())
    if n == 0:
        break
    total += n

try:                                 # until EOF
    while True:
        line = input()
        total += int(line)
except EOFError:
    pass
```

For EOF the `for line in sys.stdin:` loop is shorter and is what the later modules use; the `while` form is here because it shows where `EOFError` comes from.

## Numerical loops

Iterate until the change is small enough — the loop whose count is genuinely unknown:

```python
x = n / 2
while abs(x * x - n) > 1e-9:         # Newton's method for a square root
    x = (x + n / x) / 2
```

Two guards belong in a real version: a maximum iteration count (`for _ in range(100)` with a `break` is often the cleaner spelling), and a tolerance chosen with Module 2's floating-point rules in mind.

## Counting loops — and why they are usually for loops

`i = 0; while i < n: …; i += 1` works, and `for i in range(n):` is what Python programmers write, because the count is known. The `while` version has two failure modes the `for` version cannot have: forgetting the increment (an infinite loop) and mutating `i` inside the body (a skipped or repeated element). Reserve `while` for the loops where the step is not a fixed increment — a search that jumps by variable amounts, a two-pointer sweep where either pointer may move, a queue drained until empty.

## Pitfalls

- A condition that nothing in the body changes.
- `while x = 5:` is a syntax error; `while x == 5:` is the test.
- Off-by-one in `while i <= len(xs):` — the last valid index is `len(xs) - 1`.
- Expecting `else` to run after a `break`. It runs only after a normal exit.
- A `try` around the whole loop swallowing the exception you wanted to see, so the loop spins on `EOFError` forever.
- Floating-point equality as an exit test (`while x != 0.3`). Use a tolerance.

## Key takeaways

- `while` tests before each iteration and runs zero or more times; use it when the count is unknown.
- `while True:` + `break` is the loop with its exit in the middle; `continue` skips an iteration.
- `else` on a loop runs only when the loop ended without `break` — the "not found" branch.
- Sentinel loops break on the marker value; EOF loops catch `EOFError` (or use `for line in sys.stdin`).
- Known counts and collections are `for` loops; `while` is for searches, convergence and queues.

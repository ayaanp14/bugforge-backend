---
title: Loops — for, while, do…while and the traps between them
minutes: 14
---
A loop is the one place where a program's correctness depends on a boundary: one iteration too many reads past the end of an array, one too few drops the last element, and a condition that never turns false runs until the judge kills the process. C++ has the three loops C had — `for`, `while`, `do … while` — and one trap Java programmers do not carry: unsigned arithmetic wraps, so a countdown on `std::size_t` never reaches `-1`. This lesson fixes the shape of each loop, the half-open convention that makes off-by-one errors rare, `break` and `continue`, and how to leave two nested loops at once.

## Three loops, three shapes

```cpp
for (int i = 0; i < n; ++i) { /* … */ }   // a known number of steps, or an index

while (balance > 0) { /* … */ }            // test first; may run zero times

do {
    std::cout << "enter a positive number: ";
    std::cin >> x;
} while (x <= 0);                          // body first; always runs at least once
```

`for` is for counting and indexing; `while` is for "as long as", where the number of steps is not known in advance; `do … while` is the rare one — a body that must run at least once before its condition makes sense, the classic case being "ask, then check, repeat while wrong".

## Anatomy of for

```cpp
for (init; condition; step) body
```

`init` runs once. Then, per iteration: test `condition`, stop if false; run `body`; run `step`. All three parts are optional — `for (;;)` is an infinite loop — and `init` may declare several variables of one type:

```cpp
for (int lo = 0, hi = n - 1; lo < hi; ++lo, --hi) {
    std::swap(a[lo], a[hi]);
}
```

The variable declared in `init` is scoped to the loop: `i` does not exist after the closing brace. If the code after the loop needs the index at which it stopped, declare the variable outside:

```cpp
int i = 0;
for (; i < n && a[i] != target; ++i) { }
// i is n when target is absent, otherwise its index
```

`++i` and `i++` do the same thing to an `int`; `++i` is the habit worth forming, because for an iterator (Module 13) `i++` has to produce a copy of the old value that nobody uses.

## Half-open ranges and the fencepost

The C++ convention for a range is *half-open*: `[begin, end)` includes `begin` and excludes `end`. Every standard algorithm takes its ranges that way, and every counting loop should:

```cpp
for (int i = 0; i < n; ++i) { /* exactly n iterations: 0, 1, …, n-1 */ }
```

Three properties make the convention worth keeping. The number of elements is `end - begin`, with no `+ 1`. An empty range is `begin == end`, which needs no special case. Two adjacent ranges `[a, b)` and `[b, c)` share their boundary without overlapping. The loop that inclusively counts `1` to `n` — `for (int i = 1; i <= n; ++i)` — is also correct, but the moment `<=` and a zero-based index meet (`i <= n` over `a[i]`), the last iteration reads `a[n]`, one past the end, which is undefined behaviour.

Printing `n` values separated by spaces with no trailing space is the fencepost problem in miniature — `n` values need `n - 1` separators, so print the separator *before* every value except the first: `if (i > 0) std::cout << ' ';`.

## The unsigned countdown trap

`std::size_t` — the type of `v.size()` and of every container index — is unsigned. Unsigned arithmetic does not go negative; it wraps (Module 2, lesson 2). So the obvious countdown never stops:

```cpp
std::vector<int> v{1, 2, 3};
for (std::size_t i = v.size() - 1; i >= 0; --i) {   // i >= 0 is always true
    std::cout << v[i];
}
```

After `i` reaches 0, `--i` wraps to 18446744073709551615, `v[i]` reads far outside the vector, and the behaviour is undefined. (GCC does warn: "comparison of unsigned expression in `>= 0` is always true".) There is a second trap in the same line: when `v` is empty, `v.size() - 1` already wraps and the loop begins out of range.

Two shapes are correct. Test before decrementing, so the body sees the decremented value:

```cpp
for (std::size_t i = v.size(); i-- > 0;) {
    std::cout << v[i];        // last index first, ends after index 0
}
```

Or keep `i` one above the index you use:

```cpp
for (std::size_t i = v.size(); i > 0; --i) {
    std::cout << v[i - 1];
}
```

Both are correct for an empty vector. The alternative — `int` indices with `static_cast<int>(v.size())` — works, but comparing a bare `int i` with `v.size()` draws `-Wsign-compare`, and that warning is right often enough to keep.

## break and continue

`break` leaves the innermost enclosing loop *or switch*; `continue` skips the rest of the body and goes to the next iteration. In a `for` loop the step still runs after `continue`; in a `while` loop nothing runs but the condition, so a `continue` placed before the increment loops forever:

```cpp
int i = 0;
while (i < 5) {
    if (i % 2 == 0) continue;     // i is 0, stays 0: never ends
    std::cout << i;
    ++i;
}
```

The `for` version — `for (int i = 0; i < 5; ++i) { if (i % 2 == 0) continue; … }` — is fine, because the `++i` is in the step. That difference is the practical reason to prefer `for` whenever there is a counter at all.

## Nested loops and leaving both

`break` in an inner loop leaves the inner loop only; the outer one carries on. To stop both, put the fact that you are done somewhere the outer loop can see:

```cpp
bool found = false;
int bi = 0, bj = 0;
for (int i = 0; i < n && !found; ++i) {
    for (int j = i + 1; j < n; ++j) {
        if (a[i] + a[j] == target) {
            bi = i;
            bj = j;
            found = true;
            break;                // leaves the inner loop; the outer condition sees found
        }
    }
}
```

When the search is a function of its own, `return` from the inner loop is cleaner than the flag (Module 4). `goto` can jump to a label after both loops; modern code does not use it.

## Termination

Every loop needs something that moves toward the exit: an index growing toward `n`, a number halved each step, input running out. `while (true)` with a `break` is legitimate when the exit test belongs mid-body, provided the `break` is reachable on every path. `for (double x = 0; x != 1.0; x += 0.1)` has no such guarantee — ten additions of `0.1` do not make exactly `1.0` (Module 2, lesson 3); count in integers and scale.

## What goes wrong

| Mistake | What happens |
| --- | --- |
| `for (…);` with a stray semicolon | Empty body; the block below runs once, after the loop. |
| `i <= n` over a zero-based array | Reads `a[n]`: undefined behaviour. |
| `size_t` countdown with `i >= 0` | Wraps at 0; never terminates, reads out of range. |
| `continue` before the increment in a `while` | Infinite loop. |
| `break` inside a `switch` inside a loop | Leaves the switch only. |
| `while (!std::cin.eof())` | Runs once more after the last value (lesson 5). |

## Key takeaways

- `for` counts, `while` waits for a condition, `do … while` runs first and asks afterwards.
- Ranges are half-open: `[0, n)` with `<`, `n` iterations, no `+ 1`, empty when `begin == end`.
- Never write `size_t i >= 0`; count down with `i-- > 0` or `i > 0` and `v[i - 1]`.
- `continue` in a `while` skips the increment; `break` leaves only the innermost loop or switch.
- Leave nested loops with a flag in the outer condition or a `return`.

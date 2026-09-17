---
title: Compiler optimisation — what -O2 does for you and what it cannot
minutes: 14
---
The code the processor runs is not the code you wrote. At `-O2` the compiler inlines your small functions, folds every expression it can evaluate at compile time, deletes computations whose results are never used, replaces loops with closed forms and turns some branches into conditional moves — all under one licence, the **as-if rule**: any transformation is allowed as long as the program's observable behaviour is unchanged. Knowing what the optimiser does tells you which hand-optimisations are wasted, which measurements are lies, and why `constexpr` is a guarantee where a plain constant is a hope. The exercises simulate two things — a constant folder with dead-store elimination, and the branch predictor whose misses the optimiser cannot always remove.

## The levels

| Flag | What it means |
| --- | --- |
| `-O0` | No optimisation; every variable lives in memory; the debugger shows your source. The default. |
| `-O1` | The cheap, safe passes: dead code, constant folding, register allocation. |
| `-O2` | Production: inlining, loop optimisations, scheduling, cheap vectorisation. **What the study judge uses.** |
| `-O3` | `-O2` plus aggressive inlining, unrolling and vectorisation; larger code, sometimes faster. |
| `-Os` / `-Og` | Optimise for size / without harming debugging. |
| `-Ofast` | `-O3` plus `-ffast-math`, which reorders floating-point operations and ignores NaN — never for money. |

Measuring an `-O0` build tells you nothing about the program; every performance question in this module assumes `-O2`.

## The as-if rule

The standard defines a program's meaning by its **observable behaviour**: the reads and writes of `volatile` objects, the data written to files and streams, and the interaction with the environment. Everything else — which locals exist, how many times an expression is evaluated, whether a function is called at all — the compiler may rearrange as long as the observable behaviour is what the source demands. Two corollaries: a computation whose result reaches no output may be deleted outright, and undefined behaviour, which has no defined observable behaviour, gives the optimiser a free hand (lesson 1).

## Inlining

Replacing a call with the callee's body removes the call overhead — a handful of instructions — but the real win is what it *enables*: the arguments become known values inside the body, so constants propagate, branches on them fold, and the surrounding loop is optimised as one unit.

```cpp
inline int square(int x) { return x * x; }
int area = square(12);                     // becomes: int area = 144;
```

The `inline` keyword is not the decision. It is a promise to the linker that the definition may appear in several translation units (Module 4, lesson 6); the optimiser inlines by its own heuristics — body size, call count, whether the definition is visible in this translation unit. Functions defined in headers and templates are always visible, which is one reason header-only code is fast.

## Constant folding and propagation

`3 * 4` is `12` at compile time; so is `square(12)` once inlined. The compiler evaluates what it can prove and substitutes the result. `constexpr` upgrades that from *may* to *must* in one situation: an expression used where a constant is required — an array bound, a template argument, a `constexpr` variable's initialiser — is evaluated at compile time or the program does not compile. `consteval` forbids run-time evaluation altogether (Module 16, lesson 3).

Real compilers also apply algebraic identities — `x * 0` is `0` for integers, `x * 8` is `x << 3` — and replace division by a constant with a multiplication by a magic number, which is why `n / 10` is not slow. The exercise's folder is deliberately simpler: it folds only when both operands are constants, so `n * 0` stays a run-time value and the difference between propagation and simplification is visible.

## Dead-code elimination

A value never read is a value never computed:

```cpp
int wasted() {
    int sum = 0;
    for (int i = 0; i < 1000000; ++i) sum += i;   // sum is never used …
    return 0;                                     // … so the loop is gone
}
```

The same rule deletes an assignment overwritten before it is read (a **dead store**), a branch whose condition is a known constant, and a call whose only effect was its return value. It is why a microbenchmark that computes something and never prints it measures nothing (lesson 5), and why a loop summing `1` to `n` is emitted as `n * (n + 1) / 2`: the compiler recognises the closed form.

## Loops and vectors

At `-O2` a loop over contiguous data may be **unrolled** (several iterations per branch) and **vectorised** (several elements per instruction, in SSE or AVX registers). The requirements are the ones lesson 3 argued for — contiguous memory, a simple stride, no data-dependent control flow — plus one the compiler cannot see: that the output does not alias the inputs. Given `void add(int* a, const int* b, int n)` it must assume `a` and `b` may overlap; `__restrict` promises they do not.

## Branches and `volatile`

A small `if`/`else` that selects a value — `x = c ? a : b` — is often emitted as a **conditional move** with no branch at all, immune to misprediction. A branch that guards a loop body or a call stays a branch, and its cost is decided by the hardware predictor, not the compiler. C++20's `[[likely]]` and `[[unlikely]]` choose which path is laid out first; they do not touch the predictor. The exercise models a two-bit predictor over sorted and unsorted data to show what a data-dependent branch costs and why sorting, or a branchless form, removes it.

`volatile` declares that every read and write of an object is observable: the compiler must perform each one, in order, and may not cache the value in a register. It exists for memory-mapped hardware and signal handlers, and it serves as a **sink** in a benchmark (lesson 5). It is not a synchronisation tool — a `volatile int` shared between threads is still a data race (Module 17, lesson 3).

## LTO, PGO and reading assembly

**Link-time optimisation** (`-flto`) lets the optimiser see every translation unit at once, so a function defined in one `.cpp` can be inlined into another. **Profile-guided optimisation** (`-fprofile-generate`, run, `-fprofile-use`) feeds measured branch frequencies back into the compiler. Both are switches for after the code is right.

Compiler Explorer (godbolt.org) shows the assembly for any snippet on any compiler and level, and the signs are readable without writing assembly: a `call` that disappeared was inlined; a loop that became a formula was folded; a `ret` with a constant means the function ran at compile time; `cmov` means a branch became a move; `xmm`/`ymm` registers mean vectorisation.

## What not to hand-optimise

| Habit | Why it is wasted |
| --- | --- |
| `x << 1` for `x * 2`, `x >> 1` for `x / 2` | The compiler emits the shift itself — and for signed `x / 2` the *correct* one, which a bare shift is not for negatives |
| `i++` versus `++i` on an `int` | Identical code; the difference is real only for iterators (Module 3, lesson 3) |
| Caching `v.size()` in a local | Hoisted automatically unless the loop body might change it |
| Manual loop unrolling | The compiler unrolls when it pays |
| `register`, `inline` as a speed hint | Removed from the language, and not a hint, respectively |

What the optimiser *cannot* do: change an O(n²) algorithm to O(n log n), remove an allocation you asked for, reorder your struct's members, or fix a column-major loop. Those remain yours — and they are where the time goes.

## Key takeaways

- `-O2` inlines, folds, eliminates dead code and vectorises under the as-if rule: only observable behaviour is preserved.
- `inline` is about linkage; the optimiser decides inlining by heuristics, and inlining is what makes constant propagation possible.
- `constexpr` turns "may fold" into "must fold" where a constant is required; `consteval` forbids run-time evaluation.
- Dead-code elimination deletes anything whose result is unobserved — including the benchmark loop that never prints.
- Micro-tricks the compiler already does are wasted; algorithms, allocations, layout and loop order are yours.

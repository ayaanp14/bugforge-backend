---
title: Measuring — timeit, perf_counter, cProfile, tracemalloc and benchmarking hygiene
minutes: 14
---
Performance work without measurement is guessing, and most guesses about where a program spends its time are wrong. Python ships the tools to find out: `time.perf_counter` for a stopwatch, `timeit` for micro-benchmarks that handle repetition and noise, `cProfile` with `pstats` to attribute time to functions, and `tracemalloc` to attribute memory to lines. This lesson covers each, how to read their output, the hygiene that makes a measurement mean something — warm-up, repetition, minimum rather than mean, isolating the thing measured — and the discipline of profiling before optimising and stopping when the numbers say so.

## perf_counter: the stopwatch

```python
from time import perf_counter

start = perf_counter()
result = work()
elapsed = perf_counter() - start        # seconds, as a float, monotonic, high resolution
print(f"work took {elapsed:.3f}s")
```

`perf_counter` is the clock for measuring durations (monotonic, fractional seconds, not affected by system clock changes); `time.time()` is wall-clock and can jump; `process_time` counts CPU time only. A small context manager wrapping this is the standard tool for timing phases of a real program:

```python
from contextlib import contextmanager

@contextmanager
def timed(label, clock=perf_counter, report=print):
    start = clock()
    yield
    report(f"{label} {clock() - start:.3f}s")
```

Injecting the clock and the reporter is what makes it testable: a test passes a fake clock returning a scripted sequence and asserts on the labels and durations without any real time passing — the design from Module 18.

## timeit: micro-benchmarks done right

```bash
python -m timeit -s "xs = list(range(1000))" "sum(xs)"
# 5000 loops, best of 5: 4.1 usec per loop
python -m timeit -s "xs = list(range(1000))" "total = 0" "for x in xs: total += x"
# 5000 loops, best of 5: 28 usec per loop
```

```python
import timeit
timeit.timeit("sum(xs)", setup="xs = list(range(1000))", number=10_000)     # total seconds
min(timeit.repeat("sum(xs)", setup=..., number=10_000, repeat=5))           # the number to report
```

`timeit` disables garbage collection, runs the statement `number` times, repeats that `repeat` times and reports the *best* — the minimum is the right statistic for a benchmark, because noise only ever adds time. Setup code (building the data) is excluded. Compare alternatives on the same machine in the same session, at the same input size, and with a size large enough that the per-call overhead is not what you are measuring.

## cProfile: where the time goes

```bash
python -m cProfile -s cumulative app.py | head -20
```

```text
         2003 function calls in 1.204 seconds
   Ordered by: cumulative time
   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
        1    0.001    0.001    1.204    1.204 app.py:30(main)
     1000    0.902    0.001    1.150    0.001 app.py:12(parse)
     1000    0.248    0.000    0.248    0.000 app.py:5(tokenize)
```

`ncalls` is how often the function ran; `tottime` is time inside it *excluding* callees; `cumtime` includes callees; `percall` divides each. Sort by `tottime` to find the function doing the work, by `cumtime` to find the path that leads there. In code: `cProfile.Profile()` as a context manager, then `pstats.Stats(profile).sort_stats("tottime").print_stats(10)`. The profiler adds overhead (roughly 2×) that is uneven across call-heavy code, so use it to find the hot spot and `timeit` to compare fixes. Line-level profilers (`line_profiler`) and sampling profilers (`py-spy`, which attaches to a running process with no code changes) are the third-party next steps; `python -X importtime` profiles import time specifically.

## tracemalloc: where the memory goes

```python
import tracemalloc
tracemalloc.start()
before = tracemalloc.take_snapshot()
build()
after = tracemalloc.take_snapshot()
for stat in after.compare_to(before, "lineno")[:5]:
    print(stat)                      # file:line: size=…, count=…, average=…
current, peak = tracemalloc.get_traced_memory()
```

`tracemalloc` records every allocation with its call site; comparing two snapshots shows which lines allocated the growth. `get_traced_memory` gives the current and peak — the peak is what decides whether a program fits its limit. It slows the program and itself uses memory; run it once to find the culprit, then remove it.

## Hygiene

- **Warm up.** The first run pays for imports, `.pyc` compilation, cache filling and the 3.11 specialiser; measure the second run onward.
- **Repeat and take the minimum** for micro-benchmarks; for whole programs, several runs and the median.
- **Isolate.** Time the computation, not the `print`, not the input parsing, not the file open — unless those are the question.
- **Same conditions.** Same machine, same Python, same data, nothing else running; a laptop on battery throttles.
- **Realistic size.** Constant factors dominate small inputs; asymptotics dominate large ones; measure at the size that matters.
- **Hypothesis first.** "parse is 75 % of the time" is a claim the profile confirms or refutes before any code changes.
- **Stop.** When the target is met or the remaining hot spot is essential work, stop; every optimisation costs clarity.

## Amdahl's rule

If a phase is 75 % of the run time, making it infinitely fast gains at most 4×; making a 5 % phase infinitely fast gains 5 %. Optimise the largest slice first, re-profile, repeat — the largest slice changes after each fix. This single division is the difference between a productive afternoon and a wasted one.

## Pitfalls

- `time.time()` for durations.
- Reporting the mean of a noisy benchmark instead of the minimum.
- Timing code that includes I/O or the profiler's own overhead.
- Optimising the function that *looks* slow without profiling.
- Measuring at n = 10 and extrapolating to n = 10⁷.
- Printing measured times from a program whose output must be reproducible — report computed quantities instead.

## Key takeaways

- `perf_counter` for durations, wrapped in a context manager with an injectable clock; `timeit` for micro-benchmarks with `repeat` and the minimum.
- `cProfile` attributes time to functions: `tottime` finds the worker, `cumtime` the path; `pstats` sorts and prints.
- `tracemalloc` snapshots attribute memory growth to lines and report the peak.
- Warm up, repeat, isolate, fix conditions and sizes, form a hypothesis, stop when done.
- Amdahl: optimise the largest slice; re-profile after each change.

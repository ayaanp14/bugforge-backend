---
title: Measuring — clocks, benchmarks that lie and the tools that tell the truth
minutes: 14
---
Everything in this module so far has been a model: count the copies, count the lines, count the branch misses. Models rank alternatives; only a measurement says how much time an alternative costs, and measurements of small pieces of code are wrong more often than right — the optimiser deleted the work, the input was a compile-time constant, the first run paid for page faults the others did not, the laptop changed clock speed halfway through. This lesson settles how to take a time that means something with `std::chrono::steady_clock`, why the judge never asserts on one, the pitfalls that make a microbenchmark lie, which statistic to report, and the tools that find where the time goes: `perf`, Valgrind, the sanitizers and `-fanalyzer`.

## Taking a time

```cpp
#include <chrono>
#include <iostream>

int main() {
    const auto start = std::chrono::steady_clock::now();
    long long total = 0;
    for (int i = 0; i < 10'000'000; ++i) total += i % 7;
    const auto end = std::chrono::steady_clock::now();
    const auto us = std::chrono::duration_cast<std::chrono::microseconds>(end - start);
    std::cout << "total=" << total << '\n';                     // the sink: total is observed
    std::cerr << "elapsed " << us.count() << " us\n";           // the timing: stderr, not judged
    return 0;
}
```

`steady_clock` is monotonic — it never goes backwards or jumps when the system time is adjusted — which is the property a duration needs. `system_clock` is wall-clock time for timestamps, not for intervals; `high_resolution_clock` is an alias for one of the other two and is best avoided by name. Subtracting two `time_point`s gives a `duration`; `duration_cast` converts to the unit you want and `.count()` gives the number (Module 16, lesson 4).

Two things about that snippet matter for the judge. The result goes to `stdout` and the time to `stderr`: only `stdout` is compared, and no expected output in this track contains a duration. The judge runs on a shared machine with a 5 s CPU ceiling, and a program that took 40 ms on one run may take 90 ms on the next with no change; a case that asserted "under 50 ms" would be a coin toss. Time limits are a ceiling against runaway loops, never a measurement.

## Six ways a microbenchmark lies

1. **The work was deleted.** The result of the loop is never used, so dead-code elimination removes the loop (lesson 4) and the benchmark reports the cost of two clock reads. *Fix:* make the result observable — accumulate into a value that is printed, or write it to a `volatile` sink, or use a library's `DoNotOptimize`.
2. **The input was a constant.** The compiler saw `fib(30)` with a literal argument and computed it at compile time. *Fix:* read the input from `stdin` or a `volatile`, so its value is unknown until run time.
3. **No warm-up.** The first iterations pay for page faults on freshly allocated memory, cold caches and the CPU raising its frequency; a single run measures those, not the code. *Fix:* run several times and discard the first.
4. **The timer's resolution.** A microsecond clock cannot time a ten-nanosecond operation. *Fix:* time a loop of millions of iterations and divide.
5. **The machine was busy.** Another process, a background update, thermal throttling. *Fix:* repeat, and report the **minimum** or the **median** rather than one run or the mean.
6. **Measuring the wrong build.** `-O0` measures a program the compiler never optimised; `-O2` with the sanitizers on measures the instrumentation. *Fix:* benchmark the flags you ship.

A benchmark that survives all six is a library's job — Google Benchmark handles warm-up, repetition, statistics and the sink — but a hand-rolled harness with a sink, a warm-up and a median is enough to rank two implementations.

## Which number to report

The runs of a benchmark are not normally distributed: there is a floor set by the code and a long tail of interruptions above it. The **minimum** is the best estimate of what the code itself costs; the **median** is what a typical run costs; the **mean** is dragged upward by every interruption and is the least informative of the three. Report the number of samples and the spread — `(max − min) / min` — so a reader can see whether the measurement is stable at all, and never compare two implementations measured on different machines. The exercise's summariser applies exactly these rules to samples that arrive as input.

## Complexity against constant factors

Big-O ranks algorithms as *n* grows; at the sizes real loops see, the constant factors decide. Binary search over eight sorted elements is slower than a linear scan: the scan touches one cache line and its branch is perfectly predicted, while the search's three probes each mispredict about half the time. `std::sort` knows this — libstdc++'s introsort switches to insertion sort below sixteen elements. A `std::map` with fifty entries loses to a sorted `std::vector` with `std::lower_bound`; a `std::unordered_map` with ten entries loses to a linear scan of a vector of pairs. The operation counter in this lesson's first exercise makes the trade visible: linear search costs *n* comparisons in the worst case and binary search about log₂ *n*, and the ratio between them at *n* = 8 is not the ratio at *n* = 8 000 000.

## The tools

| Tool | What it tells you |
| --- | --- |
| `time ./a.out` | Real, user and system seconds for the whole run — the first measurement, before anything else |
| `perf stat -e cycles,instructions,cache-misses,branch-misses ./a.out` | Hardware counters: instructions per cycle, misses per instruction |
| `perf record ./a.out` then `perf report` | Which functions the time went to, sampled |
| `valgrind --tool=callgrind` | Exact instruction counts per function, slowly; `kcachegrind` draws the call graph |
| `valgrind --tool=cachegrind` | A simulated cache: misses per line of source |
| `-fsanitize=address,undefined` | Memory errors and undefined behaviour at run time, ~2× slower |
| `-fsanitize=thread` | Data races, ~5–15× slower (Module 17) |
| `-fanalyzer` (GCC) | Static analysis at compile time: leaks, null dereferences, double frees along paths |
| `clang-tidy` | Style and correctness checks, including performance ones (`performance-*`) |

The order matters. `time` says whether there is a problem. A profiler says *where* — and it is almost never where intuition pointed, which is the whole reason to profile before optimising. A sanitizer says whether the fast version is still correct. Amdahl's rule bounds the reward: a function that takes 10 % of the run cannot be optimised into more than a 10 % improvement.

## The loop

Measure the whole program. Profile to find the hottest function. Form a hypothesis from the models in this module — an allocation in a loop, a copy where a reference would do, a column-major traversal, a branch on unsorted data, an O(n²) where a sort would give O(n log n). Change one thing. Measure again with the same harness, and keep the change only if the median moved by more than the spread. Run the sanitizers on the result. Then profile again, because the hottest function has moved.

## Pitfalls

| Written | What was measured |
| --- | --- |
| A loop whose result is never printed | Nothing — the loop was eliminated |
| `benchmark(fib(30))` with a literal | A compile-time constant |
| One run, reported as the mean | The page faults and the frequency ramp |
| `system_clock` for a duration | A clock that can jump backwards |
| Timing at `-O0` | A program nobody ships |
| An expected output with a time in it | A coin toss on the judge |

## Key takeaways

- `std::chrono::steady_clock::now()` twice, subtract, `duration_cast`: the only correct way to take an interval, and it goes to `stderr`, never into a judged output.
- A microbenchmark must sink its result, take an unknown input, warm up, repeat, and measure the flags you ship.
- Report the minimum or median with the sample count and spread; the mean hides the tail.
- Constant factors beat complexity at small *n*: a scan over one cache line beats a binary search that mispredicts.
- `time`, then `perf`, then change one thing, then the sanitizers — and the hot spot is never where you guessed.

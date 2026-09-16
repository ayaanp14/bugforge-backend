---
title: Measure first — benchmarks that lie, profiles that do not, and reading the numbers
minutes: 13
---
Almost every performance change made without measuring makes the code worse in some way — less readable, more fragile, or actually slower — because intuition about JIT-compiled code is unreliable and the bottleneck is rarely where it feels. The discipline is simple to state: **profile to find the hot spot, benchmark to compare alternatives, measure in production to confirm**. Each step has traps: benchmarks that time the wrong thing (JIT warm-up, dead-code elimination, GC pauses), profiles read at the wrong level, and summary numbers (averages) that hide the users who suffer. This lesson covers the tools — `performance.now`, `console.time`, `--cpu-prof`, DevTools, flame charts — and the statistics you need to trust a result: warm-up, repetitions, medians and percentiles, variance, and what "significant" means.

## Timing correctly

```js
const t0 = performance.now();            // monotonic, sub-millisecond; global in Node 16+ and browsers
work();
const ms = performance.now() - t0;
process.hrtime.bigint();                 // nanoseconds, for very short spans
console.time("parse"); parse(); console.timeEnd("parse");   // quick and dirty
```

`Date.now()` is wall-clock and coarse; never use it for durations. `performance.mark`/`measure` label spans that DevTools and `PerformanceObserver` can display. In browsers, `performance.now()` is coarsened (to ~100 µs, or 5 µs with cross-origin isolation) for security — fine for anything you can see, useless for nanosecond claims.

## Why naive benchmarks lie

```js
const t0 = performance.now();
for (let i = 0; i < 1e6; i++) add(i, 1);       // what did this measure?
```

1. **JIT warm-up**: the first thousands of iterations run interpreted, then get optimised mid-loop — the total mixes tiers. Warm the code before timing, then time a separate run.
2. **Dead-code elimination**: `add(i, 1)`'s result is unused; the optimiser may remove the call entirely and you time an empty loop. Consume results (accumulate and print them).
3. **Constant folding and inlining**: a benchmark with literal inputs lets the compiler precompute answers a real workload would not. Feed data from outside the function (an array built at runtime).
4. **GC pauses**: an allocation-heavy loop pays for collections at unpredictable moments — a single run's time is noise. Repeat and look at the distribution.
5. **Micro-benchmarks measure micro-effects**: a 2× difference on a 5 ns operation is irrelevant next to one database call. Benchmark the operation at the granularity that matters.
6. **Machine noise**: turbo boost, other processes, thermal throttling. Run several times, interleave the alternatives, and compare distributions, not single numbers.

Tools that handle this for you: **Benchmark.js**/**tinybench**/**mitata** (warm-up, many samples, statistics), Node's `--allow-natives-syntax` with `%OptimizeFunctionOnNextCall` for controlled experiments, and `deno bench`/`bun bench`. Write the harness yourself once to see what they do; then use one.

## Reading a distribution

Report the **median** (p50) and a high percentile (p95/p99), not the mean — a few slow runs (GC, page faults) drag the mean up and hide the typical case; a few fast ones hide the tail that users notice. Report the **spread** (standard deviation, or min/max, or an interquartile range). Two alternatives are distinguishable only when their distributions barely overlap: a 3% difference with 10% run-to-run variance is noise. Discard the first samples (warm-up), use enough repetitions that the median stabilises, and be suspicious of any result you cannot reproduce twice.

## Profiling: find the hot spot

Benchmarks compare alternatives *you already suspect*. A **profiler** tells you where time actually goes:

- **Node**: `node --cpu-prof app.js` writes a `.cpuprofile` to open in Chrome DevTools (Performance panel → load) or `speedscope`; `--prof` + `--prof-process` gives a text tick summary; `--inspect` attaches DevTools live. `clinic flame` builds flame graphs from a running process.
- **Browser**: DevTools → Performance → record → the flame chart (time on the x-axis, call depth on the y-axis: a wide bar is where time goes; a tall narrow stack is recursion) plus the bottom-up table (self time per function). Long tasks over 50 ms are the input-blocking culprits.
- **Sampling** (what these do) runs the program at full speed and samples the stack every ~1 ms — cheap and honest; **instrumentation** (timers around every function) is exact but distorts.

Read a profile top-down for structure and bottom-up for self time. The usual finding: one or two functions account for most of the time, and they are not the ones you guessed. Optimise those; leave the rest alone.

## Complexity before constants

Before any micro-work, check the **algorithm**: a linear scan inside a loop (`includes` per item — O(n²)), a repeated `Object.keys` in a hot loop, sorting inside a comparator, re-rendering everything for one change, an N+1 query. Big-O differences swamp every JIT effect: replacing an O(n²) with O(n) on 10 000 items is a 10 000× change; the fastest possible O(n²) is still O(n²). Estimate complexity by measuring operation counts at two or three input sizes — if doubling n quadruples the work, no amount of shape stability will save you.

## Measuring in production

Laboratory numbers do not survive contact with real hardware, networks and data. **Real-user monitoring** (RUM) — `PerformanceObserver` for Core Web Vitals in browsers, request timings and event-loop lag in servers, exported to your metrics system — shows the distribution users actually experience. Track **percentiles per endpoint/route**, watch for regressions per deploy, and alert on the tail (p99), which is where timeouts and retries live. This repository's telemetry writes route timings for exactly this reason.

## The loop

1. Set a target (a budget: "p95 under 200 ms", "60 fps while scrolling").
2. Profile to find the hot spot.
3. Fix the algorithm first, then the constants.
4. Benchmark the change against the original, warmed and repeated.
5. Ship, measure in production, keep or revert.

Optimisations without a measured before/after are guesses, and guesses that complicate code should be reverted.

## Common mistakes

- Timing with `Date.now()`; single runs; means instead of medians.
- Benchmarks whose results are unused (eliminated), with literal inputs (folded), or without warm-up (mixed tiers).
- Micro-optimising a function that takes 0.1% of the profile.
- Comparing alternatives on different machines/runs without interleaving.
- Optimising for lab hardware and never measuring in production.
- Keeping a "faster" version that measurably is not.

## Interview angle

- *"How would you find why a Node service is slow?"* Profile it (`--cpu-prof`/`--inspect`), read the flame chart for self time, check event-loop lag and per-route percentiles, fix the algorithmic hot spot, re-measure.
- *"Why do micro-benchmarks mislead?"* JIT warm-up, dead-code elimination, constant folding, GC noise, and measuring effects too small to matter.
- *"Mean or median?"* Median plus a high percentile; means hide both the typical case and the tail.
- *"What is a flame chart?"* Sampled call stacks over time: width is time spent, depth is call nesting; wide bars are hot spots.
- *"What do you optimise first?"* The algorithm (Big-O), then allocation and shape stability in the measured hot spot.

## Key takeaways

- `performance.now()`/`hrtime` for durations; `Date.now()` never.
- Benchmarks need warm-up, many samples, consumed results, runtime inputs and interleaving; use a harness.
- Report p50 and p95/p99 with spread; overlapping distributions mean no difference.
- Profile (`--cpu-prof`, DevTools flame charts) to find the hot spot; fix complexity before constants.
- Measure in production per route/percentile; every optimisation has a before and an after or it is a guess.

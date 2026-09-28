---
title: Checkpoint — Performance and memory
minutes: 24
seo-title: JavaScript Performance Quiz: V8, Memory and Latency Test
description: Test JavaScript performance with 12 questions and three programs on V8 hidden classes, benchmarking, garbage collection, memory leaks and p99 latency.
q: What breaks hidden class sharing in V8?
a: Adding properties in a different order, adding them conditionally or after construction, and `delete` — each gives objects different shapes or drops them into dictionary mode. Initialise every property in the constructor or literal, in the same order, every time.
q: What keeps an object alive in JavaScript?
a: Any path of references from a root — the global object, the current call stack or an engine reference — through properties, closure scopes, array elements, Map and Set entries or prototype links. An object with no such path is garbage and will be collected eventually.
q: What does the width of a bar in a flame chart mean?
a: Width is time: a wide bar is a function, together with everything it called, that ran for a long share of the recording, so the widest bars are the hot spots. Depth shows call nesting, not cost.
---
This checkpoint covers V8's pipeline (interpreter, feedback, optimising compiler, deoptimisation), hidden classes and inline caches, elements kinds; benchmarking pitfalls and statistics, profiling and flame charts, complexity before constants; reachability, the generational collector, the leak catalogue and heap-snapshot diagnosis; the habits that survive measurement; and server-side latency — percentiles, round trips, caching layers, pools, event-loop lag, load testing.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module. The programs model the engine's and the collector's rules rather than timing anything — timings would differ on every machine, and the rules are what you need to reason with.

**Before you start**, make sure you can answer:

- What a hidden class is and what breaks sharing; monomorphic versus megamorphic; how elements kinds transition.
- Why a naive benchmark lies (warm-up, dead code, folding, GC); median versus mean; what a flame chart's width means.
- What keeps an object alive; young versus old generation; the seven leak patterns; how to read a snapshot comparison.
- The complexity table (Set for membership, no `shift` queues, no spread in `reduce`); what to batch; when to use a worker.
- Why p99 matters; the round-trip arithmetic of sequential awaits; cache-aside versus SWR; what event-loop lag indicates.

The programs are a hidden-class and inline-cache simulator that reports shapes and IC states per call site, a generational garbage-collector simulator with promotion and mark-sweep, and a request-trace analyser that computes per-route percentiles, SLO burn and N+1 suspects.
